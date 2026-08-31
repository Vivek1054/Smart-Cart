// Synthetic demo data for the admin dashboard. There is no backend, so all
// business metrics here (customers, revenue, payments, returns) are seeded,
// deterministic placeholder data — combined with any REAL orders a visitor
// has actually placed through checkout, so the dashboard doesn't feel static.
import { getAllProducts } from './products';
import { getRealOrders, ORDER_STATUSES } from './orders';

const seeded = (seed, salt = 0) => {
  const x = Math.sin(seed * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
};

const FIRST_NAMES = ['Aarav', 'Vivaan', 'Ishaan', 'Priya', 'Ananya', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Sara', 'Aditya', 'Neha', 'Karan', 'Riya', 'Arjun', 'Pooja'];
const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Iyer', 'Reddy', 'Nair', 'Gupta', 'Khan', 'Singh', 'Rao', 'Mehta', 'Joshi'];
const CITIES = ['Mumbai', 'Bengaluru', 'Delhi', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad'];

let _customers = null;
export const getCustomers = () => {
  if (_customers) return _customers;
  _customers = Array.from({ length: 42 }, (_, i) => {
    const id = i + 1;
    const first = FIRST_NAMES[Math.floor(seeded(id, 1) * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(seeded(id, 2) * LAST_NAMES.length)];
    const orders = Math.floor(1 + seeded(id, 3) * 18);
    const avgOrder = Math.round(35 + seeded(id, 4) * 60);
    const daysAgo = Math.floor(seeded(id, 5) * 400);
    return {
      id,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${id}@example.com`,
      city: CITIES[Math.floor(seeded(id, 6) * CITIES.length)],
      orders,
      totalSpent: orders * avgOrder,
      joined: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      status: seeded(id, 7) > 0.08 ? 'Active' : 'Blocked',
    };
  });
  return _customers;
};

export const getCustomerById = (id) => getCustomers().find((c) => String(c.id) === String(id));

export const getRevenueTrend = (days = 30) => {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const base = 4000 + Math.sin(i / 3.2) * 1400;
    const noise = seeded(i, 42) * 1600;
    const weekendBoost = [0, 6].includes(date.getDay()) ? 1.25 : 1;
    out.push({
      date: date.toISOString().slice(0, 10),
      revenue: Math.round((base + noise) * weekendBoost),
      orders: Math.round(18 + seeded(i, 43) * 22),
    });
  }
  return out;
};

export const getMonthlyRevenue = (months = 12) => {
  const out = [];
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const seed = d.getFullYear() * 12 + d.getMonth();
    out.push({
      month: names[d.getMonth()],
      revenue: Math.round(80000 + seeded(seed, 51) * 60000 + i * -800),
    });
  }
  return out;
};

let _payments = null;
export const getPayments = () => {
  if (_payments) return _payments;
  const methods = ['Card', 'UPI', 'Cash'];
  const statuses = ['Success', 'Success', 'Success', 'Success', 'Pending', 'Failed', 'Refunded'];
  const customers = getCustomers();
  _payments = Array.from({ length: 60 }, (_, i) => {
    const id = i + 1;
    const daysAgo = Math.floor(seeded(id, 60) * 90);
    const customer = customers[Math.floor(seeded(id, 61) * customers.length)];
    return {
      id: `TXN${100000 + id}`,
      orderId: `SC${20000000 + id}`,
      customer: customer.name,
      amount: Math.round(35 + seeded(id, 62) * 220),
      method: methods[Math.floor(seeded(id, 63) * methods.length)],
      status: statuses[Math.floor(seeded(id, 64) * statuses.length)],
      date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    };
  });
  return _payments;
};

let _syntheticOrders = null;
export const getSyntheticOrders = () => {
  if (_syntheticOrders) return _syntheticOrders;
  const customers = getCustomers();
  const products = getAllProducts();
  const statuses = ['Delivered', 'Delivered', 'Delivered', 'Shipped', 'Processing', 'Pending', 'Cancelled'];
  _syntheticOrders = Array.from({ length: 48 }, (_, i) => {
    const id = i + 1;
    const customer = customers[Math.floor(seeded(id, 70) * customers.length)];
    const itemCount = 1 + Math.floor(seeded(id, 71) * 3);
    const items = Array.from({ length: itemCount }, (_, k) => {
      const p = products[Math.floor(seeded(id, 72 + k) * products.length)];
      const qty = 1 + Math.floor(seeded(id, 75 + k) * 2);
      return { id: p.id, name: p.name, qty, price: p.price };
    });
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    const daysAgo = Math.floor(seeded(id, 73) * 60);
    return {
      id: `SC${20000000 + id}`,
      userEmail: customer.email,
      customerName: customer.name,
      items,
      total,
      status: statuses[Math.floor(seeded(id, 74) * statuses.length)],
      createdAt: Date.now() - daysAgo * 86400000,
      synthetic: true,
    };
  });
  return _syntheticOrders;
};

// Real orders (actually placed via checkout) merged with synthetic history —
// real orders are marked so admin UI can badge them as "Live".
export const getAllOrdersForAdmin = () => {
  const real = getRealOrders().map((o) => ({ ...o, customerName: o.address?.fullName || o.userEmail, synthetic: false }));
  return [...real, ...getSyntheticOrders()].sort((a, b) => b.createdAt - a.createdAt);
};

let _returns = null;
export const getReturns = () => {
  if (_returns) return _returns;
  const orders = getSyntheticOrders();
  const reasons = ['Damaged on arrival', 'Wrong item received', 'Changed my mind', 'Quality not as expected', 'Late delivery'];
  const statuses = ['Requested', 'Approved', 'Rejected', 'Completed'];
  _returns = Array.from({ length: 14 }, (_, i) => {
    const id = i + 1;
    const order = orders[Math.floor(seeded(id, 80) * orders.length)];
    const item = order.items[0];
    return {
      id: `RET${3000 + id}`,
      orderId: order.id,
      customer: order.customerName,
      product: item.name,
      reason: reasons[Math.floor(seeded(id, 81) * reasons.length)],
      amount: item.price * item.qty,
      date: new Date(order.createdAt + 2 * 86400000).toISOString(),
      status: statuses[Math.floor(seeded(id, 82) * statuses.length)],
    };
  });
  return _returns;
};

export const getReviewsForModeration = () => {
  const products = getAllProducts();
  const overrides = JSON.parse(localStorage.getItem('smartcart_review_status') || '{}');
  return products.flatMap((p) =>
    p.reviews.map((r) => ({
      ...r,
      productId: p.id,
      productName: p.name,
      date: new Date(Date.now() - (p.id * 3 + r.id.length) * 86400000).toISOString(),
      status: overrides[r.id] || 'Approved',
    }))
  );
};

export const setReviewStatus = (reviewId, status) => {
  const overrides = JSON.parse(localStorage.getItem('smartcart_review_status') || '{}');
  overrides[reviewId] = status;
  localStorage.setItem('smartcart_review_status', JSON.stringify(overrides));
};

export const getDashboardKPIs = () => {
  const orders = getAllOrdersForAdmin();
  const products = getAllProducts();
  const customers = getCustomers();
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const today = new Date().toDateString();
  const todaysSales = orders.filter((o) => new Date(o.createdAt).toDateString() === today).reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length;
  const lowStock = products.filter((p) => p.inStock && p.stockCount <= 8).length;
  return {
    totalRevenue,
    totalOrders: orders.length,
    totalCustomers: customers.length,
    totalProducts: products.length,
    todaysSales,
    pendingOrders,
    lowStock,
    avgOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0,
  };
};

export { ORDER_STATUSES };
