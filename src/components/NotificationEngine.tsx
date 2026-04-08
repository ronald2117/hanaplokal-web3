import { useEffect } from 'react';
import { usePosts } from '../context/PostsContext';
import { useLocation } from '../context/LocationContext';
import { useMessages } from '../context/MessagesContext';
import { useReports } from '../context/ReportsContext';
import { useApp } from '../context/AppContext';
import { showBrowserNotification } from '../services/notifications';

export default function NotificationEngine() {
  const { posts, alerts } = usePosts();
  const { getDistanceFromUser } = useLocation();
  const { conversations } = useMessages();
  const { reports } = useReports();
  const { isAdmin } = useApp();

  useEffect(() => {
    const notifiedKey = 'hanaplokal_notified_alert_hits';
    const notified = new Set<string>(JSON.parse(localStorage.getItem(notifiedKey) ?? '[]') as string[]);

    const sortedPosts = [...posts].sort((a, b) => b.timestamp - a.timestamp);

    for (const alert of alerts) {
      if (!alert.active) continue;

      const match = sortedPosts.find(post => {
        const distance = getDistanceFromUser(post.locationCoords);
        return (
          post.productName.toLowerCase() === alert.productName.toLowerCase() &&
          post.price <= alert.targetPrice &&
          distance <= alert.radius
        );
      });

      if (!match) continue;

      const hitId = `${alert.id}_${match.id}`;
      if (notified.has(hitId)) continue;

      const fired = showBrowserNotification(`Price Drop: ${alert.productName}`, {
        body: `${match.storeName} now at ₱${match.price}/${match.unit} (${Math.round(getDistanceFromUser(match.locationCoords) * 10) / 10}km away)`,
      });

      if (fired) {
        notified.add(hitId);
      }
    }

    localStorage.setItem(notifiedKey, JSON.stringify(Array.from(notified)));
  }, [alerts, getDistanceFromUser, posts]);

  useEffect(() => {
    const unreadKey = 'hanaplokal_last_unread_count';
    const prevUnread = Number(localStorage.getItem(unreadKey) ?? '0');
    const totalUnread = conversations.reduce((sum, convo) => sum + convo.unreadCount, 0);

    if (totalUnread > prevUnread) {
      showBrowserNotification('New Message', {
        body: `You have ${totalUnread} unread message${totalUnread > 1 ? 's' : ''}.`,
      });
    }

    localStorage.setItem(unreadKey, String(totalUnread));
  }, [conversations]);

  useEffect(() => {
    if (!isAdmin) return;

    const openReports = reports.filter(report => report.status === 'open').length;
    const reportKey = 'hanaplokal_last_open_reports_count';
    const prevCount = Number(localStorage.getItem(reportKey) ?? '0');

    if (openReports > prevCount) {
      showBrowserNotification('New User Report', {
        body: `${openReports} moderation report${openReports > 1 ? 's are' : ' is'} pending review.`,
      });
    }

    localStorage.setItem(reportKey, String(openReports));
  }, [isAdmin, reports]);

  return null;
}
