// GET /api/availability/lekki-suite
// Returns the booked nights for one apartment as JSON. The date picker on the
// booking panel loads this so booked days can be greyed out.
//
// This is for display only. The real protection is the server check in
// src/lib/availability.ts, which runs when a booking is created and again
// when payment is verified.
// This file is inside src/pages/api/availability/, so we go up three folders.
import type { APIRoute } from 'astro';
import { getApartmentBySlug } from '../../../lib/db.ts';
import { getBookedNights } from '../../../lib/availability.ts';
import { addDays, todayString } from '../../../lib/dates.ts';

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug ?? '';
  const apartment = getApartmentBySlug(slug);

  if (!apartment) {
    return json({ error: 'Apartment not found' }, 404);
  }

  const today = todayString();
  // Look one year ahead - that is far enough for a date picker.
  const oneYearAhead = addDays(today, 365);
  const nights = getBookedNights(apartment.id, today, oneYearAhead);

  return json({
    apartment: apartment.slug,
    today,
    nights,
    pricePerNight: apartment.price_per_night, // kobo
    maxGuests: apartment.max_guests,
  });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
