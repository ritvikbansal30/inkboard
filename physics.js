// Inkboard shape library: physics symbols, axes and geometry, drawn as vector paths
// so every shape scales, recolours, rotates, flips and exports to PDF.
const r2 = n => Math.round(n * 100) / 100;
const PI = Math.PI;
const INK = '#111111';
const shade = hex => { const n = parseInt(hex.slice(1), 16), f = v => Math.round(v * 0.72); return '#' + [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); };

function builder(it) {
  const { x, y, w, h } = it, sw = it.size || 2.5, cx = w / 2, cy = h / 2, a = (it.rot || 0) * PI / 180, cs = Math.cos(a), sn = Math.sin(a), fl = it.flip ? -1 : 1;
  const T = (lx, ly) => { const dx = (lx - cx) * fl, dy = ly - cy; return [r2(x + cx + dx * cs - dy * sn), r2(y + cy + dx * sn + dy * cs)]; };
  let d = '';
  const pt = (c, lx, ly) => { const [X, Y] = T(lx, ly); d += c + X + ' ' + Y; };
  const g = {
    w, h, sw, ops: [],
    M(p, q) { pt('M', p, q); return g; }, L(p, q) { pt('L', p, q); return g; }, Z() { d += 'Z'; return g; },
    C(x1, y1, x2, y2, x3, y3) { const [a1, b1] = T(x1, y1), [a2, b2] = T(x2, y2), [a3, b3] = T(x3, y3); d += `C${a1} ${b1} ${a2} ${b2} ${a3} ${b3}`; return g; },
    Q(x1, y1, x2, y2) { const [a1, b1] = T(x1, y1), [a2, b2] = T(x2, y2); d += `Q${a1} ${b1} ${a2} ${b2}`; return g; },
    line(x1, y1, x2, y2) { return g.M(x1, y1).L(x2, y2); },
    poly(pts, close) { pts.forEach(([p, q], i) => pt(i ? 'L' : 'M', p, q)); if (close) d += 'Z'; return g; },
    rect(x0, y0, ww, hh) { return g.poly([[x0, y0], [x0 + ww, y0], [x0 + ww, y0 + hh], [x0, y0 + hh]], true); },
    ellipse(x0, y0, rx, ry) { const kx = 0.5523 * rx, ky = 0.5523 * ry; return g.M(x0 - rx, y0).C(x0 - rx, y0 - ky, x0 - kx, y0 - ry, x0, y0 - ry).C(x0 + kx, y0 - ry, x0 + rx, y0 - ky, x0 + rx, y0).C(x0 + rx, y0 + ky, x0 + kx, y0 + ry, x0, y0 + ry).C(x0 - kx, y0 + ry, x0 - rx, y0 + ky, x0 - rx, y0).Z(); },
    circle(x0, y0, r) { return g.ellipse(x0, y0, r, r); },
    arc(x0, y0, rx, ry, a0, a1, cont) { const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 0.1)); for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n; pt(i || cont ? 'L' : 'M', x0 + Math.cos(t) * rx, y0 + Math.sin(t) * ry); } return g; },
    fn(f, t0, t1, n = 80) { for (let i = 0; i <= n; i++) { const [p, q] = f(t0 + (t1 - t0) * i / n); pt(i ? 'L' : 'M', p, q); } return g; },
    zig(x1, y1, x2, y2, n = 6, amp = 8, lead = 0.2) {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, s = L * lead, e = L * (1 - lead);
      g.M(x1, y1).L(x1 + ux * s, y1 + uy * s);
      for (let i = 1; i <= n * 2; i++) { const t = s + (e - s) * (i - 0.5) / (n * 2), k = i % 2 ? 1 : -1; g.L(x1 + ux * t + nx * amp * k, y1 + uy * t + ny * amp * k); }
      return g.L(x1 + ux * e, y1 + uy * e).L(x2, y2);
    },
    wave(x1, y1, x2, y2, cycles, amp) { const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; return g.fn(t => [x1 + dx * t + nx * Math.sin(t * cycles * 2 * PI) * amp, y1 + dy * t + ny * Math.sin(t * cycles * 2 * PI) * amp], 0, 1, Math.max(40, cycles * 16)); },
    hatch(x1, y1, x2, y2, side = 1, len = 9, gap = 12) {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy * side, ny = ux * side, n = Math.max(2, Math.round(L / gap));
      for (let i = 0; i <= n; i++) { const px = x1 + dx * i / n, py = y1 + dy * i / n; g.M(px, py).L(px + (nx - ux * 0.7) * len, py + (ny - uy * 0.7) * len); }
      return g;
    },
    stroke(color = INK, k = 1, o = {}) { if (d) g.ops.push({ d, stroke: color, width: sw * k, alpha: o.alpha ?? 1, dash: o.dash ? [sw * k * 3, sw * k * 2.4] : null }); d = ''; return g; },
    fill(color, alpha = 1, line, k = 0.7) { if (d) g.ops.push({ d, fill: color, fillAlpha: alpha, ...(line ? { stroke: line, width: sw * k, alpha: 1 } : {}) }); d = ''; return g; },
    head(x1, y1, x2, y2, color = INK, L) { L = L || sw * 3.4 + 7; const an = Math.atan2(y2 - y1, x2 - x1); g.poly([[x2, y2], [x2 - L * Math.cos(an - 0.42), y2 - L * Math.sin(an - 0.42)], [x2 - L * Math.cos(an + 0.42), y2 - L * Math.sin(an + 0.42)]], true); return g.fill(color, 1); },
    arrow(x1, y1, x2, y2, color = INK, k = 1, L, o = {}) { L = L || sw * 3.4 + 7; const D = Math.hypot(x2 - x1, y2 - y1) || 1; g.line(x1, y1, x2 - (x2 - x1) / D * L * 0.6, y2 - (y2 - y1) / D * L * 0.6).stroke(color, k, o); g.head(x1, y1, x2, y2, color, L); if (o.both) g.head(x2, y2, x1, y1, color, L); return g; },
    text(lx, ly, s, fs, color = INK, o = {}) { const [X, Y] = T(lx, ly); g.ops.push({ text: s, x: X, y: Y, fs, fill: color, bold: o.bold, align: o.align || 'center', alpha: 1 }); return g; },
  };
  return g;
}

// helpers
function particle(g, x, y, r, col, sign, outline) {
  g.circle(x, y, r);
  if (outline) g.fill('#ffffff', 1, col, Math.max(0.6, r / 22)); else g.fill(col, 1, shade(col), 0.5);
  const k = r * 0.48, c = outline ? col : '#ffffff', wk = Math.min(2.2, Math.max(0.6, r / 15));
  if (sign) { g.line(x - k, y, x + k, y); if (sign === '+') g.line(x, y - k, x, y + k); g.stroke(c, wk); }
}
function cluster(g, x, y, r, types, C) {
  const pos = [[0, 0], [1, 0], [-1, 0], [0.5, 0.87], [-0.5, 0.87], [0.5, -0.87], [-0.5, -0.87]].map(([p, q]) => [p * r * 1.75, q * r * 1.75]);
  const order = types.length === 2 ? [[-0.5, 0], [0.5, 0]] : types.length === 3 ? [[-0.5, 0.29], [0.5, 0.29], [0, -0.58]] : types.length === 4 ? [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]] : null;
  const P = order ? order.map(([p, q]) => [p * r * 1.6, q * r * 1.6]) : pos;
  types.map((t, i) => [t, P[i] || [0, 0]]).sort((A, B) => (A[0] === 'p') - (B[0] === 'p')).forEach(([t, [p, q]]) => particle(g, x + p, y + q, r, t === 'p' ? C('#e5302f') : C('#8a8f98'), t === 'p' ? '+' : ''));
}
function axes(g, ox, oy, x1, y0, col, lx = 'x', ly = 'y', fs = 13) {
  g.arrow(ox, oy, x1, oy, col, 0.75, 10).arrow(ox, oy, ox, y0, col, 0.75, 10);
  if (lx) g.text(x1 - 4, oy + fs * 1.05, lx, fs, col);
  if (ly) g.text(ox + 9, y0 + 5, ly, fs, col, { align: 'left' });
}
const hl = (E, h) => h * 0.1 + Math.sqrt(-E / 13.6) * h * 0.8;   // y of hydrogen level (spaced like 1/n so upper levels stay readable)

export const CHAPTERS = [['basic', 'Shapes & Axes'], ['modern', 'Modern Physics'], ['optics', 'Ray Optics'], ['wave', 'Wave Optics'], ['electro', 'Electrostatics'],
  ['circuit', 'Current Electricity'], ['magnet', 'Magnetism & EMI'], ['semi', 'Semiconductors'], ['mech', 'Mechanics'], ['thermo', 'Heat, Waves & Gravitation']];

export const SYMS = {
  /* ---------------- Shapes & axes ---------------- */
  axes2: { ch: 'basic', name: 'Axes (x, y)', w: 240, h: 180, kw: 'graph axis coordinate', draw: (g, w, h, C, c) => { axes(g, w * 0.1, h * 0.88, w * 0.97, h * 0.04, c); g.text(w * 0.06, h * 0.94, 'O', 13, c); } },
  axes4: { ch: 'basic', name: 'Axes (4 quadrants)', w: 240, h: 200, kw: 'graph axis cartesian negative', draw: (g, w, h, C, c) => { g.arrow(w / 2, h / 2, w * 0.98, h / 2, c, 0.75, 10).arrow(w / 2, h / 2, w * 0.02, h / 2, c, 0.75, 10).arrow(w / 2, h / 2, w / 2, h * 0.02, c, 0.75, 10).arrow(w / 2, h / 2, w / 2, h * 0.98, c, 0.75, 10); g.text(w * 0.95, h / 2 + 14, 'x', 13, c).text(w / 2 - 12, h * 0.06, 'y', 13, c).text(w / 2 - 10, h / 2 + 13, 'O', 12, c); } },
  axes3: { ch: 'basic', name: '3D axes (x, y, z)', w: 160, h: 160, kw: 'three dimensional axis', draw: (g, w, h, C, c) => { const o = [w * 0.42, h * 0.58]; g.arrow(...o, w * 0.42, h * 0.04, c, 0.75, 10).arrow(...o, w * 0.96, h * 0.58, c, 0.75, 10).arrow(...o, w * 0.06, h * 0.94, c, 0.75, 10); g.text(w * 0.5, h * 0.06, 'z', 13, c).text(w * 0.93, h * 0.68, 'y', 13, c).text(w * 0.16, h * 0.97, 'x', 13, c); } },
  graphgrid: { ch: 'basic', name: 'Graph with grid', w: 260, h: 200, kw: 'graph paper axis plot', draw: (g, w, h, C, c) => { const ox = w * 0.1, oy = h * 0.88, gx = (w * 0.86) / 8, gy = (h * 0.8) / 6; for (let i = 1; i <= 8; i++) g.line(ox + gx * i, oy, ox + gx * i, oy - gy * 6); for (let j = 1; j <= 6; j++) g.line(ox, oy - gy * j, ox + gx * 8, oy - gy * j); g.stroke('#9fb3c8', 0.4); axes(g, ox, oy, w * 0.99, h * 0.03, c); } },
  numline: { ch: 'basic', name: 'Number line', w: 320, h: 50, kw: 'scale ticks', draw: (g, w, h, C, c) => { g.arrow(w * 0.5, h * 0.4, w, h * 0.4, c, 0.75, 9, { both: false }).arrow(w * 0.5, h * 0.4, 0, h * 0.4, c, 0.75, 9); for (let i = -4; i <= 4; i++) { const x = w / 2 + i * w * 0.105; g.line(x, h * 0.25, x, h * 0.55); g.text(x, h * 0.82, String(i).replace('-', '−'), 11, c); } g.stroke(c, 0.6); } },
  darrow: { ch: 'basic', name: 'Dimension arrow', w: 200, h: 40, kw: 'length measure double arrow', draw: (g, w, h, C, c) => { g.arrow(w / 2, h * 0.6, w, h * 0.6, c, 0.7, 9).arrow(w / 2, h * 0.6, 0, h * 0.6, c, 0.7, 9); g.line(0, h * 0.3, 0, h * 0.9).line(w, h * 0.3, w, h * 0.9).stroke(c, 0.6); g.text(w / 2, h * 0.2, 'd', 13, c); } },
  curvearrow: { ch: 'basic', name: 'Curved arrow', w: 160, h: 90, kw: 'bend rotate', draw: (g, w, h, C, c) => { g.M(w * 0.05, h * 0.9).Q(w * 0.45, -h * 0.25, w * 0.9, h * 0.75).stroke(c); g.head(w * 0.82, h * 0.6, w * 0.94, h * 0.82, c); } },
  circarrow: { ch: 'basic', name: 'Rotation arrow', w: 90, h: 90, lock: 1, kw: 'circular torque angular clockwise', draw: (g, w, h, C, c) => { g.arc(w / 2, h / 2, w * 0.38, h * 0.38, -PI * 0.1, PI * 1.55).stroke(c); g.head(w / 2 + Math.cos(PI * 1.45) * w * 0.38, h / 2 + Math.sin(PI * 1.45) * h * 0.38, w / 2 + Math.cos(PI * 1.6) * w * 0.38, h / 2 + Math.sin(PI * 1.6) * h * 0.38, c); } },
  angle: { ch: 'basic', name: 'Angle θ', w: 140, h: 100, kw: 'theta arc', draw: (g, w, h, C, c) => { g.line(w * 0.05, h * 0.92, w * 0.98, h * 0.92).line(w * 0.05, h * 0.92, w * 0.8, h * 0.05).stroke(c); const a = Math.atan2(h * 0.87, w * 0.75); g.arc(w * 0.05, h * 0.92, w * 0.3, w * 0.3, -a, 0).stroke(c, 0.7); g.text(w * 0.4, h * 0.8, 'θ', 14, c); } },
  rightangle: { ch: 'basic', name: 'Right triangle', w: 180, h: 130, kw: 'triangle 90 hypotenuse', draw: (g, w, h, C, c) => { g.poly([[w * 0.05, h * 0.95], [w * 0.95, h * 0.95], [w * 0.95, h * 0.05]], true).stroke(c); g.poly([[w * 0.95 - 14, h * 0.95], [w * 0.95 - 14, h * 0.95 - 14], [w * 0.95, h * 0.95 - 14]]).stroke(c, 0.6); g.arc(w * 0.05, h * 0.95, 34, 34, -Math.atan2(h * 0.9, w * 0.9), 0).stroke(c, 0.6); g.text(w * 0.05 + 46, h * 0.88, 'θ', 13, c); } },
  hexagon: { ch: 'basic', name: 'Hexagon', w: 120, h: 104, lock: 1, kw: 'polygon benzene', draw: (g, w, h, C, c) => { g.poly([0, 1, 2, 3, 4, 5].map(i => [w / 2 + Math.cos(i * PI / 3) * w / 2, h / 2 + Math.sin(i * PI / 3) * h / 2]), true).stroke(c); } },
  pentagon: { ch: 'basic', name: 'Pentagon', w: 120, h: 114, lock: 1, kw: 'polygon', draw: (g, w, h, C, c) => { g.poly([0, 1, 2, 3, 4].map(i => [w / 2 + Math.cos(-PI / 2 + i * 2 * PI / 5) * w / 2, h * 0.53 + Math.sin(-PI / 2 + i * 2 * PI / 5) * h * 0.53]), true).stroke(c); } },
  parallelogram: { ch: 'basic', name: 'Parallelogram', w: 180, h: 100, kw: 'rhombus quadrilateral', draw: (g, w, h, C, c) => { g.poly([[w * 0.25, 0], [w, 0], [w * 0.75, h], [0, h]], true).stroke(c); } },
  trapezium: { ch: 'basic', name: 'Trapezium', w: 180, h: 100, kw: 'trapezoid quadrilateral', draw: (g, w, h, C, c) => { g.poly([[w * 0.25, 0], [w * 0.75, 0], [w, h], [0, h]], true).stroke(c); } },
  semicircle: { ch: 'basic', name: 'Semicircle', w: 180, h: 92, kw: 'half circle arc', draw: (g, w, h, C, c) => { g.M(0, h).arc(w / 2, h, w / 2, h, PI, 2 * PI, true).Z().stroke(c); } },
  radius: { ch: 'basic', name: 'Circle with radius', w: 140, h: 140, lock: 1, kw: 'r centre', draw: (g, w, h, C, c) => { g.circle(w / 2, h / 2, w / 2 - 2).stroke(c); g.circle(w / 2, h / 2, 2.5).fill(c); g.line(w / 2, h / 2, w * 0.95, h / 2).stroke(c, 0.7); g.text(w * 0.72, h / 2 - 11, 'r', 14, c); } },
  brace: { ch: 'basic', name: 'Curly brace', w: 40, h: 160, kw: 'bracket group', draw: (g, w, h, C, c) => { g.M(w * 0.2, 0).Q(w * 0.55, 0, w * 0.55, h * 0.15).L(w * 0.55, h * 0.4).Q(w * 0.55, h / 2, w * 0.95, h / 2).Q(w * 0.55, h / 2, w * 0.55, h * 0.6).L(w * 0.55, h * 0.85).Q(w * 0.55, h, w * 0.2, h).stroke(c); } },
  cube: { ch: 'basic', name: 'Cube', w: 130, h: 130, lock: 1, kw: '3d box solid', draw: (g, w, h, C, c) => { const s = w * 0.68, o = w * 0.3; g.rect(0, o, s, s).stroke(c); g.poly([[0, o], [o, 0], [o + s, 0], [s, o]]).line(o + s, 0, o + s, s).line(o + s, s, s, o + s).stroke(c); g.line(o, 0, o, s).line(o, s, o + s, s).line(o, s, 0, o + s).stroke(c, 0.6, { dash: 1 }); } },
  cylinder: { ch: 'basic', name: 'Cylinder', w: 110, h: 160, kw: '3d solid', draw: (g, w, h, C, c) => { const ry = h * 0.1; g.ellipse(w / 2, ry, w / 2 - 1, ry).stroke(c); g.line(1, ry, 1, h - ry).line(w - 1, ry, w - 1, h - ry).arc(w / 2, h - ry, w / 2 - 1, ry, 0, PI).stroke(c); g.arc(w / 2, h - ry, w / 2 - 1, ry, PI, 2 * PI).stroke(c, 0.6, { dash: 1 }); } },
  sphere: { ch: 'basic', name: 'Sphere', w: 140, h: 140, lock: 1, kw: '3d ball globe', draw: (g, w, h, C, c) => { g.circle(w / 2, h / 2, w / 2 - 1).stroke(c); g.arc(w / 2, h / 2, w / 2 - 1, h * 0.12, 0, PI).stroke(c, 0.7); g.arc(w / 2, h / 2, w / 2 - 1, h * 0.12, PI, 2 * PI).stroke(c, 0.6, { dash: 1 }); } },
  cone: { ch: 'basic', name: 'Cone', w: 120, h: 160, kw: '3d solid', draw: (g, w, h, C, c) => { const ry = h * 0.09; g.line(w / 2, 0, 1, h - ry).line(w / 2, 0, w - 1, h - ry).arc(w / 2, h - ry, w / 2 - 1, ry, 0, PI).stroke(c); g.arc(w / 2, h - ry, w / 2 - 1, ry, PI, 2 * PI).line(w / 2, 0, w / 2, h - ry).stroke(c, 0.6, { dash: 1 }); } },

  /* ---------------- Modern physics ---------------- */
  proton: { ch: 'modern', name: 'Proton', w: 44, h: 44, lock: 1, kw: 'p plus nucleon positive', draw: (g, w, h, C) => particle(g, w / 2, h / 2, Math.min(w, h) / 2 - 1, C('#e5302f'), '+') },
  neutron: { ch: 'modern', name: 'Neutron', w: 44, h: 44, lock: 1, kw: 'n nucleon neutral', draw: (g, w, h, C) => particle(g, w / 2, h / 2, Math.min(w, h) / 2 - 1, C('#8a8f98')) },
  electron: { ch: 'modern', name: 'Electron', w: 30, h: 30, lock: 1, kw: 'e minus negative beta', draw: (g, w, h, C) => particle(g, w / 2, h / 2, Math.min(w, h) / 2 - 1, C('#1e5eff'), '-') },
  positron: { ch: 'modern', name: 'Positron', w: 30, h: 30, lock: 1, kw: 'e+ antielectron beta plus', draw: (g, w, h, C) => particle(g, w / 2, h / 2, Math.min(w, h) / 2 - 1, C('#0aa5a5'), '+') },
  neutrino: { ch: 'modern', name: 'Neutrino', w: 30, h: 30, lock: 1, kw: 'nu antineutrino', draw: (g, w, h, C) => { const c = C('#7a4dff'); g.circle(w / 2, h / 2, Math.min(w, h) / 2 - 1).fill('#ffffff', 1, c, 0.7); g.text(w / 2, h / 2, 'ν', h * 0.6, c); } },
  photon: { ch: 'modern', name: 'Photon (hν)', w: 150, h: 46, kw: 'light quantum wave', draw: (g, w, h, C) => { const c = C('#e69500'); g.wave(0, h * 0.64, w - 14, h * 0.64, 4.5, h * 0.18).stroke(c, 0.9); g.head(w - 20, h * 0.64, w, h * 0.64, c, Math.min(14, h * 0.4)); g.text(w * 0.45, h * 0.15, 'hν', h * 0.32, c); } },
  gamma: { ch: 'modern', name: 'Gamma ray (γ)', w: 150, h: 46, kw: 'radiation photon', draw: (g, w, h, C) => { const c = C('#8e44ff'); g.wave(0, h * 0.64, w - 14, h * 0.64, 7, h * 0.16).stroke(c, 0.9); g.head(w - 20, h * 0.64, w, h * 0.64, c, Math.min(14, h * 0.4)); g.text(w * 0.45, h * 0.15, 'γ', h * 0.36, c); } },
  alpha: { ch: 'modern', name: 'Alpha particle', w: 64, h: 64, lock: 1, kw: 'helium nucleus 2p2n', draw: (g, w, h, C) => cluster(g, w / 2, h / 2, w * 0.24, ['n', 'p', 'p', 'n'], C) },
  nucleus: { ch: 'modern', name: 'Nucleus', w: 92, h: 92, lock: 1, kw: 'protons neutrons cluster', draw: (g, w, h, C) => cluster(g, w / 2, h / 2, w / 6.8, ['p', 'n', 'p', 'n', 'p', 'n', 'n'], C) },
  bohr: { ch: 'modern', name: 'Bohr atom', w: 230, h: 230, lock: 1, kw: 'orbit model hydrogen shells', draw: (g, w, h, C) => {
    const R = [0.17, 0.3, 0.44].map(k => k * w), x = w / 2, y = h / 2;
    R.forEach(r => g.circle(x, y, r)); g.stroke('#8f97a3', 0.5);
    particle(g, x, y, w * 0.06, C('#e5302f'), '+');
    [[0, -0.7], [1, 2.6], [2, 0.35]].forEach(([i, a]) => particle(g, x + Math.cos(a) * R[i], y + Math.sin(a) * R[i], w * 0.034, C('#1e5eff'), '-'));
    R.forEach((r, i) => g.text(x + Math.cos(-2.3) * r - 4, y + Math.sin(-2.3) * r - 7, `n=${i + 1}`, w * 0.048, '#5b6270'));
  } },
  levels: { ch: 'modern', name: 'Energy levels (H atom)', w: 330, h: 260, kw: 'hydrogen eV n states', draw: (g, w, h, C, c) => {
    const ink = C(INK);
    [1, 2, 3, 4, 5, 6].forEach(n => { g.line(w * 0.25, hl(-13.6 / n / n, h), w * 0.75, hl(-13.6 / n / n, h)).stroke(ink, n <= 4 ? 0.8 : 0.45); });
    g.line(w * 0.25, hl(0, h), w * 0.75, hl(0, h)).stroke(ink, 0.8, { dash: 1 });
    [[1, '−13.6 eV'], [2, '−3.40 eV'], [3, '−1.51 eV'], [4, '−0.85 eV']].forEach(([n, e]) => { const y = hl(-13.6 / n / n, h); g.text(w * 0.22, y, `n = ${n}`, h * 0.05, ink, { align: 'right' }).text(w * 0.78, y, e, h * 0.05, ink, { align: 'left' }); });
    g.text(w * 0.22, hl(0, h), 'n = ∞', h * 0.05, ink, { align: 'right' }).text(w * 0.78, hl(0, h), '0 eV', h * 0.05, ink, { align: 'left' });
  } },
  series: { ch: 'modern', name: 'Spectral series', w: 360, h: 300, kw: 'lyman balmer paschen transitions hydrogen spectrum', draw: (g, w, h, C) => {
    const ink = C(INK), y = n => hl(n ? -13.6 / n / n : 0, h * 0.92);
    [1, 2, 3, 4, 5, 6].forEach(n => g.line(w * 0.13, y(n), w * 0.95, y(n))); g.stroke(ink, 0.55);
    [1, 2, 3, 4].forEach(n => g.text(w * 0.11, y(n), `n=${n}`, h * 0.042, ink, { align: 'right' })); g.text(w * 0.11, y(0), 'n=∞', h * 0.042, ink, { align: 'right' }); g.line(w * 0.13, y(0), w * 0.95, y(0)).stroke(ink, 0.55, { dash: 1 });
    const fam = [[1, [2, 3, 4, 5], 0.2, C('#8e44ff'), 'Lyman'], [2, [3, 4, 5, 6], 0.5, C('#1e5eff'), 'Balmer'], [3, [4, 5, 6], 0.8, C('#e5302f'), 'Paschen']];
    fam.forEach(([to, from, x0, col, name]) => { from.forEach((f, i) => g.arrow(w * (x0 + i * 0.045), y(f), w * (x0 + i * 0.045), y(to), col, 0.65, 8)); g.text(w * (x0 + 0.06), y(to) + h * 0.045, name, h * 0.045, col, { bold: 1 }); });
  } },
  photoelectric: { ch: 'modern', name: 'Photoelectric setup', w: 320, h: 210, kw: 'emitter collector tube stopping potential experiment', draw: (g, w, h, C) => {
    const ink = C(INK);
    g.ellipse(w * 0.5, h * 0.36, w * 0.38, h * 0.3).stroke(ink, 0.8);
    g.rect(w * 0.2, h * 0.2, w * 0.025, h * 0.32).fill(ink).rect(w * 0.775, h * 0.2, w * 0.025, h * 0.32).fill(ink);
    g.text(w * 0.26, h * 0.56, 'C', h * 0.07, ink).text(w * 0.74, h * 0.56, 'A', h * 0.07, ink);
    const pc = C('#e69500'); g.wave(w * 0.0, h * 0.0, w * 0.18, h * 0.22, 3, 4).stroke(pc, 0.8); g.head(w * 0.16, h * 0.19, w * 0.195, h * 0.24, pc, 9); g.text(w * 0.06, h * 0.2, 'hν', h * 0.065, pc);
    [[0.38, 0.29], [0.5, 0.4], [0.62, 0.32]].forEach(([p, q]) => particle(g, w * p, h * q, h * 0.022, C('#1e5eff'), '-'));
    g.arrow(w * 0.42, h * 0.43, w * 0.58, h * 0.43, C('#1e5eff'), 0.5, 7);
    g.poly([[w * 0.2125, h * 0.52], [w * 0.2125, h * 0.88], [w * 0.4, h * 0.88]]).line(w * 0.47, h * 0.88, w * 0.565, h * 0.88).poly([[w * 0.675, h * 0.88], [w * 0.7875, h * 0.88], [w * 0.7875, h * 0.52]]).stroke(ink, 0.7);
    g.line(w * 0.4, h * 0.79, w * 0.4, h * 0.97).stroke(ink, 0.8).line(w * 0.47, h * 0.83, w * 0.47, h * 0.93).stroke(ink, 1.8); g.line(w * 0.4, h * 0.88, w * 0.47, h * 0.88).stroke(ink, 0.7, { dash: 1 });
    g.circle(w * 0.62, h * 0.88, h * 0.055).fill('#ffffff', 1, ink, 0.7); g.text(w * 0.62, h * 0.88, 'μA', h * 0.05, ink);
  } },
  kgraph: { ch: 'modern', name: 'Kmax vs ν graph', w: 250, h: 190, kw: 'photoelectric threshold frequency work function einstein equation', draw: (g, w, h, C, c) => {
    const ink = C(INK), ox = w * 0.16, oy = h * 0.82; axes(g, ox, oy, w * 0.97, h * 0.04, ink, 'ν', 'Kₘₐₓ', 13);
    const nx = w * 0.4, ex = w * 0.9, ey = h * 0.12, m = (ey - oy) / (ex - nx), iy = oy + m * (ox - nx);
    g.line(nx, oy, ex, ey).stroke(C('#1e5eff'), 1); g.line(ox, iy, nx, oy).stroke(C('#1e5eff'), 0.7, { dash: 1 });
    g.text(nx, oy + 14, 'ν₀', 13, ink).text(ox - 16, iy, '−φ', 12, ink).text(w * 0.75, h * 0.47, 'slope = h', 12, C('#1e5eff'));
  } },
  ivgraph: { ch: 'modern', name: 'Photocurrent vs V', w: 260, h: 190, kw: 'photoelectric saturation current stopping potential intensity', draw: (g, w, h, C) => {
    const ink = C(INK), ox = w * 0.42, oy = h * 0.84;
    g.arrow(w * 0.03, oy, w * 0.98, oy, ink, 0.75, 10).arrow(ox, oy, ox, h * 0.04, ink, 0.75, 10);
    g.text(w * 0.95, oy + 15, 'V', 13, ink).text(ox - 12, h * 0.07, 'I', 13, ink);
    const v0 = w * 0.16;
    [[h * 0.26, 'I₁'], [h * 0.48, 'I₂']].forEach(([sat, lab], i) => { g.fn(t => [v0 + t * (w * 0.92 - v0), oy - (oy - sat) * (1 - Math.exp(-t * 7))], 0, 1, 60).stroke(C(i ? '#e5302f' : '#1e5eff'), 0.9); g.text(w * 0.95, sat - 9, lab, 12, C(i ? '#e5302f' : '#1e5eff')); });
    g.text(v0, oy + 15, '−V₀', 12, ink); g.text(w * 0.7, h * 0.13, 'I₁ > I₂ (same ν)', 11, '#5b6270');
  } },
  decay: { ch: 'modern', name: 'Radioactive decay curve', w: 260, h: 190, kw: 'half life exponential N0 lambda activity', draw: (g, w, h, C) => {
    const ink = C(INK), ox = w * 0.14, oy = h * 0.84, top = h * 0.12, th = w * 0.18; axes(g, ox, oy, w * 0.97, h * 0.03, ink, 't', 'N', 13);
    g.fn(t => [ox + t, oy - (oy - top) * Math.pow(2, -t / th)], 0, w * 0.8, 70).stroke(C('#1e5eff'), 1);
    [[1, 'N₀/2', 'T½'], [2, 'N₀/4', '2T½']].forEach(([k, ly, lx]) => { const X = ox + k * th, Y = oy - (oy - top) / Math.pow(2, k); g.poly([[ox, Y], [X, Y], [X, oy]]).stroke(ink, 0.5, { dash: 1 }); g.text(ox - 6, Y, ly, 11, ink, { align: 'right' }).text(X, oy + 14, lx, 11, ink); });
    g.text(ox - 6, top, 'N₀', 12, ink, { align: 'right' });
  } },
  becurve: { ch: 'modern', name: 'Binding energy per nucleon', w: 290, h: 200, kw: 'BE/A mass number fission fusion stability iron', draw: (g, w, h, C) => {
    const ink = C(INK), ox = w * 0.12, oy = h * 0.86, f = A => 8.8 * (1 - Math.exp(-A / 12)) - 0.0065 * Math.max(0, A - 56), X = A => ox + A / 240 * w * 0.82, Y = E => oy - E / 10 * h * 0.8;
    axes(g, ox, oy, w * 0.98, h * 0.03, ink, 'A', 'BE/A', 12);
    g.fn(A => [X(A), Y(f(A))], 2, 238, 80).stroke(C('#1e5eff'), 1);
    g.circle(X(56), Y(f(56)), 3).fill(C('#e5302f')); g.text(X(56), Y(f(56)) - 12, 'Fe-56 (8.8 MeV)', 11, C('#e5302f'));
    g.text(X(235), Y(f(235)) - 12, 'U', 11, ink).text(X(56) - 4, oy + 14, '56', 10, ink);
  } },
  fission: { ch: 'modern', name: 'Nuclear fission', w: 340, h: 170, kw: 'chain reaction uranium neutron barium krypton', draw: (g, w, h, C) => {
    const ink = C(INK), n = C('#8a8f98');
    particle(g, w * 0.05, h * 0.5, h * 0.06, n); g.arrow(w * 0.1, h * 0.5, w * 0.23, h * 0.5, ink, 0.7, 9);
    g.circle(w * 0.36, h * 0.5, h * 0.22).fill(C('#f2b8b0'), 1, shade(C('#e5302f')), 0.6); g.text(w * 0.36, h * 0.5, 'U-235', h * 0.085, ink, { bold: 1 });
    g.arrow(w * 0.47, h * 0.4, w * 0.6, h * 0.22, ink, 0.7, 9).arrow(w * 0.47, h * 0.6, w * 0.6, h * 0.78, ink, 0.7, 9).arrow(w * 0.5, h * 0.5, w * 0.78, h * 0.5, ink, 0.7, 9);
    g.circle(w * 0.69, h * 0.17, h * 0.13).fill(C('#bcd3f5'), 1, shade(C('#1e5eff')), 0.6); g.text(w * 0.69, h * 0.17, 'Ba', h * 0.08, ink, { bold: 1 });
    g.circle(w * 0.69, h * 0.83, h * 0.12).fill(C('#c9ecd2'), 1, shade(C('#12a150')), 0.6); g.text(w * 0.69, h * 0.83, 'Kr', h * 0.08, ink, { bold: 1 });
    [[0.85, 0.38], [0.91, 0.5], [0.85, 0.62]].forEach(([p, q]) => particle(g, w * p, h * q, h * 0.055, n));
    g.text(w * 0.92, h * 0.85, '+ energy', h * 0.07, '#5b6270');
  } },
  fusion: { ch: 'modern', name: 'Nuclear fusion', w: 320, h: 150, kw: 'deuterium tritium helium', draw: (g, w, h, C) => {
    const ink = C(INK);
    cluster(g, w * 0.1, h * 0.25, h * 0.09, ['p', 'n'], C); g.text(w * 0.1, h * 0.06, '²H', h * 0.09, ink);
    cluster(g, w * 0.1, h * 0.75, h * 0.09, ['p', 'n', 'n'], C); g.text(w * 0.1, h * 0.97, '³H', h * 0.09, ink);
    g.arrow(w * 0.2, h * 0.5, w * 0.4, h * 0.5, ink, 0.8, 10);
    cluster(g, w * 0.55, h * 0.5, h * 0.1, ['n', 'p', 'p', 'n'], C); g.text(w * 0.55, h * 0.2, '⁴He', h * 0.09, ink);
    g.text(w * 0.7, h * 0.5, '+', h * 0.14, ink); particle(g, w * 0.8, h * 0.5, h * 0.08, C('#8a8f98')); g.text(w * 0.8, h * 0.28, 'n', h * 0.09, ink); g.text(w * 0.93, h * 0.5, '+ E', h * 0.1, '#5b6270');
  } },
  betadecay: { ch: 'modern', name: 'Beta (β⁻) decay', w: 320, h: 110, kw: 'neutron proton electron antineutrino', draw: (g, w, h, C) => {
    const ink = C(INK); particle(g, w * 0.07, h * 0.58, h * 0.16, C('#8a8f98')); g.arrow(w * 0.15, h * 0.58, w * 0.3, h * 0.58, ink, 0.8, 9);
    particle(g, w * 0.39, h * 0.58, h * 0.16, C('#e5302f'), '+'); g.text(w * 0.5, h * 0.58, '+', h * 0.22, ink);
    particle(g, w * 0.6, h * 0.58, h * 0.11, C('#1e5eff'), '-'); g.text(w * 0.7, h * 0.58, '+', h * 0.22, ink);
    const nc = C('#7a4dff'); g.circle(w * 0.8, h * 0.58, h * 0.11).fill('#ffffff', 1, nc, 0.7); g.text(w * 0.8, h * 0.58, 'ν̄', h * 0.14, nc);
    ['n', 'p', 'e⁻', 'ν̄'].forEach((s, i) => g.text(w * [0.07, 0.39, 0.6, 0.8][i], h * 0.13, s, h * 0.13, ink));
  } },
  rutherford: { ch: 'modern', name: 'Rutherford scattering', w: 290, h: 210, kw: 'alpha gold foil nucleus impact parameter deflection', draw: (g, w, h, C) => {
    const nx = w * 0.62, ny = h * 0.5, col = C('#1e5eff');
    [-0.36, -0.2, -0.09, 0.09, 0.2, 0.36].forEach(b => { const by = ny + b * h, th = 2 * Math.atan(0.035 / Math.abs(b)) , dir = b < 0 ? -1 : 1, ex = nx + Math.cos(th) * w * 0.38, ey = by + dir * Math.sin(th) * w * 0.38; g.M(0, by).Q(nx, by, ex, ey).stroke(col, 0.7); g.head(nx + (ex - nx) * 0.9, by + (ey - by) * 0.9, ex, ey, col, 8); });
    g.line(0, ny, nx - w * 0.06, ny).stroke(col, 0.7); g.M(nx - w * 0.06, ny).Q(nx - w * 0.1, ny - h * 0.02, w * 0.18, ny - h * 0.09).stroke(col, 0.7); g.head(w * 0.22, ny - h * 0.08, w * 0.16, ny - h * 0.095, col, 8);
    particle(g, nx, ny, h * 0.045, C('#e5302f'), '+'); g.text(w * 0.05, h * 0.06, 'α', h * 0.08, col); g.text(nx + w * 0.06, ny + h * 0.07, 'nucleus', h * 0.055, '#5b6270');
  } },
  matterwave: { ch: 'modern', name: 'Matter wave (de Broglie)', w: 270, h: 100, kw: 'wave packet lambda h/p electron', draw: (g, w, h, C) => {
    const c = C('#1e5eff'); g.fn(t => [t * w, h * 0.6 - Math.exp(-Math.pow((t - 0.5) / 0.2, 2)) * Math.sin(t * 2 * PI * 9) * h * 0.33], 0, 1, 160).stroke(c, 0.9);
    g.line(0, h * 0.6, w, h * 0.6).stroke('#9aa1ad', 0.4, { dash: 1 }); g.text(w * 0.5, h * 0.09, 'λ = h / p', h * 0.15, C(INK));
  } },
  orbitwave: { ch: 'modern', name: 'Standing wave in orbit', w: 210, h: 210, lock: 1, kw: 'bohr quantisation 2πr = nλ de broglie', draw: (g, w, h, C) => {
    const R = w * 0.33; g.circle(w / 2, h / 2, R).stroke('#9aa1ad', 0.5, { dash: 1 });
    g.fn(t => [w / 2 + Math.cos(t) * (R + Math.sin(4 * t) * w * 0.07), h / 2 + Math.sin(t) * (R + Math.sin(4 * t) * w * 0.07)], 0, 2 * PI, 160).Z().stroke(C('#1e5eff'), 0.9);
    particle(g, w / 2, h / 2, w * 0.05, C('#e5302f'), '+'); g.text(w / 2, h * 0.96, '2πr = nλ  (n = 4)', w * 0.06, C(INK));
  } },
  xraytube: { ch: 'modern', name: 'X-ray spectrum', w: 260, h: 190, kw: 'continuous characteristic K alpha beta cutoff wavelength', draw: (g, w, h, C) => {
    const ink = C(INK), ox = w * 0.12, oy = h * 0.84; axes(g, ox, oy, w * 0.97, h * 0.04, ink, 'λ', 'I', 13);
    const lmin = w * 0.24; g.fn(t => [lmin + t * w * 0.68, oy - h * 0.45 * Math.pow(t, 0.6) * Math.exp(-t * 2.4) * 3.1], 0, 1, 60).stroke(C('#1e5eff'), 1);
    [[0.45, 0.62, 'Kβ'], [0.53, 0.78, 'Kα']].forEach(([p, q, lab]) => { const X = lmin + p * w * 0.68; g.M(X - 5, oy - h * 0.43 + 3).L(X, oy - h * q).L(X + 5, oy - h * 0.43 + 3).stroke(C('#e5302f'), 0.9); g.text(X, oy - h * q - 10, lab, 11, C('#e5302f')); });
    g.text(lmin, oy + 14, 'λₘᵢₙ', 11, ink);
  } },

  /* ---------------- Ray optics ---------------- */
  planemirror: { ch: 'optics', name: 'Plane mirror', w: 26, h: 170, kw: 'reflection', draw: (g, w, h, C, c) => { g.line(w * 0.3, 0, w * 0.3, h).stroke(c, 1.4); g.hatch(w * 0.3, 0, w * 0.3, h, -1, w * 0.6).stroke(c, 0.5); } },
  concave: { ch: 'optics', name: 'Concave mirror', w: 54, h: 180, kw: 'spherical converging reflection', draw: (g, w, h, C, c) => { const R = h * 1.1, x0 = w * 0.62, cx0 = x0 - R, A = Math.asin(h * 0.48 / R); g.arc(cx0, h / 2, R, R, -A, A).stroke(c, 1.4); for (let i = 0; i <= 12; i++) { const t = -A + 2 * A * i / 12, px = cx0 + R * Math.cos(t), py = h / 2 + R * Math.sin(t); g.line(px, py, px + 9, py + 6); } g.stroke(c, 0.5); } },
  convex: { ch: 'optics', name: 'Convex mirror', w: 54, h: 180, kw: 'spherical diverging reflection', draw: (g, w, h, C, c) => { const R = h * 1.1, x0 = w * 0.3, cx0 = x0 + R, A = Math.asin(h * 0.48 / R); g.arc(cx0, h / 2, -R, R, -A, A).stroke(c, 1.4); for (let i = 0; i <= 12; i++) { const t = -A + 2 * A * i / 12, px = cx0 - R * Math.cos(t), py = h / 2 + R * Math.sin(t); g.line(px, py, px + 9, py + 6); } g.stroke(c, 0.5); } },
  convexlens: { ch: 'optics', name: 'Convex lens', w: 52, h: 190, kw: 'converging biconvex refraction', draw: (g, w, h, C, c) => { g.M(w / 2, 0).Q(w * 1.2, h / 2, w / 2, h).Q(-w * 0.2, h / 2, w / 2, 0).Z().fill(C('#9fd0ff'), 0.35, c, 0.8); } },
  concavelens: { ch: 'optics', name: 'Concave lens', w: 58, h: 190, kw: 'diverging biconcave refraction', draw: (g, w, h, C, c) => { g.M(w * 0.06, 0).L(w * 0.94, 0).Q(w * 0.32, h / 2, w * 0.94, h).L(w * 0.06, h).Q(w * 0.68, h / 2, w * 0.06, 0).Z().fill(C('#9fd0ff'), 0.35, c, 0.8); } },
  lenssym1: { ch: 'optics', name: 'Convex lens (symbol)', w: 30, h: 180, kw: 'thin lens line', draw: (g, w, h, C, c) => { g.line(w / 2, 0, w / 2, h).M(w * 0.12, 13).L(w / 2, 0).L(w * 0.88, 13).M(w * 0.12, h - 13).L(w / 2, h).L(w * 0.88, h - 13).stroke(c, 1); } },
  lenssym2: { ch: 'optics', name: 'Concave lens (symbol)', w: 30, h: 180, kw: 'thin lens line diverging', draw: (g, w, h, C, c) => { g.line(w / 2, 6, w / 2, h - 6).M(w * 0.12, 0).L(w / 2, 13).L(w * 0.88, 0).M(w * 0.12, h).L(w / 2, h - 13).L(w * 0.88, h).stroke(c, 1); } },
  prism: { ch: 'optics', name: 'Prism', w: 150, h: 130, kw: 'dispersion triangle glass', draw: (g, w, h, C, c) => { g.poly([[w / 2, 0], [w, h], [0, h]], true).fill(C('#9fd0ff'), 0.3, c, 0.8); g.arc(w / 2, 0, 22, 22, PI / 2 - 0.52, PI / 2 + 0.52).stroke(c, 0.5); g.text(w / 2, 34, 'A', 12, c); } },
  slab: { ch: 'optics', name: 'Glass slab', w: 170, h: 90, kw: 'refraction lateral shift block', draw: (g, w, h, C, c) => { g.rect(0, 0, w, h).fill(C('#9fd0ff'), 0.3, c, 0.8); } },
  object: { ch: 'optics', name: 'Object (arrow)', w: 22, h: 90, kw: 'candle arrow upright', draw: (g, w, h, C) => { g.arrow(w / 2, h, w / 2, 0, C('#e5302f'), 1.1, 14); } },
  image: { ch: 'optics', name: 'Image (dashed arrow)', w: 22, h: 90, kw: 'virtual inverted', draw: (g, w, h, C) => { g.arrow(w / 2, 0, w / 2, h, C('#1e5eff'), 1, 14, { dash: 1 }); } },
  ray: { ch: 'optics', name: 'Ray (mid arrow)', w: 200, h: 24, kw: 'light ray direction', draw: (g, w, h, C) => { const c = C('#e5302f'); g.line(0, h / 2, w, h / 2).stroke(c, 0.9); g.head(w / 2 - 4, h / 2, w / 2 + 8, h / 2, c, 12); } },
  axis: { ch: 'optics', name: 'Principal axis (F, 2F)', w: 440, h: 44, kw: 'optical bench focus centre of curvature', draw: (g, w, h, C, c) => { g.line(0, h * 0.35, w, h * 0.35).stroke(c, 0.6, { dash: 1 }); [[-0.4, '2F'], [-0.2, 'F'], [0, 'O'], [0.2, 'F'], [0.4, '2F']].forEach(([k, l]) => { const x = w / 2 + k * w; g.line(x, h * 0.2, x, h * 0.5).stroke(c, 0.7); g.text(x, h * 0.78, l, h * 0.3, c); }); } },
  eye: { ch: 'optics', name: 'Eye', w: 90, h: 50, kw: 'observer viewer', draw: (g, w, h, C, c) => { g.M(0, h / 2).Q(w / 2, -h * 0.35, w, h / 2).Q(w / 2, h * 1.35, 0, h / 2).Z().stroke(c, 0.9); g.circle(w * 0.56, h / 2, h * 0.26).fill(C('#3b6fd8'), 0.9); g.circle(w * 0.56, h / 2, h * 0.12).fill('#111111'); } },
  source: { ch: 'optics', name: 'Point source', w: 70, h: 70, lock: 1, kw: 'light bulb lamp rays', draw: (g, w, h, C) => { const c = C('#e69500'), r = w * 0.16; for (let i = 0; i < 8; i++) { const a = i * PI / 4; g.line(w / 2 + Math.cos(a) * r * 1.6, h / 2 + Math.sin(a) * r * 1.6, w / 2 + Math.cos(a) * w * 0.48, h / 2 + Math.sin(a) * h * 0.48); } g.stroke(c, 0.8); g.circle(w / 2, h / 2, r).fill(C('#ffd400'), 1, c, 0.6); } },

  /* ---------------- Wave optics ---------------- */
  slit1: { ch: 'wave', name: 'Single slit', w: 40, h: 200, kw: 'diffraction barrier aperture', draw: (g, w, h, C, c) => { g.rect(w * 0.35, 0, w * 0.3, h * 0.45).rect(w * 0.35, h * 0.55, w * 0.3, h * 0.45).fill(c, 1); } },
  slit2: { ch: 'wave', name: 'Double slit (YDSE)', w: 40, h: 200, kw: 'young interference barrier', draw: (g, w, h, C, c) => { g.rect(w * 0.35, 0, w * 0.3, h * 0.36).rect(w * 0.35, h * 0.42, w * 0.3, h * 0.16).rect(w * 0.35, h * 0.64, w * 0.3, h * 0.36).fill(c, 1); g.text(w * 0.05, h * 0.39, 'S₁', 10, c, { align: 'right' }).text(w * 0.05, h * 0.61, 'S₂', 10, c, { align: 'right' }); } },
  screen: { ch: 'wave', name: 'Screen', w: 20, h: 220, kw: 'fringes', draw: (g, w, h, C, c) => { g.rect(w * 0.25, 0, w * 0.5, h).fill('#cfd3db', 1, c, 0.6); } },
  fringes: { ch: 'wave', name: 'Fringe pattern', w: 60, h: 220, kw: 'bright dark interference bands', draw: (g, w, h, C) => { for (let i = 0; i < 11; i++) { const y = h * (i + 0.5) / 11; g.rect(0, y - h * 0.025, w, h * 0.05).fill(C('#e5302f'), 0.85 - Math.abs(i - 5) * 0.12); } } },
  planewave: { ch: 'wave', name: 'Plane wavefronts', w: 150, h: 160, kw: 'huygens wavefront', draw: (g, w, h, C, c) => { for (let i = 0; i < 5; i++) g.line(w * (0.1 + i * 0.18), 0, w * (0.1 + i * 0.18), h); g.stroke(c, 0.8); g.arrow(w * 0.1, h / 2, w * 0.98, h / 2, C('#e5302f'), 0.7, 10); } },
  sphwave: { ch: 'wave', name: 'Spherical wavefronts', w: 200, h: 200, kw: 'point source circular huygens', draw: (g, w, h, C, c) => { g.circle(w * 0.08, h / 2, 3).fill(c); for (let i = 1; i <= 5; i++) g.arc(w * 0.08, h / 2, w * 0.18 * i, w * 0.18 * i, -0.9, 0.9); g.stroke(c, 0.8); } },
  polaroid: { ch: 'wave', name: 'Polaroid', w: 90, h: 90, lock: 1, kw: 'polariser polarisation', draw: (g, w, h, C, c) => { const r = w / 2 - 1; g.circle(w / 2, h / 2, r).stroke(c); for (let k = -2; k <= 2; k++) { const dx = k * r * 0.36, hl2 = Math.sqrt(r * r - dx * dx); g.line(w / 2 + dx, h / 2 - hl2, w / 2 + dx, h / 2 + hl2); } g.stroke(c, 0.5); } },

  /* ---------------- Electrostatics ---------------- */
  qpos: { ch: 'electro', name: 'Charge +q', w: 50, h: 50, lock: 1, kw: 'point charge positive', draw: (g, w, h, C) => particle(g, w / 2, h / 2, w / 2 - 1, C('#e5302f'), '+', true) },
  qneg: { ch: 'electro', name: 'Charge −q', w: 50, h: 50, lock: 1, kw: 'point charge negative', draw: (g, w, h, C) => particle(g, w / 2, h / 2, w / 2 - 1, C('#1e5eff'), '-', true) },
  dipole: { ch: 'electro', name: 'Electric dipole', w: 220, h: 90, kw: 'dipole moment p', draw: (g, w, h, C, c) => { particle(g, w * 0.12, h * 0.62, h * 0.2, C('#1e5eff'), '-', true); particle(g, w * 0.88, h * 0.62, h * 0.2, C('#e5302f'), '+', true); g.line(w * 0.2, h * 0.62, w * 0.8, h * 0.62).stroke(c, 0.6, { dash: 1 }); g.arrow(w * 0.3, h * 0.14, w * 0.7, h * 0.14, c, 0.8, 10); g.text(w * 0.76, h * 0.14, 'p', 14, c, { align: 'left', bold: 1 }); g.text(w * 0.5, h * 0.78, '2a', 12, c); } },
  fieldpos: { ch: 'electro', name: 'Field of +q', w: 170, h: 170, lock: 1, kw: 'electric field lines radial outward', draw: (g, w, h, C, c) => { for (let i = 0; i < 8; i++) { const a = i * PI / 4; g.arrow(w / 2 + Math.cos(a) * w * 0.17, h / 2 + Math.sin(a) * h * 0.17, w / 2 + Math.cos(a) * w * 0.48, h / 2 + Math.sin(a) * h * 0.48, c, 0.7, 9); } particle(g, w / 2, h / 2, w * 0.11, C('#e5302f'), '+'); } },
  fieldneg: { ch: 'electro', name: 'Field of −q', w: 170, h: 170, lock: 1, kw: 'electric field lines radial inward', draw: (g, w, h, C, c) => { for (let i = 0; i < 8; i++) { const a = i * PI / 4; g.arrow(w / 2 + Math.cos(a) * w * 0.48, h / 2 + Math.sin(a) * h * 0.48, w / 2 + Math.cos(a) * w * 0.17, h / 2 + Math.sin(a) * h * 0.17, c, 0.7, 9); } particle(g, w / 2, h / 2, w * 0.11, C('#1e5eff'), '-'); } },
  capfield: { ch: 'electro', name: 'Parallel plates (field)', w: 170, h: 150, kw: 'capacitor uniform field E', draw: (g, w, h, C, c) => { g.rect(w * 0.14, h * 0.05, w * 0.05, h * 0.9).fill(C('#e5302f'), 0.9).rect(w * 0.81, h * 0.05, w * 0.05, h * 0.9).fill(C('#1e5eff'), 0.9); for (let i = 0; i < 4; i++) { const y = h * (0.18 + i * 0.21); g.arrow(w * 0.23, y, w * 0.77, y, c, 0.6, 9); g.text(w * 0.07, y, '+', 14, C('#e5302f')).text(w * 0.93, y, '−', 14, C('#1e5eff')); } g.text(w / 2, h * 0.97, 'E', 13, c, { bold: 1 }); } },
  gauss: { ch: 'electro', name: 'Gaussian surface', w: 160, h: 160, lock: 1, kw: 'gauss law sphere flux', draw: (g, w, h, C, c) => { g.circle(w / 2, h / 2, w / 2 - 2).stroke(C('#12a150'), 0.8, { dash: 1 }); particle(g, w / 2, h / 2, w * 0.08, C('#e5302f'), '+'); g.line(w / 2, h / 2, w * 0.85, h * 0.15).stroke(c, 0.5); g.text(w * 0.74, h * 0.38, 'r', 13, c); } },

  /* ---------------- Current electricity ---------------- */
  resistor: { ch: 'circuit', name: 'Resistor', w: 140, h: 40, kw: 'resistance R zigzag', draw: (g, w, h, C, c) => g.zig(0, h / 2, w, h / 2, 6, h * 0.32, 0.22).stroke(c) },
  cell: { ch: 'circuit', name: 'Cell', w: 120, h: 50, kw: 'battery emf', draw: (g, w, h, C, c) => { g.line(0, h / 2, w * 0.45, h / 2).line(w * 0.55, h / 2, w, h / 2).line(w * 0.45, h * 0.08, w * 0.45, h * 0.92).stroke(c); g.line(w * 0.55, h * 0.3, w * 0.55, h * 0.7).stroke(c, 2.2); } },
  battery: { ch: 'circuit', name: 'Battery', w: 150, h: 50, kw: 'cells emf', draw: (g, w, h, C, c) => { g.line(0, h / 2, w * 0.36, h / 2).line(w * 0.64, h / 2, w, h / 2).line(w * 0.36, h * 0.08, w * 0.36, h * 0.92).line(w * 0.56, h * 0.08, w * 0.56, h * 0.92).stroke(c); g.line(w * 0.44, h * 0.3, w * 0.44, h * 0.7).line(w * 0.64, h * 0.3, w * 0.64, h * 0.7).stroke(c, 2.2); g.line(w * 0.44, h / 2, w * 0.56, h / 2).stroke(c, 0.7, { dash: 1 }); } },
  switch: { ch: 'circuit', name: 'Switch (key)', w: 130, h: 50, kw: 'key open', draw: (g, w, h, C, c) => { g.line(0, h * 0.7, w * 0.3, h * 0.7).line(w * 0.7, h * 0.7, w, h * 0.7).line(w * 0.3, h * 0.7, w * 0.66, h * 0.12).stroke(c); g.circle(w * 0.3, h * 0.7, 4).fill('#ffffff', 1, c).circle(w * 0.7, h * 0.7, 4).fill('#ffffff', 1, c); } },
  bulb: { ch: 'circuit', name: 'Bulb', w: 120, h: 50, kw: 'lamp', draw: (g, w, h, C, c) => { const r = h * 0.4, x = w / 2, y = h / 2, k = r * 0.7; g.line(0, y, x - r, y).line(x + r, y, w, y).circle(x, y, r).line(x - k, y - k, x + k, y + k).line(x - k, y + k, x + k, y - k).stroke(c); } },
  ammeter: { ch: 'circuit', name: 'Ammeter', w: 120, h: 50, kw: 'A meter current', draw: (g, w, h, C, c) => { const r = h * 0.42; g.line(0, h / 2, w / 2 - r, h / 2).line(w / 2 + r, h / 2, w, h / 2).circle(w / 2, h / 2, r).stroke(c); g.text(w / 2, h / 2, 'A', h * 0.45, c, { bold: 1 }); } },
  voltmeter: { ch: 'circuit', name: 'Voltmeter', w: 120, h: 50, kw: 'V meter potential', draw: (g, w, h, C, c) => { const r = h * 0.42; g.line(0, h / 2, w / 2 - r, h / 2).line(w / 2 + r, h / 2, w, h / 2).circle(w / 2, h / 2, r).stroke(c); g.text(w / 2, h / 2, 'V', h * 0.45, c, { bold: 1 }); } },
  galvanometer: { ch: 'circuit', name: 'Galvanometer', w: 120, h: 50, kw: 'G meter', draw: (g, w, h, C, c) => { const r = h * 0.42; g.line(0, h / 2, w / 2 - r, h / 2).line(w / 2 + r, h / 2, w, h / 2).circle(w / 2, h / 2, r).stroke(c); g.text(w / 2, h / 2, 'G', h * 0.45, c, { bold: 1 }); } },
  rheostat: { ch: 'circuit', name: 'Rheostat', w: 140, h: 50, kw: 'variable resistor', draw: (g, w, h, C, c) => { g.zig(0, h / 2, w, h / 2, 6, h * 0.25, 0.22).stroke(c); g.arrow(w * 0.3, h * 0.95, w * 0.72, h * 0.05, c, 0.7, 9); } },
  capacitor: { ch: 'circuit', name: 'Capacitor', w: 120, h: 50, kw: 'C condenser', draw: (g, w, h, C, c) => { g.line(0, h / 2, w * 0.45, h / 2).line(w * 0.55, h / 2, w, h / 2).line(w * 0.45, h * 0.08, w * 0.45, h * 0.92).line(w * 0.55, h * 0.08, w * 0.55, h * 0.92).stroke(c); } },
  inductor: { ch: 'circuit', name: 'Inductor', w: 140, h: 40, kw: 'coil L', draw: (g, w, h, C, c) => { g.M(0, h * 0.7).L(w * 0.2, h * 0.7); const s = w * 0.15; for (let i = 0; i < 4; i++) g.arc(w * 0.2 + s * (i + 0.5), h * 0.7, s / 2, h * 0.55, PI, 2 * PI, true); g.L(w, h * 0.7).stroke(c); } },
  acsource: { ch: 'circuit', name: 'AC source', w: 120, h: 50, kw: 'alternating generator', draw: (g, w, h, C, c) => { const r = h * 0.42; g.line(0, h / 2, w / 2 - r, h / 2).line(w / 2 + r, h / 2, w, h / 2).circle(w / 2, h / 2, r).stroke(c); g.fn(t => [w / 2 - r * 0.6 + t * r * 1.2, h / 2 - Math.sin(t * 2 * PI) * r * 0.35], 0, 1, 30).stroke(c, 0.8); } },
  groundsym: { ch: 'circuit', name: 'Earth / ground', w: 44, h: 44, kw: 'earthing', draw: (g, w, h, C, c) => { g.line(w / 2, 0, w / 2, h * 0.45).line(w * 0.08, h * 0.45, w * 0.92, h * 0.45).line(w * 0.25, h * 0.65, w * 0.75, h * 0.65).line(w * 0.4, h * 0.85, w * 0.6, h * 0.85).stroke(c); } },
  junction: { ch: 'circuit', name: 'Junction dot', w: 14, h: 14, lock: 1, kw: 'node', draw: (g, w, h, C, c) => g.circle(w / 2, h / 2, w / 2).fill(c) },
  wheatstone: { ch: 'circuit', name: 'Wheatstone bridge', w: 270, h: 250, kw: 'bridge balance PQRS galvanometer metre bridge', draw: (g, w, h, C, c) => {
    const A = [w * 0.08, h * 0.42], B = [w / 2, h * 0.08], Cc = [w * 0.92, h * 0.42], D = [w / 2, h * 0.76];
    g.zig(...A, ...B, 5, 7, 0.28).zig(...B, ...Cc, 5, 7, 0.28).zig(...A, ...D, 5, 7, 0.28).zig(...D, ...Cc, 5, 7, 0.28).stroke(c);
    const r = h * 0.065; g.line(B[0], B[1], B[0], h * 0.42 - r).line(D[0], h * 0.42 + r, D[0], D[1]).circle(w / 2, h * 0.42, r).stroke(c); g.text(w / 2, h * 0.42, 'G', r * 1.1, c, { bold: 1 });
    g.poly([A, [A[0], h * 0.95], [w * 0.47, h * 0.95]]).poly([[w * 0.53, h * 0.95], [Cc[0], h * 0.95], Cc]).line(w * 0.47, h * 0.89, w * 0.47, h * 1.0).stroke(c); g.line(w * 0.53, h * 0.92, w * 0.53, h * 0.98).stroke(c, 2.2);
    [['P', 0.24, 0.17], ['Q', 0.76, 0.17], ['R', 0.24, 0.67], ['S', 0.76, 0.67]].forEach(([l, p, q]) => g.text(w * p, h * q, l, 14, c, { bold: 1 }));
    [['A', A[0] - 10, A[1]], ['B', B[0], B[1] - 11], ['C', Cc[0] + 10, Cc[1]], ['D', D[0], D[1] + 12]].forEach(([l, p, q]) => g.text(p, q, l, 11, '#5b6270'));
  } },

  /* ---------------- Magnetism & EMI ---------------- */
  dotout: { ch: 'magnet', name: 'Field out of page (⊙)', w: 34, h: 34, lock: 1, kw: 'dot out of plane B', draw: (g, w, h, C, c) => { g.circle(w / 2, h / 2, w / 2 - 1).stroke(c, 0.8); g.circle(w / 2, h / 2, w * 0.12).fill(c); } },
  crossin: { ch: 'magnet', name: 'Field into page (⊗)', w: 34, h: 34, lock: 1, kw: 'cross into plane B', draw: (g, w, h, C, c) => { const k = w * 0.32; g.circle(w / 2, h / 2, w / 2 - 1).line(w / 2 - k, h / 2 - k, w / 2 + k, h / 2 + k).line(w / 2 - k, h / 2 + k, w / 2 + k, h / 2 - k).stroke(c, 0.8); } },
  barmagnet: { ch: 'magnet', name: 'Bar magnet', w: 170, h: 50, kw: 'north south poles', draw: (g, w, h, C) => { g.rect(0, 0, w / 2, h).fill(C('#e5302f'), 1).rect(w / 2, 0, w / 2, h).fill(C('#1e5eff'), 1); g.text(w * 0.25, h / 2, 'N', h * 0.5, '#ffffff', { bold: 1 }).text(w * 0.75, h / 2, 'S', h * 0.5, '#ffffff', { bold: 1 }); } },
  solenoid: { ch: 'magnet', name: 'Solenoid', w: 220, h: 90, kw: 'coil electromagnet turns', draw: (g, w, h, C, c) => { for (let i = 0; i < 10; i++) g.ellipse(w * (0.14 + i * 0.08), h / 2, w * 0.03, h * 0.42); g.stroke(c, 0.8); g.line(0, h * 0.92, w * 0.14, h * 0.92).line(w * 0.86, h * 0.92, w, h * 0.92).stroke(c, 0.8); } },
  wirefield: { ch: 'magnet', name: 'Field around a wire', w: 130, h: 190, kw: 'straight conductor right hand thumb rule circular', draw: (g, w, h, C, c) => { const bc = C('#1e5eff'); [0.3, 0.52, 0.74].forEach(k => { g.ellipse(w / 2, h * k, w * 0.42, h * 0.06).stroke(bc, 0.6); g.head(w / 2 - 6, h * k + h * 0.06, w / 2 + 6, h * k + h * 0.06, bc, 8); }); g.arrow(w / 2, h, w / 2, 0, C('#e5302f'), 1.2, 14); g.text(w / 2 + 14, h * 0.08, 'I', 14, C('#e5302f'), { bold: 1 }); g.text(w * 0.95, h * 0.3, 'B', 13, bc, { bold: 1 }); } },
  loopcoil: { ch: 'magnet', name: 'Current loop', w: 170, h: 120, kw: 'circular coil ring', draw: (g, w, h, C, c) => { g.ellipse(w / 2, h * 0.55, w * 0.42, h * 0.3).stroke(c); g.head(w / 2 - 8, h * 0.85, w / 2 + 8, h * 0.85, c); g.arrow(w / 2, h * 0.55, w / 2, h * 0.02, C('#1e5eff'), 0.8, 10); g.text(w / 2 + 12, h * 0.06, 'B', 13, C('#1e5eff'), { bold: 1 }); } },
  transformer: { ch: 'magnet', name: 'Transformer', w: 170, h: 120, kw: 'primary secondary core step up down', draw: (g, w, h, C, c) => { g.rect(w * 0.3, h * 0.08, w * 0.4, h * 0.84).stroke(c, 0.8); g.rect(w * 0.42, h * 0.24, w * 0.16, h * 0.52).stroke(c, 0.8); const cc = C('#e5302f'); for (let i = 0; i < 5; i++) { g.ellipse(w * 0.3, h * (0.24 + i * 0.13), w * 0.08, h * 0.04); g.ellipse(w * 0.7, h * (0.24 + i * 0.13), w * 0.08, h * 0.04); } g.stroke(cc, 0.7); g.text(w * 0.1, h / 2, 'Nₚ', 13, c).text(w * 0.9, h / 2, 'Nₛ', 13, c); } },

  /* ---------------- Semiconductors ---------------- */
  diode: { ch: 'semi', name: 'p-n junction diode', w: 130, h: 50, kw: 'rectifier', draw: (g, w, h, C, c) => { g.line(0, h / 2, w * 0.38, h / 2).line(w * 0.6, h / 2, w, h / 2).line(w * 0.6, h * 0.12, w * 0.6, h * 0.88).stroke(c); g.poly([[w * 0.38, h * 0.12], [w * 0.38, h * 0.88], [w * 0.6, h / 2]], true).fill(c, 1); } },
  zener: { ch: 'semi', name: 'Zener diode', w: 130, h: 50, kw: 'breakdown regulator', draw: (g, w, h, C, c) => { g.line(0, h / 2, w * 0.38, h / 2).line(w * 0.6, h / 2, w, h / 2).poly([[w * 0.54, h * 0.02], [w * 0.6, h * 0.12], [w * 0.6, h * 0.88], [w * 0.66, h * 0.98]]).stroke(c); g.poly([[w * 0.38, h * 0.12], [w * 0.38, h * 0.88], [w * 0.6, h / 2]], true).fill(c, 1); } },
  led: { ch: 'semi', name: 'LED', w: 130, h: 70, kw: 'light emitting diode', draw: (g, w, h, C, c) => { const y = h * 0.62, t = h * 0.3; g.line(0, y, w * 0.38, y).line(w * 0.6, y, w, y).line(w * 0.6, y - t, w * 0.6, y + t).stroke(c); g.poly([[w * 0.38, y - t], [w * 0.38, y + t], [w * 0.6, y]], true).fill(c, 1); const oc = C('#e69500'); g.arrow(w * 0.48, h * 0.22, w * 0.6, h * 0.02, oc, 0.6, 8).arrow(w * 0.58, h * 0.25, w * 0.7, h * 0.05, oc, 0.6, 8); } },
  photodiode: { ch: 'semi', name: 'Photodiode', w: 130, h: 70, kw: 'light sensor', draw: (g, w, h, C, c) => { const y = h * 0.62, t = h * 0.3; g.line(0, y, w * 0.38, y).line(w * 0.6, y, w, y).line(w * 0.6, y - t, w * 0.6, y + t).stroke(c); g.poly([[w * 0.38, y - t], [w * 0.38, y + t], [w * 0.6, y]], true).fill(c, 1); const oc = C('#e69500'); g.arrow(w * 0.3, h * 0.02, w * 0.42, h * 0.22, oc, 0.6, 8).arrow(w * 0.4, h * 0.05, w * 0.52, h * 0.25, oc, 0.6, 8); } },
  solarcell: { ch: 'semi', name: 'Solar cell', w: 130, h: 80, kw: 'photovoltaic', draw: (g, w, h, C, c) => { const y = h * 0.66, t = h * 0.26; g.line(0, y, w * 0.38, y).line(w * 0.6, y, w, y).line(w * 0.6, y - t, w * 0.6, y + t).stroke(c); g.poly([[w * 0.38, y - t], [w * 0.38, y + t], [w * 0.6, y]], true).fill(c, 1); g.circle(w * 0.49, y, h * 0.33).stroke(c, 0.6); const oc = C('#e69500'); g.arrow(w * 0.18, h * 0.02, w * 0.32, h * 0.2, oc, 0.6, 8); } },
  npn: { ch: 'semi', name: 'npn transistor', w: 90, h: 110, kw: 'BJT amplifier', draw: (g, w, h, C, c) => { g.line(0, h / 2, w * 0.38, h / 2).line(w * 0.38, h * 0.3, w * 0.38, h * 0.7).stroke(c, 1.6); g.poly([[w * 0.38, h * 0.4], [w * 0.72, h * 0.2], [w * 0.72, 0]]).poly([[w * 0.38, h * 0.6], [w * 0.72, h * 0.8], [w * 0.72, h]]).stroke(c); g.head(w * 0.5, h * 0.67, w * 0.7, h * 0.79, c, 11); g.circle(w * 0.52, h / 2, w * 0.4).stroke(c, 0.5); g.text(w * 0.88, h * 0.08, 'C', 11, c).text(w * 0.06, h * 0.4, 'B', 11, c).text(w * 0.88, h * 0.92, 'E', 11, c); } },
  pnp: { ch: 'semi', name: 'pnp transistor', w: 90, h: 110, kw: 'BJT', draw: (g, w, h, C, c) => { g.line(0, h / 2, w * 0.38, h / 2).line(w * 0.38, h * 0.3, w * 0.38, h * 0.7).stroke(c, 1.6); g.poly([[w * 0.38, h * 0.4], [w * 0.72, h * 0.2], [w * 0.72, 0]]).poly([[w * 0.38, h * 0.6], [w * 0.72, h * 0.8], [w * 0.72, h]]).stroke(c); g.head(w * 0.66, h * 0.76, w * 0.43, h * 0.63, c, 11); g.circle(w * 0.52, h / 2, w * 0.4).stroke(c, 0.5); g.text(w * 0.88, h * 0.08, 'C', 11, c).text(w * 0.06, h * 0.4, 'B', 11, c).text(w * 0.88, h * 0.92, 'E', 11, c); } },
  pnjunction: { ch: 'semi', name: 'p-n junction (depletion)', w: 220, h: 110, kw: 'holes electrons depletion region barrier', draw: (g, w, h, C, c) => {
    g.rect(0, h * 0.15, w * 0.44, h * 0.8).fill(C('#ffd6d6'), 0.8).rect(w * 0.56, h * 0.15, w * 0.44, h * 0.8).fill(C('#d6e4ff'), 0.8).rect(w * 0.44, h * 0.15, w * 0.12, h * 0.8).fill('#eceef1', 1);
    g.rect(0, h * 0.15, w, h * 0.8).stroke(c, 0.7);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.circle(w * (0.06 + i * 0.1), h * (0.32 + j * 0.24), 4).fill('#ffffff', 1, C('#e5302f'), 0.6); g.circle(w * (0.64 + i * 0.1), h * (0.32 + j * 0.24), 3.5).fill(C('#1e5eff'), 1); }
    g.text(w * 0.22, h * 0.07, 'p', 14, c, { bold: 1 }).text(w * 0.78, h * 0.07, 'n', 14, c, { bold: 1 }).text(w / 2, h * 0.07, 'depletion', 10, '#5b6270');
  } },
  and: { ch: 'semi', name: 'AND gate', w: 120, h: 70, kw: 'logic', draw: (g, w, h, C, c) => { g.line(0, h * 0.3, w * 0.25, h * 0.3).line(0, h * 0.7, w * 0.25, h * 0.7).line(w * 0.5 + h * 0.4, h / 2, w, h / 2).M(w * 0.25, h * 0.1).L(w * 0.5, h * 0.1).arc(w * 0.5, h / 2, h * 0.4, h * 0.4, -PI / 2, PI / 2, true).L(w * 0.25, h * 0.9).Z().stroke(c); } },
  or: { ch: 'semi', name: 'OR gate', w: 120, h: 70, kw: 'logic', draw: (g, w, h, C, c) => { g.line(0, h * 0.3, w * 0.29, h * 0.3).line(0, h * 0.7, w * 0.29, h * 0.7).line(w * 0.76, h / 2, w, h / 2).M(w * 0.22, h * 0.1).Q(w * 0.55, h * 0.1, w * 0.76, h * 0.5).Q(w * 0.55, h * 0.9, w * 0.22, h * 0.9).Q(w * 0.36, h * 0.5, w * 0.22, h * 0.1).Z().stroke(c); } },
  not: { ch: 'semi', name: 'NOT gate', w: 120, h: 70, kw: 'logic inverter', draw: (g, w, h, C, c) => { g.line(0, h / 2, w * 0.25, h / 2).line(w * 0.73, h / 2, w, h / 2).poly([[w * 0.25, h * 0.15], [w * 0.25, h * 0.85], [w * 0.66, h / 2]], true).circle(w * 0.695, h / 2, w * 0.03).stroke(c); } },
  nand: { ch: 'semi', name: 'NAND gate', w: 130, h: 70, kw: 'logic universal', draw: (g, w, h, C, c) => { const e = w * 0.46 + h * 0.4; g.line(0, h * 0.3, w * 0.23, h * 0.3).line(0, h * 0.7, w * 0.23, h * 0.7).line(e + w * 0.06, h / 2, w, h / 2).M(w * 0.23, h * 0.1).L(w * 0.46, h * 0.1).arc(w * 0.46, h / 2, h * 0.4, h * 0.4, -PI / 2, PI / 2, true).L(w * 0.23, h * 0.9).Z().circle(e + w * 0.03, h / 2, w * 0.03).stroke(c); } },
  nor: { ch: 'semi', name: 'NOR gate', w: 130, h: 70, kw: 'logic universal', draw: (g, w, h, C, c) => { g.line(0, h * 0.3, w * 0.27, h * 0.3).line(0, h * 0.7, w * 0.27, h * 0.7).line(w * 0.77, h / 2, w, h / 2).M(w * 0.2, h * 0.1).Q(w * 0.5, h * 0.1, w * 0.7, h * 0.5).Q(w * 0.5, h * 0.9, w * 0.2, h * 0.9).Q(w * 0.33, h * 0.5, w * 0.2, h * 0.1).Z().circle(w * 0.735, h / 2, w * 0.03).stroke(c); } },

  /* ---------------- Mechanics ---------------- */
  block: { ch: 'mech', name: 'Block (m)', w: 100, h: 70, kw: 'mass box body', draw: (g, w, h, C, c) => { g.rect(0, 0, w, h).fill(C('#dde2ea'), 1, c, 0.8); g.text(w / 2, h / 2, 'm', h * 0.34, c); } },
  incline: { ch: 'mech', name: 'Inclined plane', w: 230, h: 130, kw: 'ramp slope wedge theta', draw: (g, w, h, C, c) => { g.poly([[0, h * 0.9], [w, h * 0.9], [w, 0]], true).fill(C('#e8ebf0'), 1, c, 0.8); g.hatch(0, h * 0.9, w, h * 0.9, 1, 8, 14).stroke(c, 0.5); g.arc(0, h * 0.9, w * 0.18, w * 0.18, -Math.atan2(h * 0.9, w), 0).stroke(c, 0.6); g.text(w * 0.24, h * 0.82, 'θ', 14, c); } },
  pulley: { ch: 'mech', name: 'Pulley', w: 100, h: 150, kw: 'atwood rope', draw: (g, w, h, C, c) => { const r = w * 0.3, y = h * 0.34; g.line(w * 0.12, 9, w * 0.88, 9).stroke(c); g.hatch(w * 0.12, 9, w * 0.88, 9, -1, 7, 12).stroke(c, 0.5); g.line(w / 2, 9, w / 2, y).line(w / 2 - r, y, w / 2 - r, h).line(w / 2 + r, y, w / 2 + r, h).stroke(c, 0.8); g.circle(w / 2, y, r).fill(C('#dde2ea'), 1, c, 0.9); g.circle(w / 2, y, 4).fill(c); } },
  spring: { ch: 'mech', name: 'Spring', w: 170, h: 40, kw: 'k elastic coil', draw: (g, w, h, C, c) => g.zig(0, h / 2, w, h / 2, 9, h * 0.38, 0.08).stroke(c) },
  ground: { ch: 'mech', name: 'Ground / surface', w: 220, h: 24, kw: 'floor ceiling wall hatch', draw: (g, w, h, C, c) => { g.line(0, h * 0.25, w, h * 0.25).stroke(c); g.hatch(0, h * 0.25, w, h * 0.25, 1, h * 0.6, 12).stroke(c, 0.5); } },
  pendulum: { ch: 'mech', name: 'Pendulum', w: 150, h: 210, kw: 'simple harmonic bob string', draw: (g, w, h, C, c) => { const L = h * 0.78, a = 0.42, bx = w / 2 + Math.sin(a) * L, by = 4 + Math.cos(a) * L; g.line(w * 0.18, 10, w * 0.82, 10).stroke(c); g.hatch(w * 0.18, 10, w * 0.82, 10, -1, 7, 12).stroke(c, 0.5); g.line(w / 2, 4, w / 2, h * 0.86).stroke(c, 0.5, { dash: 1 }); g.line(w / 2, 4, bx, by).stroke(c, 0.8); g.arc(w / 2, 4, h * 0.2, h * 0.2, PI / 2 - a, PI / 2).stroke(c, 0.6); g.text(w / 2 + h * 0.07, h * 0.27, 'θ', 13, c); g.text((w / 2 + bx) / 2 + 10, by / 2, 'l', 13, c); g.circle(bx, by, w * 0.09).fill(C('#5b6270'), 1, c, 0.6); } },
  fbd: { ch: 'mech', name: 'Free-body diagram', w: 210, h: 210, lock: 1, kw: 'forces normal weight friction', draw: (g, w, h, C, c) => { const s = w * 0.3, f = C('#e5302f'); g.rect(w / 2 - s / 2, h / 2 - s / 2, s, s).fill(C('#dde2ea'), 1, c, 0.8); g.arrow(w / 2, h / 2 - s / 2, w / 2, h * 0.06, f, 0.9).arrow(w / 2, h / 2 + s / 2, w / 2, h * 0.94, f, 0.9).arrow(w / 2 + s / 2, h / 2, w * 0.94, h / 2, f, 0.9).arrow(w / 2 - s / 2, h / 2, w * 0.06, h / 2, f, 0.9); g.text(w / 2 + 14, h * 0.07, 'N', 13, f, { align: 'left' }).text(w / 2 + 14, h * 0.93, 'mg', 13, f, { align: 'left' }).text(w * 0.92, h / 2 - 14, 'F', 13, f).text(w * 0.08, h / 2 - 14, 'f', 13, f); } },
  projectile: { ch: 'mech', name: 'Projectile motion', w: 300, h: 190, kw: 'parabola range height trajectory', draw: (g, w, h, C, c) => { const ox = w * 0.08, oy = h * 0.86, R = w * 0.82, H = h * 0.66; axes(g, ox, oy, w * 0.98, h * 0.04, c, 'x', 'y', 12); g.fn(t => [ox + t * R, oy - 4 * H * t * (1 - t)], 0, 1, 60).stroke(C('#1e5eff'), 0.9); const ang = Math.atan2(4 * H, R); g.arrow(ox, oy, ox + Math.cos(ang) * w * 0.18, oy - Math.sin(ang) * w * 0.18, C('#e5302f'), 0.9); g.text(ox + Math.cos(ang) * w * 0.2 + 10, oy - Math.sin(ang) * w * 0.2, 'u', 13, C('#e5302f')); g.arc(ox, oy, w * 0.07, w * 0.07, -ang, 0).stroke(c, 0.5); g.text(ox + w * 0.1, oy - 8, 'θ', 12, c); g.line(ox + R / 2, oy, ox + R / 2, oy - H).stroke(c, 0.5, { dash: 1 }); g.text(ox + R / 2 + 10, oy - H / 2, 'H', 12, c); g.text(ox + R / 2, oy + 14, 'R', 12, c); } },
  springmass: { ch: 'mech', name: 'Spring–mass system', w: 270, h: 90, kw: 'SHM oscillator k m', draw: (g, w, h, C, c) => { g.line(w * 0.04, h * 0.05, w * 0.04, h * 0.82).stroke(c); g.hatch(w * 0.04, h * 0.05, w * 0.04, h * 0.82, 1, 7, 10).stroke(c, 0.5); g.zig(w * 0.04, h * 0.5, w * 0.6, h * 0.5, 7, h * 0.14, 0.06).stroke(c); g.rect(w * 0.6, h * 0.22, w * 0.26, h * 0.6).fill(C('#dde2ea'), 1, c, 0.8); g.text(w * 0.73, h * 0.52, 'm', 15, c); g.line(w * 0.04, h * 0.82, w, h * 0.82).stroke(c); g.hatch(w * 0.04, h * 0.82, w, h * 0.82, 1, 7, 14).stroke(c, 0.5); g.text(w * 0.32, h * 0.22, 'k', 13, c); } },
  vectoradd: { ch: 'mech', name: 'Vector addition', w: 220, h: 150, kw: 'parallelogram law resultant triangle', draw: (g, w, h, C, c) => { const o = [w * 0.05, h * 0.92], A = [w * 0.62, h * 0.92], B = [w * 0.38, h * 0.12], Rr = [w * 0.95, h * 0.12]; g.arrow(...o, ...A, C('#1e5eff'), 0.9).arrow(...o, ...B, C('#12a150'), 0.9).arrow(...o, ...Rr, C('#e5302f'), 1); g.line(...A, ...Rr).line(...B, ...Rr).stroke(c, 0.5, { dash: 1 }); g.text(w * 0.34, h * 0.99, 'A', 13, C('#1e5eff')).text(w * 0.16, h * 0.45, 'B', 13, C('#12a150')).text(w * 0.58, h * 0.4, 'R', 13, C('#e5302f')); } },

  /* ---------------- Heat, waves & gravitation ---------------- */
  piston: { ch: 'thermo', name: 'Gas in cylinder', w: 140, h: 170, kw: 'piston ideal gas thermodynamics', draw: (g, w, h, C, c) => { g.poly([[w * 0.15, h * 0.08], [w * 0.15, h * 0.95], [w * 0.85, h * 0.95], [w * 0.85, h * 0.08]]).stroke(c, 1.2); g.rect(w * 0.16, h * 0.34, w * 0.68, h * 0.07).fill(C('#9aa1ad'), 1, c, 0.6); g.line(w / 2, h * 0.34, w / 2, 0).stroke(c, 1.2); [[0.3, 0.52], [0.55, 0.48], [0.72, 0.6], [0.4, 0.68], [0.25, 0.82], [0.62, 0.8], [0.48, 0.9], [0.76, 0.88], [0.35, 0.58]].forEach(([p, q]) => g.circle(w * p, h * q, 3.5)); g.fill(C('#1e5eff'), 1); } },
  pvcycle: { ch: 'thermo', name: 'PV diagram (cycle)', w: 260, h: 200, kw: 'carnot isothermal adiabatic work', draw: (g, w, h, C, c) => { const ink = C(INK); axes(g, w * 0.1, h * 0.88, w * 0.97, h * 0.04, ink, 'V', 'P', 13); const A = [w * 0.22, h * 0.16], B = [w * 0.5, h * 0.36], Cc = [w * 0.85, h * 0.7], D = [w * 0.42, h * 0.58], col = C('#1e5eff'); g.M(...A).Q(w * 0.3, h * 0.33, ...B).Q(w * 0.62, h * 0.6, ...Cc).Q(w * 0.55, h * 0.64, ...D).Q(w * 0.27, h * 0.48, ...A).stroke(col, 0.9); [[A, 'A', -10, -8], [B, 'B', 10, -8], [Cc, 'C', 10, 8], [D, 'D', -10, 10]].forEach(([p, l, dx, dy]) => g.text(p[0] + dx, p[1] + dy, l, 12, ink)); g.head(w * 0.33, h * 0.27, w * 0.37, h * 0.3, col, 9); } },
  sinewave: { ch: 'thermo', name: 'Sine wave (λ, A)', w: 270, h: 110, kw: 'wavelength amplitude transverse', draw: (g, w, h, C, c) => { const cy = h * 0.58, A = h * 0.3, col = C('#1e5eff'); g.line(0, cy, w, cy).stroke('#9aa1ad', 0.5, { dash: 1 }); g.fn(t => [t * w, cy - Math.sin(t * 4 * PI) * A], 0, 1, 120).stroke(col, 0.9); g.arrow(w * 0.375, h * 0.12, w * 0.125, h * 0.12, c, 0.6, 8, { both: true }); g.text(w * 0.25, h * 0.03 + 2, 'λ', 13, c); g.arrow(w * 0.125, cy, w * 0.125, cy - A, c, 0.5, 7); g.text(w * 0.09, cy - A / 2, 'A', 12, c); } },
  standing: { ch: 'thermo', name: 'Standing wave', w: 270, h: 90, kw: 'nodes antinodes string harmonics', draw: (g, w, h, C, c) => { const cy = h / 2, A = h * 0.36, col = C('#1e5eff'); g.line(w * 0.03, 0, w * 0.03, h).line(w * 0.97, 0, w * 0.97, h).stroke(c, 1.4); g.fn(t => [w * 0.03 + t * w * 0.94, cy - Math.sin(t * 3 * PI) * A], 0, 1, 90).stroke(col, 0.9); g.fn(t => [w * 0.03 + t * w * 0.94, cy + Math.sin(t * 3 * PI) * A], 0, 1, 90).stroke(col, 0.7, { dash: 1 }); [1, 2].forEach(k => g.text(w * 0.03 + k / 3 * w * 0.94, cy + 12, 'N', 10, c)); [0.5, 1.5, 2.5].forEach(k => g.text(w * 0.03 + k / 3 * w * 0.94, h * 0.02 + 4, 'A', 10, c)); } },
  orbit: { ch: 'thermo', name: 'Planetary orbit', w: 270, h: 170, kw: 'kepler ellipse sun focus gravitation satellite', draw: (g, w, h, C, c) => { const rx = w * 0.44, ry = h * 0.38, f = Math.sqrt(rx * rx - ry * ry); g.ellipse(w / 2, h / 2, rx, ry).stroke(c, 0.7); g.circle(w / 2 + f, h / 2, h * 0.1).fill(C('#ffb000'), 1, C('#e69500'), 0.6); g.circle(w / 2 - rx, h / 2, h * 0.05).fill(C('#1e5eff'), 1); g.head(w / 2 - 6, h / 2 - ry, w / 2 + 8, h / 2 - ry, c, 9); g.text(w / 2 + f, h / 2 + h * 0.18, 'Sun', 11, c); } },
  thermometer: { ch: 'thermo', name: 'Thermometer', w: 36, h: 170, kw: 'temperature', draw: (g, w, h, C, c) => { const r = w * 0.38; g.M(w * 0.32, h - r * 1.6).L(w * 0.32, w * 0.2).arc(w / 2, w * 0.2, w * 0.18, w * 0.18, PI, 2 * PI, true).L(w * 0.68, h - r * 1.6).stroke(c, 0.8); g.circle(w / 2, h - r, r).fill(C('#e5302f'), 1, c, 0.6); g.rect(w * 0.42, h * 0.35, w * 0.16, h * 0.6 - r).fill(C('#e5302f'), 1); for (let i = 0; i < 6; i++) g.line(w * 0.68, h * (0.15 + i * 0.12), w * 0.86, h * (0.15 + i * 0.12)); g.stroke(c, 0.4); } },
};

export function symOps(it) {
  const def = SYMS[it.kind]; if (!def) return [];
  const g = builder(it), col = it.color || INK, C = nat => (it.nat === false ? col : nat);
  def.draw(g, it.w, it.h, C, col);
  return g.ops;
}
