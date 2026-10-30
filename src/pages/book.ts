// POST /book
// Validates the booking form, creates a PENDING booking, and sends the guest
// to Paystack (or to our own demo callback when no key is configured yet).
//
// Nothing here confirms a booking. Only /booking/callback can do that, and
// only after Paystack says the money arrived.
// This file is inside src/pages/, so the libraries are one folder up.
import type { APIRoute } from 'astro';
import {
  getApartmentBySlug,
  createPendingBooking,
  markBookingCancelled,
} from '../lib/db.ts';
import { isValidDateString, nightsBetween, todayString } from '../lib/dates.ts';
import { hasPaystackKey, initializePayment } from '../lib/paystack.ts';
import { env } from '../lib/env.ts';

/** A short code like SSML3K9P2A that the guest can quote. */
function makeReference(): string {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SS${timePart}${randomPart}`;
}

/** Sends the guest back to the apartment page with an error code. */
function backWithError(slug: string, code: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/apartments/${encodeURIComponent(slug)}?error=${code}` },
  });
}

function redirectTo(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const text = (name: string) => String(form.get(name) ?? '').trim();

  const slug = text('slug');
  const guestName = text('guest_name');
  const guestEmail = text('guest_email');
  const guestPhone = text('guest_phone');
  const guestsRaw = text('guests');
  const checkIn = text('check_in');
  const checkOut = text('check_out');

  const apartment = await getApartmentBySlug(slug);
  if (!apartment) {
    return new Response('Apartment not found', { status: 404 });
  }

  /* ---------------- validation (never trust the form) ---------------- */
  if (guestName.length < 2 || guestPhone.length < 7) {
    return backWithError(slug, 'missing-fields');
  }
  // A simple but solid email check: something@something.something
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
    return backWithError(slug, 'missing-fields');
  }

  const guests = Number(guestsRaw);
  if (!Number.isInteger(guests) || guests < 1) {
    return backWithError(slug, 'missing-fields');
  }
  if (guests > apartment.max_guests) {
    return backWithError(slug, 'too-many-guests');
  }

  if (!isValidDateString(checkIn) || !isValidDateString(checkOut)) {
    return backWithError(slug, 'invalid-dates');
  }
  if (checkIn < todayString()) {
    return backWithError(slug, 'past-date');
  }
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) {
    return backWithError(slug, 'bad-order');
  }

  // The price always comes from the database, never from the form.
  const totalAmount = nights * apartment.price_per_night;

  /* ---------------- create the pending booking ---------------- */
  const reference = makeReference();

  // The availability check and the insert happen together, so no other
  // request can slip a booking in between them.
  const bookingId = await createPendingBooking({
      reference,
      apartmentId: apartment.id,
      guestName,
      guestEmail,
      guestPhone,
      guests,
      checkIn,
      checkOut,
      totalAmount,
    });

  if (bookingId === null) {
    return backWithError(slug, 'dates-taken');
  }

  /* ---------------- hand the guest over to Paystack ---------------- */
  const siteUrl = env('SITE_URL').trim() || 'http://localhost:4321';

  if (!hasPaystackKey()) {
    // No key in .env yet: run the payment locally in demo mode so the whole
    // flow can be tested. This switches off by itself once a key exists.
    return redirectTo(`/booking/callback?reference=${encodeURIComponent(reference)}&demo=1`);
  }

  try {
    const authorizationUrl = await initializePayment({
      email: guestEmail,
      amountKobo: totalAmount,
      reference,
      callbackUrl: `${siteUrl}/booking/callback`,
    });
    return redirectTo(authorizationUrl);
  } catch {
    // Paystack would not start. Free the slot again so nobody is blocked.
    await markBookingCancelled(bookingId);
    return backWithError(slug, 'payment-failed');
  }
};
