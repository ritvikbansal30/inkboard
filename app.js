// Inkboard — personal whiteboard + PDF annotator
import { getStroke } from './vendor/perfect-freehand.mjs';
import * as pdfjsLib from './vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.mjs';
const PDF_OPTS = { cMapUrl: './vendor/cmaps/', cMapPacked: true, standardFontDataUrl: './vendor/standard_fonts/' };

/* ================= utilities ================= */
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DPR = () => window.devicePixelRatio || 1;
const r2 = n => Math.round(n * 100) / 100;
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
function hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const lum = hex => { const [r, g, b] = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
let toastT;
function toast(msg, ms = 1800) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
const FONT = '-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ================= icons ================= */
const IC = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  sidebar: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  dots: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  plusbox: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  maximize: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
  select: '<path d="M5 3l14 7-6 2-2 6z"/>',
  lasso: '<path d="M7 17.5C4 16.4 2 14.3 2 12c0-4 4.5-7 10-7s10 3 10 7-4.5 7-10 7c-1 0-2-.1-3-.3"/><circle cx="7" cy="18" r="2"/><path d="M7 20c0 1.5-1 2-2 2"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
  eraser: '<path d="M7 21l-4.3-4.3a2.4 2.4 0 0 1 0-3.4l9.6-9.6a2.4 2.4 0 0 1 3.4 0l5.6 5.6a2.4 2.4 0 0 1 0 3.4L13 21"/><path d="M22 21H7M5 11l9 9"/>',
  text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  laser: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  page: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  front: '<rect x="8" y="8" width="12" height="12" rx="2" fill="currentColor" fill-opacity=".25"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
  back: '<rect x="4" y="4" width="12" height="12" rx="2"/><path d="M20 8v11a1 1 0 0 1-1 1H8"/>',
  save: '<path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M7 3v5h8M7 21v-7h10v7"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  extend: '<path d="M12 5v14M6 13l6 6 6-6M4 3h16"/>',
  // shapes
  s_line: '<path d="M5 19L19 5"/>',
  s_arrow: '<path d="M5 19L19 5M10 5h9v9"/>',
  s_darrow: '<path d="M5 19L19 5M10 5h9v9M14 19H5v-9"/>',
  s_rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
  s_ellipse: '<ellipse cx="12" cy="12" rx="9" ry="7"/>',
  s_triangle: '<path d="M12 4l9 16H3z"/>',
  s_diamond: '<path d="M12 3l9 9-9 9-9-9z"/>',
  s_axes: '<path d="M5 3v16h16M3 5l2-2 2 2M19 17l2 2-2 2"/>',
};
const icon = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24">${IC[n] || ''}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));

/* ================= IndexedDB ================= */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('inkboard', 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('notebooks', { keyPath: 'id' }); d.createObjectStore('meta', { keyPath: 'id' }); d.createObjectStore('blobs'); };
      r.onsuccess = () => { this.db = r.result; res(); }; r.onerror = () => rej(r.error);
    });
  },
  req(store, mode, fn) {
    return new Promise((res, rej) => {
      const t = this.db.transaction(store, mode); const q = fn(t.objectStore(store));
      t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  },
  get(s, k) { return this.req(s, 'readonly', o => o.get(k)); },
  put(s, v, k) { return this.req(s, 'readwrite', o => k === undefined ? o.put(v) : o.put(v, k)); },
  del(s, k) { return this.req(s, 'readwrite', o => o.delete(k)); },
  all(s) { return this.req(s, 'readonly', o => o.getAll()); },
};

/* ================= pens & palettes ================= */
const STYLES = {
  ballpoint: { label: 'Ballpoint', thinning: 0.22, smoothing: 0.62, streamline: 0.45, taper: 0 },
  fountain: { label: 'Fountain', thinning: 0.68, smoothing: 0.62, streamline: 0.5, taper: 0 },
  brush: { label: 'Brush', thinning: 0.82, smoothing: 0.72, streamline: 0.55, taper: 35 },
  marker: { label: 'Marker', thinning: 0, smoothing: 0.6, streamline: 0.5, taper: 0 },
  highlighter: { label: 'Highlighter', thinning: 0, smoothing: 0.75, streamline: 0.62, taper: 0 },
};
const DEFAULT_PRESETS = [
  { id: 'p1', kind: 'pen', style: 'ballpoint', color: '#111111', size: 3, opacity: 1, pressure: true },
  { id: 'p2', kind: 'pen', style: 'fountain', color: '#1e5eff', size: 4, opacity: 1, pressure: true },
  { id: 'p3', kind: 'pen', style: 'ballpoint', color: '#e5302f', size: 3, opacity: 1, pressure: true },
  { id: 'p4', kind: 'pen', style: 'marker', color: '#12a150', size: 5, opacity: 1, pressure: false },
  { id: 'p5', kind: 'pen', style: 'brush', color: '#ffffff', size: 6, opacity: 1, pressure: true },
  { id: 'h1', kind: 'highlighter', style: 'highlighter', color: '#ffe14d', size: 24, opacity: 0.6, pressure: false },
  { id: 'h2', kind: 'highlighter', style: 'highlighter', color: '#7cf29b', size: 24, opacity: 0.6, pressure: false },
  { id: 'h3', kind: 'highlighter', style: 'highlighter', color: '#ff8fd1', size: 24, opacity: 0.6, pressure: false },
];
const PALETTE = ['#000000', '#3c3c3c', '#7a7a7a', '#bdbdbd', '#ffffff', '#e5302f', '#ff6b35', '#ffb000', '#ffe14d', '#c6f432',
  '#12a150', '#1fd1a5', '#00b8d9', '#1e5eff', '#3b2ccf', '#8e44ff', '#d63ad6', '#ff4fa3', '#8b5a2b', '#0b3d2e'];
const QUICK = ['#111111', '#ffffff', '#e5302f', '#1e5eff', '#12a150', '#ff8c00', '#8e44ff', '#ffe14d'];
const BG_COLORS = [['#ffffff', 'White'], ['#f7f3e8', 'Paper'], ['#111316', 'Black'], ['#1f3b2d', 'Chalkboard'], ['#14213d', 'Navy'], ['#2b2f36', 'Slate']];
const SHAPES = ['line', 'arrow', 'darrow', 'rect', 'ellipse', 'triangle', 'diamond', 'axes'];
const SHAPE_NAMES = { line: 'Line', arrow: 'Arrow', darrow: 'Double arrow', rect: 'Rectangle', ellipse: 'Ellipse', triangle: 'Triangle', diamond: 'Diamond', axes: 'Axes' };

const LS = {
  get(k, d) { try { const v = localStorage.getItem('inkboard.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { localStorage.setItem('inkboard.' + k, JSON.stringify(v)); },
};

/* ================= state ================= */
const S = {
  nb: null, pageIdx: 0,
  tool: 'ink',
  presets: LS.get('presets', DEFAULT_PRESETS),
  activePreset: LS.get('activePreset', 'p1'),
  lastPen: LS.get('lastPen', 'p1'), lastHl: LS.get('lastHl', 'h1'),
  shape: LS.get('shape', { kind: 'arrow', color: '#e5302f', size: 4, dash: false, fill: false }),
  text: LS.get('text', { color: '#111111', fs: 36 }),
  eraser: LS.get('eraser', { mode: 'stroke', size: 24 }),
  recent: LS.get('recent', []),
  defaultBg: LS.get('defaultBg', { color: '#ffffff', pattern: 'none', image: null }),
  view: { scale: 1, x: 0, y: 0 },
  sel: new Set(),
  undo: [], redo: [],
  hover: null, laser: [], editingText: null, hiddenId: null, present: false,
};
const activePreset = () => S.presets.find(p => p.id === S.activePreset) || S.presets[0];
const savePrefs = () => { LS.set('presets', S.presets); LS.set('activePreset', S.activePreset); LS.set('lastPen', S.lastPen); LS.set('lastHl', S.lastHl); LS.set('shape', S.shape); LS.set('text', S.text); LS.set('eraser', S.eraser); LS.set('recent', S.recent); LS.set('defaultBg', S.defaultBg); };
const curPage = () => S.nb.pages[S.pageIdx];

/* ================= geometry: items → drawable ops ================= */
function svgFromOutline(pts) {
  if (!pts.length) return '';
  const d = ['M', r2(pts[0][0]), r2(pts[0][1]), 'Q'];
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    d.push(r2(x0), r2(y0), r2((x0 + x1) / 2), r2((y0 + y1) / 2));
  }
  d.push('Z'); return d.join(' ');
}
function inkOptions(it, last = true) {
  const st = STYLES[it.style] || STYLES.ballpoint;
  return { size: it.size, thinning: st.thinning, smoothing: st.smoothing, streamline: st.streamline, simulatePressure: !!it.sim, last,
    start: { taper: st.taper, cap: true }, end: { taper: st.taper, cap: true } };
}
function ellipsePath(cx, cy, rx, ry) {
  const k = 0.5522848, ox = rx * k, oy = ry * k;
  return `M${cx - rx} ${cy}C${cx - rx} ${cy - oy} ${cx - ox} ${cy - ry} ${cx} ${cy - ry}C${cx + ox} ${cy - ry} ${cx + rx} ${cy - oy} ${cx + rx} ${cy}C${cx + rx} ${cy + oy} ${cx + ox} ${cy + ry} ${cx} ${cy + ry}C${cx - ox} ${cy + ry} ${cx - rx} ${cy + oy} ${cx - rx} ${cy}Z`;
}
function arrowOps(ops, st, x1, y1, x2, y2, both) {
  const w = st.width, len = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const h = Math.min(len * (both ? 0.4 : 0.6), Math.max(12, w * 3.4 + 8)), hw = h * 0.52;
  const head = (tx, ty, dx, dy) => {
    const bx = tx - dx * h, by = ty - dy * h, px = -dy * hw, py = dx * hw, mx = tx - dx * h * 0.72, my = ty - dy * h * 0.72;
    return `M${r2(tx)} ${r2(ty)}L${r2(bx + px)} ${r2(by + py)}Q${r2(mx)} ${r2(my)} ${r2(bx - px)} ${r2(by - py)}Z`;
  };
  const sx = both ? x1 + ux * h * 0.7 : x1, sy = both ? y1 + uy * h * 0.7 : y1;
  ops.push({ d: `M${r2(sx)} ${r2(sy)}L${r2(x2 - ux * h * 0.7)} ${r2(y2 - uy * h * 0.7)}`, ...st });
  const hs = { fill: st.stroke, fillAlpha: st.alpha, stroke: st.stroke, width: Math.min(w, 3), alpha: st.alpha };
  ops.push({ d: head(x2, y2, ux, uy), ...hs });
  if (both) ops.push({ d: head(x1, y1, -ux, -uy), ...hs });
}
function shapeOps(s) {
  const { x1, y1, x2, y2, size: w, color, opacity: a, dash, fill, kind } = s;
  const st = { stroke: color, width: w, alpha: a ?? 1, dash: dash ? [w * 2.6, w * 2.2] : null };
  const fx = fill ? { fill: color, fillAlpha: 0.22 * (a ?? 1) } : {};
  const ops = [];
  const L = Math.min(x1, x2), R = Math.max(x1, x2), T = Math.min(y1, y2), B = Math.max(y1, y2);
  switch (kind) {
    case 'line': ops.push({ d: `M${r2(x1)} ${r2(y1)}L${r2(x2)} ${r2(y2)}`, ...st }); break;
    case 'arrow': arrowOps(ops, st, x1, y1, x2, y2, false); break;
    case 'darrow': arrowOps(ops, st, x1, y1, x2, y2, true); break;
    case 'rect': ops.push({ d: `M${r2(L)} ${r2(T)}H${r2(R)}V${r2(B)}H${r2(L)}Z`, ...st, ...fx }); break;
    case 'ellipse': ops.push({ d: ellipsePath((L + R) / 2, (T + B) / 2, (R - L) / 2, (B - T) / 2), ...st, ...fx }); break;
    case 'triangle': ops.push({ d: `M${r2((x1 + x2) / 2)} ${r2(y1)}L${r2(x2)} ${r2(y2)}L${r2(x1)} ${r2(y2)}Z`, ...st, ...fx }); break;
    case 'diamond': { const cx = (L + R) / 2, cy = (T + B) / 2; ops.push({ d: `M${r2(cx)} ${r2(T)}L${r2(R)} ${r2(cy)}L${r2(cx)} ${r2(B)}L${r2(L)} ${r2(cy)}Z`, ...st, ...fx }); break; }
    case 'axes': arrowOps(ops, st, L, B, R, B, false); arrowOps(ops, st, L, B, L, T, false); break;
  }
  return ops;
}
const opsCache = new WeakMap();
function computeOps(it, live = false) {
  if (it.t === 'ink') return [{ d: svgFromOutline(getStroke(it.pts, inkOptions(it, !live))), fill: it.color, fillAlpha: it.opacity }];
  if (it.t === 'shape') return shapeOps(it);
  return [];
}
function itemOps(it) { let o = opsCache.get(it); if (!o) { o = computeOps(it); opsCache.set(it, o); } return o; }
function drawOps(ctx, ops) {
  for (const op of ops) {
    const p = op._p || (op._p = new Path2D(op.d));
    if (op.fill) { ctx.globalAlpha = op.fillAlpha ?? 1; ctx.fillStyle = op.fill; ctx.fill(p); }
    if (op.stroke) { ctx.globalAlpha = op.alpha ?? 1; ctx.strokeStyle = op.stroke; ctx.lineWidth = op.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(op.dash || []); ctx.stroke(p); }
  }
  ctx.globalAlpha = 1; ctx.setLineDash([]);
}
function textLines(it) { return it.text.split('\n'); }
function measureText(text, fs) {
  const c = measureText.c || (measureText.c = document.createElement('canvas').getContext('2d'));
  c.font = `${fs}px ${FONT}`; const lines = text.split('\n');
  return { w: Math.max(4, ...lines.map(l => c.measureText(l).width)), h: lines.length * fs * 1.25 };
}
function drawItem(ctx, it) {
  if (it.t === 'text') {
    ctx.fillStyle = it.color; ctx.font = `${it.fs}px ${FONT}`; ctx.textBaseline = 'top';
    textLines(it).forEach((l, i) => ctx.fillText(l, it.x, it.y + i * it.fs * 1.25 + it.fs * 0.1));
  } else if (it.t === 'img') {
    const im = getImage(it.key); if (im) ctx.drawImage(im, it.x, it.y, it.w, it.h);
    else { ctx.fillStyle = 'rgba(128,128,128,.2)'; ctx.fillRect(it.x, it.y, it.w, it.h); }
  } else drawOps(ctx, itemOps(it));
}

/* bounding boxes / hit tests */
const bbCache = new WeakMap();
function itemBBox(it) {
  let b = bbCache.get(it); if (b) return b;
  if (it.t === 'ink') {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of it.pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    const p = it.size / 2; b = { x: x0 - p, y: y0 - p, w: x1 - x0 + 2 * p, h: y1 - y0 + 2 * p };
  } else if (it.t === 'shape') {
    const p = it.size / 2 + (/arrow|axes/.test(it.kind) ? Math.max(12, it.size * 3.4 + 8) * 0.55 : 0);
    const L = Math.min(it.x1, it.x2), T = Math.min(it.y1, it.y2);
    b = { x: L - p, y: T - p, w: Math.abs(it.x2 - it.x1) + 2 * p, h: Math.abs(it.y2 - it.y1) + 2 * p };
  } else b = { x: it.x, y: it.y, w: it.w, h: it.h };
  bbCache.set(it, b); return b;
}
const polyCache = new WeakMap();
function itemPolys(it) {
  let P = polyCache.get(it); if (P) return P;
  if (it.t === 'ink') P = [it.pts];
  else if (it.t === 'shape') {
    const { x1, y1, x2, y2 } = it, L = Math.min(x1, x2), R = Math.max(x1, x2), T = Math.min(y1, y2), B = Math.max(y1, y2);
    const cx = (L + R) / 2, cy = (T + B) / 2;
    switch (it.kind) {
      case 'rect': P = [[[L, T], [R, T], [R, B], [L, B], [L, T]]]; break;
      case 'ellipse': P = [Array.from({ length: 49 }, (_, i) => [cx + Math.cos(i / 48 * Math.PI * 2) * (R - L) / 2, cy + Math.sin(i / 48 * Math.PI * 2) * (B - T) / 2])]; break;
      case 'triangle': P = [[[(x1 + x2) / 2, y1], [x2, y2], [x1, y2], [(x1 + x2) / 2, y1]]]; break;
      case 'diamond': P = [[[cx, T], [R, cy], [cx, B], [L, cy], [cx, T]]]; break;
      case 'axes': P = [[[L, T], [L, B], [R, B]]]; break;
      default: P = [[[x1, y1], [x2, y2]]];
    }
  } else { const { x, y, w, h } = it; P = [[[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]]; }
  polyCache.set(it, P); return P;
}
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = clamp(t, 0, 1);
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
function inPoly(x, y, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function itemHit(it, x, y, r) {
  const b = itemBBox(it);
  if (x < b.x - r || x > b.x + b.w + r || y < b.y - r || y > b.y + b.h + r) return false;
  if (it.t === 'text' || it.t === 'img') return true;
  const tol = r + it.size / 2;
  for (const poly of itemPolys(it)) {
    if (poly.length === 1 && Math.hypot(poly[0][0] - x, poly[0][1] - y) < tol) return true;
    for (let i = 1; i < poly.length; i++) if (distSeg(x, y, poly[i - 1][0], poly[i - 1][1], poly[i][0], poly[i][1]) < tol) return true;
  }
  if (it.t === 'shape' && it.fill && !/line|arrow|axes/.test(it.kind) && inPoly(x, y, itemPolys(it)[0])) return true;
  return false;
}
function transformItem(it, f, s = 1) {
  const n = { ...it };
  if (it.t === 'ink') { n.pts = it.pts.map(p => { const [x, y] = f(p[0], p[1]); return [r2(x), r2(y), p[2]]; }); n.size = it.size * s; }
  else if (it.t === 'shape') { [n.x1, n.y1] = f(it.x1, it.y1); [n.x2, n.y2] = f(it.x2, it.y2); n.size = it.size * s; }
  else { [n.x, n.y] = f(it.x, it.y); n.w = it.w * s; n.h = it.h * s; if (it.t === 'text') n.fs = it.fs * s; }
  return n;
}

/* ================= images & pdf ================= */
const imgCache = new Map();
function getImage(key) {
  let e = imgCache.get(key);
  if (e) return e.img || null;
  e = {}; imgCache.set(key, e);
  DB.get('blobs', key).then(blob => {
    if (!blob) return;
    const im = new Image(); im.onload = () => { e.img = im; invalidate('bg', 'ink'); thumbDirtyAll(); }; im.src = URL.createObjectURL(blob);
  });
  return null;
}
const pdfDocs = new Map();
function getPdfDoc(src) {
  if (!pdfDocs.has(src)) {
    const s = S.nb.sources[src];
    pdfDocs.set(src, DB.get('blobs', s.blob).then(async blob => pdfjsLib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), ...PDF_OPTS }).promise));
  }
  return pdfDocs.get(src);
}
const pdfCache = new Map(); const pdfPending = new Map();
const pdfKey = p => p.src + ':' + p.idx;
function maxScale(p) { return Math.sqrt(14e6 / (p.w * p.h)); }
async function renderPdfToCanvas(p, scale) {
  const doc = await getPdfDoc(p.src);
  const pg = await doc.getPage(p.idx + 1);
  const vp1 = pg.getViewport({ scale: 1 });
  if (Math.abs(vp1.width - p.w) > 0.5 || Math.abs(vp1.height - p.h) > 0.5) {
    p.w = vp1.width; p.h = vp1.height; markSave();
    if (curPage() === p) fitPage();
  }
  const vp = pg.getViewport({ scale });
  const cv = document.createElement('canvas'); cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  await pg.render({ canvasContext: ctx, viewport: vp }).promise;
  return cv;
}
function ensurePdf(p, scale) {
  const k = pdfKey(p), c = pdfCache.get(k);
  scale = Math.min(scale, maxScale(p));
  if (c && c.scale >= scale * 0.9) return;
  if (pdfPending.has(k)) return;
  pdfPending.set(k, true);
  renderPdfToCanvas(p, scale).then(canvas => {
    pdfCache.delete(k); pdfCache.set(k, { canvas, scale });
    while (pdfCache.size > 10) pdfCache.delete(pdfCache.keys().next().value);
    if (S.nb.pages[S.pageIdx] === p) invalidate('bg');
  }).catch(err => console.error('PDF render', err)).finally(() => pdfPending.delete(k));
}
const ensurePdfDebounced = debounce((p, s) => ensurePdf(p, s), 160);

/* ================= stage & rendering ================= */
const stage = $('#stage');
const C = { bg: $('#bgC'), hl: $('#hlC'), ink: $('#inkC'), live: $('#liveC') };
const X = Object.fromEntries(Object.entries(C).map(([k, c]) => [k, c.getContext('2d')]));
function resizeCanvases() {
  const w = stage.clientWidth, h = stage.clientHeight, d = DPR();
  for (const c of Object.values(C)) { c.width = Math.round(w * d); c.height = Math.round(h * d); }
  invalidate('bg', 'ink', 'live');
}
new ResizeObserver(() => { resizeCanvases(); if (S.nb) { if (S.autoFit) fitPage(); updateSelBar(); } }).observe(stage);
const setView = ctx => { const d = DPR(), v = S.view; ctx.setTransform(d * v.scale, 0, 0, d * v.scale, d * v.x, d * v.y); };
const clearCtx = ctx => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); };

let raf = 0; const dirty = { bg: 0, ink: 0, live: 0 };
function invalidate(...layers) { for (const l of layers) dirty[l] = 1; if (!raf) raf = requestAnimationFrame(frame); }
function frame() {
  raf = 0;
  if (!S.nb) return;
  const d = { ...dirty }; dirty.bg = dirty.ink = dirty.live = 0;
  if (d.bg) drawBg(); if (d.ink) drawInk(); if (d.live) drawLive();
  if (S.laser.length) invalidate('live');
}
function pageBg(p) { return p.bg || S.defaultBg; }
function isDarkPage(p) { return p.kind !== 'pdf' && lum(pageBg(p).color) < 0.45; }
function drawBoardBg(ctx, p, unit) {
  const bg = pageBg(p);
  ctx.fillStyle = bg.color; ctx.fillRect(0, 0, p.w, p.h);
  if (bg.image) {
    const im = getImage(bg.image);
    if (im) { const s = Math.max(p.w / im.width, p.h / im.height), w = im.width * s, h = im.height * s; ctx.save(); ctx.beginPath(); ctx.rect(0, 0, p.w, p.h); ctx.clip(); ctx.drawImage(im, (p.w - w) / 2, (p.h - h) / 2, w, h); ctx.restore(); }
  }
  const pat = bg.pattern;
  if (pat && pat !== 'none') {
    const dark = lum(bg.color) < 0.45, g = 40;
    ctx.strokeStyle = ctx.fillStyle = dark ? 'rgba(255,255,255,.10)' : 'rgba(30,80,140,.16)';
    ctx.lineWidth = Math.max(unit, 0.6);
    if (pat === 'dots') { const r = Math.max(1.6, unit * 1.2); for (let y = g; y < p.h; y += g) for (let x = g; x < p.w; x += g) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); } }
    else {
      ctx.beginPath();
      for (let y = g; y < p.h; y += g) { ctx.moveTo(0, y); ctx.lineTo(p.w, y); }
      if (pat === 'grid') for (let x = g; x < p.w; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, p.h); }
      ctx.stroke();
      if (pat === 'lines') { ctx.strokeStyle = dark ? 'rgba(255,120,120,.25)' : 'rgba(230,60,60,.3)'; ctx.beginPath(); ctx.moveTo(90, 0); ctx.lineTo(90, p.h); ctx.stroke(); }
    }
  }
}
function drawBg() {
  const ctx = X.bg, p = curPage();
  clearCtx(ctx); ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--desk') || '#1d2026'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  setView(ctx);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 28 * DPR(); ctx.shadowOffsetY = 6 * DPR();
  ctx.fillStyle = p.kind === 'pdf' ? '#fff' : pageBg(p).color; ctx.fillRect(0, 0, p.w, p.h); ctx.restore();
  if (p.kind === 'pdf') {
    const want = S.view.scale * DPR(), c = pdfCache.get(pdfKey(p));
    if (c) ctx.drawImage(c.canvas, 0, 0, p.w, p.h);
    else { ctx.fillStyle = '#9aa1ad'; ctx.font = `${16 / S.view.scale}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('Rendering…', p.w / 2, p.h / 2); ctx.textAlign = 'left'; }
    if (!c) ensurePdf(p, want); else if (c.scale < Math.min(want, maxScale(p)) * 0.9) ensurePdfDebounced(p, want);
  } else drawBoardBg(ctx, p, 1 / S.view.scale);
  C.hl.style.mixBlendMode = isDarkPage(p) ? 'screen' : 'multiply';
}
function drawInk() {
  const p = curPage(), hl = X.hl, ink = X.ink;
  for (const c of [hl, ink]) { clearCtx(c); setView(c); c.save(); c.beginPath(); c.rect(0, 0, p.w, p.h); c.clip(); }
  const v = S.view, st = stage, vx0 = -v.x / v.scale, vy0 = -v.y / v.scale, vx1 = vx0 + st.clientWidth / v.scale, vy1 = vy0 + st.clientHeight / v.scale;
  const items = p.items;
  const vis = it => { const b = itemBBox(it); return !(b.x > vx1 || b.y > vy1 || b.x + b.w < vx0 || b.y + b.h < vy0) && it.id !== S.hiddenId; };
  for (const it of items) if (it.t === 'img' && vis(it)) drawItem(ink, it);
  for (const it of items) if (it.t !== 'img' && vis(it)) drawItem(it.hl ? hl : ink, it);
  hl.restore(); ink.restore();
}
function drawLive() {
  const ctx = X.live; clearCtx(ctx); setView(ctx);
  const sc = S.view.scale;
  if (drag?.mode === 'ink') drawOps(ctx, computeOps(drag.item, true));
  if (drag?.mode === 'shape') drawOps(ctx, computeOps(drag.s));
  if (drag?.mode === 'lasso' && drag.pts.length > 1) {
    ctx.beginPath(); drag.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.fillStyle = 'rgba(8,189,128,.08)'; ctx.fill(); ctx.setLineDash([6 / sc, 5 / sc]); ctx.lineWidth = 1.5 / sc; ctx.strokeStyle = '#08bd80'; ctx.stroke(); ctx.setLineDash([]);
  }
  if (S.sel.size && drag?.mode !== 'lasso') {
    const b = selBBox();
    if (b) {
      const pad = 6 / sc;
      ctx.setLineDash([5 / sc, 4 / sc]); ctx.lineWidth = 1.3 / sc; ctx.strokeStyle = '#08bd80';
      ctx.strokeRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2); ctx.setLineDash([]);
      const hs = 9 / sc; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#08bd80'; ctx.lineWidth = 2 / sc;
      ctx.beginPath(); ctx.arc(b.x + b.w + pad, b.y + b.h + pad, hs / 1.6, 0, 7); ctx.fill(); ctx.stroke();
    }
  }
  const h = S.hover;
  if (h && (S.tool === 'eraser' || drag?.mode === 'erase')) {
    const r = S.eraser.size / 2 / sc;
    ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fill();
    ctx.lineWidth = 1.5 / sc; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(h.x, h.y, r + 1.5 / sc, 0, 7); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1 / sc; ctx.stroke();
  }
  // laser
  const now = performance.now(), LIFE = 900;
  S.laser = S.laser.filter(q => now - q.t < LIFE);
  if (S.laser.length > 1) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,40,40,.9)'; ctx.shadowBlur = 14 * DPR();
    for (let i = 1; i < S.laser.length; i++) {
      const a = S.laser[i - 1], b = S.laser[i]; if (b.brk) continue;
      const age = 1 - (now - b.t) / LIFE;
      ctx.strokeStyle = `rgba(255,${60 + 120 * age | 0},${60 + 100 * age | 0},${age})`; ctx.lineWidth = (2 + 5 * age) / sc;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }
  if (h && S.tool === 'laser') {
    ctx.shadowColor = 'rgba(255,30,30,1)'; ctx.shadowBlur = 18 * DPR();
    ctx.beginPath(); ctx.arc(h.x, h.y, 6 / sc, 0, 7); ctx.fillStyle = '#ff2d2d'; ctx.fill();
    ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(h.x, h.y, 2.4 / sc, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
  }
}

/* ================= view ================= */
function fitPage() {
  const p = curPage(); if (!p) return;
  const W = stage.clientWidth, H = stage.clientHeight;
  const pad = S.present ? 0 : 28, bottom = S.present ? 0 : 76;
  const availW = W - pad * 2, availH = H - pad - bottom;
  let s = Math.min(availW / p.w, availH / p.h);
  if (p.h / p.w > 1.25 && p.kind !== 'pdf') s = availW / p.w; // tall boards: fit width
  S.view.scale = s; S.view.x = (W - p.w * s) / 2; S.view.y = pad + Math.max(0, (availH - p.h * s) / 2);
  S.autoFit = true; viewChanged();
}
function zoomAt(f, sx, sy) {
  const v = S.view, ns = clamp(v.scale * f, 0.05, 24), k = ns / v.scale;
  v.x = sx - (sx - v.x) * k; v.y = sy - (sy - v.y) * k; v.scale = ns; S.autoFit = false; viewChanged();
}
function viewChanged() { invalidate('bg', 'ink', 'live'); updateSelBar(); $('#zoomPct').textContent = Math.round(S.view.scale * 100) + '%'; if (S.editingText) positionTextEditor(); }

/* ================= history ================= */
function commit(page, before) {
  if (before === page.items) return;
  S.undo.push({ pid: page.id, before, after: page.items }); if (S.undo.length > 400) S.undo.shift();
  S.redo = []; markSave(); thumbDirty(page);
}
function commitPages(before) { S.undo.push({ type: 'pages', before, after: S.nb.pages.slice(), idx: S.pageIdx }); S.redo = []; markSave(); }
function applyHist(h, which) {
  if (h.type === 'pages') {
    S.nb.pages = h[which].slice(); buildThumbs(); gotoPage(clamp(h.idx, 0, S.nb.pages.length - 1)); markSave(); return;
  }
  const i = S.nb.pages.findIndex(p => p.id === h.pid); if (i < 0) return;
  S.nb.pages[i].items = h[which]; S.sel.clear();
  if (i !== S.pageIdx) gotoPage(i); else { invalidate('ink', 'live'); updateSelBar(); }
  markSave(); thumbDirty(S.nb.pages[i]);
}
function undo() { if (S.editingText) finishText(); const h = S.undo.pop(); if (!h) return toast('Nothing to undo'); applyHist(h, 'before'); S.redo.push(h); }
function redo() { const h = S.redo.pop(); if (!h) return; applyHist(h, 'after'); S.undo.push(h); }

/* ================= persistence ================= */
let saving = false;
const saveNow = async () => {
  if (!S.nb) return;
  S.nb.updated = Date.now();
  try {
    saving = true; $('#saveState').textContent = 'Saving…';
    await DB.put('notebooks', S.nb);
    const meta = { id: S.nb.id, name: S.nb.name, updated: S.nb.updated, pages: S.nb.pages.length, kind: S.nb.pages.some(p => p.kind === 'pdf') ? 'pdf' : 'board', cover: coverImage() };
    await DB.put('meta', meta);
    $('#saveState').textContent = 'Saved';
  } catch (e) { console.error(e); $('#saveState').textContent = 'Save failed!'; toast('Could not save: ' + e.message, 4000); }
  saving = false;
};
const saveSoon = debounce(saveNow, 700);
function markSave() { $('#saveState').textContent = 'Edited'; saveSoon(); }
function coverImage() {
  const c = document.querySelector('.thumb[data-i="0"] canvas');
  try { return c && c.dataset.drawn ? c.toDataURL('image/jpeg', 0.7) : (S.nb._cover || null); } catch { return null; }
}

/* ================= pointer interaction ================= */
let drag = null, spaceDown = false;
const capture = e => { try { stage.setPointerCapture(e.pointerId); } catch {} };
const HOLD_MS = 550;
function evPt(e) { const r = stage.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top; return { sx, sy, x: (sx - S.view.x) / S.view.scale, y: (sy - S.view.y) / S.view.scale }; }
function pressureOf(e, preset) { return (e.pointerType === 'pen' && preset.pressure) ? clamp(e.pressure || 0.5, 0.05, 1) : 0.5; }

stage.addEventListener('pointerdown', e => {
  closePopover();
  if (S.editingText) { const was = S.editingText; finishText(); if (S.tool === 'text' && !was.fresh) return; if (S.tool === 'text') return; }
  const P = evPt(e); S.hover = P;
  if (e.button === 1 || spaceDown || S.tool === 'hand') {
    drag = { mode: 'pan', sx: e.clientX, sy: e.clientY, vx: S.view.x, vy: S.view.y };
    capture(e); stage.classList.add('panning'); return;
  }
  let tool = S.tool;
  if (e.pointerType === 'pen' && (e.button === 5 || (e.buttons & 32) || e.button === 2)) tool = 'eraser';
  else if (e.button !== 0) return;
  capture(e);
  const page = curPage();
  if (tool === 'ink') {
    const pr = activePreset();
    drag = {
      mode: 'ink', anchor: { sx: P.sx, sy: P.sy }, holdT: setTimeout(holdSnap, HOLD_MS),
      item: { t: 'ink', hl: pr.kind === 'highlighter', color: pr.color, size: pr.size, opacity: pr.opacity, style: pr.style,
        sim: e.pointerType !== 'pen' && pr.pressure && pr.kind === 'pen', pts: [[r2(P.x), r2(P.y), pressureOf(e, pr)]] },
    };
    C.live.style.mixBlendMode = drag.item.hl ? C.hl.style.mixBlendMode : 'normal';
    if (S.sel.size) { S.sel.clear(); updateSelBar(); }
  } else if (tool === 'shape') {
    drag = { mode: 'shape', follow: true, s: { t: 'shape', kind: S.shape.kind, x1: P.x, y1: P.y, x2: P.x, y2: P.y, color: S.shape.color, size: S.shape.size, opacity: 1, dash: S.shape.dash, fill: S.shape.fill } };
    if (S.sel.size) { S.sel.clear(); updateSelBar(); }
  } else if (tool === 'eraser') {
    drag = { mode: 'erase', before: page.items, last: P };
    eraseAt(P.x, P.y);
  } else if (tool === 'select') {
    const b = S.sel.size && selBBox();
    const pad = 6 / S.view.scale;
    if (b && Math.hypot(P.x - (b.x + b.w + pad), P.y - (b.y + b.h + pad)) < 14 / S.view.scale) {
      drag = { mode: 'scale', b, before: page.items };
    } else if (b && P.x > b.x - pad && P.x < b.x + b.w + pad && P.y > b.y - pad && P.y < b.y + b.h + pad) {
      drag = { mode: 'move', start: P, before: page.items };
    } else {
      const hit = topItemAt(P.x, P.y);
      if (hit && !e.shiftKey) { S.sel = new Set([hit.id]); drag = { mode: 'move', start: P, before: page.items }; updateSelBar(); }
      else drag = { mode: 'lasso', pts: [[P.x, P.y]], add: e.shiftKey };
    }
    $('#selBar').hidden = true;
  } else if (tool === 'text') {
    const hit = [...page.items].reverse().find(it => it.t === 'text' && itemHit(it, P.x, P.y, 4 / S.view.scale));
    e.preventDefault();
    startText(hit ? hit.x : P.x, hit ? hit.y : P.y - S.text.fs * 0.6, hit);
    return;
  } else if (tool === 'laser') {
    drag = { mode: 'laser' };
    S.laser.push({ x: P.x, y: P.y, t: performance.now(), brk: true });
  }
  invalidate('live');
});
stage.addEventListener('pointermove', e => {
  const P = evPt(e); S.hover = P;
  if (!drag) { if (S.tool === 'eraser' || S.tool === 'laser') invalidate('live'); return; }
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  switch (drag.mode) {
    case 'pan': S.view.x = drag.vx + e.clientX - drag.sx; S.view.y = drag.vy + e.clientY - drag.sy; S.autoFit = false; viewChanged(); return;
    case 'ink': {
      const pr = activePreset();
      for (const ev of evs.length ? evs : [e]) { const q = evPt(ev); drag.item.pts.push([r2(q.x), r2(q.y), pressureOf(ev, pr)]); }
      if (Math.hypot(P.sx - drag.anchor.sx, P.sy - drag.anchor.sy) > 5) { drag.anchor = { sx: P.sx, sy: P.sy }; clearTimeout(drag.holdT); drag.holdT = setTimeout(holdSnap, HOLD_MS); }
      break;
    }
    case 'shape': if (drag.follow) setShapeEnd(drag.s, P.x, P.y, e.shiftKey); break;
    case 'erase': {
      const r = S.eraser.size / 4 / S.view.scale, a = drag.last, n = Math.ceil(Math.hypot(P.x - a.x, P.y - a.y) / r);
      for (let i = 1; i <= n; i++) eraseAt(a.x + (P.x - a.x) * i / n, a.y + (P.y - a.y) * i / n);
      drag.last = P; break;
    }
    case 'lasso': drag.pts.push([P.x, P.y]); break;
    case 'move': {
      const dx = P.x - drag.start.x, dy = P.y - drag.start.y;
      curPage().items = drag.before.map(it => S.sel.has(it.id) ? transformItem(it, (x, y) => [x + dx, y + dy]) : it);
      drag.moved = Math.hypot(dx, dy) > 0.5; invalidate('ink'); break;
    }
    case 'scale': {
      const b = drag.b, ax = b.x, ay = b.y;
      const s = Math.max(0.05, ((P.x - ax) / b.w + (P.y - ay) / b.h) / 2);
      curPage().items = drag.before.map(it => S.sel.has(it.id) ? transformItem(it, (x, y) => [ax + (x - ax) * s, ay + (y - ay) * s], s) : it);
      drag.moved = true; invalidate('ink'); break;
    }
    case 'laser': for (const ev of evs.length ? evs : [e]) { const q = evPt(ev); S.laser.push({ x: q.x, y: q.y, t: performance.now() }); } break;
  }
  invalidate('live');
});
const endDrag = e => {
  if (!drag) return;
  const d = drag; drag = null; const page = curPage();
  stage.classList.remove('panning');
  switch (d.mode) {
    case 'ink': {
      clearTimeout(d.holdT);
      const it = { ...d.item, id: uid() };
      const before = page.items; page.items = [...before, it]; commit(page, before);
      if (it.hl) { S.lastHl = activePreset().id; } else S.lastPen = activePreset().id;
      invalidate('ink'); break;
    }
    case 'shape': {
      const s = d.s, tiny = Math.abs(s.x2 - s.x1) < 3 / S.view.scale && Math.abs(s.y2 - s.y1) < 3 / S.view.scale;
      if (!tiny) { const before = page.items; page.items = [...before, { ...s, id: uid() }]; commit(page, before); invalidate('ink'); }
      break;
    }
    case 'erase': commit(page, d.before); break;
    case 'lasso': {
      if (d.pts.length < 4) { const hit = topItemAt(d.pts[0][0], d.pts[0][1]); if (!d.add) S.sel.clear(); if (hit) S.sel.add(hit.id); }
      else lassoSelect(d.pts, d.add);
      updateSelBar(); break;
    }
    case 'move': case 'scale': if (d.moved) commit(page, d.before); updateSelBar(); break;
  }
  C.live.style.mixBlendMode = 'normal';
  invalidate('live');
};
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('pointerleave', () => { if (!drag) { S.hover = null; invalidate('live'); } });
stage.addEventListener('contextmenu', e => e.preventDefault());
stage.addEventListener('dblclick', e => {
  if (S.tool !== 'select') return;
  const P = evPt(e), hit = curPage().items.slice().reverse().find(it => it.t === 'text' && itemHit(it, P.x, P.y, 4 / S.view.scale));
  if (hit) { S.sel.clear(); updateSelBar(); startText(hit.x, hit.y, hit); }
});
stage.addEventListener('wheel', e => {
  e.preventDefault();
  const P = evPt(e);
  if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * (e.ctrlKey && !e.metaKey ? 0.012 : 0.004)), P.sx, P.sy);
  else { S.view.x -= e.deltaX; S.view.y -= e.deltaY; S.autoFit = false; viewChanged(); }
}, { passive: false });

function setShapeEnd(s, x, y, shift) {
  if (shift) {
    const dx = x - s.x1, dy = y - s.y1;
    if (/line|arrow/.test(s.kind)) { const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12), l = Math.hypot(dx, dy); x = s.x1 + Math.cos(a) * l; y = s.y1 + Math.sin(a) * l; }
    else { const m = Math.max(Math.abs(dx), Math.abs(dy)); x = s.x1 + Math.sign(dx || 1) * m; y = s.y1 + Math.sign(dy || 1) * m; }
  }
  s.x2 = x; s.y2 = y;
}
// hold still at the end of a stroke → convert to a clean shape (Drawboard-style)
function holdSnap() {
  if (!drag || drag.mode !== 'ink' || drag.item.pts.length < 4) return;
  const rec = recognize(drag.item.pts); if (!rec) return;
  const it = drag.item;
  drag = { mode: 'shape', follow: rec.kind === 'line', s: { t: 'shape', ...rec, color: it.color, size: it.size, opacity: it.opacity, dash: false, fill: false, hl: it.hl } };
  invalidate('live');
}
function recognize(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, len = 0;
  pts.forEach(([x, y], i) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); if (i) len += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]); });
  const w = x1 - x0, h = y1 - y0, diag = Math.hypot(w, h);
  if (diag < 10 / S.view.scale) return null;
  const a = pts[0], b = pts[pts.length - 1];
  const closed = Math.hypot(a[0] - b[0], a[1] - b[1]) < Math.max(18 / S.view.scale, diag * 0.22) && len > diag * 1.6;
  if (!closed) return { kind: 'line', x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  let area = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) area += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  const ratio = Math.abs(area / 2) / (w * h || 1);
  if (ratio > 0.86) return { kind: 'rect', x1: x0, y1: y0, x2: x1, y2: y1 };
  if (ratio > 0.66) return { kind: 'ellipse', x1: x0, y1: y0, x2: x1, y2: y1 };
  if (ratio > 0.36 && ratio < 0.62) {
    const topBand = pts.filter(p => p[1] < y0 + h * 0.2), botBand = pts.filter(p => p[1] > y1 - h * 0.2);
    const span = arr => arr.length ? Math.max(...arr.map(p => p[0])) - Math.min(...arr.map(p => p[0])) : 0;
    return span(topBand) < span(botBand) ? { kind: 'triangle', x1: x0, y1: y0, x2: x1, y2: y1 } : { kind: 'triangle', x1: x0, y1: y1, x2: x1, y2: y0 };
  }
  return null;
}
function eraseAt(x, y) {
  const page = curPage(), r = S.eraser.size / 2 / S.view.scale;
  let changed = false; const out = [];
  for (const it of page.items) {
    if (!itemHit(it, x, y, r)) { out.push(it); continue; }
    changed = true;
    if (S.eraser.mode === 'partial' && it.t === 'ink') {
      const dense = [];
      it.pts.forEach((p, i) => {
        if (i) { const q = it.pts[i - 1], n = Math.floor(Math.hypot(p[0] - q[0], p[1] - q[1]) / (r / 2)); for (let k = 1; k < n; k++) dense.push([q[0] + (p[0] - q[0]) * k / n, q[1] + (p[1] - q[1]) * k / n, q[2] + (p[2] - q[2]) * k / n]); }
        dense.push(p);
      });
      const lim = r + it.size * 0.35; let run = [];
      const flush = () => { if (run.length > 1) out.push({ ...it, id: uid(), pts: run }); run = []; };
      for (const p of dense) { if (Math.hypot(p[0] - x, p[1] - y) < lim) flush(); else run.push(p); }
      flush();
    }
  }
  if (changed) { page.items = out; invalidate('ink'); }
}
function topItemAt(x, y) { const r = 5 / S.view.scale; const its = curPage().items; for (let i = its.length - 1; i >= 0; i--) if (itemHit(its[i], x, y, r)) return its[i]; return null; }
function lassoSelect(poly, add) {
  if (!add) S.sel.clear();
  for (const it of curPage().items) {
    let pts = itemPolys(it).flat();
    if (pts.length > 60) pts = pts.filter((_, i) => i % Math.ceil(pts.length / 60) === 0);
    const inside = pts.filter(([x, y]) => inPoly(x, y, poly)).length;
    if (inside / pts.length >= 0.6) S.sel.add(it.id);
  }
}
function selItems() { return curPage().items.filter(it => S.sel.has(it.id)); }
function selBBox() {
  const its = selItems(); if (!its.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const it of its) { const b = itemBBox(it); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
function updateSelBar() {
  const bar = $('#selBar'); const b = S.sel.size && !drag && selBBox();
  if (!b) { bar.hidden = true; invalidate('live'); return; }
  const v = S.view; bar.hidden = false;
  bar.style.left = clamp(v.x + (b.x + b.w / 2) * v.scale, 90, stage.clientWidth - 90) + 'px';
  bar.style.top = Math.max(50, v.y + b.y * v.scale - 14) + 'px';
  invalidate('live');
}
$('#selBar').addEventListener('click', e => {
  const act = e.target.closest('button')?.dataset.act; if (!act) return;
  ({ dup: duplicateSel, del: deleteSel, front: () => reorderSel(true), back: () => reorderSel(false) })[act]();
});
function deleteSel() { const p = curPage(), before = p.items; p.items = before.filter(it => !S.sel.has(it.id)); S.sel.clear(); commit(p, before); invalidate('ink'); updateSelBar(); }
function duplicateSel() {
  const p = curPage(), before = p.items, off = 24, nsel = new Set();
  const copies = selItems().map(it => { const c = transformItem(it, (x, y) => [x + off, y + off]); c.id = uid(); nsel.add(c.id); return c; });
  p.items = [...before, ...copies]; S.sel = nsel; commit(p, before); invalidate('ink'); updateSelBar();
}
function reorderSel(front) { const p = curPage(), before = p.items, a = before.filter(it => S.sel.has(it.id)), b = before.filter(it => !S.sel.has(it.id)); p.items = front ? [...b, ...a] : [...a, ...b]; commit(p, before); invalidate('ink'); }
function recolorSel(color) {
  const p = curPage(), before = p.items;
  p.items = before.map(it => S.sel.has(it.id) && it.t !== 'img' ? { ...it, color } : it); commit(p, before); invalidate('ink');
}

/* ================= text ================= */
function startText(x, y, existing) {
  const ta = document.createElement('textarea'); ta.className = 'text-editor'; ta.spellcheck = false;
  const fs = existing ? existing.fs : S.text.fs, color = existing ? existing.color : S.text.color;
  S.editingText = { ta, x, y, fs, color, existing, fresh: !existing };
  if (existing) { ta.value = existing.text; S.hiddenId = existing.id; invalidate('ink'); }
  ta.style.color = color;
  stage.appendChild(ta); positionTextEditor();
  ta.addEventListener('input', positionTextEditor);
  ta.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); finishText(); } });
  ta.addEventListener('blur', () => setTimeout(() => { if (S.editingText?.ta === ta) finishText(); }, 0));
  setTimeout(() => ta.focus(), 0);
}
function positionTextEditor() {
  const t = S.editingText; if (!t) return; const v = S.view, ta = t.ta;
  ta.style.left = v.x + t.x * v.scale + 'px'; ta.style.top = v.y + t.y * v.scale + 'px';
  ta.style.fontSize = t.fs * v.scale + 'px'; ta.style.color = t.color;
  const m = measureText(ta.value || 'M', t.fs);
  ta.style.width = (m.w + t.fs) * v.scale + 'px'; ta.style.height = (m.h + t.fs * 0.3) * v.scale + 'px';
}
function finishText() {
  const t = S.editingText; if (!t) return; S.editingText = null; S.hiddenId = null;
  const text = t.ta.value.replace(/\s+$/, ''); t.ta.remove();
  const page = curPage(), before = page.items;
  let items = t.existing ? before.filter(i => i.id !== t.existing.id) : before.slice();
  if (text.trim()) { const m = measureText(text, t.fs); const it = { id: t.existing?.id || uid(), t: 'text', x: t.x, y: t.y, text, color: t.color, fs: t.fs, w: m.w, h: m.h };
    if (t.existing) { const idx = before.findIndex(i => i.id === t.existing.id); items.splice(idx, 0, it); } else items.push(it); }
  if (text !== (t.existing?.text ?? '')) { page.items = items; commit(page, before); }
  invalidate('ink');
}

/* ================= pages ================= */
function blankPage(bg = S.defaultBg, w = 1600, h = 900) { return { id: uid(), kind: 'blank', w, h, bg: { ...bg }, items: [] }; }
function newNotebook(name, pages) { return { id: uid(), name, created: Date.now(), updated: Date.now(), sources: {}, pages: pages || [blankPage()], lastPage: 0 }; }
function gotoPage(i) {
  if (S.editingText) finishText();
  i = clamp(i, 0, S.nb.pages.length - 1);
  S.sel.clear(); $('#selBar').hidden = true; S.laser = [];
  S.pageIdx = i; S.nb.lastPage = i; fitPage(); updatePageUI();
  const cur = document.querySelector('.thumb.cur'); cur?.classList.remove('cur');
  const th = document.querySelector(`.thumb[data-i="${i}"]`); if (th) { th.classList.add('cur'); th.scrollIntoView({ block: 'nearest' }); }
  // prefetch neighbours
  for (const j of [i + 1, i - 1]) { const p = S.nb.pages[j]; if (p?.kind === 'pdf') setTimeout(() => ensurePdf(p, S.view.scale * DPR()), 250); }
  saveSoon();
}
function updatePageUI() { $('#pageInput').value = S.pageIdx + 1; $('#pageCount').textContent = '/ ' + S.nb.pages.length; }
function addBlankPage(after = S.pageIdx) {
  const before = S.nb.pages.slice(), cp = curPage();
  const bg = cp && cp.kind === 'blank' ? cp.bg : S.defaultBg;
  const np = blankPage(bg, cp && cp.kind === 'blank' ? cp.w : 1600, 900);
  S.nb.pages.splice(after + 1, 0, np); commitPages(before); buildThumbs(); gotoPage(after + 1);
}
function deletePage() {
  if (S.nb.pages.length === 1) { const p = curPage(), b = p.items; p.items = []; commit(p, b); invalidate('ink'); return toast('Cleared the only page'); }
  const before = S.nb.pages.slice(); S.nb.pages.splice(S.pageIdx, 1); commitPages(before); buildThumbs(); gotoPage(Math.min(S.pageIdx, S.nb.pages.length - 1)); toast('Page deleted — Cmd+Z to undo');
}
function duplicatePage() {
  const before = S.nb.pages.slice(), p = curPage();
  const np = { ...p, id: uid(), items: p.items.map(it => ({ ...it, id: uid() })), bg: p.bg ? { ...p.bg } : p.bg };
  S.nb.pages.splice(S.pageIdx + 1, 0, np); commitPages(before); buildThumbs(); gotoPage(S.pageIdx + 1);
}
function movePage(dir) {
  const i = S.pageIdx, j = i + dir; if (j < 0 || j >= S.nb.pages.length) return;
  const before = S.nb.pages.slice(); const a = S.nb.pages; [a[i], a[j]] = [a[j], a[i]]; commitPages(before); buildThumbs(); gotoPage(j);
}
function clearPage() { const p = curPage(), b = p.items; if (!b.length) return; p.items = []; commit(p, b); S.sel.clear(); updateSelBar(); invalidate('ink'); toast('Page cleared — Cmd+Z to undo'); }
function extendPage() {
  const p = curPage(); if (p.kind === 'pdf') return toast('PDF pages have a fixed size — insert a blank page instead');
  p.h += 900; markSave(); thumbDirty(p); invalidate('bg', 'ink'); toast('Page extended'); viewChanged();
}

/* ================= thumbnails ================= */
const thumbsEl = $('#thumbs');
const io = new IntersectionObserver(entries => { for (const en of entries) if (en.isIntersecting) queueThumb(+en.target.dataset.i); }, { root: $('#sidebar'), rootMargin: '300px' });
function buildThumbs() {
  io.disconnect(); thumbsEl.innerHTML = '';
  const frag = document.createDocumentFragment();
  S.nb.pages.forEach((p, i) => {
    const d = document.createElement('div'); d.className = 'thumb' + (i === S.pageIdx ? ' cur' : '') + (p.items.length ? ' inked' : ''); d.dataset.i = i;
    d.innerHTML = `<canvas style="aspect-ratio:${p.w}/${p.h}"></canvas><span class="num">${i + 1}</span><span class="dot"></span>`;
    frag.appendChild(d);
  });
  thumbsEl.appendChild(frag);
  thumbsEl.querySelectorAll('.thumb').forEach(d => io.observe(d));
}
thumbsEl.addEventListener('click', e => { const t = e.target.closest('.thumb'); if (t) gotoPage(+t.dataset.i); });
thumbsEl.addEventListener('contextmenu', e => { const t = e.target.closest('.thumb'); if (!t) return; e.preventDefault(); gotoPage(+t.dataset.i); openPageMenu(t); });
const thumbQ = []; let thumbBusy = false;
function queueThumb(i) { if (!thumbQ.includes(i)) thumbQ.push(i); pumpThumbs(); }
async function pumpThumbs() {
  if (thumbBusy) return; thumbBusy = true;
  while (thumbQ.length) { const i = thumbQ.shift(); try { await renderThumb(i); } catch (e) { console.warn(e); } }
  thumbBusy = false;
}
const thumbPdf = new Map();
async function renderThumb(i) {
  const el = thumbsEl.querySelector(`.thumb[data-i="${i}"]`), p = S.nb.pages[i]; if (!el || !p) return;
  const cv = el.querySelector('canvas'), W = 168 * DPR(), s = W / p.w;
  cv.width = W; cv.height = Math.round(p.h * s); cv.style.aspectRatio = `${p.w}/${p.h}`;
  const ctx = cv.getContext('2d'); ctx.setTransform(s, 0, 0, s, 0, 0);
  if (p.kind === 'pdf') {
    let t = thumbPdf.get(pdfKey(p));
    if (!t) { t = await renderPdfToCanvas(p, Math.min(s * 1.5, 1)); thumbPdf.set(pdfKey(p), t); if (thumbPdf.size > 400) thumbPdf.delete(thumbPdf.keys().next().value); }
    ctx.drawImage(t, 0, 0, p.w, p.h);
  } else drawBoardBg(ctx, p, 1 / s);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, p.w, p.h); ctx.clip();
  for (const it of p.items) if (it.t === 'img') drawItem(ctx, it);
  for (const it of p.items) if (it.t !== 'img') { if (it.hl) ctx.globalCompositeOperation = isDarkPage(p) ? 'screen' : 'multiply'; drawItem(ctx, it); ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
  cv.dataset.drawn = 1; el.classList.toggle('inked', p.items.length > 0);
}
const thumbTimers = new Map();
function thumbDirty(p) {
  clearTimeout(thumbTimers.get(p.id));
  thumbTimers.set(p.id, setTimeout(() => { const i = S.nb.pages.indexOf(p); if (i >= 0) queueThumb(i); }, 600));
}
const thumbDirtyAll = debounce(() => { thumbsEl.querySelectorAll('.thumb').forEach(d => { const r = d.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) queueThumb(+d.dataset.i); }); }, 300);

/* ================= dock (toolbar) ================= */
const dock = $('#dock');
function nibSVG(p) {
  const c = p.color, hl = p.kind === 'highlighter', edge = lum(c) > 0.85 ? '#888' : 'rgba(0,0,0,.25)';
  if (hl) return `<svg viewBox="0 0 22 44"><rect x="4" y="14" width="14" height="30" rx="2" fill="#3a3f48"/><rect x="4" y="14" width="14" height="5" fill="${c}"/><path d="M6 14 L8 4 L16 7 L16 14Z" fill="${c}" stroke="${edge}" stroke-width=".6"/></svg>`;
  const tip = { ballpoint: 'M8 13 L11 2 L14 13Z', fountain: 'M7 13 Q11 0 15 13Z', brush: 'M8 13 Q11 -2 14 13Z', marker: 'M7 13 L9 4 L13 4 L15 13Z' }[p.style] || 'M8 13 L11 2 L14 13Z';
  return `<svg viewBox="0 0 22 44"><path d="M5 13 h12 v31 h-12z" fill="#e8eaee"/><path d="M5 13 h12 v5 h-12z" fill="${c}" stroke="${edge}" stroke-width=".6"/><path d="${tip}" fill="${c}" stroke="${edge}" stroke-width=".6"/><rect x="5" y="30" width="12" height="2" fill="#c5c9d1"/></svg>`;
}
function currentColor() { if (S.sel.size) return null; if (S.tool === 'shape') return S.shape.color; if (S.tool === 'text') return S.text.color; return activePreset().color; }
function sizeChoices() {
  if (S.tool === 'shape') return { vals: [2, 4, 8], cur: S.shape.size };
  if (S.tool === 'text') return { vals: [24, 36, 56], cur: S.text.fs };
  if (S.tool === 'eraser') return { vals: [12, 28, 60], cur: S.eraser.size };
  const p = activePreset(); return { vals: p.kind === 'highlighter' ? [14, 24, 40] : [2, 4, 8], cur: p.size };
}
function renderDock() {
  const t = S.tool, cc = currentColor(), sz = sizeChoices();
  const b = (id, ic, title, extra = '') => `<button class="tool${t === id ? ' on' : ''}" data-tool="${id}" title="${title}">${icon(ic)}${extra}</button>`;
  dock.innerHTML =
    b('select', 'lasso', 'Select / lasso (V)') + b('hand', 'hand', 'Pan (hold Space)') +
    '<div class="sep"></div>' +
    S.presets.map((p, i) => `<button class="nib${t === 'ink' && p.id === S.activePreset ? ' on' : ''}" data-preset="${p.id}" title="${esc((STYLES[p.style]?.label || '') + ' · ' + p.size + 'px' + (i < 9 ? ' (' + (i + 1) + ')' : ''))} — click again to edit">${nibSVG(p)}</button>`).join('') +
    `<button class="addpen" data-act="addpen" title="Save a new pen">${icon('plus')}</button>` +
    '<div class="sep"></div>' +
    b('eraser', 'eraser', 'Eraser (E) — click again for options', '<span class="caret"></span>') +
    b('shape', 's_' + S.shape.kind, 'Shapes & arrows (A/R/O/I) — click again for options', '<span class="caret"></span>') +
    b('text', 'text', 'Text (T)') + b('laser', 'laser', 'Laser pointer (L)') +
    '<div class="sep"></div>' +
    QUICK.map(c => `<button class="sw${cc && cc.toLowerCase() === c ? ' on' : ''}" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('') +
    `<button class="sw more" data-act="colors" title="More colours"></button>` +
    '<div class="sep"></div>' +
    `<div class="sizes">${sz.vals.map((v, i) => `<button class="size${Math.abs(sz.cur - v) < 0.01 ? ' on' : ''}" data-size="${v}" title="Size ${v}"><i style="width:${4 + i * 5}px;height:${4 + i * 5}px"></i></button>`).join('')}</div>` +
    '<div class="sep"></div>' +
    `<button class="tool" data-act="undo" title="Undo (Cmd+Z)">${icon('undo')}</button><button class="tool" data-act="redo" title="Redo (Cmd+Shift+Z)">${icon('redo')}</button>`;
  stage.className = 't-' + t;
}
dock.addEventListener('click', e => {
  const el = e.target.closest('button'); if (!el) return;
  if (el.dataset.tool) {
    const tl = el.dataset.tool;
    if (S.tool === tl && ['eraser', 'shape', 'text'].includes(tl)) return openToolPopover(tl, el);
    setTool(tl);
  } else if (el.dataset.preset) {
    if (S.tool === 'ink' && S.activePreset === el.dataset.preset) return openPenPopover(el);
    selectPreset(el.dataset.preset);
  } else if (el.dataset.color) applyColor(el.dataset.color);
  else if (el.dataset.size) applySize(+el.dataset.size);
  else if (el.dataset.act === 'colors') openColorPopover(el);
  else if (el.dataset.act === 'addpen') { const p = { ...activePreset(), id: uid() }; S.presets.push(p); S.activePreset = p.id; S.tool = 'ink'; savePrefs(); renderDock(); openPenPopover(dock.querySelector(`[data-preset="${p.id}"]`)); toast('New pen added'); }
  else if (el.dataset.act === 'undo') undo(); else if (el.dataset.act === 'redo') redo();
});
dock.addEventListener('dblclick', e => { const el = e.target.closest('[data-preset]'); if (el) openPenPopover(el); });
dock.addEventListener('contextmenu', e => { const el = e.target.closest('[data-preset]'); if (el) { e.preventDefault(); selectPreset(el.dataset.preset); openPenPopover(el); } });
function setTool(t) {
  if (S.editingText) finishText();
  S.tool = t;
  if (t !== 'select' && S.sel.size) { S.sel.clear(); updateSelBar(); }
  renderDock(); invalidate('live');
}
function selectPreset(id) { S.activePreset = id; S.tool = 'ink'; const p = activePreset(); if (p.kind === 'highlighter') S.lastHl = id; else S.lastPen = id; savePrefs(); setTool('ink'); }
function pushRecent(c) { c = c.toLowerCase(); if (PALETTE.includes(c) || QUICK.includes(c)) return; S.recent = [c, ...S.recent.filter(x => x !== c)].slice(0, 10); }
function applyColor(c) {
  if (S.sel.size) { recolorSel(c); return; }
  if (S.tool === 'shape') S.shape.color = c;
  else if (S.tool === 'text') S.text.color = c;
  else { if (S.tool !== 'ink') S.tool = 'ink'; activePreset().color = c; }
  pushRecent(c); savePrefs(); renderDock();
}
function applySize(v) {
  if (S.tool === 'shape') S.shape.size = v; else if (S.tool === 'text') S.text.fs = v; else if (S.tool === 'eraser') S.eraser.size = v;
  else { activePreset().size = v; }
  savePrefs(); renderDock(); invalidate('live');
}

/* ================= popovers ================= */
const pop = $('#popover');
let popAnchor = null;
function openPopover(anchor, html, mount, place = 'auto') {
  pop.innerHTML = html; pop.hidden = false; popAnchor = anchor;
  const r = anchor.getBoundingClientRect(), pr = pop.getBoundingClientRect();
  let left = clamp(r.left + r.width / 2 - pr.width / 2, 8, innerWidth - pr.width - 8);
  let top = (place === 'below' || r.top < innerHeight / 2) ? r.bottom + 8 : r.top - pr.height - 10;
  pop.style.left = left + 'px'; pop.style.top = clamp(top, 8, innerHeight - pr.height - 8) + 'px';
  mount && mount(pop);
}
function closePopover() { if (!pop.hidden) { pop.hidden = true; pop.innerHTML = ''; popAnchor = null; } }
document.addEventListener('pointerdown', e => { if (!pop.hidden && !pop.contains(e.target) && !(popAnchor && popAnchor.contains(e.target))) closePopover(); }, true);
const paletteHTML = cur => `<div class="palette">${PALETTE.map(c => `<button class="sw${cur && cur.toLowerCase() === c ? ' on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}</div>` +
  (S.recent.length ? `<div class="note" style="margin-top:10px">Recent</div><div class="palette">${S.recent.map(c => `<button class="sw" data-c="${c}" style="background:${c}"></button>`).join('')}</div>` : '') +
  `<div class="row" style="margin-top:12px"><label>Custom</label><input type="color" data-custom value="${cur || '#000000'}" style="width:48px;height:28px;border:0;background:none;padding:0"></div>`;
function openColorPopover(anchor) {
  openPopover(anchor, `<h4>Colour</h4>${paletteHTML(currentColor())}`, el => {
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { applyColor(b.dataset.c); closePopover(); });
    el.querySelector('[data-custom]').oninput = e => applyColor(e.target.value);
  });
}
function openPenPopover(anchor) {
  const p = activePreset(), isHl = p.kind === 'highlighter';
  const styles = isHl ? '' : `<div class="row"><div class="seg">${['ballpoint', 'fountain', 'brush', 'marker'].map(s => `<button data-style="${s}" class="${p.style === s ? 'on' : ''}">${STYLES[s].label}</button>`).join('')}</div></div>`;
  openPopover(anchor, `
    <h4>${isHl ? 'Highlighter' : 'Pen'} settings</h4>
    <canvas class="preview" width="600" height="128"></canvas>
    ${styles}
    <div class="row"><label>Size</label><input type="range" data-k="size" min="${isHl ? 6 : 0.5}" max="${isHl ? 90 : 40}" step="0.5" value="${p.size}"><span class="val" data-v="size">${p.size}</span></div>
    <div class="row"><label>Opacity</label><input type="range" data-k="opacity" min="0.1" max="1" step="0.05" value="${p.opacity}"><span class="val" data-v="opacity">${Math.round(p.opacity * 100)}%</span></div>
    ${isHl ? '' : `<div class="row"><label>Pressure</label><label class="toggle"><input type="checkbox" data-k="pressure" ${p.pressure ? 'checked' : ''}> Use pen pressure</label></div>`}
    <div class="row"><label>Type</label><div class="seg"><button data-kind="pen" class="${!isHl ? 'on' : ''}">Pen</button><button data-kind="highlighter" class="${isHl ? 'on' : ''}">Highlighter</button></div></div>
    ${paletteHTML(p.color)}
    <div class="btnrow"><button class="pbtn" data-a="dup">${icon('copy')}Duplicate</button><button class="pbtn danger" data-a="del">${icon('trash')}Delete</button></div>`, el => {
    const cv = el.querySelector('.preview');
    const prev = () => {
      const ctx = cv.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const bgc = isDarkPage(curPage()) ? pageBg(curPage()).color : '#ffffff';
      ctx.fillStyle = bgc; ctx.fillRect(0, 0, 600, 128);
      if (p.kind === 'highlighter') { ctx.fillStyle = lum(bgc) < .45 ? '#ccc' : '#333'; ctx.font = '600 30px ' + FONT; ctx.fillText('Highlight this text', 140, 76); }
      const pts = []; for (let i = 0; i <= 80; i++) { const t = i / 80; pts.push([40 + t * 520, 64 + Math.sin(t * Math.PI * 2) * (isHl ? 6 : 30), p.pressure ? 0.25 + 0.7 * Math.sin(t * Math.PI) : 0.5]); }
      ctx.save(); ctx.scale(1.2, 1.2); ctx.translate(-50, -12);
      if (isHl) ctx.globalCompositeOperation = lum(bgc) < .45 ? 'screen' : 'multiply';
      drawOps(ctx, computeOps({ t: 'ink', pts, size: p.size * 1.6, color: p.color, opacity: p.opacity, style: p.style }));
      ctx.restore();
    };
    prev();
    const upd = () => { savePrefs(); renderDock(); prev(); const a = dock.querySelector(`[data-preset="${p.id}"]`); if (a) popAnchor = a; };
    el.querySelectorAll('input[type=range]').forEach(r => r.oninput = () => { p[r.dataset.k] = +r.value; el.querySelector(`[data-v="${r.dataset.k}"]`).textContent = r.dataset.k === 'opacity' ? Math.round(r.value * 100) + '%' : r.value; upd(); });
    el.querySelector('[data-k=pressure]')?.addEventListener('change', e => { p.pressure = e.target.checked; upd(); });
    el.querySelectorAll('[data-style]').forEach(b => b.onclick = () => { p.style = b.dataset.style; el.querySelectorAll('[data-style]').forEach(x => x.classList.toggle('on', x === b)); upd(); });
    el.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => {
      if (b.dataset.kind === p.kind) return;
      if (b.dataset.kind === 'highlighter') Object.assign(p, { kind: 'highlighter', style: 'highlighter', size: 24, opacity: 0.6, pressure: false });
      else Object.assign(p, { kind: 'pen', style: 'ballpoint', size: 3, opacity: 1, pressure: true });
      upd(); openPenPopover(popAnchor);
    });
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { p.color = b.dataset.c; el.querySelectorAll('.palette .sw').forEach(x => x.classList.toggle('on', x === b)); upd(); });
    el.querySelector('[data-custom]').oninput = e => { p.color = e.target.value; pushRecent(p.color); upd(); };
    el.querySelector('[data-a=dup]').onclick = () => { const n = { ...p, id: uid() }; S.presets.splice(S.presets.indexOf(p) + 1, 0, n); S.activePreset = n.id; savePrefs(); renderDock(); closePopover(); toast('Pen duplicated'); };
    el.querySelector('[data-a=del]').onclick = () => {
      if (S.presets.length <= 1) return toast('Keep at least one pen');
      const i = S.presets.indexOf(p); S.presets.splice(i, 1); S.activePreset = S.presets[Math.max(0, i - 1)].id; savePrefs(); renderDock(); closePopover();
    };
  });
}
function openToolPopover(tool, anchor) {
  if (tool === 'shape') {
    openPopover(anchor, `<h4>Shapes & arrows</h4>
      <div class="shapegrid">${SHAPES.map(k => `<button data-k="${k}" class="${S.shape.kind === k ? 'on' : ''}" title="${SHAPE_NAMES[k]}">${icon('s_' + k)}</button>`).join('')}</div>
      <div class="row" style="margin-top:12px"><label>Width</label><input type="range" min="1" max="24" step="0.5" value="${S.shape.size}" data-r><span class="val">${S.shape.size}</span></div>
      <div class="row"><label class="toggle"><input type="checkbox" data-dash ${S.shape.dash ? 'checked' : ''}> Dashed</label><label class="toggle" style="margin-left:18px"><input type="checkbox" data-fill ${S.shape.fill ? 'checked' : ''}> Filled</label></div>
      ${paletteHTML(S.shape.color)}
      <div class="note">Tip: hold Shift for perfect squares/circles & 15° angles. While using any pen, hold still at the end of a stroke to snap it into a straight line, rectangle, ellipse or triangle.</div>`, el => {
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { S.shape.kind = b.dataset.k; el.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x === b)); savePrefs(); renderDock(); popAnchor = dock.querySelector('[data-tool=shape]'); });
      el.querySelector('[data-r]').oninput = e => { S.shape.size = +e.target.value; e.target.nextElementSibling.textContent = e.target.value; savePrefs(); renderDock(); popAnchor = dock.querySelector('[data-tool=shape]'); };
      el.querySelector('[data-dash]').onchange = e => { S.shape.dash = e.target.checked; savePrefs(); };
      el.querySelector('[data-fill]').onchange = e => { S.shape.fill = e.target.checked; savePrefs(); };
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { S.shape.color = b.dataset.c; el.querySelectorAll('.palette .sw').forEach(x => x.classList.toggle('on', x === b)); savePrefs(); renderDock(); popAnchor = dock.querySelector('[data-tool=shape]'); });
      el.querySelector('[data-custom]').oninput = e => { S.shape.color = e.target.value; savePrefs(); renderDock(); popAnchor = dock.querySelector('[data-tool=shape]'); };
    });
  } else if (tool === 'eraser') {
    openPopover(anchor, `<h4>Eraser</h4>
      <div class="row"><div class="seg"><button data-m="stroke" class="${S.eraser.mode === 'stroke' ? 'on' : ''}">Whole stroke</button><button data-m="partial" class="${S.eraser.mode === 'partial' ? 'on' : ''}">Precise</button></div></div>
      <div class="row"><label>Size</label><input type="range" min="6" max="120" value="${S.eraser.size}" data-r><span class="val">${S.eraser.size}</span></div>
      <div class="note">Tip: the side button on your pen erases too.</div>
      <div class="btnrow"><button class="pbtn danger" data-clear>${icon('trash')}Clear this page</button></div>`, el => {
      el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { S.eraser.mode = b.dataset.m; el.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); savePrefs(); });
      el.querySelector('[data-r]').oninput = e => { S.eraser.size = +e.target.value; e.target.nextElementSibling.textContent = e.target.value; savePrefs(); renderDock(); popAnchor = dock.querySelector('[data-tool=eraser]'); };
      el.querySelector('[data-clear]').onclick = () => { clearPage(); closePopover(); };
    });
  } else if (tool === 'text') {
    openPopover(anchor, `<h4>Text</h4>
      <div class="row"><label>Size</label><input type="range" min="10" max="160" value="${S.text.fs}" data-r><span class="val">${S.text.fs}</span></div>
      ${paletteHTML(S.text.color)}`, el => {
      el.querySelector('[data-r]').oninput = e => { S.text.fs = +e.target.value; e.target.nextElementSibling.textContent = e.target.value; savePrefs(); renderDock(); popAnchor = dock.querySelector('[data-tool=text]'); };
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { S.text.color = b.dataset.c; el.querySelectorAll('.palette .sw').forEach(x => x.classList.toggle('on', x === b)); savePrefs(); renderDock(); popAnchor = dock.querySelector('[data-tool=text]'); });
      el.querySelector('[data-custom]').oninput = e => { S.text.color = e.target.value; savePrefs(); };
    });
  }
}
function menu(anchor, items, place) {
  openPopover(anchor, `<div class="menu">${items.map((it, i) => it === '-' ? '<hr>' : `<button data-i="${i}" class="${it.danger ? 'danger' : ''}">${it.icon ? icon(it.icon) : ''}${esc(it.label)}${it.k ? `<span class="k">${it.k}</span>` : ''}</button>`).join('')}</div>`,
    el => el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { closePopover(); items[+b.dataset.i].run(); }), place);
}
function openPageMenu(anchor) {
  menu(anchor, [
    { label: 'New blank page after', icon: 'plus', k: 'B', run: () => addBlankPage() },
    { label: 'Duplicate page', icon: 'copy', run: duplicatePage },
    { label: 'Extend page downward', icon: 'extend', run: extendPage },
    { label: 'Move page up', icon: 'left', run: () => movePage(-1) },
    { label: 'Move page down', icon: 'right', run: () => movePage(1) },
    '-',
    { label: 'Clear annotations', icon: 'eraser', run: clearPage },
    { label: 'Delete page', icon: 'trash', danger: true, run: deletePage },
  ], 'below');
}
$('#pageMenu').onclick = e => openPageMenu(e.currentTarget);
$('#btnInsert').onclick = e => menu(e.currentTarget, [
  { label: 'Blank page after this one', icon: 'page', k: 'B', run: () => addBlankPage() },
  { label: 'Image…', icon: 'image', k: 'Cmd V pastes', run: () => pickFile('#fileImg', f => insertImage(f)) },
  { label: 'PDF pages after this one…', icon: 'file', run: () => pickFile('#filePdf', f => importPdf(f, true)) },
  '-',
  { label: 'Open PDF as new notebook…', icon: 'file', run: () => pickFile('#filePdf', f => importPdf(f, false)) },
], 'below');
$('#btnExport').onclick = e => menu(e.currentTarget, [
  { label: 'Annotated PDF (all pages)', icon: 'file', run: () => exportPdf(false) },
  { label: 'Annotated PDF (only annotated pages)', icon: 'file', run: () => exportPdf(true) },
  { label: 'This page as PNG', icon: 'image', run: exportPng },
  '-',
  { label: 'Backup notebook (.inkboard)', icon: 'save', run: exportBackup },
  { label: 'Restore from backup…', icon: 'upload', run: () => pickFile('#fileBackup', importBackup) },
], 'below');
$('#btnBg').onclick = e => openBgPopover(e.currentTarget);
function openBgPopover(anchor) {
  const p = curPage(), bg = { ...pageBg(p) };
  const pdfNote = p.kind === 'pdf' ? '<div class="note">This is a PDF page, so its own design is the background. These settings apply to blank pages.</div>' : '';
  openPopover(anchor, `<h4>Page background</h4>${pdfNote}
    <div class="bgsw">${BG_COLORS.map(([c, n]) => `<button data-c="${c}" title="${n}" style="background:${c}" class="${bg.color === c ? 'on' : ''}"></button>`).join('')}</div>
    <div class="row"><label>Custom</label><input type="color" data-custom value="${bg.color}" style="width:48px;height:28px;border:0;background:none;padding:0"></div>
    <div class="pat">${['none', 'grid', 'lines', 'dots'].map(k => `<button data-p="${k}" class="${(bg.pattern || 'none') === k ? 'on' : ''}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
    <div class="btnrow"><button class="pbtn" data-img>${icon('image')}${bg.image ? 'Change image' : 'Background image…'}</button>${bg.image ? `<button class="pbtn" data-noimg>Remove image</button>` : ''}</div>
    <div class="row" style="margin-top:12px"><label class="toggle"><input type="checkbox" data-all> Apply to all blank pages</label></div>
    <div class="btnrow"><button class="pbtn" data-default>Use as default for new pages</button></div>`, el => {
    const apply = () => {
      const all = el.querySelector('[data-all]').checked;
      const targets = all ? S.nb.pages.filter(x => x.kind === 'blank') : (p.kind === 'blank' ? [p] : []);
      if (!targets.length) { S.defaultBg = { ...bg }; savePrefs(); toast('Saved as default for new blank pages'); return; }
      targets.forEach(t => { t.bg = { ...bg }; thumbDirty(t); }); markSave(); invalidate('bg', 'ink');
    };
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { bg.color = b.dataset.c; el.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); apply(); });
    el.querySelector('[data-custom]').oninput = e => { bg.color = e.target.value; apply(); };
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { bg.pattern = b.dataset.p; el.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('on', x === b)); apply(); });
    el.querySelector('[data-img]').onclick = () => pickFile('#fileImg', async f => { const key = uid(); await DB.put('blobs', f, key); bg.image = key; apply(); closePopover(); toast('Background image set'); });
    el.querySelector('[data-noimg]')?.addEventListener('click', () => { bg.image = null; apply(); closePopover(); });
    el.querySelector('[data-all]').onchange = () => apply();
    el.querySelector('[data-default]').onclick = () => { S.defaultBg = { ...bg }; savePrefs(); toast('Default background saved'); };
  }, 'below');
}
function pickFile(sel, cb) { const inp = $(sel); inp.value = ''; inp.onchange = () => { const f = inp.files[0]; if (f) cb(f); }; inp.click(); }

/* ================= import ================= */
async function importPdf(file, intoCurrent) {
  toast('Opening ' + file.name + '…', 8000);
  try {
    const buf = await file.arrayBuffer();
    const key = uid(); await DB.put('blobs', new Blob([buf], { type: 'application/pdf' }), key);
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf.slice(0)), ...PDF_OPTS }).promise;
    const pg1 = await doc.getPage(1), vp = pg1.getViewport({ scale: 1 });
    const src = uid();
    const pages = Array.from({ length: doc.numPages }, (_, i) => ({ id: uid(), kind: 'pdf', src, idx: i, w: vp.width, h: vp.height, items: [] }));
    const name = file.name.replace(/\.pdf$/i, '');
    if (intoCurrent) {
      const before = S.nb.pages.slice();
      S.nb.sources[src] = { name, blob: key }; pdfDocs.set(src, Promise.resolve(doc));
      S.nb.pages.splice(S.pageIdx + 1, 0, ...pages); commitPages(before); buildThumbs(); gotoPage(S.pageIdx + 1);
    } else {
      const nb = newNotebook(name, pages); nb.sources[src] = { name, blob: key };
      await openNotebook(nb); pdfDocs.set(src, Promise.resolve(doc));
    }
    await saveNow();
    toast(`Loaded ${doc.numPages} page${doc.numPages > 1 ? 's' : ''}`);
    measurePages(src, doc);
  } catch (e) { console.error(e); toast('Could not open PDF: ' + e.message, 5000); }
}
async function measurePages(src, doc) {
  // correct sizes for PDFs with mixed page sizes, in the background
  let changed = false;
  for (const p of S.nb.pages) {
    if (p.src !== src) continue;
    const pg = await doc.getPage(p.idx + 1), vp = pg.getViewport({ scale: 1 });
    if (Math.abs(vp.width - p.w) > 0.5 || Math.abs(vp.height - p.h) > 0.5) { p.w = vp.width; p.h = vp.height; changed = true; }
    pg.cleanup();
  }
  if (changed) { buildThumbs(); fitPage(); markSave(); }
}
async function insertImage(file, at) {
  const key = uid(); await DB.put('blobs', file, key);
  const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  imgCache.set(key, { img: im });
  const p = curPage(), s = Math.min(1, (p.w * 0.6) / im.width, (p.h * 0.6) / im.height), w = im.width * s, h = im.height * s;
  const cx = at ? at.x : p.w / 2, cy = at ? at.y : p.h / 2;
  const it = { id: uid(), t: 'img', key, x: cx - w / 2, y: cy - h / 2, w, h };
  const before = p.items; p.items = [...before, it]; commit(p, before);
  setTool('select'); S.sel = new Set([it.id]); updateSelBar(); invalidate('ink');
}
// drag & drop
let dragDepth = 0;
window.addEventListener('dragenter', e => { e.preventDefault(); dragDepth++; $('#dropHint').hidden = false; });
window.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('#dropHint').hidden = true; } });
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', async e => {
  e.preventDefault(); dragDepth = 0; $('#dropHint').hidden = true;
  const f = e.dataTransfer.files[0]; if (!f) return;
  if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) {
    const empty = S.nb.pages.length === 1 && !S.nb.pages[0].items.length && S.nb.pages[0].kind === 'blank';
    importPdf(f, empty ? false : confirm(`Add "${f.name}" after the current page?\n\nOK = add to this notebook · Cancel = open as a new notebook`));
  } else if (f.type.startsWith('image/')) { const P = evPt(e); insertImage(f, { x: P.x, y: P.y }); }
  else if (/\.inkboard$/i.test(f.name)) importBackup(f);
});
window.addEventListener('paste', e => {
  if (S.editingText || e.target.matches?.('input,textarea')) return;
  const f = [...(e.clipboardData?.files || [])].find(f => f.type.startsWith('image/'));
  if (f) { e.preventDefault(); insertImage(f); }
  else if (clip.length) { e.preventDefault(); pasteItems(); }
});
let clip = [];
function copySel() { clip = selItems().map(it => ({ ...it })); if (clip.length) toast(`Copied ${clip.length} item${clip.length > 1 ? 's' : ''}`); }
function pasteItems() {
  const p = curPage(), before = p.items, nsel = new Set();
  const copies = clip.map(it => { const c = transformItem(it, (x, y) => [x + 20, y + 20]); c.id = uid(); nsel.add(c.id); return c; });
  clip = copies.map(c => ({ ...c }));
  p.items = [...before, ...copies]; commit(p, before); setTool('select'); S.sel = nsel; updateSelBar(); invalidate('ink');
}

/* ================= export ================= */
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
const safeName = () => (S.nb.name || 'Inkboard').replace(/[\\/:*?"<>|]+/g, '-');
async function renderPageImage(p, scale) {
  const cv = document.createElement('canvas'); cv.width = Math.round(p.w * scale); cv.height = Math.round(p.h * scale);
  const ctx = cv.getContext('2d'); ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (p.kind === 'pdf') ctx.drawImage(await renderPdfToCanvas(p, scale), 0, 0, p.w, p.h); else drawBoardBg(ctx, p, 1 / scale);
  for (const it of p.items) if (it.t === 'img') drawItem(ctx, it);
  for (const it of p.items) if (it.t !== 'img') { if (it.hl) ctx.globalCompositeOperation = isDarkPage(p) ? 'screen' : 'multiply'; drawItem(ctx, it); ctx.globalCompositeOperation = 'source-over'; }
  return cv;
}
async function exportPng() {
  const p = curPage(), cv = await renderPageImage(p, Math.min(3, 4096 / Math.max(p.w, p.h)));
  cv.toBlob(b => download(b, `${safeName()} - page ${S.pageIdx + 1}.png`), 'image/png');
}
async function exportPdf(onlyAnnotated) {
  const pages = S.nb.pages.filter(p => !onlyAnnotated || p.items.length);
  if (!pages.length) return toast('No annotated pages yet');
  toast('Building PDF…', 60000);
  try {
    const L = await import('./vendor/pdf-lib.esm.min.js');
    const { PDFDocument, rgb, StandardFonts, BlendMode, LineCapStyle } = L;
    const out = await PDFDocument.create();
    const srcDocs = {};
    const font = await out.embedFont(StandardFonts.Helvetica);
    const col = h => { const [r, g, b] = hexToRgb(h); return rgb(r / 255, g / 255, b / 255); };
    const embedded = new Map();
    const embedImg = async key => {
      if (embedded.has(key)) return embedded.get(key);
      const blob = await DB.get('blobs', key); if (!blob) return null;
      let bytes = new Uint8Array(await blob.arrayBuffer()), img;
      if (blob.type === 'image/png') img = await out.embedPng(bytes);
      else if (/jpe?g/.test(blob.type)) img = await out.embedJpg(bytes);
      else { const im = getImage(key) || await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = URL.createObjectURL(blob); }); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); img = await out.embedPng(await (await new Promise(r => c.toBlob(r, 'image/png'))).arrayBuffer()); }
      embedded.set(key, img); return img;
    };
    let n = 0;
    for (const p of pages) {
      let pg, ox = 0, oy = p.h, s = 1;
      if (p.kind === 'pdf') {
        if (!srcDocs[p.src]) { const blob = await DB.get('blobs', S.nb.sources[p.src].blob); srcDocs[p.src] = await PDFDocument.load(await blob.arrayBuffer(), { ignoreEncryption: true }); }
        [pg] = await out.copyPages(srcDocs[p.src], [p.idx]); out.addPage(pg);
        const cb = pg.getCropBox(); s = cb.width / p.w; ox = cb.x; oy = cb.y + cb.height;
      } else {
        pg = out.addPage([p.w, p.h]); const bg = pageBg(p);
        pg.drawRectangle({ x: 0, y: 0, width: p.w, height: p.h, color: col(bg.color) });
        if (bg.image) { const im = await embedImg(bg.image); if (im) { const k = Math.max(p.w / im.width, p.h / im.height); pg.drawImage(im, { x: (p.w - im.width * k) / 2, y: (p.h - im.height * k) / 2, width: im.width * k, height: im.height * k }); } }
        if (bg.pattern && bg.pattern !== 'none') {
          const dark = lum(bg.color) < .45, lc = dark ? rgb(1, 1, 1) : rgb(.12, .31, .55), op = dark ? .1 : .16;
          if (bg.pattern === 'dots') { for (let y = 40; y < p.h; y += 40) for (let x = 40; x < p.w; x += 40) pg.drawCircle({ x, y: p.h - y, size: 1.6, color: lc, opacity: op }); }
          else {
            for (let y = 40; y < p.h; y += 40) pg.drawLine({ start: { x: 0, y: p.h - y }, end: { x: p.w, y: p.h - y }, thickness: .6, color: lc, opacity: op });
            if (bg.pattern === 'grid') for (let x = 40; x < p.w; x += 40) pg.drawLine({ start: { x, y: 0 }, end: { x, y: p.h }, thickness: .6, color: lc, opacity: op });
          }
        }
      }
      const order = [...p.items.filter(i => i.t === 'img'), ...p.items.filter(i => i.t !== 'img' && i.hl), ...p.items.filter(i => i.t !== 'img' && !i.hl)];
      for (const it of order) {
        if (it.t === 'img') { const im = await embedImg(it.key); if (im) pg.drawImage(im, { x: ox + it.x * s, y: oy - (it.y + it.h) * s, width: it.w * s, height: it.h * s }); continue; }
        if (it.t === 'text') {
          textLines(it).forEach((line, i) => { try { pg.drawText(line, { x: ox + it.x * s, y: oy - (it.y + i * it.fs * 1.25 + it.fs * 0.92) * s, size: it.fs * s, font, color: col(it.color) }); } catch (e) { console.warn('text', e); } });
          continue;
        }
        for (const op of itemOps(it)) {
          const o = { x: ox, y: oy, scale: s };
          if (it.hl) o.blendMode = isDarkPage(p) ? BlendMode.Screen : BlendMode.Multiply;
          if (op.fill) { o.color = col(op.fill); o.opacity = op.fillAlpha ?? 1; }
          if (op.stroke) { o.borderColor = col(op.stroke); o.borderWidth = op.width; o.borderOpacity = op.alpha ?? 1; o.borderLineCap = LineCapStyle.Round; if (op.dash) o.borderDashArray = op.dash; }
          pg.drawSvgPath(op.d, o);
        }
      }
      if (++n % 25 === 0) { toast(`Building PDF… ${n}/${pages.length}`, 60000); await new Promise(r => setTimeout(r)); }
    }
    const bytes = await out.save();
    download(new Blob([bytes], { type: 'application/pdf' }), `${safeName()} (annotated).pdf`);
    toast('PDF exported');
  } catch (e) { console.error(e); toast('Export failed: ' + e.message, 5000); }
}
const blobToDataURL = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
async function exportBackup() {
  toast('Packing backup…', 20000);
  const keys = new Set(Object.values(S.nb.sources).map(s => s.blob));
  for (const p of S.nb.pages) { if (p.bg?.image) keys.add(p.bg.image); for (const it of p.items) if (it.t === 'img') keys.add(it.key); }
  const blobs = {}; for (const k of keys) { const b = await DB.get('blobs', k); if (b) blobs[k] = await blobToDataURL(b); }
  download(new Blob([JSON.stringify({ format: 'inkboard', v: 1, notebook: S.nb, blobs })], { type: 'application/json' }), `${safeName()}.inkboard`);
  toast('Backup saved');
}
async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text()); if (data.format !== 'inkboard') throw new Error('Not an Inkboard backup');
    for (const [k, url] of Object.entries(data.blobs)) await DB.put('blobs', await (await fetch(url)).blob(), k);
    const nb = data.notebook; nb.id = uid(); nb.name += ' (restored)';
    await openNotebook(nb); await saveNow(); toast('Backup restored');
  } catch (e) { toast('Restore failed: ' + e.message, 4000); }
}

/* ================= library ================= */
async function openNotebook(nb) {
  if (S.nb && S.nb.id !== nb.id) { if (S.editingText) finishText(); await saveNow(); }
  S.nb = nb; S.undo = []; S.redo = []; S.sel.clear();
  nb.sources ||= {};
  pdfCache.clear(); thumbPdf.clear(); pdfDocs.clear();
  $('#nbName').value = nb.name; document.title = nb.name + ' — Inkboard';
  LS.set('last', nb.id);
  buildThumbs(); gotoPage(nb.lastPage || 0);
}
const modal = $('#modal'), card = modal.querySelector('.modal-card');
function closeModal() { modal.hidden = true; }
modal.addEventListener('pointerdown', e => { if (e.target === modal) closeModal(); });
async function openLibrary() {
  if (S.nb) await saveNow();
  const metas = (await DB.all('meta')).sort((a, b) => b.updated - a.updated);
  card.innerHTML = `<h2>Notebooks</h2><div class="sub">Everything is saved automatically on this computer.</div>
    <div class="lib-actions">
      <button class="pbtn primary" data-a="board">${icon('plus')}New whiteboard</button>
      <button class="pbtn" data-a="pdf">${icon('file')}Open PDF…</button>
      <button class="pbtn" data-a="restore">${icon('upload')}Restore backup…</button>
    </div>
    <div class="lib-grid">${metas.map(m => `<div class="card${m.id === S.nb?.id ? ' cur' : ''}" data-id="${m.id}">
      <div class="cov" style="${m.cover ? `background-image:url(${m.cover})` : ''}">${m.cover ? '' : icon('page')}</div>
      <div class="meta"><div class="t">${esc(m.name)}</div><div class="d">${m.pages} page${m.pages > 1 ? 's' : ''} · ${new Date(m.updated).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div></div>
      <button class="x" data-del="${m.id}" title="Delete notebook">${icon('trash')}</button></div>`).join('')}</div>`;
  modal.hidden = false;
  card.querySelector('[data-a=board]').onclick = async () => { closeModal(); await openNotebook(newNotebook('Untitled board')); saveNow(); };
  card.querySelector('[data-a=pdf]').onclick = () => { closeModal(); pickFile('#filePdf', f => importPdf(f, false)); };
  card.querySelector('[data-a=restore]').onclick = () => { closeModal(); pickFile('#fileBackup', importBackup); };
  card.querySelectorAll('.card').forEach(c => c.onclick = async e => {
    const del = e.target.closest('[data-del]');
    if (del) {
      e.stopPropagation();
      const m = metas.find(x => x.id === del.dataset.del);
      if (!confirm(`Delete "${m.name}" permanently? This cannot be undone.`)) return;
      await deleteNotebook(m.id); return openLibrary();
    }
    const nb = await DB.get('notebooks', c.dataset.id); closeModal(); if (nb) openNotebook(nb);
  });
}
async function deleteNotebook(id) {
  const nb = await DB.get('notebooks', id);
  if (nb) {
    const keys = new Set(Object.values(nb.sources || {}).map(s => s.blob));
    for (const p of nb.pages) { if (p.bg?.image) keys.add(p.bg.image); for (const it of p.items) if (it.t === 'img') keys.add(it.key); }
    for (const k of keys) await DB.del('blobs', k);
  }
  await DB.del('notebooks', id); await DB.del('meta', id);
  if (S.nb?.id === id) { S.nb = null; const metas = (await DB.all('meta')).sort((a, b) => b.updated - a.updated); const next = metas[0] && await DB.get('notebooks', metas[0].id); await openNotebook(next || newNotebook('Untitled board')); }
}
function openHelp() {
  const K = [['Pen presets', '1 – 9'], ['Last pen / highlighter', 'P / H'], ['Eraser', 'E'], ['Select / lasso', 'V'], ['Text', 'T'], ['Laser pointer', 'L'],
    ['Arrow / Rectangle', 'A / R'], ['Ellipse / Line', 'O / I'], ['Pan', 'Space + drag'], ['Zoom', 'Cmd +/− · pinch'], ['Fit page', 'Cmd 0'], ['Next / previous page', '→ ← · PgDn PgUp'],
    ['New blank page', 'B'], ['Undo / Redo', 'Cmd Z / Cmd ⇧ Z'], ['Copy / Paste / Duplicate', 'Cmd C / V / D'], ['Delete selection', 'Delete'],
    ['Select all', 'Cmd A'], ['Pen size − / +', '[ / ]'], ['Present (full screen)', 'F'], ['Notebooks', 'Cmd O'], ['Snap to shape', 'Hold pen still'], ['Straight / square', 'Shift']];
  card.innerHTML = `<h2>Shortcuts</h2><div class="sub">Pen side button = eraser. Click the active pen again to edit it, right-click a pen to edit any pen.</div><div class="keys">${K.map(([a, b]) => `<div><span>${a}</span><span>${b.split(' · ').map(x => `<kbd>${x}</kbd>`).join(' ')}</span></div>`).join('')}</div>`;
  card.insertAdjacentHTML('beforeend', `<h2 style="margin-top:26px">Pen tablet lines up wrong?</h2>
    <div class="sub">A Deco tablet maps its whole surface to the whole screen, so the board only matches when the board fills the screen.</div>
    <ol class="tablet-steps">
      <li>Press <b>F</b> for focus mode. The page fills the screen and the toolbar hides until you move to the bottom edge.</li>
      <li>XP-Pen driver → <b>Work Area</b>: choose your Mac's built-in display only, not "All displays".</li>
      <li>Turn on <b>Proportional</b> (or "Force proportions") so circles stay round.</li>
      <li>Rotation 0°, then quit and reopen the browser.</li>
    </ol>`);
  modal.hidden = false;
}

/* ================= dashboard ================= */
const home = $('#home');
const HS = { q: '', sort: 'recent', f: 'all', metas: [] };
function closeHome() { home.hidden = true; }
async function openHome() {
  if (S.editingText) finishText();
  closePopover(); closeModal();
  if (S.nb) await saveNow();
  HS.metas = await DB.all('meta');
  home.hidden = false; renderHome();
}
function renderHome(focusSearch) {
  const q = HS.q.trim().toLowerCase(), all = HS.metas;
  const list = all.filter(m => !q || m.name.toLowerCase().includes(q)).filter(m => HS.f === 'all' || (m.kind || 'board') === HS.f)
    .sort(HS.sort === 'name' ? (a, b) => a.name.localeCompare(b.name) : HS.sort === 'pages' ? (a, b) => b.pages - a.pages : (a, b) => b.updated - a.updated);
  const pages = all.reduce((s, m) => s + (m.pages || 0), 0);
  const seg = (attr, cur, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-${attr}="${v}" class="${cur === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  home.innerHTML = `<div class="home-wrap">
    <div class="home-top"><h1>Notebooks</h1>${S.nb ? `<button class="pbtn" data-a="back">${icon('left')}Back to ${esc(S.nb.name)}</button>` : ''}</div>
    <div class="home-sub">${all.length} notebook${all.length === 1 ? '' : 's'} · ${pages} pages · saved on this computer</div>
    <div class="lib-actions">
      <button class="pbtn primary" data-a="board">${icon('plus')}New whiteboard</button>
      <button class="pbtn" data-a="pdf">${icon('file')}Open PDF…</button>
      <button class="pbtn" data-a="restore">${icon('upload')}Restore backup…</button>
    </div>
    <div class="home-tools"><input id="hSearch" placeholder="Search notebooks" value="${esc(HS.q)}" spellcheck="false">
      ${seg('f', HS.f, [['all', 'All'], ['pdf', 'PDFs'], ['board', 'Boards']])}${seg('s', HS.sort, [['recent', 'Recent'], ['name', 'Name'], ['pages', 'Pages']])}</div>
    ${list.length ? `<div class="home-grid">${list.map(m => `<div class="card${m.id === S.nb?.id ? ' cur' : ''}" data-id="${esc(m.id)}" tabindex="0">
      <div class="cov" style="${m.cover ? `background-image:url(${m.cover})` : ''}">${m.cover ? '' : icon('page')}</div>
      <div class="meta"><div class="t">${esc(m.name)}</div><div class="d"><span class="badge ${m.kind === 'pdf' ? 'pdf' : ''}">${m.kind === 'pdf' ? 'PDF' : 'Board'}</span>${m.pages} page${m.pages === 1 ? '' : 's'} · ${new Date(m.updated).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div></div>
      <div class="acts"><button data-ren title="Rename">${icon('text')}</button><button data-del title="Delete">${icon('trash')}</button></div></div>`).join('')}</div>`
      : `<div class="empty">${all.length ? 'No notebooks match.' : 'No notebooks yet. Start a whiteboard or open a PDF.'}</div>`}
  </div>`;
  const sIn = home.querySelector('#hSearch');
  sIn.oninput = () => { HS.q = sIn.value; renderHome(true); };
  sIn.onkeydown = e => e.stopPropagation();
  if (focusSearch) { sIn.focus(); sIn.setSelectionRange(sIn.value.length, sIn.value.length); }
  home.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { HS.f = b.dataset.f; renderHome(); });
  home.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { HS.sort = b.dataset.s; renderHome(); });
  home.querySelector('[data-a=back]')?.addEventListener('click', closeHome);
  home.querySelector('[data-a=board]').onclick = async () => { closeHome(); await openNotebook(newNotebook('Untitled board')); saveNow(); };
  home.querySelector('[data-a=pdf]').onclick = () => pickFile('#filePdf', f => { closeHome(); importPdf(f, false); });
  home.querySelector('[data-a=restore]').onclick = () => pickFile('#fileBackup', f => { closeHome(); importBackup(f); });
  home.querySelectorAll('.card').forEach(c => {
    const id = c.dataset.id, m = HS.metas.find(x => x.id === id);
    const open = async () => { const nb = await DB.get('notebooks', id); closeHome(); if (nb && nb.id !== S.nb?.id) openNotebook(nb); };
    c.onclick = e => { if (e.target.closest('.acts,input')) return; open(); };
    c.onkeydown = e => { if (e.key === 'Enter' && e.target === c) open(); };
    c.querySelector('[data-del]').onclick = async e => {
      e.stopPropagation();
      if (!confirm(`Delete "${m.name}" permanently? This cannot be undone.`)) return;
      await deleteNotebook(id); HS.metas = await DB.all('meta'); renderHome();
    };
    c.querySelector('[data-ren]').onclick = e => {
      e.stopPropagation();
      const t = c.querySelector('.t'); t.innerHTML = '<input>'; const inp = t.firstChild; inp.value = m.name; inp.focus(); inp.select();
      const done = async ok => {
        const v = inp.value.trim(); if (!ok || !v || v === m.name) return renderHome();
        if (S.nb?.id === id) { S.nb.name = v; $('#nbName').value = v; document.title = v + ' — Inkboard'; await saveNow(); }
        else { const nb = await DB.get('notebooks', id); if (nb) { nb.name = v; await DB.put('notebooks', nb); } m.name = v; await DB.put('meta', m); }
        HS.metas = await DB.all('meta'); renderHome();
      };
      inp.onkeydown = ev => { ev.stopPropagation(); if (ev.key === 'Enter') done(true); if (ev.key === 'Escape') done(false); };
      inp.onblur = () => done(true);
    };
  });
}

/* ================= top bar wiring ================= */
$('#btnLibrary').onclick = openHome;
$('#btnHelp').onclick = openHelp;
$('#btnSidebar').onclick = () => { $('#sidebar').classList.toggle('hidden'); LS.set('sidebar', !$('#sidebar').classList.contains('hidden')); setTimeout(fitPage, 220); };
if (LS.get('sidebar', true) === false) $('#sidebar').classList.add('hidden');
$('#prevPage').onclick = () => gotoPage(S.pageIdx - 1);
$('#nextPage').onclick = () => gotoPage(S.pageIdx + 1);
$('#addPage').onclick = () => addBlankPage();
$('#pageInput').addEventListener('change', e => gotoPage((parseInt(e.target.value, 10) || 1) - 1));
$('#pageInput').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); });
$('#nbName').addEventListener('change', e => { S.nb.name = e.target.value.trim() || 'Untitled'; document.title = S.nb.name + ' — Inkboard'; markSave(); });
$('#nbName').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); });
$('#zoomIn').onclick = () => zoomAt(1.25, stage.clientWidth / 2, stage.clientHeight / 2);
$('#zoomOut').onclick = () => zoomAt(0.8, stage.clientWidth / 2, stage.clientHeight / 2);
$('#zoomPct').onclick = fitPage;
$('#btnPresent').onclick = togglePresent;
function togglePresent() {
  S.present = !S.present; document.body.classList.remove('peek'); document.body.classList.toggle('present', S.present);
  if (S.present && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  if (!S.present && document.fullscreenElement) document.exitFullscreen?.();
  setTimeout(fitPage, 120);
}
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && S.present) { S.present = false; document.body.classList.remove('present'); setTimeout(fitPage, 120); } });

/* ================= keyboard ================= */
window.addEventListener('keydown', e => {
  if (e.target.matches?.('input, textarea')) return;
  const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
  if (k === ' ' && !spaceDown) { spaceDown = true; stage.classList.add('t-hand'); e.preventDefault(); return; }
  if (mod) {
    if (k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (k === 'y') { e.preventDefault(); redo(); }
    else if (k === 'd') { e.preventDefault(); if (S.sel.size) duplicateSel(); }
    else if (k === 'c') { if (S.sel.size) { e.preventDefault(); copySel(); } }
    else if (k === 'x') { if (S.sel.size) { e.preventDefault(); copySel(); deleteSel(); } }
    else if (k === 'a') { e.preventDefault(); setTool('select'); S.sel = new Set(curPage().items.map(i => i.id)); updateSelBar(); }
    else if (k === '0') { e.preventDefault(); fitPage(); }
    else if (k === '=' || k === '+') { e.preventDefault(); zoomAt(1.25, stage.clientWidth / 2, stage.clientHeight / 2); }
    else if (k === '-') { e.preventDefault(); zoomAt(0.8, stage.clientWidth / 2, stage.clientHeight / 2); }
    else if (k === 's') { e.preventDefault(); saveNow().then(() => toast('Saved')); }
    else if (k === 'o') { e.preventDefault(); openHome(); }
    return;
  }
  if (!home.hidden) { if (k === 'escape' && S.nb) closeHome(); return; }
  if (!modal.hidden) { if (k === 'escape') closeModal(); return; }
  if (/^[1-9]$/.test(k)) { const p = S.presets[+k - 1]; if (p) selectPreset(p.id); return; }
  switch (k) {
    case 'arrowright': case 'pagedown': e.preventDefault(); gotoPage(S.pageIdx + 1); break;
    case 'arrowleft': case 'pageup': e.preventDefault(); gotoPage(S.pageIdx - 1); break;
    case 'home': gotoPage(0); break; case 'end': gotoPage(S.nb.pages.length - 1); break;
    case 'p': selectPreset(S.presets.find(p => p.id === S.lastPen && p.kind === 'pen')?.id || S.presets.find(p => p.kind === 'pen')?.id || S.presets[0].id); break;
    case 'h': { const h = S.presets.find(p => p.id === S.lastHl && p.kind === 'highlighter') || S.presets.find(p => p.kind === 'highlighter'); if (h) selectPreset(h.id); break; }
    case 'e': setTool('eraser'); break; case 'v': setTool('select'); break; case 't': setTool('text'); break; case 'l': setTool('laser'); break;
    case 'a': S.shape.kind = 'arrow'; savePrefs(); setTool('shape'); break;
    case 'r': S.shape.kind = 'rect'; savePrefs(); setTool('shape'); break;
    case 'o': S.shape.kind = 'ellipse'; savePrefs(); setTool('shape'); break;
    case 'i': S.shape.kind = 'line'; savePrefs(); setTool('shape'); break;
    case 'b': addBlankPage(); break;
    case 'f': togglePresent(); break;
    case '?': case '/': openHelp(); break;
    case '[': case ']': { const sc = sizeChoices(), f = k === ']' ? 1.25 : 0.8; applySize(r2(clamp(sc.cur * f, 0.5, 160))); toast('Size ' + sizeChoices().cur, 700); break; }
    case 'delete': case 'backspace': if (S.sel.size) { e.preventDefault(); deleteSel(); } break;
    case 'escape': if (!pop.hidden) closePopover(); else if (S.sel.size) { S.sel.clear(); updateSelBar(); } else if (S.present) togglePresent(); break;
  }
});
window.addEventListener('pointermove', e => {
  if (!S.present) return;
  const near = e.clientY > innerHeight - 96 || !!e.target.closest?.('#dock') || !pop.hidden;
  if (!drag || !near) document.body.classList.toggle('peek', near && !drag);
});
window.addEventListener('keyup', e => { if (e.key === ' ') { spaceDown = false; stage.className = 't-' + S.tool; } });
window.addEventListener('beforeunload', () => { if (S.editingText) finishText(); saveNow(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

/* ================= boot ================= */
(async function boot() {
  try { await DB.open(); } catch (e) { toast('Storage unavailable: ' + e.message, 6000); }
  renderDock();
  const lastId = LS.get('last', null);
  let nb = lastId && await DB.get('notebooks', lastId).catch(() => null);
  const first = !nb;
  if (!nb) nb = newNotebook('Untitled board');
  await openNotebook(nb);
  if (first && (await DB.all('meta').catch(() => [])).length > 1) openHome();
  resizeCanvases(); fitPage();
  if (navigator.storage?.persist) navigator.storage.persist();
})();
