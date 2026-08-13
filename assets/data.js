// =============================================================
// KASIA UNGASAN · shared data layer
// =============================================================
// - Embedded historical data (2023 / 2024 / 2025)
// - Embedded 2026 snapshot (Jan–Jul actuals, captured 2026-08-13)
// - Fetches the live 2026 sheet via the local API (app.py) which
//   proxies Google's gviz CSV endpoint
// - FX layer: monthly-average IDR/USD and IDR/EUR (ECB reference)
// - Metric calculators used by all three views
// =============================================================

// --------- LIVE SHEET CONFIG ---------------------------------
window.KASIA_CONFIG = {
  sheetId: "1eisZIIB3j8wRNYqLhTDjQSwMXUWgTPZR",
  tabs: {
    2026: "351591053",          // TOTAL 2026 gid (confirmed)
    2025: null,
    2024: null,
    2023: null,
  },
  gvizUrl(gid) {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  },
};

// =============================================================
// FX LAYER
// =============================================================
// IDR per 1 unit of foreign currency, arithmetic mean of ECB
// business-day reference rates for each calendar month.
//
// Why monthly averages: revenue and cost are FLOWS earned and spent
// across a month, not balances held at a point in time. Converting a
// month's IDR flow at that month's average rate is the standard
// treatment (IAS 21 permits average rates for transactions in a period).
//
// Quarterly and annual figures are NEVER converted at an average rate.
// Each month is converted at its own rate, then summed. Otherwise a
// depreciating rupiah silently distorts the aggregate.
//
// null = month not complete / no data yet.
window.KASIA_FX = {
  source: "ECB daily reference rates (Frankfurter API) · monthly arithmetic mean of business days",
  captured: "2026-08-13",
  basis: "monthly-average",
  partial: { 2026: 7 },   // 2026-08 is a partial month (8 business days at capture)
  // IDR per 1 USD
  usd: {
    2023: [15256.6, 15150.3, 15287.4, 14874.1, 14831.4, 14939.6, 15048.2, 15253.3, 15374.0, 15759.8, 15594.6, 15510.2],
    2024: [15634.6, 15654.5, 15695.1, 16088.9, 16070.5, 16355.1, 16251.8, 15755.7, 15325.9, 15580.0, 15821.0, 16043.7],
    2025: [16257.7, 16346.3, 16471.8, 16828.9, 16427.9, 16304.7, 16297.4, 16307.9, 16535.3, 16603.7, 16698.6, 16695.1],
    2026: [16831.7, 16827.3, 16924.1, 17156.1, 17594.9, 17897.9, 18011.0, 17877.7, null, null, null, null],
  },
  // IDR per 1 EUR
  eur: {
    2023: [16427.0, 16232.6, 16365.0, 16313.2, 16116.8, 16194.9, 16640.0, 16639.4, 16424.7, 16646.7, 16853.6, 16910.3],
    2024: [17049.4, 16898.6, 17063.7, 17258.8, 17375.7, 17595.9, 17623.3, 17347.7, 17020.2, 16988.2, 16817.1, 16811.0],
    2025: [16832.4, 17020.4, 17800.8, 18871.7, 18526.8, 18776.6, 19029.7, 18967.9, 19399.7, 19310.8, 19303.9, 19548.0],
    2026: [19757.0, 19896.4, 19561.2, 20083.9, 20538.0, 20614.7, 20564.0, 20631.0, null, null, null, null],
  },
  // The 2026 sheet carries its own USD column converted at a single flat
  // rate for every month. Kept here only to quantify the distortion.
  sheetFlatRate2026: 16450,
};

// --------- ACTIVE CURRENCY -----------------------------------
window.KASIA_CUR = {
  code: (function () {
    try { return localStorage.getItem('kasia_cur') || 'IDR'; } catch (e) { return 'IDR'; }
  })(),
  set(c) {
    this.code = c;
    try { localStorage.setItem('kasia_cur', c); } catch (e) {}
  },
  isIDR() { return this.code === 'IDR'; },
  symbol() { return { IDR: 'Rp', USD: '$', EUR: '€' }[this.code] || ''; },
  label() { return this.code; },
};

// IDR per 1 unit of `code` for a given year + month index (0–11).
// Falls back to the most recent known rate if that month isn't published.
window.fxRate = function (year, monthIdx, code) {
  code = code || KASIA_CUR.code;
  if (code === 'IDR') return 1;
  const tbl = KASIA_FX[code.toLowerCase()];
  if (!tbl) return null;
  const arr = tbl[year];
  if (!arr) {
    // Year outside the table — use the nearest available year's mean.
    const years = Object.keys(tbl).map(Number).sort();
    const near = year < years[0] ? years[0] : years[years.length - 1];
    return window.fxAnnualRate(near, code);
  }
  if (arr[monthIdx] != null) return arr[monthIdx];
  for (let i = monthIdx - 1; i >= 0; i--) if (arr[i] != null) return arr[i];
  const prev = tbl[year - 1];
  if (prev) for (let i = 11; i >= 0; i--) if (prev[i] != null) return prev[i];
  return null;
};

// Simple mean of the year's published monthly rates. Use ONLY for line
// items that have no monthly breakdown.
window.fxAnnualRate = function (year, code) {
  code = code || KASIA_CUR.code;
  if (code === 'IDR') return 1;
  const tbl = KASIA_FX[code.toLowerCase()];
  const arr = (tbl && tbl[year]) || [];
  const vals = arr.filter(v => v != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

// Convert one month's IDR amount at that month's rate.
window.fxConv = function (idr, year, monthIdx, code) {
  code = code || KASIA_CUR.code;
  if (code === 'IDR') return idr;
  const r = fxRate(year, monthIdx, code);
  if (!r) return null;
  return idr / r;
};

// Convert a whole-year / undated IDR amount at the year's average rate.
window.fxConvAnnual = function (idr, year, code) {
  code = code || KASIA_CUR.code;
  if (code === 'IDR') return idr;
  const r = fxAnnualRate(year, code);
  if (!r) return null;
  return idr / r;
};

// Sum a key across months, converting each month at its own rate.
// `months` entries need an `idx` (0–11) or their array position is used.
window.fxSum = function (months, key, year, code) {
  code = code || KASIA_CUR.code;
  return months.reduce((a, m, i) => {
    const idx = (m.idx != null) ? m.idx : i;
    const v = fxConv(m[key] || 0, year, idx, code);
    return a + (v == null ? 0 : v);
  }, 0);
};

// The blended rate a set of months actually implies: total IDR / total
// converted. This is the honest "what rate did this quarter really run at".
window.fxBlended = function (idrTotal, convTotal) {
  if (!convTotal) return null;
  return idrTotal / convTotal;
};

// --------- HISTORICAL SNAPSHOTS ------------------------------
// Sourced from the uploaded bank book CSVs. Structure is normalized:
// every year is reduced to a single yearly row + monthly rows where
// comparable totals exist.
window.KASIA_HISTORY = {
  2023: {
    phase: "Construction + Launch",
    narrative: "Built and opened. Soft launch Jan–Apr absorbed construction costs. Launch period May–Dec reached breakeven on operations.",
    total_revenue: 1364180360,
    total_other_income: 70059841,
    total_expense: 1807898556,
    balance: -373658355,
    total_revenue_all: 1364180360 + 70059841, // no cafe/studio tracked separately in 2023
    investor_payout: 76032000,                // LOAN Reimbursement
    assets: 387320457,                        // "FINISHINGS"
    construction: 823629203,                  // OTHER EXPENSES (includes setup costs)
    salary: 240686180,
    utilities: 88444616,
    credit: 186324000,
    taxes: 6000000,
    phases: [
      { name: "Soft Launch", months: "Jan–Apr", revenue: 250181661, expense: 620363966, balance: -370182305 },
      { name: "Launch",      months: "May–Dec", revenue: 1113998699 + 70059841, expense: 1187534590, balance: -3476050 + 70059841 },
    ],
    months: [
      { m: "Jan", idx: 0,  revenue: 54100000, expense: 315287363, balance: -261187363 },
      { m: "Feb", idx: 1,  revenue: 37250000, expense: 140699469, balance: -103449469 },
      { m: "Mar", idx: 2,  revenue: 83470360, expense: 98000497,  balance: -14530137 },
      { m: "Apr", idx: 3,  revenue: 75361301, expense: 66376637,  balance: 8984664 },
      { m: "May", idx: 4,  revenue: 107610870+7258508, expense: 113121040, balance: 1748338 },
      { m: "Jun", idx: 5,  revenue: 147982040+24748350, expense: 151670222, balance: 21060168 },
      { m: "Jul", idx: 6,  revenue: 85212525+24201876,  expense: 98690205,  balance: 10724196 },
      { m: "Aug", idx: 7,  revenue: 170130543+1202471,  expense: 179361417, balance: -8028403 },
      { m: "Sep", idx: 8,  revenue: 195209614+2432599,  expense: 173113787, balance: 24528426 },
      { m: "Oct", idx: 9,  revenue: 146416532+3885906,  expense: 185529215, balance: -35226777 },
      { m: "Nov", idx: 10, revenue: 182827287+3720839,  expense: 141569342, balance: 44978784 },
      { m: "Dec", idx: 11, revenue: 78609288+2609292,   expense: 144479362, balance: -63260782 },
    ],
  },
  2024: {
    phase: "First Full Year",
    narrative: "First complete operating year. Hotel revenue Rp 1.79 B. Heavy reinvestment (Rp 545 M) masks strong underlying operating margin.",
    total_revenue_all: 1875085109,
    hotel_revenue: 1790255546,
    cafe_studio_revenue: 74681689,
    airbnb: 966760976,
    edc: 116073054,
    transfer: 392892841,
    cash: 315496079,
    total_expense: 1867442186,
    balance_hotel: -77186640,
    balance_all: 54842941,
    salary: 364400000,
    utilities: 220441916,
    operational: 120403152,
    credit: 186324000,
    investment: 545124695,   // TOTAL INVESTMENT — reinvestment spend
    assets: 56736326,
    taxes: 135261910,
    marketing: 5018323,
    // Derived: operating expense = total - investment - credit - taxes - loans
    operating_expense: 1867442186 - 545124695 - 186324000 - 135261910 - 182595750,
    months: [
      { m: "Jan", idx: 0,  revenue: 162560070, expense: 182076733, balance: -19516663 },
      { m: "Feb", idx: 1,  revenue: 108437601, expense: 132571069, balance: -24133468 },
      { m: "Mar", idx: 2,  revenue: 151990815, expense: 156652731, balance: -4661916 },
      { m: "Apr", idx: 3,  revenue: 142123832, expense: 161401982, balance: -19278150 },
      { m: "May", idx: 4,  revenue: 180307224, expense: 181451540, balance: -1144316 },
      { m: "Jun", idx: 5,  revenue: 162067496, expense: 133456740, balance: 28610756 },
      { m: "Jul", idx: 6,  revenue: 171887790, expense: 107677181, balance: 64210609 },
      { m: "Aug", idx: 7,  revenue: 194051945, expense: 213538212, balance: -19486267 },
      { m: "Sep", idx: 8,  revenue: 160688144, expense: 109680882, balance: 51007262 },
      { m: "Oct", idx: 9,  revenue: 159297746, expense: 191064679, balance: -31766933 },
      { m: "Nov", idx: 10, revenue: 119300566, expense: 177153389, balance: -57852823 },
      { m: "Dec", idx: 11, revenue: 162371880, expense: 120717048, balance: 41654832 },
    ],
  },
  2025: {
    phase: "Stability",
    narrative: "First profitable year on the hotel line. Cafe + studio grew 4×. Lower reinvestment, higher retained earnings.",
    total_revenue_all: 1953860247,
    hotel_revenue: 1663770124,
    cafe_studio_revenue: 290090123,
    airbnb: 658657991,
    edc: 33329504,
    transfer: 0,
    cash: 971782629,
    total_expense: 1589627989,
    balance_hotel: 74142135,
    balance_all: 76220134,
    salary: 477510000,
    utilities: 230920413,
    operational: 121890936,
    credit: 186324000,
    investor_payout: 223312160,
    assets: 51807537,
    loan_ricardo: 24100617,
    loan_290: 25514696,
    taxes: 100728309,
    cafe_expense: 288012124,
    // Derived operating expense estimate
    operating_expense: 1589627989 - 223312160 - 186324000 - 100728309 - 24100617 - 25514696,
    months: [
      { m: "Jan", idx: 0,  revenue: 176692132, expense: 160701475, balance: 5406861 },
      { m: "Feb", idx: 1,  revenue: 115774305, expense: 103098477, balance: 4992865 },
      { m: "Mar", idx: 2,  revenue: 144433711, expense: 100786987, balance: 27147116 },
      { m: "Apr", idx: 3,  revenue: 164494682, expense: 135846687, balance: -3538395 },
      { m: "May", idx: 4,  revenue: 184957561, expense: 118990585, balance: 25079464 },
      { m: "Jun", idx: 5,  revenue: 191026547, expense: 150693614, balance: 9078171 },
      { m: "Jul", idx: 6,  revenue: 159359493, expense: 147296656, balance: -13345331 },
      { m: "Aug", idx: 7,  revenue: 187933874, expense: 129529111, balance: 29967831 },
      { m: "Sep", idx: 8,  revenue: 214214290, expense: 212564738, balance: -12868360 },
      { m: "Oct", idx: 9,  revenue: 123236818, expense: 113792558, balance: -22579382 },
      { m: "Nov", idx: 10, revenue: 169418555, expense: 96478521,  balance: 48865190 },
      { m: "Dec", idx: 11, revenue: 122318279, expense: 119848580, balance: -21985896 },
    ],
  },
};

// =============================================================
// 2026 SHEET COLUMN MAP
// =============================================================
// Pinned by exact (normalized) header text, NOT by fuzzy substring.
// The earlier fuzzy matcher silently drifted when the sheet gained the
// Asia Pay / Traveloka columns, which is how "Income Transfer" started
// resolving to the wrong column.
//
// KNOWN SHEET DEFECT (confirmed 2026-08-13): the sheet's "Income Cash"
// and "Income Transfer" headers are transposed. The large, declining
// column sitting under "Income Cash" (Rp 109.8 M Jan → Rp 41.3 M Jul)
// is direct / bank-transfer revenue; the small column under "Income
// Transfer" (first appears April) is cash on arrival. We map them to
// their true meaning here and surface a data-quality note in the views.
// Fix the sheet headers and delete the swap.
window.KASIA_SHEET_MAP = {
  balance_hotel:        "BALANCE HOTEL",
  hotel_revenue:        "INCOME HOTEL",
  airbnb:               "DETAIL INCOME HOTEL INCOME AIRBNB",
  asiapay:              "INCOME ASIA PAY",
  traveloka:            "INCOME TRAVELOKA",
  agoda:                "INCOME AGODA",
  edc:                  "INCOME EDC",
  transfer:             "INCOME CASH",       // ← swapped, see note above
  cash:                 "INCOME TRANSFER",   // ← swapped, see note above
  hotel_expense_total:  "EXPENSE HOTEL",
  salary:               "DETAIL COSTS HOTEL SALARY",
  utilities:            "UTILITIES",
  laundry:              "LAUNDRY",
  maintenance:          "MAINTENANCE",
  marketing:            "SALES & MARKETING",
  supplies:             "SUPPLIES",
  assets:               "ASSETS",
  local:                "LOCAL",
  legal:                "LEGAL",
  taxes:                "TAXES",
  bank_credit:          "BANK CREDIT",
  investor_payout:      "PAYOUT INVESTOR",
  investment:           "INVESTMENT",
  cafe_revenue:         "ON THE CAFE ACCOUNT INCOME CAFE",
  cafe_expense:         "EXPENSE CAFE|LAST",   // duplicate header; take the last one
  studio_revenue:       "IN CASH INCOME PHOTO STUDIO",
};
window.KASIA_SHEET_SWAP_NOTE =
  "The sheet's “Income Cash” and “Income Transfer” headers are transposed. " +
  "Corrected here: the large declining column is direct / bank transfer.";

// --------- 2026 embedded fallback ----------------------------
// Snapshot of the TOTAL 2026 tab, captured 2026-08-13. Jan–Jul actuals.
// `transfer` / `cash` already corrected per KASIA_SHEET_MAP.
window.KASIA_2026_EMBEDDED = {
  year: 2026,
  months: [
    {
      month: "Jan", idx: 0,
      hotel_revenue: 159222055,
      airbnb: 49415721, agoda: 0, traveloka: 0, asiapay: 0, edc: 0,
      transfer: 109806334, cash: 0,
      hotel_expense_total: 142106248,
      salary: 36800000, utilities: 13216918, laundry: 4092900,
      maintenance: 7747747, marketing: 8636000, supplies: 6656100,
      assets: 2109000, local: 4120374, legal: 35000000,
      taxes: 8047709, bank_credit: 15527000,
      investor_payout: 0, investment: 0,
      cafe_revenue: 32625516, cafe_expense: 27180050,
      studio_revenue: 900000,
      balance_hotel: 17115807,
    },
    {
      month: "Feb", idx: 1,
      hotel_revenue: 127542282,
      airbnb: 15681282, agoda: 3294823, traveloka: 0, asiapay: 0, edc: 0,
      transfer: 110766000, cash: 0,
      hotel_expense_total: 199867303,
      salary: 41014200, utilities: 9681307, laundry: 4017900,
      maintenance: 1103000, marketing: 2424017, supplies: 1705000,
      assets: 1500000, local: 1400000, legal: 3500000,
      taxes: 7886572, bank_credit: 15527000,
      investor_payout: 110015807, investment: 0,
      cafe_revenue: 34957624, cafe_expense: 39296389,
      studio_revenue: 0,
      balance_hotel: -72325021,
    },
    {
      month: "Mar", idx: 2,
      hotel_revenue: 116849513,
      airbnb: 53072013, agoda: 0, traveloka: 0, asiapay: 0, edc: 0,
      transfer: 63777500, cash: 0,
      hotel_expense_total: 106614120,
      salary: 49203200, utilities: 10847527, laundry: 3445200,
      maintenance: 2482999, marketing: 7548250, supplies: 2574000,
      assets: 0, local: 2650000, legal: 385000,
      taxes: 7015944, bank_credit: 15527000,
      investor_payout: 4400000, investment: 0,
      cafe_revenue: 34052615, cafe_expense: 25985128,
      studio_revenue: 0,
      balance_hotel: 10235393,
    },
    {
      month: "Apr", idx: 3,
      hotel_revenue: 142207130,
      airbnb: 75558254, agoda: 3504876, traveloka: 0, asiapay: 0, edc: 0,
      transfer: 57794000, cash: 5350000,
      hotel_expense_total: 104472782,
      salary: 46080000, utilities: 10519812, laundry: 3925800,
      maintenance: 1196000, marketing: 4619661, supplies: 5148900,
      assets: 0, local: 2200000, legal: 0,
      taxes: 15065609, bank_credit: 15527000,
      investor_payout: 0, investment: 0,
      cafe_revenue: 39329421, cafe_expense: 27942078,
      studio_revenue: 0,
      balance_hotel: 37734348,
    },
    {
      month: "May", idx: 4,
      hotel_revenue: 150224844,
      airbnb: 72897412, agoda: 24775989, traveloka: 0, asiapay: 0, edc: 0,
      transfer: 51750000, cash: 800000,
      hotel_expense_total: 88969176,
      salary: 35403200, utilities: 11573907, laundry: 4709400,
      maintenance: 0, marketing: 0, supplies: 5988800,
      assets: 0, local: 2000000, legal: 3885000,
      taxes: 9729369, bank_credit: 15527000,
      investor_payout: 0, investment: 0,
      cafe_revenue: 27467548, cafe_expense: 25477979,
      studio_revenue: 0,
      balance_hotel: 61255668,
    },
    {
      month: "Jun", idx: 5,
      hotel_revenue: 120636807,
      airbnb: 41158966, agoda: 9463163, traveloka: 900900, asiapay: 14239150, edc: 16975000,
      transfer: 28100000, cash: 6795323,
      hotel_expense_total: 102709304,
      salary: 38972000, utilities: 11721981, laundry: 4744100,
      maintenance: 2027000, marketing: 2548250, supplies: 7368200,
      assets: 0, local: 3350000, legal: 4900000,
      taxes: 11375773, bank_credit: 15527000,
      investor_payout: 0, investment: 0,
      cafe_revenue: 26271349, cafe_expense: 22676742,
      studio_revenue: 0,
      balance_hotel: 17927503,
    },
    {
      month: "Jul", idx: 6,
      hotel_revenue: 135348678,
      airbnb: 56280326, agoda: 20075621, traveloka: 4299750, asiapay: 8706140, edc: 0,
      transfer: 41300000, cash: 1670000,
      hotel_expense_total: 126591667,
      salary: 38071000, utilities: 8905484, laundry: 4250400,
      maintenance: 4451000, marketing: 30722065, supplies: 5453000,
      assets: 2412600, local: 2200000, legal: 0,
      taxes: 14391618, bank_credit: 15527000,
      investor_payout: 0, investment: 0,
      cafe_revenue: 21702955, cafe_expense: 19985258,
      studio_revenue: 0,
      balance_hotel: 8757011,
    },
  ]
};

// --------- OCCUPANCY (PMS export, manual snapshot) -----------
// Monthly figures for 2023/2024/2025 are from the legacy booking system
// (occupancy report screenshots, captured 2026-05). 2026 has no per-month
// breakdown yet — only an aggregate from the new system covering 1 Dec 2025
// through 1 May 2026. Don't synthesize per-month 2026 numbers.
window.KASIA_OCCUPANCY = {
  byYear: {
    2023: [0.13, 0.80, 0.98, 0.98, 0.98, 0.98, 0.96, 0.96, 0.98, 0.92, 0.75, 0.70],
    2024: [0.93, 0.98, 0.93, 0.94, 0.94, 0.98, 0.94, 0.96, 0.97, 0.79, 0.93, 0.92],
    // Dec 2025 (0.55) reads low because the booking system was being
    // migrated mid-month. Treat as a transition artifact, not real demand.
    2025: [0.90, 0.95, 0.85, 0.85, 0.91, 0.94, 0.96, 0.96, 0.87, 0.87, 0.81, 0.55],
    2026: [null, null, null, null, null, null, null, null, null, null, null, null],
  },
  newSystem: {
    range: "1 Dec 2025 – 1 May 2026",
    rangeShort: "Dec 25 – Apr 26",
    totalRoomNights: 1281,
    occupiedRoomNights: 1075,
    closedRoomNights: 0,
    unoccupiedRoomNights: 206,
    avgOccupancy: 0.84,
    avgLengthOfStay: 7,
    avgLeadTimeDays: 12,
    note: "New PMS, 5-month rolling window through Apr 2026. Overlaps the old system in Dec 2025.",
  },
  annualAvg(year) {
    const arr = (this.byYear[year] || []).filter(v => v != null);
    if (!arr.length) return null;
    if (year === 2025) {
      const clean = this.byYear[2025].slice(0, 11).filter(v => v != null);
      return clean.reduce((a,b) => a+b, 0) / clean.length;
    }
    return arr.reduce((a,b) => a+b, 0) / arr.length;
  },
};

// =============================================================
// FORMATTERS
// =============================================================
const trimDec = s => s.replace(/\.0+(?=\s|$)/, '');

window.fmtIDR = n => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return trimDec((n/1e9).toFixed(2)) + " B";
  if (abs >= 1e8) return trimDec((n/1e6).toFixed(0)) + " M";
  if (abs >= 1e6) return trimDec((n/1e6).toFixed(1)) + " M";
  if (abs >= 1e3) return trimDec((n/1e3).toFixed(0)) + " k";
  return String(Math.round(n));
};
window.fmtIDRfull = n => "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n));

// Foreign-currency values are small enough (tens of thousands) that full
// thousands separators read better than compact suffixes.
window.fmtFX = (n, code) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const sym = { USD: '$', EUR: '€' }[code] || '';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs === 0) return sym + "0";
  if (abs >= 1e6) return sign + sym + trimDec((abs/1e6).toFixed(2)) + " M";
  if (abs < 1) return sign + sym + abs.toFixed(2);
  return sign + sym + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(abs);
};

// Format a value that is ALREADY expressed in the active currency.
window.fmtVal = n => KASIA_CUR.isIDR() ? fmtIDR(n) : fmtFX(n, KASIA_CUR.code);

// Compact variant for chart axis labels.
window.fmtValAxis = n => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (KASIA_CUR.isIDR()) return fmtIDR(n);
  const sym = { USD: '$', EUR: '€' }[KASIA_CUR.code] || '';
  const abs = Math.abs(n), sign = n < 0 ? '-' : '';
  if (abs >= 1e6) return sign + sym + trimDec((abs/1e6).toFixed(1)) + "M";
  if (abs >= 1e3) return sign + sym + trimDec((abs/1e3).toFixed(0)) + "k";
  return sign + sym + Math.round(abs);
};

window.fmtRate = r => {
  if (r == null) return "—";
  return "Rp " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(r));
};
window.fmtPct = n => trimDec((n*100).toFixed(1)) + "%";
window.fmtDelta = n => (n > 0 ? "+" : "") + trimDec((n*100).toFixed(1)) + "%";
window.esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// =============================================================
// CSV PARSER
// =============================================================
function parseCSV(text) {
  const rows = [];
  let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], nx = text[i+1];
    if (q) {
      if (ch === '"' && nx === '"') { cur += '"'; i++; }
      else if (ch === '"') { q = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') q = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\r') { /* skip */ }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else { cur += ch; }
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
window.parseCSV = parseCSV;

window.parseNum = s => {
  if (s == null) return 0;
  let t = String(s).trim();
  if (!t || t === '-' || /^#[A-Z/!?0-9]+$/i.test(t)) return 0;
  t = t.replace(/Rp/gi,'').replace(/[\s ]/g,'');
  const hasDot = t.includes('.'), hasComma = t.includes(',');
  let clean;
  if (hasDot && hasComma) {
    const lastDot = t.lastIndexOf('.'), lastComma = t.lastIndexOf(',');
    clean = (lastComma > lastDot) ? t.replace(/\./g,'').replace(',','.') : t.replace(/,/g,'');
  } else if (hasComma) {
    const parts = t.split(',');
    clean = (parts.length === 2 && parts[1].length <= 2) ? t.replace(',','.') : t.replace(/,/g,'');
  } else if (hasDot) {
    const parts = t.split('.');
    clean = (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) ? t.replace(/\./g,'') : t;
  } else {
    clean = t;
  }
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
};

// =============================================================
// 2026 SHEET PARSER
// =============================================================
// Resolves columns by exact normalized header match against
// KASIA_SHEET_MAP. Throws loudly on a missing critical column rather
// than silently falling through to the wrong one.
const normHdr = s => String(s || '')
  .replace(/ /g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toUpperCase();

window.parseSheet2026 = function (text) {
  const rows = parseCSV(text);
  const headerIdx = rows.findIndex(r => r[0] && /date/i.test(r[0]));
  if (headerIdx < 0) throw new Error("header row not found");
  const header = rows[headerIdx].map(normHdr);

  const resolve = spec => {
    const wantLast = spec.endsWith('|LAST');
    const want = wantLast ? spec.slice(0, -5) : spec;
    let found = -1;
    for (let i = 0; i < header.length; i++) {
      if (header[i] === want) { found = i; if (!wantLast) break; }
    }
    return found;
  };

  const C = {};
  const missing = [];
  Object.entries(KASIA_SHEET_MAP).forEach(([key, spec]) => {
    const i = resolve(spec);
    C[key] = i;
    if (i < 0) missing.push(key + ' ("' + spec.replace('|LAST','') + '")');
  });
  if (C.hotel_revenue < 0 || C.hotel_expense_total < 0) {
    throw new Error("sheet layout changed — critical columns missing: " + missing.join(', '));
  }
  if (missing.length) console.warn('[kasia] sheet columns not found, treated as 0:', missing);

  const MONTHS = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY",
                  "AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER","DESEMBER"];
  const SHORT  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const out = [];
  const seen = new Set();
  rows.forEach(r => {
    if (!r[0]) return;
    const mi = MONTHS.indexOf(normHdr(r[0]));
    if (mi < 0) return;
    const idx = mi === 12 ? 11 : mi;
    if (seen.has(idx)) return;            // the sheet repeats month names in a
    const rev = parseNum(r[C.hotel_revenue]);  // second block below the totals
    if (!rev) return;
    seen.add(idx);
    const m = { month: SHORT[idx], idx };
    Object.keys(C).forEach(k => { m[k] = C[k] >= 0 ? parseNum(r[C[k]]) : 0; });
    out.push(m);
  });
  if (!out.length) throw new Error("no months parsed");
  out.sort((a,b) => a.idx - b.idx);
  return { year: 2026, months: out };
};

// =============================================================
// QUARTERS
// =============================================================
window.KASIA_QUARTERS = [
  { key: "Q1", label: "Q1", months: [0,1,2],   span: "Jan – Mar" },
  { key: "Q2", label: "Q2", months: [3,4,5],   span: "Apr – Jun" },
  { key: "Q3", label: "Q3", months: [6,7,8],   span: "Jul – Sep" },
  { key: "Q4", label: "Q4", months: [9,10,11], span: "Oct – Dec" },
];

// Which quarters have any data, and whether each is complete.
window.quarterStatus = function (data) {
  const have = new Set(data.months.map(m => m.idx));
  return KASIA_QUARTERS.map(q => {
    const present = q.months.filter(i => have.has(i));
    return {
      ...q,
      present,
      count: present.length,
      available: present.length > 0,
      partial: present.length > 0 && present.length < 3,
      monthNames: present.map(i => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i]),
    };
  });
};

window.sliceQuarter = function (data, qKey) {
  const q = KASIA_QUARTERS.find(x => x.key === qKey);
  if (!q) return { year: data.year, months: [] };
  return { year: data.year, months: data.months.filter(m => q.months.includes(m.idx)) };
};

// =============================================================
// METRICS
// =============================================================
// All sums convert month-by-month at each month's own rate, then add.
// Never convert an aggregate at an average rate.
window.computeMetrics = function (data, opts) {
  opts = opts || {};
  const cur = opts.cur || KASIA_CUR.code;
  const year = data.year || opts.year || 2026;
  const months = data.months;

  const sumIDR = k => months.reduce((a,m) => a + (m[k]||0), 0);
  const sum    = k => fxSum(months, k, year, cur);

  const revenue = sum('hotel_revenue');
  const revenueIDR = sumIDR('hotel_revenue');
  const expense_total = sum('hotel_expense_total');
  const investor_payout = sum('investor_payout');
  const investment = sum('investment');
  const opex = expense_total - investor_payout - investment;
  const op_profit = revenue - opex;
  const op_margin = op_profit / (revenue || 1);

  const channels = {
    transfer: sum('transfer'), airbnb: sum('airbnb'), agoda: sum('agoda'),
    asiapay: sum('asiapay'), traveloka: sum('traveloka'),
    edc: sum('edc'), cash: sum('cash'),
  };
  const chan_total = Object.values(channels).reduce((a,b)=>a+b,0) || 1;

  const costs = {
    "Salary & Wages":     { v: sum('salary'),      note: "staff payroll" },
    "Utilities":          { v: sum('utilities'),   note: "power, water, internet" },
    "Marketing & Sales":  { v: sum('marketing'),   note: "ads, OTA, content" },
    "Maintenance":        { v: sum('maintenance'), note: "repairs, upkeep" },
    "Laundry":            { v: sum('laundry'),     note: "linens, F&B" },
    "Supplies":           { v: sum('supplies'),    note: "amenities, consumables" },
    "Local & Community":  { v: sum('local'),       note: "banjar, neighborhood" },
    "Legal & Permits":    { v: sum('legal'),       note: "permits, notary" },
    "Assets":             { v: sum('assets'),      note: "capitalizable purchases" },
  };
  const costs_total = Object.values(costs).reduce((a,c)=>a+c.v,0);

  const cafe_rev = sum('cafe_revenue');
  const cafe_opex = sum('cafe_expense');
  const studio_rev = sum('studio_revenue');
  const balance_reported = sum('balance_hotel');

  // What rate this period actually ran at.
  const blended = cur === 'IDR' ? 1 : fxBlended(revenueIDR, revenue);
  const rateFirst = fxRate(year, months.length ? months[0].idx : 0, cur);
  const rateLast  = fxRate(year, months.length ? months[months.length-1].idx : 0, cur);

  return {
    months, year, cur,
    revenue, revenueIDR, opex, op_profit, op_margin,
    expense_total, investor_payout, investment, balance_reported,
    taxes: sum('taxes'), bank_credit: sum('bank_credit'),
    channels, chan_total, costs, costs_total,
    cafe_rev, cafe_opex, cafe_net: cafe_rev - cafe_opex,
    studio_rev,
    fx: { blended, rateFirst, rateLast,
          drift: (rateFirst && rateLast) ? (rateLast/rateFirst - 1) : 0 },
  };
};

// Convert a historical year's monthly revenue/expense/balance arrays.
window.historyTotals = function (year, code) {
  code = code || KASIA_CUR.code;
  const h = KASIA_HISTORY[year];
  if (!h) return null;
  const revenue = fxSum(h.months, 'revenue', year, code);
  const expense = fxSum(h.months, 'expense', year, code);
  const balance = fxSum(h.months, 'balance', year, code);
  const revenueIDR = h.months.reduce((a,m)=>a+m.revenue, 0);
  return {
    revenue, expense, balance, revenueIDR,
    blended: code === 'IDR' ? 1 : fxBlended(revenueIDR, revenue),
    // For undated line items only.
    annualRate: fxAnnualRate(year, code),
  };
};

// =============================================================
// AUTH HELPERS
// =============================================================
window.getToken = function () {
  try { return localStorage.getItem('kasia_token') || ''; } catch (e) { return ''; }
};
window.isLoggedIn = function () { return !!window.getToken(); };

// =============================================================
// LOADER
// =============================================================
window.loadYear = async function (year) {
  if (year === 2026) {
    // 1. Backend proxy (app.py). Authenticated; works from any origin.
    try {
      const res = await fetch('api/data?year=2026', {
        headers: { 'Authorization': 'Bearer ' + window.getToken() },
        cache: 'no-store'
      });
      if (res.status === 401) {
        try { localStorage.removeItem('kasia_token'); } catch (e) {}
        if (window.showLogin) window.showLogin('Session expired. Please log in again.');
        throw new Error('HTTP_401: Unauthorized');
      }
      if (res.ok) {
        const j = await res.json();
        if (j && j.data && j.data.months && j.data.months.length) {
          j.data.year = 2026;
          return j;
        }
      }
      throw new Error('backend unavailable');
    } catch (e) {
      console.warn('[kasia] backend fetch failed:', e.message);
    }

    // 2. Google gviz directly. Works from localhost and file:// in some
    //    browsers; blocked by CORS on most hosted origins, including
    //    GitHub Pages. Attempted anyway — costs one failed request.
    const gid = window.KASIA_CONFIG.tabs[2026];
    if (gid) {
      try {
        const res = await fetch(window.KASIA_CONFIG.gvizUrl(gid), { cache: 'no-store' });
        if (!res.ok) throw new Error('gviz HTTP ' + res.status);
        const data = window.parseSheet2026(await res.text());
        return { data, source: 'live' };
      } catch (e) {
        console.warn('[kasia] direct sheet fetch failed:', e.message);
      }
    }

    // 3. Embedded snapshot. This is what the static deployment actually
    //    renders, so refresh it whenever new months land in the sheet.
    return { data: window.KASIA_2026_EMBEDDED, source: 'embedded' };
  }
  return { data: window.KASIA_HISTORY[year], source: 'embedded' };
};

// =============================================================
// CURRENCY SWITCHER (shared UI)
// =============================================================
// Injects a three-way IDR / USD / EUR switch into `container` and calls
// `onChange` when the selection changes. Selection persists in
// localStorage so it carries across the three views.
window.mountCurrencySwitch = function (container, onChange) {
  const el = (typeof container === 'string') ? document.querySelector(container) : container;
  if (!el) return;
  const codes = ['IDR', 'USD', 'EUR'];
  el.classList.add('cur-switch');
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', 'Display currency');
  el.innerHTML = codes.map(c =>
    `<button type="button" data-cur="${c}" aria-pressed="${c === KASIA_CUR.code}"` +
    `${c === KASIA_CUR.code ? ' class="active"' : ''}>${c}</button>`
  ).join('');
  el.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const code = btn.dataset.cur;
    if (code === KASIA_CUR.code) return;
    KASIA_CUR.set(code);
    el.querySelectorAll('button').forEach(b => {
      const on = b.dataset.cur === code;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (onChange) onChange(code);
  });
};

// Standard footnote explaining the conversion, for any view showing FX.
window.fxFootnote = function (year, monthsUsed) {
  if (KASIA_CUR.isIDR()) return '';
  const code = KASIA_CUR.code;
  const rates = (monthsUsed || []).map(i => fxRate(year, i, code)).filter(v => v != null);
  const lo = rates.length ? Math.min(...rates) : null;
  const hi = rates.length ? Math.max(...rates) : null;
  let s = `<b>${esc(code)} conversion.</b> Each month is converted at that month's average ` +
          `IDR/${esc(code)} rate and the months are then summed — the period is never converted ` +
          `at a single blended rate. Source: ${esc(KASIA_FX.source)}.`;
  if (lo && hi && lo !== hi) {
    s += ` Range across this period: ${esc(fmtRate(lo))} – ${esc(fmtRate(hi))} per ${esc(code === 'USD' ? '$1' : '€1')}.`;
  }
  return s;
};
