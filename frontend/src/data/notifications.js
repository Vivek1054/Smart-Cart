import { getAllProducts } from './products';
import { getRealOrders } from './orders';

const timeAgo = (ms) => {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const SEED_ADMIN = [
  { icon: '⭐', message: 'New 5-star review on "Chicken Mayo".', minsAgo: 42 },
  { icon: '👥', message: 'New customer Priya Sharma signed up.', minsAgo: 130 },
  { icon: '💰', message: "You've crossed ₹50,000 in weekly revenue!", minsAgo: 260 },
  { icon: '🛒', message: 'Order SC20000031 was placed.', minsAgo: 400 },
];

export const getAdminNotifications = () => {
  const products = getAllProducts();
  const lowStock = products.filter((p) => p.inStock && p.stockCount <= 8);
  const realOrders = getRealOrders().slice(0, 3);

  const dynamic = [
    ...realOrders.map((o) => ({ icon: '🛒', message: `New order ${o.id} from ${o.address?.fullName || o.userEmail}.`, minsAgo: Math.max(1, Math.round((Date.now() - o.createdAt) / 60000)) })),
    ...lowStock.slice(0, 2).map((p) => ({ icon: '⚠️', message: `Low stock: "${p.name}" has only ${p.stockCount} left.`, minsAgo: 15 })),
  ];

  return [...dynamic, ...SEED_ADMIN]
    .sort((a, b) => a.minsAgo - b.minsAgo)
    .map((n, i) => ({ id: i + 1, icon: n.icon, message: n.message, time: timeAgo(Date.now() - n.minsAgo * 60000) }));
};

const SEED_CUSTOMER = [
  { icon: '🎉', message: 'Welcome to SmartCart! Use code WELCOME10 on your first order.', minsAgo: 20 },
  { icon: '⚡', message: 'Flash deals just dropped — up to 32% off today.', minsAgo: 180 },
];

export const getCustomerNotifications = (email) => {
  const orderNotifs = getRealOrders()
    .filter((o) => o.userEmail?.toLowerCase() === email?.toLowerCase())
    .slice(0, 5)
    .flatMap((o) => (o.statusHistory || []).map((h) => ({
      icon: h.status === 'Delivered' ? '📦' : '🚚',
      message: `Order ${o.id} is now "${h.status}".`,
      minsAgo: Math.max(1, Math.round((Date.now() - h.at) / 60000)),
    })));

  return [...orderNotifs, ...SEED_CUSTOMER]
    .sort((a, b) => a.minsAgo - b.minsAgo)
    .map((n, i) => ({ id: i + 1, icon: n.icon, message: n.message, time: timeAgo(Date.now() - n.minsAgo * 60000) }));
};
