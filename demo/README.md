# Amplitude Studios — recording studio booking demo (Moovit type)

Generic Moovit-style no-scroll booking app for a recording studio, built as a
pitch demo. Placeholder brand "Amplitude Studios" and placeholder rates —
everything reskins from the CONFIG + RATES blocks in index.html.

## Flow

Loader → project (single / album / EP / podcast / voiceover) → session type →
then one of two paths:

- Room path: record with engineer / room only / podcast / rehearsal →
  room (A $95/hr, B $65/hr, Podcast Suite $55/hr) → block (2 / 4 / 8 / 10 hrs,
  5 / 10 / 15% room discount) → add-ons
- Service path: mixing $350/song, mastering $75/song, mix + master $399/song →
  song stepper (10% off at 4+ songs) → add-ons

Then: add-ons (session musician $150, vocal production + tuning $60,
stems + alt mixes $40, rush 48h $99) → date + start time (next 14 days,
9 AM–8 PM starts) → contact → live estimate with animated total and line
items → 50% deposit (Jim popup, or invoice by email/text) → confirmation
ST-#### with confetti + downloadable PNG session sheet.

Engineer pricing: included in Studio A and Podcast Suite; +$25/hr in
Studio B on engineer-led recording; none on dry hire / rehearsal.

## Files

- `index.html` — the app (single file, vanilla JS, Manrope + IBM Plex Mono)
- `studio-apps-script.js` — Google Apps Script backend (Sheet + Calendar + email)
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png`,
  `apple-touch-icon.png`, `og-image.jpg` — brand assets, regenerate with
  `generate_assets.py`

## Before it goes live for a real studio, fill these

In `index.html` CONFIG block:

- `STUDIO_EMAIL` — receives booking notifications
- `APPS_SCRIPT_URL` — deployed Apps Script web app /exec URL
- `CALENDAR_ID` — Google Calendar sessions are booked on
- `JIM_DEPOSIT` — Jim payment link for the 50% deposit

In `studio-apps-script.js` CONFIG: `STUDIO_EMAIL`, `CALENDAR_ID`.

Until placeholders are filled the app runs in demo mode: bookings complete
locally, the Pay button explains demo mode and reveals the completed-payment
button, and nothing is written server-side.

## Reskin checklist (per studio sale)

- CONFIG.BUSINESS_NAME + wordmark text + title/OG tags
- RATES block (room rates, engineer fee, per-song prices)
- `--brand` AND `--signal` to the studio accent; `--ink` to their ink
- Regenerate icons/og from their logo with generate_assets.py as a base
- Fresh Jim deposit link and Apps Script deployment under their account

## Deploy

Static site: GitHub repo → Cloudflare Pages (preset None, no build command,
output directory `/`).
