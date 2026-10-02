import { unwrap } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// Payment architecture (Razorpay NOT implemented yet - by design)
//
// Today:
//   * place_order() creates a `payments` row (status 'Pending') for every order.
//   * COD becomes 'Paid' automatically when an admin marks the order Delivered.
//   * Card/UPI stay 'Pending'. A database trigger refuses to let ANY client or
//     admin set them to 'Paid': only the service role can.
//
// Razorpay stage (later):
//   React -> POST /api/v1/orders/:id/payment  -> Express creates a Razorpay order
//            (secret key stays on the server) and stores provider_order_id
//   React -> Razorpay Checkout -> user pays
//   Razorpay -> POST /api/v1/webhooks/razorpay (raw body, HMAC signature verified)
//            -> Express uses serviceClient() to set payments.status='Paid',
//               provider_payment_id, paid_at and moves the order to 'Confirmed'.
//   Never trust a "payment succeeded" message from the browser.
// ---------------------------------------------------------------------------

export const getPaymentForOrder = async (db, orderDbId) =>
  unwrap(
    await db
      .from('payments')
      .select('id, method, status, amount, provider, provider_order_id, provider_payment_id, paid_at, created_at')
      .eq('order_id', orderDbId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  );
