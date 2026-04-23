// =============================================================
// KASIA UNGASAN · shared data layer
// =============================================================
// - Embedded historical data (2023 / 2024 / 2025)
// - Fetches the live 2026 sheet via Google's gviz CSV endpoint
//   (no "Publish to web" required — only sheet share access)
// - Tolerant CSV parser (handles ID + US locales, "" escapes, newlines)
// - Metric calculators used by all three views
// =============================================================

// --------- LIVE SHEET CONFIG ---------------------------------
// Anyone-with-link sharing is enough. No "Publish to web" needed.
// gviz CSV works as long as the sheet is readable by link.
window.KASIA_CONFIG = {
  sheetId: "1eisZIIB3j8wRNYqLhTDjQSwMXUWgTPZR",
  tabs: {
    2026: "351591053",          // TOTAL 2026 gid (confirmed)
    // these gids are placeholders — set them when known; historical
    // is otherwise served from the embedded snapshots below.
    2025: null,
    2024: null,
    2023: null,
  },
  gvizUrl(gid) {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  },
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
      { m: "Jan", revenue: 54100000, expense: 315287363, balance: -261187363 },
      { m: "Feb", revenue: 37250000, expense: 140699469, balance: -103449469 },
      { m: "Mar", revenue: 83470360, expense: 98000497,  balance: -14530137 },
      { m: "Apr", revenue: 75361301, expense: 66376637,  balance: 8984664 },
      { m: "May", revenue: 107610870+7258508, expense: 113121040, balance: 1748338 },
      { m: "Jun", revenue: 147982040+24748350, expense: 151670222, balance: 21060168 },
      { m: "Jul", revenue: 85212525+24201876,  expense: 98690205,  balance: 10724196 },
      { m: "Aug", revenue: 170130543+1202471,  expense: 179361417, balance: -8028403 },
      { m: "Sep", revenue: 195209614+2432599,  expense: 173113787, balance: 24528426 },
      { m: "Oct", revenue: 146416532+3885906,  expense: 185529215, balance: -35226777 },
      { m: "Nov", revenue: 182827287+3720839,  expense: 141569342, balance: 44978784 },
      { m: "Dec", revenue: 78609288+2609292,   expense: 144479362, balance: -63260782 },
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
      { m: "Jan", revenue: 162560070, expense: 182076733, balance: -19516663 },
      { m: "Feb", revenue: 108437601, expense: 132571069, balance: -24133468 },
      { m: "Mar", revenue: 151990815, expense: 156652731, balance: -4661916 },
      { m: "Apr", revenue: 142123832, expense: 161401982, balance: -19278150 },
      { m: "May", revenue: 180307224, expense: 181451540, balance: -1144316 },
      { m: "Jun", revenue: 162067496, expense: 133456740, balance: 28610756 },
      { m: "Jul", revenue: 171887790, expense: 107677181, balance: 64210609 },
      { m: "Aug", revenue: 194051945, expense: 213538212, balance: -19486267 },
      { m: "Sep", revenue: 160688144, expense: 109680882, balance: 51007262 },
      { m: "Oct", revenue: 159297746, expense: 191064679, balance: -31766933 },
      { m: "Nov", revenue: 119300566, expense: 177153389, balance: -57852823 },
      { m: "Dec", revenue: 162371880, expense: 120717048, balance: 41654832 },
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
      { m: "Jan", revenue: 176692132, expense: 160701475, balance: 5406861 },
      { m: "Feb", revenue: 115774305, expense: 103098477, balance: 4992865 },
      { m: "Mar", revenue: 144433711, expense: 100786987, balance: 27147116 },
      { m: "Apr", revenue: 164494682, expense: 135846687, balance: -3538395 },
      { m: "May", revenue: 184957561, expense: 118990585, balance: 25079464 },
      { m: "Jun", revenue: 191026547, expense: 150693614, balance: 9078171 },
      { m: "Jul", revenue: 159359493, expense: 147296656, balance: -13345331 },
      { m: "Aug", revenue: 187933874, expense: 129529111, balance: 29967831 },
      { m: "Sep", revenue: 214214290, expense: 212564738, balance: -12868360 },
      { m: "Oct", revenue: 123236818, expense: 113792558, balance: -22579382 },
      { m: "Nov", revenue: 169418555, expense: 96478521,  balance: 48865190 },
      { m: "Dec", revenue: 122318279, expense: 119848580, balance: -21985896 },
    ],
  },
};

// --------- 2026 embedded fallback ----------------------------
window.KASIA_2026_EMBEDDED = {
  year: 2026,
  months: [
    {
      month: "Jan", idx: 0,
      hotel_revenue: 159222055,
      airbnb: 49415721, agoda: 0, transfer: 109806334, cash: 0, edc: 0,
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
      airbnb: 15681282, agoda: 3294823, transfer: 110766000, cash: 0, edc: 0,
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
      airbnb: 53072013, agoda: 0, transfer: 63777500, cash: 0, edc: 0,
      hotel_expense_total: 106614120,
      salary: 49203200, utilities: 10847527, laundry: 3445200,
      maintenance: 2482999, marketing: 7548250, supplies: 2574000,
      assets: 0, local: 2650000, legal: 385000,
      taxes: 7015944, bank_credit: 15527000,
      investor_payout: 4400000, investment: 0,
      cafe_revenue: 34052615, cafe_expense: 26390128,
      studio_revenue: 0,
      balance_hotel: 10235393,
    }
  ]
};

// --------- FORMATTERS ----------------------------------------
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
window.fmtPct = n => trimDec((n*100).toFixed(1)) + "%";
window.fmtDelta = n => (n > 0 ? "+" : "") + trimDec((n*100).toFixed(1)) + "%";
window.esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// --------- CSV PARSER ----------------------------------------
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
  t = t.replace(/Rp/gi,'').replace(/[\s\u00A0]/g,'');
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

// --------- 2026 SHEET PARSER (matches the TOTAL 2026 layout) -
window.parseSheet2026 = function(text) {
  const rows = parseCSV(text);
  let headerIdx = rows.findIndex(r => r[0] && /date/i.test(r[0]));
  if (headerIdx < 0) throw new Error("header not found");
  const header = rows[headerIdx].map(c => (c||'').trim().toUpperCase());
  const byContains = frag => header.findIndex(h => h.includes(frag));
  const findCol = (...frags) => { for (const f of frags) { const i = byContains(f); if (i >= 0) return i; } return -1; };
  const C = {
    hotel_revenue: findCol('INCOME HOTEL'),
    airbnb: findCol('INCOME AIRBNB', 'AIRBNB'),
    agoda: findCol('INCOME AGODA', 'AGODA'),
    edc: findCol('INCOME EDC', 'EDC'),
    transfer: findCol('INCOME TRANSFER', 'TRANSFER'),
    cash: findCol('INCOME CASH'),
    hotel_expense_total: findCol('EXPENSE HOTEL'),
    salary: findCol('SALARY', 'WAGES'),
    utilities: findCol('UTILITIES'),
    laundry: findCol('LAUNDRY'),
    maintenance: findCol('MAINTENANCE'),
    marketing: findCol('MARKETING', 'SALES & MARKETING', 'SALES &'),
    supplies: findCol('SUPPLIES'),
    assets: findCol('ASSETS'),
    local: findCol('LOCAL'),
    legal: findCol('LEGAL'),
    taxes: findCol('TAXES', 'TAX'),
    bank_credit: findCol('BANK CREDIT'),
    investor_payout: findCol('PAYOUT INVESTOR', 'INVESTOR PAYOUT'),
    investment: findCol('INVESTMENT'),
    cafe_revenue: findCol('INCOME CAFE'),
    cafe_expense: findCol('EXPENSE CAFE'),
    studio_revenue: findCol('PHOTO STUDIO', 'STUDIO INCOME', 'STUDIO'),
    balance_hotel: findCol('BALANCE HOTEL'),
  };
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December","Desember"];
  const out = [];
  rows.forEach(r => {
    if (!r[0]) return;
    const mIdx = MONTHS.findIndex(m => m.toLowerCase() === r[0].trim().toLowerCase());
    if (mIdx < 0) return;
    const rev = C.hotel_revenue >= 0 ? parseNum(r[C.hotel_revenue]) : 0;
    if (rev === 0 && !r.slice(1,28).some(c => c && c.trim())) return;
    const m = { month: r[0].trim().slice(0,3), idx: mIdx === 12 ? 11 : mIdx };
    Object.keys(C).forEach(k => { m[k] = C[k] >= 0 ? parseNum(r[C[k]]) : 0; });
    out.push(m);
  });
  if (!out.length) throw new Error("no months parsed");
  return { year: 2026, months: out };
};

// --------- METRICS -------------------------------------------
window.computeMetrics = function(data) {
  const months = data.months;
  const sum = k => months.reduce((a,m)=>a + (m[k]||0), 0);
  const revenue = sum('hotel_revenue');
  const expense_total = sum('hotel_expense_total');
  const investor_payout = sum('investor_payout');
  const investment = sum('investment');
  const opex = expense_total - investor_payout - investment;
  const op_profit = revenue - opex;
  const op_margin = op_profit / (revenue || 1);
  const channels = {
    transfer: sum('transfer'), airbnb: sum('airbnb'), agoda: sum('agoda'),
    edc: sum('edc'), cash: sum('cash'),
  };
  const chan_total = Object.values(channels).reduce((a,b)=>a+b,0) || 1;
  const costs = {
    "Salary & Wages": { v: sum('salary'), note: "staff payroll" },
    "Utilities": { v: sum('utilities'), note: "power, water, internet" },
    "Marketing & Sales": { v: sum('marketing'), note: "ads, OTA, content" },
    "Maintenance": { v: sum('maintenance'), note: "repairs, upkeep" },
    "Laundry": { v: sum('laundry'), note: "linens, F&B" },
    "Supplies": { v: sum('supplies'), note: "amenities, consumables" },
    "Local & Community": { v: sum('local'), note: "banjar, neighborhood" },
    "Legal & Permits": { v: sum('legal'), note: "one-off Jan Rp 35M" },
    "Assets": { v: sum('assets'), note: "capitalizable purchases" },
  };
  const costs_total = Object.values(costs).reduce((a,c)=>a+c.v,0);
  const cafe_rev = sum('cafe_revenue');
  const cafe_opex = sum('cafe_expense');
  const studio_rev = sum('studio_revenue');
  const balance_reported = sum('balance_hotel');
  return {
    months, revenue, opex, op_profit, op_margin,
    expense_total, investor_payout, balance_reported,
    channels, chan_total, costs, costs_total,
    cafe_rev, cafe_opex, cafe_net: cafe_rev - cafe_opex,
    studio_rev,
  };
};

// --------- LOADER --------------------------------------------
// Attempts live fetch; falls back to embedded.
window.loadYear = async function(year) {
  const gid = window.KASIA_CONFIG.tabs[year];
  if (year === 2026 && gid) {
    try {
      const url = window.KASIA_CONFIG.gvizUrl(gid);
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed');
      const text = await res.text();
      const data = window.parseSheet2026(text);
      return { data, source: 'live' };
    } catch (e) {
      console.warn('live fetch failed, using embedded', e);
    }
  }
  if (year === 2026) return { data: window.KASIA_2026_EMBEDDED, source: 'embedded' };
  // historical — served from embedded snapshot
  return { data: window.KASIA_HISTORY[year], source: 'embedded' };
};
