import { z } from 'zod';

export const id = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const qty = z.coerce.number().int().min(1).max(99);
export const phone = z.string().trim().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone number');
export const pincode = z.string().trim().regex(/^[0-9]{6}$/, 'Enter a valid 6-digit pincode');
export const email = z.string().trim().max(254).regex(/^\S+@\S+\.\S+$/, 'Enter a valid email');
export const couponCode = z.string().trim().min(1).max(40).transform((c) => c.toUpperCase());

export const idParam = z.object({ id });
export const productIdParam = z.object({ productId: id });

// "SC10000001" (order number) or a numeric database id
export const orderRef = z
  .string()
  .trim()
  .regex(/^(SC\d{6,12}|\d{1,15})$/, 'Invalid order id');
export const orderRefParam = z.object({ id: orderRef });

export const pagination = (defaultLimit = 20, maxLimit = 100) => ({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(maxLimit).default(defaultLimit),
});

export const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

export const ORDER_STATUSES = [
  'Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned',
];
