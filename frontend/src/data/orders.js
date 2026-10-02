import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/errors';
import { api } from '../services/api';

export const ORDER_STATUSES = [
  'Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned',
];

export const TRACKING_STEPS = ['Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

export const ORDER_SELECT =
  '*, order_items(id, product_id, name, image, price, qty), order_status_history(status, created_at), payments(id, method, status, amount, paid_at, provider_payment_id, created_at)';

// DB row -> the order shape the UI already uses. `id` is the human order number (SC########).
export const mapOrder = (o) => {
  const payment = (o.payments || [])[0];
  return {
    dbId: Number(o.id),
    id: o.order_number,
    userId: o.user_id,
    userEmail: o.ship_email,
    customerName: o.ship_name,
    items: (o.order_items || []).map((i) => ({
      itemId: Number(i.id),
      id: i.product_id === null ? null : Number(i.product_id),
      name: i.name,
      image: i.image,
      price: Number(i.price),
      qty: Number(i.qty),
    })),
    address: {
      fullName: o.ship_name,
      email: o.ship_email,
      phone: o.ship_phone,
      line1: o.ship_line1,
      city: o.ship_city,
      pincode: o.ship_pincode,
    },
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.delivery_fee),
    savings: Number(o.savings),
    coupon: o.coupon_code ? { code: o.coupon_code, discount: Number(o.coupon_discount) } : null,
    total: Number(o.total),
    status: o.status,
    statusHistory: (o.order_status_history || [])
      .map((h) => ({ status: h.status, at: new Date(h.created_at).getTime() }))
      .sort((a, b) => a.at - b.at),
    payment: payment
      ? {
          id: Number(payment.id),
          method: payment.method,
          status: payment.status,
          paidAt: payment.paid_at ? new Date(payment.paid_at).getTime() : null,
          providerPaymentId: payment.provider_payment_id,
        }
      : { method: null, status: 'Pending' },
    createdAt: new Date(o.created_at).getTime(),
  };
};

// The signed-in customer's own orders (newest first).
export const getOrdersForUser = async (userId) => {
  if (!userId) return [];
  const rows = unwrap(
    await supabase.from('orders').select(ORDER_SELECT).eq('user_id', userId).order('created_at', { ascending: false })
  );
  return rows.map(mapOrder);
};

// Creates the order via POST /api/v1/orders. The API reads the user's server-side
// cart and calls the place_order() database function, which computes prices, stock,
// coupon, delivery fee and total atomically. Only the address, an optional coupon
// code and the payment method are sent from the browser.
export const placeOrder = async ({ address, couponCode, paymentMethod }) => {
  const o = await api.post('/orders', { shipping: address, couponCode: couponCode || null, paymentMethod });
  return {
    dbId: o.dbId,
    id: o.id,
    status: o.status,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    savings: o.savings,
    total: o.total,
    paymentMethod: o.payment?.method,
    paymentStatus: o.payment?.status,
  };
};

// Admin only: PATCH /api/v1/admin/orders/:id/status (the API checks the admin role, and so does
// RLS). A database trigger writes the status history, restocks on cancel and settles COD.
export const updateOrderStatus = async (dbId, status) => {
  await api.patch(`/admin/orders/${dbId}/status`, { status });
  const row = unwrap(await supabase.from('orders').select(ORDER_SELECT).eq('id', dbId).single());
  return mapOrder(row);
};

// --- Returns ---
export const getReturnsForUser = async (userId) => {
  if (!userId) return [];
  const rows = unwrap(
    await supabase.from('returns').select('id, return_number, order_id, order_item_id, reason, amount, status, created_at')
      .eq('user_id', userId).order('created_at', { ascending: false })
  );
  return rows.map((r) => ({
    id: r.return_number,
    orderDbId: Number(r.order_id),
    orderItemId: r.order_item_id === null ? null : Number(r.order_item_id),
    reason: r.reason,
    amount: Number(r.amount),
    status: r.status,
    createdAt: new Date(r.created_at).getTime(),
  }));
};

export const requestReturn = async (orderDbId, reason, orderItemId = null) => {
  await api.post(`/orders/${orderDbId}/return`, { reason, ...(orderItemId ? { orderItemId } : {}) });
};
