import {
  COINS,
  byId,
  SIGNALS,
  INTEL,
  state,
  portfolio,
  applyTrade,
  fetchMarketData,
  simulateTick,
  ensureSparklines,
  portfolioSeries,
  backtestCurve,
  fmtUSD,
  fmtPrice,
  fmtCompact,
  fmtCompactNum,
  fmtPct,
  fmtSigned,
  fmtQty,
  RANGES,
  holdingQty,
} from "./data.js";
import { drawAreaLine, drawPerformanceChart, drawDonut, ALLOC_COLORS } from "./charts.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const INTEL_ICONS = { pulse: "i-pulse", trend: "i-trend", spark: "i-spark" };
const watchSet = ["BTC", "ETH", "SOL", "LINK", "AVAX", "NEAR"];
const tickerSet = ["BTC", "ETH", "SOL", "LINK", "AVAX", "NEAR"];

let marketFilter = { cat: "all", query: "", sort: "rank" };
let perfRange = "1M";
let perfModel = null;
let perfGeom = null;
let tradeSide = "buy";
let sourceLive = false;

/* ---------- small templates ---------- */
function coinMark(sym, size = "") {
  const c = byId(sym);
  const inner = c.brandPath
    ? `<svg class="coin-logo" viewBox="0 0 24 24" aria-hidden="true"><path d="${c.brandPath}"></path></svg>`
    : c.glyph || c.sym[0];
  return `<span class="coin-mark ${c.cls} ${size}">${inner}</span>`;
}

function deltaHTML(value, digits = 2, pct = true) {
  const up = value >= 0;
  const text = pct ? `${up ? "+" : "−"}${Math.abs(value).toFixed(digits)}%` : fmtSigned(value);
  return `<span class="delta ${up ? "up" : "down"}">${text}</span>`;
}

function scoreClass(ai) {
  if (ai >= 85) return "";
  if (ai >= 75) return "mid";
  return "low";
}

function timeLabel() {
  const d = new Date();
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
}

/* ---------- ticker ---------- */
function renderTicker() {
  const strip = $("#tickerStrip");
  if (!strip) return;
  strip.innerHTML =
    tickerSet
      .map((sym) => {
        const c = byId(sym);
        const up = c.change24h >= 0;
        return `<div class="ticker-item"><span class="tsym">${c.sym}</span><span class="tprice">${fmtPrice(c.price)}</span><span class="tchg ${up ? "up" : "down"}">${up ? "+" : "−"}${Math.abs(c.change24h).toFixed(2)}%</span></div>`;
      })
      .join("") + `<div class="ticker-live"><span class="live-dot"></span>${sourceLive ? "CoinGecko live" : "simulated feed"}</div>`;
}

/* ---------- watchlist ---------- */
function renderWatchlist() {
  const body = $("#watchlistBody");
  if (!body) return;
  body.innerHTML = watchSet
    .map((sym) => {
      const c = byId(sym);
      return `<tr>
        <td><div class="asset-cell">${coinMark(sym, "sm")}<div><strong>${c.name}</strong><span>${c.sym} / USDT</span></div></div></td>
        <td class="price-cell">${fmtPrice(c.price)}</td>
        <td class="chg-cell">${deltaHTML(c.change24h)}</td>
        <td class="spark-cell"><canvas data-spark="${sym}"></canvas></td>
        <td><span class="ai-score ${scoreClass(c.ai)}"><i></i>${c.ai}</span></td>
        <td><button class="row-action" type="button" data-open-trade data-asset="${sym}" aria-label="Trade ${c.name}"><svg><use href="#i-plus"/></svg></button></td>
      </tr>`;
    })
    .join("");
  drawSparks(body);
}

/* ---------- markets ---------- */
function marketRows() {
  let rows = COINS.slice();
  if (marketFilter.cat !== "all") rows = rows.filter((c) => c.cat === marketFilter.cat);
  const q = marketFilter.query.trim().toLowerCase();
  if (q) rows = rows.filter((c) => c.name.toLowerCase().includes(q) || c.sym.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q));
  const sorters = {
    rank: (a, b) => a.rank - b.rank,
    ai: (a, b) => b.ai - a.ai,
    change: (a, b) => b.change24h - a.change24h,
    mcap: (a, b) => b.mcap - a.mcap,
  };
  return rows.sort(sorters[marketFilter.sort] || sorters.rank);
}

function renderMarkets() {
  const body = $("#marketsBody");
  if (!body) return;
  const rows = marketRows();
  body.innerHTML = rows
    .map(
      (c) => `<tr>
      <td class="rank-cell">${c.rank}</td>
      <td><div class="asset-cell">${coinMark(c.sym)}<div><strong>${c.name}</strong><span>${c.sym}</span></div></div></td>
      <td class="price-cell">${fmtPrice(c.price)}</td>
      <td class="chg-cell">${deltaHTML(c.change24h)}</td>
      <td class="spark-cell"><canvas data-spark="${c.sym}"></canvas></td>
      <td class="mcap-cell">${fmtCompact(c.mcap)}</td>
      <td class="mcap-cell">${fmtCompact(c.vol)}</td>
      <td><span class="ai-score ${scoreClass(c.ai)}"><i></i>${c.ai}</span></td>
      <td><button class="row-action" type="button" data-open-trade data-asset="${c.sym}" aria-label="Trade ${c.name}"><svg><use href="#i-plus"/></svg></button></td>
    </tr>`
    )
    .join("");
  drawSparks(body);
  const count = $("#marketsCount");
  if (count) count.textContent = `${rows.length} asset${rows.length === 1 ? "" : "s"}`;
}

/* ---------- signals ---------- */
function renderSignals() {
  const grid = $("#signalGrid");
  if (!grid) return;
  grid.innerHTML = SIGNALS.map((s) => {
    const c = byId(s.sym);
    const entry = c.price;
    const target = entry * s.targetMul;
    const stop = entry * s.stopMul;
    const up = s.side === "long";
    return `<article class="card signal-tile ${up ? "long" : "short"}">
      <div class="st-head">
        <div class="asset-cell">${coinMark(s.sym, "sm")}<div><strong>${c.name}</strong><span>${c.sym} / USDT · ${s.horizon}</span></div></div>
        <div class="st-confidence"><span>Confidence</span><strong>${s.conf}%</strong></div>
      </div>
      <div class="st-chart"><canvas data-signal="${s.sym}" data-side="${s.side}"></canvas></div>
      <p class="st-thesis">${s.thesis}</p>
      <div class="st-levels">
        <div><span>Entry</span><strong>${fmtPrice(entry)}</strong></div>
        <div><span>Target</span><strong class="mint-text">${fmtPrice(target)}</strong></div>
        <div><span>Stop</span><strong class="rose-text">${fmtPrice(stop)}</strong></div>
      </div>
      <div class="st-foot">
        <span class="side-pill ${up ? "long" : "short"}">${up ? "LONG" : "SHORT"}</span>
        <span class="signal-meta">R:R ${s.rr}</span>
        <button class="btn tiny ${up ? "primary" : "ghost"}" type="button" data-open-trade data-asset="${s.sym}">Execute</button>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll("canvas[data-signal]").forEach((canvas) => {
    const c = byId(canvas.dataset.signal);
    const base = c.sparkline && c.sparkline.length > 20 ? c.sparkline.slice(-40) : null;
    const data = base || Array.from({ length: 40 }, (_, i) => c.price * (1 + Math.sin(i / 5) * 0.01));
    drawAreaLine(canvas, data, { color: canvas.dataset.side === "short" ? "#fb7185" : "#3ce6b0", width: 1.8, endDot: true });
  });
}

/* ---------- portfolio ---------- */
function renderHoldings() {
  const body = $("#holdingsBody");
  if (!body) return;
  const pf = portfolio();
  body.innerHTML = pf.positions
    .map(
      (p) => `<tr>
      <td><div class="asset-cell">${coinMark(p.sym, "sm")}<div><strong>${p.coin.name}</strong><span>${p.sym}</span></div></div></td>
      <td class="mcap-cell">${fmtQty(p.qty)} ${p.sym}</td>
      <td class="price-cell">${fmtPrice(p.coin.price)}</td>
      <td class="value-cell">${fmtUSD(p.value)}</td>
      <td><span class="alloc-bar"><i style="width:${p.alloc.toFixed(1)}%"></i></span><span class="alloc-pct">${p.alloc.toFixed(1)}%</span></td>
      <td class="value-cell">${deltaHTML(p.pnl, 2, false)} <span class="alloc-pct">${fmtPct(p.pnlPct, 1)}</span></td>
      <td><button class="row-action" type="button" data-open-trade data-asset="${p.sym}" aria-label="Trade ${p.coin.name}"><svg><use href="#i-plus"/></svg></button></td>
    </tr>`
    )
    .join("");
}

function renderAllocation() {
  const pf = portfolio();
  const canvas = $("#allocationChart");
  const legend = $("#allocLegend");
  const segments = pf.positions.map((p, i) => ({ label: p.sym, value: p.value, color: ALLOC_COLORS[i % ALLOC_COLORS.length], pct: p.alloc }));
  if (canvas) drawDonut(canvas, segments);
  if (legend)
    legend.innerHTML = segments
      .map((s) => `<div class="alloc-row"><i style="background:${s.color}"></i>${s.label}<span>${s.pct.toFixed(1)}%</span><strong>${fmtUSD(s.value)}</strong></div>`)
      .join("");
  const total = $("#donutTotal");
  if (total) total.textContent = fmtCompact(pf.total);
}

function renderActivities() {
  const list = $("#activityList");
  if (!list) return;
  list.innerHTML = state.activities
    .map((a) => {
      const c = byId(a.sym);
      return `<div class="activity-row">
      <span class="coin-mark ${c.cls} sm" style="width:28px;height:28px">${c.brandPath ? `<svg class="coin-logo" viewBox="0 0 24 24"><path d="${c.brandPath}"></path></svg>` : c.glyph || c.sym[0]}</span>
      <span class="a-title"><strong>${a.title}</strong><span>${a.ago} · ${a.qty ? fmtQty(a.qty) + " " + a.sym : ""}</span></span>
      <span class="a-type">${a.type}</span>
      <span class="a-amount">${fmtUSD(a.amount)}</span>
      <span class="a-status">${a.status}</span>
      <span class="a-time"></span>
    </div>`;
    })
    .join("");
}

/* ---------- KPIs ---------- */
function renderKpis() {
  const pf = portfolio();
  const dayChange = RANGES["1D"].change;
  const dayPnl = (pf.total * dayChange) / 100;
  setText("#statPortfolio", fmtUSD(pf.total));
  const pfDelta = $("#statPortfolioDelta");
  if (pfDelta) {
    pfDelta.textContent = fmtSigned(dayPnl);
    pfDelta.className = "delta up";
  }
  setText("#statPnl", fmtSigned(dayPnl));
  const pnlEl = $("#statPnl");
  if (pnlEl) pnlEl.style.color = "var(--mint)";
  setText("#statPnlPct", fmtPct(dayChange));
  const pnlPct = $("#statPnlPct");
  if (pnlPct) pnlPct.className = "delta up";

  setText("#pfNetWorth", fmtUSD(pf.total));
  setText("#pfCash", fmtUSD(state.cash));
  setText("#pfUnrealized", fmtSigned(pf.unrealized));
  const unreal = $("#pfUnrealized");
  if (unreal) unreal.style.color = pf.unrealized >= 0 ? "var(--mint)" : "var(--rose)";
  setText("#pfUnrealizedPct", fmtPct(pf.unrealizedPct, 1));
  const unrealPct = $("#pfUnrealizedPct");
  if (unrealPct) unrealPct.className = `delta ${pf.unrealized >= 0 ? "up" : "down"}`;
  const netDelta = $("#pfNetDelta");
  if (netDelta) netDelta.textContent = fmtPct(pf.totalPnlPct, 2);

  const bars = $("#pnlBars");
  if (bars && !bars.childElementCount) {
    bars.innerHTML = Array.from({ length: 14 }, () => `<i style="height:${18 + Math.random() * 82}%"></i>`).join("");
  }

  const pct = RANGES[perfRange] || RANGES["1M"];
  setText("#perfValue", fmtUSD(pf.total));
  const perfDelta = $("#perfDelta");
  if (perfDelta) {
    perfDelta.textContent = fmtPct(pct.change);
    perfDelta.className = `delta ${pct.change >= 0 ? "up" : "down"}`;
  }
  setText("#perfSub", `Across ${pf.positions.length} assets · ${pct.label}`);
}

function setText(sel, value) {
  const el = $(sel);
  if (el) el.textContent = value;
}

/* ---------- sparks ---------- */
function drawSparks(root = document) {
  $$("canvas[data-spark]", root).forEach((canvas) => {
    const c = byId(canvas.dataset.spark);
    const data = c.sparkline || [];
    if (data.length > 1) drawAreaLine(canvas, data, { color: c.change24h >= 0 ? "#3ce6b0" : "#fb7185", width: 1.5, fill: true });
  });
}

/* ---------- performance chart ---------- */
function rangeLabels(range) {
  const map = {
    "1D": ["04:00", "10:00", "16:00", "22:00", "Now"],
    "1W": ["6d", "5d", "4d", "2d", "Now"],
    "1M": ["30d", "22d", "15d", "7d", "Now"],
    "3M": ["90d", "68d", "45d", "22d", "Now"],
    "1Y": ["12m", "9m", "6m", "3m", "Now"],
  };
  return map[range] || map["1M"];
}

function drawPerf(hover = -1) {
  const canvas = $("#portfolioChart");
  if (!canvas || !canvas.getBoundingClientRect().width) return;
  const pf = portfolio();
  const s = portfolioSeries(perfRange, pf.total);
  perfModel = s;
  perfGeom = drawPerformanceChart(
    canvas,
    { points: s.points, forecast: s.forecast, benchmark: s.benchmark, yFormat: (v) => fmtCompact(v), xLabels: rangeLabels(perfRange) },
    hover
  );
}

/* ---------- backtest ---------- */
const BT_RESULTS = {
  "Neural Momentum": { ret: 42.8, abs: 10700, sharpe: 2.14, dd: -9.6, win: 71.2, profit: 2.68, trades: 148, hold: "3.2d", days: 240, perDay: 0.0022 },
  "Mean Reversion": { ret: 26.4, abs: 6600, sharpe: 1.72, dd: -7.1, win: 68.4, profit: 2.05, trades: 212, hold: "1.1d", days: 240, perDay: 0.0011 },
  "Breakout Hunter": { ret: 38.1, abs: 9525, sharpe: 1.98, dd: -12.4, win: 64.9, profit: 2.31, trades: 96, hold: "5.8d", days: 240, perDay: 0.0016 },
  "Funding Arbitrage": { ret: 19.7, abs: 4925, sharpe: 2.86, dd: -3.2, win: 88.1, profit: 3.12, trades: 412, hold: "0.4d", days: 240, perDay: 0.0007 },
};

function btLogRow(sym, side, entry, exit, ret, dur, date) {
  return `<tr><td class="mcap-cell">${date}</td><td>${coinMark(sym, "sm")} <span style="margin-left:6px">${sym}</span></td><td><span class="side-tag ${side}">${side.toUpperCase()}</span></td><td class="price-cell">${entry}</td><td class="price-cell">${exit}</td><td class="chg-cell">${deltaHTML(ret)}</td><td class="mcap-cell">${dur}</td></tr>`;
}

function renderTradeLog() {
  const body = $("#tradeLogBody");
  if (!body) return;
  const rows = [
    ["BTC", "buy", fmtPrice(78120), fmtPrice(82440), 5.53, "4.1d", "Oct 21"],
    ["ETH", "buy", fmtPrice(2218), fmtPrice(2381), 7.35, "2.6d", "Oct 18"],
    ["SOL", "sell", fmtPrice(108.4), fmtPrice(101.9), -5.99, "1.8d", "Oct 15"],
    ["LINK", "buy", fmtPrice(10.9), fmtPrice(11.62), 6.6, "3.4d", "Oct 12"],
    ["RENDER", "buy", fmtPrice(1.52), fmtPrice(1.71), 12.5, "5.2d", "Oct 09"],
    ["NEAR", "sell", fmtPrice(4.92), fmtPrice(4.51), -8.33, "2.2d", "Oct 05"],
  ];
  body.innerHTML = rows.map((r) => btLogRow(...r)).join("");
}

function drawBacktestChart() {
  const canvas = $("#backtestChart");
  if (!canvas || !canvas.getBoundingClientRect().width) return;
  const strategy = $("#btStrategy")?.value || "Neural Momentum";
  const r = BT_RESULTS[strategy] || BT_RESULTS["Neural Momentum"];
  const capital = parseAmount($("#btCapital")?.value) || 25000;
  const data = backtestCurve(strategy, capital);
  drawAreaLine(canvas, data, { color: r.ret >= 0 ? "#3ce6b0" : "#fb7185", width: 2, endDot: true });
}

function renderBacktestResults(strategy) {
  const r = BT_RESULTS[strategy] || BT_RESULTS["Neural Momentum"];
  setText("#btReturn", `${r.ret >= 0 ? "+" : "−"}${Math.abs(r.ret).toFixed(1)}%`);
  setText("#btReturnAbs", `${r.ret >= 0 ? "+" : "−"}$${Math.abs(r.abs).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  setText("#btSharpe", r.sharpe.toFixed(2));
  setText("#btDrawdown", `−${Math.abs(r.dd).toFixed(1)}%`);
  setText("#btWinRate", `${r.win.toFixed(1)}%`);
  setText("#btProfit", r.profit.toFixed(2));
  setText("#btTrades", String(r.trades));
  setText("#btHold", r.hold);
  drawBacktestChart();
}

/* ---------- live refresh ---------- */
function renderTopSignal() {
  const c = byId("ETH");
  setText("#sigEntry", fmtPrice(c.price));
  setText("#sigTarget", fmtPrice(c.price * 1.12));
  setText("#sigStop", fmtPrice(c.price * 0.948));
}

function refreshData() {
  renderKpis();
  renderTopSignal();
  renderTicker();
  renderWatchlist();
  renderMarkets();
  renderSignals();
  renderHoldings();
  renderAllocation();
  renderActivities();
  const active = $(".page.active")?.dataset.page;
  if (active === "dashboard") drawPerf();
  if (active === "backtest") drawBacktestChart();
}

function setSource(live) {
  sourceLive = live;
  setText("#dataSourceLabel", live ? "CoinGecko live" : "Simulated feed");
  setText("#footerSource", live ? "Live prices via CoinGecko" : "Simulated market feed");
  setText("#marketsUpdated", live ? "synced just now" : "demo data");
  renderTicker();
}

/* ---------- routing ---------- */
const PAGE_TITLES = {
  dashboard: "Crypto AI Pro — AI Trading Terminal",
  markets: "Markets — Crypto AI Pro",
  signals: "AI Signals — Crypto AI Pro",
  portfolio: "Portfolio — Crypto AI Pro",
  backtest: "Backtest Lab — Crypto AI Pro",
};

function navigate(page, { scroll = true } = {}) {
  const target = PAGE_TITLES[page] ? page : "dashboard";
  $$(".page").forEach((section) => section.classList.toggle("active", section.dataset.page === target));
  $$("[data-nav]").forEach((item) => item.classList.toggle("active", item.dataset.nav === target));
  document.title = PAGE_TITLES[target];
  closeSidebar();
  if (scroll) window.scrollTo(0, 0);
  requestAnimationFrame(() => {
    if (target === "dashboard") {
      drawPerf();
      drawSparks($('[data-page="dashboard"]'));
    }
    if (target === "markets") drawSparks($('[data-page="markets"]'));
    if (target === "portfolio") renderAllocation();
    if (target === "backtest") drawBacktestChart();
    if (target === "signals") renderSignals();
  });
}

function routeFromHash() {
  const page = (location.hash || "#dashboard").replace("#", "");
  navigate(page, { scroll: false });
}

/* ---------- sidebar ---------- */
function openSidebar() {
  $("#sidebar")?.classList.add("open");
  $("#sidebarScrim")?.classList.add("show");
}
function closeSidebar() {
  $("#sidebar")?.classList.remove("open");
  $("#sidebarScrim")?.classList.remove("show");
}

/* ---------- toasts ---------- */
function toast(title, sub = "") {
  const stack = $("#toastStack");
  if (!stack) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span class="toast-ico"><svg><use href="#i-shield"/></svg></span><span><strong>${title}</strong><span>${sub}</span></span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 260);
  }, 3400);
}

/* ---------- trade modal ---------- */
function parseAmount(value) {
  const n = parseFloat(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function openTrade(sym = "ETH") {
  const modal = $("#tradeModal");
  const backdrop = $("#tradeBackdrop");
  const select = $("#tradeAsset");
  if (!modal || !select) return;
  tradeSide = "buy";
  select.value = COINS.some((c) => c.sym === sym) ? sym : "ETH";
  $$("#tradeModal [data-side]").forEach((b) => {
    b.className = b.dataset.side === tradeSide ? `active ${b.dataset.side}` : "";
  });
  updateTrade();
  modal.classList.add("open");
  backdrop?.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeTrade() {
  $("#tradeModal")?.classList.remove("open");
  $("#tradeBackdrop")?.classList.remove("show");
  $("#tradeModal")?.setAttribute("aria-hidden", "true");
}

function updateTrade() {
  const sym = $("#tradeAsset")?.value || "ETH";
  const coin = byId(sym);
  const price = coin.price;
  const amount = parseAmount($("#tradeAmount")?.value);
  setText("#tradePrice", fmtPrice(price));
  const chg = $("#tradeChange");
  if (chg) {
    chg.textContent = fmtPct(coin.change24h);
    chg.className = `delta ${coin.change24h >= 0 ? "up" : "down"}`;
  }
  setText("#tradeReceive", tradeSide === "sell" ? `${fmtUSD(amount)} USDT` : `${fmtQty(amount / price)} ${sym}`);
  setText("#tradeFee", fmtUSD(amount * 0.001));
  setText("#tradeAvailable", tradeSide === "sell" ? `${fmtQty(holdingQty(sym))} ${sym}` : fmtUSD(state.cash));
  const btn = $("#confirmTrade");
  if (btn) btn.textContent = `${tradeSide === "buy" ? "Confirm buy" : "Confirm sell"} · ${fmtPrice(coin.price)}`;
  const verdict = $("#tradeVerdict");
  if (verdict) {
    const pf = portfolio();
    const pos = pf.positions.find((p) => p.sym === sym);
    const alloc = pos ? pos.alloc : 0;
    verdict.textContent =
      tradeSide === "buy"
        ? `This order is within your risk profile and keeps ${sym} near ${Math.min(alloc + (amount / pf.total) * 100, 99).toFixed(0)}% allocation.`
        : `Copilot flags this as a de-risking move. Realized P&L will update instantly.`;
  }
}

/* ---------- copilot ---------- */
function openCopilot() {
  $("#copilot")?.classList.add("open");
  $("#copilot")?.setAttribute("aria-hidden", "false");
  $("#copilotBackdrop")?.classList.add("show");
  setTimeout(() => $("#copilotInput")?.focus(), 320);
}
function closeCopilot() {
  $("#copilot")?.classList.remove("open");
  $("#copilot")?.setAttribute("aria-hidden", "true");
  $("#copilotBackdrop")?.classList.remove("show");
}

function copilotAnswer(prompt) {
  const q = prompt.toLowerCase();
  const pf = portfolio();
  const eth = byId("ETH");
  const btc = byId("BTC");
  const sol = byId("SOL");
  const strongest = SIGNALS.slice().sort((a, b) => b.conf - a.conf)[0];
  const strongCoin = byId(strongest.sym);

  if (/(eth|ethereum)/.test(q)) {
    return `<p><strong>Ethereum</strong> is trading at <strong>${fmtPrice(eth.price)}</strong> (${fmtPct(eth.change24h)} 24h). Oracle score <span class="m-tag">${eth.ai}/100</span>. My model sees compressed volatility above the 50-EMA.</p>
    <ul><li>Entry zone ${fmtPrice(eth.price * 0.997)} – ${fmtPrice(eth.price)}</li><li>First target ${fmtPrice(eth.price * 1.12)}</li><li>Invalidation ${fmtPrice(eth.price * 0.948)}</li></ul>
    <p>Suggested size on your ${fmtUSD(pf.total)} book: 4–6% risk budget.</p>`;
  }
  if (/(btc|bitcoin)/.test(q)) {
    return `<p><strong>Bitcoin</strong> at <strong>${fmtPrice(btc.price)}</strong> (${fmtPct(btc.change24h)}). Oracle score <span class="m-tag">${btc.ai}/100</span>. Structure remains bullish while we hold higher lows.</p>
    <ul><li>Support ${fmtPrice(btc.price * 0.965)}</li><li>Resistance ${fmtPrice(btc.price * 1.055)}</li><li>Trend filter: positive above the 200-day.</li></ul>
    <p>I would keep BTC as the portfolio anchor and add on pullbacks rather than chase.</p>`;
  }
  if (/(sol|solana)/.test(q)) {
    return `<p><strong>Solana</strong> at <strong>${fmtPrice(sol.price)}</strong>. Oracle score <span class="m-tag">${sol.ai}/100</span>. Spot bids are absorbing supply at multi-week resistance.</p><ul><li>A daily close above ${fmtPrice(sol.price * 1.024)} confirms continuation.</li><li>Target ${fmtPrice(sol.price * 1.156)}, stop ${fmtPrice(sol.price * 0.945)}.</li></ul>`;
  }
  if (/(portfolio|risk|exposure|allocation|review)/.test(q)) {
    return `<p>Portfolio review complete. Net worth <strong>${fmtUSD(pf.total)}</strong>, of which <strong>${((pf.cash / pf.total) * 100).toFixed(1)}%</strong> is idle USDT.</p>
    <ul><li>Unrealized P&L ${fmtSigned(pf.unrealized)} (${fmtPct(pf.unrealizedPct, 1)})</li><li>Largest position ${pf.positions[0]?.sym || "—"} at ${pf.positions[0]?.alloc.toFixed(1) || 0}%</li><li>Portfolio beta 1.14 — moderate risk.</li></ul>
    <p>Diversification looks healthy. Consider trimming the top position if it exceeds 45%.</p>`;
  }
  if (/(signal|trade|entry|setup|strong)/.test(q)) {
    return `<p>My strongest setup right now is <strong>${strongCoin.name} ${strongest.side.toUpperCase()}</strong> at <span class="m-tag">${strongest.conf}% confidence</span>, R:R ${strongest.rr} on the ${strongest.horizon} timeframe.</p><p>${strongest.thesis}</p><p>Want me to draft the order in the execution panel?</p>`;
  }
  if (/(market|briefing|sentiment|news|macro)/.test(q)) {
    return `<p>Market briefing:</p><ul><li>Sentiment is <strong>Greed (74)</strong>, up 6 on the day.</li><li>BTC dominance 67.4% — capital leaning to majors.</li><li>Funding rates neutral after a leverage flush, which favors spot-led continuation.</li><li>AI sector (RENDER ${fmtPct(byId("RENDER").change24h)}, FET ${fmtPct(byId("FET").change24h)}) is the current rotation candidate.</li></ul>`;
  }
  if (/(backtest|strategy|test)/.test(q)) {
    return `<p>Neural Momentum is my best historical performer: <strong>+42.8%</strong> over 12 months, Sharpe 2.14, max drawdown −9.6%, 71.2% win rate across 148 trades.</p><p>Run it in Backtest Lab with a 2% risk-per-trade budget for a comparable profile.</p>`;
  }
  return `<p>Here's what I see across your book and the market:</p><ul><li>Portfolio <strong>${fmtUSD(pf.total)}</strong>, today ${fmtSigned(pf.dayPnl)}.</li><li>Top signal: <strong>${strongCoin.name} ${strongest.side.toUpperCase()}</strong> at ${strongest.conf}% confidence.</li><li>Sentiment: Greed 74; BTC dominance 67.4%.</li></ul><p>Ask me about any asset, your risk, or a specific setup.</p>`;
}

function pushMessage(role, html) {
  const box = $("#copilotMessages");
  if (!box) return;
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.innerHTML =
    role === "user"
      ? `<div class="msg-bubble"><p>${html}</p></div>`
      : `<span class="msg-avatar"><svg><use href="#i-spark"/></svg></span><div class="msg-bubble">${html}</div>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function askCopilot(prompt) {
  openCopilot();
  pushMessage("user", prompt.replace(/</g, "&lt;"));
  const box = $("#copilotMessages");
  const typing = document.createElement("div");
  typing.className = "msg ai";
  typing.innerHTML = `<span class="msg-avatar"><svg><use href="#i-spark"/></svg></span><div class="msg-bubble"><div class="typing"><i></i><i></i><i></i></div></div>`;
  box.appendChild(typing);
  box.scrollTop = box.scrollHeight;
  setTimeout(() => {
    typing.remove();
    pushMessage("ai", copilotAnswer(prompt));
  }, 620 + Math.random() * 500);
}

/* ---------- events ---------- */
function bindEvents() {
  $("#menuBtn")?.addEventListener("click", openSidebar);
  $("#sidebarScrim")?.addEventListener("click", closeSidebar);

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) {
      const results = $("#searchResults");
      if (results) results.hidden = true;
    }
    const tradeBtn = e.target.closest("[data-open-trade]");
    if (tradeBtn) {
      openTrade(tradeBtn.dataset.asset || $("#tradeAsset")?.value || "ETH");
      closeAlerts();
      return;
    }
    const navTo = e.target.closest("[data-navto]");
    if (navTo) {
      location.hash = `#${navTo.dataset.navto}`;
      closeAlerts();
      return;
    }
    const copilotTrigger = e.target.closest("[data-open-copilot]");
    if (copilotTrigger) {
      const prompt = copilotTrigger.dataset.copilotPrompt;
      if (prompt) askCopilot(prompt);
      else openCopilot();
      closeAlerts();
      return;
    }
    const promptChip = e.target.closest("[data-copilot-prompt]");
    if (promptChip && !copilotTrigger) {
      askCopilot(promptChip.dataset.copilotPrompt);
      return;
    }
    const demo = e.target.closest("[data-demo-action]");
    if (demo) {
      toast(demo.dataset.demoAction, "This is a front-end demo — no live orders are placed.");
      return;
    }
    const navItem = e.target.closest("[data-nav]");
    if (navItem) {
      e.preventDefault();
      location.hash = `#${navItem.dataset.nav}`;
      return;
    }
    if (!e.target.closest("#alertsPopover") && !e.target.closest("#alertsBtn")) closeAlerts();
  });

  window.addEventListener("hashchange", routeFromHash);

  $("#closeTrade")?.addEventListener("click", closeTrade);
  $("#tradeBackdrop")?.addEventListener("click", closeTrade);
  $("#confirmTrade")?.addEventListener("click", () => {
    const sym = $("#tradeAsset")?.value || "ETH";
    const amount = parseAmount($("#tradeAmount")?.value);
    const res = applyTrade(sym, tradeSide, amount);
    if (!res.ok) {
      toast("Order rejected", res.reason);
      return;
    }
    toast(`${tradeSide === "buy" ? "Bought" : "Sold"} ${fmtQty(res.qty)} ${sym}`, `${fmtUSD(res.amount)} executed at ${fmtPrice(byId(sym).price)}`);
    closeTrade();
    refreshData();
  });

  $$("#tradeModal [data-side]").forEach((btn) => {
    btn.addEventListener("click", () => {
      tradeSide = btn.dataset.side;
      $$("#tradeModal [data-side]").forEach((b) => {
        b.className = b.dataset.side === tradeSide ? `active ${b.dataset.side}` : "";
      });
      updateTrade();
    });
  });
  $("#tradeAsset")?.addEventListener("change", updateTrade);
  $("#tradeAmount")?.addEventListener("input", updateTrade);
  $$("#tradeModal [data-amt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sym = $("#tradeAsset")?.value || "ETH";
      if (btn.dataset.amt === "max") {
        const max = tradeSide === "buy" ? state.cash : holdingQty(sym) * byId(sym).price;
        $("#tradeAmount").value = Math.floor(max).toLocaleString("en-US");
      } else {
        $("#tradeAmount").value = Number(btn.dataset.amt).toLocaleString("en-US");
      }
      updateTrade();
    });
  });

  $("#closeCopilot")?.addEventListener("click", closeCopilot);
  $("#copilotBackdrop")?.addEventListener("click", closeCopilot);
  const send = () => {
    const input = $("#copilotInput");
    const value = input?.value.trim();
    if (!value) return;
    input.value = "";
    input.style.height = "";
    askCopilot(value);
  };
  $("#copilotSend")?.addEventListener("click", send);
  $("#copilotInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  $("#copilotInput")?.addEventListener("input", (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  });

  $("#alertsBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const pop = $("#alertsPopover");
    if (!pop) return;
    pop.hidden = !pop.hidden;
    $("#alertsBtn").setAttribute("aria-expanded", String(!pop.hidden));
  });

  $("#rangeTabs")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-range]");
    if (!btn) return;
    perfRange = btn.dataset.range;
    $$("#rangeTabs button").forEach((b) => b.classList.toggle("active", b === btn));
    renderKpis();
    drawPerf();
  });

  const perfShell = $("#perfChartShell");
  perfShell?.addEventListener("mousemove", (e) => {
    if (!perfGeom || !perfModel) return;
    const rect = perfShell.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = perfGeom.indexForX(x);
    const point = perfModel.points[index];
    if (point == null) return;
    drawPerf(index);
    const tip = $("#perfTooltip");
    if (tip) {
      tip.hidden = false;
      tip.style.left = `${perfGeom.xFor(index)}px`;
      tip.style.top = `${perfGeom.yFor(point)}px`;
      const change = ((point - perfModel.points[0]) / perfModel.points[0]) * 100;
      tip.innerHTML = `<span>${RANGES[perfRange]?.label || ""}</span><strong>${fmtUSD(point)}</strong><em class="${change >= 0 ? "up" : "down"}">${fmtPct(change)}</em>`;
    }
  });
  perfShell?.addEventListener("mouseleave", () => {
    const tip = $("#perfTooltip");
    if (tip) tip.hidden = true;
    drawPerf();
  });

  $("#marketCats")?.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-cat]");
    if (!chip) return;
    marketFilter.cat = chip.dataset.cat;
    $$("#marketCats .chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderMarkets();
  });
  $("#marketSearch")?.addEventListener("input", (e) => {
    marketFilter.query = e.target.value;
    renderMarkets();
  });
  $("#marketSort")?.addEventListener("change", (e) => {
    marketFilter.sort = e.target.value;
    renderMarkets();
  });

  const search = $("#globalSearch");
  search?.addEventListener("input", () => renderSearch(search.value));
  search?.addEventListener("focus", () => {
    if (search.value.trim()) renderSearch(search.value);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      e.preventDefault();
      search?.focus();
    }
    if (e.key === "Escape") {
      closeTrade();
      closeCopilot();
      closeAlerts();
      const res = $("#searchResults");
      if (res) res.hidden = true;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openCopilot();
    }
  });

  $("#runScanBtn")?.addEventListener("click", (e) => {
    const btn = e.currentTarget;
    btn.classList.add("loading");
    setTimeout(() => {
      btn.classList.remove("loading");
      toast("AI scan complete", "3 new high-conviction setups added to your feed.");
      refreshData();
    }, 1200);
  });

  $("#refreshIntel")?.addEventListener("click", () => {
    toast("Intelligence refreshed", "42 feeds re-scanned across spot, futures and on-chain.");
  });

  const risk = $("#btRisk");
  const updateRange = () => {
    const value = Number(risk.value);
    setText("#btRiskValue", `${value.toFixed(1)}%`);
    const pct = ((value - 0.5) / 4.5) * 100;
    risk.style.background = `linear-gradient(90deg, var(--violet) ${pct}%, rgba(255,255,255,0.08) ${pct}%)`;
  };
  risk?.addEventListener("input", updateRange);
  if (risk) updateRange();

  const updateBtSub = () => {
    setText("#btResultSub", `${$("#btStrategy").value} · ${$("#btAsset").value} · ${$("#btPeriod").value}`);
  };
  ["#btStrategy", "#btAsset", "#btPeriod"].forEach((sel) => $(sel)?.addEventListener("change", updateBtSub));

  $("#runBacktestBtn")?.addEventListener("click", () => {
    const btn = $("#runBacktestBtn");
    const progress = $("#btProgress");
    const badge = $("#btBadge");
    btn.classList.add("loading");
    if (progress) progress.hidden = false;
    if (badge) badge.innerHTML = `<span class="live-dot"></span>Running…`;
    updateBtSub();
    setTimeout(() => {
      btn.classList.remove("loading");
      if (progress) progress.hidden = true;
      const strategy = $("#btStrategy").value;
      renderBacktestResults(strategy);
      renderTradeLog();
      if (badge) badge.innerHTML = `<span class="live-dot"></span>Complete`;
      toast("Backtest complete", `${strategy} finished across ${$("#btPeriod").value}.`);
    }, 1500);
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const active = $(".page.active")?.dataset.page;
      if (active === "dashboard") {
        drawPerf();
        drawSparks($('[data-page="dashboard"]'));
      }
      if (active === "markets") drawSparks($('[data-page="markets"]'));
      if (active === "signals") renderSignals();
      if (active === "portfolio") renderAllocation();
      if (active === "backtest") drawBacktestChart();
    }, 180);
  });
}

function closeAlerts() {
  const pop = $("#alertsPopover");
  if (pop && !pop.hidden) {
    pop.hidden = true;
    $("#alertsBtn")?.setAttribute("aria-expanded", "false");
  }
}

function renderSearch(query) {
  const box = $("#searchResults");
  if (!box) return;
  const q = query.trim().toLowerCase();
  if (!q) {
    box.hidden = true;
    return;
  }
  const coins = COINS.filter((c) => c.name.toLowerCase().includes(q) || c.sym.toLowerCase().includes(q)).slice(0, 5);
  const pages = [
    { name: "AI Signals", sub: "High-conviction setups", hash: "#signals" },
    { name: "Portfolio", sub: "Holdings and risk", hash: "#portfolio" },
    { name: "Backtest Lab", sub: "Strategy simulation", hash: "#backtest" },
  ].filter((p) => p.name.toLowerCase().includes(q));
  if (!coins.length && !pages.length) {
    box.hidden = false;
    box.innerHTML = `<div class="search-empty">No matches for "${query.replace(/</g, "&lt;")}"</div>`;
    return;
  }
  box.hidden = false;
  box.innerHTML =
    (coins.length ? `<div class="search-group-label">Markets</div>` : "") +
    coins
      .map(
        (c) => `<button class="search-result" type="button" data-search-trade="${c.sym}">${coinMark(c.sym, "sm")}<span><strong>${c.name}</strong><br><span>${c.sym} · ${c.cat}</span></span><span class="sr-price">${fmtPrice(c.price)}</span></button>`
      )
      .join("") +
    (pages.length ? `<div class="search-group-label">Navigate</div>` : "") +
    pages
      .map((p) => `<button class="search-result" type="button" data-search-page="${p.hash}"><span class="coin-mark sm">→</span><span><strong>${p.name}</strong><br><span>${p.sub}</span></span></button>`)
      .join("");
  box.querySelectorAll("[data-search-trade]").forEach((btn) => {
    btn.addEventListener("click", () => {
      box.hidden = true;
      $("#globalSearch").value = "";
      openTrade(btn.dataset.searchTrade);
    });
  });
  box.querySelectorAll("[data-search-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      box.hidden = true;
      $("#globalSearch").value = "";
      location.hash = btn.dataset.searchPage;
    });
  });
}

/* ---------- init ---------- */
function init() {
  ensureSparklines();
  const now = new Date();
  setText("#todayLabel", now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  const clock = $("#marketClock");
  const tickClock = () => {
    if (clock) clock.textContent = `${timeLabel()} UTC`;
  };
  tickClock();
  setInterval(tickClock, 1000);

  const tradeSelect = $("#tradeAsset");
  if (tradeSelect) {
    tradeSelect.innerHTML = COINS.map((c) => `<option value="${c.sym}">${c.name} · ${c.sym}</option>`).join("");
  }

  bindEvents();
  renderKpis();
  renderTopSignal();
  renderTicker();
  renderWatchlist();
  renderMarkets();
  renderSignals();
  renderHoldings();
  renderAllocation();
  renderActivities();
  renderTradeLog();
  renderBacktestResults("Neural Momentum");

  routeFromHash();
  requestAnimationFrame(() => {
    drawPerf();
    drawSparks($('[data-page="dashboard"]'));
  });

  fetchMarketData().then((live) => {
    setSource(live);
    refreshData();
    const active = $(".page.active")?.dataset.page;
    if (active === "dashboard") drawPerf();
  });

  setInterval(() => {
    simulateTick();
    refreshData();
  }, 5000);

  setInterval(() => {
    fetchMarketData().then((live) => {
      setSource(live);
      refreshData();
    });
  }, 90000);
}

init();
