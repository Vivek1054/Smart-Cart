import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

// side: 'left' | 'right' | 'bottom'
const VARIANTS = {
  left: {
    initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' },
    className: 'inset-y-0 left-0 h-full w-[86%] max-w-sm',
  },
  right: {
    initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' },
    className: 'inset-y-0 right-0 h-full w-[90%] max-w-md',
  },
  bottom: {
    initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' },
    className: 'inset-x-0 bottom-0 max-h-[88vh] w-full rounded-t-3xl',
  },
};

const Drawer = ({ open, onClose, side = 'right', title, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const v = VARIANTS[side];

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={v.initial}
            animate={v.animate}
            exit={v.exit}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={`absolute ${v.className} bg-white dark:bg-ink-800 shadow-lift flex flex-col`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800/10 dark:border-white/10 shrink-0">
              <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-ink-800/50 dark:text-white/50 hover:text-ink-900 dark:hover:text-white transition p-1"
              >
                <FaTimes />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Drawer;
