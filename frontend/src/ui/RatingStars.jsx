import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const RatingStars = ({ rating = 0, size = 12, showValue = false, reviewCount, className = '' }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5 text-amber-400" aria-hidden="true">
        {Array.from({ length: full }).map((_, i) => <FaStar key={`f${i}`} size={size} />)}
        {half && <FaStarHalfAlt size={size} />}
        {Array.from({ length: Math.max(0, empty) }).map((_, i) => <FaRegStar key={`e${i}`} size={size} />)}
      </div>
      <span className="sr-only">{rating} out of 5 stars</span>
      {showValue && <span className="text-xs font-semibold text-ink-800/70 dark:text-white/70">{rating}</span>}
      {typeof reviewCount === 'number' && (
        <span className="text-xs text-ink-800/50 dark:text-white/50">({reviewCount})</span>
      )}
    </div>
  );
};

export default RatingStars;
