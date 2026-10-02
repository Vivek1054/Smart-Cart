import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaBars, FaBell, FaMoon, FaSun, FaSignOutAlt } from 'react-icons/fa';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getAdminNotifications } from '../../data/notifications';

const AdminTopbar = ({ onOpenMobileSidebar, title }) => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = () => {
    getAdminNotifications()
      .then((list) => setNotifications(list.slice(0, 6)))
      .catch((e) => console.error('[notifications]', e));
  };
  useEffect(() => { loadNotifications(); }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') { root.classList.add('dark'); document.body.classList.add('dark'); }
    else { root.classList.remove('dark'); document.body.classList.remove('dark'); }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center gap-4 px-4 md:px-6 bg-cream-50/90 dark:bg-ink-900/90 backdrop-blur border-b border-ink-800/5 dark:border-white/10">
      <button onClick={onOpenMobileSidebar} className="lg:hidden text-ink-800/70 dark:text-white/70">
        <FaBars size={16} />
      </button>

      <h1 className="font-display text-lg font-semibold text-ink-900 dark:text-white">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-800/70 dark:text-white/70 hover:bg-ink-800/5 dark:hover:bg-white/10 transition"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
        </button>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => { if (!notifOpen) loadNotifications(); setNotifOpen((v) => !v); }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-800/70 dark:text-white/70 hover:bg-ink-800/5 dark:hover:bg-white/10 transition"
            aria-label="Notifications"
          >
            <FaBell size={14} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500" />
          </button>
          <AnimatePresence>
            {notifOpen && (
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
                  {notifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-cream-50 dark:hover:bg-white/5 transition border-b border-ink-800/5 dark:border-white/5 last:border-0">
                      <span className="text-lg shrink-0">{n.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-ink-900 dark:text-white">{n.message}</p>
                        <p className="text-xs text-ink-800/40 dark:text-white/40 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setNotifOpen(false); navigate('/admin/notifications'); }}
                  className="block w-full text-center py-2.5 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:bg-cream-50 dark:hover:bg-white/5 transition"
                >
                  View All
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={profileRef} className="relative">
          <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-ink-800/5 dark:hover:bg-white/10 transition">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold">
              {admin?.name?.charAt(0) || 'A'}
            </span>
            <span className="hidden sm:block text-sm font-medium text-ink-900 dark:text-white">{admin?.name}</span>
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white dark:bg-ink-800 shadow-lift border border-ink-800/5 dark:border-white/10 p-2 z-50"
              >
                <div className="px-3 py-2 mb-1">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{admin?.name}</p>
                  <p className="text-xs text-ink-800/50 dark:text-white/50">{admin?.role}</p>
                </div>
                <button
                  onClick={() => { logout(); navigate('/admin/login'); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <FaSignOutAlt size={12} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
