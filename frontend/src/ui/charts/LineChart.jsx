import React, { useId, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// data: [{ label, value }]
const LineChart = ({ data, height = 220, color = '#c1571f', formatValue = (v) => v }) => {
  const gradId = useId();
  const reduceMotion = useReducedMotion();
  const width = 600;
  const padding = 10;

  const { points, path, areaPath } = useMemo(() => {
    const values = data.map((d) => d.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const step = (width - padding * 2) / Math.max(data.length - 1, 1);

    const pts = data.map((d, i) => {
      const x = padding + i * step;
      const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
      return { x, y, ...d };
    });

    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${path} L ${pts[pts.length - 1]?.x || 0} ${height - padding} L ${pts[0]?.x || 0} ${height - padding} Z`;

    return { points: pts, path, areaPath, max, min };
  }, [data, height]);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaPath}
          fill={`url(#${gradId})`}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} className="opacity-0 hover:opacity-100 transition-opacity">
            <title>{`${p.label}: ${formatValue(p.value)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between mt-2 text-[11px] text-ink-800/40 dark:text-white/40">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
};

export default LineChart;
