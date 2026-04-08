import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  createReport as createReportRemote,
  subscribeToReports,
  updateReportStatus as updateReportStatusRemote,
  type ModerationReport,
} from '../services/firestore';
import { isFirebaseConfigured } from '../lib/firebase';

interface ReportsContextType {
  reports: ModerationReport[];
  createReport: (payload: {
    entityType: 'post' | 'store';
    entityId: string;
    entityLabel: string;
    reason: string;
    details?: string;
  }) => boolean;
  updateReportStatus: (reportId: string, status: ModerationReport['status']) => void;
}

const ReportsContext = createContext<ReportsContextType | null>(null);

interface ReportsProviderProps {
  children: ReactNode;
  isLoggedIn: boolean;
  currentUser: User | null;
  onAuthRequired: () => void;
}

export function ReportsProvider({ children, isLoggedIn, currentUser, onAuthRequired }: ReportsProviderProps) {
  const [reports, setReports] = useState<ModerationReport[]>([]);

  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsub = subscribeToReports(setReports);
      return () => {
        if (unsub) unsub();
      };
    }

    try {
      const raw = localStorage.getItem('hanaplokal_reports');
      if (raw) {
        setReports(JSON.parse(raw) as ModerationReport[]);
      }
    } catch {
      setReports([]);
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (isFirebaseConfigured) return;
    localStorage.setItem('hanaplokal_reports', JSON.stringify(reports));
  }, [reports]);

  const createReport = useCallback((payload: {
    entityType: 'post' | 'store';
    entityId: string;
    entityLabel: string;
    reason: string;
    details?: string;
  }): boolean => {
    if (!isLoggedIn) {
      onAuthRequired();
      return false;
    }

    const trimmedReason = payload.reason.trim();
    if (!trimmedReason) return true;

    const newReport: ModerationReport = {
      id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      entityType: payload.entityType,
      entityId: payload.entityId,
      entityLabel: payload.entityLabel,
      reason: trimmedReason,
      details: payload.details?.trim() ?? '',
      status: 'open',
      reporterId: currentUser?.uid ?? 'current_user',
      reporterName: currentUser?.displayName ?? 'Community Member',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setReports(prev => [newReport, ...prev]);

    if (isFirebaseConfigured) {
      void createReportRemote({
        entityType: newReport.entityType,
        entityId: newReport.entityId,
        entityLabel: newReport.entityLabel,
        reason: newReport.reason,
        details: newReport.details,
        status: newReport.status,
        reporterId: newReport.reporterId,
        reporterName: newReport.reporterName,
      });
    }

    return true;
  }, [currentUser, isLoggedIn, onAuthRequired]);

  const updateReportStatus = useCallback((reportId: string, status: ModerationReport['status']) => {
    setReports(prev =>
      prev.map(item =>
        item.id === reportId ? { ...item, status, updatedAt: Date.now() } : item
      )
    );

    if (isFirebaseConfigured) {
      void updateReportStatusRemote(reportId, status);
    }
  }, []);

  return (
    <ReportsContext.Provider value={{ reports, createReport, updateReportStatus }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsProvider');
  return ctx;
}
