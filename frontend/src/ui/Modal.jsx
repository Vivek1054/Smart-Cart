import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ open, onClose, title, children, className = '' }) => {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className={`relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-ink-800 shadow-lift max-h-[85vh] overflow-y-auto ${className}`}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink-800/10 dark:border-white/10 sticky top-0 bg-white dark:bg-ink-800">
                <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">{title}</h3>
                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="text-ink-800/50 dark:text-white/50 hover:text-ink-900 dark:hover:text-white transition"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
