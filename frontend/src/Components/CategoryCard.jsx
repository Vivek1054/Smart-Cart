import React from 'react';
import { Link } from 'react-router-dom';

const EMOJI = {
  'under 40 rupee': '🥪',
  'premium sandwiches': '🍔',
  'egg specials': '🍳',
  'vegetarian specials': '🥗',
  'non-veg specials': '🍗',
};

const CategoryCard = ({ category, count }) => (
  <Link
    to={`/menu?category=${encodeURIComponent(category)}`}
    className="group flex flex-col items-center gap-3 rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all duration-300 p-6 text-center"
  >
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-3xl group-hover:scale-110 transition-transform duration-300">
      {EMOJI[category] || '🍽️'}
    </span>
    <div>
      <p className="font-display font-semibold text-ink-900 dark:text-white capitalize">{category}</p>
      <p className="text-xs text-ink-800/50 dark:text-white/50 mt-0.5">{count} items</p>
    </div>
  </Link>
);

export default CategoryCard;
