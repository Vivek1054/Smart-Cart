import { Router } from 'express';
import { anonClient } from '../config/supabase.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as catalog from '../services/catalog.service.js';
import * as reviews from '../services/review.service.js';
import * as s from '../validators/schemas.js';
import { idParam, productIdParam } from '../validators/common.js';
import { created, ok } from '../utils/respond.js';

const router = Router();

// ---- public (anon client => RLS only exposes active products/categories) ----
router.get('/products', validate({ query: s.productListQuery }), async (req, res) => {
  const { products, meta } = await catalog.listProducts(anonClient, req.valid.query);
  ok(res, products, meta);
});

router.get('/products/:id', validate({ params: idParam }), async (req, res) => {
  ok(res, await catalog.getProduct(anonClient, req.valid.params.id));
});

router.get('/categories', async (_req, res) => {
  ok(res, await catalog.listCategories(anonClient));
});

router.get('/products/:productId/reviews', validate({ params: productIdParam, query: s.reviewListQuery }), async (req, res) => {
  const { reviews: list, meta } = await catalog.listApprovedReviews(anonClient, req.valid.params.productId, req.valid.query);
  ok(res, list, meta);
});

// ---- authenticated: write reviews (always created as Pending) ----
router.post(
  '/products/:productId/reviews',
  requireAuth,
  validate({ params: productIdParam, body: s.reviewCreateBody }),
  async (req, res) => {
    created(res, await reviews.createReview(req.db, req.user.id, req.valid.params.productId, req.valid.body));
  }
);

router.patch('/reviews/:id', requireAuth, validate({ params: idParam, body: s.reviewUpdateBody }), async (req, res) => {
  ok(res, await reviews.updateOwnReview(req.db, req.user.id, req.valid.params.id, req.valid.body));
});

export default router;
