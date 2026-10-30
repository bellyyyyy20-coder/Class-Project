// Connects to Neon, the hosted PostgreSQL database used by local and Vercel runs.
// DATABASE_URL is kept in .env locally and in Vercel's private environment settings.
import { neon } from '@neondatabase/serverless';
import { env } from './env.ts';

const databaseUrl = env('DATABASE_URL');
if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing. Add it to .env or the hosting environment.');
}

export const sql = neon(databaseUrl);

export async function query<Row = Record<string, unknown>>(
  statement: string,
  values: unknown[] = []
): Promise<Row[]> {
  return (await sql.query(statement, values)) as unknown as Row[];
}

export interface Apartment {
  id: number;
  slug: string;
  name: string;
  area: string;
  /** Room tier, e.g. "Suite". Matches a slug in src/lib/tiers.ts. */
  tier: string;
  description: string;
  price_per_night: number; // kobo
  max_guests: number;
  amenities: string; // comma separated
  house_rules: string;
  photos: string; // comma separated file names
}

export interface Booking {
  id: number;
  reference: string;
  apartment_id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guests: number;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD (this day is NOT a booked night)
  total_amount: number; // kobo
  status: 'pending' | 'confirmed' | 'conflict' | 'cancelled';
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Apartments                                                          */
/* ------------------------------------------------------------------ */

export async function getApartments(): Promise<Apartment[]> {
  return query<Apartment>('SELECT * FROM apartments ORDER BY id');
}

export async function getApartmentBySlug(slug: string): Promise<Apartment | undefined> {
  const rows = await query<Apartment>('SELECT * FROM apartments WHERE slug = $1', [slug]);
  return rows[0];
}

export async function getApartmentById(id: number): Promise<Apartment | undefined> {
  const rows = await query<Apartment>('SELECT * FROM apartments WHERE id = $1', [id]);
  return rows[0];
}

/* ------------------------------------------------------------------ */
/* Bookings                                                            */
/* ------------------------------------------------------------------ */

export interface NewBooking {
  reference: string;
  apartmentId: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
  checkIn: string;
  checkOut: string;
  totalAmount: number; // kobo
}

export async function createPendingBooking(booking: NewBooking): Promise<number | null> {
  // The advisory lock serializes attempts for the same apartment. The second
  // query then sees any booking committed while it waited for that lock.
  const [, paymentRows] = await sql.transaction((transactionSql) => [
    transactionSql`SELECT pg_advisory_xact_lock(${booking.apartmentId})`,
    transactionSql`
      WITH inserted AS (
        INSERT INTO bookings
          (reference, apartment_id, guest_name, guest_email, guest_phone, guests,
           check_in, check_out, total_amount, status)
        SELECT ${booking.reference}, ${booking.apartmentId}, ${booking.guestName},
               ${booking.guestEmail}, ${booking.guestPhone}, ${booking.guests},
               ${booking.checkIn}, ${booking.checkOut}, ${booking.totalAmount}, 'pending'
        WHERE NOT EXISTS (
          SELECT 1 FROM bookings
          WHERE apartment_id = ${booking.apartmentId}
            AND status = 'confirmed'
            AND check_in < ${booking.checkOut}
            AND check_out > ${booking.checkIn}
        )
        RETURNING id
      )
      INSERT INTO payments (booking_id, paystack_reference, amount, status)
      SELECT id, ${booking.reference}, ${booking.totalAmount}, 'initiated' FROM inserted
      RETURNING booking_id
    `,
  ]);

  const rows = paymentRows as { booking_id: number }[];
  return rows[0]?.booking_id ?? null;
}

export async function getBookingByReference(reference: string): Promise<Booking | undefined> {
  const rows = await query<Booking>('SELECT * FROM bookings WHERE reference = $1', [reference]);
  return rows[0];
}

export async function updateBookingStatus(bookingId: number, status: Booking['status']): Promise<void> {
  await query('UPDATE bookings SET status = $1 WHERE id = $2', [status, bookingId]);
}

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export async function markBookingCancelled(bookingId: number): Promise<void> {
  // One statement keeps the booking and payment statuses in step.
  await query(
    `WITH cancelled AS (
       UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING id
     )
     UPDATE payments SET status = 'failed'
     FROM cancelled WHERE payments.booking_id = cancelled.id`,
    [bookingId]
  );
}

export async function markPaymentStatus(bookingId: number, status: 'success' | 'failed'): Promise<void> {
  await query('UPDATE payments SET status = $1 WHERE booking_id = $2', [status, bookingId]);
}

export async function confirmBooking(booking: Booking): Promise<Booking['status'] | undefined> {
  // Lock by apartment, re-check dates after the lock, then update both records
  // inside one Neon transaction so concurrent payment callbacks cannot overlap.
  const [, settledRows] = await sql.transaction((transactionSql) => [
    transactionSql`SELECT pg_advisory_xact_lock(${booking.apartment_id})`,
    transactionSql`
      WITH updated AS (
        UPDATE bookings AS current_booking
        SET status = CASE WHEN EXISTS (
          SELECT 1 FROM bookings AS existing
          WHERE existing.apartment_id = current_booking.apartment_id
            AND existing.id <> current_booking.id
            AND existing.status = 'confirmed'
            AND current_booking.check_in < existing.check_out
            AND current_booking.check_out > existing.check_in
        ) THEN 'conflict' ELSE 'confirmed' END
        WHERE current_booking.id = ${booking.id}
          AND current_booking.status = 'pending'
        RETURNING id, status
      ), payment_update AS (
        UPDATE payments SET status = 'success'
        FROM updated WHERE payments.booking_id = updated.id
      )
      SELECT status FROM updated
    `,
  ]);

  const rows = settledRows as { status: Booking['status'] }[];
  return rows[0]?.status;
}

export interface HostBooking {
  id: number;
  reference: string;
  guest_name: string;
  guests: number;
  check_in: string;
  check_out: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export async function getBookingsForApartment(apartmentId: number): Promise<HostBooking[]> {
  return query<HostBooking>(
    `SELECT id, reference, guest_name, guests, check_in, check_out,
            total_amount, status, created_at
       FROM bookings WHERE apartment_id = $1 ORDER BY check_in`,
    [apartmentId]
  );
}
