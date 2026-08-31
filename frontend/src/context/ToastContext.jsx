import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const ToastContext = createContext(null);

const ICONS = {
  success: <FaCheckCircle className="text-green-500" />,
  error: <FaExclamationCircle className="text-red-500" />,
  info: <FaInfoCircle className="text-brand-500" />,
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[calc(100%-2.5rem)] max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="flex items-center gap-3 rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-lift px-4 py-3.5"
            >
              <span className="text-lg shrink-0">{ICONS[t.type] || ICONS.info}</span>
              <p className="text-sm font-medium text-ink-900 dark:text-white flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-ink-800/40 dark:text-white/40 hover:text-ink-800 dark:hover:text-white transition shrink-0"
              >
                <FaTimes size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
