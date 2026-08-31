import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaBoxOpen, FaMapMarkerAlt, FaUser, FaCheck } from 'react-icons/fa';
import StatusBadge from '../components/StatusBadge';
import { getAllOrdersForAdmin } from '../../data/adminData';
import { updateOrderStatus, ORDER_STATUSES, TRACKING_STEPS } from '../../data/orders';

// Statuses for which a delivery timeline doesn't make sense.
const NON_TRACKABLE_STATUSES = ['Cancelled', 'Returned', 'Pending'];

const OrderDetail = () => {
  const { id } = useParams();
  const found = getAllOrdersForAdmin().find((o) => o.id === id);
  const [order, setOrder] = useState(found);

  if (!order) {
    return (
      <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-8 text-center">
        <p className="text-ink-800/60 dark:text-white/60 mb-4">Order not found.</p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:gap-2.5 transition-all"
        >
          <FaArrowLeft size={12} /> Back to Orders
        </Link>
      </div>
    );
  }

  const handleStatusChange = (e) => {
    const status = e.target.value;
    if (order.synthetic) {
      // Synthetic orders don't exist in localStorage — reflect the change locally only.
      setOrder((o) => ({ ...o, status }));
      return;
    }
    const updated = updateOrderStatus(order.id, status);
    setOrder((o) => ({
      ...o,
      status: updated?.status || status,
      statusHistory: updated?.statusHistory || o.statusHistory,
    }));
  };

  const subtotal = order.subtotal ?? order.total;
  const deliveryFee = order.deliveryFee ?? 0;
  const savings = order.savings ?? 0;

  const stepIndex = TRACKING_STEPS.indexOf(order.status);
  const trackable = !NON_TRACKABLE_STATUSES.includes(order.status);

  return (
    <div className="space-y-6">
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-800/60 dark:text-white/60 hover:text-brand-600 dark:hover:text-brand-300 transition"
      >
        <FaArrowLeft size={12} /> Back to Orders
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">
            Order <span className="font-mono">{order.id}</span>
          </h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-sm text-ink-800/50 dark:text-white/50">
          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6">
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-4">Items</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cream-100 dark:bg-white/5 text-ink-800/30 dark:text-white/30">
                    <FaBoxOpen size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-ink-800/50 dark:text-white/50">Qty {item.qty} × ₹{item.price}</p>
                  </div>
                  <p className="font-semibold text-ink-900 dark:text-white">₹{item.qty * item.price}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-ink-800/10 dark:border-white/10 mt-5 pt-4 text-sm space-y-1.5">
              <div className="flex justify-between text-ink-800/70 dark:text-white/70"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between text-ink-800/70 dark:text-white/70">
                <span>Delivery</span><span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400"><span>Savings</span><span>-₹{savings}</span></div>
              )}
              <div className="flex justify-between font-semibold text-ink-900 dark:text-white text-base pt-1"><span>Total</span><span>₹{order.total}</span></div>
            </div>
          </div>

          {/* Tracking timeline */}
          <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6">
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-5">Order Tracking</h3>
            {trackable ? (
              <div>
                {TRACKING_STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  const isLast = i === TRACKING_STEPS.length - 1;
                  return (
                    <div key={step} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <motion.span
                          animate={{ scale: i === stepIndex ? 1.1 : 1 }}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                            done ? 'bg-brand-500 text-white' : 'bg-ink-800/10 dark:bg-white/10 text-ink-800/40 dark:text-white/40'
                          }`}
                        >
                          {i < stepIndex ? <FaCheck size={11} /> : i + 1}
                        </motion.span>
                        {!isLast && (
                          <span className={`w-0.5 flex-1 min-h-[28px] transition-colors ${i < stepIndex ? 'bg-brand-500' : 'bg-ink-800/10 dark:bg-white/10'}`} />
                        )}
                      </div>
                      <div className={isLast ? 'pb-0' : 'pb-6'}>
                        <p className={`text-sm font-semibold ${done ? 'text-ink-900 dark:text-white' : 'text-ink-800/40 dark:text-white/40'}`}>{step}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-ink-800/60 dark:text-white/60">
                Tracking isn't available for orders with status "{order.status}".
              </p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6">
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-4 flex items-center gap-2">
              <FaUser size={13} className="text-ink-800/40 dark:text-white/40" /> Customer
            </h3>
            <p className="text-sm font-medium text-ink-900 dark:text-white">{order.customerName}</p>
            <p className="text-sm text-ink-800/60 dark:text-white/60">{order.userEmail}</p>
          </div>

          {order.address && (
            <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6">
              <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-4 flex items-center gap-2">
                <FaMapMarkerAlt size={13} className="text-ink-800/40 dark:text-white/40" /> Delivery Address
              </h3>
              <p className="text-sm text-ink-800/70 dark:text-white/70">{order.address.line1}</p>
              <p className="text-sm text-ink-800/70 dark:text-white/70">{order.address.city} - {order.address.pincode}</p>
              {order.address.phone && <p className="text-sm text-ink-800/70 dark:text-white/70 mt-1">{order.address.phone}</p>}
            </div>
          )}

          <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 md:p-6">
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-4">Update Status</h3>
            <select
              value={order.status}
              onChange={handleStatusChange}
              disabled={order.synthetic}
              className="w-full rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-ink-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:border-brand-400"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {order.synthetic && (
              <p className="text-xs text-ink-800/50 dark:text-white/50 mt-2">
                Status updates are only supported for orders placed through checkout in this session.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
