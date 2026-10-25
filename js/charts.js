const MAX_DPR = 2;

export function initCanvas(canvas) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return null;
  const w = rect.width;
  const h = rect.height;
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function smoothPath(ctx, pts) {
  if (!pts.length) return;
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
    return;
  }
  for (let i = 1; i < pts.length - 1; i += 1) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
}

export function drawAreaLine(canvas, data, opts = {}) {
  const base = initCanvas(canvas);
  if (!base || !data || data.length < 2) return;
  const { ctx, w, h } = base;
  const padTop = opts.padTop ?? 4;
  const padBottom = opts.padBottom ?? 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const top = min - span * 0.08;
  const bottom = max + span * 0.08;
  const xFor = (i) => (i / (data.length - 1)) * w;
  const yFor = (v) => padTop + (1 - (v - top) / (bottom - top)) * (h - padTop - padBottom);
  const pts = data.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
  const positive = data[data.length - 1] >= data[0];
  const color = opts.color || (positive ? "#3ce6b0" : "#fb7185");

  if (opts.fill !== false) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, hexA(color, 0.3));
    grad.addColorStop(1, hexA(color, 0));
    ctx.beginPath();
    smoothPath(ctx, pts);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.beginPath();
  smoothPath(ctx, pts);
  ctx.strokeStyle = color;
  ctx.lineWidth = opts.width || 1.8;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  if (opts.endDot) {
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x - 2, last.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = hexA(color, 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last.x - 2, last.y, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

export function drawPerformanceChart(canvas, model, hoverIndex = -1) {
  const base = initCanvas(canvas);
  if (!base) return null;
  const { ctx, w, h } = base;
  const { points, forecast, benchmark } = model;
  const pad = { top: 12, right: 6, bottom: 20, left: 46 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const all = [...points, ...forecast.map((f) => f.y), ...benchmark];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const top = min - span * 0.1;
  const bottom = max + span * 0.1;
  const xFor = (i) => pad.left + (i / (points.length - 1)) * innerW;
  const yFor = (v) => pad.top + (1 - (v - top) / (bottom - top)) * innerH;

  ctx.font = "500 8.5px 'JetBrains Mono', monospace";
  ctx.textBaseline = "middle";
  const ticks = 4;
  for (let i = 0; i <= ticks; i += 1) {
    const y = pad.top + (i / ticks) * innerH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.strokeStyle = "rgba(148,163,184,0.075)";
    ctx.lineWidth = 1;
    ctx.stroke();
    const value = bottom - (i / ticks) * (bottom - top);
    ctx.fillStyle = "rgba(95,109,135,0.95)";
    ctx.textAlign = "right";
    ctx.fillText(model.yFormat ? model.yFormat(value) : String(Math.round(value)), pad.left - 7, y);
  }

  const xTicks = model.xLabels || [];
  if (xTicks.length) {
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(95,109,135,0.95)";
    ctx.textBaseline = "top";
    xTicks.forEach((label, i) => {
      const x = pad.left + (i / (xTicks.length - 1)) * innerW;
      ctx.fillText(label, Math.min(Math.max(x, pad.left + 8), w - pad.right - 8), h - pad.bottom + 6);
    });
    ctx.textBaseline = "middle";
  }

  const benchPts = benchmark.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
  ctx.beginPath();
  smoothPath(ctx, benchPts);
  ctx.strokeStyle = "rgba(148,163,184,0.32)";
  ctx.lineWidth = 1.3;
  ctx.setLineDash([3, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  const mainPts = points.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
  const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
  grad.addColorStop(0, "rgba(139,108,255,0.28)");
  grad.addColorStop(0.55, "rgba(139,108,255,0.08)");
  grad.addColorStop(1, "rgba(34,211,238,0)");
  ctx.beginPath();
  smoothPath(ctx, mainPts);
  ctx.lineTo(mainPts[mainPts.length - 1].x, h - pad.bottom);
  ctx.lineTo(pad.left, h - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  const lineGrad = ctx.createLinearGradient(pad.left, 0, w - pad.right, 0);
  lineGrad.addColorStop(0, "#8b6cff");
  lineGrad.addColorStop(1, "#22d3ee");
  ctx.beginPath();
  smoothPath(ctx, mainPts);
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2.1;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(124,92,255,0.5)";
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (forecast && forecast.length > 1) {
    const fPts = forecast.map((f) => ({ x: xFor(f.x), y: yFor(f.y) }));
    ctx.beginPath();
    smoothPath(ctx, fPts);
    ctx.strokeStyle = "rgba(34,211,238,0.85)";
    ctx.lineWidth = 1.7;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    const tip = fPts[fPts.length - 1];
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#22d3ee";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(34,211,238,0.18)";
    ctx.fill();
  }

  const last = mainPts[mainPts.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(139,108,255,0.2)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(last.x, last.y, 3.4, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  if (hoverIndex >= 0 && hoverIndex < mainPts.length) {
    const p = mainPts[hoverIndex];
    ctx.beginPath();
    ctx.moveTo(p.x, pad.top);
    ctx.lineTo(p.x, h - pad.bottom);
    ctx.strokeStyle = "rgba(139,108,255,0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(139,108,255,0.25)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }

  return {
    xFor,
    yFor,
    pad,
    indexForX: (x) => {
      const ratio = (x - pad.left) / innerW;
      return Math.round(Math.min(Math.max(ratio, 0), 1) * (points.length - 1));
    },
  };
}

export function drawDonut(canvas, segments) {
  const base = initCanvas(canvas);
  if (!base || !segments.length) return;
  const { ctx, w, h } = base;
  const cx = w / 2;
  const cy = h / 2;
  const thickness = Math.min(w, h) * 0.15;
  const radius = Math.min(w, h) / 2 - thickness / 2 - 4;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const gap = 0.06;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(148,163,184,0.08)";
  ctx.lineWidth = thickness;
  ctx.stroke();

  let angle = -Math.PI / 2;
  segments.forEach((seg) => {
    const sweep = (seg.value / total) * Math.PI * 2;
    const start = angle + gap / 2;
    const end = angle + sweep - gap / 2;
    if (end > start) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, end);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.shadowColor = hexA(seg.color, 0.5);
      ctx.shadowBlur = 9;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    angle += sweep;
  });
}

export function hexA(hex, alpha) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const ALLOC_COLORS = ["#8b6cff", "#22d3ee", "#3ce6b0", "#fbbf24", "#fb7185", "#60a5fa", "#c084fc", "#34d399"];
