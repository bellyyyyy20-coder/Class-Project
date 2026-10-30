-- ShortStay database schema
-- Money is stored in kobo (integers). Dates are text in YYYY-MM-DD format.
-- These statements run automatically when the app opens the database.

CREATE TABLE IF NOT EXISTS apartments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  area             TEXT NOT NULL,
  description      TEXT NOT NULL,
  price_per_night  INTEGER NOT NULL,              -- kobo
  max_guests       INTEGER NOT NULL,
  amenities        TEXT NOT NULL DEFAULT '',      -- comma separated
  house_rules      TEXT NOT NULL DEFAULT '',
  photos           TEXT NOT NULL DEFAULT ''       -- comma separated file names
);

CREATE TABLE IF NOT EXISTS bookings (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  reference      TEXT NOT NULL UNIQUE,            -- code shown to the guest
  apartment_id   INTEGER NOT NULL REFERENCES apartments(id),
  guest_name     TEXT NOT NULL,
  guest_email    TEXT NOT NULL,
  guest_phone    TEXT NOT NULL,
  guests         INTEGER NOT NULL,
  check_in       TEXT NOT NULL,                   -- YYYY-MM-DD
  check_out      TEXT NOT NULL,                   -- YYYY-MM-DD (this night is NOT booked)
  total_amount   INTEGER NOT NULL,                -- kobo
  status         TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | conflict | cancelled
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- These two indexes make the availability lookups fast.
CREATE INDEX IF NOT EXISTS idx_bookings_apartment_dates ON bookings(apartment_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(reference);

CREATE TABLE IF NOT EXISTS payments (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id         INTEGER NOT NULL REFERENCES bookings(id),
  paystack_reference TEXT NOT NULL,
  amount             INTEGER NOT NULL,             -- kobo
  status             TEXT NOT NULL DEFAULT 'initiated', -- initiated | success | failed
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
