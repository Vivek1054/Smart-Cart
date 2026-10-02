import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as admin from '../services/admin.service.js';
import * as s from '../validators/schemas.js';
import { idParam, orderRefParam } from '../validators/common.js';
import { created, ok } from '../utils/respond.js';

// Everything under /api/v1/admin requires a verified token AND profiles.role = 'admin'.
// (RLS in Postgres enforces the same rule independently.)
const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/dashboard', async (req, res) => ok(res, await admin.dashboard(req.db)));

// ------------------------------------------------------------- customers
router.get('/customers', validate({ query: s.adminListQuery }), async (req, res) => {
  const { customers, meta } = await admin.listCustomers(req.db, req.valid.query);
  ok(res, customers, meta);
});
router.get('/customers/:id', validate({ params: s.uuidParam }), async (req, res) => {
  ok(res, await admin.getCustomer(req.db, req.valid.params.id));
});
router.patch(
  '/customers/:id/status',
  validate({ params: s.uuidParam, body: z.object({ status: z.enum(['Active', 'Blocked']) }).strict() }),
  async (req, res) => ok(res, await admin.setCustomerStatus(req.db, req.valid.params.id, req.valid.body.status))
);

// ---------------------------------------------------------------- orders
router.get('/orders', validate({ query: s.adminListQuery }), async (req, res) => {
  const { orders, meta } = await admin.listOrders(req.db, req.valid.query);
  ok(res, orders, meta);
});
router.get('/orders/:id', validate({ params: orderRefParam }), async (req, res) => {
  ok(res, await admin.getOrder(req.db, req.valid.params.id));
});
router.patch('/orders/:id/status', validate({ params: orderRefParam, body: s.adminOrderStatusBody }), async (req, res) => {
  ok(res, await admin.setOrderStatus(req.db, req.valid.params.id, req.valid.body.status));
});

// -------------------------------------------------------------- products
router.get('/products', validate({ query: s.adminListQuery }), async (req, res) => {
  const { products, meta } = await admin.listProducts(req.db, req.valid.query);
  ok(res, products, meta);
});
router.post('/products', validate({ body: s.adminProductCreateBody }), async (req, res) => {
  created(res, await admin.createProduct(req.db, req.valid.body));
});
router.patch('/products/:id', validate({ params: idParam, body: s.adminProductUpdateBody }), async (req, res) => {
  ok(res, await admin.updateProduct(req.db, req.valid.params.id, req.valid.body));
});
router.delete('/products/:id', validate({ params: idParam }), async (req, res) => {
  ok(res, await admin.deleteProduct(req.db, req.valid.params.id));
});

// ------------------------------------------------------------- inventory
router.get('/inventory', validate({ query: s.adminInventoryQuery }), async (req, res) => {
  const { items, meta } = await admin.listInventory(req.db, req.valid.query);
  ok(res, items, meta);
});
router.patch('/inventory/:id', validate({ params: idParam, body: s.adminInventoryBody }), async (req, res) => {
  ok(res, await admin.setStock(req.db, req.valid.params.id, req.valid.body.stockCount));
});

// ------------------------------------------------------------ categories
router.get('/categories', async (req, res) => ok(res, await admin.listCategories(req.db)));
router.post('/categories', validate({ body: s.adminCategoryCreateBody }), async (req, res) => {
  created(res, await admin.createCategory(req.db, req.valid.body));
});
router.patch('/categories/:id', validate({ params: idParam, body: s.adminCategoryUpdateBody }), async (req, res) => {
  ok(res, await admin.updateCategory(req.db, req.valid.params.id, req.valid.body));
});
router.delete('/categories/:id', validate({ params: idParam }), async (req, res) => {
  ok(res, await admin.deleteCategory(req.db, req.valid.params.id));
});

// --------------------------------------------------------------- reviews
router.get('/reviews', validate({ query: s.adminListQuery }), async (req, res) => {
  const { reviews, meta } = await admin.listReviews(req.db, req.valid.query);
  ok(res, reviews, meta);
});
router.patch('/reviews/:id', validate({ params: idParam, body: s.adminReviewStatusBody }), async (req, res) => {
  ok(res, await admin.setReviewStatus(req.db, req.valid.params.id, req.valid.body.status));
});

// -------------------------------------------------------------- payments
router.get('/payments', validate({ query: s.adminListQuery }), async (req, res) => {
  const { payments, meta } = await admin.listPayments(req.db, req.valid.query);
  ok(res, payments, meta);
});

// --------------------------------------------------------------- returns
router.get('/returns', validate({ query: s.adminListQuery }), async (req, res) => {
  const { returns, meta } = await admin.listReturns(req.db, req.valid.query);
  ok(res, returns, meta);
});
router.patch('/returns/:id', validate({ params: idParam, body: s.adminReturnStatusBody }), async (req, res) => {
  ok(res, await admin.setReturnStatus(req.db, req.valid.params.id, req.valid.body.status));
});

// --------------------------------------------------------------- coupons
router.get('/coupons', async (req, res) => ok(res, await admin.listCoupons(req.db)));
router.post('/coupons', validate({ body: s.adminCouponCreateBody }), async (req, res) => {
  created(res, await admin.createCoupon(req.db, req.valid.body));
});
router.patch('/coupons/:id', validate({ params: idParam, body: s.adminCouponUpdateBody }), async (req, res) => {
  ok(res, await admin.updateCoupon(req.db, req.valid.params.id, req.valid.body));
});
router.delete('/coupons/:id', validate({ params: idParam }), async (req, res) => {
  ok(res, await admin.deleteCoupon(req.db, req.valid.params.id));
});

export default router;
