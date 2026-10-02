// Notifications are derived from real application state (orders, stock,
// sign-ups, reviews, returns). Nothing here is fabricated: no activity, no
// notification.
import { supabase } from '../lib/supabase';
import { getAllProductsForAdmin, getFlashDeals } from './products';
import { getOrdersForUser } from './orders';
import { getAllOrdersForAdmin, LOW_STOCK_THRESHOLD } from './adminData';

export const timeAgo = (ms) => {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const finish = (list) =>
  list
    .sort((a, b) => b.at - a.at)
    .map((n, i) => ({ id: i + 1, icon: n.icon, message: n.message, time: timeAgo(n.at) }));

export const getAdminNotifications = async () => {
  const [orders, customers, pendingReviews, returns] = await Promise.all([
    getAllOrdersForAdmin(),
    supabase.from('profiles').select('name, email, created_at').eq('role', 'customer')
      .order('created_at', { ascending: false }).limit(3),
    supabase.from('product_reviews').select('id, created_at, products(name)').eq('status', 'Pending')
      .order('created_at', { ascending: false }).limit(3),
    supabase.from('returns').select('return_number, created_at').eq('status', 'Requested')
      .order('created_at', { ascending: false }).limit(3),
  ]);

  const list = [];
  orders.slice(0, 4).forEach((o) => list.push({
    icon: '🛒', at: o.createdAt, message: `New order ${o.id} from ${o.customerName} (₹${o.total}).`,
  }));
  getAllProductsForAdmin()
    .filter((p) => p.isActive && p.inStock && p.stockCount <= LOW_STOCK_THRESHOLD)
    .slice(0, 3)
    .forEach((p) => list.push({ icon: '⚠️', at: Date.now() - 60000, message: `Low stock: "${p.name}" has only ${p.stockCount} left.` }));
  getAllProductsForAdmin()
    .filter((p) => p.isActive && !p.inStock)
    .slice(0, 2)
    .forEach((p) => list.push({ icon: '🚫', at: Date.now() - 120000, message: `Out of stock: "${p.name}".` }));
  (customers.data || []).forEach((c) => list.push({
    icon: '👥', at: new Date(c.created_at).getTime(), message: `New customer ${c.name || c.email} signed up.`,
  }));
  (pendingReviews.data || []).forEach((r) => list.push({
    icon: '⭐', at: new Date(r.created_at).getTime(), message: `New review on "${r.products?.name || 'a product'}" awaiting moderation.`,
  }));
  (returns.data || []).forEach((r) => list.push({
    icon: '↩️', at: new Date(r.created_at).getTime(), message: `Return ${r.return_number} was requested.`,
  }));
  return finish(list);
};

export const getCustomerNotifications = async (user) => {
  if (!user) return [];
  const orders = await getOrdersForUser(user.id);
  const list = [];

  orders.slice(0, 5).forEach((o) => {
    o.statusHistory.forEach((h) => list.push({
      icon: h.status === 'Delivered' ? '📦' : h.status === 'Cancelled' ? '❌' : '🚚',
      at: h.at,
      message: `Order ${o.id} is now "${h.status}".`,
    }));
  });

  const deals = getFlashDeals();
  if (deals.length) {
    const top = Math.max(...deals.map((d) => d.discount));
    list.push({ icon: '⚡', at: Date.now() - 60000, message: `${deals.length} flash deals live — up to ${top}% off.` });
  }
  if (user.createdAt) {
    list.push({ icon: '🎉', at: new Date(user.createdAt).getTime(), message: 'Welcome to SmartCart!' });
  }
  return finish(list);
};
