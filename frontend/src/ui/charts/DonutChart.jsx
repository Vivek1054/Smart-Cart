import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// data: [{ label, value, color }]
const DonutChart = ({ data, size = 180, thickness = 24 }) => {
  const reduceMotion = useReducedMotion();
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  const segments = useMemo(() => {
    let offset = 0;
    return data.map((d) => {
      const fraction = d.value / total;
      const seg = { ...d, fraction, offset };
      offset += fraction;
      return seg;
    });
  }, [data, total]);

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90 shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-ink-800/5 dark:text-white/10" strokeWidth={thickness} />
        {segments.map((seg, i) => (
          <motion.circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={circumference}
            strokeLinecap="butt"
            initial={reduceMotion ? false : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - seg.fraction) }}
            style={{ transformOrigin: '50% 50%', rotate: `${seg.offset * 360}deg`, position: 'absolute' }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
          />
        ))}
      </svg>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-ink-800/70 dark:text-white/70">{d.label}</span>
            <span className="font-semibold text-ink-900 dark:text-white ml-auto">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
