import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { couponLimiter, orderLimiter } from '../middleware/rateLimit.middleware.js';
import * as cart from '../services/cart.service.js';
import * as wishlist from '../services/wishlist.service.js';
import * as addresses from '../services/address.service.js';
import * as coupons from '../services/coupon.service.js';
import * as orders from '../services/order.service.js';
import { anonClient } from '../config/supabase.js';
import * as s from '../validators/schemas.js';
import { idParam, productIdParam, orderRefParam, pagination } from '../validators/common.js';
import { z } from 'zod';
import { created, ok } from '../utils/respond.js';

// Every route below acts on the SIGNED-IN user's own data. The user id comes from
// the verified token (req.user.id); no route accepts a user id from the client.
const router = Router();

// ----------------------------------------------------------------- cart
router.get('/cart', requireAuth, async (req, res) => ok(res, await cart.getCart(req.db, req.user.id)));

router.post('/cart/items', requireAuth, validate({ body: s.cartAddBody }), async (req, res) => {
  const { productId, qty } = req.valid.body;
  created(res, await cart.addItem(req.db, req.user.id, productId, qty));
});

router.post('/cart/merge', requireAuth, validate({ body: s.cartMergeBody }), async (req, res) => {
  ok(res, await cart.mergeCart(req.db, req.user.id, req.valid.body.items));
});

router.patch('/cart/items/:productId', requireAuth, validate({ params: productIdParam, body: s.cartSetBody }), async (req, res) => {
  ok(res, await cart.setItemQty(req.db, req.user.id, req.valid.params.productId, req.valid.body.qty));
});

router.delete('/cart/items/:productId', requireAuth, validate({ params: productIdParam }), async (req, res) => {
  ok(res, await cart.removeItem(req.db, req.user.id, req.valid.params.productId));
});

router.delete('/cart', requireAuth, async (req, res) => ok(res, await cart.clearCart(req.db, req.user.id)));

// -------------------------------------------------------------- wishlist
router.get('/wishlist', requireAuth, async (req, res) => ok(res, await wishlist.listWishlist(req.db, req.user.id)));

router.get('/wishlist/:productId/check', requireAuth, validate({ params: productIdParam }), async (req, res) => {
  ok(res, await wishlist.isWishlisted(req.db, req.user.id, req.valid.params.productId));
});

router.post('/wishlist/:productId', requireAuth, validate({ params: productIdParam }), async (req, res) => {
  created(res, await wishlist.addToWishlist(req.db, req.user.id, req.valid.params.productId));
});

router.delete('/wishlist/:productId', requireAuth, validate({ params: productIdParam }), async (req, res) => {
  ok(res, await wishlist.removeFromWishlist(req.db, req.user.id, req.valid.params.productId));
});

// ------------------------------------------------------------- addresses
router.get('/addresses', requireAuth, async (req, res) => ok(res, await addresses.listAddresses(req.db, req.user.id)));

router.post('/addresses', requireAuth, validate({ body: s.addressCreateBody }), async (req, res) => {
  created(res, await addresses.createAddress(req.db, req.user.id, req.valid.body));
});

router.patch('/addresses/:id', requireAuth, validate({ params: idParam, body: s.addressUpdateBody }), async (req, res) => {
  ok(res, await addresses.updateAddress(req.db, req.user.id, req.valid.params.id, req.valid.body));
});

router.delete('/addresses/:id', requireAuth, validate({ params: idParam }), async (req, res) => {
  ok(res, await addresses.deleteAddress(req.db, req.user.id, req.valid.params.id));
});

// --------------------------------------------------------------- coupons
// Public on purpose: guests can preview a coupon on their local cart. The
// client sends product ids + quantities only; prices/discount come from the DB.
router.post('/coupons/validate', couponLimiter, validate({ body: s.couponValidateBody }), async (req, res) => {
  let db = anonClient;
  let userCart;
  if (!req.valid.body.items) {
    // No items sent: fall back to the signed-in user's server cart (401 if not signed in).
    await requireAuth(req, res, () => {});
    db = req.db;
    const cartRows = await cart.getCart(db, req.user.id);
    userCart = cartRows.items.map((i) => ({ productId: i.productId, qty: i.qty }));
  }
  ok(res, await coupons.validateCoupon(db, req.valid.body, userCart));
});

// ---------------------------------------------------------------- orders
router.post('/orders', requireAuth, orderLimiter, validate({ body: s.orderCreateBody }), async (req, res) => {
  created(res, await orders.createOrder(req.db, req.user.id, req.valid.body));
});

router.get('/orders', requireAuth, validate({ query: s.orderListQuery }), async (req, res) => {
  const { orders: list, meta } = await orders.listOrders(req.db, req.user.id, req.valid.query);
  ok(res, list, meta);
});

router.get('/orders/:id/status', requireAuth, validate({ params: orderRefParam }), async (req, res) => {
  ok(res, await orders.getOrderStatus(req.db, req.user.id, req.valid.params.id));
});

router.get('/orders/:id', requireAuth, validate({ params: orderRefParam }), async (req, res) => {
  ok(res, await orders.getOrder(req.db, req.user.id, req.valid.params.id));
});

router.post('/orders/:id/reorder', requireAuth, validate({ params: orderRefParam }), async (req, res) => {
  ok(res, await orders.reorder(req.db, req.user.id, req.valid.params.id));
});

router.post('/orders/:id/return', requireAuth, validate({ params: orderRefParam, body: s.returnCreateBody }), async (req, res) => {
  created(res, await orders.requestReturn(req.db, req.user.id, req.valid.params.id, req.valid.body));
});

// --------------------------------------------------------------- returns
const returnRef = z.object({ id: z.string().trim().regex(/^(RET\d{1,12}|\d{1,15})$/, 'Invalid return id') });

router.get('/returns', requireAuth, validate({ query: z.object(pagination(20, 50)) }), async (req, res) => {
  const { returns, meta } = await orders.listReturns(req.db, req.user.id, req.valid.query);
  ok(res, returns, meta);
});

router.get('/returns/:id', requireAuth, validate({ params: returnRef }), async (req, res) => {
  ok(res, await orders.getReturn(req.db, req.user.id, req.valid.params.id));
});

export default router;
