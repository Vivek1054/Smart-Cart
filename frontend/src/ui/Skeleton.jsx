import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-ink-800/5 dark:bg-white/10 ${className}`} />
);

export const ProductCardSkeleton = () => (
  <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 overflow-hidden">
    <Skeleton className="aspect-[4/3] rounded-none" />
    <div className="p-4 space-y-2.5">
      <Skeleton className="h-3 w-16 rounded-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
    </div>
  </div>
);
