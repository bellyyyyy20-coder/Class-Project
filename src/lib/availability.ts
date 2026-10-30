// Availability: the rule that makes double bookings impossible.
//
// A night is "taken" when a CONFIRMED booking covers it. The check-out day is
// not a booked night, so a new guest can arrive the same day the previous
// guest leaves (same-day turnover).
import { db } from './db.ts';
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
export function findConflict(
  apartmentId: number,
  checkIn: string,
  checkOut: string
): Conflict | undefined {
  return db
    .prepare(
      `SELECT id, reference, guest_name, check_in, check_out
         FROM bookings
        WHERE apartment_id = ?
          AND status = 'confirmed'
          AND check_in < ?      -- existing.check_in < new.check_out
          AND check_out > ?     -- existing.check_out > new.check_in
        LIMIT 1`
    )
    .get(apartmentId, checkOut, checkIn) as Conflict | undefined;
}

/** True when nobody has confirmed these dates yet. */
export function isRangeAvailable(
  apartmentId: number,
  checkIn: string,
  checkOut: string
): boolean {
  return findConflict(apartmentId, checkIn, checkOut) === undefined;
}

/**
 * Every night (YYYY-MM-DD) that is already booked between `from` and `to`.
 * The check-out day is excluded on purpose.
 */
export function getBookedNights(apartmentId: number, from: string, to: string): string[] {
  const bookings = db
    .prepare(
      `SELECT check_in, check_out
         FROM bookings
        WHERE apartment_id = ?
          AND status = 'confirmed'
          AND check_in < ?      -- overlaps the window we asked about
          AND check_out > ?`
    )
    .all(apartmentId, to, from) as { check_in: string; check_out: string }[];

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
