import React from 'react';
import { motion } from 'framer-motion';
import { getAdminNotifications } from '../../data/notifications';
import { useAsync } from '../../hooks/useAsync';
import AsyncBoundary from '../../ui/AsyncBoundary';

const Notifications = () => {
  const state = useAsync(getAdminNotifications, []);
  return <AsyncBoundary state={state}>{(notifications) => <NotificationList notifications={notifications} />}</AsyncBoundary>;
};

const NotificationList = ({ notifications }) => {
  if (notifications.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-7xl mb-4">🔔</p>
        <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white mb-1">No notifications yet</h2>
        <p className="text-ink-800/60 dark:text-white/60 max-w-sm">
          You're all caught up. New orders, reviews and alerts will show up here.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-900 dark:text-white">Notifications</h1>
        <p className="text-sm text-ink-800/60 dark:text-white/60 mt-1">
          Recent activity across orders, stock and customers.
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
            className="flex items-start gap-4 rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-4"
          >
            <span className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-lg shrink-0">
              {n.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-ink-900 dark:text-white">{n.message}</p>
              <p className="text-xs text-ink-800/40 dark:text-white/40 mt-1">{n.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Notifications;
