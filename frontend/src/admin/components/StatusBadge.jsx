import React from 'react';

const GREEN = ['active', 'delivered', 'success', 'approved', 'completed', 'confirmed', 'in stock', 'paid'];
const AMBER = ['pending', 'processing', 'requested', 'low stock'];
const RED = ['cancelled', 'failed', 'rejected', 'blocked', 'hidden', 'out of stock', 'expired'];
const BLUE = ['shipped', 'packed', 'out for delivery', 'refunded'];

const toneFor = (status) => {
  const s = status.toLowerCase();
  if (GREEN.some((k) => s.includes(k))) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
  if (AMBER.some((k) => s.includes(k))) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
  if (RED.some((k) => s.includes(k))) return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300';
  if (BLUE.some((k) => s.includes(k))) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300';
  return 'bg-ink-800/5 dark:bg-white/10 text-ink-800/70 dark:text-white/70';
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${toneFor(status)}`}>
    {status}
  </span>
);

export default StatusBadge;
