import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const ITEMS = ['🥪', '🍅', '🧀'];

// filledCount: 0-3, how many form fields are completed
const AnimatedBasket = ({ filledCount = 0, success }) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-full max-w-xs mx-auto flex flex-col items-center" aria-hidden="true">
      <div className="relative h-20 mb-1 flex items-end justify-center gap-2">
        <AnimatePresence>
          {ITEMS.slice(0, filledCount).map((emoji, i) => (
            <motion.span
              key={emoji}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -40, rotate: -20 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: i * 0.05 }}
              className="text-3xl"
            >
              {emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <motion.svg
        viewBox="0 0 200 110"
        className="w-40 h-auto drop-shadow-xl"
        animate={success ? { rotate: [0, -3, 3, -2, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <path d="M30 40 L170 40 L155 100 Q150 108 140 108 L60 108 Q50 108 45 100 Z" fill="#c1571f" />
        <path d="M30 40 L170 40 L165 55 L35 55 Z" fill="#a8481a" />
        <path d="M60 40 Q60 10 100 10 Q140 10 140 40" stroke="#853918" strokeWidth="6" fill="none" strokeLinecap="round" />
        {[70, 100, 130].map((x) => (
          <line key={x} x1={x} y1="55" x2={x - 5} y2="100" stroke="#8a3a14" strokeWidth="2" opacity="0.5" />
        ))}
      </motion.svg>

      {success && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.2 }}
          className="absolute -top-4 right-6 flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white text-lg shadow-lift"
        >
          ✓
        </motion.div>
      )}
    </div>
  );
};

export default AnimatedBasket;
