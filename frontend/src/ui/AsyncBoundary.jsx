import React from 'react';
import Button from './Button';

// Loading / error / empty wrapper for anything driven by useAsync().
// Same spinner + card styling the app already uses elsewhere.
const AsyncBoundary = ({ state, children, className = 'py-16' }) => {
  if (state.loading && !state.data) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="h-9 w-9 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (state.error) {
    return (
      <div className={`text-center rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-8 ${className}`}>
        <p className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-1">Couldn't load this page</p>
        <p className="text-sm text-ink-800/60 dark:text-white/60 mb-4">{state.error.message || 'Please try again.'}</p>
        <Button size="sm" onClick={state.reload}>Try again</Button>
      </div>
    );
  }
  return children(state.data);
};

export default AsyncBoundary;
