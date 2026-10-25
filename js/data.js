const BRAND_PATHS = {
  bitcoin:
    "M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z",
  ethereum:
    "M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z",
  solana:
    "m23.8764 18.0313-3.962 4.1393a.9201.9201 0 0 1-.306.2106.9407.9407 0 0 1-.367.0742H.4599a.4689.4689 0 0 1-.2522-.0733.4513.4513 0 0 1-.1696-.1962.4375.4375 0 0 1-.0314-.2545.4438.4438 0 0 1 .117-.2298l3.9649-4.1393a.92.92 0 0 1 .3052-.2102.9407.9407 0 0 1 .3658-.0746H23.54a.4692.4692 0 0 1 .2523.0734.4531.4531 0 0 1 .1697.196.438.438 0 0 1 .0313.2547.4442.4442 0 0 1-.1169.2297zm-3.962-8.3355a.9202.9202 0 0 0-.306-.2106.941.941 0 0 0-.367-.0742H.4599a.4687.4687 0 0 0-.2522.0734.4513.4513 0 0 0-.1696.1961.4376.4376 0 0 0-.0314.2546.444.444 0 0 0 .117.2297l3.9649 4.1394a.9204.9204 0 0 0 .3052.2102c.1154.049.24.0744.3658.0746H23.54a.469.469 0 0 0 .2523-.0734.453.453 0 0 0 .1697-.1961.4382.4382 0 0 0 .0313-.2546.4444.4444 0 0 0-.1169-.2297zM.46 6.7225h18.7815a.9411.9411 0 0 0 .367-.0742.9202.9202 0 0 0 .306-.2106l3.962-4.1394a.4442.4442 0 0 0 .117-.2297.4378.4378 0 0 0-.0314-.2546.453.453 0 0 0-.1697-.196.469.469 0 0 0-.2523-.0734H4.7596a.941.941 0 0 0-.3658.0745.9203.9203 0 0 0-.3052.2102L.1246 5.9687a.4438.4438 0 0 0-.1169.2295.4375.4375 0 0 0 .0312.2544.4512.4512 0 0 0 .1692.196.4689.4689 0 0 0 .2518.0739z",
  chainlink:
    "M12 0L9.798 1.266l-6 3.468L1.596 6v12l2.202 1.266 6.055 3.468L12.055 24l2.202-1.266 5.945-3.468L22.404 18V6l-2.202-1.266-6-3.468zM6 15.468V8.532l6-3.468 6 3.468v6.936l-6 3.468z",
  near: "M21.443 0c-.89 0-1.714.46-2.18 1.218l-5.017 7.448a.533.533 0 0 0 .792.7l4.938-4.282a.2.2 0 0 1 .334.151v13.41a.2.2 0 0 1-.354.128L5.03.905A2.555 2.555 0 0 0 3.078 0h-.521A2.557 2.557 0 0 0 0 2.557v18.886a2.557 2.557 0 0 0 4.736 1.338l5.017-7.448a.533.533 0 0 0-.792-.7l-4.938 4.283a.2.2 0 0 1-.333-.152V5.352a.2.2 0 0 1 .354-.128l14.924 17.87c.486.574 1.2.905 1.952.906h.521A2.558 2.558 0 0 0 24 21.445V2.557A2.558 2.558 0 0 0 21.443 0Z",
};

export const COINS = [
  { sym: "BTC", id: "bitcoin", name: "Bitcoin", cat: "Layer 1", price: 80837, change24h: 0.07, change7d: 3.1, mcap: 1.625e12, vol: 2.087e10, rank: 1, ai: 94, cls: "btc", brand: "bitcoin" },
  { sym: "ETH", id: "ethereum", name: "Ethereum", cat: "Layer 1", price: 2364.39, change24h: -0.6, change7d: -2.4, mcap: 2.888e11, vol: 8.908e9, rank: 2, ai: 92, cls: "eth", brand: "ethereum" },
  { sym: "SOL", id: "solana", name: "Solana", cat: "Layer 1", price: 102.42, change24h: -0.01, change7d: 5.6, mcap: 6.04e10, vol: 2.258e9, rank: 7, ai: 91, cls: "sol", brand: "solana" },
  { sym: "LINK", id: "chainlink", name: "Chainlink", cat: "DeFi", price: 11.55, change24h: -2.47, change7d: 1.8, mcap: 8.855e9, vol: 2.322e8, rank: 16, ai: 86, cls: "link", brand: "chainlink" },
  { sym: "NEAR", id: "near", name: "NEAR Protocol", cat: "Layer 1", price: 4.48, change24h: -3.3, change7d: -6.1, mcap: 5.865e9, vol: 6.588e8, rank: 20, ai: 78, cls: "near", brand: "near" },
  { sym: "UNI", id: "uniswap", name: "Uniswap", cat: "DeFi", price: 6.82, change24h: -2.01, change7d: -3.4, mcap: 4.261e9, vol: 2.895e8, rank: 26, ai: 74, cls: "uni", glyph: "U" },
  { sym: "AVAX", id: "avalanche-2", name: "Avalanche", cat: "Layer 1", price: 8.94, change24h: -1.17, change7d: -1.2, mcap: 3.971e9, vol: 1.991e8, rank: 28, ai: 72, cls: "avax", glyph: "A" },
  { sym: "ARB", id: "arbitrum", name: "Arbitrum", cat: "Scaling", price: 0.1673, change24h: -2.08, change7d: -4.8, mcap: 1.153e9, vol: 1.102e8, rank: 71, ai: 69, cls: "arb", glyph: "A" },
  { sym: "RENDER", id: "render-token", name: "Render", cat: "AI", price: 1.7, change24h: -2.13, change7d: 7.4, mcap: 8.811e8, vol: 3.817e7, rank: 79, ai: 81, cls: "render", glyph: "R" },
  { sym: "FET", id: "fetch-ai", name: "Fetch.ai", cat: "AI", price: 0.1774, change24h: -1.34, change7d: -5.2, mcap: 4.102e8, vol: 8.034e7, rank: 120, ai: 76, cls: "fet", glyph: "F" },
].map((c) => ({ ...c, brandPath: c.brand ? BRAND_PATHS[c.brand] : null, sparkline: null }));

export const byId = (sym) => COINS.find((c) => c.sym === sym) || COINS[0];
export const byGeo = (id) => COINS.find((c) => c.id === id) || COINS[0];

export const SIGNALS = [
  { sym: "ETH", side: "long", conf: 92, rr: "2.3x", horizon: "4H", thesis: "Momentum compression above the 50-EMA with rising spot demand. Oracle expects a liquidity sweep into $2,480.", targetMul: 1.12, stopMul: 0.948 },
  { sym: "SOL", side: "long", conf: 91, rr: "2.8x", horizon: "1D", thesis: "Multi-week resistance being absorbed by spot bids; a daily close above $104.80 opens the $118 zone.", targetMul: 1.156, stopMul: 0.945 },
  { sym: "BTC", side: "long", conf: 89, rr: "2.1x", horizon: "1D", thesis: "Higher-low structure intact while funding stays neutral. Trend continuation remains favored on dips.", targetMul: 1.069, stopMul: 0.967 },
  { sym: "RENDER", side: "long", conf: 81, rr: "3.1x", horizon: "12H", thesis: "AI-sector rotation with accelerating on-chain volume. Early-stage reversal with tight invalidation.", targetMul: 1.165, stopMul: 0.947 },
  { sym: "LINK", side: "short", conf: 77, rr: "1.9x", horizon: "4H", thesis: "Rejection at the range midpoint with declining spot flow. Tactical mean-reversion short into support.", targetMul: 0.928, stopMul: 1.037 },
  { sym: "NEAR", side: "long", conf: 74, rr: "2.6x", horizon: "1D", thesis: "Capitulation candle into major support while whale wallets quietly add into weakness.", targetMul: 1.143, stopMul: 0.94 },
];

export const INTEL = [
  { icon: "pulse", tone: "mint", title: "Whale accumulation detected", body: "2,140 ETH moved off exchanges in 3 hours.", impact: "high", label: "High impact", ago: "8m ago" },
  { icon: "trend", tone: "violet", title: "Funding rates reset across majors", body: "Perp leverage flushed — healthier spot-led move.", impact: "medium", label: "Medium", ago: "24m ago" },
  { icon: "spark", tone: "amber", title: "SOL pressing multi-week resistance", body: "Break above $104.80 unlocks trend continuation.", impact: "low", label: "Watch", ago: "47m ago" },
];

const STORAGE_KEY = "cryptoai-pro-state-v1";

const DEFAULT_STATE = {
  holdings: [
    { sym: "BTC", qty: 1.25, cost: 71240 },
    { sym: "ETH", qty: 14.2, cost: 2680 },
    { sym: "SOL", qty: 150, cost: 88 },
    { sym: "LINK", qty: 900, cost: 14.2 },
    { sym: "AVAX", qty: 300, cost: 22 },
  ],
  cash: 8420.44,
  realized: 12480.18,
  activities: [
    { sym: "ETH", title: "Bought Ethereum", type: "Market buy", amount: 5000, qty: 2.11, ago: "2h ago", status: "Filled" },
    { sym: "BTC", title: "AI signal executed", type: "Oracle auto", amount: 12000, qty: 0.148, ago: "6h ago", status: "Filled" },
    { sym: "SOL", title: "Took profit", type: "Limit sell", amount: 3200, qty: 31.2, ago: "1d ago", status: "Filled" },
    { sym: "LINK", title: "Bought Chainlink", type: "Market buy", amount: 1800, qty: 155.8, ago: "2d ago", status: "Filled" },
    { sym: "USDT", title: "Deposit", type: "On-ramp", amount: 10000, qty: 10000, ago: "3d ago", status: "Settled" },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.holdings)) return clone(DEFAULT_STATE);
    return { ...clone(DEFAULT_STATE), ...parsed, activities: parsed.activities || clone(DEFAULT_STATE.activities) };
  } catch {
    return clone(DEFAULT_STATE);
  }
}

export const state = load();

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ holdings: state.holdings, cash: state.cash, realized: state.realized, activities: state.activities }));
  } catch {
    /* storage unavailable */
  }
}

export function portfolio() {
  const positions = state.holdings
    .map((h) => {
      const coin = byId(h.sym);
      const value = coin.price * h.qty;
      const basis = h.cost * h.qty;
      const pnl = value - basis;
      return { ...h, coin, value, basis, pnl, pnlPct: basis ? (pnl / basis) * 100 : 0 };
    })
    .filter((p) => p.coin);
  positions.sort((a, b) => b.value - a.value);
  const marketValue = positions.reduce((sum, p) => sum + p.value, 0);
  const invested = positions.reduce((sum, p) => sum + p.basis, 0);
  const total = marketValue + state.cash;
  const dayPnl = positions.reduce((sum, p) => sum + (p.value * p.coin.change24h) / 100, 0);
  positions.forEach((p) => {
    p.alloc = marketValue ? (p.value / marketValue) * 100 : 0;
  });
  return {
    positions,
    marketValue,
    invested,
    cash: state.cash,
    total,
    dayPnl,
    unrealized: marketValue - invested,
    unrealizedPct: invested ? ((marketValue - invested) / invested) * 100 : 0,
    totalPnlPct: invested ? ((total - invested) / invested) * 100 : 0,
  };
}

export function applyTrade(sym, side, usd) {
  const coin = byId(sym);
  if (!(usd > 0)) return { ok: false, reason: "Enter an amount greater than zero." };
  const available = side === "buy" ? state.cash : coin.price * holdingQty(sym);
  if (usd > available + 0.005) {
    return { ok: false, reason: side === "buy" ? "Not enough available cash." : "You do not hold enough to sell that amount." };
  }
  const amount = usd;
  const qty = amount / coin.price;
  const existing = state.holdings.find((h) => h.sym === sym);
  if (side === "buy") {
    state.cash -= amount;
    if (existing) {
      existing.cost = (existing.cost * existing.qty + amount) / (existing.qty + qty);
      existing.qty += qty;
    } else {
      state.holdings.push({ sym, qty, cost: coin.price });
    }
    state.activities.unshift({ sym, title: `Bought ${coin.name}`, type: "Market buy", amount, qty, ago: "just now", status: "Filled" });
  } else {
    const realized = (coin.price - existing.cost) * qty;
    existing.qty -= qty;
    if (existing.qty <= 1e-8) state.holdings = state.holdings.filter((h) => h.sym !== sym);
    state.cash += amount;
    state.realized += realized;
    state.activities.unshift({ sym, title: `Sold ${coin.name}`, type: "Market sell", amount, qty, ago: "just now", status: "Filled" });
  }
  state.activities = state.activities.slice(0, 8);
  persist();
  return { ok: true, qty, amount };
}

export function holdingQty(sym) {
  const h = state.holdings.find((x) => x.sym === sym);
  return h ? h.qty : 0;
}

export function seedRng(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i += 1) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeSparkline(sym, endPrice, changePct, points = 56) {
  const rnd = seedRng(sym + "spark");
  const series = [];
  const start = endPrice / (1 + changePct / 100);
  const drift = (endPrice - start) / (points - 1);
  let value = start;
  for (let i = 0; i < points; i += 1) {
    const noise = (rnd() - 0.5) * endPrice * 0.018;
    value = start + drift * i + noise;
    series.push(Math.max(value, endPrice * 0.45));
  }
  series[points - 1] = endPrice;
  return series;
}

export function applyMarketData(rows) {
  rows.forEach((row) => {
    const coin = byGeo(row.id);
    if (!coin) return;
    coin.price = row.current_price;
    coin.change24h = row.price_change_percentage_24h ?? coin.change24h;
    coin.change7d = row.price_change_percentage_7d_in_currency ?? coin.change7d;
    coin.mcap = row.market_cap;
    coin.vol = row.total_volume;
    coin.rank = row.market_cap_rank ?? coin.rank;
    if (Array.isArray(row.sparkline_in_7d?.price) && row.sparkline_in_7d.price.length > 10) {
      coin.sparkline = row.sparkline_in_7d.price;
    }
  });
  COINS.forEach((coin) => {
    if (!coin.sparkline) coin.sparkline = makeSparkline(coin.sym, coin.price, coin.change7d);
  });
  return true;
}

export function ensureSparklines() {
  COINS.forEach((coin) => {
    if (!coin.sparkline) coin.sparkline = makeSparkline(coin.sym, coin.price, coin.change7d);
  });
}

export async function fetchMarketData() {
  const ids = COINS.map((c) => c.id).join(",");
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error("empty payload");
    applyMarketData(data);
    return true;
  } catch {
    ensureSparklines();
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function simulateTick() {
  COINS.forEach((coin) => {
    const move = (Math.random() - 0.5) * 0.0026;
    coin.price = Math.max(coin.price * (1 + move), 0.0001);
    coin.change24h += move * 100;
  });
}

export const fmtUSD = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function fmtPrice(n) {
  if (n >= 1000) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return "$" + n.toFixed(2);
  if (n >= 0.01) return "$" + n.toFixed(4);
  return "$" + n.toFixed(6);
}

export function fmtCompact(n) {
  const abs = Math.abs(n);
  if (abs >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n.toFixed(2);
}

export function fmtCompactNum(n) {
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(0);
}

export const fmtPct = (n, digits = 2) => `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;

export const fmtSigned = (n) =>
  `${n >= 0 ? "+" : "-"}$` + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtQty = (n) => (n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : n.toFixed(n < 1 ? 4 : 2));

export const RANGES = {
  "1D": { change: 1.62, points: 48, vol: 0.004, label: "today" },
  "1W": { change: 4.86, points: 56, vol: 0.009, label: "past week" },
  "1M": { change: 9.34, points: 62, vol: 0.016, label: "past month" },
  "3M": { change: 18.6, points: 74, vol: 0.028, label: "past 3 months" },
  "1Y": { change: 42.8, points: 90, vol: 0.045, label: "past year" },
};

export function portfolioSeries(range, total) {
  const meta = RANGES[range] || RANGES["1M"];
  const rnd = seedRng("portfolio-" + range);
  const start = total / (1 + meta.change / 100);
  const points = [];
  let value = start;
  for (let i = 0; i < meta.points; i += 1) {
    const t = i / (meta.points - 1);
    const trend = start + (total - start) * t;
    const wave = Math.sin(t * Math.PI * (2 + rnd() * 1.4)) * total * meta.vol * 0.7;
    const noise = (rnd() - 0.5) * total * meta.vol;
    value = trend + wave + noise;
    points.push(value);
  }
  points[points.length - 1] = total;
  const forecastRnd = seedRng("forecast-" + range);
  const forecast = [];
  const steps = Math.max(10, Math.round(meta.points * 0.24));
  let f = points[Math.max(0, points.length - Math.round(steps / 2))];
  const target = total * 1.086;
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    f = f + (target - f) * 0.14 + (forecastRnd() - 0.5) * total * meta.vol * 0.8;
    forecast.push({ x: points.length - Math.round(steps / 2) + i, y: Math.max(f, total * 0.5) });
  }
  const benchmark = points.map((_, i) => {
    const t = i / (points.length - 1);
    return start + (total - start) * t * 0.55 + Math.sin(t * Math.PI * 3) * total * meta.vol * 0.35;
  });
  return { points, forecast, benchmark, meta };
}

const BACKTEST_PROFILE = {
  "Neural Momentum": { ret: 0.428, dd: 0.096, vol: 0.02 },
  "Mean Reversion": { ret: 0.264, dd: 0.071, vol: 0.012 },
  "Breakout Hunter": { ret: 0.381, dd: 0.124, vol: 0.028 },
  "Funding Arbitrage": { ret: 0.197, dd: 0.032, vol: 0.006 },
};

export function backtestCurve(kind, capital) {
  const profile = BACKTEST_PROFILE[kind] || BACKTEST_PROFILE["Neural Momentum"];
  const rnd = seedRng("bt-" + kind);
  const points = [];
  const days = 240;
  for (let i = 0; i < days; i += 1) {
    const t = i / (days - 1);
    const drift = 1 + profile.ret * t;
    const wave = Math.sin(t * Math.PI * 5.5) * profile.vol * 0.35;
    const noise = (rnd() - 0.5) * profile.vol;
    const pulse = 1 - profile.dd * Math.exp(-Math.pow((t - 0.34) / 0.055, 2));
    points.push(capital * (drift + wave + noise) * pulse);
  }
  points[0] = capital;
  points[points.length - 1] = capital * (1 + profile.ret);
  return points;
}
