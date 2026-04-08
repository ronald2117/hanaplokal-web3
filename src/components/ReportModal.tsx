import { useMemo, useState } from 'react';
import { AlertTriangle, Flag, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useReports } from '../context/ReportsContext';

const postReasons = [
  'Wrong price',
  'Misleading photo or details',
  'Spam or fake post',
  'Offensive content',
  'Duplicate report',
];

const storeReasons = [
  'Wrong store location',
  'Store does not exist',
  'Misleading store details',
  'Spam store listing',
  'Offensive content',
];

export default function ReportModal() {
  const { showReportModal, closeReportModal } = useApp();
  const { createReport } = useReports();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const reasons = useMemo(
    () => (showReportModal?.type === 'store' ? storeReasons : postReasons),
    [showReportModal?.type]
  );

  if (!showReportModal) return null;

  const handleSubmit = () => {
    const ok = createReport({
      entityType: showReportModal.type,
      entityId: showReportModal.id,
      entityLabel: showReportModal.label,
      reason,
      details,
    });

    if (!ok) return;

    setReason('');
    setDetails('');
    closeReportModal();
  };

  return (
    <div className="fixed inset-0 z-[98] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeReportModal} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up p-5 pb-8">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <button
          onClick={closeReportModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div className="flex items-start gap-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Report {showReportModal.type === 'store' ? 'Store' : 'Post'}</h3>
            <p className="text-sm text-gray-500">{showReportModal.label}</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Reason</p>
        <div className="grid grid-cols-1 gap-2 mb-4">
          {reasons.map(item => (
            <button
              key={item}
              onClick={() => setReason(item)}
              className={`text-left px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                reason === item
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Additional Details (Optional)</p>
        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder="Add context to help moderators review quickly"
          className="w-full h-24 rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
        />

        <button
          onClick={handleSubmit}
          disabled={!reason}
          className="w-full mt-4 py-3.5 rounded-2xl font-semibold text-white bg-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <Flag className="w-4 h-4" />
          Submit Report
        </button>
      </div>
    </div>
  );
}
