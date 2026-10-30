# ShortStay: Style Guide

**Feel:** five-star luxury hotel. Calm, elegant, spacious. Royal blue and gold on a warm cream background. Lots of whitespace, large photos, restrained use of gold.

## Colors (put these in `src/styles/global.css` as CSS variables)
```css
:root {
  --color-primary: #1B3A8C;        /* royal blue: buttons, header, links */
  --color-primary-dark: #14296A;   /* hover/pressed */
  --color-accent: #C9A24B;         /* gold: highlights, borders, small details */
  --color-accent-dark: #A8842F;    /* gold text on light backgrounds */
  --color-bg: #FAF6EC;             /* cream page background */
  --color-card: #FFFFFF;           /* cards and panels */
  --color-text: #1F2433;           /* main text */
  --color-muted: #6B7280;          /* secondary text */
  --color-border: #E7E0CC;         /* soft cream-gold borders */
  --color-danger: #B3261E;         /* errors */
  --color-success: #2E7D4F;        /* success */
  --color-booked: #D9D4C5;         /* booked days in calendars */
}
```
Rules: blue is the main action color. Gold is an accent only (thin lines, small icons, price highlights, hover details). Do not use gold for large blocks or long text.

## Typography
- **Headings:** Cormorant Garamond (weights 500, 600)
- **Body and UI:** Inter (weights 400, 500, 600)
- Install via `@fontsource/cormorant-garamond` and `@fontsource/inter` and import only the weights used.
- Sizes: body 16px, h1 `clamp(2.25rem, 5vw, 3.5rem)`, h2 `clamp(1.75rem, 3vw, 2.25rem)`, h3 1.375rem.
- Line height 1.6 for body, 1.2 for headings. Headings use slight letter spacing (0.01em).

## Spacing and layout
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96 px.
- Page max width 1120px, centered, with 16px side padding on mobile and 24px on larger screens.
- Generous vertical space between sections (64 to 96px on desktop, 48px on mobile).
- **Mobile first.** Apartment grid: 1 column on phones, 2 on tablets, 3 on desktop.

## Components

**Buttons**
- Primary: blue background, white text, 8px radius, 12px 24px padding, Inter 500. Hover: darker blue.
- Secondary: transparent, blue 1px border, blue text.
- Gold outline variant only for a single "featured" action at most.
- Visible focus ring: 2px gold outline with 2px offset.

**Cards**
- White background, 12px radius, 1px `--color-border` border, soft shadow (`0 4px 20px rgba(20, 41, 106, 0.08)`).
- Photo on top (aspect ratio 4:3, `object-fit: cover`), then name (Cormorant), area (muted), price.
- Price: gold-dark, "₦45,000 / night" style.

**Header**
- Cream or white background, thin gold bottom line. Logo text "ShortStay" in Cormorant Garamond, blue, with a small gold detail. Few links only.

**Forms**
- White inputs, 1px border, 8px radius, 12px padding, clear labels above the field. Blue border on focus. Error text in `--color-danger` under the field.

**Date picker (flatpickr)**
- Selected range: blue background, white text.
- Booked/disabled days: `--color-booked` background, strikethrough, `cursor: not-allowed`.
- Today: thin gold outline.

**Host calendar**
- Booked days filled with soft blue tint and the guest's name; free days white. Month title in Cormorant.

## Photos
- Bright, wide, well-lit interior shots. Same aspect ratio across a gallery.
- Compress to about 1200px wide and under 300 KB each. Always write meaningful `alt` text.

## Tone of copy
Warm, polished, brief. Examples: "Your stay, arranged directly." and "Book direct. No middleman."

## Accessibility
- Text contrast at least 4.5:1 (blue and dark text on cream pass; do not put gold text on cream at small sizes, use `--color-accent-dark`).
- Every input has a label. Every image has alt text. All actions work with the keyboard.
