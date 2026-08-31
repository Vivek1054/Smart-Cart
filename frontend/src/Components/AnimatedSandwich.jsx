import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const layerVariants = {
  hidden: (custom) => ({ opacity: 0, x: custom.from, rotate: custom.rotate || 0 }),
  visible: { opacity: 1, x: 0, rotate: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

// focus: 'email' | 'password' | null — subtle per-layer reaction while a field is focused
// success: plays a little settle/bounce reaction
const AnimatedSandwich = ({ focus, success }) => {
  const reduceMotion = useReducedMotion();

  const layers = [
    { id: 'bottom', from: -60, y: 108, h: 16, w: 220, x: 40, fill: '#e0a856', rx: 8 },
    { id: 'lettuce', from: 60, y: 98, h: 14, w: 228, x: 36, fill: '#7a9c4f', rx: 6 },
    { id: 'tomato', from: -60, y: 88, h: 12, w: 210, x: 45, fill: '#d9503f', rx: 5 },
    { id: 'cheese', from: 60, y: 76, h: 14, w: 224, x: 38, fill: '#f2c94c', rx: 5 },
    { id: 'patty', from: -60, y: 62, h: 16, w: 216, x: 42, fill: '#8a5a3b', rx: 6 },
    { id: 'top', from: 60, y: 38, h: 26, w: 232, x: 34, fill: '#e8b768', rx: 20 },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.12, delayChildren: 0.1 } },
  };

  const focusOffset = { email: -3, password: 3 }[focus] || 0;

  return (
    <div className="relative w-full max-w-xs mx-auto" aria-hidden="true">
      <motion.svg
        viewBox="0 0 300 160"
        className="w-full h-auto drop-shadow-xl"
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={containerVariants}
      >
        {layers.map((l) => (
          <motion.rect
            key={l.id}
            custom={{ from: reduceMotion ? 0 : l.from }}
            variants={layerVariants}
            x={l.x}
            y={l.y}
            width={l.w}
            height={l.h}
            rx={l.rx}
            fill={l.fill}
            animate={{
              x: l.x + (focus ? focusOffset : 0),
              y: success ? l.y - 4 : l.y,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          />
        ))}
        {/* sesame seeds on top bread */}
        {!reduceMotion && [70, 110, 150, 190, 220].map((cx, i) => (
          <motion.ellipse
            key={i}
            cx={cx}
            cy={44 + (i % 2) * 6}
            rx="3.5"
            ry="2"
            fill="#fff8ea"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 + i * 0.05 }}
          />
        ))}
      </motion.svg>
      {success && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16 }}
          className="absolute -top-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white text-lg shadow-lift"
        >
          ✓
        </motion.div>
      )}
    </div>
  );
};

export default AnimatedSandwich;
