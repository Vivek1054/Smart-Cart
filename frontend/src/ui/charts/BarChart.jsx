import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// data: [{ label, value }]
const BarChart = ({ data, height = 220, color = '#c1571f', formatValue = (v) => v }) => {
  const reduceMotion = useReducedMotion();
  const max = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const pct = Math.max((d.value / max) * 100, 3);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
              <span className="text-[10px] font-semibold text-ink-800/50 dark:text-white/50 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatValue(d.value)}
              </span>
              <motion.div
                className="w-full rounded-t-md"
                style={{ backgroundColor: color }}
                initial={reduceMotion ? false : { height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.03, ease: 'easeOut' }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-2">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-ink-800/40 dark:text-white/40 truncate">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
