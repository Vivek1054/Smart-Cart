import React from 'react';
import { motion } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';

const VARIANTS = {
  primary: 'bg-ink-900 dark:bg-brand-500 text-white hover:bg-brand-600 dark:hover:bg-brand-400 shadow-soft',
  outline: 'border-2 border-ink-900/15 dark:border-white/20 text-ink-900 dark:text-white hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300',
  ghost: 'text-ink-800/70 dark:text-white/70 hover:bg-ink-800/5 dark:hover:bg-white/10',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

const Button = React.forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <FaSpinner className="animate-spin" size={14} />}
      {children}
    </motion.button>
  );
});

export default Button;
