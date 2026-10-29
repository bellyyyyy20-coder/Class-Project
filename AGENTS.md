# AGENTS.md: ShortStay

You are helping a **complete beginner** build a web app for the first time. Be patient, clear, and careful.

## Read first
- `SPEC.md` is the source of truth for what to build and the business rules.
- `STYLE_GUIDE.md` is the source of truth for how it looks.
If a request conflicts with these files, point it out before changing anything.

## Project summary
ShortStay is a direct-booking site for a shortlet apartment owner. Guests pick an apartment and dates and pay (Paystack **test mode**). The host sees a calendar. Booked dates are blocked so double bookings are impossible.

## Stack
Astro (server output with `@astrojs/node`), TypeScript, SQLite with `better-sqlite3`, flatpickr for the date picker, Paystack for test payments, `@fontsource` for fonts. Plain CSS in `src/styles/global.css` using the variables in `STYLE_GUIDE.md`. No Tailwind, no React, no UI framework.

## How to work with me
1. **Build the whole MVP in one run**, following the build order in `SPEC.md` section 10 (milestones 1 to 7). Do not stop between milestones to ask permission. Stretch goals (milestone 8) only if I ask.
2. Before coding, give me a short plan (a few lines) of what you are about to build, then start.
3. Run `npm run build` and fix errors as you go, so the project is working at the end.
4. Only stop to ask me something when you are truly blocked (for example, you need my Paystack test key). Make sensible choices for everything else and tell me what you chose.
5. When something breaks, explain the cause in plain language, then fix it.
6. At the end, give me: a list of what was built, the exact steps to run it, what to put in `.env`, and how to test booking, payment, and double-booking.
7. Explain new concepts in simple words. Avoid jargon, or explain it when you use it.

## Commands
- `npm install`: install dependencies
- `npm run dev`: start the dev server at http://localhost:4321
- `npm run build`: production build (run before saying a milestone is done)
- `npm run seed`: reset and fill the database with sample data

## Project structure
```
src/
  components/   reusable .astro components (ApartmentCard, DatePicker, Header...)
  layouts/      Layout.astro (page shell)
  lib/          db.ts, availability.ts, paystack.ts, auth.ts
  pages/        routes (see SPEC.md section 8)
  styles/       global.css (design tokens + base styles)
db/             schema.sql, seed.ts, shortstay.db (git-ignored)
public/images/  apartment photos
```

## Rules for the code
- Prefer `.astro` pages that render on the server. Use client-side JavaScript **only** for the date picker. Keep it in a small script.
- Keep files short and readable. Add short comments explaining non-obvious logic, written for a beginner.
- Use clear names (`checkIn`, `totalAmount`), not abbreviations.
- Money is stored in **kobo** (integers). Convert to Naira only when displaying.
- Dates are `YYYY-MM-DD` strings. Check-out day is **not** a booked night, so same-day turnover is allowed.
- Overlap rule: `new.check_in < existing.check_out AND new.check_out > existing.check_in`. Put it in one function in `src/lib/availability.ts` and reuse it everywhere.
- **Availability must be enforced on the server**, not only in the date picker. Check when creating a booking and again when verifying payment, inside a database transaction.
- Always use parameterized SQL queries (`?` placeholders). Never build SQL by joining strings.
- Validate all form input on the server (required fields, valid email, dates in the future, check-out after check-in, guests within the apartment limit).
- Do not hold dates while a guest is paying. Only `confirmed` bookings block dates.

## Security
- Secrets live in `.env` only. Never hard-code keys. Never commit `.env` or the `.db` file. Make sure `.gitignore` covers them.
- Paystack secret key is used on the server only, never sent to the browser.
- Verify every payment with Paystack's verify endpoint before confirming a booking. Never trust the redirect alone.
- Host pages require the password (`HOST_PASSWORD`) via a signed or httpOnly cookie. Redirect to `/host/login` if not logged in.

## Do not
- Do not install new packages without asking me first and explaining why.
- Do not switch frameworks or rewrite the stack.
- Do not add features outside `SPEC.md` unless I ask.
- Do not delete files or the database without asking.
- Do not use live Paystack keys. Test keys only.
- Do not leave the project in a broken state. If something cannot be finished, say so clearly.

## Performance
- Astro pages should ship minimal JavaScript.
- Photos: use `<img>` with `width`, `height`, `loading="lazy"` (except the first visible image), and sensible file sizes (under about 300 KB each).
- Fonts are self-hosted via `@fontsource`. Load only the weights used.

## Definition of done
- `npm run build` passes with no errors.
- Everything in `SPEC.md` section 11 works.
- I have been told how to run it and verify it by hand.
- Pages look right on a phone-sized screen.
