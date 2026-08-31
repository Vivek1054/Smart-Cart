import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaBell } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getCustomerNotifications } from '../data/notifications';

const NotificationBell = () => {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!isAuthenticated) return null;

  const notifications = getCustomerNotifications(user.email).slice(0, 6);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-800/70 dark:text-white/70 hover:bg-ink-800/5 dark:hover:bg-white/10 transition"
      >
        <FaBell size={15} />
        {notifications.length > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white dark:bg-ink-800 shadow-lift border border-ink-800/5 dark:border-white/10 overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-ink-800/5 dark:border-white/10 font-semibold text-sm text-ink-900 dark:text-white">
              Notifications
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-800/50 dark:text-white/50">You're all caught up.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-cream-50 dark:hover:bg-white/5 transition border-b border-ink-800/5 dark:border-white/5 last:border-0">
                    <span className="text-lg shrink-0">{n.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-ink-900 dark:text-white">{n.message}</p>
                      <p className="text-xs text-ink-800/40 dark:text-white/40 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
