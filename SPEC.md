# ShortStay: Project Spec

A fast direct-booking website for a shortlet apartment owner. Guests browse apartments, pick dates, and pay. The host sees a calendar. Booked dates are blocked so double bookings cannot happen.

This is a portfolio/practice project. Payments run in Paystack **test mode** only.

## 1. The problem
Bookings happen over Instagram DMs, which leads to double bookings and lost messages.

## 2. Users
- **Guest**: browses apartments, picks dates, books and pays.
- **Host**: views bookings on a calendar (protected by a simple password).

## 3. Goal for this build
Ship a working version in **one day**. Be fast (Astro, little JavaScript), clean, and correct about availability.

## 4. Features

### Must have (MVP)
1. **Apartment list** (home page): cards with photo, name, area, price per night.
2. **Apartment detail page**: photo gallery, description, amenities, **house rules**, price, booking panel.
3. **Date picker**: guest selects check-in and check-out. Booked dates are greyed out and cannot be picked. Minimum stay is 1 night.
4. **Booking form**: name, email, phone, number of guests. Shows total price.
5. **Pay (test)**: Paystack test checkout. After payment is verified, the booking becomes `confirmed`.
6. **Confirmation page**: booking summary and reference code.
7. **Host calendar** (`/host`): password login, pick an apartment, month view with booked days highlighted and guest names, plus a bookings list.
8. **Special feature: calendar blocks booked dates.** Confirmed bookings block those nights on the guest date picker, and the server rejects overlapping bookings even if someone bypasses the UI.

### Stretch goals (only if time remains)
- Check-in instructions email sent after payment (Resend).
- Host "add apartment" form.

## 5. Rules
- A night is "taken" if a **confirmed** booking covers it.
- **Same-day turnover is allowed**: a new guest can check in on the day the previous guest checks out.
- Two bookings overlap when `new.check_in < existing.check_out AND new.check_out > existing.check_in`.
- Minimum stay: 1 night. Check-out must be after check-in. No past dates.
- No payment hold: dates are not reserved while a guest is paying. Availability is checked when the booking is created **and again** when payment is verified. If the dates were taken in between, the booking is marked `conflict` and the guest sees a "sorry, those dates were just booked" page (manual refund in real life).
- Prices are stored in **kobo** (integers) and shown in Naira.

## 6. Data (SQLite)

**apartments**: id, slug, name, area, description, price_per_night (kobo), max_guests, amenities (text, comma separated), house_rules (text), photos (text, comma separated file names)

**bookings**: id, reference, apartment_id, guest_name, guest_email, guest_phone, guests, check_in (YYYY-MM-DD), check_out (YYYY-MM-DD), total_amount (kobo), status (`pending` | `confirmed` | `conflict` | `cancelled`), created_at

**payments**: id, booking_id, paystack_reference, amount (kobo), status (`initiated` | `success` | `failed`), created_at

Seed 3 apartments with 3 photos each, and a couple of sample bookings so the calendar is not empty.

## 7. Tech stack
| Need | Choice | Why |
|---|---|---|
| Framework | **Astro** (server output, `@astrojs/node` adapter) | Fast pages, ships almost no JS |
| Language | TypeScript (light use) | Helps the AI agent avoid mistakes |
| Database | **SQLite** via `better-sqlite3` | No account or server needed |
| Date picker | **flatpickr** (one small client script) | Supports disabled date ranges |
| Payments | **Paystack** (test keys) | Works with Naira |
| Fonts | `@fontsource` packages (self-hosted) | Faster than Google Fonts |
| Email (stretch) | Resend | Simple API |

## 8. Pages and routes
| Route | Purpose |
|---|---|
| `/` | Apartment list |
| `/apartments/[slug]` | Detail + booking panel |
| `/book` (POST) | Validate, create pending booking, start Paystack |
| `/booking/callback` | Verify payment with Paystack, confirm booking |
| `/booking/[reference]` | Confirmation page |
| `/api/availability/[slug]` | Returns booked date ranges as JSON for the date picker |
| `/host/login`, `/host` | Password login, calendar |

## 9. Environment variables (`.env`, never committed)
```
PAYSTACK_SECRET_KEY=sk_test_xxx
HOST_PASSWORD=choose-something
SITE_URL=http://localhost:4321
RESEND_API_KEY=            # stretch goal
```

## 10. Milestones (one at a time)
1. **Scaffold**: Astro project, layout, fonts, colors, header/footer.
2. **Database**: schema, seed data, `db.ts`, test that data loads.
3. **Apartment pages**: list and detail with photos and house rules.
4. **Availability + date picker**: overlap function, availability endpoint, flatpickr blocking dates.
5. **Booking + Paystack test payment**: create booking, redirect, verify, confirm, confirmation page.
6. **Host calendar**: password login, month view.
7. **Polish and test**: mobile check, double-booking test, README.
8. **Stretch**: check-in email, host add-apartment form.

## 11. Definition of done
- Two people cannot book overlapping nights (test it by trying).
- Booked dates are greyed out in the picker.
- A Paystack test payment confirms a booking end to end.
- Host can log in and see bookings on a calendar.
- Works on a phone-sized screen.
- Lighthouse performance score is high (aim for 90+).
