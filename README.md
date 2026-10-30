# ShortStay

A fast direct-booking website for a shortlet apartment owner. Guests browse
apartments, pick dates, and pay with Paystack (test mode). The host sees a
calendar. **Booked dates are blocked, so double bookings cannot happen.**

Built with Astro (server-rendered pages), Neon PostgreSQL for persistent
bookings, flatpickr for the date picker, and self-hosted fonts. Almost no
JavaScript is sent to the browser.

---

## Run it

You need Node.js 20 or newer (check with `node --version`).

```bash
npm install      # install the packages (first time only)
cp .env.example .env   # then add your Neon connection string (see below)
npm run seed     # create the Neon tables and fill them with sample data
npm run dev      # start the site at http://localhost:4321
```

Other commands:

```bash
npm run build    # production build (output in dist/)
npm run preview  # run the production build locally
```

---

## `.env` - what goes in it

Copy `.env.example` to `.env` and fill it in. This file is **secret** and is
already listed in `.gitignore`, so it is never committed.

| Key | What it is |
|---|---|
| `DATABASE_URL` | Your Neon PostgreSQL connection string. Keep it private. |
| `PAYSTACK_SECRET_KEY` | Your **test** secret key from the Paystack dashboard (starts with `sk_test_`). Keep it empty to run in **demo payment mode**. |
| `HOST_PASSWORD` | The password you use to open `/host`. |
| `SITE_URL` | Where the site runs, e.g. `http://localhost:4321`. Paystack redirects guests back here. |
| `RESEND_API_KEY` | Not used yet (stretch goal). |

> The secret key is only ever used on the server. It is never sent to the
> browser.

For Vercel, add `DATABASE_URL` and `HOST_PASSWORD` in **Project Settings → Environment Variables**. Add a Paystack **test** key only if you want hosted test checkout; with no Paystack key, the site uses demo payment mode.

### Demo payment mode

If `PAYSTACK_SECRET_KEY` is empty, the site still completes a booking, but it
confirms it locally instead of taking a payment, and the confirmation page
shows a clear **DEMO PAYMENT** box. Put a real test key in `.env` and the
Paystack checkout is used instead - no code changes needed.

---

## How to test it

### Booking (no payment needed)

1. Open http://localhost:4321 and click an apartment.
2. In the booking panel, click **Your dates** and pick a check-in and a
   check-out (greyed-out days are already booked).
3. Fill in name, email, phone and number of guests. The total updates as you
   pick dates.
4. Click **Continue to payment**.
5. You land on the confirmation page with a reference code such as
   `SSML3K9P2A`.

### Payment

- **With no key (demo mode):** step 5 above confirms the booking straight away
  and the page shows the DEMO PAYMENT box.
- **With a Paystack test key:** step 5 takes you to Paystack's checkout. Pay
  with test card **4084 0840 8408 4081**, any future expiry date, and CVV
  `408`. Paystack sends the guest back to `/booking/callback`, which verifies
  the payment with Paystack **before** the booking is confirmed.

### Double booking (the important test)

1. Book an apartment for, say, 10 - 14 of next month and finish the booking.
2. Open the same apartment again: those days are now greyed out in the picker.
3. Try to force a booking anyway by opening this address in your browser
   (change the dates, name and slug):

   ```
   http://localhost:4321/api/availability/lekki-suite
   ```

   That shows the blocked nights as JSON.
4. If you send the booking form with dates that overlap (for example by using
   your browser's developer tools, or a second browser), the server refuses it
   and the page says: *"Sorry, those dates were just booked by someone else."*

The rule lives in one function, `rangesOverlap` in `src/lib/availability.ts`,
and is checked **twice**: when the booking is created and again when the
payment is verified - both times inside a database transaction.

### Host calendar

1. Go to http://localhost:4321/host - you are sent to the login page.
2. Password: the `HOST_PASSWORD` from your `.env` (the example file uses
   `shortstay-host`).
3. Pick an apartment and move between months. Booked nights are shown in soft
   blue with the guest's name. The table underneath lists every booking with
   its status.

---

## What is where

```
db/
  schema.sql       database tables
  seed.ts          sample data (run with npm run seed)
  shortstay.db     the SQLite file (created by seed, not committed)
public/images/     apartment photos (1200x900, from Unsplash's free library)
src/
  components/      ApartmentCard, BookingPanel, Header, Footer
  layouts/         Layout.astro - the shell every page uses
  lib/
    availability.ts  the overlap rule + booked-night lookups
    auth.ts          host login (signed, httpOnly cookie)
    db.ts            database connection and small query helpers
    dates.ts         YYYY-MM-DD date helpers
    env.ts           reads .env at runtime
    money.ts         kobo <-> Naira
    paystack.ts      Paystack initialise + verify (server only)
  pages/
    index. apartment list
    apartments/[slug].astro   detail page with booking panel
    book.ts                   POST: validate, create pending booking, start payment
    booking/callback.ts       verify payment, confirm booking
    booking/[reference].astro confirmation page
    api/availability/[slug].ts  booked nights as JSON
    host/login.astro, host/session.ts, host/index.astro, host/logout.ts
  styles/
    global.css              colours, typography, buttons, cards, forms
    flatpickr-overrides.css date picker colours
```

## Rules worth knowing

- **Money is stored in kobo** (whole numbers), and only converted to Naira for
  display.
- **Dates are `YYYY-MM-DD` strings.** The check-out day is *not* a booked
  night, so a new guest can arrive the same day the previous one leaves.
- **Only `confirmed` bookings block dates.** A pending booking never holds
  nights, because nobody should be able to block a calendar by not paying.
- **Payments are never trusted from the redirect alone** - the server asks
  Paystack directly, and checks the amount matches the booking.
- **All SQL uses `?` placeholders**, so form input can never become SQL code.
- All form input is validated on the server, even though the browser validates
  it too.

## Photo credits

Apartment photos are from [Unsplash](https://unsplash.com/license) (free to
use). Replace them with real photos of your apartments in `public/images/`
and update the `photos` column via `db/seed.ts`.
