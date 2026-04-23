# KASIA Ungasan — Partner Dashboard

Static HTML dashboard in three views. Reads live from a Google Sheet; falls back
to an embedded snapshot if offline or if the sheet is unreachable.

## Structure

```
KASIA-dashboard/
├── index.html          ← A · Quarterly report (primary partner view)
├── monthly.html        ← B · Monthly snapshot (one month at a time)
├── historical.html     ← C · History 2023–2026 (four-year arc)
├── assets/
│   ├── style.css       ← shared styling (concrete + jungle green)
│   └── data.js         ← shared data layer, CSV parser, metrics
├── HOTEL_KPI_TEMPLATE.csv  ← template to start tracking occupancy / ADR / RevPAR
└── README.md
```

All three views share the same stylesheet and data layer. Edit once, apply
everywhere.

## Opening it now

Double-click `index.html`. Works offline — a Q1 2026 snapshot is embedded. The
header shows `Live · Google Sheets` (green dot) or `Static · embedded` so you
always know which source you're reading.

For best results, open with a local server so the browser allows cross-origin
fetches against Google's gviz endpoint:

```bash
cd KASIA-dashboard
python3 -m http.server 8080
# then open http://localhost:8080
```

## Wiring to the live Google Sheet

Already configured. The sheet ID `1eisZIIB3j8wRNYqLhTDjQSwMXUWgTPZR` and the
`TOTAL 2026` tab gid `351591053` live in `assets/data.js` under `KASIA_CONFIG`.

**No "Publish to web" required.** The dashboard uses Google's `gviz` CSV
endpoint, which respects normal sheet sharing permissions. As long as the sheet
is set to "Anyone with the link can view" (or the viewer is signed in with
access), the fetch works.

To point it at a different sheet or tab, edit `assets/data.js`:

```js
window.KASIA_CONFIG = {
  sheetId: "YOUR_SHEET_ID",
  tabs: {
    2026: "YOUR_TAB_GID",
    ...
  },
  ...
};
```

**Security note.** `gviz` exposes whatever the sheet exposes. Keep personal bank
numbers, IDs, and employee data off the partner-facing tab. Mirror an aggregated
P&L view into a dedicated tab and point the dashboard at that.

## The three views

### A — Quarterly (`index.html`)
The partner report. Hero operating profit, KPI grid, monthly bars, channel mix,
cost ranked table, cafe line, decisions panel. This is what you send in the
quarterly email.

### B — Monthly (`monthly.html`)
A simpler one-month-at-a-time snapshot with a month picker. Use this to answer
"how did last month go?" without re-reading the full quarterly narrative. Shows
revenue → opex → payout → cash delta as a visual flow. Defaults to the most
recent month with data.

### C — History (`historical.html`)
The four-year arc — 2023 construction, 2024 first full year, 2025 first
profitable hotel line, 2026 in progress. Tells the structural story so partners
(and you) can see whether this year's numbers are continuity or drift. Embedded
snapshots from the 2023/2024/2025 bank books drive this page.

## The KPI gap (still pending)

The bank book knows *money*. It does not know *rooms*. Occupancy, ADR, and
RevPAR are flagged as "coming soon" in the KPI grid until the booking-system
export (PMS) is wired. Two options for closing this:

1. **Five-minutes-per-month manual entry.** Upload `HOTEL_KPI_TEMPLATE.csv` as a
   new `Hotel KPI` tab in the same Google Sheet. Fill in Rooms Available,
   Nights Sold, Room Revenue each month-close. Formulas derive occupancy, ADR,
   RevPAR.
2. **Direct PMS export.** If the booking system supports scheduled CSV export,
   point that at the same sheet (append-only). Near-zero maintenance once set
   up.

Until then, the current dashboard is a cash-flow dashboard, not a hotel
performance dashboard. Useful for partner confidence, insufficient for
occupancy/pricing decisions.

## Method notes

- **Operating profit** = `hotel_revenue − (hotel_expense_total − investor_payout − investment)`.
  This is the number that tells you whether the building paid for itself before
  partner distributions.
- **Cash delta** = `hotel_revenue − hotel_expense_total`. This is what actually
  hits the balance — lower than operating profit in months with distributions.
- **Channel mix** is by revenue (not bookings). A premium direct booking weighs
  more than five cheap Agoda stays. True channel health needs nights-sold data.
- **Cafe & studio** — cafe is priced for neighborhood, not margin. Studio is
  reported for completeness, footnoted, not treated as strategic.
- **Historical figures** (2023–2025) are embedded from the uploaded bank books
  rather than fetched live. They don't change; no reason to re-fetch.

## Design language

Tropical brutalist — responding to the KASIA building itself:

- **Concrete palette** (warm gray, board-formed) for surfaces.
- **Jungle green** as the single accent, used sparingly.
- **IBM Plex Sans / Mono** for the technical, legible body text; **Fraunces**
  reserved for the KASIA wordmark and large display numbers.
- **Exposed structure** — visible rulers, corner brackets, section numbers,
  hairlines. The interface looks like a set of working drawings, not a product
  brochure.

## Hosting (when you're ready to share)

All files are static. Works on:

- **Netlify drop** — drag the folder onto `app.netlify.com/drop`. Immediate URL.
  Password-protect on the paid plan.
- **Vercel** — `vercel` CLI or dashboard. Custom domain trivial.
- **GitHub Pages** — push, enable Pages.
- **Cloudflare Pages** — same shape.

For a partner-only link, Netlify's password protection on the $19/mo Starter
plan is the simplest guard.

## What's next

- PMS / booking-system wiring (occupancy, ADR, RevPAR)
- Year-over-year overlay on the monthly chart (once 2025 is re-parsed through
  the same pipeline)
- Booking-pace chart if you start logging 30/60/90-day forward bookings
- Optional: partner-specific toggles (hide salary detail, show only top-line)

---

*Part of the Personal project workspace.*
