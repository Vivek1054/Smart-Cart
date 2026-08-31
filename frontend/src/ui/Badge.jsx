import React from 'react';

const TONES = {
  neutral: 'bg-white/90 dark:bg-ink-900/90 text-ink-900 dark:text-white',
  brand: 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300',
  success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  danger: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300',
  dark: 'bg-ink-900 text-white dark:bg-white dark:text-ink-900',
};

const Badge = ({ tone = 'neutral', className = '', children }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur ${TONES[tone]} ${className}`}>
    {children}
  </span>
);

export default Badge;
