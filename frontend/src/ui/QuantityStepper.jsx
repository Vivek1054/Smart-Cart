import React from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';

const QuantityStepper = ({ value, onChange, min = 1, max = 99, size = 'md' }) => {
  const dims = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div className="inline-flex items-center rounded-full border border-ink-800/10 dark:border-white/15 bg-white dark:bg-white/5 overflow-hidden">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`flex items-center justify-center ${dims} text-ink-800/70 dark:text-white/70 hover:bg-brand-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition`}
      >
        <FaMinus size={10} />
      </button>
      <span className="w-9 text-center font-semibold text-ink-900 dark:text-white tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`flex items-center justify-center ${dims} text-ink-800/70 dark:text-white/70 hover:bg-brand-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition`}
      >
        <FaPlus size={10} />
      </button>
    </div>
  );
};

export default QuantityStepper;
