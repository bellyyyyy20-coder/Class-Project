// Availability: the rule that makes double bookings impossible.
//
// A night is "taken" when a CONFIRMED booking covers it. The check-out day is
// not a booked night, so a new guest can arrive the same day the previous
// guest leaves (same-day turnover).
import { query } from './db.ts';
import { addDays } from './dates.ts';

/**
 * The one and only overlap rule, used everywhere.
 *
 * Two date ranges overlap when the new one starts before the old one ends,
 * AND the new one ends after the old one starts:
 *
 *   new.checkIn < existing.checkOut  AND  new.checkOut > existing.checkIn
 *
 * YYYY-MM-DD strings compare correctly with < and > (10 Mar is before 11 Mar).
 */
export function rangesOverlap(
  newCheckIn: string,
  newCheckOut: string,
  existingCheckIn: string,
  existingCheckOut: string
): boolean {
  return newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
}

export interface Conflict {
  id: number;
  reference: string;
  guest_name: string;
  check_in: string;
  check_out: string;
}

/**
 * Returns the confirmed booking that blocks these dates, if any.
 * This is the server-side check: even if someone skips the date picker,
 * the database refuses the overlapping booking.
 */
export async function findConflict(
  apartmentId: number,
  checkIn: string,
  checkOut: string
): Promise<Conflict | undefined> {
  const confirmedBookings = await query<Conflict>(
    `SELECT id, reference, guest_name, check_in, check_out
       FROM bookings WHERE apartment_id = $1 AND status = 'confirmed'`,
    [apartmentId]
  );
  return confirmedBookings.find((booking) =>
    rangesOverlap(checkIn, checkOut, booking.check_in, booking.check_out)
  );
}

/** True when nobody has confirmed these dates yet. */
export async function isRangeAvailable(
  apartmentId: number,
  checkIn: string,
  checkOut: string
): Promise<boolean> {
  return (await findConflict(apartmentId, checkIn, checkOut)) === undefined;
}

/**
 * Every night (YYYY-MM-DD) that is already booked between `from` and `to`.
 * The check-out day is excluded on purpose.
 */
export async function getBookedNights(apartmentId: number, from: string, to: string): Promise<string[]> {
  const bookings = await query<{ check_in: string; check_out: string }>(
    `SELECT check_in, check_out FROM bookings
      WHERE apartment_id = $1 AND status = 'confirmed'
        AND check_in < $2 AND check_out > $3`,
    [apartmentId, to, from]
  );

  const nights: string[] = [];
  for (const booking of bookings) {
    // Start at the later of the booking start or the window start.
    let night = booking.check_in > from ? booking.check_in : from;
    // Walk night by night up to (but not including) the check-out day.
    while (night < booking.check_out && night < to) {
      nights.push(night);
      night = addDays(night, 1);
    }
  }
  return nights.sort();
}
