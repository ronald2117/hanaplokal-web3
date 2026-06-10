import { useEffect } from 'react';
import { usePosts } from '../context/PostsContext';
import { useLocation } from '../context/LocationContext';
import { useMessages } from '../context/MessagesContext';
import { useReports } from '../context/ReportsContext';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../context/NotificationsContext';
import { showBrowserNotification } from '../services/notifications';

export default function NotificationEngine() {
  const { posts, alerts } = usePosts();
  const { getDistanceFromUser } = useLocation();
  const { conversations } = useMessages();
  const { reports } = useReports();
  const { isAdmin, currentUser, isLoggedIn } = useApp();
  const { addNotification } = useNotifications();

  // Price Alert Hit Check
  useEffect(() => {
    if (!currentUser || !isLoggedIn) return;

    const notifiedKey = `hanaplokal_notified_alert_hits_${currentUser.uid}`;
    const notified = new Set<string>(JSON.parse(localStorage.getItem(notifiedKey) ?? '[]') as string[]);

    const sortedPosts = [...posts].sort((a, b) => b.timestamp - a.timestamp);
    let updated = false;

    for (const alert of alerts) {
      if (!alert.active || alert.userId !== currentUser.uid) continue;

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

      const distance = getDistanceFromUser(match.locationCoords);
      const fired = showBrowserNotification(`Price Drop: ${alert.productName}`, {
        body: `${match.storeName} now at ₱${match.price}/${match.unit} (${Math.round(distance * 10) / 10}km away)`,
      });

      if (fired) {
        notified.add(hitId);
        updated = true;
      }

      // Add in-app notification
      void addNotification(currentUser.uid, {
        type: 'price_alert',
        title: 'Price Alert Match!',
        body: `🔔 ${match.productName} is now ₱${match.price}/${match.unit} at ${match.storeName} (${Math.round(distance * 10) / 10}km away)`,
        linkEntityId: match.id,
        linkEntityType: 'post',
      });
    }

    if (updated) {
      localStorage.setItem(notifiedKey, JSON.stringify(Array.from(notified)));
    }
  }, [alerts, getDistanceFromUser, posts, currentUser, isLoggedIn, addNotification]);

  // New Post Nearby Check
  useEffect(() => {
    if (!currentUser || !isLoggedIn) return;

    const notifiedKey = `hanaplokal_notified_nearby_posts_${currentUser.uid}`;
    const notified = new Set<string>(JSON.parse(localStorage.getItem(notifiedKey) ?? '[]') as string[]);
    const now = Date.now();

    // Only look at approved/live posts in the last 2 hours
    const recentPosts = posts.filter(post => {
      return (
        post.userId !== currentUser.uid &&
        now - post.timestamp < 2 * 60 * 60 * 1000 // 2 hours
      );
    });

    let updated = false;

    for (const post of recentPosts) {
      if (notified.has(post.id)) continue;

      const distance = getDistanceFromUser(post.locationCoords);
      if (distance <= 5) { // 5km radius
        // Notify browser
        showBrowserNotification(`New Post Nearby`, {
          body: `📦 ${post.productName} is ₱${post.price}/${post.unit} at ${post.storeName}`,
        });

        // Notify in-app
        void addNotification(currentUser.uid, {
          type: 'new_post_nearby',
          title: 'New Post Nearby',
          body: `📦 ${post.productName} is ₱${post.price}/${post.unit} at ${post.storeName} (${Math.round(distance * 10) / 10}km away)`,
          linkEntityId: post.id,
          linkEntityType: 'post',
        });

        notified.add(post.id);
        updated = true;
      }
    }

    if (updated) {
      localStorage.setItem(notifiedKey, JSON.stringify(Array.from(notified)));
    }
  }, [posts, currentUser, isLoggedIn, getDistanceFromUser, addNotification]);

  // Messages Check
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

  // Admin Reports Check
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
