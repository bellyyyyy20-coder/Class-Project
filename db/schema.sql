-- ShortStay PostgreSQL schema (Neon).
-- Money is stored in kobo and dates stay as sortable YYYY-MM-DD text.

CREATE TABLE IF NOT EXISTS apartments (
  id               SERIAL PRIMARY KEY,
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
  id             SERIAL PRIMARY KEY,
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
  created_at     TEXT NOT NULL DEFAULT to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')
);

-- These two indexes make the availability lookups fast.
CREATE INDEX IF NOT EXISTS idx_bookings_apartment_dates ON bookings(apartment_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(reference);

CREATE TABLE IF NOT EXISTS payments (
  id                 SERIAL PRIMARY KEY,
  booking_id         INTEGER NOT NULL REFERENCES bookings(id),
  paystack_reference TEXT NOT NULL,
  amount             INTEGER NOT NULL,             -- kobo
  status             TEXT NOT NULL DEFAULT 'initiated', -- initiated | success | failed
  created_at         TEXT NOT NULL DEFAULT to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')
);
