// GET /booking/callback?reference=SS...
// This is where Paystack sends the guest after they pay (and where our own
// demo mode sends them when no key is configured).
//
// The redirect proves nothing on its own: we ask Paystack directly whether
// the money arrived, then re-check the dates, then confirm.
import type { APIRoute } from 'astro';
import {
  db,
  getBookingByReference,
  markPaymentStatus,
  updateBookingStatus,
} from '../../lib/db.ts';
import { findConflict } from '../../lib/availability.ts';
import { hasPaystackKey, verifyPayment, type VerificationResult } from '../../lib/paystack.ts';

function redirectTo(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}

export const GET: APIRoute = async ({ url }) => {
  const reference = (url.searchParams.get('reference') ?? '').trim();
  if (reference === '') {
    return new Response('Missing payment reference', { status: 400 });
  }

  const booking = getBookingByReference(reference);
  if (!booking) {
    return new Response('We do not know that booking reference.', { status: 404 });
  }

  // Already settled (for example the guest refreshed the page): just show it.
  if (booking.status === 'confirmed' || booking.status === 'conflict') {
    return redirectTo(`/booking/${encodeURIComponent(reference)}`);
  }

  const demoMode = !hasPaystackKey();

  if (!demoMode) {
    /* -------- really check the payment with Paystack -------- */
    let verification: VerificationResult;
    try {
      verification = await verifyPayment(reference);
    } catch {
      // We do not know yet - leave the booking pending and say so.
      return redirectTo(`/booking/${encodeURIComponent(reference)}?notice=verify-error`);
    }

    if (verification.status === 'pending') {
      return redirectTo(`/booking/${encodeURIComponent(reference)}?notice=payment-pending`);
    }

    if (verification.status !== 'success') {
      db.transaction(() => {
        markPaymentStatus(booking.id, 'failed');
        updateBookingStatus(booking.id, 'cancelled');
      })();
      return redirectTo(`/booking/${encodeURIComponent(reference)}?notice=payment-failed`);
    }

    // Paystack says the money arrived. Make sure it is the right amount -
    // otherwise somebody could pay 1 kobo for a whole week.
    if (verification.amountKobo !== booking.total_amount) {
      return redirectTo(
        `/booking/${encodeURIComponent(reference)}?notice=amount-mismatch`
      );
    }
  } else {
    /* -------- demo mode: no key in .env, so "pretend" it was paid -------- */
    markPaymentStatus(booking.id, 'success');
  }

  /* -------- the dates are checked AGAIN, inside one transaction -------- */
  // The guest could have been slow at the checkout, and in that time another
  // guest may have booked the same nights. If so, this booking becomes a
  // conflict and the host deals with the refund by hand.
  db.transaction(() => {
    const conflict = findConflict(booking.apartment_id, booking.check_in, booking.check_out);
    if (conflict) {
      updateBookingStatus(booking.id, 'conflict');
    } else {
      updateBookingStatus(booking.id, 'confirmed');
      markPaymentStatus(booking.id, 'success');
    }
  })();

  return redirectTo(`/booking/${encodeURIComponent(reference)}`);
};
