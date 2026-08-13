# KASIA Ungasan — Partner Dashboard

Static HTML dashboard in three views, in Rupiah, US Dollars or Euros. Reads live
from a Google Sheet where it can; otherwise renders an embedded snapshot.

## Structure

```
KASIA-dashboard/
├── index.html          ← A · Quarterly report (Q1 / Q2 / Q3 / Q4 switcher)
├── monthly.html        ← B · Monthly snapshot (one month at a time)
├── historical.html     ← C · History 2023–2026 (four-year arc + currency)
├── assets/
│   ├── style.css       ← shared styling (concrete + jungle green)
│   └── data.js         ← data layer, FX rates, CSV parser, metrics
├── HOTEL_KPI_TEMPLATE.csv  ← template to start tracking occupancy / ADR / RevPAR
└── README.md
```

All three views share the same stylesheet and data layer. Edit once, apply
everywhere.

## Opening it now

Double-click `index.html`. Works offline — a Jan–Jul 2026 snapshot is embedded.
The header shows `Live · Google Sheets` (green dot) or `Static · embedded` so you
always know which source you are reading.

For a live read, serve it locally so the browser will allow the cross-origin
fetch against Google's gviz endpoint:

```bash
cd KASIA-dashboard
python3 -m http.server 8080
# then open http://localhost:8080
```

**On GitHub Pages this always reads the embedded snapshot.** Google's gviz
endpoint does not send CORS headers to an arbitrary origin, so the live fetch
fails and `loadYear()` falls through to the snapshot in `assets/data.js`. That is
by design, not a bug — but it means the snapshot has to be refreshed whenever new
months land in the sheet, otherwise the published dashboard silently shows stale
figures. See "Refreshing the snapshot" below.

## Currency

The IDR / USD / EUR switch in the masthead persists across all three views.

Rates are **monthly averages of ECB daily reference rates**, embedded in
`KASIA_FX` in `assets/data.js`, covering 2023-01 through 2026-08. Revenue and
cost are flows earned across a month rather than balances held at a point in
time, so each month's rupiah is converted at that month's average rate.

Quarterly and annual figures are **never** converted at a single blended rate.
Each month is converted at its own rate and the months are then summed —
`fxSum()` is the only aggregation path. The "blended rate" shown in the UI is
derived afterwards (total IDR ÷ total converted) and is a readout, not an input.
Converting a period total at one average rate would hide the rupiah's drift
inside the period, which through 2026 has been material: the rate moved from
Rp 16,832 to Rp 18,011 per dollar between January and July.

To extend the rate table:

```bash
curl -s "https://api.frankfurter.dev/v1/2026-01-01..YYYY-MM-DD?base=EUR&symbols=IDR,USD"
```

Average the daily values per calendar month. For the USD table compute
`IDR ÷ USD` per day *before* averaging — the ratio of the two monthly means is
not the same number. Leave future months as `null`; `fxRate()` carries the last
known rate forward and the monthly view labels it when it does.

## Refreshing the snapshot

`KASIA_2026_EMBEDDED` in `assets/data.js` is what the published site renders.
When new months appear in the sheet, re-export the TOTAL 2026 tab and update it:

```bash
curl -sL "https://docs.google.com/spreadsheets/d/1eisZIIB3j8wRNYqLhTDjQSwMXUWgTPZR/gviz/tq?tqx=out:csv&gid=351591053" -o sheet.csv
```

Column meanings are pinned in `KASIA_SHEET_MAP`. Do not reintroduce substring
matching — see below.

## Two known defects in the source sheet

The dashboard works around both. Delete the workarounds once the sheet is fixed.

**1. "Income Cash" and "Income Transfer" are transposed.** The large declining
column sitting under *Income Cash* (Rp 109.8 M in January falling to Rp 41.3 M in
July) is direct / bank-transfer revenue. The small column under *Income Transfer*,
which first appears in April, is cash on arrival. `KASIA_SHEET_MAP` maps them to
their true meaning and both are commented.

**2. The sheet's own USD column uses a flat Rp 16,450 for every month.** Real
monthly averages ran 16,832 in January to 18,011 in July, so the flat rate
overstates dollar revenue by about 5% across Jan–Jul and 9.5% for July alone.
The dashboard ignores that column and computes its own.

## Why columns are pinned by exact header

A previous version resolved columns with substring matching
(`findCol('INCOME TRANSFER', 'TRANSFER')`). When the sheet gained the *Income
Asia Pay* and *Income Traveloka* columns, that matcher started resolving
`transfer` to a near-empty column while the real direct-booking money sat under
*Income Cash* — so the dashboard reported direct bookings at about 3% of room
revenue instead of the true share, in a report whose headline argument is that
direct booking is the margin advantage. The bug was invisible for as long as the
view was frozen to an embedded Q1 snapshot, and surfaced the moment the report
rolled forward onto live data. It caused the 24 May 2026 revert.

Both parsers — `parseSheet2026()` in `assets/data.js` and `parse_sheet_csv()` in
the FastAPI variant — now resolve against an exact normalized header map and
raise if a critical column is missing, rather than silently returning zeros.

## Other data caveats, unchanged

- The PMS reports only a 5-month rolling aggregate (1 Dec 2025 – 1 May 2026), so
  occupancy is not split per quarter and ADR / RevPAR are unavailable. The same
  occupancy figure therefore shows for every 2026 month.
- Channel lines do not sum exactly to the hotel revenue total in every month
  (largest gap in Q2 2026: about Rp 3.0 M). Channel shares are stated as a share
  of *tracked* channel revenue, not of the revenue line.
- December 2025 occupancy reads 55% because the booking system was mid-migration.
  It is a transition artefact, not a demand collapse, and is excluded from the
  2025 annual average.

## Optional password gate

`assets/auth.js` is loaded by all three pages and 404s harmlessly here — which is
why this deployment renders open. A private variant serves that file alongside a
FastAPI app (`app.py`) that proxies the sheet and requires a Bearer token on
`/api/data`.

Note what that does and does not protect. The overlay is convenience; the real
gate is server-side. Even with it, the embedded snapshot compiled into
`assets/data.js` is readable by anyone who can load the page. Treat the snapshot
as public in any deployment you expose to the internet.

## Editing the partner commentary

Everything on the quarterly page is computed from the data — headline, ledes,
callouts, cost commentary, channel notes — so the report writes itself as
quarters land. The one exception is §07 *For the Partners*, which is judgement
rather than arithmetic. It lives in a `DECISIONS` object at the top of the script
in `index.html`, keyed by quarter. Edit the text there; the layout reads whatever
is present.
