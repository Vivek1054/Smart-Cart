import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

const KpiCard = ({ icon: Icon, label, value, change, tone = 'brand' }) => {
  const positive = change === undefined || change >= 0;
  const tones = {
    brand: 'bg-brand-50 dark:bg-brand-900/30 text-brand-500',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft hover:shadow-lift transition-shadow p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={16} />
        </span>
        {change !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
            {positive ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="font-display text-2xl font-semibold text-ink-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-sm text-ink-800/50 dark:text-white/50 mt-1">{label}</p>
    </motion.div>
  );
};

export default KpiCard;
