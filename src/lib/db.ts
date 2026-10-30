// Opens the SQLite database and provides small, safe query helpers.
// Every query uses ? placeholders, so user input can never become SQL code.
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface Apartment {
  id: number;
  slug: string;
  name: string;
  area: string;
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

function openDatabase(): Database.Database {
  const databaseFile = resolve(process.cwd(), 'db', 'shortstay.db');
  const database = new Database(databaseFile);

  // Foreign keys make SQLite enforce the relationships between tables.
  database.pragma('foreign_keys = ON');

  // Create the tables if they do not exist yet.
  const schema = readFileSync(resolve(process.cwd(), 'db', 'schema.sql'), 'utf8');
  database.exec(schema);

  return database;
}

// The dev server reloads code often, so keep one connection per process
// instead of opening a new file each time.
const globals = globalThis as unknown as { __shortstayDb?: ReturnType<typeof openDatabase> };
export const db = globals.__shortstayDb ?? (globals.__shortstayDb = openDatabase());

/* ------------------------------------------------------------------ */
/* Apartments                                                          */
/* ------------------------------------------------------------------ */

export function getApartments(): Apartment[] {
  return db.prepare('SELECT * FROM apartments ORDER BY id').all() as Apartment[];
}

export function getApartmentBySlug(slug: string): Apartment | undefined {
  return db.prepare('SELECT * FROM apartments WHERE slug = ?').get(slug) as
    | Apartment
    | undefined;
}

export function getApartmentById(id: number): Apartment | undefined {
  return db.prepare('SELECT * FROM apartments WHERE id = ?').get(id) as
    | Apartment
    | undefined;
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

export function createBooking(booking: NewBooking): number {
  const result = db
    .prepare(
      `INSERT INTO bookings
         (reference, apartment_id, guest_name, guest_email, guest_phone, guests,
          check_in, check_out, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    )
    .run(
      booking.reference,
      booking.apartmentId,
      booking.guestName,
      booking.guestEmail,
      booking.guestPhone,
      booking.guests,
      booking.checkIn,
      booking.checkOut,
      booking.totalAmount
    );
  return Number(result.lastInsertRowid);
}

export function getBookingByReference(reference: string): Booking | undefined {
  return db.prepare('SELECT * FROM bookings WHERE reference = ?').get(reference) as
    | Booking
    | undefined;
}

export function updateBookingStatus(bookingId: number, status: Booking['status']): void {
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, bookingId);
}

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export function createPayment(bookingId: number, paystackReference: string, amountKobo: number): void {
  db.prepare(
    `INSERT INTO payments (booking_id, paystack_reference, amount, status)
     VALUES (?, ?, ?, 'initiated')`
  ).run(bookingId, paystackReference, amountKobo);
}

export function markPaymentStatus(bookingId: number, status: 'success' | 'failed'): void {
  db.prepare('UPDATE payments SET status = ? WHERE booking_id = ?').run(status, bookingId);
}
