import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaUser, FaBoxOpen, FaHeart, FaMapMarkerAlt, FaCog, FaSignOutAlt, FaPlus, FaTrash, FaCheck, FaRedo, FaTruck, FaEdit, FaUndo,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { getOrdersForUser, getReturnsForUser, requestReturn, TRACKING_STEPS } from '../data/orders';
import { getAddresses, addAddress as saveNewAddress, updateAddress, deleteAddress } from '../data/addresses';
import { friendlyError } from '../lib/errors';
import ProductCard from '../Components/ProductCard';
import ChangePasswordForm from '../Components/ChangePasswordForm';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ORDER_FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const OrderTimeline = ({ status }) => {
  const currentIdx = TRACKING_STEPS.indexOf(status);
  if (currentIdx === -1) {
    return (
      <p className="text-sm text-ink-800/50 dark:text-white/50 py-2">
        Tracking isn't available for this order's current status ({status}).
      </p>
    );
  }
  return (
    <div className="flex items-start pt-2">
      {TRACKING_STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-1.5 w-16 shrink-0">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${i <= currentIdx ? 'bg-brand-500 text-white' : 'bg-ink-800/10 dark:bg-white/10 text-ink-800/40 dark:text-white/40'}`}>
              {i < currentIdx ? <FaCheck size={9} /> : i + 1}
            </span>
            <span className={`text-[10px] text-center leading-tight ${i <= currentIdx ? 'text-ink-900 dark:text-white font-medium' : 'text-ink-800/40 dark:text-white/40'}`}>{step}</span>
          </div>
          {i < TRACKING_STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 mt-3 rounded-full ${i < currentIdx ? 'bg-brand-500' : 'bg-ink-800/10 dark:bg-white/10'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const RETURN_REASONS = ['Damaged on arrival', 'Wrong item received', 'Quality not as expected', 'Late delivery', 'Changed my mind'];
const EMPTY_ADDR = { label: '', line1: '', city: '', pincode: '', phone: '' };

const TABS = [
  { id: 'profile', label: 'Profile', icon: FaUser },
  { id: 'orders', label: 'Orders', icon: FaBoxOpen },
  { id: 'wishlist', label: 'Wishlist', icon: FaHeart },
  { id: 'addresses', label: 'Addresses', icon: FaMapMarkerAlt },
  { id: 'settings', label: 'Settings', icon: FaCog },
];

const Account = () => {
  const { user, isAuthenticated, authLoading, logout, updateProfile } = useAuth();
  const { wishlistItems } = useWishlist();
  const { addToCart } = useCart();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [ordersState, setOrdersState] = useState({ loading: true, error: '' });
  const [returns, setReturns] = useState([]);
  const [orderFilter, setOrderFilter] = useState('All');
  const [trackingOpenId, setTrackingOpenId] = useState(null);
  const [returnFormId, setReturnFormId] = useState(null);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [addresses, setAddresses] = useState([]);
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [newAddr, setNewAddr] = useState(EMPTY_ADDR);
  const [addrError, setAddrError] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const userId = user?.id;

  const loadOrders = React.useCallback(async () => {
    if (!userId) return;
    setOrdersState({ loading: true, error: '' });
    try {
      const [o, r] = await Promise.all([getOrdersForUser(userId), getReturnsForUser(userId)]);
      setOrders(o);
      setReturns(r);
      setOrdersState({ loading: false, error: '' });
    } catch (e) {
      setOrdersState({ loading: false, error: e.message || 'Could not load your orders.' });
    }
  }, [userId]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (!userId) return;
    getAddresses(userId).then(setAddresses).catch((e) => console.error('[addresses]', e));
  }, [userId]);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name, phone: user.phone || '' });
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center pt-24">
        <div className="h-9 w-9 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: '/account' }} />;

  const saveProfile = async (e) => {
    e.preventDefault();
    if (profileForm.name.trim().length < 2) return setProfileError('Enter your full name.');
    if (profileForm.phone && !/^\d{10}$/.test(profileForm.phone.trim())) return setProfileError('Enter a valid 10-digit phone number.');
    setSavingProfile(true);
    setProfileError('');
    const result = await updateProfile(profileForm);
    setSavingProfile(false);
    if (result.ok) notify('Profile updated', 'success', 1800);
    else setProfileError(result.error);
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setAddrError('');
    if (!newAddr.line1.trim() || !newAddr.city.trim()) return setAddrError('Address and city are required.');
    if (!/^\d{6}$/.test(newAddr.pincode.trim())) return setAddrError('Enter a valid 6-digit pincode.');
    if (newAddr.phone && !/^\d{10}$/.test(newAddr.phone.trim())) return setAddrError('Enter a valid 10-digit phone number.');
    try {
      if (editingAddrId) {
        const saved = await updateAddress(editingAddrId, newAddr);
        setAddresses((list) => list.map((a) => (a.id === saved.id ? saved : a)));
      } else {
        const saved = await saveNewAddress(userId, newAddr);
        setAddresses((list) => [...list, saved]);
      }
      setNewAddr(EMPTY_ADDR);
      setEditingAddrId(null);
      notify('Address saved', 'success', 1800);
    } catch (err) {
      setAddrError(err.message);
    }
  };

  const startEditAddress = (a) => {
    setEditingAddrId(a.id);
    setNewAddr({ label: a.label, line1: a.line1, city: a.city, pincode: a.pincode, phone: a.phone });
    setAddrError('');
  };

  const removeAddress = async (id) => {
    try {
      await deleteAddress(id);
      setAddresses((list) => list.filter((a) => a.id !== id));
      if (editingAddrId === id) { setEditingAddrId(null); setNewAddr(EMPTY_ADDR); }
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleReorder = (order) => {
    const available = order.items.filter((it) => it.id !== null);
    if (available.length === 0) {
      notify('These items are no longer available.', 'error');
      return;
    }
    available.forEach((it) => addToCart(it.id, it.qty));
    notify('Items added to your cart', 'success');
    navigate('/cart');
  };

  const submitReturn = async (order) => {
    try {
      await requestReturn(order.dbId, returnReason);
      notify('Return requested. We will review it shortly.', 'success');
      setReturnFormId(null);
      await loadOrders();
    } catch (err) {
      notify(friendlyError(err), 'error');
    }
  };

  const filteredOrders = orderFilter === 'All' ? orders : orders.filter((o) => o.status === orderFilter);

  return (
    <div className="max-w-screen-2xl container mx-auto md:px-20 px-4 pt-28 md:pt-32 pb-16 dark:bg-ink-900 dark:text-white min-h-screen">
      <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 dark:text-white mb-8">My Account</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5 mb-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-ink-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-ink-800/50 dark:text-white/50 truncate">{user.email}</p>
            </div>
          </div>
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                  tab === t.id ? 'bg-brand-500 text-white' : 'text-ink-800/70 dark:text-white/70 hover:bg-cream-100 dark:hover:bg-white/5'
                }`}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition whitespace-nowrap"
            >
              <FaSignOutAlt size={13} /> Logout
            </button>
          </nav>
        </aside>

        {/* Content */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 min-w-0"
        >
          {tab === 'profile' && (
            <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6 md:p-8">
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white mb-6">Profile Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <Input label="Full Name" value={profileForm.name} onChange={(e) => { setProfileForm({ ...profileForm, name: e.target.value }); setProfileError(''); }} />
                <Input label="Email" value={user.email} readOnly />
                <Input label="Phone" placeholder="10-digit number" value={profileForm.phone} onChange={(e) => { setProfileForm({ ...profileForm, phone: e.target.value }); setProfileError(''); }} />
              </div>
              {profileError && <p role="alert" className="text-sm text-red-600 dark:text-red-300 mt-3">{profileError}</p>}
              <Button className="mt-5" size="sm" onClick={saveProfile} loading={savingProfile}>Save Changes</Button>
            </div>
          )}

          {tab === 'orders' && (
            ordersState.loading ? (
              <EmptyState emoji="⏳" title="Loading your orders…" desc="One moment." />
            ) : ordersState.error ? (
              <div className="text-center py-16 rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10">
                <p className="font-display text-xl font-semibold text-ink-900 dark:text-white">Couldn't load your orders</p>
                <p className="text-ink-800/60 dark:text-white/60 mt-1 mb-4">{ordersState.error}</p>
                <Button size="sm" onClick={loadOrders}>Try again</Button>
              </div>
            ) : orders.length === 0 ? (
              <EmptyState emoji="📦" title="No orders yet" desc="Your order history will show up here." />
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {ORDER_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setOrderFilter(f)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                        orderFilter === f ? 'bg-brand-500 text-white' : 'bg-white dark:bg-ink-800 text-ink-800/60 dark:text-white/60 border border-ink-800/10 dark:border-white/15 hover:border-brand-400'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {filteredOrders.length === 0 ? (
                  <EmptyState emoji="🔍" title="No orders here" desc="Try a different filter." />
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((o) => (
                      <div key={o.id} className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <div>
                            <p className="font-semibold text-ink-900 dark:text-white">{o.id}</p>
                            <p className="text-xs text-ink-800/50 dark:text-white/50">{new Date(o.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-800/50 dark:text-white/50">
                              {{ card: 'Card', upi: 'UPI', cod: 'Cash on delivery' }[o.payment.method] || ''} · {o.payment.status}
                            </span>
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">{o.status}</span>
                          </div>
                        </div>
                        <p className="text-sm text-ink-800/60 dark:text-white/60 mb-3">{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</p>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <p className="font-display font-semibold text-ink-900 dark:text-white">₹{o.total}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setTrackingOpenId(trackingOpenId === o.id ? null : o.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300 hover:underline"
                            >
                              <FaTruck size={11} /> {trackingOpenId === o.id ? 'Hide Tracking' : 'Track Order'}
                            </button>
                            <button
                              onClick={() => handleReorder(o)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-ink-800/60 dark:text-white/60 hover:text-brand-600 dark:hover:text-brand-300 transition"
                            >
                              <FaRedo size={10} /> Reorder
                            </button>
                            {o.status === 'Delivered' && !returns.some((r) => r.orderDbId === o.dbId) && (
                              <button
                                onClick={() => setReturnFormId(returnFormId === o.dbId ? null : o.dbId)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-ink-800/60 dark:text-white/60 hover:text-brand-600 dark:hover:text-brand-300 transition"
                              >
                                <FaUndo size={10} /> Return
                              </button>
                            )}
                          </div>
                        </div>
                        {returns.filter((r) => r.orderDbId === o.dbId).map((r) => (
                          <p key={r.id} className="mt-3 text-xs text-ink-800/60 dark:text-white/60">
                            Return {r.id} · {r.reason} · <span className="font-semibold">{r.status}</span>
                          </p>
                        ))}
                        {returnFormId === o.dbId && (
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <select
                              value={returnReason}
                              onChange={(e) => setReturnReason(e.target.value)}
                              className="rounded-xl border border-ink-800/10 dark:border-white/15 bg-cream-50 dark:bg-white/5 px-3 py-2 text-xs outline-none focus:border-brand-400"
                            >
                              {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <Button size="sm" onClick={() => submitReturn(o)}>Request Return</Button>
                          </div>
                        )}
                        <AnimatePresence>
                          {trackingOpenId === o.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-ink-800/10 dark:border-white/10 mt-4 pt-1">
                                <OrderTimeline status={o.status} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {tab === 'wishlist' && (
            wishlistItems.length === 0 ? (
              <EmptyState emoji="💛" title="Your wishlist is empty" desc="Save items you love to find them easily." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {wishlistItems.map((item) => <ProductCard key={item.id} item={item} />)}
              </div>
            )
          )}

          {tab === 'addresses' && (
            <div className="space-y-4">
              {addresses.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-4 rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-5">
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-white">{a.label || 'Address'}</p>
                    <p className="text-sm text-ink-800/60 dark:text-white/60">{a.line1}, {a.city} - {a.pincode}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => startEditAddress(a)} aria-label="Edit address" className="text-ink-800/50 dark:text-white/50 hover:text-brand-600 transition">
                      <FaEdit size={13} />
                    </button>
                    <button onClick={() => removeAddress(a.id)} aria-label="Remove address" className="text-red-500 hover:text-red-600 transition">
                      <FaTrash size={13} />
                    </button>
                  </div>
                </div>
              ))}
              <form onSubmit={saveAddress} className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6 space-y-4">
                <h3 className="font-display font-semibold text-ink-900 dark:text-white flex items-center gap-2"><FaPlus size={12} /> {editingAddrId ? 'Edit Address' : 'Add New Address'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Label" placeholder="Home, Work..." value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} />
                  <Input label="City" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
                  <Input containerClassName="sm:col-span-2" label="Address" value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} />
                  <Input label="Pincode" value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} />
                  <Input label="Phone (optional)" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} />
                </div>
                {addrError && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{addrError}</p>}
                <div className="flex items-center gap-3">
                  <Button type="submit" size="sm">{editingAddrId ? 'Update Address' : 'Save Address'}</Button>
                  {editingAddrId && (
                    <button type="button" onClick={() => { setEditingAddrId(null); setNewAddr(EMPTY_ADDR); setAddrError(''); }} className="text-sm text-ink-800/60 dark:text-white/60 hover:underline">Cancel</button>
                  )}
                </div>
              </form>
            </div>
          )}

          {tab === 'settings' && (
            <div className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10 shadow-soft p-6 md:p-8">
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white mb-4">Settings</h2>
              <p className="text-sm text-ink-800/60 dark:text-white/60 mb-6">
                Use the sun/moon icon in the navbar to switch between light and dark mode.
              </p>
              <div className="mb-8">
                <ChangePasswordForm />
              </div>
              <Button variant="danger" onClick={handleLogout}>Logout</Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const EmptyState = ({ emoji, title, desc }) => (
  <div className="text-center py-16 rounded-2xl bg-white dark:bg-ink-800 border border-ink-800/5 dark:border-white/10">
    <p className="text-4xl mb-3">{emoji}</p>
    <p className="font-display text-xl font-semibold text-ink-900 dark:text-white">{title}</p>
    <p className="text-ink-800/60 dark:text-white/60 mt-1">{desc}</p>
  </div>
);

export default Account;
