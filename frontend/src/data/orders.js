const ORDERS_KEY = 'smartcart_orders';

export const ORDER_STATUSES = [
  'Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned',
];

export const TRACKING_STEPS = ['Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const readOrders = () => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeOrders = (orders) => localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

export const getOrdersForUser = (email) => {
  if (!email) return [];
  return readOrders()
    .filter((o) => o.userEmail.toLowerCase() === email.toLowerCase())
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const getRealOrders = () => readOrders().sort((a, b) => b.createdAt - a.createdAt);

export const getOrderById = (id) => readOrders().find((o) => o.id === id);

export const createOrder = ({ userEmail, items, address, total, subtotal, deliveryFee, savings, coupon }) => {
  const orders = readOrders();
  const order = {
    id: `SC${Date.now().toString().slice(-8)}`,
    userEmail,
    items,
    address,
    subtotal,
    deliveryFee,
    savings,
    coupon: coupon || null,
    total,
    status: 'Confirmed',
    statusHistory: [{ status: 'Confirmed', at: Date.now() }],
    payment: { method: 'card', status: 'Paid' },
    createdAt: Date.now(),
  };
  writeOrders([...orders, order]);
  return order;
};

export const updateOrderStatus = (id, status) => {
  const orders = readOrders();
  const updated = orders.map((o) =>
    o.id === id
      ? { ...o, status, statusHistory: [...(o.statusHistory || []), { status, at: Date.now() }] }
      : o
  );
  writeOrders(updated);
  return updated.find((o) => o.id === id);
};
