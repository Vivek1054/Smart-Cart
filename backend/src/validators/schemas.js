import { z } from 'zod';
import * as c from './common.js';

// ------------------------------------------------------------------ catalog
export const productListQuery = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  minPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  maxPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  deals: c.bool.optional(),
  sort: z.enum(['default', 'price-asc', 'price-desc', 'rating-desc', 'name-asc', 'newest']).default('default'),
  ...c.pagination(50, 100),
});

// --------------------------------------------------------------------- cart
export const cartAddBody = z.object({ productId: c.id, qty: c.qty.default(1) });
export const cartSetBody = z.object({ qty: z.coerce.number().int().min(1).max(99) });
export const cartMergeBody = z.object({
  items: z.array(z.object({ productId: c.id, qty: c.qty })).max(100),
});

// ----------------------------------------------------------------- address
const addressFields = {
  label: z.string().trim().max(40).default(''),
  line1: z.string().trim().min(1, 'Address is required').max(200),
  city: z.string().trim().min(1, 'City is required').max(80),
  pincode: c.pincode,
  phone: c.phone.optional().nullable(),
};
export const addressCreateBody = z.object(addressFields).strict();
export const addressUpdateBody = z
  .object({
    label: addressFields.label.optional(),
    line1: addressFields.line1.optional(),
    city: addressFields.city.optional(),
    pincode: addressFields.pincode.optional(),
    phone: addressFields.phone,
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

// ------------------------------------------------------------------- coupon
export const couponValidateBody = z.object({
  code: c.couponCode,
  // Only product ids + quantities: the subtotal is always recomputed from DB prices.
  // If omitted, the signed-in user's server cart is used.
  items: z.array(z.object({ productId: c.id, qty: c.qty })).max(100).optional(),
});

// -------------------------------------------------------------------- order
export const orderCreateBody = z
  .object({
    shipping: z
      .object({
        fullName: z.string().trim().min(1).max(100),
        email: c.email,
        phone: c.phone,
        line1: z.string().trim().min(1).max(200),
        city: z.string().trim().min(1).max(80),
        pincode: c.pincode,
      })
      .strict(),
    couponCode: c.couponCode.optional().nullable(),
    paymentMethod: z.enum(['card', 'upi', 'cod']),
  })
  // .strict(): price / total / discount / userId fields are rejected outright.
  .strict();

export const orderListQuery = z.object({
  status: z.enum(c.ORDER_STATUSES).optional(),
  ...c.pagination(20, 50),
});

export const returnCreateBody = z
  .object({
    reason: z.string().trim().min(3).max(500),
    orderItemId: c.id.optional().nullable(),
  })
  .strict();

// ------------------------------------------------------------------- review
export const reviewCreateBody = z
  .object({
    rating: z.coerce.number().int().min(1).max(5),
    text: z.string().trim().min(1).max(1000),
  })
  .strict();
export const reviewUpdateBody = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    text: z.string().trim().min(1).max(1000).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');
export const reviewListQuery = z.object({ ...c.pagination(20, 50) });

// -------------------------------------------------------------------- admin
export const adminListQuery = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.string().trim().max(30).optional(),
  ...c.pagination(25, 100),
});

const productFields = {
  name: z.string().trim().min(1).max(120),
  title: z.string().trim().max(300),
  price: z.coerce.number().min(0).max(1_000_000),
  discountPercent: z.coerce.number().int().min(0).max(90),
  image: z.string().trim().max(1000),
  categoryId: c.id,
  stockCount: z.coerce.number().int().min(0).max(1_000_000),
  isActive: z.boolean(),
  isBestSeller: z.boolean(),
  isTrending: z.boolean(),
  specs: z.record(z.string().max(100), z.string().max(200)),
};
export const adminProductCreateBody = z
  .object({
    name: productFields.name,
    title: productFields.title.default(''),
    price: productFields.price,
    categoryId: productFields.categoryId,
    stockCount: productFields.stockCount.default(0),
    discountPercent: productFields.discountPercent.default(0),
    image: productFields.image.default(''),
    isActive: productFields.isActive.default(true),
    isBestSeller: productFields.isBestSeller.default(false),
    isTrending: productFields.isTrending.default(false),
    specs: productFields.specs.default({}),
  })
  .strict();
export const adminProductUpdateBody = z
  .object(Object.fromEntries(Object.entries(productFields).map(([k, v]) => [k, v.optional()])))
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const adminInventoryBody = z.object({ stockCount: productFields.stockCount }).strict();
export const adminInventoryQuery = z.object({
  filter: z.enum(['all', 'low', 'out']).default('all'),
  search: z.string().trim().max(100).optional(),
  ...c.pagination(50, 100),
});

export const adminOrderStatusBody = z.object({ status: z.enum(c.ORDER_STATUSES) }).strict();
export const adminReviewStatusBody = z.object({ status: z.enum(['Pending', 'Approved', 'Hidden']) }).strict();
export const adminReturnStatusBody = z
  .object({ status: z.enum(['Requested', 'Approved', 'Rejected', 'Completed']) })
  .strict();

const couponFields = {
  code: c.couponCode,
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().positive().max(100000),
  minOrder: z.coerce.number().min(0).max(1_000_000),
  maxDiscount: z.coerce.number().min(0).max(1_000_000),
  expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  usageLimit: z.coerce.number().int().min(0).max(10_000_000),
  status: z.enum(['Active', 'Inactive', 'Expired']),
};
const percentageCheck = (v) => !(v.type === 'percentage' && v.value !== undefined && v.value > 100);
export const adminCouponCreateBody = z
  .object({
    ...couponFields,
    minOrder: couponFields.minOrder.default(0),
    status: couponFields.status.default('Active'),
  })
  .strict()
  .refine(percentageCheck, 'A percentage coupon cannot exceed 100');
export const adminCouponUpdateBody = z
  .object(Object.fromEntries(Object.entries(couponFields).map(([k, v]) => [k, v.optional()])))
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update')
  .refine(percentageCheck, 'A percentage coupon cannot exceed 100');

const categoryFields = {
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().max(8),
  description: z.string().trim().max(300),
  status: z.enum(['Active', 'Inactive']),
  sortOrder: z.coerce.number().int().min(0).max(10000),
};
export const adminCategoryCreateBody = z
  .object({
    name: categoryFields.name,
    icon: categoryFields.icon.default('🍽️'),
    description: categoryFields.description.default(''),
    status: categoryFields.status.default('Active'),
    sortOrder: categoryFields.sortOrder.optional(),
  })
  .strict();
export const adminCategoryUpdateBody = z
  .object(Object.fromEntries(Object.entries(categoryFields).map(([k, v]) => [k, v.optional()])))
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const uuidParam = z.object({ id: z.string().uuid() });
