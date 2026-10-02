// DB rows -> the camelCase JSON shapes the frontend already uses.
const num = (v) => (v === null || v === undefined ? v : Number(v));

export const mapProduct = (r) => ({
  id: num(r.id),
  name: r.name,
  title: r.title,
  description: r.title,
  price: num(r.price),
  originalPrice: num(r.original_price),
  discount: num(r.discount_percent),
  image: r.image,
  category: r.category,
  categoryId: num(r.category_id),
  stockCount: num(r.stock_count),
  inStock: num(r.stock_count) > 0,
  rating: num(r.rating),
  reviewCount: num(r.review_count),
  specifications: r.specs || {},
  isBestSeller: !!r.is_best_seller,
  isTrending: !!r.is_trending,
  isFlashDeal: num(r.discount_percent) >= 20,
  isActive: !!r.is_active,
  updatedAt: r.updated_at,
});

export const mapCategory = (r) => ({
  id: num(r.id),
  name: r.name,
  icon: r.icon,
  description: r.description,
  status: r.status,
  sortOrder: num(r.sort_order),
});

export const mapAddress = (r) => ({
  id: num(r.id),
  label: r.label,
  line1: r.line1,
  city: r.city,
  pincode: r.pincode,
  phone: r.phone,
});

export const mapCoupon = (r) => ({
  id: num(r.id),
  code: r.code,
  type: r.type,
  value: num(r.value),
  minOrder: num(r.min_order),
  maxDiscount: num(r.max_discount),
  expiry: r.expiry,
  usageLimit: num(r.usage_limit),
  usedCount: num(r.used_count),
  status: r.status,
});

export const ORDER_SELECT =
  '*, order_items(id, product_id, name, image, price, qty), order_status_history(status, created_at), payments(id, method, status, amount, paid_at, provider_payment_id, created_at)';

export const mapOrder = (o) => {
  const p = (o.payments || [])[0];
  return {
    id: o.order_number,
    dbId: num(o.id),
    userId: o.user_id,
    status: o.status,
    items: (o.order_items || []).map((i) => ({
      itemId: num(i.id),
      productId: i.product_id === null ? null : num(i.product_id),
      name: i.name,
      image: i.image,
      price: num(i.price),
      qty: num(i.qty),
    })),
    shipping: {
      fullName: o.ship_name,
      email: o.ship_email,
      phone: o.ship_phone,
      line1: o.ship_line1,
      city: o.ship_city,
      pincode: o.ship_pincode,
    },
    subtotal: num(o.subtotal),
    deliveryFee: num(o.delivery_fee),
    savings: num(o.savings),
    coupon: o.coupon_code ? { code: o.coupon_code, discount: num(o.coupon_discount) } : null,
    total: num(o.total),
    payment: p
      ? { method: p.method, status: p.status, paidAt: p.paid_at, providerPaymentId: p.provider_payment_id }
      : null,
    statusHistory: (o.order_status_history || [])
      .map((h) => ({ status: h.status, at: h.created_at }))
      .sort((a, b) => new Date(a.at) - new Date(b.at)),
    createdAt: o.created_at,
  };
};

export const mapReview = (r) => ({
  id: num(r.id),
  productId: num(r.product_id),
  author: r.author,
  rating: num(r.rating),
  text: r.text,
  status: r.status,
  createdAt: r.created_at,
});

export const mapReturn = (r) => ({
  id: r.return_number,
  dbId: num(r.id),
  orderId: r.orders?.order_number ?? null,
  orderDbId: num(r.order_id),
  orderItemId: r.order_item_id === null || r.order_item_id === undefined ? null : num(r.order_item_id),
  product: r.order_items?.name ?? null,
  customer: r.orders?.ship_name ?? null,
  reason: r.reason,
  amount: num(r.amount),
  status: r.status,
  createdAt: r.created_at,
});

export const range = ({ page, limit }) => [(page - 1) * limit, page * limit - 1];
export const pageMeta = ({ page, limit }, total) => ({ page, limit, total: total ?? 0, totalPages: Math.ceil((total ?? 0) / limit) });
