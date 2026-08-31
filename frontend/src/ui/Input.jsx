import React, { useId } from 'react';

const Input = React.forwardRef(function Input(
  { label, error, icon, className = '', containerClassName = '', ...props },
  ref
) {
  const id = useId();
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-ink-800/80 dark:text-white/80 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-800/40 dark:text-white/40">
            {icon}
          </span>
        )}
        <input
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full px-4 py-2.5 ${icon ? 'pl-11' : ''} rounded-xl border bg-cream-50 dark:bg-white/5 dark:text-white placeholder:text-ink-800/35 dark:placeholder:text-white/35 transition focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/40'
              : 'border-ink-800/10 dark:border-white/15 focus:border-brand-400 focus:ring-brand-200 dark:focus:ring-brand-900'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-500 animate-fade-up">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
