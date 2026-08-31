import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaTrash, FaShoppingBag } from 'react-icons/fa';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import QuantityStepper from '../ui/QuantityStepper';
import { useCart } from '../context/CartContext';

const MiniCart = ({ open, onClose }) => {
  const { cartItems, updateQty, removeFromCart, subtotal, total, itemCount } = useCart();

  return (
    <Drawer open={open} onClose={onClose} side="right" title={`Your Cart (${itemCount})`}>
      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
          <p className="text-6xl mb-4">🛒</p>
          <p className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-1">Your cart is empty</p>
          <p className="text-sm text-ink-800/50 dark:text-white/50 mb-6">Add something delicious to get started.</p>
          <Link to="/menu" onClick={onClose}>
            <Button>Browse Menu</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <AnimatePresence initial={false}>
              {cartItems.map(({ id, qty, product }) => (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
                  className="flex items-center gap-3"
                >
                  <Link to={`/product/${product.id}`} onClick={onClose} className="shrink-0">
                    <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${product.id}`} onClick={onClose} className="text-sm font-semibold text-ink-900 dark:text-white truncate block hover:text-brand-500 transition">
                      {product.name}
                    </Link>
                    <p className="text-xs text-ink-800/50 dark:text-white/50 mb-1.5">₹{product.price}</p>
                    <div className="flex items-center gap-2">
                      <QuantityStepper size="sm" value={qty} onChange={(v) => updateQty(id, v)} max={product.stockCount || 10} />
                      <button onClick={() => removeFromCart(id)} aria-label="Remove" className="text-red-500 hover:text-red-600 transition p-1">
                        <FaTrash size={11} />
                      </button>
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-ink-900 dark:text-white shrink-0">₹{product.price * qty}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="border-t border-ink-800/10 dark:border-white/10 p-5 space-y-3 shrink-0">
            <div className="flex justify-between text-sm text-ink-800/70 dark:text-white/70">
              <span>Subtotal</span>
              <span className="font-semibold text-ink-900 dark:text-white">₹{subtotal}</span>
            </div>
            <p className="text-xs text-ink-800/40 dark:text-white/40">Coupons & delivery calculated at checkout.</p>
            <div className="flex gap-3">
              <Link to="/cart" onClick={onClose} className="flex-1">
                <Button variant="outline" className="w-full">View Cart</Button>
              </Link>
              <Link to="/checkout" onClick={onClose} className="flex-1">
                <Button className="w-full">Checkout · ₹{total}</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default MiniCart;
