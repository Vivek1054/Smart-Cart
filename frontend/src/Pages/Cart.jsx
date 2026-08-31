import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaTrash, FaArrowLeft } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import QuantityStepper from '../ui/QuantityStepper';
import Button from '../ui/Button';
import CouponInput from '../Components/CouponInput';

const Cart = () => {
  const { cartItems, updateQty, removeFromCart, subtotal, savings, deliveryFee, total, couponDiscount } = useCart();
  const { notify } = useToast();
  const navigate = useNavigate();

  const handleRemove = (item) => {
    removeFromCart(item.id);
    notify(`${item.product.name} removed from cart`, 'info', 1800);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-24">
        <p className="text-7xl mb-4">🛒</p>
        <h1 className="font-display text-3xl font-semibold text-ink-900 dark:text-white mb-2">Your cart is empty</h1>
        <p className="text-ink-800/60 dark:text-white/60 max-w-md mb-8">
          Looks like you haven't added anything yet. Let's fix that.
        </p>
        <Link to="/menu"><Button>Browse Menu</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl container mx-auto md:px-20 px-4 pt-28 md:pt-32 pb-16 dark:bg-ink-900 dark:text-white min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 dark:text-white">
          Your Cart <span className="text-brand-500">({cartItems.length})</span>
        </h1>
        <Link to="/menu" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:gap-2.5 transition-all">
          <FaArrowLeft size={12} /> Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence initial={false}>
            {cartItems.map(({ id, qty, product }) => (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-4 rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-4"
              >
                <Link to={`/product/${product.id}`} className="shrink-0">
                  <img src={product.image} alt={product.name} className="h-20 w-20 md:h-24 md:w-24 rounded-xl object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${product.id}`} className="font-display font-semibold text-ink-900 dark:text-white hover:text-brand-500 transition truncate block">
                    {product.name}
                  </Link>
                  <p className="text-xs text-ink-800/50 dark:text-white/50 capitalize mb-2">{product.category}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <QuantityStepper size="sm" value={qty} onChange={(v) => updateQty(id, v)} max={product.stockCount || 10} />
                    <button
                      onClick={() => handleRemove({ id, product })}
                      className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 transition"
                    >
                      <FaTrash size={11} /> Remove
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-semibold text-ink-900 dark:text-white">₹{product.price * qty}</p>
                  {qty > 1 && <p className="text-xs text-ink-800/40 dark:text-white/40">₹{product.price} each</p>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">Order Summary</h2>

            <CouponInput />

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-ink-800/70 dark:text-white/70">
                <span>Subtotal</span>
                <span className="font-medium text-ink-900 dark:text-white">₹{subtotal}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount Savings</span>
                  <span className="font-medium">-₹{savings}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Coupon Discount</span>
                  <span className="font-medium">-₹{couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-800/70 dark:text-white/70">
                <span>Delivery</span>
                <span className="font-medium text-ink-900 dark:text-white">{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-xs text-ink-800/40 dark:text-white/40">Add ₹{200 - subtotal} more for free delivery</p>
              )}
            </div>
            <div className="border-t border-ink-800/10 dark:border-white/10 pt-4 flex justify-between items-baseline">
              <span className="font-semibold text-ink-900 dark:text-white">Total</span>
              <span className="font-display text-2xl font-semibold text-ink-900 dark:text-white">₹{total}</span>
            </div>
            <Button className="w-full" size="lg" onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
