import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTag, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { getActiveCoupons } from '../data/coupons';

const CouponInput = () => {
  const { coupon, couponDiscount, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = getActiveCoupons().slice(0, 3);

  const handleApply = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    const result = applyCoupon(code);
    if (!result.ok) {
      setError(result.error);
    } else {
      setError('');
      setCode('');
    }
  };

  if (coupon) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 px-4 py-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <FaCheckCircle className="text-green-600 dark:text-green-400 shrink-0" size={14} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300 truncate">{coupon.code} applied</p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70">You saved ₹{couponDiscount}</p>
          </div>
        </div>
        <button onClick={removeCoupon} aria-label="Remove coupon" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition shrink-0">
          <FaTimes size={13} />
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <form onSubmit={handleApply} className="flex items-center gap-2">
        <label className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200 dark:focus-within:ring-brand-900 transition">
          <FaTag className="text-ink-800/40 dark:text-white/40 shrink-0" size={12} />
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Enter coupon code"
            className="w-full bg-transparent outline-none text-sm uppercase placeholder:normal-case placeholder:text-ink-800/40 dark:placeholder:text-white/40"
          />
        </label>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-ink-900 dark:bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 dark:hover:bg-brand-400 transition shrink-0"
        >
          Apply
        </button>
      </form>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-xs font-medium text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => { setCode(c.code); setError(''); }}
              className="rounded-full border border-dashed border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-300 text-xs font-semibold px-3 py-1.5 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition"
            >
              {c.code}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CouponInput;
