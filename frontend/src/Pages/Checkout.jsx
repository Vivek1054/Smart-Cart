import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaCreditCard, FaMoneyBillWave, FaMobileAlt } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeOrder as placeOrderRequest } from '../data/orders';
import { getAddresses } from '../data/addresses';
import { friendlyError } from '../lib/errors';
import Input from '../ui/Input';
import Button from '../ui/Button';
import CouponInput from '../Components/CouponInput';

const STEPS = ['Address', 'Review', 'Payment', 'Confirmation'];

const Stepper = ({ current }) => (
  <div className="flex items-center justify-center gap-2 mb-10">
    {STEPS.map((step, i) => (
      <React.Fragment key={step}>
        <div className="flex flex-col items-center gap-1.5">
          <motion.div
            animate={{
              scale: i === current ? 1.1 : 1,
              backgroundColor: i <= current ? 'var(--tw-brand-500, #c1571f)' : undefined,
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
              i < current ? 'bg-brand-500 text-white' : i === current ? 'bg-brand-500 text-white' : 'bg-ink-800/10 dark:bg-white/10 text-ink-800/40 dark:text-white/40'
            }`}
          >
            {i < current ? <FaCheck size={12} /> : i + 1}
          </motion.div>
          <span className={`text-[11px] font-medium hidden sm:block ${i <= current ? 'text-ink-900 dark:text-white' : 'text-ink-800/40 dark:text-white/40'}`}>
            {step}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={`h-0.5 w-8 sm:w-16 rounded-full transition-colors ${i < current ? 'bg-brand-500' : 'bg-ink-800/10 dark:bg-white/10'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const Checkout = () => {
  const { cartItems, subtotal, deliveryFee, total, clearCart, coupon, couponDiscount } = useCart();
  const { user, authLoading } = useAuth();
  const location = useLocation();

  const [step, setStep] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [placeError, setPlaceError] = useState('');
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    line1: '',
    city: '',
    pincode: '',
  });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!user) return;
    getAddresses(user.id).then(setSavedAddresses).catch((e) => console.error('[addresses]', e));
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center pt-24">
        <div className="h-9 w-9 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // A persistent order needs a real account (the cart itself can stay a guest cart).
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (cartItems.length === 0 && step < 3) {
    return <Navigate to="/cart" replace />;
  }

  const applySavedAddress = (id) => {
    const a = savedAddresses.find((x) => String(x.id) === String(id));
    if (!a) return;
    setAddress((prev) => ({ ...prev, line1: a.line1, city: a.city, pincode: a.pincode, phone: a.phone || prev.phone }));
    setErrors({});
  };

  const validateAddress = () => {
    const e = {};
    if (!address.fullName.trim()) e.fullName = 'Full name is required';
    if (!/^\S+@\S+\.\S+$/.test(address.email)) e.email = 'Enter a valid email';
    if (!/^\d{10}$/.test(address.phone)) e.phone = 'Enter a valid 10-digit phone number';
    if (!address.line1.trim()) e.line1 = 'Address is required';
    if (!address.city.trim()) e.city = 'City is required';
    if (!/^\d{6}$/.test(address.pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 0 && !validateAddress()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  // The Express API reads the server-side cart and the database computes prices, stock,
  // coupon, delivery fee and total atomically; we only send the address, coupon code and method.
  const placeOrder = async () => {
    setPlacing(true);
    setPlaceError('');
    try {
      const newOrder = await placeOrderRequest({
        address,
        couponCode: coupon?.code,
        paymentMethod,
      });
      setOrder(newOrder);
      await clearCart();
      setStep(3);
    } catch (err) {
      setPlaceError(err.message || friendlyError(err));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-3xl container mx-auto px-4 pt-28 md:pt-32 pb-16 dark:bg-ink-900 dark:text-white min-h-screen">
      <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 dark:text-white text-center mb-2">Checkout</h1>
      <p className="text-center text-ink-800/60 dark:text-white/60 mb-10">Cash on delivery is confirmed instantly. Online payments are confirmed once your payment is received.</p>

      <Stepper current={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && (
            <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6 md:p-8 space-y-4">
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white mb-2">Delivery Address</h2>
              {savedAddresses.length > 0 && (
                <label className="block">
                  <span className="block text-sm font-semibold text-ink-800/80 dark:text-white/80 mb-1.5">Use a saved address</span>
                  <select
                    defaultValue=""
                    onChange={(e) => applySavedAddress(e.target.value)}
                    className="w-full rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400"
                  >
                    <option value="" disabled>Select an address…</option>
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>{a.label || 'Address'} — {a.line1}, {a.city} {a.pincode}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" value={address.fullName} error={errors.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
                <Input label="Email" type="email" value={address.email} error={errors.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} />
                <Input label="Phone Number" value={address.phone} error={errors.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="10-digit number" />
                <Input label="Pincode" value={address.pincode} error={errors.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
                <Input containerClassName="sm:col-span-2" label="Address" value={address.line1} error={errors.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} placeholder="Street, apartment, etc." />
                <Input label="City" value={address.city} error={errors.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              </div>
              <Button className="w-full mt-4" size="lg" onClick={goNext}>Continue to Review</Button>
            </div>
          )}

          {step === 1 && (
            <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6 md:p-8 space-y-6">
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">Order Review</h2>
              <div className="space-y-3">
                {cartItems.map(({ id, qty, product }) => (
                  <div key={id} className="flex items-center gap-3">
                    <img src={product.image} alt={product.name} className="h-14 w-14 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 dark:text-white truncate">{product.name}</p>
                      <p className="text-xs text-ink-800/50 dark:text-white/50">Qty {qty}</p>
                    </div>
                    <p className="font-semibold text-ink-900 dark:text-white">₹{product.price * qty}</p>
                  </div>
                ))}
              </div>
              <CouponInput />

              <div className="border-t border-ink-800/10 dark:border-white/10 pt-4 text-sm space-y-1.5">
                <div className="flex justify-between text-ink-800/70 dark:text-white/70"><span>Deliver to</span><span className="text-ink-900 dark:text-white font-medium">{address.fullName}, {address.city} - {address.pincode}</span></div>
                <div className="flex justify-between text-ink-800/70 dark:text-white/70"><span>Subtotal</span><span>₹{subtotal}</span></div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400"><span>Coupon ({coupon.code})</span><span>-₹{couponDiscount}</span></div>
                )}
                <div className="flex justify-between text-ink-800/70 dark:text-white/70"><span>Delivery</span><span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span></div>
                <div className="flex justify-between font-semibold text-ink-900 dark:text-white text-base pt-1"><span>Total</span><span>₹{total}</span></div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={goBack}>Back</Button>
                <Button className="flex-1" onClick={goNext}>Continue to Payment</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6 md:p-8 space-y-6">
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">Payment Method</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'card', label: 'Card', icon: FaCreditCard },
                  { id: 'upi', label: 'UPI', icon: FaMobileAlt },
                  { id: 'cod', label: 'Cash', icon: FaMoneyBillWave },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 py-4 transition ${
                      paymentMethod === m.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-ink-800/10 dark:border-white/15 hover:border-brand-300'
                    }`}
                  >
                    <m.icon className={paymentMethod === m.id ? 'text-brand-500' : 'text-ink-800/50 dark:text-white/50'} size={18} />
                    <span className="text-xs font-semibold text-ink-900 dark:text-white">{m.label}</span>
                  </button>
                ))}
              </div>

              {(paymentMethod === 'card' || paymentMethod === 'upi') && (
                <p className="text-sm text-ink-800/60 dark:text-white/60">
                  Your order will be placed as <span className="font-semibold">pending</span> and confirmed once your payment is received.
                  We never collect or store card details on this page.
                </p>
              )}
              {paymentMethod === 'cod' && (
                <p className="text-sm text-ink-800/60 dark:text-white/60">Pay with cash when your order arrives.</p>
              )}

              {placeError && (
                <p role="alert" className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-2.5">
                  {placeError}
                </p>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={goBack} disabled={placing}>Back</Button>
                <Button className="flex-1" onClick={placeOrder} loading={placing}>
                  {placing ? 'Placing Order…' : `Place Order · ₹${total}`}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && order && (
            <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-8 md:p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              >
                <FaCheck size={28} />
              </motion.div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink-900 dark:text-white mb-2">{order.status === 'Confirmed' ? 'Order Confirmed!' : 'Order Placed!'}</h2>
              <p className="text-ink-800/60 dark:text-white/60 mb-1">Order ID: <span className="font-semibold text-ink-900 dark:text-white">{order.id}</span></p>
              <p className="text-ink-800/60 dark:text-white/60 mb-8">{order.status === 'Confirmed'
                ? "We've received your order and it's being prepared. Pay with cash on delivery."
                : "We've received your order. It will be confirmed once your payment is received."}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/menu"><Button variant="outline">Continue Shopping</Button></Link>
                <Link to="/account"><Button>View Orders</Button></Link>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
