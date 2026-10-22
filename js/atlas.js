'use strict';
// =============================================================================================
// An atlas of loss surfaces.
// A raised-relief model of a seeded loss L(θ1, θ2), lit and printed like a Swiss map sheet and walked
// by cohorts of optimizers. Each plate sets up one phenomenon from the optimization literature on its
// own sheet. WebGL2 for the relief, the ink and the particles; Canvas2D for the printed layer and labels.
// =============================================================================================
const PHONE = Math.min(innerWidth, innerHeight) < 520;
const RMQ = matchMedia('(prefers-reduced-motion: reduce)');
let REDUCED = RMQ.matches;          // plates appear built, the camera cuts instead of gliding, nothing turns by itself
RMQ.addEventListener('change', (e) => { REDUCED = e.matches; });
const INK = '#24262b', WATER_INK = '#2c6894';
const BG = [218 / 255, 220 / 255, 213 / 255];
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sq5 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (t * (t * 6 - 15) + 10));
const lerp = (a, b, t) => a + (b - a) * t;
const hexRGB = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const fmt = (v, d) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);

// ---------------------------------------------------------------------------------------------
// seeded gradient noise and ridged fBm (the fine texture of every sheet)
// ---------------------------------------------------------------------------------------------
const PERM = new Uint8Array(512), NGX = new Float64Array(256), NGY = new Float64Array(256);
function seedNoise(R) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
  for (let i = 0; i < 256; i++) { const a = R() * Math.PI * 2; NGX[i] = Math.cos(a); NGY[i] = Math.sin(a); }
}
function perlin(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const X = xi & 255, Y = yi & 255;
  const a = PERM[X] + Y, b = PERM[X + 1] + Y;
  const g00 = PERM[a], g01 = PERM[a + 1], g10 = PERM[b], g11 = PERM[b + 1];
  const n00 = NGX[g00] * xf + NGY[g00] * yf;
  const n10 = NGX[g10] * (xf - 1) + NGY[g10] * yf;
  const n01 = NGX[g01] * xf + NGY[g01] * (yf - 1);
  const n11 = NGX[g11] * (xf - 1) + NGY[g11] * (yf - 1);
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const a0 = n00 + (n10 - n00) * u, a1 = n01 + (n11 - n01) * u;
  return a0 + (a1 - a0) * v;
}
// ridged multifractal (Musgrave): sharp crests, smooth valleys. |p| and the octave weight are softened so the crests
// stay crisp to the eye but the surface has no creases: Newton steps and finite-difference Hessians stay honest.
function ridged(x, y) {
  let sum = 0, amp = 0.5, f = 1, w = 1;
  for (let o = 0; o < 4; o++) {
    const p = perlin(x * f + o * 19.13, y * f - o * 7.71);
    let n = 1 - (Math.sqrt(p * p + 0.0016) - 0.04) * 1.6;
    if (n < 0) n = 0;
    n *= n;
    sum += n * amp * w;
    w = n * 1.5; if (w > 0.8) w = w < 1.2 ? w - (w - 0.8) * (w - 0.8) / 0.8 : 1;   // a C¹ clamp: no creases
    f *= 2.07; amp *= 0.5;
  }
  return sum;
}

// ---------------------------------------------------------------------------------------------
// the loss surface L(θ1, θ2) on a fixed sheet [-1.6, 1.6] × [-1, 1]: a bowl, anisotropic Gaussian
// wells and hills, an optional curved ravine and mesa, a plate-specific analytic term, and a
// low-amplitude ridged texture that is calmed inside designed features.
// ---------------------------------------------------------------------------------------------
const X0 = -1.6, X1 = 1.6, Y0 = -1, Y1 = 1, MAPW = X1 - X0, MAPH = Y1 - Y0;
let BX = 0, BY = 0, BK = 0.2, BK4 = 0.022;
const MAXF = 48;
const FX = new Float64Array(MAXF), FY = new Float64Array(MAXF), FAMP = new Float64Array(MAXF);
const FA = new Float64Array(MAXF), FB = new Float64Array(MAXF), FC = new Float64Array(MAXF);
let NF = 0, SHi = -1, FLi = -1;
let RVon = false, RVcx = 0, RVcy = 0, RVR = 1, RVmx = 1, RVmy = 0, RVhalf = 1, RVsgn = 1, RViw2 = 1, RVw = 0.05, RVd0 = 0, RVd1 = 0;
let PLon = false, PLcx = 0, PLcy = 0, PLc = 1, PLs = 0, PLa = 0.3, PLb = 0.2, PLe = 0.1, PLtop = 0, PLtx = 0, PLty = 0, PLwarp = 0.1;
let NA = 0.045, NFQ = 2.2, NOX = 0, NOY = 0, NMEAN = 0.4, noiseOn = 1;
let Lofs = 0, Lsc = 1, Lbase = 0.03;
let EXTRA = null, EXCALM = 0, SYMM = 0, DETILT = 0, XSC = 1;
let rvV = 0, rvM = 0;
let FEAT = {};

function addGauss(x, y, amp, sa, sb, ang) {
  if (NF >= MAXF) return -1;
  const c = Math.cos(ang), s = Math.sin(ang), ia = 1 / (sa * sa), ib = 1 / (sb * sb);
  FX[NF] = x; FY[NF] = y; FAMP[NF] = amp;
  FA[NF] = c * c * ia + s * s * ib; FB[NF] = c * s * (ia - ib); FC[NF] = s * s * ia + c * c * ib;
  return NF++;
}
function ravine(x, y) {
  rvV = 0; rvM = 0;
  const vx = x - RVcx, vy = y - RVcy;
  const d = Math.sqrt(vx * vx + vy * vy) - RVR;
  const dd = d * d * RViw2;
  if (dd > 25) return;
  const phi = Math.atan2(RVmx * vy - RVmy * vx, RVmx * vx + RVmy * vy) * RVsgn;
  const u = (phi + RVhalf) / (2 * RVhalf);            // 0 at the head, 1 at the mouth
  const win = sq5((u + 0.07) / 0.17) * sq5((1.06 - u) / 0.12);
  if (win <= 0) return;
  const g = Math.exp(-dd) * win;
  rvV = -g * (RVd0 + RVd1 * u);
  rvM = g;
}
function plateauMask(x, y) {
  const dx = x - PLcx, dy = y - PLcy;
  const a = (PLc * dx + PLs * dy) / PLa, b = (PLc * dy - PLs * dx) / PLb;
  const r2 = a * a + b * b;
  if (r2 > 2.6) return 0;
  const rho = Math.sqrt(r2) + PLwarp * (perlin(x * 1.7 + 41.3, y * 1.7 - 17.9) + 0.45 * perlin(x * 4.1 - 7.7, y * 4.1 + 3.3));
  return 1 - sq5((rho - 1 + PLe) / (2 * PLe));
}
function plateauRho(x, y) {
  const dx = x - PLcx, dy = y - PLcy, a = (PLc * dx + PLs * dy) / PLa, b = (PLc * dy - PLs * dx) / PLb;
  return Math.sqrt(a * a + b * b);
}
function Lraw(x, y) {
  const bx = x - BX, by = y - BY;
  const r2 = bx * bx + by * by;
  let z = BK * r2 + BK4 * r2 * r2, calm = 0;
  for (let i = 0; i < NF; i++) {
    const ex = x - FX[i], ey = y - FY[i];
    const q = FA[i] * ex * ex + 2 * FB[i] * ex * ey + FC[i] * ey * ey;
    if (q < 60) {
      const e = Math.exp(-0.5 * q);
      z += FAMP[i] * e;
      if (i === SHi) { if (e > calm) calm = e; } else if (i === FLi) { if (0.7 * e > calm) calm = 0.7 * e; }
    }
  }
  if (RVon) { ravine(x, y); z += rvV; if (rvM > calm) calm = rvM; }
  if (EXTRA !== null) { z += EXTRA(x, y); if (EXCALM > calm) calm = EXCALM; }
  let pm = 0;
  if (PLon) { pm = plateauMask(x, y); if (pm > calm) calm = pm; }
  const nf = 1 - 0.88 * calm;              // calm ≥ 1/0.88 switches the texture off exactly (used round degenerate minima)
  if (noiseOn && NA > 0 && pm < 1 && nf > 0) z += NA * (ridged(x * NFQ + NOX, y * NFQ + NOY) - NMEAN) * nf * (1 - pm);
  if (pm > 0) z += (PLtop + PLtx * (x - PLcx) + PLty * (y - PLcy) - z) * pm;
  return z;
}
// SYMM 1: point symmetry L(θ) = L(−θ); SYMM 2: mirror symmetry in θ1
function Lpre(x, y) { x *= XSC; return SYMM === 0 ? Lraw(x, y) : SYMM === 1 ? 0.5 * (Lraw(x, y) + Lraw(-x, -y)) : 0.5 * (Lraw(x, y) + Lraw(-x, y)); }
function L(x, y) { return (Lpre(x, y) - Lofs) * Lsc + Lbase; }

// central differences on the analytic function
const HD = 1e-4;
let gX = 0, gY = 0, gL = 0;
function grad(x, y) {
  const a = L(x + HD, y), b = L(x - HD, y), c = L(x, y + HD), d = L(x, y - HD);
  gX = (a - b) / (2 * HD); gY = (c - d) / (2 * HD); gL = 0.25 * (a + b + c + d);
}
let hXX = 0, hXY = 0, hYY = 0;
function hess(x, y) {
  const h = 1e-3, f0 = L(x, y);
  hXX = (L(x + h, y) - 2 * f0 + L(x - h, y)) / (h * h);
  hYY = (L(x, y + h) - 2 * f0 + L(x, y - h)) / (h * h);
  hXY = (L(x + h, y + h) - L(x + h, y - h) - L(x - h, y + h) + L(x - h, y - h)) / (4 * h * h);
}
function eig2() { // eigenvalues of the current Hessian, ascending
  const tr = hXX + hYY, det = hXX * hYY - hXY * hXY, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  return [tr / 2 - disc, tr / 2 + disc];
}
function lamMax(x, y) { hess(x, y); const tr = hXX + hYY, det = hXX * hYY - hXY * hXY; return tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)); }
function newtonCrit(x, y, maxIt) {
  for (let it = 0; it < maxIt; it++) {
    grad(x, y); hess(x, y);
    const det = hXX * hYY - hXY * hXY;
    if (!(Math.abs(det) > 1e-10)) return null;
    let sx = (hYY * gX - hXY * gY) / det, sy = (hXX * gY - hXY * gX) / det;
    const sl = Math.hypot(sx, sy);
    if (sl > 0.04) { sx *= 0.04 / sl; sy *= 0.04 / sl; }
    x -= sx; y -= sy;
    if (sl < 1e-11) break;
  }
  grad(x, y);
  return Math.hypot(gX, gY) < 1e-6 * Math.max(1, Lsc) && Number.isFinite(x) ? [x, y] : null;
}
function critAt(x, y, it = 30) { // refine to a critical point and classify it
  const p = newtonCrit(x, y, it); if (!p) return null;
  hess(p[0], p[1]); const [l1, l2] = eig2();
  return { x: p[0], y: p[1], L: L(p[0], p[1]), l1, l2, type: l1 > 0 ? 'min' : l2 < 0 ? 'max' : 'saddle' };
}

function resetTerrain(R) {
  NF = 0; SHi = FLi = -1; RVon = PLon = false; noiseOn = 1; FEAT = {};
  EXTRA = null; EXCALM = 0; SYMM = 0; DETILT = 0; XSC = 1;
  Lofs = 0; Lsc = 1; Lbase = 0;
  BX = 0; BY = 0; BK = 0; BK4 = 0;
  seedNoise(R);
  NOX = R.range(0, 200); NOY = R.range(0, 200); NFQ = R.range(1.9, 2.4); NA = 0.045;
}
function noiseMean(R) { let s = 0; for (let k = 0; k < 3000; k++) s += ridged(R.range(-50, 50), R.range(-50, 50)); NMEAN = s / 3000; }
// scale so that the sheet spans about 1.8 units of loss, with the global minimum just above zero
function normalize(R, span = 1.8, q = 0.985) {
  Lofs = 0; Lsc = 1; Lbase = 0;
  const nx = 120, ny = 75;
  const vals = new Float64Array((nx + 1) * (ny + 1));
  let k = 0, mn = Infinity, px = 0, py = 0;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const x = X0 + MAPW * i / nx, y = Y0 + MAPH * j / ny, v = Lpre(x, y);
    vals[k++] = v; if (v < mn) { mn = v; px = x; py = y; }
  }
  const m = newtonCrit(px, py, 40);
  if (m) { const v = Lpre(m[0], m[1]); if (v < mn) mn = v; }
  vals.sort();
  Lsc = span / (vals[Math.floor(vals.length * q)] - mn);
  Lofs = mn; Lbase = R.range(0.018, 0.042);
}

// ---------------------------------------------------------------------------------------------
// the survey sheet: six landforms dealt into a 3 × 2 grid of slots, then a few extra wells
// ---------------------------------------------------------------------------------------------
function arcPt(t) { // t in [-1, 1] along the ravine arc (signed by RVsgn: t=+1 is the mouth)
  const a = Math.atan2(RVmy, RVmx) + RVsgn * t * RVhalf;
  return [RVcx + RVR * Math.cos(a), RVcy + RVR * Math.sin(a), a];
}
function ravineFloor(u) { // lowest point across the ravine at arc parameter u (0 head, 1 mouth)
  const a = Math.atan2(RVmy, RVmx) + RVsgn * (2 * u - 1) * RVhalf, ca = Math.cos(a), sa = Math.sin(a);
  let m = Infinity;
  for (let k = -6; k <= 6; k++) { const r = RVR + k * RVw * 0.4; m = Math.min(m, Lraw(RVcx + r * ca, RVcy + r * sa)); }
  return m;
}
// ravine: the mouth is the lower end; a well catches it; the floor must fall monotonically
function finishRavine() {
  const a = arcPt(-1), b = arcPt(1);
  RVsgn = Lraw(b[0], b[1]) <= Lraw(a[0], a[1]) ? 1 : -1;
  const m = arcPt(1);
  addGauss(m[0], m[1], -0.24, 0.13, 0.11, m[2]);
  RVon = true;
  for (let t = 0; t < 6; t++) {
    let mono = true, prev = ravineFloor(0.04);
    for (let q = 1; q <= 24; q++) { const f = ravineFloor(0.04 + 0.92 * q / 24); if (f > prev - 1e-4) { mono = false; break; } prev = f; }
    if (mono) break;
    RVd1 += 0.1;
  }
  FEAT.ravineHead = arcPt(-0.86); FEAT.ravineMid = arcPt(0); FEAT.ravineMouth = arcPt(1);
}
// the plateau is a terrace cut into the slope: a cut bank uphill, an escarpment downhill, a near-level floor
function mesaTop(tilt) {
  const vals = []; let gxs = 0, gys = 0;
  for (let i = -10; i <= 10; i++) for (let j = -10; j <= 10; j++) {
    const a = i / 10, b = j / 10; if (a * a + b * b > 1) continue;
    const lx = PLa * a, ly = PLb * b, x = PLcx + PLc * lx - PLs * ly, y = PLcy + PLs * lx + PLc * ly;
    vals.push(Lraw(x, y));
    gxs += Lraw(x + 1e-3, y) - Lraw(x - 1e-3, y); gys += Lraw(x, y + 1e-3) - Lraw(x, y - 1e-3);
  }
  vals.sort((p, q) => p - q);
  PLtop = vals[(vals.length * 0.88) | 0];
  const gl = Math.hypot(gxs, gys) || 1; PLtx = tilt * gxs / gl; PLty = tilt * gys / gl;
  PLon = true;
}
function sheetSurvey(R, kinds = ['flat', 'plateau', 'sharp', 'ravine', 'pass', 'hills'], o = {}) {
  resetTerrain(R);
  DETILT = 1;
  if (o.na != null) NA = o.na;
  const W = MAPW, H = MAPH, cols = 3, rows = 2, sw = W / cols, sh = H / rows;
  BX = R.range(-0.1, 0.1) * W; BY = R.range(-0.1, 0.1) * H; BK = 0.2; BK4 = 0.022;
  let order = kinds;
  for (let t = 0; t < 80; t++) {
    order = kinds.slice();
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
    if (order.indexOf('plateau') % cols !== 0) break;
  }
  for (let s = 0; s < order.length; s++) {
    const c = s % cols, r = (s / cols) | 0, k = order[s];
    const x = X0 + (c + 0.5 + R.range(-0.1, 0.1)) * sw, y = Y1 - (r + 0.5 + R.range(-0.1, 0.1)) * sh;
    if (k === 'flat') {
      FLi = addGauss(x, y, -0.62, R.range(0.36, 0.43), R.range(0.24, 0.28), R.range(0, Math.PI));
      FEAT.flat = [x, y];
    } else if (k === 'sharp') {
      SHi = addGauss(x, y, -0.95, R.range(0.057, 0.065), R.range(0.048, 0.055), R.range(0, Math.PI));
      addGauss(x, y, -0.2, R.range(0.2, 0.25), R.range(0.15, 0.19), R.range(0, Math.PI));
      FEAT.sharp = [x, y];
    } else if (k === 'pass') {
      const ang = R.range(0, Math.PI), tx = Math.cos(ang), ty = Math.sin(ang), nx = -ty, ny = tx;
      const dh = R.range(0.25, 0.3), dw = R.range(0.36, 0.42);
      addGauss(x + nx * dh, y + ny * dh, R.range(0.38, 0.46), 0.2, 0.12, ang + Math.PI / 2);
      addGauss(x - nx * dh, y - ny * dh, R.range(0.32, 0.4), 0.19, 0.12, ang + Math.PI / 2);
      addGauss(x + tx * dw, y + ty * dw, -R.range(0.3, 0.36), 0.16, 0.13, ang);
      addGauss(x - tx * dw, y - ty * dw, -R.range(0.26, 0.32), 0.15, 0.12, ang);
      FEAT.pass = { x, y, tx, ty, nx, ny };
    } else if (k === 'hills') {
      addGauss(x, y, R.range(0.5, 0.62), R.range(0.22, 0.28), R.range(0.12, 0.15), R.range(0, Math.PI));
      const oa = R.range(0, Math.PI * 2), od = R.range(0.22, 0.28);
      addGauss(x + od * Math.cos(oa), y + od * Math.sin(oa), R.range(0.26, 0.34), 0.15, 0.1, R.range(0, Math.PI));
      const fa = oa + Math.PI + R.range(-0.7, 0.7), fd = R.range(0.36, 0.42);
      const sx = clamp(x + fd * Math.cos(fa), X0 + 0.2, X1 - 0.2), sy = clamp(y + fd * Math.sin(fa), Y0 + 0.2, Y1 - 0.2);
      FEAT.spurI = addGauss(sx, sy, -0.13, 0.062, 0.054, R.range(0, Math.PI));
      FEAT.spur = [sx, sy]; FEAT.peak = [x, y];
    } else if (k === 'plateau') {
      const pa = R.range(-0.5, 0.5);
      PLcx = x; PLcy = y; PLc = Math.cos(pa); PLs = Math.sin(pa);
      PLa = Math.min(sw * 0.36, R.range(0.3, 0.36)); PLb = Math.min(sh * 0.3, R.range(0.2, 0.24));
      PLe = 0.1; PLwarp = 0.2;
      const dx = x - BX, dy = y - BY, dl = Math.hypot(dx, dy) || 1;
      PLtx = 0.035 * dx / dl; PLty = 0.035 * dy / dl;
      FEAT.plateau = [x, y];
    } else if (k === 'ravine') {
      let best = null;
      for (let t = 0; t < 60; t++) {
        const Rr = R.range(0.5, 1.0), len = R.range(0.95, 1.35), half = Math.min(1.3, len / (2 * Rr)), pm = R.range(0, Math.PI * 2);
        const ccx = x - Rr * Math.cos(pm), ccy = y - Rr * Math.sin(pm);
        let ok = true;
        for (let q = 0; q <= 16 && ok; q++) {
          const ph = pm - half + 2 * half * q / 16, ax = ccx + Rr * Math.cos(ph), ay = ccy + Rr * Math.sin(ph);
          if (Math.abs(ax - x) > sw / 2 + 0.1 || Math.abs(ay - y) > sh / 2 + 0.1) ok = false;
          if (ax < X0 + 0.16 || ax > X1 - 0.16 || ay < Y0 + 0.16 || ay > Y1 - 0.16) ok = false;
        }
        if (ok && (!best || 2 * Rr * half > best.len)) best = { Rr, half, pm, ccx, ccy, len: 2 * Rr * half };
      }
      if (!best) best = { Rr: 0.6, half: 0.55, pm: R.range(0, 6.283), len: 0.66 };
      if (best.ccx == null) { best.ccx = x - best.Rr * Math.cos(best.pm); best.ccy = y - best.Rr * Math.sin(best.pm); }
      RVcx = best.ccx; RVcy = best.ccy; RVR = best.Rr; RVmx = Math.cos(best.pm); RVmy = Math.sin(best.pm); RVhalf = best.half;
      RVw = R.range(0.038, 0.046); RViw2 = 1 / (2 * RVw * RVw); RVd0 = 0.3; RVd1 = 0.2; RVsgn = 1;
      FEAT.ravine = true;
    }
  }
  // two medium wells where the sheet is emptiest
  for (let e = 0; e < 2; e++) {
    let best = null, bd = -1;
    for (let t = 0; t < 30; t++) {
      const x = R.range(X0 + 0.25, X1 - 0.25), y = R.range(Y0 + 0.25, Y1 - 0.25);
      let md = Infinity;
      for (let i = 0; i < NF; i++) md = Math.min(md, Math.hypot(x - FX[i], y - FY[i]));
      if (FEAT.plateau) md = Math.min(md, Math.hypot(x - PLcx, y - PLcy) - PLa * 0.8);
      if (FEAT.ravine) md = Math.min(md, Math.abs(Math.hypot(x - RVcx, y - RVcy) - RVR) + 0.05);
      if (md > bd) { bd = md; best = [x, y]; }
    }
    addGauss(best[0], best[1], -R.range(0.2, 0.28), R.range(0.12, 0.16), R.range(0.1, 0.12), R.range(0, Math.PI));
  }
  noiseOn = 0;
  if (FEAT.ravine) finishRavine();
  // the spurious minimum must really be a local minimum: deepen the dimple until Newton agrees
  if (FEAT.spur) {
    for (let t = 0; t < 5; t++) {
      const p = newtonCrit(FEAT.spur[0], FEAT.spur[1], 30);
      if (p && Math.hypot(p[0] - FEAT.spur[0], p[1] - FEAT.spur[1]) < 0.08) { hess(p[0], p[1]); if (eig2()[0] > 0) break; }
      FAMP[FEAT.spurI] *= 1.3;
    }
  }
  noiseOn = 1;
  noiseMean(R);
  if (FEAT.plateau) mesaTop(0.03);
  normalize(R);
}

// ---------------------------------------------------------------------------------------------
// height grid (fixed resolution over the fixed sheet): heights, shading gradient, lakes
// ---------------------------------------------------------------------------------------------
const GRES = PHONE ? 150 : 300;
const GW = Math.round(MAPW * GRES) + 1, GH = Math.round(MAPH * GRES) + 1, GDX = MAPW / (GW - 1), GDY = MAPH / (GH - 1);
const HG = new Float32Array(GW * GH), DATA = new Float32Array(GW * GH * 4), LAKE = new Uint8Array(GW * GH);
let HMIN = 0, HMAX = 1, LAKE_LEV = [0];
const gi = (x) => clamp(Math.round((x - X0) / GDX), 0, GW - 1), gj = (y) => clamp(Math.round((y - Y0) / GDY), 0, GH - 1);
function buildGrid() {
  let mn = Infinity, mx = -Infinity;
  for (let j = 0, k = 0; j < GH; j++) {
    const y = Y0 + j * GDY;
    for (let i = 0; i < GW; i++, k++) { const v = L(X0 + i * GDX, y); HG[k] = v; if (v < mn) mn = v; if (v > mx) mx = v; }
  }
  HMIN = mn; HMAX = mx;
  LAKE.fill(0); LAKE_LEV = [0];
}
function hgrid(x, y) {
  const gx = clamp((x - X0) / GDX, 0, GW - 1.0001), gy = clamp((y - Y0) / GDY, 0, GH - 1.0001);
  const i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j, k = j * GW + i;
  return (HG[k] * (1 - fx) + HG[k + 1] * fx) * (1 - fy) + (HG[k + GW] * (1 - fx) + HG[k + GW + 1] * fx) * fy;
}
function inLake(x, y) { return LAKE[gj(y) * GW + gi(x)] > 0; }
let HIGHQ = 0;
function highQuantile(q = 0.45) { const sample = []; for (let k = 0; k < HG.length; k += 37) sample.push(HG[k]); sample.sort((a, b) => a - b); return sample[(sample.length * q) | 0]; }
// a release point on high ground, far from earlier releases (Mitchell's best candidate)
function mitchellHigh(R, inside = 0.12, test) {
  let best = null, bd = -1;
  for (let t = 0; t < 14; t++) {
    const x = R.range(X0 + inside, X1 - inside), y = R.range(Y0 + inside, Y1 - inside);
    if (L(x, y) < HIGHQ || inLake(x, y) || (test && !test(x, y))) continue;
    let md = 9; for (const p of RELEASES) if (p) md = Math.min(md, Math.hypot(p[0] - x, p[1] - y));
    if (md > bd) { bd = md; best = [x, y]; }
  }
  return best || [R.range(X0 + 0.2, X1 - 0.2), R.range(Y0 + 0.2, Y1 - 0.2)];
}
function buildData() {
  for (let j = 0, k = 0; j < GH; j++) {
    const jd = j > 0 ? j - 1 : j, ju = j < GH - 1 ? j + 1 : j, y = Y0 + j * GDY;
    for (let i = 0; i < GW; i++, k++) {
      const il = i > 0 ? i - 1 : i, ir = i < GW - 1 ? i + 1 : i;
      let dLx = (HG[j * GW + ir] - HG[j * GW + il]) / ((ir - il) * GDX), dLy = (HG[ju * GW + i] - HG[jd * GW + i]) / ((ju - jd) * GDY);
      if (DETILT) {      // the bowl's regional tilt is left out of the shading so that the landforms carry the light
        const x = X0 + i * GDX, bx = x - BX, by = y - BY;
        const bk = 0.72 * Lsc * (2 * BK + 4 * BK4 * (bx * bx + by * by)) * (PLon ? 1 - plateauMask(x, y) : 1);
        dLx -= bk * bx; dLy -= bk * by;
      }
      const o = 4 * k;
      DATA[o] = HG[k]; DATA[o + 1] = dLx; DATA[o + 2] = dLy; DATA[o + 3] = -1;
    }
  }
  // lake levels, dilated by two cells so the shader can draw a crisp shoreline from the nearest texel
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const id = LAKE[j * GW + i]; if (!id) continue;
    for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) {
      const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= GW || jj >= GH) continue;
      DATA[4 * (jj * GW + ii) + 3] = LAKE_LEV[id];
    }
  }
}
// lakes: chosen basins are flooded from their minimum up to a level below their spill height
let VIS = null, QUE = null, STAMP = 0;
function flood(plan) {
  const n = GW * GH;
  if (!VIS) { VIS = new Int32Array(n); QUE = new Int32Array(n); }
  for (const [m, delta, capFrac] of plan) {
    const i0 = gi(m.x), j0 = gj(m.y);
    if (i0 < 1 || j0 < 1 || i0 >= GW - 1 || j0 >= GH - 1) continue;
    let lev = m.L + Math.min(delta, 0.75 * (m.prom || delta * 2));
    for (let t = 0; t < 7; t++) {
      const st = ++STAMP, k0 = j0 * GW + i0;
      if (HG[k0] >= lev || LAKE[k0]) break;
      let qh = 0, qt = 0, over = false;
      QUE[qt++] = k0; VIS[k0] = st;
      while (qh < qt) {
        const k = QUE[qh++], i = k % GW, j = (k / GW) | 0;
        if (i === 0 || j === 0 || i === GW - 1 || j === GH - 1) { over = true; break; }
        const nb = [k - 1, k + 1, k - GW, k + GW];
        for (let q = 0; q < 4; q++) { const kk = nb[q]; if (VIS[kk] !== st && HG[kk] < lev) { VIS[kk] = st; QUE[qt++] = kk; } }
        if (qt > capFrac * n) { over = true; break; }
      }
      if (!over) {
        const id = LAKE_LEV.length; LAKE_LEV.push(lev);
        for (let q = 0; q < qt; q++) LAKE[QUE[q]] = id;
        m.lake = id;
        break;
      }
      lev = m.L + (lev - m.L) * 0.62;
    }
  }
}

// ---------------------------------------------------------------------------------------------
// critical points: grid scan for double sign changes, Newton refinement, Hessian classification
// ---------------------------------------------------------------------------------------------
function findCritical(nx, smooth, x0 = X0, x1 = X1, y0 = Y0, y1 = Y1) {
  const save = noiseOn; noiseOn = smooth ? 0 : 1;
  const ny = Math.max(10, Math.round(nx * (y1 - y0) / (x1 - x0)));
  const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny, n1 = nx + 1;
  const GA = new Float64Array(n1 * (ny + 1)), GB = new Float64Array(n1 * (ny + 1));
  for (let j = 0, k = 0; j <= ny; j++) for (let i = 0; i <= nx; i++, k++) { grad(x0 + i * dx, y0 + j * dy); GA[k] = gX; GB[k] = gY; }
  const out = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * n1 + i;
    const a1 = GA[k], a2 = GA[k + 1], a3 = GA[k + n1], a4 = GA[k + n1 + 1];
    if ((a1 > 0 && a2 > 0 && a3 > 0 && a4 > 0) || (a1 < 0 && a2 < 0 && a3 < 0 && a4 < 0)) continue;
    const b1 = GB[k], b2 = GB[k + 1], b3 = GB[k + n1], b4 = GB[k + n1 + 1];
    if ((b1 > 0 && b2 > 0 && b3 > 0 && b4 > 0) || (b1 < 0 && b2 < 0 && b3 < 0 && b4 < 0)) continue;
    const cx = x0 + (i + 0.5) * dx, cy = y0 + (j + 0.5) * dy;
    const p = newtonCrit(cx, cy, 25);
    if (!p || Math.abs(p[0] - cx) > 2.5 * dx || Math.abs(p[1] - cy) > 2.5 * dy) continue;
    if (p[0] < x0 || p[0] > x1 || p[1] < y0 || p[1] > y1) continue;
    let dup = false;
    for (const q of out) if (Math.hypot(q.x - p[0], q.y - p[1]) < 0.004) { dup = true; break; }
    if (dup) continue;
    hess(p[0], p[1]); const [l1, l2] = eig2();
    out.push({ x: p[0], y: p[1], L: L(p[0], p[1]), l1, l2, type: l1 > 0 ? 'min' : l2 < 0 ? 'max' : 'saddle' });
  }
  noiseOn = save;
  return out;
}
// prominence of a minimum: priority-flood outward on a subsampled height grid until lower ground (or the
// sheet edge) is reached; the highest level crossed on the way is the spill height of the basin
const PH = { v: null, k: null, vis: null, st: 0 };
function prominence(m, cap = 0.6) {
  const sub = 3, W = Math.floor((GW - 1) / sub) + 1, H = Math.floor((GH - 1) / sub) + 1, N = W * H;
  if (!PH.vis || PH.vis.length !== N) { PH.v = new Float64Array(N + 8); PH.k = new Int32Array(N + 8); PH.vis = new Int32Array(N); PH.st = 0; }
  const hv = PH.v, hk = PH.k, vis = PH.vis, st = ++PH.st, h = (k) => HG[((k / W) | 0) * sub * GW + (k % W) * sub];
  let n = 0;
  const push = (val, key) => { let i = n++; while (i > 0) { const p = (i - 1) >> 1; if (hv[p] <= val) break; hv[i] = hv[p]; hk[i] = hk[p]; i = p; } hv[i] = val; hk[i] = key; };
  const pop = () => { const top = hk[0], lv = hv[--n], lk = hk[n]; let i = 0;
    for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && hv[c + 1] < hv[c]) c++; if (hv[c] >= lv) break; hv[i] = hv[c]; hk[i] = hk[c]; i = c; }
    hv[i] = lv; hk[i] = lk; return top; };
  const i0 = clamp(Math.round((m.x - X0) / (GDX * sub)), 0, W - 1), j0 = clamp(Math.round((m.y - Y0) / (GDY * sub)), 0, H - 1);
  const k0 = j0 * W + i0; push(h(k0), k0); vis[k0] = st;
  let level = -Infinity, count = 0;
  while (n > 0) {
    const k = pop(), hk0 = h(k);
    if (hk0 > level) { level = hk0; if (level - m.L > cap) return cap; }
    if (hk0 < m.L - 2e-3) return level - m.L;
    const i = k % W, j = (k / W) | 0;
    if (i === 0 || j === 0 || i === W - 1 || j === H - 1 || ++count > 0.45 * N) return level - m.L;
    if (vis[k - 1] !== st) { vis[k - 1] = st; push(h(k - 1), k - 1); }
    if (vis[k + 1] !== st) { vis[k + 1] = st; push(h(k + 1), k + 1); }
    if (vis[k - W] !== st) { vis[k - W] = st; push(h(k - W), k - W); }
    if (vis[k + W] !== st) { vis[k + W] = st; push(h(k + W), k + W); }
  }
  return level - m.L;
}
let CRIT = [], NAMED = {};
function nameSurvey() {
  const ins = (p, m) => p.x > X0 + m && p.x < X1 - m && p.y > Y0 + m && p.y < Y1 - m;
  const crit = findCritical(120, true).filter((p) => ins(p, 0.04));
  for (const c of crit) { // carry each designed critical point onto the full (textured) surface
    const p = newtonCrit(c.x, c.y, 20);
    if (p && Math.hypot(p[0] - c.x, p[1] - c.y) < 0.03) {
      hess(p[0], p[1]); const [l1, l2] = eig2();
      if ((l1 > 0 ? 'min' : l2 < 0 ? 'max' : 'saddle') === c.type) { c.x = p[0]; c.y = p[1]; c.l1 = l1; c.l2 = l2; }
    }
    c.L = L(c.x, c.y);
    c.onPlateau = PLon && plateauRho(c.x, c.y) < 1.45;
  }
  CRIT = crit;
  for (const c of crit) if (c.type === 'min') c.prom = prominence(c);
  const mins = crit.filter((c) => c.type === 'min' && !c.onPlateau);
  const sads = crit.filter((c) => c.type === 'saddle' && !c.onPlateau && ins(c, 0.12));
  const maxs = crit.filter((c) => c.type === 'max' && !c.onPlateau);
  NAMED = {};
  for (const m of mins) if (m.prom > 0.08 && (!NAMED.sharp || m.l1 > NAMED.sharp.l1)) NAMED.sharp = m;
  for (const m of mins) if (m !== NAMED.sharp && m.prom > 0.08 && (!NAMED.flat || m.l2 < NAMED.flat.l2)) NAMED.flat = m;
  for (const m of mins) if (!NAMED.global || m.L < NAMED.global.L) NAMED.global = m;
  for (const m of mins) if (m !== NAMED.sharp && m !== NAMED.flat && m !== NAMED.global && ins(m, 0.1) && (!NAMED.spur || m.L > NAMED.spur.L)) NAMED.spur = m;
  for (const s of sads) if (s.l2 > 2 && (!NAMED.hes || Math.abs(s.l1) < Math.abs(NAMED.hes.l1))) NAMED.hes = s;
  for (const s of sads) if (NAMED.hes && s !== NAMED.hes && Math.hypot(s.x - NAMED.hes.x, s.y - NAMED.hes.y) > 0.5 &&
      (!NAMED.col || Math.abs(s.l1) > Math.abs(NAMED.col.l1))) NAMED.col = s;
  for (const m of maxs) if (ins(m, 0.1) && (!NAMED.peak || m.L > NAMED.peak.L)) NAMED.peak = m;
}
function surveyLakes() {
  const mouth = FEAT.ravine && RVon ? arcPt(1) : null;
  const ok = (m) => m && !m.onPlateau && !(mouth && Math.hypot(m.x - mouth[0], m.y - mouth[1]) < 0.22);
  const plan = [];
  if (ok(NAMED.flat)) plan.push([NAMED.flat, 0.1, 0.045]);
  if (ok(NAMED.sharp)) plan.push([NAMED.sharp, 0.12, 0.012]);
  const low = CRIT.filter((c) => c.type === 'min' && ok(c) && c.prom > 0.06 && !plan.some((p) => p[0] === c)).sort((p, q) => p.L - q.L)[0];
  if (low && (!NAMED.flat || low.L < NAMED.flat.L)) plan.push([low, 0.06, 0.012]);
  flood(plan);
}
// names on a survey sheet: areal names are printed, point names stand on pins above the relief
function surveyNames(S) {
  if (FEAT.plateau && PLon) S.areas.push({ x: PLcx, y: PLcy, lines: ['Plateau of', 'Vanishing Gradients'], one: 'Plateau of Vanishing Gradients', size: 14, ls: 2.4, rot: clamp(-Math.atan2(PLs, PLc), -0.35, 0.35), w: 2 * PLa });
  if (NAMED.flat) S.areas.push({ x: NAMED.flat.x, y: NAMED.flat.y, lines: ['Flat Basin'], size: 15.5, ls: 3.2, color: NAMED.flat.lake ? WATER_INK : INK, clear: 14 });
  if (FEAT.ravine && RVon) S.paths.push({ text: 'Ravine of Ill Conditioning', ravine: true });
  if (NAMED.sharp) S.marks.push({ p: NAMED.sharp, name: 'Sharp Minimum', sub: `L ${NAMED.sharp.L.toFixed(3)} · 2/λ ${(2 / NAMED.sharp.l2).toFixed(4)}`, sym: 'min', pri: 9 });
  if (NAMED.hes) S.marks.push({ p: NAMED.hes, name: 'Saddle of Hesitation', sub: `L ${NAMED.hes.L.toFixed(3)} · λ ${fmt(NAMED.hes.l1, 2)}`, sym: 'pass', pri: 8 });
  if (NAMED.spur) S.marks.push({ p: NAMED.spur, name: 'Spurious Minimum', sub: `L ${NAMED.spur.L.toFixed(3)}`, sym: 'min', pri: 5 });
  if (NAMED.col) S.marks.push({ p: NAMED.col, name: 'Col of Symmetry Breaking', sub: `L ${NAMED.col.L.toFixed(3)} · λ ${fmt(NAMED.col.l1, 1)}`, sym: 'pass', pri: 4 });
  if (NAMED.flat) S.marks.push({ p: NAMED.flat, name: '', sub: `${NAMED.flat.L.toFixed(3)} · λ ${NAMED.flat.l2.toFixed(1)}`, sym: 'min', pri: 3, pin: false });
  if (NAMED.peak) S.marks.push({ p: NAMED.peak, name: '', sub: `${NAMED.peak.L.toFixed(3)}`, sym: 'peak', pri: 2, pin: false });
  if (NAMED.global && NAMED.global !== NAMED.sharp && NAMED.global !== NAMED.flat) S.marks.push({ p: NAMED.global, name: 'Global Minimum', sub: `L ${NAMED.global.L.toFixed(3)}`, sym: 'min', pri: 6 });
}


// ---------------------------------------------------------------------------------------------
// shared sheet helpers
// ---------------------------------------------------------------------------------------------
function sheetBase(R, o = {}) {
  resetTerrain(R);
  BX = o.bx || 0; BY = o.by || 0; BK = o.bk != null ? o.bk : 0.2; BK4 = o.bk4 != null ? o.bk4 : 0.022;
  if (o.na != null) NA = o.na;
}
// keep the designed units: no rescaling, the global minimum is set just above zero
function fixedScale(base = 0.03) {
  Lofs = 0; Lsc = 1; Lbase = 0;
  const nx = 160, ny = 100; let mn = Infinity, px = 0, py = 0;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const x = X0 + MAPW * i / nx, y = Y0 + MAPH * j / ny, v = Lpre(x, y); if (v < mn) { mn = v; px = x; py = y; } }
  const m = newtonCrit(px, py, 40); if (m) { const v = Lpre(m[0], m[1]); if (v < mn) mn = v; }
  Lofs = mn; Lbase = base;
}
function sheetEnd(R, fixed) { noiseMean(R); if (fixed) fixedScale(); else normalize(R); }
// catchments of gradient flow: steepest descent between cells of a (smoothed) height grid
function catchments(sub = 3, smooth = true) {
  const W = Math.floor((GW - 1) / sub) + 1, H = Math.floor((GH - 1) / sub) + 1, N = W * H;
  const G = new Float32Array(N), save = noiseOn;
  noiseOn = smooth ? 0 : 1;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) G[j * W + i] = smooth ? L(X0 + i * sub * GDX, Y0 + j * sub * GDY) : HG[j * sub * GW + i * sub];
  noiseOn = save;
  const dn = new Int32Array(N), dx = GDX * sub, dy = GDY * sub, dd = Math.hypot(dx, dy);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i; let best = k, bs = 0;
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
      if (!a && !b) continue;
      const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue;
      const kk = jj * W + ii, sl = (G[k] - G[kk]) / (a && b ? dd : a ? dx : dy);
      if (sl > bs) { bs = sl; best = kk; }
    }
    dn[k] = best;
  }
  const lab = new Int32Array(N).fill(-2), basins = [], stack = [];
  for (let k = 0; k < N; k++) {
    let q = k; stack.length = 0;
    while (lab[q] === -2 && dn[q] !== q) { stack.push(q); q = dn[q]; }
    if (lab[q] === -2) {
      const i = q % W, j = (q / W) | 0;
      if (i === 0 || j === 0 || i === W - 1 || j === H - 1) lab[q] = -1;
      else { lab[q] = basins.length; basins.push({ x: X0 + i * dx, y: Y0 + j * dy, L: G[q], n: 0 }); }
    }
    for (const r of stack) lab[r] = lab[q];
  }
  for (let k = 0; k < N; k++) if (lab[k] >= 0) basins[lab[k]].n++;
  for (const b of basins) b.area = b.n / N;
  return { lab, W, H, sub, basins, dx, dy };
}
function labelAt(C, x, y) { const i = clamp(Math.round((x - X0) / C.dx), 0, C.W - 1), j = clamp(Math.round((y - Y0) / C.dy), 0, C.H - 1); return C.lab[j * C.W + i]; }
// a field sampled on a coarse grid over the map, for printed iso-lines of derived surfaces
function fieldGrid(fn, nx = 192) {
  const ny = Math.round(nx * MAPH / MAPW), W = nx + 1, H = ny + 1, G = new Float32Array(W * H), dx = MAPW / nx, dy = MAPH / ny;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) G[j * W + i] = fn(X0 + i * dx, Y0 + j * dy);
  return { G, W, H, dx, dy };
}
function strokeChains(chains, style, width, dash) {
  const c = sc; c.save(); c.strokeStyle = style; c.lineWidth = width; c.setLineDash(dash || []); c.lineJoin = 'round'; c.beginPath();
  for (const pts of chains) { c.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]); }
  c.stroke(); c.restore();
}
function hatchChains(chains, style, gap = 3.2, ang = -0.8, width = 0.55) {
  const c = sc; c.save(); c.beginPath();
  for (const pts of chains) { c.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]); c.closePath(); }
  c.clip('evenodd');
  c.strokeStyle = style; c.lineWidth = width; c.beginPath();
  const ca = Math.cos(ang), sa = Math.sin(ang), D = sheetWo * 1.5;
  for (let t = -D; t < D; t += gap) { c.moveTo(t * -sa - D * ca + sheetWo / 2, t * ca - D * sa + 400); c.lineTo(t * -sa + D * ca + sheetWo / 2, t * ca + D * sa + 400); }
  c.stroke(); c.restore();
}
// flood the cells below L_min + δ that are connected to a minimum: the basin's sublevel set
function sublevel(m, delta, capFrac = 0.2) {
  const n = GW * GH, mask = new Uint8Array(n);
  if (!VIS) { VIS = new Int32Array(n); QUE = new Int32Array(n); }
  const st = ++STAMP, k0 = gj(m.y) * GW + gi(m.x), lev = m.L + delta;
  let qh = 0, qt = 0; QUE[qt++] = k0; VIS[k0] = st; mask[k0] = 1;
  while (qh < qt && qt < capFrac * n) {
    const k = QUE[qh++], i = k % GW, j = (k / GW) | 0;
    if (i === 0 || j === 0 || i === GW - 1 || j === GH - 1) continue;
    for (const kk of [k - 1, k + 1, k - GW, k + GW]) if (VIS[kk] !== st && HG[kk] < lev) { VIS[kk] = st; QUE[qt++] = kk; mask[kk] = 1; }
  }
  return { mask, area: qt * GDX * GDY };
}
function maskChains(mask, sub = 2) {
  const W = Math.floor((GW - 1) / sub) + 1, H = Math.floor((GH - 1) / sub) + 1, G = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) G[j * W + i] = mask[j * sub * GW + i * sub];
  return isoChains(G, W, H, X0, Y0, GDX * sub, GDY * sub, 0.5);
}
function epsSharp(m, rho) { let mx = 0; for (let k = 0; k < 64; k++) { const a = k / 64 * TAU; mx = Math.max(mx, L(m.x + rho * Math.cos(a), m.y + rho * Math.sin(a)) - m.L); } return mx; }
// gradient flow by RK4 (for manifolds and for comparing flows with gradient descent)
function flowPath(x, y, dt, n, sign = -1, modEta = 0, out = []) {
  const f = (px, py, o) => {
    grad(px, py); let a = gX, b = gY;
    if (modEta) { const g1 = gX, g2 = gY; hess(px, py); a = g1 + modEta / 2 * (hXX * g1 + hXY * g2); b = g2 + modEta / 2 * (hXY * g1 + hYY * g2); }
    o[0] = sign * a; o[1] = sign * b;
  };
  const k1 = [0, 0], k2 = [0, 0], k3 = [0, 0], k4 = [0, 0];
  out.push(x, y);
  for (let s = 0; s < n; s++) {
    f(x, y, k1); f(x + dt / 2 * k1[0], y + dt / 2 * k1[1], k2); f(x + dt / 2 * k2[0], y + dt / 2 * k2[1], k3); f(x + dt * k3[0], y + dt * k3[1], k4);
    const dx = dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), dy = dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    x += dx; y += dy; out.push(x, y);
    if (x < X0 || x > X1 || y < Y0 || y > Y1 || Math.hypot(dx, dy) < 1e-7) break;
  }
  return out;
}
// mean curves over the particles of the current cohort, per optimizer, indexed by age
function curveInit(nt, len) { return { sum: Array.from({ length: nt }, () => new Float64Array(len)), cnt: Array.from({ length: nt }, () => new Float64Array(len)), len, cid: 1 }; }
function curveReset(C) { for (const a of C.sum) a.fill(0); for (const a of C.cnt) a.fill(0); C.cid++; }
function curveAdd(C, t, age, v) { if (age < C.len && Number.isFinite(v)) { C.sum[t][age] += v; C.cnt[t][age]++; } }
function curveMean(C, t, f = (v) => v) { const out = new Float64Array(C.len); for (let k = 0; k < C.len; k++) out[k] = C.cnt[t][k] > 0 ? f(C.sum[t][k] / C.cnt[t][k]) : NaN; return out; }
const ARCS = [];
function arcPts(x0, y0, x1, y1) {
  const n = 30, len = Math.hypot(x1 - x0, y1 - y0), L0 = hgrid(x0, y0), L1 = hgrid(clamp(x1, X0, X1), clamp(y1, Y0, Y1)), hgt = 0.12 + len * 0.9, pts = [];
  for (let k = 0; k <= n; k++) { const t = k / n; pts.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, L0 + (L1 - L0) * t + 4 * hgt * t * (1 - t) + 0.004); }
  return pts;
}
function refreshLines() { LINES.length = 0; if (PL.lines) PL.lines(); for (const a of ARCS) line(a.pts, a.col, 0.9, 0, false, a.a); if (SCAF.on) scaffoldLines(); if (SECT.on) sectionLines(); ribDirty = true; }
// ---------------------------------------------------------------------------------------------
// cross-sections, as in the profile strips of a topographic atlas. Two clicks set A and B; the strip
// prints the loss along the straight segment and along the lowest path between them (the path whose
// highest point is lowest, found by a minimax Dijkstra on the height grid). Its top is the height at
// which the disconnectivity tree joins the basins of A and B, when A and B sit in basins.
// ---------------------------------------------------------------------------------------------
const SECT = { on: false, a: null, b: null, res: null };
function toggleSection(v) {
  SECT.on = v != null ? v : !SECT.on; SECT.a = SECT.b = SECT.res = null; linesDirty = true;
  F.canvas.style.cursor = SECT.on ? 'crosshair' : '';

}
function sectionClick(x, y) {
  if (!SECT.a || SECT.b) { SECT.a = [x, y]; SECT.b = null; SECT.res = null; linesDirty = true; return; }
  SECT.b = [x, y]; SECT.res = sectionCompute(SECT.a, SECT.b); linesDirty = true;
}
function sectionCompute(A, B) {
  const sub = PHONE ? 2 : 3, W = Math.floor((GW - 1) / sub) + 1, H = Math.floor((GH - 1) / sub) + 1, N = W * H;
  const G = new Float32Array(N); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) G[j * W + i] = HG[j * sub * GW + i * sub];
  const cell = (p) => clamp(Math.round((p[1] - Y0) / (GDY * sub)), 0, H - 1) * W + clamp(Math.round((p[0] - X0) / (GDX * sub)), 0, W - 1);
  const s = cell(A), t = cell(B), best = new Float64Array(N).fill(Infinity), len = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1);
  const hb = [], hl = [], hk = [];       // binary heap keyed by (highest loss so far, length)
  const less = (i, j) => hb[i] < hb[j] || (hb[i] === hb[j] && hl[i] < hl[j]);
  const swap = (i, j) => { [hb[i], hb[j]] = [hb[j], hb[i]]; [hl[i], hl[j]] = [hl[j], hl[i]]; [hk[i], hk[j]] = [hk[j], hk[i]]; };
  const push = (b, l, k) => { hb.push(b); hl.push(l); hk.push(k); let i = hb.length - 1; while (i > 0) { const q = (i - 1) >> 1; if (!less(i, q)) break; swap(i, q); i = q; } };
  const pop = () => { const r = [hb[0], hl[0], hk[0]], n = hb.length - 1; swap(0, n); hb.pop(); hl.pop(); hk.pop(); let i = 0;
    for (;;) { let c = 2 * i + 1; if (c >= hb.length) break; if (c + 1 < hb.length && less(c + 1, c)) c++; if (!less(c, i)) break; swap(c, i); i = c; } return r; };
  best[s] = G[s]; len[s] = 0; push(G[s], 0, s);
  while (hb.length) {
    const [b, l, k] = pop(); if (k === t) break; if (b > best[k] || (b === best[k] && l > len[k])) continue;
    const i = k % W, j = (k / W) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue;
      const n = jj * W + ii, nb = Math.max(b, G[n]), nl = l + (di && dj ? 1.4142 : 1);
      if (nb < best[n] || (nb === best[n] && nl < len[n])) { best[n] = nb; len[n] = nl; prev[n] = k; push(nb, nl, n); }
    }
  }
  const path = []; for (let k = t, guard = 0; k >= 0 && guard < N; k = prev[k], guard++) path.push([X0 + (k % W) * sub * GDX, Y0 + ((k / W) | 0) * sub * GDY]);
  path.reverse(); path[0] = A; path[path.length - 1] = B;
  const resample = (pts, n) => {           // loss at n evenly spaced points along a polyline
    const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const tot = cum[cum.length - 1] || 1, out = new Float64Array(n); let q = 1;
    for (let k = 0; k < n; k++) { const d = tot * k / (n - 1); while (q < cum.length - 1 && cum[q] < d) q++; const u = clamp((d - cum[q - 1]) / Math.max(1e-9, cum[q] - cum[q - 1]), 0, 1);
      out[k] = L(pts[q - 1][0] + (pts[q][0] - pts[q - 1][0]) * u, pts[q - 1][1] + (pts[q][1] - pts[q - 1][1]) * u); }
    return { prof: out, length: tot };
  };
  const straight = resample([A, B], 200), low = resample(path, 200);
  const smax = Math.max(...straight.prof), lmax = Math.max(...low.prof);
  return { path, straight: straight.prof, low: low.prof, smax, lmax, lenS: straight.length, lenL: low.length, LA: L(A[0], A[1]), LB: L(B[0], B[1]) };
}
function sectionLines() {
  if (!SECT.a || !SECT.b) return;
  const ink = [0.15, 0.16, 0.18], halo = [0.93, 0.94, 0.91];
  const seg = drape([SECT.a[0], SECT.a[1], SECT.b[0], SECT.b[1]], 0.004);
  line(seg, halo, 4.2, 0, true, 0.75); line(seg, ink, 1.7, 0.022, true, 0.95);
  if (SECT.res) { const flat = []; for (const p of SECT.res.path) flat.push(p[0], p[1]); const lp = drape(flat, 0.006); line(lp, halo, 4.6, 0, true, 0.7); line(lp, '#167a5b', 2, 0, true, 0.95); }
}
function sectionOverlay(oc) {
  const mark = (p, nm) => {
    project(VP, p[0], p[1], hgrid(p[0], p[1]) * ZS, P0); if (P0[2] <= 0) return;
    oc.fillStyle = INK; oc.beginPath(); oc.arc(P0[0], P0[1], 3, 0, TAU); oc.fill();
    oc.font = `italic 500 ${PHONE ? 14 : 16}px ${SERIF}`; oc.textAlign = 'center'; oc.textBaseline = 'bottom'; oc.lineJoin = 'round';
    oc.strokeStyle = 'rgba(236,238,232,0.92)'; oc.lineWidth = 3.5; oc.strokeText(nm, P0[0], P0[1] - 6); oc.fillStyle = INK; oc.fillText(nm, P0[0], P0[1] - 6);
  };
  if (SECT.a) mark(SECT.a, 'A');
  if (SECT.b) mark(SECT.b, 'B');
  const R = SECT.res; if (!R) return;
  // the profile strip, printed on a slip of paper below the model
  const [l, , r] = region(), phone = F.cssWidth < 700, w = Math.min(460, r - l - 24), h = phone ? 120 : 138;
  const x0 = Math.round((l + r) / 2 - w / 2), y0 = Math.round(F.cssHeight - h - (phone ? 64 : 58));
  oc.fillStyle = 'rgba(243,244,239,0.95)'; oc.fillRect(x0, y0, w, h);
  oc.strokeStyle = 'rgba(36,38,43,0.35)'; oc.lineWidth = 1; oc.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  const px0 = x0 + 34, px1 = x0 + w - 12, py0 = y0 + 30, py1 = y0 + h - 22;
  let lo = Math.min(...R.straight, ...R.low), hi = Math.max(R.smax, R.lmax); const pad = Math.max(0.02, (hi - lo) * 0.08); lo -= pad; hi += pad;
  const ty = (v) => py1 - (py1 - py0) * (v - lo) / (hi - lo);
  oc.font = `500 ${phone ? 9 : 10}px ${SERIF}`; oc.letterSpacing = '1.6px'; oc.fillStyle = INK; oc.textAlign = 'left'; oc.textBaseline = 'middle';
  oc.fillText('SECTION A–B', x0 + 10, y0 + 14); oc.letterSpacing = '0px';
  oc.font = `400 ${phone ? 8 : 8.5}px ${MONO}`; oc.textAlign = 'right'; oc.fillStyle = 'rgba(36,38,43,0.8)';
  oc.fillText(`straight max ${R.smax.toFixed(3)} · lowest path max ${R.lmax.toFixed(3)}`, x0 + w - 10, y0 + 14);
  oc.strokeStyle = 'rgba(36,38,43,0.45)'; oc.beginPath(); oc.moveTo(px0, py0 - 4); oc.lineTo(px0, py1); oc.lineTo(px1, py1); oc.stroke();
  oc.textAlign = 'right'; oc.fillStyle = 'rgba(36,38,43,0.65)';
  for (const v of [lo + pad, hi - pad]) oc.fillText(v.toFixed(2), px0 - 4, ty(v));
  oc.textAlign = 'left'; oc.fillText('A', px0, py1 + 11); oc.textAlign = 'right'; oc.fillText('B', px1, py1 + 11);
  const plot = (arr, col, dash, lw) => { oc.strokeStyle = col; oc.lineWidth = lw; oc.setLineDash(dash); oc.beginPath();
    for (let k = 0; k < arr.length; k++) { const X = px0 + (px1 - px0) * k / (arr.length - 1), Y = ty(arr[k]); if (k) oc.lineTo(X, Y); else oc.moveTo(X, Y); } oc.stroke(); oc.setLineDash([]); };
  oc.setLineDash([2, 3]); oc.strokeStyle = 'rgba(22,122,91,0.7)'; oc.lineWidth = 1; oc.beginPath(); oc.moveTo(px0, ty(R.lmax)); oc.lineTo(px1, ty(R.lmax)); oc.stroke(); oc.setLineDash([]);
  plot(R.straight, INK, [5, 3], 1.5); plot(R.low, '#167a5b', [], 1.8);
  oc.textAlign = 'center'; oc.fillStyle = 'rgba(36,38,43,0.7)';
  oc.fillText(`straight ${R.lenS.toFixed(2)} long, lowest path ${R.lenL.toFixed(2)}`, (px0 + px1) / 2, py1 + 11);
}
// ---------------------------------------------------------------------------------------------
// the disconnectivity scaffold. Flood the sheet from below: each basin fills as a lake, and two lakes
// join at the height of the lowest pass between them. The record of those joins is the merge tree of
// the sublevel sets {L < ℓ}, the disconnectivity graph of chemists' energy landscapes. Here it stands
// on the relief: a rod rises from every minimum, and where two basins join a bar runs at that height
// through the pass itself. Basins shallower than a persistence threshold are absorbed (elder rule).
// ---------------------------------------------------------------------------------------------
const SCAF = { on: false, tree: null, t0: 0, flood: -1, drawn: -1, top: 1 };
function mergeTree(thr) {
  const sub = PHONE ? 1 : 2, W = Math.floor((GW - 1) / sub) + 1, H = Math.floor((GH - 1) / sub) + 1, N = W * H;
  const G = new Float32Array(N);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) G[j * W + i] = HG[j * sub * GW + i * sub];
  const order = new Uint32Array(N); for (let k = 0; k < N; k++) order[k] = k;
  order.sort((a, b) => G[a] - G[b]);
  const par = new Int32Array(N).fill(-1), birth = new Float32Array(N), minK = new Int32Array(N), node = new Int32Array(N).fill(-1);
  const find = (k) => { while (par[k] !== k) { par[k] = par[par[k]]; k = par[k]; } return k; };
  const nodes = [], X = (k) => X0 + (k % W) * sub * GDX, Y = (k) => Y0 + ((k / W) | 0) * sub * GDY;
  const edge = (k) => { const i = k % W, j = (k / W) | 0; return i === 0 || j === 0 || i === W - 1 || j === H - 1; };
  const leafOf = (c) => { if (node[c] < 0) { node[c] = nodes.length; nodes.push({ x: X(minK[c]), y: Y(minK[c]), h: birth[c], kids: [], edge: edge(minK[c]) }); } return node[c]; };
  for (let q = 0; q < N; q++) {
    const k = order[q], i = k % W, j = (k / W) | 0;
    par[k] = k; birth[k] = G[k]; minK[k] = k;
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
      if (!a && !b) continue;
      const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue;
      const n = jj * W + ii; if (par[n] < 0) continue;
      const ra = find(k), rb = find(n); if (ra === rb) continue;
      const old = birth[ra] <= birth[rb] ? ra : rb, young = old === ra ? rb : ra;
      if (G[k] - birth[young] >= thr && !edge(minK[young])) {
        const kids = [leafOf(old), leafOf(young)], m = nodes.length; nodes.push({ x: X(k), y: Y(k), h: G[k], kids });
        par[young] = old; node[old] = m;
      } else par[young] = old;
    }
  }
  const root = leafOf(find(order[N - 1]));
  // leaves sit on the true minima: refine on the analytic surface
  for (const n of nodes) if (!n.kids.length) { const c = critAt(n.x, n.y, 25); if (c && c.type === 'min' && Math.hypot(c.x - n.x, c.y - n.y) < 0.03) { n.x = c.x; n.y = c.y; n.h = c.L; } }
  for (const n of nodes) for (const c of n.kids) nodes[c].parent = n;
  return { nodes, root };
}
function buildScaffold() {
  let thr = 0.035, T = mergeTree(thr);
  while (T.nodes.filter((n) => !n.kids.length).length > 14 && thr < 0.5) { thr *= 1.5; T = mergeTree(thr); }
  T.thr = thr;
  const r = T.nodes[T.root]; SCAF.top = r.h + 0.12;
  SCAF.tree = T;
}
function scaffoldLines() {
  const T = SCAF.tree; if (!T) return;
  const lev = SCAF.drawn, ink = [0.15, 0.16, 0.18];
  for (const n of T.nodes) {
    const top = n.parent ? n.parent.h : SCAF.top;
    if (lev <= n.h) continue;
    const z1 = Math.min(lev, top), halo = [0.93, 0.94, 0.91];
    // a pale halo under each ink line, as an engraver would leave round a line crossing the relief
    line([n.x, n.y, n.h, n.x, n.y, z1], halo, n.parent ? 4.2 : 4.8, 0, false, 0.8);
    line([n.x, n.y, n.h, n.x, n.y, z1], ink, n.parent ? 1.7 : 2.1, 0, false, 0.95);
    if (n.parent && lev >= top) {
      line([n.x, n.y, top, n.parent.x, n.parent.y, top], halo, 4.6, 0, false, 0.8);
      line([n.x, n.y, top, n.parent.x, n.parent.y, top], ink, 1.9, 0, false, 0.95);
    }
  }
}
function scaffoldOverlay(oc, now) {
  const T = SCAF.tree; if (!T) return;
  const lev = SCAF.drawn;
  oc.font = `400 ${PHONE ? 8 : 8.5}px ${MONO}`; oc.textAlign = 'left'; oc.textBaseline = 'middle'; oc.lineJoin = 'round';
  for (const n of T.nodes) {
    if (lev < n.h) continue;
    project(VP, n.x, n.y, n.h * ZS, P0); if (P0[2] <= 0) continue;
    const merge = n.kids.length > 0;
    oc.fillStyle = INK; oc.strokeStyle = INK; oc.lineWidth = 1;
    oc.beginPath(); oc.arc(P0[0], P0[1], merge ? 2.6 : 2, 0, TAU); if (merge) { oc.fillStyle = '#eceee8'; oc.fill(); oc.stroke(); } else oc.fill();
    if (merge && !occluded(n.x, n.y, n.h * ZS + 0.01)) {
      const t = `L ${n.h.toFixed(2)}`;
      oc.strokeStyle = 'rgba(236,238,232,0.9)'; oc.lineWidth = 3; oc.strokeText(t, P0[0] + 6, P0[1] - 6); oc.fillStyle = INK; oc.fillText(t, P0[0] + 6, P0[1] - 6);
    }
    // a ring spreads from a pass at the moment its two lakes join
    const age = (now - (n.at || 0)) / 1000;
    if (merge && n.at && age < 1.2) {
      oc.globalAlpha = 0.7 * (1 - age / 1.2); oc.strokeStyle = WATER_INK; oc.lineWidth = 1.2;
      oc.beginPath(); oc.arc(P0[0], P0[1], 4 + 26 * age, 0, TAU); oc.stroke(); oc.globalAlpha = 1;
    }
  }
}
// the flood rises over 7 s, holds, then drains; the scaffold keeps whatever the water reached
function scaffoldFrame(now) {
  if (!SCAF.on) return;
  if (!SCAF.tree) { if (now < printAt + 700) return; buildScaffold(); SCAF.t0 = now; SCAF.drawn = HMIN - 0.01; for (const n of SCAF.tree.nodes) n.at = 0; }
  const T = SCAF.tree, t = (now - SCAF.t0) / 1000, rise = 7, hold = 1.6, drain = 2.6;
  const lo = HMIN - 0.005, hi = SCAF.top - 0.1;
  const e = (u) => u * u * (3 - 2 * u);
  let f;
  if (t < rise) f = lo + (hi - lo) * e(t / rise);
  else if (t < rise + hold) f = hi;
  else if (t < rise + hold + drain) f = hi + (lo - hi) * e((t - rise - hold) / drain);
  else f = -1;
  const before = SCAF.drawn;
  SCAF.flood = f;
  SCAF.drawn = f < 0 ? SCAF.top : Math.max(SCAF.drawn, f);
  if (SCAF.drawn !== before) { for (const n of T.nodes) if (n.kids.length && before < n.h && SCAF.drawn >= n.h) n.at = now; linesDirty = true; }
}
function toggleScaffold(v) {
  SCAF.on = v != null ? v : !SCAF.on; SCAF.tree = null; SCAF.flood = -1; linesDirty = true;
  if (F.params.scaffold !== SCAF.on) F.setParam('scaffold', SCAF.on, true);
  F.toast(SCAF.on ? 'Flooding the sheet: the disconnectivity scaffold' : 'Scaffold off');
}
function addArc(i, x0, y0, x1, y1) {
  ARCS.push({ pts: arcPts(x0, y0, x1, y1), col: [CRr[i], CGg[i], CBb[i]], a: 0.75 });
  if (ARCS.length > 48) ARCS.shift();
  if (PL.arcStamp !== false) stamp(clamp(x1, X0, X1), clamp(y1, Y0, Y1), 0.006, 3, CRr[i], CGg[i], CBb[i], 0.7, 0.0018);
  linesDirty = true;
}
let linesDirty = false;
// figure helpers
function figSeries(c, x0, y0, x1, y1, series, o = {}) {
  let xmax = o.xmax || 1, ymin = o.ymin, ymax = o.ymax;
  if (ymin == null || ymax == null) {
    let lo = Infinity, hi = -Infinity;
    for (const s of series) for (let k = 0; k < s.ys.length; k++) { const v = s.ys[k]; if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    if (ymin == null) ymin = lo; if (ymax == null) ymax = hi;
    if (!(hi > lo)) { ymin = (lo || 0) - 1; ymax = (hi || 0) + 1; }
  }
  const tx = (v) => x0 + (x1 - x0) * v / xmax, ty = (v) => y1 - (y1 - y0) * (v - ymin) / (ymax - ymin);
  for (const s of series) {
    c.strokeStyle = s.color; c.lineWidth = s.w || 1.3; c.globalAlpha = s.a || 1; c.setLineDash(s.dash || []);
    c.beginPath(); let on = false;
    for (let k = 0; k < s.ys.length; k++) {
      const v = s.ys[k]; if (!Number.isFinite(v)) { on = false; continue; }
      const X = tx(s.xs ? s.xs[k] : k), Y = clamp(ty(v), y0 - 2, y1 + 2);
      if (on) c.lineTo(X, Y); else c.moveTo(X, Y); on = true;
    }
    c.stroke(); c.globalAlpha = 1; c.setLineDash([]);
  }
  return { tx, ty, ymin, ymax };
}
function figBars(c, x0, y0, x1, y1, groups, labels, colors, o = {}) {
  const ng = groups.length, nb = groups[0] ? groups[0].length : 0, gw = (x1 - x0) / Math.max(1, ng), bw = Math.min(14, (gw - 8) / Math.max(1, nb));
  const ymax = o.ymax || Math.max(1e-9, ...groups.flat().map((v) => (Number.isFinite(v) ? v : 0)));
  for (let g = 0; g < ng; g++) {
    const gx = x0 + g * gw + (gw - bw * nb) / 2;
    for (let b = 0; b < nb; b++) {
      const v = groups[g][b]; if (!Number.isFinite(v)) continue;
      const hh = (y1 - y0) * v / ymax, X = gx + b * bw;
      if (o.outline && o.outline[b]) { c.strokeStyle = colors[b]; c.lineWidth = 1; c.strokeRect(X + 0.5, y1 - hh + 0.5, bw - 2, hh - 0.5); }
      else { c.fillStyle = colors[b]; c.fillRect(X, y1 - hh, bw - 1.5, hh); }
    }
    if (labels) FIG.tick(c, x0 + g * gw + gw / 2, y1 + 4, labels[g]);
  }
  return ymax;
}
// ---------------------------------------------------------------------------------------------
// optimizers (TRIBES in the code): a plate lists the optimizers it shows; each may override name, ink and
// hyperparameter multipliers. Kinds are integers so the step loop is one switch.
// ---------------------------------------------------------------------------------------------
const K_SGD = 0, K_HB = 1, K_NAG = 2, K_ADAM = 3, K_SIGN = 4, K_LION = 5, K_SAM = 6, K_NEWTON = 7, K_SFN = 8, K_RMS = 9, K_SF = 10;
const N_ISO = 0, N_HESS = 1, N_FN = 2, N_LEVY = 3;
// a positive stable variable of index a < 1, Laplace transform exp(−s^a) (Kanter's representation). √A·N(0, I) with
// a = α/2 is an isotropic α-stable vector, and at α = 2 it is the Gaussian itself
function posStable(a, R) {
  if (a >= 0.999) return 1;
  const U = Math.PI * (R() * 0.999998 + 0.000001), E = -Math.log(R() + 1e-300);
  return Math.sin(a * U) / Math.pow(Math.sin(U), 1 / a) * Math.pow(Math.sin((1 - a) * U) / E, (1 - a) / a);
}
const TB = {
  gd:     { kind: K_SGD, name: 'Gradient descent', color: '#8e1f35', rule: 'θ ← θ − η∇L', sigMul: 0 },
  sgd:    { kind: K_SGD, name: 'SGD', color: '#c22a40', rule: 'θ ← θ − η g̃' },
  hb:     { kind: K_HB, name: 'Heavy ball', color: '#4b3fa0', rule: 'v ← βv − η g̃,  θ ← θ + v' },
  nag:    { kind: K_NAG, name: 'Nesterov', color: '#23708f', rule: 'v ← βv − η g̃(θ + βv),  θ ← θ + v' },
  adam:   { kind: K_ADAM, name: 'Adam', color: '#cf6d0c', rule: 'θ ← θ − η m̂ ⁄ (√v̂ + ε)' },
  rms:    { kind: K_RMS, name: 'RMSprop', color: '#a8781c', rule: 's ← βs + (1−β)g̃²,  θ ← θ − η g̃ ⁄ (√ŝ + ε),  ŝ = s ⁄ (1−βᵗ)' },
  sign:   { kind: K_SIGN, name: 'signSGD', color: '#5e7316', rule: 'θ ← θ − η sign(g̃)' },
  lion:   { kind: K_LION, name: 'Lion', color: '#8c4f1c', rule: 'θ ← θ − η sign(β₁m + (1−β₁)g̃),  m ← β₂m + (1−β₂)g̃' },
  sam:    { kind: K_SAM, name: 'SAM', color: '#167a5b', rule: 'θ ← θ − η g̃(θ + ρ g̃ ⁄ ‖g̃‖)' },
  newton: { kind: K_NEWTON, name: 'Newton', color: '#2b2c31', rule: 'θ ← θ − α H⁻¹∇L, step ≤ 0.02', sigMul: 0, rest: 'crit' },
  sfn:    { kind: K_SFN, name: 'Saddle-free Newton', color: '#a3306b', rule: 'θ ← θ − α |H|⁻¹∇L, |λ| floored at 0.5, step ≤ 0.02', sigMul: 0 },
  sf:     { kind: K_SF, name: 'Schedule-free SGD', color: '#167a5b', rule: 'z ← z − γ g̃(y),  x ← (1−c)x + cz,  y = (1−β)z + βx', avg: 1e9 },
};
const TRAIL_A = { '#c22a40': 0.17, '#4b3fa0': 0.115, '#cf6d0c': 0.16 };
function makeTribe(spec) {
  const base = TB[spec.k];
  const T = Object.assign({ etaMul: 1, sigMul: 1, clip: 0, noise: N_ISO, rest: 'min', avg: 0, sched: null, inkA: 0, key: spec.k }, base, spec);
  T.rgb = hexRGB(T.color);
  if (!T.inkA) T.inkA = TRAIL_A[T.color] || 0.15;
  return T;
}

// ---------------------------------------------------------------------------------------------
// the plates of the atlas. Plate hooks: sheet(R) builds the terrain; names(S) fills areas, paths and
// marks; plan() schedules releases; print(c) adds printed overlays; lines() returns draped or aerial
// lines; step(i) observes particles; frame() runs once per frame; fig(c, w, h) draws the card figure.
// ---------------------------------------------------------------------------------------------
const CHAPTERS = TEXT.chapters;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
const PLATES = [];
// a plate's card text (title, deck, lead, …, refs, cap) lives in text/, under its id
const plateText = (p) => { const t = TEXT.plates[p.id]; if (!t) throw new Error(`no text for plate ${p.id}`); for (const k in t) if (!(k in p)) p[k] = t[k]; return p; };
const plate = (p) => { plateText(p); p.index = PLATES.length; PLATES.push(p); return p; };

plate({
  id: 'survey', ch: 0, seed: 1938,
  run: [
    (T) => {
      T.set('lr', PL.sim.lr); T.clear();
      const a = arcPt(-0.8)[2]; let b = null;
      for (let k = -16; k <= 16; k++) { const r = RVR + k * RVw * 0.1, x = RVcx + r * Math.cos(a), y = RVcy + r * Math.sin(a), v = L(x, y); if (!b || v < b[2]) b = [x, y, v]; }
      T.release(b[0], b[1]);
    },
    null,
    (T) => { T.set('lr', 1.3 * 2 / NAMED.sharp.l2); T.clear(); T.release('Sharp Minimum'); },
  ],
  tribes: [{ k: 'sgd' }, { k: 'hb' }, { k: 'adam' }],
  sim: { lr: 0.004, noise: 0.25, beta: 0.9, beta2: 0.999 },
  ctl: ['lr', 'noise', 'beta'],
  view: { yaw: -8, pitch: 46, zoom: 1 },
  sheet: (R) => { sheetSurvey(R); },
  features: () => { nameSurvey(); surveyLakes(); },
  names: surveyNames,
  plan: planSurvey,
  readouts: () => [['particles', String(STAT.alive)], ['at rest', String(STAT.converged)], ['best L', STAT.best < Infinity ? STAT.best.toFixed(4) : '—'], ['time', mmss(STAT.time)]],
  fig: figRestHistogram,
});

// <<ch1
// ---------------------------------------------------------------------------------------------
// I · Landforms
// ---------------------------------------------------------------------------------------------
function sheetSharpFlat(R, o = {}) {
  sheetBase(R, { bk: 0.2, bk4: 0.022 });
  BX = R.range(-0.08, 0.08); BY = R.range(-0.1, 0.06);
  const fy = R.range(-0.22, 0.05), sy = R.range(-0.05, 0.22);
  FLi = addGauss(-0.62, fy, -(o.flat || 0.74), R.range(0.31, 0.35), R.range(0.25, 0.29), R.range(-0.5, 0.5));
  SHi = addGauss(0.62, sy, -(o.depth || 0.8), R.range(0.052, 0.058), R.range(0.046, 0.05), R.range(0, Math.PI));
  addGauss(0.62, sy, -0.2, 0.2, 0.17, R.range(0, Math.PI));
  addGauss(R.range(-0.06, 0.06), R.range(0.52, 0.64), R.range(0.36, 0.44), 0.3, 0.15, R.range(-0.3, 0.3));
  addGauss(R.range(-0.06, 0.06), R.range(-0.64, -0.52), R.range(0.3, 0.38), 0.28, 0.15, R.range(-0.3, 0.3));
  addGauss(R.range(-1.35, -1.15), R.range(0.55, 0.75), R.range(0.25, 0.32), 0.2, 0.13, R.range(0, 3));
  addGauss(R.range(1.15, 1.35), R.range(-0.75, -0.55), R.range(0.25, 0.32), 0.2, 0.13, R.range(0, 3));
  FEAT.flat = [-0.62, fy]; FEAT.sharp = [0.62, sy];
  sheetEnd(R);
  XSC = 1 / (o.stretch || 1);
}
function sharpFlatFeatures(a = 1) {
  const st = PL.st = { rest: TRIBES.map(() => [0, 0, 0]) };
  for (const k of ['sharp', 'flat']) {
    const m = critAt(FEAT[k][0] * a, FEAT[k][1]);
    if (!m || m.type !== 'min') continue;
    m.prom = prominence(m); m.eps = epsSharp(m, 0.05);
    const sl = sublevel(m, 0.1); m.vol = sl.area; m.mask = sl.mask;
    st[k] = m;
  }
}
function restSharpFlat(i, ring) {
  if (!ring) return;
  const st = PL.st, x = Ex[i], y = Ey[i], t = Tr[i];
  if (st.sharp && Math.hypot(x - st.sharp.x, y - st.sharp.y) < 0.08) st.rest[t][0]++;
  else if (st.flat && Math.hypot(x - st.flat.x, y - st.flat.y) < 0.25) st.rest[t][1]++;
  else st.rest[t][2]++;
}
plate({
  id: 'sharpflat', ch: 0, seed: 2207,
  run: [
    (T) => { T.set('stretch', 2); },
    null,
    (T) => { T.set('stretch', 1); T.set('lr', 7.5 * 2 / PL.st.sharp.l2); T.release('Sharp minimum'); },
  ],
  status: 'contested',
  tribes: [{ k: 'sgd' }, { k: 'gd' }],
  sim: { lr: 0.003, noise: 0.3, stretch: 1 },
  ctl: ['lr', 'noise', { key: 'stretch', label: 'Stretch θ₁ by α', min: 0.5, max: 2, step: 0.01, f: (v) => `α = ${v.toFixed(2)}` }],
  view: { yaw: -4, pitch: 50 },
  sheet: (R) => sheetSharpFlat(R, { stretch: SIM.stretch }),
  features: () => sharpFlatFeatures(SIM.stretch),
  names: (S) => {
    const { sharp, flat } = PL.st;
    if (flat) {
      S.areas.push({ x: flat.x, y: flat.y, lines: ['Flat Basin'], size: 15.5, ls: 3.2, south: true });
      S.marks.push({ p: flat, name: 'Flat minimum', sub: `λ ${flat.l2.toFixed(1)} · volume ${flat.vol.toFixed(3)}`, sym: 'min', pri: 8 });
    }
    if (sharp) S.marks.push({ p: sharp, name: 'Sharp minimum', sub: `λ ${sharp.l2.toFixed(0)} · 2/λ ${(2 / sharp.l2).toFixed(4)} · volume ${sharp.vol.toFixed(4)}`, sym: 'min', pri: 9 });
  },
  print0: () => {
    for (const k of ['sharp', 'flat']) {
      const m = PL.st[k]; if (!m) continue;
      const ch = maskChains(m.mask, k === 'sharp' ? 1 : 2);
      hatchChains(ch, 'rgba(36,38,43,0.42)', 3, -0.8, 0.5);
      strokeChains(ch, 'rgba(36,38,43,0.7)', 0.7);
    }
  },
  plan: () => {
    const a = SIM.stretch;
    for (let k = 0; k < 5; k++) RELEASES.push([RPLAN.range(-0.12, 0.12) * a, RPLAN.range(-0.42, 0.42)]);
    RELEASES.more = () => mitchellHigh(RPLAN);
  },
  retire: restSharpFlat,
  onSim: (k) => { if (k === 'stretch') reshape(); },
  readouts: () => {
    const { sharp, flat, rest } = PL.st;
    return [['H eigenvalues, sharp', sharp ? `${sharp.l1.toFixed(0)} · ${sharp.l2.toFixed(0)}` : '—'], ['H eigenvalues, flat', flat ? `${flat.l1.toFixed(1)} · ${flat.l2.toFixed(1)}` : '—'],
      ['SGD at rest', `${rest[0][0]} sharp · ${rest[0][1]} flat`], ['GD at rest', `${rest[1][0]} sharp · ${rest[1][1]} flat`]];
  },
  fig: (c, w, h) => {
    const { sharp, flat } = PL.st; if (!sharp || !flat) return;
    const x0 = 24, y0 = 8, x1 = w - 6, y1 = h - 28, ext = 0.38, n = 260, xs = [], ys = [];
    const dx = flat.x - sharp.x, dy = flat.y - sharp.y, len = Math.hypot(dx, dy), t0 = -ext / len, t1 = 1 + ext / len;
    for (let k = 0; k <= n; k++) { const t = t0 + (t1 - t0) * k / n; xs.push(k / n); ys.push(L(sharp.x + dx * t, sharp.y + dy * t)); }
    FIG.axes(c, x0, y0, x1, y1, 'section through both minima', 'L');
    const r = figSeries(c, x0, y0, x1, y1, [{ ys, xs, color: INK, w: 1.2 }], { xmax: 1, ymin: 0 });
    c.setLineDash([2, 2]); c.strokeStyle = 'rgba(36,38,43,0.45)'; c.lineWidth = 0.8;
    for (const m of [sharp, flat]) { const yy = r.ty(m.L + 0.1); c.beginPath(); c.moveTo(x0, yy); c.lineTo(x1, yy); c.stroke(); }
    c.setLineDash([]);
    FIG.note(c, x0 + (x1 - x0) * (-t0) / (t1 - t0), r.ty(sharp.L) + 9, 'sharp', INK, 'center');
    FIG.note(c, x0 + (x1 - x0) * (1 - t0) / (t1 - t0), r.ty(flat.L) + 9, 'flat', INK, 'center');
  },
});

// --- singular minima and the learning coefficient: four minima of the same depth, measured by how their
// sublevel volumes shrink. Local coordinates (u, v) are θ offsets divided by SING_S and turned by each basin's angle.
const SING_S = 0.3, SING_A = 0.9, SING_H = 1.3, SING_TAU = 0.04;
const SING = [
  { key: 'A', name: 'Regular well', form: 'u² + v²', rank: 2, lam: 1, color: '#c22a40', p: (u, v) => u * u + v * v },
  { key: 'B', name: 'Quartic trough', form: 'u² + v⁴', rank: 1, lam: 0.75, color: '#cf6d0c', p: (u, v) => u * u + v * v * v * v },
  { key: 'C', name: 'Flat floor', form: 'u⁴ + v⁴', rank: 0, lam: 0.5, color: '#4b3fa0', p: (u, v) => u * u * u * u + v * v * v * v },
  { key: 'D', name: 'Level valley', form: 'u² on a segment', rank: 1, lam: 0.5, color: '#167a5b', p: (u, v) => { const w = Math.max(0, Math.abs(v) - 1); return u * u + 30 * w * w * w * w; } },
];
const singUV = (k, x, y, o) => { const f = FEAT.sing[k], dx = (x - f.x) / SING_S, dy = (y - f.y) / SING_S, c = Math.cos(f.a), s = Math.sin(f.a); o[0] = c * dx + s * dy; o[1] = -s * dx + c * dy; return o; };
const singXY = (k, u, v, o) => { const f = FEAT.sing[k], c = Math.cos(f.a), s = Math.sin(f.a); o[0] = f.x + SING_S * (c * u - s * v); o[1] = f.y + SING_S * (s * u + c * v); return o; };
function sheetSingular(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0.03 });
  const cells = [[-0.78, 0.46], [0.78, 0.46], [-0.78, -0.46], [0.78, -0.46]];
  FEAT.sing = cells.map(([x, y], k) => ({ x: x + R.range(-0.06, 0.06), y: y + R.range(-0.05, 0.05), a: k === 3 ? R.range(-0.25, 0.25) : R.range(-0.6, 0.6) }));
  const UV = [0, 0];
  EXTRA = (x, y) => {
    let acc = 0, rmin = 1e9;
    for (let k = 0; k < 4; k++) {
      singUV(k, x, y, UV);
      const p = SING_A * SING[k].p(UV[0], UV[1]), ps = SING_H * p / (SING_H + p);
      acc += Math.exp(-ps / SING_TAU);
      const r = k === 3 ? Math.hypot(UV[0], Math.max(0, Math.abs(UV[1]) - 1)) : Math.hypot(UV[0], UV[1]);
      if (r < rmin) rmin = r;
    }
    // inside r < 1.1 (local units) the surface is exactly the polynomial: no texture, no relief term
    const w = sq5((rmin - 1.1) / 0.7);
    EXCALM = (1 / 0.88) * (1 - w);
    return -SING_TAU * Math.log(acc) + w * 0.1 * ((x / 1.6) * (x / 1.6) + y * y);
  };
  sheetEnd(R, true);
}
// sublevel volumes V(ε) = |{L − L* < ε}| counted on a grid in each basin's own box, and the log-log slope
function singVolumes() {
  const st = PL.st, eps = [], P = [0, 0];
  for (let e = -5; e <= -1.0001; e += 0.25) eps.push(Math.pow(10, e));
  st.eps = eps; st.vol = SING.map(() => []); st.slope = [];
  const n = PHONE ? 48 : 72;
  for (let k = 0; k < 4; k++) {
    const Ls = st.Ls[k], sc = (q) => Math.pow(q / SING_A * 1.25, 0.5), sq = (q) => Math.pow(q / SING_A * 1.25, 0.25);
    for (const e of eps) {
      const hu = k === 2 ? sq(e) : sc(e), hv = k === 0 ? sc(e) : k === 3 ? 1 + Math.pow(e / (30 * SING_A) * 1.25, 0.25) : sq(e);
      let cnt = 0;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        singXY(k, (2 * (i + 0.5) / n - 1) * hu, (2 * (j + 0.5) / n - 1) * hv, P);
        if (L(P[0], P[1]) - Ls < e) cnt++;
      }
      st.vol[k].push(cnt / (n * n) * 4 * hu * hv * SING_S * SING_S);
    }
    // least-squares slope of log V on log ε over 10⁻⁴ … 10⁻²
    let sx = 0, sy = 0, sxx = 0, sxy = 0, m = 0;
    eps.forEach((e, q) => { if (e < 0.99e-4 || e > 1.01e-2) return; const X = Math.log(e), Y = Math.log(st.vol[k][q]); sx += X; sy += Y; sxx += X * X; sxy += X * Y; m++; });
    st.slope.push((m * sxy - sx * sy) / (m * sxx - sx * sx));
  }
}
function singFill() {
  const st = PL.st, per = PHONE ? 12 : 24, P = [0, 0];
  const have = [0, 0, 0, 0];
  for (let i = 0; i < hiW; i++) if (Alive[i] && Tag[i] > 0) have[Tag[i] - 1]++;
  for (let k = 0; k < 4; k++) for (let q = have[k]; q < per; q++) {
    if (k === 3) singXY(k, RREL.normal() * 0.02, RREL.range(-1, 1), P); else singXY(k, RREL.normal() * 0.02, RREL.normal() * 0.02, P);
    spawn(P[0], P[1], 0, { tag: k + 1, rgb: hexRGB(SING[k].color) });
  }
}
function singReset() { const st = PL.st; st.sum = [0, 0, 0, 0]; st.cnt = [0, 0, 0, 0]; st.t0 = STAT.steps; }
plate({
  id: 'singular', ch: 4, seed: 2309,
  run: [
    null,
    null,
    (T) => { T.set('temp', PL.sim.temp); },
    (T) => { T.set('temp', 0.02); },
  ],
  status: 'established',
  tribes: [{ k: 'sgd', name: 'Langevin particles', rule: 'θ ← θ − η∇L + √(2ηT) ξ', rest: 'never', maxAge: 1e9, inkA: 0.03 }],
  sim: { lr: 0.002, temp: 0.004 },
  ctl: [{ key: 'temp', label: 'Temperature T', min: 0.001, max: 0.02, scale: 'log', f: (v) => v.toFixed(4) }],
  view: { yaw: -6, pitch: 54 },
  figH: 260, speed: 4, fade: 0.05,
  sheet: sheetSingular,
  features: () => {
    const st = PL.st = { Ls: FEAT.sing.map((f) => L(f.x, f.y)) };
    SIM.noise = Math.sqrt(2 * SIM.temp / SIM.lr);
    singVolumes(); singReset();
  },
  names: (S) => {
    const st = PL.st, P = [0, 0];
    SING.forEach((B, k) => {
      const at = k === 3 ? singXY(k, 0, 0.7, P).slice() : [FEAT.sing[k].x, FEAT.sing[k].y];
      S.marks.push({ p: { x: at[0], y: at[1] }, name: B.name, sub: `${B.form} · rank H ${B.rank} · λ = ${B.lam}`, sym: 'min', pri: 9 - k });
    });
  },
  print: () => {
    const c = sc, P = [0, 0];
    c.save(); c.strokeStyle = 'rgba(44,104,148,0.85)'; c.lineWidth = 1.3; c.beginPath();
    singXY(3, 0, -1, P); c.moveTo(ox(P[0]), oy(P[1])); singXY(3, 0, 1, P); c.lineTo(ox(P[0]), oy(P[1])); c.stroke(); c.restore();
  },
  setup: () => singFill(),
  release: () => { singFill(); nextRelease = STAT.steps + 30; },
  click: (x, y) => {},
  step: (i) => {
    const st = PL.st, k = Tag[i] - 1; if (k < 0) return;
    const f = FEAT.sing[k], UV = singUV(k, Wx[i], Wy[i], [0, 0]);
    const r = k === 3 ? Math.hypot(UV[0], Math.max(0, Math.abs(UV[1]) - 1)) : Math.hypot(UV[0], UV[1]);
    if (r > 1.6) { retire(i, false); return false; }
    if (Age[i] > 400) { st.sum[k] += L(Wx[i], Wy[i]) - st.Ls[k]; st.cnt[k]++; }
  },
  onSim: (k) => { if (k === 'temp') { SIM.noise = Math.sqrt(2 * SIM.temp / SIM.lr); singReset(); for (let i = 0; i < hiW; i++) if (Alive[i]) Age[i] = 0; } },
  readouts: () => {
    const st = PL.st, est = st.cnt.map((n, k) => (n > 0 ? (st.sum[k] / n / SIM.temp).toFixed(2) : '…'));
    return [['T', SIM.temp.toFixed(4)], ['λ from volumes', st.slope.map((v) => v.toFixed(2)).join(' · ')], ['λ̂ from particles', est.join(' · ')]];
  },
  debug: () => { const st = PL.st; return { slope: st.slope.map((v) => +v.toFixed(3)), est: st.cnt.map((n, k) => (n ? +(st.sum[k] / n / SIM.temp).toFixed(3) : null)), n: st.cnt }; },
  fig: (c, w, h) => {
    const st = PL.st, hh = (h - 12) / 2, x0 = 30, x1 = w - 6;
    let y0 = 8, y1 = hh - 22;
    FIG.axes(c, x0, y0, x1, y1, 'log₁₀ ε', 'log₁₀ V(ε)');
    const lx = st.eps.map((e) => Math.log10(e));
    const series = SING.map((B, k) => ({ xs: lx.map((v) => v + 5), ys: st.vol[k].map((v) => Math.log10(v)), color: B.color, w: 1.4 }));
    const r = figSeries(c, x0, y0, x1, y1, series, { xmax: 4 });
    for (const e of [-5, -3, -1]) FIG.tick(c, x0 + (x1 - x0) * (e + 5) / 4, y1 + 4, String(e));
    let lastY = -1e9;
    SING.map((B, k) => [k, r.ty(Math.log10(st.vol[k][0]))]).sort((p, q) => p[1] - q[1]).forEach(([k, Y]) => { const yy = Math.max(Y - 5, lastY + 11); lastY = yy; FIG.note(c, x0 + 6, yy, `${SING[k].key} · slope ${st.slope[k].toFixed(2)}`, SING[k].color); });
    y0 = hh + 14; y1 = h - 28;
    const gw = (w - 12) / 4, ty = (v) => y1 - (y1 - y0) * clamp(v, 0, 1.2) / 1.2;
    SING.forEach((B, k) => {
      const X = 8 + k * gw + gw / 2, est = st.cnt[k] ? st.sum[k] / st.cnt[k] / SIM.temp : NaN;
      c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(X - 13.5, ty(B.lam) + 0.5, 12, y1 - ty(B.lam) - 0.5);
      if (Number.isFinite(est)) { c.fillStyle = rgba(B.color, 0.85); c.fillRect(X + 1, ty(est), 12, y1 - ty(est)); FIG.tick(c, X + 7, ty(est) - 11, est.toFixed(2)); }
      FIG.tick(c, X, y1 + 4, `${B.key} · λ ${B.lam}`);
    });
    c.strokeStyle = 'rgba(36,38,43,0.4)'; c.beginPath(); c.moveTo(8, y1 + 0.5); c.lineTo(w - 4, y1 + 0.5); c.stroke();
  },
});

// --- same loss, different minima: pretraining minimizes the sum of two data sources' losses. The map is the total
// L = L₁ + L₂, mirror-symmetric in θ₁, so its two minima on the floor of one valley have the same loss and the same
// Hessian. The sources share the total's shape and differ by a tilt across the valley, L_k = L/2 ± p(θ₁)T(θ₂): slight at
// the common minimum, strong at the compromise, where each source's own minimum lies well off the floor
const COM = { x: 0.75, s: 1, beta: 0.04, kap: 4, sc: 0.45, bk: 0.1, p0: 0.06, p1: 1.1, xr: 0.1, w: 0.45, st: 0.4, T: 8000, delta: 0.006, hills: [] };
const COM_INK = ['#4b3fa0', '#cf6d0c'];           // source 1, source 2
const comP = (x) => COM.p0 + COM.p1 * 0.5 * (1 + Math.tanh((COM.s * x - COM.xr) / COM.w));
const comDP = (x) => { const c = Math.cosh((COM.s * x - COM.xr) / COM.w); return COM.s * COM.p1 * 0.5 / (COM.w * c * c); };
const comT = (y) => COM.st * Math.tanh(y / COM.st);
const comDT = (y) => { const c = Math.cosh(y / COM.st); return 1 / (c * c); };
const comLk = (k, x, y) => 0.5 * L(x, y) + (k ? -1 : 1) * comP(x) * comT(y);        // k = 0: source 1, k = 1: source 2
// the downstream loss: the expected loss of a new source drawn like the two (tilt zp with E z² = 3, its own minimum as
// low as theirs to second order), L/2 + 2p²/λ with λ the curvature across the valley
const comD = (x, y) => 0.5 * L(x, y) + 2 * comP(x) * comP(x) / PL.st.lamY;
const COMG = [0, 0], COMA = [0, 0], COMB = [0, 0], COMS = [0, 0];
function comTilt(x, y) { COMG[0] = comDP(x) * comT(y); COMG[1] = comP(x) * comDT(y); return COMG; }      // ∇(pT)
function comGrad(k, x, y, o) { grad(x, y); comTilt(x, y); const sg = k ? -1 : 1; o[0] = 0.5 * gX + sg * COMG[0]; o[1] = 0.5 * gY + sg * COMG[1]; return o; }
function sheetCommon(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0.03 });
  SYMM = 2;
  COM.s = R() < 0.5 ? 1 : -1;
  COM.beta = R.range(0.036, 0.044); COM.p1 = R.range(1.0, 1.2); COM.xr = R.range(0.05, 0.15);
  COM.hills = [];
  for (let k = 0; k < 5; k++) COM.hills.push([R.range(-1.3, 1.3), (k % 2 ? 1 : -1) * R.range(0.56, 0.7), R.range(0.3, 0.6), R.range(0.18, 0.32), R.range(0.11, 0.15)]);
  EXTRA = (x, y) => {
    const u = x / COM.x, ay = Math.abs(y), y2 = y * y;
    EXCALM = (1 / 0.88) * (1 - sq5((ay - 0.22) / 0.2));          // no texture on the valley floor
    let z = COM.beta * (u * u - 1) * (u * u - 1) + COM.kap * COM.sc * COM.sc * (1 - Math.exp(-y2 / (COM.sc * COM.sc))) + COM.bk * y2 + 0.9 * y2 * y2 * y2;
    for (const [hx, hy, a, sx, sy] of COM.hills) { const dx = (x - hx) / sx, dy = (y - hy) / sy; z += a * Math.exp(-0.5 * (dx * dx + dy * dy)); }
    return z;
  };
  sheetEnd(R, true);
}
// a source's own minimum near (x, y): descent, then Newton on its gradient
function comMin(k, x, y) {
  const g = COMS, h = 1e-4;
  for (let it = 0; it < 120; it++) { comGrad(k, x, y, g); const n = Math.hypot(g[0], g[1]); if (n < 1e-3) break; const s = Math.min(0.01, 0.05 * n) / n; x -= s * g[0]; y -= s * g[1]; }
  for (let it = 0; it < 40; it++) {
    comGrad(k, x + h, y, COMA); comGrad(k, x, y + h, COMB); comGrad(k, x, y, g);
    const a = (COMA[0] - g[0]) / h, b = 0.5 * ((COMA[1] - g[1]) / h + (COMB[0] - g[0]) / h), d = (COMB[1] - g[1]) / h, det = a * d - b * b;
    if (!(det > 1e-9 && a > 0)) break;
    let sx = (d * g[0] - b * g[1]) / det, sy = (a * g[1] - b * g[0]) / det; const sl = Math.hypot(sx, sy);
    if (sl > 0.02) { sx *= 0.02 / sl; sy *= 0.02 / sl; }
    x -= sx; y -= sy; if (sl < 1e-10) break;
  }
  return { x, y, L: comLk(k, x, y) };
}
// the region where source k is within δ of its own minimum m, flooded on the height grid; outlines in print units
function comRegion(k, m) {
  const sub = PHONE ? 1 : 2, dx = GDX * sub, dy = GDY * sub, nI = Math.floor((GW - 1) / sub), nJ = Math.floor((GH - 1) / sub), sg = k ? -1 : 1;
  const i0 = clamp(Math.floor((m.x - 0.55 - X0) / dx), 0, nI), i1 = clamp(Math.ceil((m.x + 0.55 - X0) / dx), 0, nI);
  const j0 = clamp(Math.floor((m.y - 0.34 - Y0) / dy), 0, nJ), j1 = clamp(Math.ceil((m.y + 0.34 - Y0) / dy), 0, nJ);
  const W = i1 - i0 + 1, H = j1 - j0 + 1, V = new Float32Array(W * H), mask = new Float32Array(W * H), q = new Int32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const x = X0 + (i0 + i) * dx, y = Y0 + (j0 + j) * dy; V[j * W + i] = 0.5 * HG[(j0 + j) * sub * GW + (i0 + i) * sub] + sg * comP(x) * comT(y); }
  const s0 = clamp(Math.round((m.y - Y0) / dy) - j0, 0, H - 1) * W + clamp(Math.round((m.x - X0) / dx) - i0, 0, W - 1);
  for (let delta = COM.delta, tries = 0; tries < 5; tries++, delta *= 0.6) {
    const lev = m.L + delta; mask.fill(0); let qh = 0, qt = 0, edge = false;
    if (V[s0] >= lev) continue;
    q[qt++] = s0; mask[s0] = 1;
    while (qh < qt) {
      const c = q[qh++], i = c % W, j = (c / W) | 0;
      if (i === 0 || j === 0 || i === W - 1 || j === H - 1) { edge = true; break; }
      for (const n of [c - 1, c + 1, c - W, c + W]) if (!mask[n] && V[n] < lev) { mask[n] = 1; q[qt++] = n; }
    }
    if (!edge) return { chains: isoChains(mask, W, H, X0 + i0 * dx, Y0 + j0 * dy, dx, dy, 0.5), delta };
  }
  return { chains: [], delta: 0 };
}
// the Nexus-style step: one inner step of γ on a source, one on the other from there (the order drawn at random), and an
// SGD step of η on the displacement divided by γ, with the same gradient noise as SGD
const COMD = [0, 0];
function comNexus(i, x, y, eta, g1, g2) {
  const n1 = g1 - gX, n2 = g2 - gY, gam = SIM.gam, a = NR() < 0.5 ? 0 : 1, sg = a ? -1 : 1;
  comTilt(x, y);
  const ax = 0.5 * gX + sg * COMG[0], ay = 0.5 * gY + sg * COMG[1];
  comGrad(1 - a, x - gam * ax, y - gam * ay, COMB);
  COMD[0] = -eta * (ax + COMB[0] + n1); COMD[1] = -eta * (ay + COMB[1] + n2);
  return COMD;
}
// the Nexus-style step averaged over the two orders, without noise: to second order ∇(L − (γ/2)∇L₁·∇L₂)
function comExpected(x, y) {
  const gam = SIM.gam; let sx = 0, sy = 0;
  for (const a of [0, 1]) { comGrad(a, x, y, COMA); const ax = COMA[0], ay = COMA[1]; comGrad(1 - a, x - gam * ax, y - gam * ay, COMB); sx += ax + COMB[0]; sy += ay + COMB[1]; }
  return Math.hypot(sx, sy) / 2;
}
function comReset() { const st = PL.st; st.rest = TRIBES.map(() => [0, 0, 0]); st.dsum = TRIBES.map(() => 0); st.dn = TRIBES.map(() => 0); }
function comFeatures() {
  const st = PL.st = {}, s = COM.s;
  comReset();
  st.C = critAt(-s * COM.x, 0) || minNear(-s * COM.x, 0); st.M = critAt(s * COM.x, 0) || minNear(s * COM.x, 0); st.pass = critAt(0, 0);
  hess(st.C.x, st.C.y); st.lamY = hYY;
  st.own = [0, 1].map((k) => [comMin(k, st.C.x, st.C.y - 0.02 * (k ? -1 : 1)), comMin(k, st.M.x + 0.1 * s, st.M.y - 0.26 * (k ? -1 : 1))]);
  st.reg = st.own.map((o, k) => o.map((m) => comRegion(k, m)));
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), ex = (m, j) => 0.5 * (comLk(0, m.x, m.y) - st.own[0][j].L + comLk(1, m.x, m.y) - st.own[1][j].L);
  st.dC = d(st.own[0][0], st.own[1][0]); st.dM = d(st.own[0][1], st.own[1][1]);
  st.exC = ex(st.C, 0); st.exM = ex(st.M, 1);
  st.DC = comD(st.C.x, st.C.y); st.DM = comD(st.M.x, st.M.y);
  // the valley floor, from beyond the common minimum to beyond the compromise, for the figure
  const n = 150, pr = st.prof = { t: [], L: [], g2: [], p: [], D: [] };
  for (let k = 0; k <= n; k++) {
    const t = -1.15 + 2.3 * k / n, x = s * t; grad(x, 0);
    pr.t.push(t); pr.L.push(L(x, 0)); pr.g2.push(gX * gX + gY * gY); pr.p.push(comP(x)); pr.D.push(comD(x, 0));
  }
}
plate({
  id: 'common', ch: 4, seed: 2417,
  run: [
    null,
    (T) => { T.set('gam', PL.sim.gam); T.set('noise', PL.sim.noise); T.clear(); comReset(); T.release('Compromise minimum'); },
    (T) => { T.set('noise', PL.sim.noise); T.set('gam', 0); },
    (T) => { T.set('noise', PL.sim.noise); T.set('gam', 0.05); },
    (T) => { T.set('gam', PL.sim.gam); T.set('noise', 0); },
  ],
  status: 'open',
  get tribes() {            // a getter, read when the plate is built: K_FN is defined further down the file
    return [{ k: 'sgd', maxAge: COM.T },
      { k: 'sgd', name: 'Nexus-style', color: '#167a5b', kind: K_FN, fn: comNexus, nexus: true, maxAge: COM.T, rule: 'θ′ = θ − γ∇L₁(θ),  θ ← θ − η[∇L₁(θ) + ∇L₂(θ′) + ξ],  sources in random order' }];
  },
  sim: { lr: 0.008, noise: 0.3, gam: 0.2 },
  ctl: ['noise', { key: 'gam', label: 'Inner step γ (Nexus-style)', min: 0, max: 0.3, step: 0.005, f: (v) => v.toFixed(3) }],
  view: { yaw: -6, pitch: 52 },
  speed: 5, figH: 270,
  sheet: sheetCommon,
  features: comFeatures,
  names: (S) => {
    const st = PL.st;
    S.marks.push({ p: st.C, name: 'Common minimum', sub: `L ${st.C.L.toFixed(3)} · own minima ${st.dC.toFixed(2)} apart`, sym: 'min', pri: 9 });
    S.marks.push({ p: st.M, name: 'Compromise minimum', sub: `L ${st.M.L.toFixed(3)} · own minima ${st.dM.toFixed(2)} apart`, sym: 'min', pri: 9 });
    if (st.pass && st.pass.type === 'saddle') S.marks.push({ p: st.pass, name: '', sub: `${st.pass.L.toFixed(3)}`, sym: 'pass', pri: 4, pin: false });
  },
  print0: () => {
    PL.st.reg.forEach((rs, k) => { for (const r of rs) hatchChains(r.chains, rgba(COM_INK[k], 0.5), 3.4, k ? 0.8 : -0.8, 0.6); });
  },
  print: () => {
    const st = PL.st, c = sc;
    st.reg.forEach((rs, k) => { for (const r of rs) strokeChains(r.chains, rgba(COM_INK[k], 0.9), 1.1); });
    c.save(); c.setLineDash([3, 2.4]); c.strokeStyle = 'rgba(36,38,43,0.65)'; c.lineWidth = 0.8;
    for (const j of [0, 1]) { const a = st.own[0][j], b = st.own[1][j]; c.beginPath(); c.moveTo(ox(a.x), oy(a.y)); c.lineTo(ox(b.x), oy(b.y)); c.stroke(); }
    c.setLineDash([]);
    st.own.forEach((o, k) => { for (const m of o) { c.fillStyle = COM_INK[k]; c.beginPath(); c.arc(ox(m.x), oy(m.y), 2.5, 0, TAU); c.fill(); } });
    c.font = `italic 400 ${10.5 * FS}px ${SERIF}`; c.textBaseline = 'middle'; c.lineJoin = 'round';
    st.own.forEach((o, k) => {
      const m = o[1], up = m.y > st.M.y, tx = ox(m.x) + 6 * COM.s, ty = oy(m.y) + (up ? -11 : 11);
      c.textAlign = COM.s > 0 ? 'left' : 'right';
      c.strokeStyle = 'rgba(236,238,232,0.9)'; c.lineWidth = 3; c.strokeText(`source ${k + 1}`, tx, ty);
      c.fillStyle = COM_INK[k]; c.fillText(`source ${k + 1}`, tx, ty);
    });
    c.restore();
  },
  plan: () => { PL.st.pend = null; },
  // cohorts are released in mirrored pairs, so the total loss gives neither minimum an advantage
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 60) { nextRelease = STAT.steps + 45; return; }
    let p;
    if (st.pend) { p = st.pend; st.pend = null; } else { p = mitchellHigh(RPLAN, 0.15); st.pend = [-p[0], p[1]]; RELEASES.push(p, st.pend); }
    releaseCaravan(p[0], p[1], PHONE ? 8 : 14);
    nextRelease = STAT.steps + (st.pend ? 40 : 320);
  },
  restOK: (i) => !TRIBES[Tr[i]].nexus || comExpected(Ex[i], Ey[i]) < 0.02,
  retire: (i, ring) => {
    const st = PL.st, t = Tr[i];
    if (!ring) { if (Age[i] > COM.T) st.rest[t][2]++; return; }
    const k = Math.hypot(Ex[i] - st.C.x, Ey[i] - st.C.y) < 0.15 ? 0 : Math.hypot(Ex[i] - st.M.x, Ey[i] - st.M.y) < 0.15 ? 1 : 2;
    st.rest[t][k]++; st.dsum[t] += comD(Ex[i], Ey[i]); st.dn[t]++;
  },
  onSim: (k) => { if (k === 'gam' || k === 'noise') comReset(); },
  readouts: () => {
    const st = PL.st, f = (t) => { const r = st.rest[t]; return `${r[0]} common · ${r[1]} compromise${r[2] ? ` · ${r[2]} neither` : ''}`; };
    const e = (m) => `${m.l1.toFixed(2)}, ${m.l2.toFixed(2)}`;
    return [['L, common · compromise', `${st.C.L.toFixed(3)} · ${st.M.L.toFixed(3)}`], ['Hessian eigenvalues', `${e(st.C)} · ${e(st.M)}`],
      ['own minima apart', `${st.dC.toFixed(2)} · ${st.dM.toFixed(2)}`], ['downstream loss', `${st.DC.toFixed(3)} · ${st.DM.toFixed(3)}`],
      ['SGD at rest', f(0)], ['Nexus-style at rest', f(1)]];
  },
  debug: () => {
    const st = PL.st, r4 = (v) => +v.toFixed(4), pt = (m) => [r4(m.x), r4(m.y), r4(m.L)];
    return { rest: st.rest, dsum: st.dsum.map(r4), C: pt(st.C), M: pt(st.M), pass: st.pass && pt(st.pass), HC: [r4(st.C.l1), r4(st.C.l2)], HM: [r4(st.M.l1), r4(st.M.l2)],
      own: st.own.map((o) => o.map(pt)), dC: r4(st.dC), dM: r4(st.dM), exC: r4(st.exC), exM: r4(st.exM), DC: r4(st.DC), DM: r4(st.DM), lamY: r4(st.lamY),
      delta: st.reg.map((o) => o.map((r) => r4(r.delta))), s: COM.s };
  },
  fig: (c, w, h) => {
    const st = PL.st, pr = st.prof, n = pr.t.length, gam = SIM.gam, x0 = 32, x1 = w - 8, hh = Math.round((h - 10) * 0.6);
    let y0 = 10, y1 = hh - 22;
    // the floor as each optimizer sees it: L, and on average for Nexus-style L − (γ/2)∇L₁·∇L₂, with ∇L₁·∇L₂ = |∇L|²/4 − p² there
    const J = pr.L.map((v, k) => v - 0.5 * gam * (pr.g2[k] / 4 - pr.p[k] * pr.p[k]));
    const kC = Math.round((COM.s * st.C.x + 1.15) / 2.3 * (n - 1)), kM = Math.round((COM.s * st.M.x + 1.15) / 2.3 * (n - 1)), off = J[kC] - pr.L[kC];
    for (let k = 0; k < n; k++) J[k] -= off;
    FIG.axes(c, x0, y0, x1, y1, 'along θ₂ = 0', 'loss');
    const ymax = Math.max(0.1, pr.D[kM], J[kM]) * 1.18, DINK = 'rgba(36,38,43,0.7)';
    const r = figSeries(c, x0, y0, x1, y1, [{ ys: pr.D, color: DINK, w: 1.2, dash: [4, 2.5] }, { ys: J, color: '#167a5b', w: 1.5 }, { ys: pr.L, color: INK, w: 1.5 }], { xmax: n - 1, ymin: 0, ymax });
    for (const v of [0, 0.1, 0.2, 0.3].filter((v) => v < ymax)) FIG.tick(c, x0 - 3, r.ty(v), v.toFixed(1), 'right', 'middle');
    FIG.tick(c, r.tx(kC), y1 + 4, 'common'); FIG.tick(c, r.tx(kM), y1 + 4, 'compromise');
    // the lift of the compromise, and the barrier between the minima
    let top = 0; for (let k = Math.min(kC, kM); k <= Math.max(kC, kM); k++) top = Math.max(top, pr.L[k]);
    const lift = J[kM] - pr.L[kM], kTop = (kC + kM) >> 1;
    c.setLineDash([2, 2]); c.strokeStyle = 'rgba(22,122,91,0.8)'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(r.tx(kM), r.ty(pr.L[kM])); c.lineTo(r.tx(kM), r.ty(J[kM])); c.stroke(); c.setLineDash([]);
    if (lift > 0.004) FIG.tick(c, r.tx(kM) - 4, (r.ty(pr.L[kM]) + r.ty(J[kM])) / 2, `lift ${lift.toFixed(2)}`, 'right', 'middle');
    let hi = top; for (let k = Math.max(0, kTop - 24); k <= Math.min(n - 1, kTop + 24); k++) hi = Math.max(hi, J[k], pr.D[k]);
    c.setLineDash([1, 2]); c.strokeStyle = 'rgba(36,38,43,0.5)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(r.tx(kTop), r.ty(top) - 2); c.lineTo(r.tx(kTop), r.ty(hi) - 3); c.stroke(); c.setLineDash([]);
    FIG.tick(c, r.tx(kTop), r.ty(hi) - 13, `barrier ${(top - st.C.L).toFixed(3)}`);
    // key, in the empty upper corner on the common side (the profile runs from the common minimum to the compromise)
    const kx = x0 + 34;
    [['L', INK, []], ['Nexus-style, on average', '#167a5b', []], ['downstream', DINK, [4, 2.5]]].forEach(([txt, col, dash], q) => {
      const y = y0 + 6 + 12 * q; c.strokeStyle = col; c.lineWidth = 1.4; c.setLineDash(dash);
      c.beginPath(); c.moveTo(kx, y); c.lineTo(kx + 14, y); c.stroke(); c.setLineDash([]); FIG.note(c, kx + 18, y, txt, col);
    });
    // where each optimizer's particles came to rest, and the mean downstream loss there
    y0 = hh + 6; const rowH = (h - 6 - y0) / 2, bx0 = x0 + 66, bx1 = x1;
    TRIBES.forEach((T, t) => {
      const rr = st.rest[t], tot = rr[0] + rr[1], y = y0 + t * rowH + rowH * 0.4, bh = Math.min(12, rowH * 0.36);
      FIG.note(c, 8, y, T.name, T.color);
      if (st.dn[t]) FIG.tick(c, 8, y + 9, `downstream ${(st.dsum[t] / st.dn[t]).toFixed(3)}`, 'left');
      c.strokeStyle = rgba(T.color, 0.9); c.lineWidth = 1; c.strokeRect(bx0 + 0.5, y - bh / 2 + 0.5, bx1 - bx0 - 1, bh - 1);
      if (!tot) { FIG.tick(c, (bx0 + bx1) / 2, y + bh / 2 + 3, 'no particle at rest yet'); return; }
      c.fillStyle = rgba(T.color, 0.8); c.fillRect(bx0, y - bh / 2, (bx1 - bx0) * rr[0] / tot, bh);
      FIG.tick(c, bx0, y + bh / 2 + 3, `${rr[0]} common`, 'left'); FIG.tick(c, bx1, y + bh / 2 + 3, `${rr[1]} compromise`, 'right');
    });
  },
});

// --- saddles
function sheetSaddle(R) {
  sheetBase(R, { bk: 0.1, bk4: 0.016, na: 0.03 });
  SYMM = 2;
  const hy = R.range(0.5, 0.56), bx = R.range(0.58, 0.66), by = R.range(-0.05, 0.05), ang = R.range(-0.3, 0.3), amp = R.range(0.52, 0.58);
  addGauss(0, hy, R.range(0.55, 0.65), 0.36, 0.19, 0);
  addGauss(0, -hy, R.range(0.5, 0.6), 0.36, 0.19, 0);
  for (const s of [1, -1]) addGauss(s * bx, by, -amp, 0.32, 0.26, s * ang);
  const cx = R.range(1.15, 1.35), cy = R.range(0.55, 0.75), ca = R.range(0.22, 0.3), cyy = R.range(-0.8, -0.6), cb = R.range(0.2, 0.28);
  for (const s of [1, -1]) { addGauss(s * cx, cy, ca, 0.2, 0.14, s * 0.5); addGauss(s * (cx - 0.1), cyy, cb, 0.18, 0.13, -s * 0.4); }
  FEAT.basin = [bx, by];
  sheetEnd(R);
}
function pgdNoise(i, x, y, s, R, out) {
  out[0] = 0; out[1] = 0;
  grad(x, y);
  if (Math.hypot(gX, gY) < 0.05 && Age[i] - Tag[i] > 40) {
    Tag[i] = Age[i];
    const r = 0.003 * Math.sqrt(R()), a = R() * TAU, eta = SIM.lr;
    out[0] = -r * Math.cos(a) / eta; out[1] = -r * Math.sin(a) / eta;
  }
}
plate({
  id: 'saddles', ch: 0, seed: 3121,
  run: [
    null,
    null,
    null,
    (T) => { T.set('lr', PL.sim.lr); T.set('noise', 0); },
  ],
  status: 'established',
  tribes: [{ k: 'gd' }, { k: 'gd', name: 'Perturbed GD', color: '#2b2c31', rule: 'if ‖∇L‖ < 0.05: θ ← θ + ξ', noise: N_FN, sigMul: 1, noiseFn: pgdNoise }, { k: 'sgd', color: '#cf6d0c' }],
  sim: { lr: 0.04, noise: 0.05 },
  ctl: ['lr', 'noise'],
  view: { yaw: -14, pitch: 44 },
  sheet: sheetSaddle,
  features: () => {
    const st = PL.st = { k: 0, rec: [] };
    let yb = 0, vb = Infinity;
    for (let y = -0.4; y <= 0.4; y += 0.002) { const v = L(0, y); if (v < vb) { vb = v; yb = y; } }
    const s = critAt(0, yb);
    st.sad = s && s.type === 'saddle' ? s : null; if (!st.sad) return;
    hess(s.x, s.y);
    let vx = hXY, vy = s.l1 - hXX; if (Math.hypot(vx, vy) < 1e-9) { vx = s.l1 - hYY; vy = hXY; } if (Math.hypot(vx, vy) < 1e-9) { vx = 1; vy = 0; }
    const vl = Math.hypot(vx, vy); st.ux = vx / vl; st.uy = vy / vl;
    st.east = critAt(FEAT.basin[0], FEAT.basin[1]); st.west = critAt(-FEAT.basin[0], FEAT.basin[1]);
    let yN = s.y, yS = s.y, bN = -1e9, bS = -1e9;
    for (let y = s.y; y < Y1 - 0.05; y += 0.005) { const v = L(0, y); if (v > bN) { bN = v; yN = y; } }
    for (let y = s.y; y > Y0 + 0.05; y -= 0.005) { const v = L(0, y); if (v > bS) { bS = v; yS = y; } }
    st.yN = yN; st.yS = yS;
  },
  names: (S) => {
    const st = PL.st; if (!st.sad) return;
    S.marks.push({ p: st.sad, name: 'Saddle', sub: `λ ${fmt(st.sad.l1, 2)} and ${st.sad.l2.toFixed(1)}`, sym: 'pass', pri: 9 });
    if (st.east) S.areas.push({ x: st.east.x, y: st.east.y, lines: ['East Basin'], size: 13.5, ls: 2.4 });
    if (st.west) S.areas.push({ x: st.west.x, y: st.west.y, lines: ['West Basin'], size: 13.5, ls: 2.4 });
    S.paths.push({ text: 'the divide', pts: [0, st.yN - 0.04, 0, st.sad.y + 0.1], size: 10, offset: 0.035 });
  },
  lines: () => {
    const st = PL.st; if (!st.sad) return;
    const pts = []; for (let y = st.yS; y <= st.yN + 1e-9; y += 0.006) pts.push(0, y, 0.002);
    line(pts, INK, 1.1, 0.028, true, 0.75);
    for (const s of [1, -1]) {
      const fp = flowPath(st.sad.x + s * 1e-3 * st.ux, st.sad.y + s * 1e-3 * st.uy, 0.004, 5000), dp = [];
      for (let k = 0; k < fp.length; k += 6) dp.push(fp[k], fp[k + 1], 0.002);
      line(dp, WATER_INK, 1.3, 0, true, 0.75);
    }
  },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || !st.sad) { nextRelease = STAT.steps + 45; return; }
    const k = st.k++, e = 1 + (k % 6), d = Math.pow(10, -e), north = (Math.floor(k / 6) % 2) === 0;
    const y = st.sad.y + (north ? 0.4 : -0.4), x = (k % 2 ? -1 : 1) * d;
    stamp(x, y, 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
    for (let t = 0; t < TRIBES.length; t++) { const i = spawn(x, y, t); if (i >= 0) { Ax[i] = d; An[i] = 0; } }
    STAT.released++;
    nextRelease = STAT.steps + Math.round(2.4 * 45);
  },
  click: (x, y) => { for (let t = 0; t < TRIBES.length; t++) { const i = spawn(x, y, t); if (i >= 0) { Ax[i] = 0; An[i] = 0; } } stamp(x, y, 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023); },
  step: (i) => { const s = PL.st.sad; if (s && Math.hypot(Wx[i] - s.x, Wy[i] - s.y) < 0.12) An[i]++; },
  retire: (i) => { const st = PL.st; if (Ax[i] > 0) { st.rec.push([Tr[i], Ax[i], An[i]]); if (st.rec.length > 600) st.rec.shift(); } },
  readouts: () => {
    const st = PL.st, last = st.rec[st.rec.length - 1];
    return [['λ₋ at saddle', st.sad ? fmt(st.sad.l1, 2) : '—'], ['η|λ₋|', st.sad ? (SIM.lr * Math.abs(st.sad.l1)).toFixed(3) : '—'], ['last δ', last ? `10⁻${'⁰¹²³⁴⁵⁶⁷⁸⁹'[Math.round(-Math.log10(last[1]))]}` : '—'], ['steps near', last ? `${last[2]} (${TRIBES[last[0]].name})` : '—']];
  },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 10, x1 = w - 8, y1 = h - 28;
    FIG.axes(c, x0, y0, x1, y1, '−log₁₀ δ', 'steps near the saddle');
    let ymax = 100; for (const r of st.rec) ymax = Math.max(ymax, r[2]);
    ymax = niceStep(ymax * 1.15) * (ymax * 1.15 > niceStep(ymax * 1.15) ? 2 : 1);
    const tx = (e) => x0 + 6 + (x1 - x0 - 12) * (e - 1) / 5, ty = (v) => y1 - (y1 - y0) * v / ymax;
    for (let e = 1; e <= 6; e++) FIG.tick(c, tx(e), y1 + 4, String(e));
    FIG.tick(c, x0 - 3, y0, String(ymax), 'right', 'middle');
    if (st.sad) {
      const g = Math.log(1 + SIM.lr * Math.abs(st.sad.l1));
      c.setLineDash([3, 3]); c.strokeStyle = rgba(TRIBES[0].color, 0.6); c.lineWidth = 1; c.beginPath();
      for (let e = 1; e <= 6; e += 0.1) { const T = Math.log(0.12 / Math.pow(10, -e)) / g, X = tx(e), Y = clamp(ty(T), y0, y1); if (e === 1) c.moveTo(X, Y); else c.lineTo(X, Y); }
      c.stroke(); c.setLineDash([]);
    }
    for (const r of st.rec) {
      const e = -Math.log10(r[1]), X = tx(e) + (r[0] - 1) * 4, Y = ty(r[2]);
      c.fillStyle = rgba(TRIBES[r[0]].color, 0.75); c.beginPath(); c.arc(X, clamp(Y, y0, y1), 2, 0, TAU); c.fill();
    }
  },
});

// --- plateaus
function sheetPlateau(R) {
  sheetBase(R, { bk: 0.18, bk4: 0.02 });
  BX = R.range(-0.15, 0.15); BY = R.range(-0.42, -0.28);
  const pa = R.range(-0.25, 0.25);
  PLcx = R.range(-0.2, 0.15); PLcy = R.range(0.12, 0.22); PLc = Math.cos(pa); PLs = Math.sin(pa);
  PLa = R.range(0.6, 0.68); PLb = R.range(0.34, 0.4); PLe = 0.08; PLwarp = 0.16;
  addGauss(R.range(-1.25, -0.95), R.range(-0.65, -0.4), -R.range(0.35, 0.45), 0.25, 0.18, R.range(0, 3));
  addGauss(R.range(0.85, 1.2), R.range(-0.7, -0.4), -R.range(0.35, 0.45), 0.22, 0.2, R.range(0, 3));
  addGauss(R.range(1.0, 1.3), R.range(0.45, 0.75), R.range(0.3, 0.4), 0.2, 0.14, R.range(0, 3));
  addGauss(R.range(-0.2, 0.3), R.range(-0.82, -0.62), -R.range(0.25, 0.35), 0.2, 0.15, R.range(0, 3));
  noiseMean(R);
  mesaTop(0.022);
  FEAT.plateau = [PLcx, PLcy];
  normalize(R);
}
function plateauRelease(x, y) {
  stamp(x, y, 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
  const n = PHONE ? 8 : 14;
  for (let t = 0; t < TRIBES.length; t++) for (let k = 0; k < n; k++) {
    const i = spawn(x + RREL.normal() * 0.02, y + RREL.normal() * 0.02, t);
    if (i >= 0) Tag[i] = PLon && plateauMask(Wx[i], Wy[i]) > 0.5 ? 1 : 0;
  }
  STAT.released++;
}
plate({
  id: 'plateaus', ch: 0, seed: 4407,
  run: [
    null,
    (T) => { T.set('lr', PL.sim.lr); T.set('noise', 0.5); T.release(...PL.st.rel); },
    (T) => { T.set('lr', PL.sim.lr); T.set('noise', 1.5); T.release(...PL.st.rel); },
  ],
  status: 'established',
  tribes: [{ k: 'sgd' }, { k: 'rms' }, { k: 'adam' }],
  sim: { lr: 0.004, noise: 0.02 },
  ctl: ['lr', 'noise'],
  view: { yaw: -10, pitch: 42 },
  maxAge: 9000,
  sheet: sheetPlateau,
  features: () => {
    const st = PL.st = { exit: TRIBES.map(() => []) };
    grad(PLcx, PLcy); st.g = Math.hypot(gX, gY);
    const ux = PLtx / (Math.hypot(PLtx, PLty) || 1), uy = PLty / (Math.hypot(PLtx, PLty) || 1);
    let d = 0; while (d < 1.2 && plateauMask(PLcx + ux * d, PLcy + uy * d) > 0.95) d += 0.01;
    st.rel = [PLcx + ux * Math.max(0, d - 0.08), PLcy + uy * Math.max(0, d - 0.08)];
  },
  names: (S) => {
    S.areas.push({ x: PLcx, y: PLcy, lines: ['Plateau of', 'Vanishing Gradients'], one: 'Plateau of Vanishing Gradients', size: 15, ls: 2.6, rot: clamp(-Math.atan2(PLs, PLc), -0.35, 0.35), w: 2 * PLa });
    S.marks.push({ p: { x: PLcx, y: PLcy - 0.12 }, name: '', sub: `‖∇L‖ ${PL.st.g.toFixed(3)}`, sym: 'none', pin: false });
  },
  release: () => {
    if (!F.params.auto || STAT.alive > maxAlive - 60) { nextRelease = STAT.steps + 45; return; }
    const p = PL.st.rel; plateauRelease(p[0], p[1]);
    nextRelease = STAT.steps + Math.round(9 * 45);
  },
  click: (x, y) => plateauRelease(x, y),
  step: (i) => { if (Tag[i] === 1 && plateauMask(Wx[i], Wy[i]) < 0.5) { Tag[i] = 2; const e = PL.st.exit[Tr[i]]; e.push(Age[i]); if (e.length > 300) e.shift(); } },
  readouts: () => {
    const st = PL.st, mean = (a) => (a.length ? Math.round(a.reduce((p, q) => p + q, 0) / a.length) : null);
    return [['‖∇L‖ on the plateau', st.g.toFixed(3)], ...TRIBES.map((T, t) => [`${T.name} leaves after`, mean(st.exit[t]) != null ? `${mean(st.exit[t])} steps` : '…'])];
  },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 8, x1 = w - 40, rowH = Math.min(36, (h - 30) / TRIBES.length);
    const lx = (v) => x0 + (x1 - x0) * clamp((Math.log10(v) - 1) / 3.3, 0, 1);
    for (let e = 1; e <= 4; e++) { const X = lx(Math.pow(10, e)); FIG.tick(c, X, h - 26, e === 1 ? '10' : `10${'⁰¹²³⁴'[e]}`); c.strokeStyle = 'rgba(36,38,43,0.12)'; c.beginPath(); c.moveTo(X, 4); c.lineTo(X, h - 28); c.stroke(); }
    TRIBES.forEach((T, t) => {
      const y = 4 + t * rowH, a = st.exit[t], m = a.length ? a.reduce((p, q) => p + q, 0) / a.length : 0;
      c.font = `500 9px ${SERIF}`; c.letterSpacing = '1px'; c.fillStyle = INK; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(T.name.toUpperCase(), x0, y); c.letterSpacing = '0px';
      const by = y + 12, bh = rowH - 18;
      if (m > 0) { c.fillStyle = rgba(T.color, 0.8); c.fillRect(x0, by, lx(m) - x0, bh); FIG.tick(c, lx(m) + 4, by + bh / 2, String(Math.round(m)), 'left', 'middle'); }
      else FIG.tick(c, x0, by + bh / 2, 'still crossing…', 'left', 'middle');
      for (const v of a) { c.fillStyle = rgba(T.color, 0.35); c.fillRect(lx(v) - 0.5, by - 1, 1, bh + 2); }
    });
    FIG.tick(c, x1 + 34, h - 12, 'steps to leave the plateau', 'right', 'top');
  },
});

// --- ravines
function sheetRavine(R) {
  sheetBase(R, { bk: 0.08, bk4: 0.012 });
  BX = R.range(-0.15, 0.15); BY = R.range(-0.15, 0.15);
  RVR = R.range(1.15, 1.45); RVhalf = R.range(2.0, 2.3) / (2 * RVR);
  const pm = -Math.PI / 2 + R.range(-0.25, 0.25) + (R() < 0.5 ? Math.PI : 0);
  RVmx = Math.cos(pm); RVmy = Math.sin(pm);
  RVcx = R.range(-0.1, 0.1) - RVR * RVmx; RVcy = R.range(-0.08, 0.08) - RVR * RVmy;
  RVw = R.range(0.052, 0.058); RViw2 = 1 / (2 * RVw * RVw); RVd0 = 0.25; RVd1 = 0.35; RVsgn = 1;
  FEAT.ravine = true;
  const m = arcPt(0);
  for (const s of [1, -1]) addGauss(m[0] + s * 0.5 * RVmx, m[1] + s * 0.5 * RVmy, R.range(0.25, 0.35), 0.28, 0.16, m[2] + R.range(-0.3, 0.3));
  addGauss(R.range(-1.3, -1.0), R.range(-0.8, 0.8), R.range(0.2, 0.3), 0.18, 0.14, R.range(0, 3));
  addGauss(R.range(1.0, 1.3), R.range(-0.8, 0.8), -R.range(0.15, 0.25), 0.18, 0.14, R.range(0, 3));
  noiseOn = 0; finishRavine(); noiseOn = 1;
  noiseMean(R); normalize(R);
}
plate({
  id: 'ravines', ch: 0, seed: 5101,
  run: [
    null,
    null,
    null,
    (T) => { T.set('beta', PL.sim.beta); T.set('lr', 1.2 / PL.st.floor.l2); T.clear(); T.release(...RELEASES[0]); },
  ],
  status: 'established',
  tribes: [{ k: 'gd' }, { k: 'hb' }, { k: 'nag' }],
  sim: { lr: 0.008, noise: 0, beta: 0.9 },
  ctl: ['lr', 'beta'],
  view: { yaw: -6, pitch: 46 },
  restOK: (i) => Math.hypot(Ex[i] - PL.st.mouth.x, Ey[i] - PL.st.mouth.y) < 0.1,
  sheet: sheetRavine,
  features: () => {
    const st = PL.st = { arr: TRIBES.map(() => []), C: curveInit(3, 1400) };
    const mid = arcPt(0), a = mid[2]; let best = null;
    for (let k = -24; k <= 24; k++) { const r = RVR + k * RVw * 0.12, x = RVcx + r * Math.cos(a), y = RVcy + r * Math.sin(a), v = L(x, y); if (!best || v < best[2]) best = [x, y, v]; }
    hess(best[0], best[1]); const e = eig2();
    grad(best[0], best[1]);
    st.floor = { x: best[0], y: best[1], L: best[2], l1: e[0], l2: e[1], slope: Math.hypot(gX, gY) };
    st.mouth = critAt(FEAT.ravineMouth[0], FEAT.ravineMouth[1]) || { x: FEAT.ravineMouth[0], y: FEAT.ravineMouth[1], L: L(FEAT.ravineMouth[0], FEAT.ravineMouth[1]) };
    SIM.lr = +(1.8 / e[1]).toPrecision(2);
  },
  names: (S) => {
    const st = PL.st;
    S.paths.push({ text: 'Ravine of Ill Conditioning', ravine: true });
    S.marks.push({ p: st.floor, name: '', sub: `λ across ${st.floor.l2.toFixed(0)} · slope ${st.floor.slope.toFixed(2)}`, sym: 'min', pin: false });
    if (st.mouth) S.marks.push({ p: st.mouth, name: 'Mouth', sub: `L ${st.mouth.L.toFixed(3)}${st.mouth.l2 ? ` · λ ${st.mouth.l2.toFixed(0)}` : ''}`, sym: 'min', pri: 7 });
  },
  plan: () => {
    const h = arcPt(-0.88), r = RVR + 0.055;
    const p = [RVcx + r * Math.cos(h[2]), RVcy + r * Math.sin(h[2])];
    RELEASES.push(p); RELEASES.more = () => [p[0] + RPLAN.normal() * 0.01, p[1] + RPLAN.normal() * 0.01];
  },
  release: () => {
    if (!F.params.auto || STAT.alive > maxAlive - 60) { nextRelease = STAT.steps + 45; return; }
    const p = RELEASES.more(), st = PL.st;
    curveReset(st.C);
    stamp(p[0], p[1], 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
    for (let t = 0; t < 3; t++) for (let k = 0; k < (PHONE ? 6 : 12); k++) { const i = spawn(p[0] + RREL.normal() * 0.008, p[1] + RREL.normal() * 0.008, t); if (i >= 0) An[i] = st.C.cid; }
    STAT.released++;
    nextRelease = STAT.steps + Math.round(12 * 45);
  },
  step: (i) => {
    const st = PL.st;
    if (An[i] === st.C.cid) curveAdd(st.C, Tr[i], Age[i], Wl[i]);
    if (!Ax[i] && Math.hypot(Wx[i] - st.mouth.x, Wy[i] - st.mouth.y) < 0.05) { Ax[i] = 1; const a = st.arr[Tr[i]]; a.push(Age[i]); if (a.length > 200) a.shift(); }
  },
  readouts: () => {
    const st = PL.st, mean = (a) => (a.length ? Math.round(a.reduce((p, q) => p + q, 0) / a.length) : null);
    return [['ηλ across', (SIM.lr * st.floor.l2).toFixed(2)], ...TRIBES.map((T, t) => [`${T.name} reaches the mouth`, mean(st.arr[t]) != null ? `${mean(st.arr[t])} steps` : '…'])];
  },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28;
    FIG.axes(c, x0, y0, x1, y1, 'steps', 'log₁₀(L − L_mouth)');
    const series = TRIBES.map((T, t) => ({ ys: curveMean(st.C, t, (v) => Math.log10(Math.max(1e-4, v - st.mouth.L))), color: T.color, w: 1.3 }));
    const r = figSeries(c, x0, y0, x1, y1, series, { xmax: st.C.len, ymin: -3, ymax: 0.5 });
    for (const v of [-3, -2, -1, 0]) FIG.tick(c, x0 - 3, r.ty(v), String(v), 'right', 'middle');
  },
});

// --- cliffs
function sheetCliff(R) {
  sheetBase(R, { bk: 0.1, bk4: 0.012, na: 0.025 });
  BX = R.range(-0.2, 0.2); BY = R.range(-0.45, -0.3);
  const c0 = R.range(0, 0.12), A = R.range(0.1, 0.16), om = R.range(1.4, 2.0), ph = R.range(0, TAU), H = 0.5, w = 0.0022, rise = 0.32;
  FEAT.cliff = { c0, A, om, ph, H, w };
  EXTRA = (x, y) => {
    const t = om * x + ph, cy = c0 + A * Math.sin(t), sl = A * om * Math.cos(t);
    const d = (y - cy) / Math.sqrt(1 + sl * sl), u = d / w;
    EXCALM = u * u < 4000 ? Math.exp(-u * u / 400) : 0;
    const sg = u > 40 ? 1 : u < -40 ? 0 : 1 / (1 + Math.exp(-u));
    return H * sg + rise * (d > 0 ? d : 0);
  };
  addGauss(R.range(-1.0, -0.6), R.range(-0.7, -0.45), -R.range(0.3, 0.4), 0.28, 0.2, R.range(0, 3));
  addGauss(R.range(0.5, 0.95), R.range(-0.72, -0.5), -R.range(0.3, 0.4), 0.26, 0.2, R.range(0, 3));
  addGauss(R.range(-0.9, -0.3), R.range(0.62, 0.85), R.range(0.14, 0.2), 0.25, 0.14, R.range(0, 3));
  addGauss(R.range(0.4, 1.1), R.range(0.62, 0.85), R.range(0.12, 0.18), 0.22, 0.14, R.range(0, 3));
  sheetEnd(R);
}
const cliffY = (x) => { const c = FEAT.cliff; return c.c0 + c.A * Math.sin(c.om * x + c.ph); };
plate({
  id: 'cliffs', ch: 0, seed: 6203,
  run: [
    null,
    null,
    null,
    (T) => { T.set('noise', PL.sim.noise); T.set('lr', 0.02); T.release('Terrace'); T.release(X0 + 0.4, cliffY(X0 + 0.4) + 0.25); },
  ],
  status: 'established',
  tribes: [{ k: 'sgd' }, { k: 'sgd', name: 'SGD, clipped', color: '#23708f', clip: 1.2, rule: 'g̃ ← g̃ · min(1, c ⁄ ‖g̃‖)' }, { k: 'adam' }],
  sim: { lr: 0.004, noise: 0.2 },
  ctl: ['lr', 'noise'],
  view: { yaw: 8, pitch: 38 },
  jump: true,
  sheet: sheetCliff,
  features: () => { PL.st = { hist: TRIBES.map(() => new Float64Array(32)), max: TRIBES.map(() => 0), off: TRIBES.map(() => 0) }; },
  onSim: (k) => { if (k === 'lr' || k === 'noise') { const st = PL.st; st.hist.forEach((H) => H.fill(0)); st.max.fill(0); st.off.fill(0); } },
  names: (S) => {
    let bx = 0, by = -1;
    for (let x = -1.2; x <= 1.2; x += 0.05) { const y = cliffY(x); if (y > by) { by = y; bx = x; } }
    S.paths.push({ text: 'The Cliff', pts: [bx - 0.35, cliffY(bx - 0.35), bx, cliffY(bx), bx + 0.35, cliffY(bx + 0.35)], size: 12, offset: 0.06 });
    S.areas.push({ x: 0, y: (cliffY(0) + Y1) / 2 + 0.05, lines: ['Terrace'], size: 13, ls: 3 });
  },
  print: (c) => {
    const p = new Path2D(), q = new Path2D();
    let n = 0;
    for (let x = X0; x <= X1; x += 0.0025) {
      const cf = FEAT.cliff, t = cf.om * x + cf.ph, sl = cf.A * cf.om * Math.cos(t), y = cliffY(x), l = Math.sqrt(1 + sl * sl);
      const px = ox(x), py = oy(y), dx = sl / l, dy = 1 / l;
      if (x === X0) q.moveTo(px, py); else q.lineTo(px, py);
      n++;
      const len = (n % 3 === 0 ? 9 : n % 3 === 1 ? 5 : 6.5) * (0.85 + 0.3 * Math.abs(Math.sin(x * 37)));
      p.moveTo(px, py + 0.6); p.lineTo(px + dx * len, py + dy * len);
    }
    c.save(); c.strokeStyle = 'rgba(64,50,40,0.62)'; c.lineWidth = 0.55; c.stroke(p);
    c.strokeStyle = 'rgba(40,32,26,0.9)'; c.lineWidth = 1.1; c.stroke(q); c.restore();
  },
  plan: () => {
    for (let k = 0; k < 4; k++) RELEASES.push(mitchellHigh(RPLAN, 0.15, (x, y) => y > cliffY(x) + 0.18));
    RELEASES.more = () => mitchellHigh(RPLAN, 0.15, (x, y) => y > cliffY(x) + 0.18);
  },
  step: (i) => {
    const st = PL.st, t = Tr[i], sl = Math.hypot(Wx[i] - Px[i], Wy[i] - Py[i]);
    if (sl > 0) { st.hist[t][clamp(Math.floor((Math.log10(sl) + 5) * 6), 0, 31)]++; if (sl > st.max[t]) st.max[t] = sl; }
  },
  lost: (i) => { PL.st.off[Tr[i]]++; },
  readouts: () => {
    const st = PL.st;
    return [['SGD, longest throw', st.max[0].toFixed(3)], ['clipped, longest', st.max[1].toFixed(4)], ['ηc', (SIM.lr * 1.2).toFixed(4)], ['SGD and Adam off the sheet', String(st.off[0] + st.off[2])]];
  },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 26, y0 = 8, x1 = w - 6, y1 = h - 28;
    FIG.axes(c, x0, y0, x1, y1, 'log₁₀ step length', 'steps');
    const tx = (b) => x0 + (x1 - x0) * b / 32;
    for (const e of [-5, -4, -3, -2, -1, 0]) FIG.tick(c, tx((e + 5) * 6), y1 + 4, String(e));
    let mx = 1; for (const H of st.hist) for (const v of H) mx = Math.max(mx, Math.log10(1 + v));
    st.hist.forEach((H, t) => {
      c.strokeStyle = TRIBES[t].color; c.lineWidth = 1.3; c.beginPath();
      for (let b = 0; b < 32; b++) { const X = tx(b + 0.5), Y = y1 - (y1 - y0) * Math.log10(1 + H[b]) / mx; if (b) c.lineTo(X, Y); else c.moveTo(X, Y); }
      c.stroke();
    });
    const xc = tx((Math.log10(SIM.lr * 1.2) + 5) * 6);
    c.setLineDash([2, 2]); c.strokeStyle = rgba(TRIBES[1].color, 0.7); c.beginPath(); c.moveTo(xc, y0); c.lineTo(xc, y1); c.stroke(); c.setLineDash([]);
    FIG.note(c, xc + 4, y0 + 6, 'ηc', TRIBES[1].color);
  },
});

// --- catchments
plate({
  id: 'catchments', ch: 0, seed: 7311,
  run: [
    null,
    null,
    (T) => { T.set('noise', PL.sim.noise); T.set('lr', 0.02); },
    (T) => { T.set('noise', PL.sim.noise); T.set('lr', 0.05); },
  ],
  status: 'open',
  tribes: [{ k: 'gd' }, { k: 'sgd', color: '#4b3fa0' }],
  sim: { lr: 0.004, noise: 0.6 },
  ctl: ['lr', 'noise'],
  view: { yaw: 0, pitch: 58 },
  sheet: (R) => sheetSurvey(R, ['flat', 'sharp', 'pass', 'hills', 'flat', 'pass'], { na: 0.018 }),
  features: () => {
    nameSurvey();
    const C = catchments(3, true);
    const order = C.basins.map((b, k) => k).filter((k) => C.basins[k].area > 0.008).sort((a, b) => C.basins[b].area - C.basins[a].area);
    const letters = 'ABCDEFGHIJKLMNOP';
    order.forEach((k, r) => {
      const b = C.basins[k]; b.name = letters[r] || '·';
      let m = null; for (const c of CRIT) if (c.type === 'min' && labelAt(C, c.x, c.y) === k && (!m || c.L < m.L)) m = c;
      b.lam = m ? m.l2 : 0;
    });
    PL.st = { C, order, arr: TRIBES.map(() => new Float64Array(C.basins.length + 1)), drops: 0 };
  },
  names: (S) => {
    const { C, order } = PL.st;
    for (const k of order) { const b = C.basins[k]; S.marks.push({ p: { x: b.x, y: b.y }, name: b.name, sub: `${(b.area * 100).toFixed(1)}%${b.lam ? ` · λ ${b.lam.toFixed(0)}` : ''}`, sym: 'min', pin: false }); }
  },
  print0: () => {
    const { C } = PL.st;
    for (let k = -1; k < C.basins.length; k++) {
      const G = new Float32Array(C.W * C.H); for (let q = 0; q < G.length; q++) G[q] = C.lab[q] === k ? 1 : 0;
      strokeChains(isoChains(G, C.W, C.H, X0, Y0, C.dx, C.dy, 0.5), 'rgba(36,38,43,0.7)', 0.9, [6, 2.2, 1.2, 2.2]);
    }
  },
  release: () => {
    if (!F.params.auto || STAT.alive > maxAlive - 4) { nextRelease = STAT.steps + 20; return; }
    const st = PL.st, x = RPLAN.range(X0 + 0.03, X1 - 0.03), y = RPLAN.range(Y0 + 0.03, Y1 - 0.03), t = st.drops++ % TRIBES.length;
    stamp(x, y, 0.0035, 2, 0.12, 0.125, 0.14, 0.6, 0);
    spawn(x, y, t);
    nextRelease = STAT.steps + 5;
  },
  retire: (i, ring) => { if (!ring) return; const st = PL.st, k = labelAt(st.C, Ex[i], Ey[i]); if (k >= 0) st.arr[Tr[i]][k]++; },
  lost: (i) => { const st = PL.st; st.arr[Tr[i]][st.C.basins.length]++; },
  readouts: () => {
    const st = PL.st, s = (t) => st.arr[t].subarray(0, st.C.basins.length).reduce((p, q) => p + q, 0);
    return [['drops', String(st.drops)], ['2/η', (2 / SIM.lr).toFixed(0)], ['GD arrived', String(s(0))], ['SGD arrived', String(s(1))]];
  },
  fig: (c, w, h) => {
    const { C, order, arr } = PL.st, x0 = 8, y0 = 8, x1 = w - 4, y1 = h - 28;
    const tot = arr.map((a) => order.reduce((p, k) => p + a[k], 0) || 1);
    const groups = order.slice(0, 8).map((k) => [C.basins[k].area / order.reduce((p, q) => p + C.basins[q].area, 0), arr[0][k] / tot[0], arr[1][k] / tot[1]]);
    figBars(c, x0, y0, x1, y1, groups, order.slice(0, 8).map((k) => C.basins[k].name), ['rgba(36,38,43,0.8)', rgba(TRIBES[0].color, 0.85), rgba(TRIBES[1].color, 0.85)], { outline: [true, false, false] });
    c.strokeStyle = 'rgba(36,38,43,0.4)'; c.beginPath(); c.moveTo(x0, y1 + 0.5); c.lineTo(x1, y1 + 0.5); c.stroke();
  },
});
// ch1>>

// <<ch2
// ---------------------------------------------------------------------------------------------
// II · Particles
// ---------------------------------------------------------------------------------------------
function caravanAt(p, n, st, spread = 0.008) {
  if (st && st.C) curveReset(st.C);
  stamp(p[0], p[1], 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
  for (let t = 0; t < TRIBES.length; t++) for (let k = 0; k < n; k++) {
    const i = spawn(p[0] + RREL.normal() * spread, p[1] + RREL.normal() * spread, t);
    if (i >= 0 && st && st.C) An[i] = st.C.cid;
  }
  STAT.released++;
}
function logGapFig(c, w, h, st, ref, lo = -4, hi = 0.5, xl = 'steps') {
  const x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28;
  FIG.axes(c, x0, y0, x1, y1, xl, 'log₁₀(L − L*)');
  const series = TRIBES.map((T, t) => ({ ys: curveMean(st.C, t, (v) => Math.log10(Math.max(1e-6, v - ref))), color: T.color, w: 1.3 }));
  const r = figSeries(c, x0, y0, x1, y1, series, { xmax: st.C.len, ymin: lo, ymax: hi });
  for (let v = Math.ceil(lo); v <= hi; v++) FIG.tick(c, x0 - 3, r.ty(v), String(v), 'right', 'middle');
  FIG.tick(c, x1, y1 + 4, String(st.C.len), 'right');
}

// --- momentum
function sheetCrater(R) {
  sheetBase(R, { bk: 0.12, bk4: 0.015, na: 0.03 });
  BX = R.range(-0.1, 0.1); BY = R.range(-0.1, 0.1);
  const cx = R.range(-0.12, 0.12), cy = R.range(-0.06, 0.06);
  SHi = addGauss(cx, cy, -0.9, R.range(0.32, 0.36), R.range(0.19, 0.22), R.range(-0.4, 0.4));
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + R.range(-0.3, 0.3), r = R.range(0.6, 0.68); addGauss(cx + r * Math.cos(a), cy + r * Math.sin(a), R.range(0.1, 0.18), 0.14, 0.1, a); }
  addGauss(R.range(-1.35, -1.1), R.range(0.5, 0.75), -R.range(0.2, 0.3), 0.18, 0.15, R.range(0, 3));
  addGauss(R.range(1.1, 1.35), R.range(-0.75, -0.5), -R.range(0.2, 0.3), 0.18, 0.15, R.range(0, 3));
  FEAT.crater = [cx, cy];
  sheetEnd(R, true);
}
plate({
  id: 'momentum', ch: 2, seed: 8102,
  run: [
    (T) => { T.set('lr', 0.01); T.set('beta', 0.9); T.clear(); const st = PL.st, a = st.k++ * 2.4 + 0.5, r = 0.44; caravanAt([FEAT.crater[0] + r * Math.cos(a), FEAT.crater[1] + 0.8 * r * Math.sin(a)], PHONE ? 6 : 10, st); nextRelease = STAT.steps + 405; },
    (T) => { T.set('lr', 0.01); T.set('beta', 0.5); T.clear(); const st = PL.st, a = st.k++ * 2.4 + 0.5, r = 0.44; caravanAt([FEAT.crater[0] + r * Math.cos(a), FEAT.crater[1] + 0.8 * r * Math.sin(a)], PHONE ? 6 : 10, st); nextRelease = STAT.steps + 405; },
    (T) => { T.set('lr', 0.01); T.set('beta', 0.99); T.clear(); const st = PL.st, a = st.k++ * 2.4 + 0.5, r = 0.44; caravanAt([FEAT.crater[0] + r * Math.cos(a), FEAT.crater[1] + 0.8 * r * Math.sin(a)], PHONE ? 6 : 10, st); nextRelease = STAT.steps + 405; },
  ],
  status: 'established',
  tribes: [{ k: 'gd' }, { k: 'hb' }, { k: 'nag' }],
  sim: { lr: 0.01, noise: 0, beta: 0.9 },
  ctl: ['lr', 'beta'],
  view: { yaw: -10, pitch: 52, zoom: 0.82, at: () => FEAT.crater },
  sheet: sheetCrater,
  features: () => {
    const st = PL.st = { C: curveInit(3, 400), k: 0 };
    st.min = critAt(FEAT.crater[0], FEAT.crater[1]);
  },
  names: (S) => {
    const m = PL.st.min; if (!m) return;
    S.marks.push({ p: m, name: 'Crater floor', sub: `λ ${m.l1.toFixed(1)} and ${m.l2.toFixed(1)}`, sym: 'min', pri: 9 });
  },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 60) { nextRelease = STAT.steps + 45; return; }
    const a = st.k++ * 2.4 + 0.5, r = 0.44;
    caravanAt([FEAT.crater[0] + r * Math.cos(a), FEAT.crater[1] + 0.8 * r * Math.sin(a)], PHONE ? 6 : 10, st);
    nextRelease = STAT.steps + Math.round(9 * 45);
  },
  step: (i) => { const st = PL.st; if (An[i] === st.C.cid) curveAdd(st.C, Tr[i], Age[i], Wl[i]); },
  readouts: () => {
    const m = PL.st.min; if (!m) return [];
    const bs = (l) => Math.pow(1 - Math.sqrt(Math.min(1, SIM.lr * l)), 2), k = m.l2 / m.l1, bo = Math.pow((Math.sqrt(k) - 1) / (Math.sqrt(k) + 1), 2);
    return [['β', SIM.beta.toFixed(2)], ['β* for λₘᵢₙ · λₘₐₓ', `${bs(m.l1).toFixed(2)} · ${bs(m.l2).toFixed(2)}`], ['κ', k.toFixed(1)], ['Polyak’s η · β for κ', `${(4 / Math.pow(Math.sqrt(m.l1) + Math.sqrt(m.l2), 2)).toFixed(3)} · ${bo.toFixed(3)}`]];
  },
  fig: (c, w, h) => { if (PL.st.min) logGapFig(c, w, h, PL.st, PL.st.min.L, -5, 0.3); },
});

// --- Adam and rotation
// an exact quadratic valley, ½(λ_u u² + λ_v v²) in coordinates turned by α, capped smoothly far from the floor
const LONG = { c: 1, s: 0, lu: 1, lv: 200, H: 0.9 };
function longTerm(x, y) {
  const u = LONG.c * x + LONG.s * y, v = -LONG.s * x + LONG.c * y, q = 0.5 * (LONG.lu * u * u + LONG.lv * v * v);
  EXCALM = q < 3 ? Math.exp(-q * 3) : 0;
  return LONG.H * q / (LONG.H + q);
}
function setLong(alpha) { LONG.c = Math.cos(alpha); LONG.s = Math.sin(alpha); }
function sheetLongBasin(R, alpha, lv = 200) {
  sheetBase(R, { bk: 0.06, bk4: 0.01, na: 0.02 });
  const hills = [];
  for (let k = 0; k < 6; k++) hills.push([R.range(-1.4, 1.4), R.range(-0.85, 0.85), R.range(-0.25, 0.3), R.range(0.12, 0.2), R.range(0.08, 0.14), R.range(0, 3)]);
  for (const h of hills) if (Math.hypot(h[0], h[1]) > 0.8) addGauss(...h);
  LONG.lv = lv; setLong(alpha); EXTRA = longTerm;
  sheetEnd(R, true);
}
// steps for gradient descent and Adam to come within 0.005 of the floor, from the same point of the basin, at each angle
function rotationSweep() {
  const angles = [], out = { angles, gd: [], adam: [] }, save = [LONG.c, LONG.s], eta = SIM.lr;
  for (let a = 0; a <= 90.01; a += 7.5) angles.push(a);
  for (const a of angles) {
    const al = a * DEG; setLong(al);
    const m = newtonCrit(0, 0, 40), Lm = m ? L(m[0], m[1]) : L(0, 0), c = Math.cos(al), s = Math.sin(al);
    const x0 = 0.4 * c - 0.04 * s, y0 = 0.4 * s + 0.04 * c;
    for (const kind of ['gd', 'adam']) {
      let x = x0, y = y0, mx = 0, my = 0, vx = 0, vy = 0, b1 = 1, b2 = 1, n = 3000;
      for (let k = 0; k < 3000; k++) {
        grad(x, y);
        if (gL - Lm < 0.005) { n = k; break; }
        if (kind === 'gd') { x -= eta * gX; y -= eta * gY; }
        else { mx = 0.9 * mx + 0.1 * gX; my = 0.9 * my + 0.1 * gY; vx = 0.999 * vx + 0.001 * gX * gX; vy = 0.999 * vy + 0.001 * gY * gY; b1 *= 0.9; b2 *= 0.999;
          x -= eta * mx / (1 - b1) / (Math.sqrt(vx / (1 - b2)) + 1e-8); y -= eta * my / (1 - b1) / (Math.sqrt(vy / (1 - b2)) + 1e-8); }
        if (!Number.isFinite(x) || Math.abs(x) > 3) { n = 3000; break; }
      }
      out[kind].push(n);
    }
  }
  LONG.c = save[0]; LONG.s = save[1];
  return out;
}
plate({
  id: 'adam', ch: 2, seed: 9011,
  run: [
    (T) => { T.set('lr', 0.009); T.set('rot', 45); },
    (T) => {
      T.set('lr', 0.009); T.set('rot', 45);
      const go = () => { T.clear(); const al = SIM.rot * DEG, c = Math.cos(al), s = Math.sin(al), u = 0.4, v = 0.04; caravanAt([u * c - v * s, u * s + v * c], PHONE ? 4 : 6, PL.st, 0.004); nextRelease = STAT.steps + 315; };
      if (reshapeWait) reshapeWait.push(go); else go();
    },
    null,
  ],
  status: 'open',
  tribes: [{ k: 'gd' }, { k: 'adam' }, { k: 'sign' }, { k: 'lion' }],
  sim: { lr: 0.009, noise: 0.005, rot: 0 },
  ctl: ['lr', { key: 'rot', label: 'Turn the basin by α', min: 0, max: 90, step: 1, f: (v) => `${Math.round(v)}°` }],
  view: { yaw: 0, pitch: 64, zoom: 0.78, at: [0, 0] },
  figH: 250,
  sheet: (R) => sheetLongBasin(R, SIM.rot * DEG),
  features: () => {
    const st = PL.st = PL.st && PL.st.seed === F.seed && PL.st.lr === SIM.lr ? PL.st : { seed: F.seed, lr: SIM.lr };
    st.C = curveInit(4, 310); st.k = 0;
    if (!st.sweep) st.sweep = rotationSweep();
    st.min = critAt(0, 0);
  },
  names: (S) => {
    const m = PL.st.min; if (!m) return;
    S.marks.push({ p: m, name: 'Floor', sub: `λ ${m.l1.toFixed(1)} and ${m.l2.toFixed(0)} · turned ${Math.round(SIM.rot)}°`, sym: 'min', pri: 9 });
  },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 40) { nextRelease = STAT.steps + 45; return; }
    const al = SIM.rot * DEG, c = Math.cos(al), s = Math.sin(al), sg = st.k++ % 2 ? -1 : 1, u = 0.4 * sg, v = 0.04 * sg;
    caravanAt([u * c - v * s, u * s + v * c], PHONE ? 4 : 6, st, 0.004);
    nextRelease = STAT.steps + Math.round(7 * 45);
  },
  step: (i) => { const st = PL.st; if (An[i] === st.C.cid) curveAdd(st.C, Tr[i], Age[i], Wl[i]); },
  onSim: (k) => { if (k === 'rot') reshape(160); if (k === 'lr') { PL.st.sweep = null; PL.st.lr = SIM.lr; reshape(300); } },
  readouts: () => {
    const st = PL.st, sw = st.sweep; if (!sw || !st.min) return [];
    const k = clamp(Math.round(SIM.rot / 7.5), 0, sw.angles.length - 1);
    return [['α', `${Math.round(SIM.rot)}°`], ['GD steps', String(sw.gd[k])], ['Adam steps', String(sw.adam[k])], ['λₘₐₓη², scale of the sign floor', (st.min.l2 * SIM.lr * SIM.lr).toFixed(3)]];
  },
  fig: (c, w, h) => {
    const st = PL.st, sw = st.sweep; if (!sw || !st.min) return;
    const hh = (h - 12) / 2, x0 = 30, x1 = w - 6;
    let y0 = 8, y1 = hh - 22;
    FIG.axes(c, x0, y0, x1, y1, 'α (degrees)', 'steps to the floor');
    const mx = Math.max(...sw.gd, ...sw.adam) * 1.1;
    const r = figSeries(c, x0, y0, x1, y1, [{ xs: sw.angles, ys: sw.gd, color: TRIBES[0].color, w: 1.4 }, { xs: sw.angles, ys: sw.adam, color: TRIBES[1].color, w: 1.4 }], { xmax: 90, ymin: 0, ymax: mx });
    for (const a of [0, 45, 90]) FIG.tick(c, x0 + (x1 - x0) * a / 90, y1 + 4, String(a));
    FIG.tick(c, x0 - 3, r.ty(Math.round(mx)), String(Math.round(mx)), 'right', 'middle');
    const xa = x0 + (x1 - x0) * SIM.rot / 90;
    c.strokeStyle = 'rgba(36,38,43,0.5)'; c.setLineDash([2, 2]); c.beginPath(); c.moveTo(xa, y0); c.lineTo(xa, y1); c.stroke(); c.setLineDash([]);
    y0 = hh + 14; y1 = h - 28;
    FIG.axes(c, x0, y0, x1, y1, 'steps, latest cohort', 'log₁₀(L − L*)');
    const ref = st.min.L, series = TRIBES.map((T, t) => ({ ys: curveMean(st.C, t, (v) => Math.log10(Math.max(1e-6, v - ref))), color: T.color, w: 1.3 }));
    const r2 = figSeries(c, x0, y0, x1, y1, series, { xmax: st.C.len, ymin: -6, ymax: 0.3 });
    for (const v of [-6, -3, 0]) FIG.tick(c, x0 - 3, r2.ty(v), String(v), 'right', 'middle');
  },
});

// --- weight decay and scale invariance: a loss that depends only on the bearing of θ, as behind a normalization layer
const SINV_R0 = 0.06, WD_ETA = 0.004, WD_ADAM = 4, WD_T = 6000;
const sinvF = (p) => { let z = 0; for (const v of FEAT.sinv) z -= v.a * Math.exp(v.k * (Math.cos(p - v.p) - 1)); return z; };
function sheetBearing(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0 });
  const p0 = R.range(-0.25, 0.25);
  FEAT.sinv = [{ p: p0 + 0.42, a: 0.45, k: 18 }, { p: p0 + 2.72, a: 0.38, k: 40 }, { p: p0 - 2.2, a: 0.32, k: 10 }];
  FEAT.sinv.forEach((v) => { v.f2 = v.a * v.k; });                // f″ on the valley floor; the neighbours add less than 10⁻⁶
  [...FEAT.sinv].sort((a, b) => b.f2 - a.f2).forEach((v, k) => { v.n = 'ABC'[k]; });
  let m = 0; for (let k = 0; k < 720; k++) m += sinvF(k / 720 * TAU) / 720;
  // exactly L(cθ) = L(θ) outside a small disc at the origin, where the bearing is undefined and the sheet is filled in
  EXTRA = (x, y) => { const r = Math.hypot(x, y); EXCALM = 2; return m + (sinvF(Math.atan2(y, x)) - m) * sq5(r / SINV_R0); };
  sheetEnd(R, true);
}
// minibatch gradients of a scale-invariant loss are perpendicular to θ and scale like 1/‖θ‖ too
function wdNoise(i, x, y, s, R, out) { const r2 = x * x + y * y + 1e-12, n = s * R.normal() / r2; out[0] = -y * n; out[1] = x * n; }
const wdRS = () => Math.pow(WD_ETA * WD_ETA * SIM.noise * SIM.noise / (2 * SIM.il), 0.25);   // ‖θ‖⁴ = ησ²/2λ, with λ = ηλ/η
const wdRA = () => WD_ADAM * WD_ETA / Math.sqrt(SIM.il);                                       // √(η_A C/2λ_A), C = 2
const wdRC = (v) => Math.sqrt(WD_ETA * v.f2 / 2);                                               // where η f″/‖θ‖² = 2
const wdAngS = () => Math.sqrt(2 * SIM.il), wdAngA = () => Math.sqrt(2 * SIM.il * 0.1 / 1.9);  // AdamW: × √((1 − β₁)/(1 + β₁))
function curveBins(C, t, nb, f = (v) => v) {
  const xs = [], ys = [], w = C.len / nb;
  for (let b = 0; b < nb; b++) { let s = 0, n = 0; for (let k = Math.floor(b * w); k < Math.floor((b + 1) * w); k++) { s += C.sum[t][k]; n += C.cnt[t][k]; } xs.push((b + 0.5) * w); ys.push(n > 0 ? f(s / n) : NaN); }
  return { xs, ys };
}
function wdLatest(t, from) {         // mean norm and RMS angle per step of an optimizer's latest cohort, over ages ≥ from
  const st = PL.st; let r = 0, n = 0, a = 0, na = 0;
  for (let k = from; k < st.R.len; k++) { r += st.R.sum[t][k]; n += st.R.cnt[t][k]; a += st.A.sum[t][k]; na += st.A.cnt[t][k]; }
  return n > 20 ? { r: r / n, ang: Math.sqrt(a / na) } : null;
}
function wdStats() {                 // the followed cohort once it has settled, else the one before it
  const cur = { s: wdLatest(1, 2500), a: wdLatest(2, 2500), g: wdLatest(0, 4000) };
  return cur.s ? cur : PL.st.done || cur;
}
plate({
  id: 'wd', ch: 2, seed: 1607,
  run: [
    null,
    (T) => { T.set('il', 4e-4); T.set('noise', 4); T.clear(); const p = FEAT.sinv[0].p - 0.9; T.release(0.45 * Math.cos(p), 0.45 * Math.sin(p)); nextRelease = STAT.steps + 3000; },
    (T) => { T.set('il', 4e-4); T.set('noise', 0.3); T.clear(); const p = FEAT.sinv[0].p - 0.9; T.release(0.45 * Math.cos(p), 0.45 * Math.sin(p)); nextRelease = STAT.steps + 3000; },
    (T) => { T.set('il', 4e-4); T.set('noise', 0); T.clear(); const p = FEAT.sinv[0].p - 0.9; T.release(0.45 * Math.cos(p), 0.45 * Math.sin(p)); nextRelease = STAT.steps + 3000; },
  ],
  status: 'established',
  tribes: [
    { k: 'sgd', name: 'SGD', noise: N_FN, noiseFn: wdNoise, rule: 'θ ← θ − η g̃', rest: 'never', maxAge: WD_T },
    { k: 'sgd', name: 'SGD with weight decay', color: '#4b3fa0', noise: N_FN, noiseFn: wdNoise, wd: 'l2', rule: 'θ ← θ − η(g̃ + λθ)', rest: 'never', maxAge: WD_T },
    { k: 'adam', name: 'AdamW', noise: N_FN, noiseFn: wdNoise, wd: 'dec', etaMul: WD_ADAM, wdMul: 1 / WD_ADAM, rule: 'θ ← θ − η(m̂ ⁄ (√v̂ + ε) + λθ)', rest: 'never', maxAge: WD_T },
  ],
  sim: { lr: WD_ETA, noise: 2.5, il: 4e-4, beta2: 0.999 },
  ctl: [
    { key: 'il', label: 'Intrinsic learning rate ηλ', min: 1.5e-4, max: 2e-3, scale: 'log', f: (v) => v.toExponential(1) },
    { key: 'noise', label: 'Gradient noise σ', min: 0, max: 4, step: 0.05 },
  ],
  view: { yaw: -6, pitch: 52, zoom: 0.9, at: [0, 0] },
  speed: 3, figH: 250,
  sheet: sheetBearing,
  features: () => { SIM.wd = SIM.il / SIM.lr; PL.st = { R: curveInit(3, WD_T), A: curveInit(3, WD_T), k: 0 }; },
  names: (S) => {
    for (const v of FEAT.sinv) {
      const c = Math.cos(v.p), s = Math.sin(v.p);
      S.paths.push({ text: `Valley ${v.n}`, pts: [0.32 * c, 0.32 * s, 0.98 * c, 0.98 * s], size: 11.5, offset: 0.07 });
      const r = 0.93, p = { x: r * Math.cos(v.p + 0.16), y: r * Math.sin(v.p + 0.16) };
      S.marks.push({ p, name: '', sub: `f″ ${v.f2.toFixed(1)}`, sym: 'none', pin: false });
    }
    S.marks.push({ p: { x: 0, y: 0 }, name: '', sub: 'θ = 0', sym: 'none', pin: false });
  },
  lines: () => {
    const circ = (r, col, a) => { const pts = []; for (let k = 0; k <= 360; k++) { const t = k / 360 * TAU, x = r * Math.cos(t), y = r * Math.sin(t); if (x > X0 && x < X1 && y > Y0 && y < Y1) pts.push(x, y, 0.003); else { if (pts.length > 3) line(pts.slice(), col, 1.4, 0.02, true, a); pts.length = 0; } } if (pts.length > 3) line(pts, col, 1.4, 0.02, true, a); };
    if (SIM.noise > 0.05) circ(wdRS(), TRIBES[1].color, 0.85);
    if (SIM.noise > 0.05) circ(wdRA(), TRIBES[2].color, 0.85);
    for (const v of FEAT.sinv) {        // the edge of stability across each valley floor, for the SGD step
      const r = wdRC(v), c = Math.cos(v.p), s = Math.sin(v.p), h = 0.035;
      line([r * c + h * s, r * s - h * c, 0.003, r * c - h * s, r * s + h * c, 0.003], INK, 1.6, 0, true, 0.85);
    }
  },
  overlay: (oc) => {
    let pr = 0, best = -Infinity; for (let k = 0; k < 72; k++) { const p = k / 72 * TAU, v = sinvF(p) + 0.3 * Math.sin(p); if (v > best) { best = v; pr = p; } }   // a ridge, toward the top of the sheet
    oc.font = `italic 400 ${PHONE ? 11 : 12}px ${SERIF}`; oc.textAlign = 'center'; oc.textBaseline = 'bottom'; oc.lineJoin = 'round';
    const lab = (r, t, col) => {
      const x = r * Math.cos(pr), y = r * Math.sin(pr); if (x < X0 || x > X1 || y < Y0 || y > Y1) return;
      project(VP, x, y, hgrid(x, y) * ZS + 0.02, P0);
      oc.strokeStyle = 'rgba(236,238,232,0.9)'; oc.lineWidth = 3; oc.strokeText(t, P0[0], P0[1]); oc.fillStyle = col; oc.fillText(t, P0[0], P0[1]);
    };
    if (SIM.noise > 0.05) lab(wdRS(), '(ησ²/2λ)^¼', TRIBES[1].color);
    if (SIM.noise > 0.05) lab(wdRA(), '√(ηC/2λ)', TRIBES[2].color);
  },
  onSim: (k) => { if (k === 'il') SIM.wd = SIM.il / SIM.lr; if (k === 'il' || k === 'noise') linesDirty = true; },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 40) { nextRelease = STAT.steps + 45; return; }
    const track = st.t0 == null || STAT.steps - st.t0 >= WD_T;          // the figure follows one cohort through its whole walk
    if (track) { const d = wdStats(); if (d.s) st.done = d; curveReset(st.R); curveReset(st.A); st.t0 = STAT.steps; }
    const p = FEAT.sinv[st.k % 3].p + (st.k % 2 ? 0.9 : -0.9) + RREL.range(-0.15, 0.15), r0 = 0.45, x = r0 * Math.cos(p), y = r0 * Math.sin(p);
    st.k++;
    stamp(x, y, 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
    for (let t = 0; t < TRIBES.length; t++) for (let k = 0; k < (PHONE ? 5 : 8); k++) { const i = spawn(x + RREL.normal() * 0.006, y + RREL.normal() * 0.006, t); if (i >= 0) An[i] = track ? st.R.cid : 0; }
    STAT.released++;
    nextRelease = STAT.steps + 3000;
  },
  click: (x, y) => { const st = PL.st; curveReset(st.R); curveReset(st.A); st.t0 = STAT.steps; stamp(x, y, 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023); for (let t = 0; t < TRIBES.length; t++) for (let k = 0; k < 6; k++) { const i = spawn(x + RREL.normal() * 0.006, y + RREL.normal() * 0.006, t); if (i >= 0) An[i] = st.R.cid; } STAT.released++; },
  step: (i) => {
    const st = PL.st; if (An[i] !== st.R.cid) return;
    curveAdd(st.R, Tr[i], Age[i], Math.hypot(Wx[i], Wy[i]));
    const dp = Math.atan2(Px[i] * Wy[i] - Py[i] * Wx[i], Px[i] * Wx[i] + Py[i] * Wy[i]);
    curveAdd(st.A, Tr[i], Age[i], dp * dp);
  },
  readouts: () => {
    const { s, a, g } = wdStats();
    const out =[['ηλ', SIM.il.toExponential(1)], ['λ, SGD · AdamW', `${(SIM.il / WD_ETA).toFixed(3)} · ${(SIM.il / (WD_ETA * WD_ADAM)).toFixed(4)}`]];
    out.push(['‖θ‖, SGD with decay', s ? `${s.r.toFixed(3)} (predicted ${SIM.noise > 0.05 ? wdRS().toFixed(3) : '—'})` : '…']);
    out.push(['‖θ‖, AdamW', a ? `${a.r.toFixed(3)} (predicted ${SIM.noise > 0.05 ? wdRA().toFixed(3) : '—'})` : '…']);
    out.push(['angle per step, SGD with decay', s ? `${s.ang.toFixed(4)} (predicted √(2ηλ) = ${wdAngS().toFixed(4)})` : '…']);
    if (g) out.push(['η/‖θ‖², SGD without decay', (WD_ETA / (g.r * g.r)).toFixed(4)]);
    return out;
  },
  debug: () => {
    const { s, a, g } = wdStats();
    const r = (v) => (v == null ? null : +v.toFixed(4));
    return { il: SIM.il, sigma: SIM.noise, sgdWD: s && { r: r(s.r), rPred: r(wdRS()), ang: r(s.ang), angPred: r(wdAngS()) }, adamW: a && { r: r(a.r), rPred: r(wdRA()), ang: r(a.ang), angPred: r(wdAngA()) }, sgdLate: g && { r: r(g.r) }, rEdge: FEAT.sinv.map((v) => r(wdRC(v))) };
  },
  fig: (c, w, h) => {
    const st = PL.st, hh = (h - 12) / 2, x0 = 30, x1 = w - 6, nb = 60;
    let y0 = 8, y1 = hh - 22;
    FIG.axes(c, x0, y0, x1, y1, '', '‖θ‖');
    const rmax = Math.max(1.2, wdRA() * 1.15);
    const sR = TRIBES.map((T, t) => Object.assign(curveBins(st.R, t, nb), { color: T.color, w: 1.4 }));
    const r1 = figSeries(c, x0, y0, x1, y1, sR, { xmax: WD_T, ymin: 0, ymax: rmax });
    const hline = (r, y, col) => { c.setLineDash([3, 2]); c.strokeStyle = col; c.globalAlpha = 0.75; c.beginPath(); c.moveTo(x0, r.ty(y)); c.lineTo(x1, r.ty(y)); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; };
    if (SIM.noise > 0.05) hline(r1, wdRS(), TRIBES[1].color);
    if (SIM.noise > 0.05) hline(r1, wdRA(), TRIBES[2].color);
    for (const v of [0, 1]) FIG.tick(c, x0 - 3, r1.ty(v), String(v), 'right', 'middle');
    y0 = hh + 14; y1 = h - 28;
    FIG.axes(c, x0, y0, x1, y1, 'steps, one cohort', 'log₁₀ angle per step');
    const sA = TRIBES.map((T, t) => Object.assign(curveBins(st.A, t, nb, (v) => 0.5 * Math.log10(Math.max(1e-12, v))), { color: T.color, w: 1.4 }));
    const r2 = figSeries(c, x0, y0, x1, y1, sA, { xmax: WD_T, ymin: -3.2, ymax: -0.8 });
    hline(r2, Math.log10(wdAngS()), TRIBES[1].color); hline(r2, Math.log10(wdAngA()), TRIBES[2].color);
    FIG.note(c, x1 - 2, r2.ty(Math.log10(wdAngS())) - 7, '√(2ηλ)', 'rgba(36,38,43,0.75)', 'right');
    for (const v of [-3, -2, -1]) FIG.tick(c, x0 - 3, r2.ty(v), String(v), 'right', 'middle');
    FIG.tick(c, x1, y1 + 4, String(WD_T), 'right');
  },
});

// --- Newton
function sheetNewton(R) {
  sheetBase(R, { bk: 0.16, bk4: 0.02, na: 0.012 });
  BX = R.range(-0.1, 0.1); BY = R.range(-0.1, 0.1);
  const P = [[-1.0, 0.45, 1], [0, 0.5, -1], [1.0, 0.45, 1], [-1.0, -0.45, -1], [0, -0.5, 1], [1.0, -0.45, -1]];
  for (const [x, y, s] of P) addGauss(x + R.range(-0.12, 0.12), y + R.range(-0.1, 0.1), s * R.range(0.4, 0.52), R.range(0.24, 0.3), R.range(0.18, 0.24), R.range(0, 3));
  sheetEnd(R);
}
plate({
  id: 'newton', ch: 2, seed: 1117,
  run: [
    (T) => { T.set('lr', 0.004); T.set('alpha', 0.1); },
    null,
    null,
    (T) => { T.set('lr', 0.004); T.set('alpha', 1); },
  ],
  status: 'established',
  tribes: [{ k: 'newton' }, { k: 'sfn' }, { k: 'gd' }],
  sim: { lr: 0.004, noise: 0, alpha: 0.1 },
  ctl: ['lr', { key: 'alpha', label: 'Newton step size α', min: 0.02, max: 1, step: 0.01 }],
  view: { yaw: -8, pitch: 46 },
  sheet: sheetNewton,
  features: () => {
    const st = PL.st = { cnt: TRIBES.map(() => [0, 0, 0]) };
    CRIT = findCritical(140, false).filter((c) => c.x > X0 + 0.06 && c.x < X1 - 0.06 && c.y > Y0 + 0.06 && c.y < Y1 - 0.06);
    st.crit = CRIT;
  },
  names: (S) => {
    for (const c of PL.st.crit) {
      if (c.type === 'max') S.marks.push({ p: c, name: 'Summit', sub: `L ${c.L.toFixed(3)}`, sym: 'peak', pri: 5 });
      else if (c.type === 'saddle' && c.l2 > 1) S.marks.push({ p: c, name: '', sub: `${c.L.toFixed(2)}`, sym: 'pass', pin: false });
      else if (c.type === 'min' && c.l1 > 1) S.marks.push({ p: c, name: '', sub: `${c.L.toFixed(2)}`, sym: 'min', pin: false });
    }
  },
  plan: () => { for (let k = 0; k < 4; k++) RELEASES.push(mitchellHigh(RPLAN, 0.15)); RELEASES.more = () => { const x = RPLAN.range(X0 + 0.15, X1 - 0.15), y = RPLAN.range(Y0 + 0.15, Y1 - 0.15); return [x, y]; }; },
  retire: (i, ring) => {
    if (!ring) return;
    hess(Ex[i], Ey[i]); const det = hXX * hYY - hXY * hXY, tr = hXX + hYY;
    PL.st.cnt[Tr[i]][det < 0 ? 1 : tr < 0 ? 2 : 0]++;
  },
  onSim: (k) => {      // the counts restart, so they describe the current α and η only
    if (k !== 'alpha' && k !== 'lr') return;
    for (let i = 0; i < hiW; i++) if (Alive[i]) retire(i, false);
    PL.st.cnt = TRIBES.map(() => [0, 0, 0]); nextRelease = STAT.steps + 20;
  },
  readouts: () => { const c = PL.st.cnt[0]; return [['Newton at minima', String(c[0])], ['at saddles', String(c[1])], ['at summits', String(c[2])]]; },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 8, x1 = w - 8, rowH = Math.min(38, (h - 22) / TRIBES.length);
    TRIBES.forEach((T, t) => {
      const y = 4 + t * rowH, k = st.cnt[t], n = k[0] + k[1] + k[2];
      c.font = `500 9px ${SERIF}`; c.letterSpacing = '1px'; c.fillStyle = INK; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(T.name.toUpperCase(), x0, y); c.letterSpacing = '0px';
      const by = y + 12, bh = rowH - 17;
      if (!n) { FIG.tick(c, x0, by + bh / 2, 'no rings yet', 'left', 'middle'); return; }
      let xx = x0;
      [0, 1, 2].forEach((q) => { const ww = (x1 - x0) * k[q] / n; c.fillStyle = rgba(T.color, [0.85, 0.45, 0.2][q]); c.fillRect(xx, by, ww, bh); if (ww > 34) { c.font = `400 8.5px ${MONO}`; c.fillStyle = q === 0 ? '#f3f4ef' : INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(['minimum', 'saddle', 'summit'][q], xx + ww / 2, by + bh / 2); } xx += ww; });
    });
  },
});

// --- sharpness-aware minimization
function sheetPits(R) {
  sheetBase(R, { bk: 0.12, bk4: 0.015, na: 0.03 });
  BX = -0.4; BY = R.range(-0.1, 0.1);
  const by = R.range(-0.2, 0.2);
  FLi = addGauss(-0.95, by, -0.7, R.range(0.36, 0.42), R.range(0.3, 0.34), R.range(-0.4, 0.4));
  EXTRA = (x, y) => 0.32 * x;
  const pits = [];
  for (let t = 0; t < 40 && pits.length < 5; t++) {
    const x = R.range(-0.25, 1.15), y = R.range(-0.62, 0.62);
    if (pits.every((p) => Math.hypot(p[0] - x, p[1] - y) > 0.32)) pits.push([x, y]);
  }
  for (const [x, y] of pits) addGauss(x, y, -0.22, R.range(0.027, 0.03), R.range(0.025, 0.028), R.range(0, 3));
  addGauss(R.range(-0.4, 0.4), R.range(0.75, 0.9), R.range(0.25, 0.32), 0.3, 0.12, R.range(-0.2, 0.2));
  addGauss(R.range(-0.4, 0.4), R.range(-0.9, -0.75), R.range(0.25, 0.32), 0.3, 0.12, R.range(-0.2, 0.2));
  FEAT.pits = pits; FEAT.basin = [-0.95, by];
  sheetEnd(R);
}
function samField() {
  const rho = SIM.rho, st = PL.st;
  st.sam = fieldGrid((x, y) => { let m = L(x, y); for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; m = Math.max(m, L(x + rho * Math.cos(a), y + rho * Math.sin(a))); } return m; }, PHONE ? 110 : 170);
}
plate({
  id: 'sam', ch: 2, seed: 1213,
  run: [
    (T) => { T.set('lr', 0.003); T.set('noise', 0.25); T.set('rho', 0.09); },
    null,
    null,
    (T) => { T.set('lr', 0.003); T.set('noise', 0.25); T.set('rho', 0.02); },
  ],
  status: 'contested',
  tribes: [{ k: 'sgd' }, { k: 'sam' }],
  sim: { lr: 0.003, noise: 0.25, rho: 0.09 },
  ctl: ['lr', 'noise', { key: 'rho', label: 'SAM radius ρ', min: 0, max: 0.15, step: 0.005 }],
  view: { yaw: 12, pitch: 46 },
  sheet: sheetPits,
  features: () => {
    const st = PL.st = { rest: TRIBES.map(() => [0, 0, 0]), stall: TRIBES.map(() => 0) };
    st.pits = FEAT.pits.map((p) => critAt(p[0], p[1])).filter((m) => m && m.type === 'min');
    st.basin = critAt(FEAT.basin[0], FEAT.basin[1], 100);
    samField();
  },
  names: (S) => {
    const st = PL.st;
    if (st.basin) { S.areas.push({ x: st.basin.x, y: st.basin.y, lines: ['Broad Basin'], size: 15, ls: 3, south: true }); S.marks.push({ p: st.basin, name: 'Basin floor', sub: `λ ${st.basin.l2.toFixed(1)}`, sym: 'min', pri: 8 }); }
    st.pits.forEach((m, k) => S.marks.push({ p: m, name: k === 0 ? 'Pit' : '', sub: `λ ${m.l2.toFixed(0)}`, sym: 'min', pin: k === 0 ? undefined : false, pri: 6 }));
  },
  print: () => {
    const F0 = PL.st.sam; if (!F0 || SIM.rho <= 0) return;
    const iv = F.params.interval;
    let lo = Infinity, hi = -Infinity; for (const v of F0.G) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    for (let lev = Math.ceil(lo / iv) * iv; lev < hi; lev += iv) strokeChains(isoChains(F0.G, F0.W, F0.H, X0, Y0, F0.dx, F0.dy, lev), 'rgba(22,122,91,0.78)', 0.7, [3, 2.4]);
  },
  plan: () => {
    for (let k = 0; k < 5; k++) RELEASES.push([RPLAN.range(1.1, 1.45), RPLAN.range(-0.7, 0.7)]);
    RELEASES.more = () => [RPLAN.range(0.9, 1.45), RPLAN.range(-0.75, 0.75)];
  },
  retire: (i, ring) => {
    if (!ring) { if (Age[i] > 45 * 55) PL.st.stall[Tr[i]]++; return; }
    const st = PL.st, x = Ex[i], y = Ey[i];
    if (st.pits.some((m) => Math.hypot(m.x - x, m.y - y) < 0.06)) st.rest[Tr[i]][0]++;
    else if (st.basin && Math.hypot(st.basin.x - x, st.basin.y - y) < 0.3) st.rest[Tr[i]][1]++;
    else st.rest[Tr[i]][2]++;
  },
  onSim: (k) => {
    if (k === 'rho') { clearTimeout(PL._t); PL._t = setTimeout(() => { samField(); printDirty = true; }, 180); }
    if (k === 'rho' || k === 'lr' || k === 'noise') {      // the counts restart, so they describe the current settings only
      const st = PL.st;
      for (let i = 0; i < hiW; i++) if (Alive[i]) retire(i, false);
      st.rest = TRIBES.map(() => [0, 0, 0]); st.stall = TRIBES.map(() => 0); nextRelease = STAT.steps + 20;
    }
  },
  readouts: () => { const r = PL.st.rest, s = PL.st.stall; return [['ρ', SIM.rho.toFixed(3)], ['SGD rest', `${r[0][0]} in pits · ${r[0][1]} in the basin`], ['SAM rest', `${r[1][0]} in pits · ${r[1][1]} in the basin`], ['never at rest, SGD · SAM', `${s[0]} · ${s[1]}`]]; },
  fig: (c, w, h) => {
    const r = PL.st.rest, x0 = 8, y0 = 8, x1 = w - 4, y1 = h - 28;
    const sh = (t) => { const n = r[t][0] + r[t][1] + r[t][2] || 1; return [r[t][0] / n, r[t][1] / n, r[t][2] / n]; };
    const a = sh(0), b = sh(1);
    figBars(c, x0, y0, x1, y1, [[a[0], b[0]], [a[1], b[1]], [a[2], b[2]]], ['in a pit', 'in the basin', 'elsewhere'], [rgba(TRIBES[0].color, 0.85), rgba(TRIBES[1].color, 0.85)], { ymax: 1 });
    c.strokeStyle = 'rgba(36,38,43,0.4)'; c.beginPath(); c.moveTo(x0, y1 + 0.5); c.lineTo(x1, y1 + 0.5); c.stroke();
  },
});

// --- weight averaging
// L* of the basin floor nearer to (x, y)
function avgFloor(st, x, y) { return Math.hypot(x - st.w.x, y - st.w.y) < Math.hypot(x - st.e.x, y - st.e.y) ? st.w.L : st.e.L; }
function sheetTwoBasins(R) {
  sheetBase(R, { bk: 0.16, bk4: 0.02, na: 0.035 });
  BX = R.range(-0.08, 0.08); BY = R.range(-0.08, 0.08);
  const a1 = R.range(-0.5, 0.5), a2 = R.range(-0.5, 0.5);
  FEAT.wb = [R.range(-0.75, -0.55), R.range(-0.15, 0.15)]; FEAT.eb = [R.range(0.55, 0.75), R.range(-0.15, 0.15)];
  FLi = addGauss(FEAT.wb[0], FEAT.wb[1], -0.68, 0.42, 0.15, a1);
  SHi = addGauss(FEAT.eb[0], FEAT.eb[1], -0.66, 0.4, 0.16, a2);
  addGauss(0, R.range(-0.1, 0.1), R.range(0.25, 0.32), 0.12, 0.4, R.range(-0.2, 0.2));
  addGauss(R.range(-1.3, -1.0), R.range(0.6, 0.8), R.range(0.2, 0.28), 0.18, 0.13, R.range(0, 3));
  addGauss(R.range(1.0, 1.3), R.range(-0.8, -0.6), R.range(0.2, 0.28), 0.18, 0.13, R.range(0, 3));
  sheetEnd(R);
}
plate({
  id: 'averaging', ch: 2, seed: 1301,
  run: [
    null,
    (T) => { T.set('noise', 2); T.set('lr', 0.006); },
    (T) => { T.set('noise', 2); T.set('lr', 0.04); },
    null,
  ],
  status: 'established',
  tribes: [{ k: 'sgd', avg: 120, rest: 'never', maxAge: 1600, rule: 'θ ← θ − η g̃,  θ̄ ← θ̄ + (θ − θ̄) ⁄ n' }],
  sim: { lr: 0.02, noise: 2 },
  ctl: ['lr', 'noise'],
  view: { yaw: -6, pitch: 52 },
  sheet: sheetTwoBasins,
  onSim: (k) => { if (k === 'lr' || k === 'noise') curveReset(PL.st.C); },
  features: () => {
    const st = PL.st = { C: curveInit(2, 1600), k: 0, pair: null };
    st.w = critAt(FEAT.wb[0], FEAT.wb[1]); st.e = critAt(FEAT.eb[0], FEAT.eb[1]);
  },
  names: (S) => {
    const { w, e } = PL.st;
    if (w) S.areas.push({ x: w.x, y: w.y, lines: ['West Basin'], size: 13.5, ls: 2.6, south: true });
    if (e) S.areas.push({ x: e.x, y: e.y, lines: ['East Basin'], size: 13.5, ls: 2.6, south: true });
  },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 30) { nextRelease = STAT.steps + 45; return; }
    const b = st.k++ % 2 ? st.e : st.w; if (!b) { nextRelease = STAT.steps + 45; return; }
    const p = [b.x + RPLAN.range(-0.25, 0.25), b.y + RPLAN.range(0.15, 0.3) * (RPLAN() < 0.5 ? 1 : -1)];
    stamp(p[0], p[1], 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
    for (let k = 0; k < (PHONE ? 5 : 8); k++) { const i = spawn(p[0] + RREL.normal() * 0.01, p[1] + RREL.normal() * 0.01, 0); if (i >= 0) Tag[i] = st.C.cid; }
    STAT.released++;
    nextRelease = STAT.steps + Math.round(7 * 45);
  },
  step: (i) => {
    const st = PL.st;
    if (Tag[i] !== st.C.cid || !st.w || !st.e) return;
    curveAdd(st.C, 0, Age[i], Wl[i] - avgFloor(st, Wx[i], Wy[i])); if (An[i] > 0) curveAdd(st.C, 1, Age[i], L(Ax[i], Ay[i]) - avgFloor(st, Ax[i], Ay[i]));
  },
  frame: () => {
    const st = PL.st; if (F.frame % 45 !== 0 || !st.w || !st.e) return;
    let a = -1, b = -1;
    for (let i = 0; i < hiW; i++) {
      if (!Alive[i] || An[i] < 300) continue;
      const dw = Math.hypot(Ax[i] - st.w.x, Ay[i] - st.w.y), de = Math.hypot(Ax[i] - st.e.x, Ay[i] - st.e.y);
      if (dw < 0.15 && a < 0) a = i; else if (de < 0.15 && b < 0) b = i;
    }
    const np = a >= 0 && b >= 0 ? [Ax[a], Ay[a], Ax[b], Ay[b]] : st.pair;
    if (np !== st.pair) { st.pair = np; linesDirty = true; }
  },
  lines: () => { const p = PL.st.pair; if (p) line(drape([p[0], p[1], p[2], p[3]]), INK, 1.1, 0.022, true, 0.8); },
  overlay: (oc) => {
    const p = PL.st.pair; if (!p) return;
    const mx = (p[0] + p[2]) / 2, my = (p[1] + p[3]) / 2, Lm = L(mx, my);
    project(VP, mx, my, hgrid(mx, my) * ZS, P0);
    oc.fillStyle = INK; oc.beginPath(); oc.arc(P0[0], P0[1], 2.6, 0, TAU); oc.fill();
    oc.font = `400 ${PHONE ? 8 : 8.5}px ${MONO}`; oc.textAlign = 'center'; oc.textBaseline = 'bottom'; oc.lineJoin = 'round';
    const t = `midpoint of two averages · L ${Lm.toFixed(3)}`;
    oc.strokeStyle = 'rgba(236,238,232,0.9)'; oc.lineWidth = 3; oc.strokeText(t, P0[0], P0[1] - 6); oc.fillStyle = INK; oc.fillText(t, P0[0], P0[1] - 6);
  },
  readouts: () => {
    const st = PL.st, a = curveMean(st.C, 0), b = curveMean(st.C, 1);
    let la = NaN, lb = NaN; for (let k = st.C.len - 1; k >= 0; k--) { if (Number.isNaN(la) && Number.isFinite(a[k])) la = a[k]; if (Number.isNaN(lb) && Number.isFinite(b[k])) lb = b[k]; }
    return [['L − L*, particles', Number.isFinite(la) ? la.toFixed(4) : '—'], ['L − L*, averages', Number.isFinite(lb) ? lb.toFixed(4) : '—']];
  },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28, base = 0;
    FIG.axes(c, x0, y0, x1, y1, 'steps', 'log₁₀(L − L*)');
    const r = figSeries(c, x0, y0, x1, y1, [
      { ys: curveMean(st.C, 0, (v) => Math.log10(Math.max(1e-5, v - base))), color: TRIBES[0].color, w: 1.3 },
      { ys: curveMean(st.C, 1, (v) => Math.log10(Math.max(1e-5, v - base))), color: INK, w: 1.3, dash: [3, 2] },
    ], { xmax: st.C.len, ymin: -4, ymax: 0.3 });
    for (const v of [-4, -3, -2, -1, 0]) FIG.tick(c, x0 - 3, r.ty(v), String(v), 'right', 'middle');
    FIG.note(c, x1 - 4, r.ty(-0.6), 'particles', TRIBES[0].color, 'right');
    FIG.note(c, x1 - 4, r.ty(-3.5), 'their averages', INK, 'right');
  },
});
// ch2>>

// <<ch3
// ---------------------------------------------------------------------------------------------
// III · Weather: step size and noise
// ---------------------------------------------------------------------------------------------
// steepest-descent catchments of any gridded field (row 0 = south)
function catchGrid(G, W, H, dx, dy) {
  const N = W * H, dn = new Int32Array(N), dd = Math.hypot(dx, dy);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i; let best = k, bs = 0;
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
      if (!a && !b) continue;
      const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue;
      const kk = jj * W + ii, sl = (G[k] - G[kk]) / (a && b ? dd : a ? dx : dy);
      if (sl > bs) { bs = sl; best = kk; }
    }
    dn[k] = best;
  }
  const lab = new Int32Array(N).fill(-2), sinks = [], stack = [];
  for (let k = 0; k < N; k++) {
    let q = k; stack.length = 0;
    while (lab[q] === -2 && dn[q] !== q) { stack.push(q); q = dn[q]; }
    if (lab[q] === -2) { lab[q] = sinks.length; sinks.push({ x: X0 + (q % W) * dx, y: Y0 + ((q / W) | 0) * dy, n: 0 }); }
    for (const r of stack) lab[r] = lab[q];
  }
  for (let k = 0; k < N; k++) sinks[lab[k]].n++;
  return { lab, W, H, dx, dy, sinks };
}
const ramp = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
const rgbHex = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');

// --- the stability threshold and catapults: a round central well for fans of step sizes, six wells on a ring for cohorts
function sheetWells(R) {
  sheetBase(R, { bk: 0.22, bk4: 0.02, na: 0.02 });
  SHi = addGauss(0, 0, -0.6, 0.14, 0.14, 0);
  const sig = [0.026, 0.045, 0.06, 0.08, 0.11, 0.15];
  for (let i = sig.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = sig[i]; sig[i] = sig[j]; sig[j] = t; }
  const off = R.range(0, TAU);
  FEAT.wells = sig.map((s, k) => { const a = off + k / 6 * TAU + R.range(-0.15, 0.15), x = 1.28 * Math.cos(a), y = 0.64 * Math.sin(a); addGauss(x, y, -0.3, s, s * R.range(0.88, 1), R.range(0, 3)); return [x, y]; });
  sheetEnd(R, true);
}
const FAN = [0.4, 0.7, 0.9, 0.97, 1.03, 1.1, 1.3, 1.6, 2.0];
const fanRGB = (c) => (c < 1 ? ramp('#23708f', '#4b3fa0', clamp((c - 0.4) / 0.6, 0, 1)) : ramp('#cf6d0c', '#8e1f35', clamp(c - 1, 0, 1)));
// regimes of gradient descent in a Gaussian well, by ηλ: a two-step bounce is stable up to 2√e ≈ 3.3, then it period-doubles
// and turns chaotic. With the bowl's tilt and the texture, particles left a well from ηλ between 3.4 and 7 (two seeds), and always from 7
const wellState = (l) => { const e = SIM.lr * l; return e < 2 ? 'settles' : e < 3.3 ? 'bounces' : e < 7 ? 'bounces or throws out' : 'throws out'; };
function fireFan(x, y) {
  const st = PL.st; if (!st.mid) return;
  stamp(x, y, 0.008, 1, 0.12, 0.125, 0.14, 0.85, 0.0018);
  for (const c of FAN) { const i = spawn(x, y, 0, { eta: c * 2 / st.mid.l2, rgb: fanRGB(c) }); if (i >= 0) { Ax[i] = c; Ay[i] = 0; An[i] = 0; } }
  STAT.released++;
}
plate({
  id: 'stability', ch: 1, seed: 1409,
  run: [
    null,
    null,
    (T) => {
      const ring = PL.st.wells.filter((m) => m !== PL.st.mid), w = ring.filter((m) => PL.sim.lr * m.l2 < 2).sort((a, b) => b.l2 - a.l2)[0];
      T.set('noise', PL.sim.noise); T.set('lr', 2.3 / w.l2);
      T.clear(); T.release(w.x, w.y);
    },
    (T) => {
      T.set('noise', PL.sim.noise); T.set('lr', Math.min(0.07, 1.8 / PL.st.mid.l2));
      for (const m of PL.st.wells) if (m !== PL.st.mid && SIM.lr * m.l2 > 7) T.release(m.x, m.y);
    },
  ],
  status: 'established',
  tribes: [
    { k: 'gd', name: 'Fans, η = c · 2/λ', rule: 'θ ← θ − c (2/λ) ∇L', rest: 'never', maxAge: 360, color: '#4b3fa0', absEta: true },
    { k: 'sgd', name: 'SGD at η', color: '#c22a40' },
  ],
  sim: { lr: 0.025, noise: 0.05 },
  ctl: [{ key: 'lr', label: 'Learning rate η', min: 0.004, max: 0.07, scale: 'log', f: (v) => v.toFixed(4) }, 'noise'],
  view: { yaw: -6, pitch: 50 },
  figH: 270,
  jump: true, liveNames: true,
  sheet: sheetWells,
  features: () => {
    const st = PL.st = { rec: [], k: 0 };
    st.mid = critAt(0, 0);
    const ring = FEAT.wells.map((p) => critAt(p[0], p[1])).filter((m) => m && m.type === 'min');
    st.wells = (st.mid ? [st.mid] : []).concat(ring).sort((a, b) => b.l2 - a.l2);
    st.C = catchments(3, false);
    st.wl = new Int32Array(st.C.basins.length).fill(-1);
    st.C.basins.forEach((b, k) => { let best = -1, bd = 0.12; st.wells.forEach((m, q) => { const d = Math.hypot(m.x - b.x, m.y - b.y); if (d < bd) { bd = d; best = q; } }); st.wl[k] = best; });
    st.settled = st.wells.map(() => 0); st.thrown = st.wells.map(() => 0);
  },
  names: (S) => {
    const st = PL.st;
    for (const m of st.wells) {
      if (m === st.mid) S.marks.push({ p: m, name: 'Central well', sub: `λ ${m.l2.toFixed(1)} · 2/λ ${(2 / m.l2).toFixed(4)}`, sym: 'min', pri: 9 });
      else S.marks.push({ p: m, name: '', sub: `λ ${m.l2.toFixed(0)} · ηλ ${(SIM.lr * m.l2).toFixed(1)} · ${wellState(m.l2)}`, sym: 'min', pin: false });
    }
  },
  print: () => {
    const c = sc;
    for (const m of PL.st.wells) {
      if (SIM.lr * m.l2 < 2) continue;
      const r = Math.sqrt((m === PL.st.mid ? 0.6 : 0.3) / m.l2) * 2.2 * OPU;
      c.save(); c.strokeStyle = SIM.lr * m.l2 < 7 ? 'rgba(207,109,12,0.85)' : 'rgba(194,42,64,0.85)'; c.lineWidth = 1.1; c.setLineDash([4, 2.5]);
      c.beginPath(); c.arc(ox(m.x), oy(m.y), r, 0, TAU); c.stroke(); c.restore();
    }
  },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || !st.mid || STAT.alive > maxAlive - 20) { nextRelease = STAT.steps + 45; return; }
    if (st.k++ % 2 === 0) {
      const a = st.k * 2.39996 + 0.3;
      fireFan(st.mid.x + 0.035 * Math.cos(a), st.mid.y + 0.035 * Math.sin(a));
    } else {
      const ring = st.wells.filter((m) => m !== st.mid), m = ring[(st.k >> 1) % ring.length], a = RPLAN.range(0, TAU), r = RPLAN.range(0.1, 0.16);
      const p = [clamp(m.x + r * Math.cos(a), X0 + 0.06, X1 - 0.06), clamp(m.y + r * Math.sin(a), Y0 + 0.06, Y1 - 0.06)];
      releaseCaravan(p[0], p[1], PHONE ? 5 : 8, [1], 0.02);
    }
    nextRelease = STAT.steps + Math.round(3 * 45);
  },
  click: (x, y) => releaseCaravan(x, y, PHONE ? 5 : 8, [1], 0.015),
  step: (i) => {
    const st = PL.st;
    if (Tr[i] === 0) { const m = st.mid; if (m && Age[i] > 320) { Ay[i] += (Wx[i] - m.x) ** 2 + (Wy[i] - m.y) ** 2; An[i]++; } return; }
    const k = labelAt(st.C, Wx[i], Wy[i]), q = k >= 0 ? st.wl[k] : -1;
    const cur = Tag[i] & 0xff, cnt = Tag[i] >> 8;
    if (q + 1 === cur) { if (cnt < 1000) Tag[i] += 256; }
    else { if (cur > 0 && cnt > 3 && Math.hypot(Wx[i] - Px[i], Wy[i] - Py[i]) > 0.02) st.thrown[cur - 1]++; Tag[i] = q + 1; }
  },
  retire: (i, ring) => {
    const st = PL.st;
    if (Tr[i] === 0) { if (An[i] > 0) { st.rec.push([Ax[i], Math.sqrt(Ay[i] / An[i])]); if (st.rec.length > 450) st.rec.shift(); } return; }
    if (!ring) return;
    const k = labelAt(st.C, Ex[i], Ey[i]), q = k >= 0 ? st.wl[k] : -1; if (q >= 0) st.settled[q]++;
  },
  // a particle bouncing in a two-step cycle keeps its average still; only small steps count as rest
  restOK: (i) => Math.hypot(Wx[i] - Px[i], Wy[i] - Py[i]) < 0.004,
  lost: (i) => { if (Tr[i] === 0) { PL.st.rec.push([Ax[i], 3]); An[i] = 0; } },
  readouts: () => {
    const st = PL.st, s = st.settled.reduce((a, b) => a + b, 0), t = st.thrown.reduce((a, b) => a + b, 0);
    const conv = st.rec.filter((r) => r[1] < 1e-3), lastC = conv.length ? Math.max(...conv.map((r) => r[0])) : null;
    return [['largest c that settled', lastC != null ? lastC.toFixed(2) : '…'], ['2/η', (2 / SIM.lr).toFixed(0)], ['SGD settled', String(s)], ['thrown out', String(t)]];
  },
  fig: (c, w, h) => {
    const st = PL.st, hh = (h - 12) / 2, x0 = 30, x1 = w - 6;
    let y0 = 8, y1 = hh - 22;
    FIG.axes(c, x0, y0, x1, y1, 'c = ηλ/2, central well', 'log₁₀ distance');
    const tx = (v) => x0 + (x1 - x0) * (v - 0.3) / 1.8, ty = (v) => y1 - (y1 - y0) * (clamp(v, -8, 0.5) + 8) / 8.5;
    for (const v of [0.5, 1, 1.5, 2]) FIG.tick(c, tx(v), y1 + 4, String(v));
    for (const v of [-8, 0]) FIG.tick(c, x0 - 3, ty(v), String(v), 'right', 'middle');
    c.setLineDash([2, 2]); c.strokeStyle = 'rgba(36,38,43,0.5)'; c.beginPath(); c.moveTo(tx(1), y0); c.lineTo(tx(1), y1); c.stroke(); c.setLineDash([]);
    c.globalAlpha = 0.75;
    for (const r of st.rec) { c.fillStyle = rgbHex(fanRGB(r[0])); c.beginPath(); c.arc(tx(r[0]), ty(Math.log10(Math.max(1e-12, r[1]))), 2.1, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    y0 = hh + 14; y1 = h - 28;
    figBars(c, 8, y0, w - 4, y1, st.wells.map((m, q) => [st.settled[q], st.thrown[q]]), st.wells.map((m) => `ηλ ${(SIM.lr * m.l2).toFixed(1)}`), ['rgba(36,38,43,0.78)', 'rgba(194,42,64,0.8)']);
    c.strokeStyle = 'rgba(36,38,43,0.4)'; c.beginPath(); c.moveTo(8, y1 + 0.5); c.lineTo(w - 4, y1 + 0.5); c.stroke();
  },
});

// --- edge of stability: a valley whose curvature across grows tenfold every 1.25 units downstream
function sheetFunnel(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0.03 });
  const f = FEAT.fun = { l0: 4, k: Math.log(160) / 2.75, a: 0.14, Hc: 2.6, cy: R.range(-0.06, 0.06) };
  EXTRA = (x, y) => {
    const lam = f.l0 * Math.exp(f.k * (x + 1.4)), v = y - f.cy, s = lam * v * v / (2 * f.Hc);
    EXCALM = s < 30 ? Math.exp(-s) : 0;
    let z = -f.a * x + f.Hc * s / (1 + s) + 0.12 * v * v;
    if (x > 1.3) z += 4 * (x - 1.3) * (x - 1.3);
    if (x < -1.45) z += 4 * (x + 1.45) * (x + 1.45);
    return z;
  };
  for (let k = 0; k < 7; k++) { const x = R.range(-1.4, 1.4), y = f.cy + (R() < 0.5 ? 1 : -1) * R.range(0.55, 0.85); addGauss(x, y, R.range(-0.15, 0.25), R.range(0.12, 0.2), R.range(0.08, 0.12), R.range(0, 3)); }
  sheetEnd(R, true);
}
const funLam = (x) => { const f = FEAT.fun; return f.l0 * Math.exp(f.k * (x + 1.4)) + 0.24; };
const funX = (lam) => { const f = FEAT.fun; return -1.4 + Math.log(Math.max(1e-9, (lam - 0.24) / f.l0)) / f.k; };
function eosFlow() {
  const st = PL.st, f = FEAT.fun, xs = funX(2 / SIM.lr), cf = new Float64Array(st.C.len);
  let x = -1.28;
  for (let k = 0; k < cf.length; k++) { cf[k] = x; if (x < xs) { grad(x, f.cy); x = Math.min(xs, x - SIM.lr * gX); } }
  st.cf = cf;
}
// η·λ_max(P⁻¹H) for an Adam particle, P = diag(√v̂ + ε): the eigenvalues of P^−½ H P^−½, which is symmetric
function adamPreSharp(i) {
  const T = TRIBES[Tr[i]], c2 = 1 / (1 - B2[i]), px = Math.sqrt(Sx[i] * c2) + 1e-8, py = Math.sqrt(Sy[i] * c2) + 1e-8;
  hess(Wx[i], Wy[i]);
  const a = hXX / px, b = hXY / Math.sqrt(px * py), d = hYY / py, tr = a + d, det = a * d - b * b;
  return SIM.lr * T.etaMul * (tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)));
}
plate({
  id: 'eos', ch: 1, seed: 1511,
  run: [
    (T) => { T.set('lr', 0.01); T.set('beta2', 0.99); T.clear(); const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
    (T) => { T.set('lr', 0.02); T.set('beta2', 0.99); T.clear(); const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
    null,
    (T) => { T.set('lr', 0.01); T.set('beta2', 0.999); T.clear(); const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
  ],
  status: 'established',
  tribes: [
    { k: 'sgd', name: 'Gradient descent', rule: 'θ ← θ − η∇L, plus σ = 0.01', color: '#c22a40', avg: 1800 },
    { k: 'adam', name: 'Adam, full batch', etaMul: 0.15, sigMul: 0.01, rule: 'θ ← θ − 0.15η m̂ ⁄ (√v̂ + ε), plus σ = 10⁻⁴' },
  ],
  sim: { lr: 0.01, noise: 0.01, beta2: 0.99 },
  ctl: [{ key: 'lr', label: 'Learning rate η', min: 0.004, max: 0.03, scale: 'log', f: (v) => v.toFixed(4) }, { key: 'beta2', label: 'Adam β₂', min: 0.95, max: 0.999, step: 0.001, f: (v) => v.toFixed(3) }],
  view: { yaw: -16, pitch: 40 },
  speed: 2, figH: 300,
  sheet: sheetFunnel,
  features: () => { PL.st = { C: curveInit(2, 2700), P: curveInit(1, 2700), k: 0 }; eosFlow(); },
  names: (S) => {
    const f = FEAT.fun;
    S.paths.push({ text: 'Valley of Rising Sharpness', pts: [-1.25, f.cy, -0.2, f.cy], size: 12.5, offset: 0.13 });
    for (const lam of [10, 30, 100, 300]) { const x = funX(lam); if (x > X0 + 0.05 && x < X1 - 0.05) S.marks.push({ p: { x, y: f.cy - 0.1 }, name: '', sub: `λ ${lam}`, sym: 'none', pin: false }); }
  },
  print: () => {
    const f = FEAT.fun, c = sc; c.strokeStyle = 'rgba(36,38,43,0.75)'; c.lineWidth = 0.9; c.beginPath();
    for (const lam of [10, 20, 30, 50, 100, 200, 300, 500]) { const x = funX(lam); if (x < X0 || x > X1) continue; const w = Math.sqrt(2 * f.Hc / lam) * 0.6; c.moveTo(ox(x), oy(f.cy - w)); c.lineTo(ox(x), oy(f.cy + w)); }
    c.stroke();
  },
  lines: () => {
    const f = FEAT.fun, x = funX(2 / SIM.lr), pts = []; for (let y = f.cy - 0.32; y <= f.cy + 0.32; y += 0.005) pts.push(x, y, 0.003);
    line(pts, '#c22a40', 1.8, 0.024, true, 0.9);
    const cf = []; for (let xx = -1.28; xx <= Math.min(x, 1.3); xx += 0.01) cf.push(xx, f.cy, 0.004);
    line(cf, INK, 1.6, 0, true, 0.85);
  },
  markers: (B, n) => {
    const f = FEAT.fun, o = n * 11; B[o] = Math.min(funX(2 / SIM.lr), 1.3); B[o + 1] = f.cy; B[o + 2] = 7; B[o + 3] = 1; B[o + 4] = 0; B[o + 5] = 0; B[o + 6] = 1; B[o + 7] = 0; B[o + 8] = 0.14; B[o + 9] = 0.15; B[o + 10] = 0.17;
    return n + 1;
  },
  overlay: (oc) => {
    const f = FEAT.fun, x = funX(2 / SIM.lr), y = f.cy + 0.34;
    project(VP, x, y, hgrid(x, y) * ZS + 0.02, P0);
    oc.font = `italic 400 ${PHONE ? 11 : 12}px ${SERIF}`; oc.textAlign = 'center'; oc.textBaseline = 'bottom'; oc.lineJoin = 'round';
    const t = `λ = 2/η = ${(2 / SIM.lr).toFixed(0)}`;
    oc.strokeStyle = 'rgba(236,238,232,0.9)'; oc.lineWidth = 3; oc.strokeText(t, P0[0], P0[1]); oc.fillStyle = '#a3203a'; oc.fillText(t, P0[0], P0[1]);
  },
  onSim: (k) => { if (k === 'lr') { linesDirty = true; eosFlow(); } },
  release: () => {
    const st = PL.st, f = FEAT.fun;
    if (!F.params.auto || STAT.alive > maxAlive - 20) { nextRelease = STAT.steps + 45; return; }
    curveReset(st.C); curveReset(st.P);
    const p = [-1.28, f.cy + (st.k++ % 2 ? -1 : 1) * 0.12];
    stamp(p[0], p[1], 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
    for (let k = 0; k < (PHONE ? 5 : 8); k++) { const i = spawn(p[0] + RREL.normal() * 0.01, p[1] + RREL.normal() * 0.01, 0); if (i >= 0) An[i] = st.C.cid; }
    for (let k = 0; k < (PHONE ? 3 : 5); k++) { const i = spawn(-1.28 + RREL.normal() * 0.01, f.cy + RREL.normal() * 0.0005, 1); if (i >= 0) An[i] = st.C.cid; }    // Adam starts on the floor
    STAT.released++;
    nextRelease = STAT.steps + 2700;
  },
  step: (i) => {
    const st = PL.st; if (An[i] !== st.C.cid) return;
    curveAdd(st.C, Tr[i], Age[i], funLam(Wx[i]));
    if (Tr[i] === 1) curveAdd(st.P, 0, Age[i], adamPreSharp(i));
  },
  debug: () => {
    const a = [], g = [], d = []; for (let i = 0; i < hiW; i++) if (Alive[i] && Age[i] > 1700) { if (Tr[i] === 1) { d.push(funLam(Wx[i])); continue; } a.push(funLam(Wx[i])); if (An[i] > 200) g.push(funLam(Ax[i])); }
    const m = (q) => (q.length ? +(q.reduce((p, r) => p + r, 0) / q.length).toFixed(1) : null), P = curveMean(PL.st.P, 0).slice(1200).filter(Number.isFinite);
    return { twoOverEta: 2 / SIM.lr, lamAtWalkers: m(a), lamAtAverage: m(g), n: a.length, adam: { beta2: SIM.beta2, lamAtWalkers: m(d), n: d.length, preSharpMean: m(Array.from(P)), preSharpMax: P.length ? +Math.max(...P).toFixed(1) : null } };
  },
  maxAge: 2700,
  readouts: () => {
    const st = PL.st, m = curveMean(st.C, 0), ma = curveMean(st.C, 1), mp = curveMean(st.P, 0);
    const last = (q) => { for (let k = q.length - 1; k >= 0; k--) if (Number.isFinite(q[k])) return q[k]; return NaN; };
    const g = []; for (let i = 0; i < hiW; i++) if (Alive[i] && Tr[i] === 0 && An[i] > 200) g.push(funLam(Ax[i]));
    const f1 = (v) => (Number.isFinite(v) ? v.toFixed(1) : '—');
    return [['2/η', (2 / SIM.lr).toFixed(0)], ['λ at particles', f1(last(m))], ['λ at their time average', g.length ? (g.reduce((p, q) => p + q, 0) / g.length).toFixed(1) : '…'],
      ['λ at Adam particles', f1(last(ma))], ['0.15η·λ_max(P⁻¹H), Adam (edge 38)', f1(last(mp))]];
  },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, x1 = w - 6, hh = (h - 12) * 0.56;
    let y0 = 8, y1 = hh - 22;
    FIG.axes(c, x0, y0, x1, y1, '', 'log₁₀ λ at the particles');
    const r = figSeries(c, x0, y0, x1, y1, [{ ys: curveMean(st.C, 0, (v) => Math.log10(v)), color: TRIBES[0].color, w: 1.4 }, { ys: curveMean(st.C, 1, (v) => Math.log10(v)), color: TRIBES[1].color, w: 1.4 }, { ys: Array.from(st.cf, (x) => Math.log10(funLam(x))), color: INK, w: 1.2, dash: [4, 2] }], { xmax: st.C.len, ymin: 0.5, ymax: 3 });
    const yl = r.ty(Math.log10(2 / SIM.lr));
    c.setLineDash([3, 2]); c.strokeStyle = 'rgba(36,38,43,0.6)'; c.beginPath(); c.moveTo(x0, yl); c.lineTo(x1, yl); c.stroke(); c.setLineDash([]);
    FIG.note(c, x0 + 6, yl - 7, '2/η');
    for (const v of [1, 2, 3]) FIG.tick(c, x0 - 3, r.ty(v), String(v), 'right', 'middle');
    y0 = hh + 14; y1 = h - 28;
    FIG.axes(c, x0, y0, x1, y1, 'steps', '0.15η·λ_max(P⁻¹H), Adam');
    const r2 = figSeries(c, x0, y0, x1, y1, [{ ys: curveMean(st.P, 0), color: TRIBES[1].color, w: 1.2 }], { xmax: st.C.len, ymin: 0, ymax: 50 });
    const y38 = r2.ty(38);
    c.setLineDash([3, 2]); c.strokeStyle = 'rgba(36,38,43,0.6)'; c.beginPath(); c.moveTo(x0, y38); c.lineTo(x1, y38); c.stroke(); c.setLineDash([]);
    FIG.note(c, x0 + 6, y38 - 7, '38 = (2 + 2β₁)/(1 − β₁)');
    for (const v of [0, 20, 40]) FIG.tick(c, x0 - 3, r2.ty(v), String(v), 'right', 'middle');
  },
});

// --- temperature: SGD as a Langevin process
function sheetThreeWells(R) {
  sheetBase(R, { bk: 0.35, bk4: 0.03, na: 0.015 });
  const W = [[-0.78, 0.22, -0.62, 0.105], [0.68, 0.3, -0.42, 0.29], [0.02, -0.45, -0.5, 0.165]];
  FEAT.three = W.map(([x, y, a, s]) => { const p = [x + R.range(-0.08, 0.08), y + R.range(-0.08, 0.08)]; addGauss(p[0], p[1], a, s, s * R.range(0.85, 1), R.range(0, 3)); return p; });
  sheetEnd(R, true);
}
function boltzmann() {
  const st = PL.st, C = st.C, nb = st.order.length;
  st.pred = TRIBES.map((T) => {
    const temp = Math.max(1e-6, SIM.lr * T.etaMul * (SIM.noise * T.sigMul) ** 2 / 2), p = new Float64Array(nb + 1);
    for (let j = 0; j < C.H; j++) for (let i = 0; i < C.W; i++) {
      const k = j * C.W + i, b = st.rank[C.lab[k] + 1], v = Math.exp(-(HG[j * C.sub * GW + i * C.sub] - HMIN) / temp);
      p[b >= 0 ? b : nb] += v;
    }
    const s = p.reduce((a, q) => a + q, 0); for (let b = 0; b <= nb; b++) p[b] /= s;
    return p;
  });
}
function fillTemperature() {
  const per = PHONE ? 50 : 110;
  for (let t = 0; t < TRIBES.length; t++) for (let k = 0; k < per; k++) spawn(RPLAN.range(X0 + 0.1, X1 - 0.1), RPLAN.range(Y0 + 0.1, Y1 - 0.1), t);
}
plate({
  id: 'temperature', ch: 1, seed: 1709,
  run: [
    null,
    null,
    null,
    (T) => { T.set('noise', 14); },
  ],
  status: 'established',
  mist: () => { const T = SIM.lr * (SIM.noise ** 2) / 2; return [{ T, color: TRIBES[0].color }, { T: T / 4, color: TRIBES[1].color }]; },
  tribes: [
    { k: 'sgd', name: 'η, B', rule: 'T = ησ²/2', rest: 'never', maxAge: 1e9, inkA: 0.012 },
    { k: 'sgd', name: 'η, 4B', color: '#4b3fa0', sigMul: 0.5, rule: 'T ⁄ 4', rest: 'never', maxAge: 1e9, inkA: 0.012 },
    { k: 'sgd', name: '2η, 2B', color: '#cf6d0c', etaMul: 2, sigMul: Math.SQRT1_2, rule: 'T', rest: 'never', maxAge: 1e9, inkA: 0.012 },
  ],
  sim: { lr: 0.002, noise: 9 },
  ctl: [{ key: 'noise', label: 'Gradient noise σ (for batch B)', min: 2, max: 14, step: 0.1 }],
  view: { yaw: -6, pitch: 52 },
  speed: 4, fade: 0.06,
  sheet: sheetThreeWells,
  features: () => {
    const st = PL.st = { C: catchments(3, true) };
    const C = st.C;
    st.order = FEAT.three.map((p) => labelAt(C, p[0], p[1])).filter((k) => k >= 0);
    st.rank = new Int32Array(C.basins.length + 1).fill(-1); st.order.forEach((k, r) => { st.rank[k + 1] = r; });
    st.mins = FEAT.three.map((p) => critAt(p[0], p[1]));
    st.occ = TRIBES.map(() => new Float64Array(st.order.length + 1));
    boltzmann();
  },
  names: (S) => { PL.st.mins.forEach((m, k) => { if (m) S.marks.push({ p: m, name: 'ABC'[k], sub: `L ${m.L.toFixed(2)} · λ ${m.l2.toFixed(0)}`, sym: 'min', pin: false }); }); },
  print0: () => {
    const { C } = PL.st;
    for (let k = 0; k < C.basins.length; k++) {
      const G = new Float32Array(C.W * C.H); for (let q = 0; q < G.length; q++) G[q] = C.lab[q] === k ? 1 : 0;
      strokeChains(isoChains(G, C.W, C.H, X0, Y0, C.dx, C.dy, 0.5), 'rgba(36,38,43,0.55)', 0.8, [6, 2.2, 1.2, 2.2]);
    }
  },
  setup: () => fillTemperature(),
  release: () => { nextRelease = STAT.steps + 1e9; },
  click: (x, y) => { for (let t = 0; t < TRIBES.length; t++) for (let k = 0; k < 6; k++) spawn(x + RREL.normal() * 0.01, y + RREL.normal() * 0.01, t); },
  lost: (i) => { spawn(RPLAN.range(X0 + 0.1, X1 - 0.1), RPLAN.range(Y0 + 0.1, Y1 - 0.1), Tr[i]); },
  frame: () => {
    const st = PL.st, nb = st.order.length, d = 0.9985;
    for (const o of st.occ) for (let b = 0; b <= nb; b++) o[b] *= d;
    for (let i = 0; i < hiW; i++) { if (!Alive[i]) continue; const b = st.rank[labelAt(st.C, Wx[i], Wy[i]) + 1]; st.occ[Tr[i]][b >= 0 ? b : nb] += 1; }
  },
  onSim: (k) => { if (k === 'noise' || k === 'lr') boltzmann(); },
  readouts: () => TRIBES.map((T) => [`T for ${T.name}`, (SIM.lr * T.etaMul * (SIM.noise * T.sigMul) ** 2 / 2).toFixed(4)]),
  fig: (c, w, h) => {
    const st = PL.st, nb = st.order.length, x0 = 8, y0 = 8, x1 = w - 4, y1 = h - 28;
    const groups = [];
    for (let b = 0; b <= nb; b++) {
      const g = [];
      TRIBES.forEach((T, t) => { const tot = st.occ[t].reduce((a, q) => a + q, 0) || 1; g.push(st.pred[t][b], st.occ[t][b] / tot); });
      groups.push(g);
    }
    const cols = []; const outl = [];
    TRIBES.forEach((T) => { cols.push(T.color, rgba(T.color, 0.8)); outl.push(true, false); });
    figBars(c, x0, y0, x1, y1, groups, ['A', 'B', 'C', 'elsewhere'].slice(0, nb).concat(['elsewhere']).slice(0, nb + 1), cols, { ymax: 1, outline: outl });
    c.strokeStyle = 'rgba(36,38,43,0.4)'; c.beginPath(); c.moveTo(x0, y1 + 0.5); c.lineTo(x1, y1 + 0.5); c.stroke();
  },
});

// --- anisotropic noise
function sheetAniso(R) {
  sheetBase(R, { bk: 0.025, bk4: 0.004, na: 0.015 });
  const ang = R.range(-0.6, 0.6), x = -0.55 + R.range(-0.06, 0.06), y = R.range(-0.1, 0.1);
  BX = x; BY = y;
  SHi = addGauss(x, y, -0.3, 0.1414, 0.0316, ang);
  FLi = addGauss(R.range(0.9, 1.05), R.range(-0.2, 0.2), -0.22, 0.32, 0.28, R.range(0, 3));
  for (let k = 0; k < 5; k++) addGauss(R.range(-1.4, 1.4), (R() < 0.5 ? 1 : -1) * R.range(0.55, 0.85), R.range(-0.1, 0.2), 0.16, 0.11, R.range(0, 3));
  FEAT.aw = [x, y, ang];
  sheetEnd(R, true);
}
function anisoRefill() {
  const st = PL.st, m = st.min; if (!m) return;
  for (let t = 0; t < TRIBES.length; t++) {
    let n = 0; for (let i = 0; i < hiW; i++) if (Alive[i] && Tr[i] === t) n++;
    for (; n < st.per; n++) spawn(m.x + RREL.normal() * 0.003, m.y + RREL.normal() * 0.003, t);
  }
}
function kmCurve(times, alive, tmax, n = 60) {
  const ev = times.map((t) => [t, 1]).concat(alive.map((t) => [t, 0])).sort((a, b) => a[0] - b[0]);
  const out = []; let S = 1, atRisk = ev.length, k = 0;
  for (let s = 0; s <= n; s++) {
    const t = tmax * s / n;
    while (k < ev.length && ev[k][0] <= t) { if (ev[k][1]) S *= 1 - 1 / Math.max(1, atRisk); atRisk--; k++; }
    out.push(S);
  }
  return out;
}
plate({
  id: 'anisotropic', ch: 1, seed: 1801,
  run: [
    null,
    (T) => { T.set('noise', 7); },
    null,
    null,
  ],
  status: 'established',
  tribes: [
    { k: 'sgd', name: 'Isotropic noise', rule: 'ξ ~ N(0, σ²I)', rest: 'never', maxAge: 1e9 },
    { k: 'sgd', name: 'Noise shaped like H', color: '#167a5b', noise: N_HESS, rule: 'ξ ~ N(0, 2σ²|H| ⁄ tr|H|)', rest: 'never', maxAge: 1e9 },
  ],
  sim: { lr: 0.001, noise: 9.5 },
  ctl: [{ key: 'noise', label: 'Gradient noise σ', min: 6, max: 16, step: 0.1 }],
  view: { yaw: -10, pitch: 52, zoom: 0.7, at: () => FEAT.aw },
  speed: 4, fade: 0.06,
  sheet: sheetAniso,
  features: () => {
    const st = PL.st = { esc: TRIBES.map(() => []), per: PHONE ? 16 : 30 };
    st.min = critAt(FEAT.aw[0], FEAT.aw[1]);
    st.basin = critAt(-FEAT.aw[0] + 0.3, 0) || null;
  },
  names: (S) => { const m = PL.st.min; if (m) S.marks.push({ p: m, name: 'Narrow well', sub: `λ ${m.l1.toFixed(0)} and ${m.l2.toFixed(0)}`, sym: 'min', pri: 9 }); },
  setup: () => anisoRefill(),
  onSim: (k) => { if (k === 'noise' || k === 'lr') { PL.st.esc = TRIBES.map(() => []); for (let i = 0; i < hiW; i++) if (Alive[i]) retire(i, false); anisoRefill(); } },
  release: () => { anisoRefill(); nextRelease = STAT.steps + 10; },
  step: (i) => {
    const [x0, y0, a] = FEAT.aw, c = Math.cos(a), s = Math.sin(a), dx = Wx[i] - x0, dy = Wy[i] - y0, u = c * dx + s * dy, v = -s * dx + c * dy;
    if ((u / 0.1414) ** 2 + (v / 0.0316) ** 2 > 9) { const e = PL.st.esc[Tr[i]]; e.push(Age[i]); if (e.length > 400) e.shift(); retire(i, false); return false; }
  },
  readouts: () => TRIBES.map((T, t) => {
    const e = PL.st.esc[t], alive = []; for (let i = 0; i < hiW; i++) if (Alive[i] && Tr[i] === t) alive.push(Age[i]);
    const oldest = Math.max(0, ...alive);
    if (e.length < 8) return [`${T.name}, median escape`, oldest > 0 ? `> ${oldest} steps` : '…'];
    const ts = []; for (let k = 0; k <= 400; k++) ts.push(Math.pow(10, 6.5 * k / 400));
    const S = kmAt(e, alive, ts), k = S.findIndex((v) => v <= 0.5);
    return [`${T.name}, median escape`, k < 0 ? `> ${Math.max(oldest, ...e)} steps` : `${Math.round(ts[k])} steps`];
  }),
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28;
    let tmax = 500; for (const e of st.esc) for (const v of e) tmax = Math.max(tmax, v);
    tmax = niceStep(tmax);
    FIG.axes(c, x0, y0, x1, y1, 'steps', 'still in the well');
    const series = TRIBES.map((T, t) => {
      const alive = []; for (let i = 0; i < hiW; i++) if (Alive[i] && Tr[i] === t) alive.push(Age[i]);
      const ys = kmCurve(st.esc[t], alive, tmax), xs = ys.map((v, k) => k / (ys.length - 1));
      return { xs, ys, color: T.color, w: 1.4 };
    });
    const r = figSeries(c, x0, y0, x1, y1, series, { xmax: 1, ymin: 0, ymax: 1 });
    FIG.tick(c, x1, y1 + 4, String(tmax), 'right'); FIG.tick(c, x0 - 3, r.ty(1), '1', 'right', 'middle'); FIG.tick(c, x0 - 3, r.ty(0), '0', 'right', 'middle');
  },
});

// --- heavy-tailed noise: a narrow deep crater and a wide shallow one, left by many kicks or by one jump
const HT_RA = 0.09, HT_RB = 0.4, HT_DB = 0.22, HT_RIM = Math.SQRT2;
function crater(x, y, c) { const dx = (x - c.x) / c.R, dy = (y - c.y) / c.R, u2 = dx * dx + dy * dy; return u2 > 40 ? 0 : c.D * (u2 - 1) * Math.exp(-u2); }   // rim crest at √2·R
function sheetCraters(R) {
  sheetBase(R, { bk: 0.02, bk4: 0.004, na: 0.014 });
  const A = { x: -0.8 + R.range(-0.05, 0.05), y: R.range(-0.12, 0.12), R: HT_RA, D: SIM.depth };
  const B = { x: 0.62 + R.range(-0.05, 0.05), y: R.range(-0.1, 0.1), R: HT_RB, D: HT_DB };
  FEAT.cr = [A, B];
  EXTRA = (x, y) => {      // the texture is off inside the craters, so their barriers are exactly as designed
    let calm = 0; for (const c of FEAT.cr) { const d = Math.hypot(x - c.x, y - c.y) / (1.6 * c.R); if (d < 1.5) calm = Math.max(calm, 1.2 * (1 - sq5((d - 1) / 0.5))); }
    EXCALM = calm; return crater(x, y, A) + crater(x, y, B);
  };
  for (let k = 0, tries = 0; k < 6 && tries < 200; tries++) {
    const x = R.range(-1.45, 1.45), y = R.range(-0.88, 0.88);
    if (FEAT.cr.some((c) => Math.hypot(x - c.x, y - c.y) < HT_RIM * c.R + 0.3)) continue;
    addGauss(x, y, R.range(-0.08, 0.2), R.range(0.1, 0.17), R.range(0.07, 0.12), R.range(0, 3)); k++;
  }
  sheetEnd(R, true);
}
function htRefill() {
  const st = PL.st;
  for (let t = 0; t < TRIBES.length; t++) for (let c = 0; c < 2; c++) {
    let n = 0; for (let i = 0; i < hiW; i++) if (Alive[i] && Tr[i] === t && Tag[i] === c + 1) n++;
    const C = FEAT.cr[c]; for (; n < st.per; n++) spawn(C.x + RREL.normal() * 0.003, C.y + RREL.normal() * 0.003, t, { tag: c + 1 });
  }
}
function htEscape(i) { const e = PL.st.esc[Tr[i]][Tag[i] - 1]; if (!e) return; e.push(Age[i]); if (e.length > 600) e.shift(); }
// Kaplan–Meier survival at the given times, escapes as events and particles still inside as censored
function kmAt(times, alive, ts) {
  const ev = times.map((t) => [t, 1]).concat(alive.map((t) => [t, 0])).sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const out = []; let S = 1, atRisk = ev.length, k = 0;
  for (const t of ts) { while (k < ev.length && ev[k][0] <= t) { if (ev[k][1]) S *= 1 - 1 / Math.max(1, atRisk); atRisk--; k++; } out.push(S); }
  return out;
}
function htGroup(t, c) {
  const alive = []; let oldest = 0;
  for (let i = 0; i < hiW; i++) if (Alive[i] && Tr[i] === t && Tag[i] === c + 1) { alive.push(Age[i]); oldest = Math.max(oldest, Age[i]); }
  return { esc: PL.st.esc[t][c], alive, oldest };
}
function htMedian(t, c) {
  const g = htGroup(t, c); if (g.esc.length < 8) return g.alive.length && g.oldest > 0 ? `> ${g.oldest} steps` : '…';
  const ts = []; for (let k = 0; k <= 400; k++) ts.push(Math.pow(10, 6.5 * k / 400));
  const S = kmAt(g.esc, g.alive, ts), k = S.findIndex((v) => v <= 0.5);
  return k < 0 ? `> ${Math.max(g.oldest, ...g.esc)} steps` : `${Math.round(ts[k])} steps`;
}
plate({
  id: 'heavytail', ch: 1, seed: 1823,
  run: [
    null,
    null,
    null,
    (T) => { T.set('noise', 12); T.set('tail', 1.5); T.set('depth', Math.abs(SIM.depth - 0.3) < 0.025 ? 1.2 : 0.3); },
  ],
  status: 'contested',
  tribes: [
    { k: 'sgd', name: 'Gaussian noise', rule: 'σξ, ξ ~ N(0, I)', rest: 'never', maxAge: 1e9 },
    { k: 'sgd', name: 'Heavy-tailed noise', color: '#167a5b', noise: N_LEVY, rule: 'σ√A · ξ, ξ ~ N(0, I),  A ~ (α⁄2)-stable', rest: 'never', maxAge: 1e9 },
  ],
  sim: { lr: 0.001, noise: 12, tail: 1.5, depth: 0.75 },
  ctl: [
    { key: 'noise', label: 'Gradient noise σ', min: 8, max: 16, step: 0.1 },
    { key: 'tail', label: 'Tail index α', min: 1.1, max: 2, step: 0.05 },
    { key: 'depth', label: 'Depth of the narrow crater', min: 0.3, max: 1.2, step: 0.05 },
  ],
  view: { yaw: -8, pitch: 50 },
  speed: 4, fade: 0.06, jump: true, jumpMin: 0.16, arcStamp: false,
  sheet: sheetCraters,
  features: () => {
    PL.st = { esc: TRIBES.map(() => [[], []]), per: PHONE ? 10 : 18 };
    for (const c of FEAT.cr) { const L0 = L(c.x, c.y); let mn = Infinity; for (let k = 0; k < 96; k++) { const a = k / 96 * TAU; mn = Math.min(mn, L(c.x + HT_RIM * c.R * Math.cos(a), c.y + HT_RIM * c.R * Math.sin(a))); } c.dL = mn - L0; hess(c.x, c.y); c.lam = eig2()[1]; }
  },
  names: (S) => {
    const [A, B] = FEAT.cr;
    S.marks.push({ p: A, name: 'Narrow crater', sub: `ΔL ${A.dL.toFixed(2)} · rim ${(HT_RIM * A.R).toFixed(2)} away`, sym: 'min', pri: 9 });
    S.marks.push({ p: B, name: 'Wide crater', sub: `ΔL ${B.dL.toFixed(2)} · rim ${(HT_RIM * B.R).toFixed(2)} away`, sym: 'min', pri: 9 });
  },
  print0: () => { for (const c of FEAT.cr) { sc.save(); sc.strokeStyle = 'rgba(36,38,43,0.55)'; sc.lineWidth = 0.8; sc.setLineDash([6, 2.2, 1.2, 2.2]); sc.beginPath(); sc.arc(ox(c.x), oy(c.y), HT_RIM * c.R * OPU, 0, TAU); sc.stroke(); sc.restore(); } },
  setup: () => htRefill(),
  release: () => { htRefill(); nextRelease = STAT.steps + 10; },
  step: (i) => {
    const c = FEAT.cr[Tag[i] - 1]; if (!c) return;
    if (Math.hypot(Wx[i] - c.x, Wy[i] - c.y) > HT_RIM * c.R) { htEscape(i); retire(i, false); return false; }
  },
  lost: (i) => htEscape(i),
  onSim: (k) => {
    if (k === 'depth') reshape(250);
    if (k === 'tail' || k === 'noise') { PL.st.esc = TRIBES.map(() => [[], []]); for (let i = 0; i < hiW; i++) if (Alive[i]) retire(i, false); htRefill(); }   // a new experiment
  },
  readouts: () => [
    ['Gaussian, narrow crater', htMedian(0, 0)], ['Gaussian, wide crater', htMedian(0, 1)],
    [`α = ${SIM.tail.toFixed(2)}, narrow crater`, htMedian(1, 0)], [`α = ${SIM.tail.toFixed(2)}, wide crater`, htMedian(1, 1)],
  ],
  debug: () => {
    const g = (t, c) => { const q = htGroup(t, c); return { n: q.esc.length, alive: q.alive.length, oldest: q.oldest, median: htMedian(t, c) }; };
    return { tail: SIM.tail, depth: SIM.depth, sigma: SIM.noise, dL: FEAT.cr.map((c) => +c.dL.toFixed(3)), lam: FEAT.cr.map((c) => +c.lam.toFixed(1)), gaussNarrow: g(0, 0), gaussWide: g(0, 1), levyNarrow: g(1, 0), levyWide: g(1, 1) };
  },
  fig: (c, w, h) => {
    const x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28, lo = 0.5, hi = 4.5, ts = [], xs = [];
    for (let k = 0; k <= 120; k++) { const v = lo + (hi - lo) * k / 120; xs.push(v); ts.push(Math.pow(10, v)); }
    FIG.axes(c, x0, y0, x1, y1, 'log₁₀ steps', 'still in the crater');
    const series = [];
    TRIBES.forEach((T, t) => { for (let q = 0; q < 2; q++) { const g = htGroup(t, q); if (!g.esc.length && !g.alive.length) continue; series.push({ xs: xs.map((v) => v - lo), ys: kmAt(g.esc, g.alive, ts).map((v, k) => (ts[k] <= Math.max(g.oldest, ...g.esc, 1) ? v : NaN)), color: T.color, w: 1.4, dash: q ? [4, 2.5] : [] }); } });
    const r = figSeries(c, x0, y0, x1, y1, series, { xmax: hi - lo, ymin: 0, ymax: 1 });
    for (let v = 1; v <= 4; v++) FIG.tick(c, r.tx(v - lo), y1 + 4, String(v));
    FIG.tick(c, x0 - 3, r.ty(1), '1', 'right', 'middle'); FIG.tick(c, x0 - 3, r.ty(0), '0', 'right', 'middle');
    FIG.note(c, x0, y1 + 20, 'solid: narrow · dashed: wide', 'rgba(36,38,43,0.7)', 'left');
  },
});

// --- implicit gradient regularization, on the loss of a two-parameter linear network
const HYP = { s: 1.5 };
function sheetHyperbola(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0 });
  const s = HYP.s;
  EXTRA = (x, y) => { const r = s * x * s * y - 1; return 0.5 * r * r; };
  sheetEnd(R);
}
const hypC = (x, y) => HYP.s * HYP.s * (x * x - y * y);                // w² − a² in network units (w = 1.5θ₁, a = 1.5θ₂): conserved by gradient flow
const hypEnd = (c) => { const w2 = (c + Math.sqrt(c * c + 4 / HYP.s ** 4)) / 2, x = Math.sqrt(w2); return [x, 1 / (HYP.s * HYP.s * x)]; };   // where the flow meets the floor
function hypFloorPts(sign) { const pts = []; for (let x = 0.29; x <= 1.6; x += 0.01) { const y = 1 / (HYP.s * HYP.s * x); if (y <= 1) pts.push(sign * x, sign * y); } return pts; }
function hypPrint() {
  const c = sc;
  c.save(); c.strokeStyle = 'rgba(36,38,43,0.28)'; c.lineWidth = 0.55; c.setLineDash([1.2, 2.8]);
  for (const cc of [-0.9, -0.5, -0.2, 0.2, 0.5, 0.9, 1.4]) {
    for (const sg of [1, -1]) {
      c.beginPath(); let on = false;
      for (let t = -1.2; t <= 1.2; t += 0.01) {
        const x = cc >= 0 ? sg * Math.sqrt(cc) * Math.cosh(t) : Math.sqrt(-cc) * Math.sinh(t), y = cc >= 0 ? Math.sqrt(cc) * Math.sinh(t) : sg * Math.sqrt(-cc) * Math.cosh(t);
        if (x < X0 || x > X1 || y < Y0 || y > Y1) { on = false; continue; }
        if (on) c.lineTo(ox(x), oy(y)); else c.moveTo(ox(x), oy(y)); on = true;
      }
      c.stroke();
    }
  }
  c.restore();
  for (const sg of [1, -1]) { const p = hypFloorPts(sg); c.strokeStyle = 'rgba(44,104,148,0.85)'; c.lineWidth = 1.4; c.beginPath(); for (let k = 0; k < p.length; k += 2) { if (k) c.lineTo(ox(p[k]), oy(p[k + 1])); else c.moveTo(ox(p[k]), oy(p[k + 1])); } c.stroke(); }
}
const IGR_STARTS = [[0.18, 0.92], [1.45, 0.12], [-0.35, 0.95], [1.5, -0.25], [-0.15, -0.9], [-1.45, -0.1], [0.55, -0.85], [-1.2, 0.6]];
plate({
  id: 'igr', ch: 1, seed: 1907,
  run: [
    (T) => { T.set('lr', 0.42); },
    null,
    (T) => { T.set('lr', 0.2); },
    (T) => { T.set('lr', 0.55); },
  ],
  status: 'established',
  tribes: [{ k: 'gd', color: '#c22a40' }],
  sim: { lr: 0.42, noise: 0 },
  ctl: [{ key: 'lr', label: 'Learning rate η', min: 0.05, max: 0.55, step: 0.01, f: (v) => v.toFixed(2) }],
  view: { yaw: -4, pitch: 52 },
  sheet: sheetHyperbola,
  features: () => { PL.st = { k: 0, paths: [], rec: [] }; },
  names: (S) => {
    S.paths.push({ text: 'Valley of Equivalent Solutions', pts: hypFloorPts(1).slice(10, 110), size: 12, offset: 0.05 });
    const b = 1 / HYP.s; S.marks.push({ p: { x: b, y: b }, name: 'Balanced point', sub: 'w = a = 1 · flattest', sym: 'min', pri: 8 });
  },
  print0: hypPrint,
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 4) { nextRelease = STAT.steps + 45; return; }
    const p = IGR_STARTS[st.k++ % IGR_STARTS.length];
    const gf = flowPath(p[0], p[1], 0.004, 20000), mf = flowPath(p[0], p[1], 0.004, 20000, -1, SIM.lr);
    const cg = hypC(gf[gf.length - 2], gf[gf.length - 1]), cm = hypC(mf[mf.length - 2], mf[mf.length - 1]);
    st.paths.push({ gf, mf, p }); if (st.paths.length > 5) st.paths.shift();
    stamp(p[0], p[1], 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
    stamp(gf[gf.length - 2], gf[gf.length - 1], 0.009, 0, 0.14, 0.15, 0.17, 0.9, 0.0022);
    stamp(mf[mf.length - 2], mf[mf.length - 1], 0.009, 0, 0.09, 0.48, 0.36, 0.9, 0.0022);
    const i = spawn(p[0], p[1], 0); if (i >= 0) { Ax[i] = cg; Ay[i] = cm; }
    STAT.released++; linesDirty = true;
    nextRelease = STAT.steps + Math.round(4 * 45);
  },
  lines: () => {
    for (const P of PL.st.paths) {
      const a = [], b = [];
      for (let k = 0; k < P.gf.length; k += 8) a.push(P.gf[k], P.gf[k + 1], 0.002);
      for (let k = 0; k < P.mf.length; k += 8) b.push(P.mf[k], P.mf[k + 1], 0.002);
      line(a, INK, 1.1, 0, true, 0.7); line(b, '#167a5b', 1.2, 0.02, true, 0.85);
    }
  },
  retire: (i, ring) => { if (!ring) return; const st = PL.st; st.rec.push([Ax[i], Ay[i], hypC(Ex[i], Ey[i])]); if (st.rec.length > 200) st.rec.shift(); },
  readouts: () => {
    const r = PL.st.rec[PL.st.rec.length - 1];
    return r ? [['w² − a², gradient flow', fmt(r[0], 3)], ['flow of L̃', fmt(r[1], 3)], ['gradient descent', fmt(r[2], 3)]] : [['η', SIM.lr.toFixed(2)]];
  },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28, lo = -2.2, hi = 5.2;
    FIG.axes(c, x0, y0, x1, y1, 'predicted w² − a²', 'gradient descent');
    const tx = (v) => x0 + (x1 - x0) * (v - lo) / (hi - lo), ty = (v) => y1 - (y1 - y0) * (v - lo) / (hi - lo);
    c.strokeStyle = 'rgba(36,38,43,0.3)'; c.beginPath(); c.moveTo(tx(lo), ty(lo)); c.lineTo(tx(hi), ty(hi)); c.stroke();
    for (const v of [-2, 0, 2, 4]) { FIG.tick(c, tx(v), y1 + 4, String(v)); FIG.tick(c, x0 - 3, ty(v), String(v), 'right', 'middle'); }
    for (const r of st.rec) {
      c.strokeStyle = 'rgba(36,38,43,0.8)'; c.lineWidth = 1; c.beginPath(); c.arc(tx(r[0]), ty(r[2]), 2.6, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(22,122,91,0.85)'; c.beginPath(); c.arc(tx(r[1]), ty(r[2]), 2.2, 0, TAU); c.fill();
    }
  },
});
// ch3>>

// <<ch4
// ---------------------------------------------------------------------------------------------
// IV · Itineraries: schedules, paths between solutions, symmetries
// ---------------------------------------------------------------------------------------------
// --- saddle to saddle: the exact loss of a balanced two-layer diagonal linear network, w_i = θ_i², with two
// target strengths. Each coordinate grows geometrically from a small start; the stronger one goes first.
const S2S = { s1: 1.69, s2: 0.49 };
function sheetModes(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0 });
  S2S.s1 = R.range(1.6, 1.8); S2S.s2 = R.range(0.42, 0.52);
  EXTRA = (x, y) => { const a = S2S.s1 - x * x, b = S2S.s2 - y * y; return 0.5 * (a * a + b * b); };
  sheetEnd(R, true);
}
const s2sPred = (s, d) => (d * d >= s / 2 ? 0 : Math.log(s / (d * d) - 1) / (2 * Math.log(1 + 2 * SIM.lr * s)));   // steps until θ² reaches s/2: the logistic solution of the flow at gradient descent’s growth rate per step
plate({
  id: 'staircase', ch: 3, seed: 2027,
  run: [
    (T) => { T.clear(); T.set('delta', Math.max(1e-7, +(SIM.delta / 10).toPrecision(6))); const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
    (T) => { T.clear(); T.set('delta', 1e-7); const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
    (T) => { T.clear(); T.set('delta', 0.3); const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
  ],
  status: 'established',
  tribes: [{ k: 'gd', color: '#c22a40', rest: 'never', maxAge: 2000 }],
  sim: { lr: 0.02, noise: 0, delta: 1e-4 },
  ctl: [{ key: 'delta', label: 'Initialization δ', min: 1e-7, max: 0.5, scale: 'log', f: (v) => v.toExponential(0) }],
  view: { yaw: -6, pitch: 50 },
  speed: 2,
  sheet: sheetModes,
  features: () => { PL.st = { C: curveInit(1, 2000), k: 0, t1: [], t2: [] }; },
  names: (S) => {
    const a = Math.sqrt(S2S.s1), b = Math.sqrt(S2S.s2);
    S.marks.push({ p: { x: 0, y: 0 }, name: 'Origin', sub: `L − L* ${(0.5 * (S2S.s1 ** 2 + S2S.s2 ** 2)).toFixed(2)} · nothing learned`, sym: 'peak', pri: 9 });
    S.marks.push({ p: { x: a, y: 0 }, name: 'Saddle', sub: `L − L* ${(0.5 * S2S.s2 ** 2).toFixed(3)} · strong mode learned`, sym: 'pass', pri: 8 });
    S.marks.push({ p: { x: -a, y: 0 }, name: '', sub: `${(0.5 * S2S.s2 ** 2).toFixed(3)}`, sym: 'pass', pin: false });
    S.marks.push({ p: { x: 0, y: b }, name: '', sub: `${(0.5 * S2S.s1 ** 2).toFixed(2)} · weak mode only`, sym: 'pass', pin: false });
    S.marks.push({ p: { x: 0, y: -b }, name: '', sub: `${(0.5 * S2S.s1 ** 2).toFixed(2)}`, sym: 'pass', pin: false });
    S.marks.push({ p: { x: a, y: b }, name: 'Minimum', sub: 'both modes learned', sym: 'min', pri: 7 });
    for (const [x, y] of [[-a, b], [a, -b], [-a, -b]]) S.marks.push({ p: { x, y }, name: '', sub: '0', sym: 'min', pin: false });
  },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 20) { nextRelease = STAT.steps + 45; return; }
    curveReset(st.C);
    const d = SIM.delta;
    stamp(0, 0, 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
    for (let k = 0; k < (PHONE ? 6 : 10); k++) {
      const sx = RREL() < 0.5 ? -1 : 1, sy = RREL() < 0.5 ? -1 : 1;
      const i = spawn(sx * d * (1 + 0.1 * RREL.normal()), sy * d * (1 + 0.1 * RREL.normal()), 0);
      if (i >= 0) { An[i] = st.C.cid; Ax[i] = 0; Ay[i] = 0; }
    }
    STAT.released++;
    nextRelease = STAT.steps + Math.round(Math.min(1900, s2sPred(S2S.s2, d) * 1.35 + 120));
  },
  click: (x, y) => { const i = spawn(x, y, 0); if (i >= 0) { Ax[i] = 0; Ay[i] = 0; An[i] = 0; } },
  step: (i) => {
    const st = PL.st;
    if (An[i] === st.C.cid) {
      curveAdd(st.C, 0, Age[i], Wl[i]);
      if (!Ax[i] && Wx[i] * Wx[i] > S2S.s1 / 2) { Ax[i] = Age[i]; st.t1.push(Age[i]); if (st.t1.length > 60) st.t1.shift(); }
      if (!Ay[i] && Wy[i] * Wy[i] > S2S.s2 / 2) { Ay[i] = Age[i]; st.t2.push(Age[i]); if (st.t2.length > 60) st.t2.shift(); }
    }
  },
  onSim: (k) => { if (k === 'delta') { PL.st.t1 = []; PL.st.t2 = []; nextRelease = STAT.steps + 20; } },
  readouts: () => {
    const st = PL.st, m = (a) => (a.length ? Math.round(a.reduce((p, q) => p + q, 0) / a.length) : '…');
    return [['δ', SIM.delta.toExponential(0)], ['strong mode at', `${st.t1.length ? m(st.t1) + ' steps' : '…'} (predicted ${Math.round(s2sPred(S2S.s1, SIM.delta))})`], ['weak mode at', `${st.t2.length ? m(st.t2) + ' steps' : '…'} (predicted ${Math.round(s2sPred(S2S.s2, SIM.delta))})`]];
  },
  debug: () => ({ t1: PL.st.t1.slice(-3), t2: PL.st.t2.slice(-3), p1: s2sPred(S2S.s1, SIM.delta), p2: s2sPred(S2S.s2, SIM.delta) }),
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28;
    const t2 = s2sPred(S2S.s2, SIM.delta), xmax = Math.max(200, Math.min(st.C.len, Math.round(t2 * 1.5 + 60)));
    FIG.axes(c, x0, y0, x1, y1, 'steps', 'L');
    const ys = curveMean(st.C, 0).slice(0, xmax + 1);
    const top = 0.5 * (S2S.s1 ** 2 + S2S.s2 ** 2), mid = 0.5 * S2S.s2 ** 2;
    const r = figSeries(c, x0, y0, x1, y1, [{ ys, color: TRIBES[0].color, w: 1.5 }], { xmax, ymin: 0, ymax: top * 1.05 + 0.03 });
    c.setLineDash([2, 2]); c.strokeStyle = 'rgba(36,38,43,0.45)'; c.lineWidth = 0.8;
    for (const v of [top, mid]) { const Y = r.ty(v + 0.03); c.beginPath(); c.moveTo(x0, Y); c.lineTo(x1, Y); c.stroke(); }
    for (const t of [s2sPred(S2S.s1, SIM.delta), t2]) { const X = x0 + (x1 - x0) * t / xmax; c.beginPath(); c.moveTo(X, y0); c.lineTo(X, y1); c.stroke(); }
    c.setLineDash([]);
    FIG.note(c, x0 + 4, r.ty(top + 0.03) - 7, '½(s₁² + s₂²)'); FIG.note(c, x1 - 2, r.ty(mid + 0.03) - 7, '½s₂²', INK, 'right');
    FIG.tick(c, x1, y1 + 4, String(xmax), 'right');
  },
});

// --- warmup: a gorge whose curvature across falls a hundredfold downstream
function sheetGorge(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0.03 });
  const g = FEAT.gorge = { l0: 600, k: Math.log(100) / 2.65, a: 0.6, Hc: 1.0, cy: R.range(-0.08, 0.08), x0: -1.35 };
  EXTRA = (x, y) => {
    const lam = g.l0 * Math.exp(-g.k * (x - g.x0)), v = y - g.cy, s = lam * v * v / (2 * g.Hc);
    EXCALM = s < 30 ? Math.exp(-s) : 0;
    let z = -g.a * x + g.Hc * (1 - Math.exp(-s)) + 0.1 * v * v;
    if (x > 1.35) z += 6 * (x - 1.35) * (x - 1.35);
    if (x < -1.45) z += 6 * (x + 1.45) * (x + 1.45);
    return z;
  };
  for (let k = 0; k < 6; k++) { const x = R.range(-1.3, 1.3), y = g.cy + (R() < 0.5 ? 1 : -1) * R.range(0.5, 0.8); addGauss(x, y, R.range(-0.1, 0.25), R.range(0.12, 0.2), R.range(0.08, 0.12), R.range(0, 3)); }
  sheetEnd(R, true);
}
const gorgeLam = (x) => { const g = FEAT.gorge; return g.l0 * Math.exp(-g.k * (x - g.x0)) + 0.2; };
plate({
  id: 'warmup', ch: 3, seed: 2003,
  run: [
    (T) => { T.clear(); T.set('lr', 0.02); PL.onSim('lr', SIM.lr); const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
    null,
    null,
    (T) => { T.clear(); T.set('lr', 0.04); PL.onSim('lr', SIM.lr); const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
  ],
  status: 'contested',
  tribes: [
    { k: 'sgd', name: 'No warmup', rule: 'η(t) = η', maxAge: 1800, rest: 'never' },
    { k: 'sgd', name: 'Warmup, 100 steps', color: '#cf6d0c', sched: { kind: 'const', warm: 100, T: 1e9 }, rule: 'η(t) = η · min(1, (t+1)/100)', maxAge: 1800, rest: 'never' },
    { k: 'sgd', name: 'Warmup, 700 steps', color: '#23708f', sched: { kind: 'const', warm: 700, T: 1e9 }, rule: 'η(t) = η · min(1, (t+1)/700)', maxAge: 1800, rest: 'never' },
  ],
  sim: { lr: 0.02, noise: 0.01 },
  ctl: [{ key: 'lr', label: 'Target learning rate η', min: 0.005, max: 0.04, scale: 'log', f: (v) => v.toFixed(4) }],
  view: { yaw: 10, pitch: 40 },
  speed: 2, jump: true,
  sheet: sheetGorge,
  features: () => { PL.st = { C: curveInit(3, 1800), k: 0, div: [0, 0, 0], runs: [0, 0, 0], peak: [0, 0, 0] }; },
  onSim: (k) => { if (k === 'lr') { const st = PL.st; st.div = [0, 0, 0]; st.runs = [0, 0, 0]; st.peak = [0, 0, 0]; for (let i = 0; i < hiW; i++) if (Alive[i]) retire(i, false); nextRelease = STAT.steps + 20; } },
  names: (S) => {
    const g = FEAT.gorge;
    S.paths.push({ text: 'The Gorge', pts: [-1.25, g.cy, -0.55, g.cy], size: 12, offset: 0.1 });
    for (const lam of [300, 100, 30, 10]) { const x = g.x0 + Math.log(g.l0 / (lam - 0.2)) / g.k; if (x > X0 + 0.05 && x < X1 - 0.05) S.marks.push({ p: { x, y: g.cy - 0.09 }, name: '', sub: `λ ${lam}`, sym: 'none', pin: false }); }
  },
  print: () => {
    const g = FEAT.gorge, c = sc; c.strokeStyle = 'rgba(36,38,43,0.75)'; c.lineWidth = 0.9; c.beginPath();
    for (const lam of [500, 300, 200, 100, 50, 30, 20, 10]) { const x = g.x0 + Math.log(g.l0 / lam) / g.k; if (x < X0 || x > X1) continue; const w = Math.sqrt(2 * g.Hc / lam) * 0.6; c.moveTo(ox(x), oy(g.cy - w)); c.lineTo(ox(x), oy(g.cy + w)); }
    c.stroke();
  },
  release: () => {
    const st = PL.st, g = FEAT.gorge;
    if (!F.params.auto || STAT.alive > maxAlive - 30) { nextRelease = STAT.steps + 45; return; }
    curveReset(st.C); st.peak = [0, 0, 0];
    const p = [-1.25, g.cy];
    stamp(p[0], p[1], 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
    for (let t = 0; t < 3; t++) { st.runs[t] += 6; for (let k = 0; k < 6; k++) { const i = spawn(p[0] + RREL.normal() * 0.004, p[1] + RREL.normal() * 0.002, t); if (i >= 0) { An[i] = st.C.cid; Ax[i] = 0; } } }
    STAT.released++;
    nextRelease = STAT.steps + 1900;
  },
  step: (i) => {
    const st = PL.st, T = TRIBES[Tr[i]], g = FEAT.gorge;
    const e = SIM.lr * (T.sched ? sched(T.sched, Age[i]) : 1) * gorgeLam(clamp(Wx[i], X0, X1));
    if (An[i] === st.C.cid) { curveAdd(st.C, Tr[i], Age[i], Math.log10(Math.max(1e-3, e))); if (!Ax[i] && e > st.peak[Tr[i]]) st.peak[Tr[i]] = e; }
    if (!Ax[i] && Math.abs(Wy[i] - g.cy) > 0.1 && Wx[i] < 0.6) { Ax[i] = 1; st.div[Tr[i]]++; }
  },
  lost: (i) => { const st = PL.st; if (!Ax[i]) { Ax[i] = 1; st.div[Tr[i]]++; } },
  readouts: () => { const st = PL.st; return TRIBES.map((T, t) => [T.name, st.runs[t] ? `peak ηλ ${st.peak[t].toFixed(1)} · thrown ${Math.round(100 * st.div[t] / st.runs[t])}%` : '…']); },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28;
    FIG.axes(c, x0, y0, x1, y1, 'steps', 'log₁₀ ηλ');
    const r = figSeries(c, x0, y0, x1, y1, TRIBES.map((T, t) => ({ ys: curveMean(st.C, t), color: T.color, w: 1.4 })), { xmax: 1100, ymin: -2, ymax: 1.3 });
    const yl = r.ty(Math.log10(2));
    c.setLineDash([3, 2]); c.strokeStyle = 'rgba(36,38,43,0.6)'; c.beginPath(); c.moveTo(x0, yl); c.lineTo(x1, yl); c.stroke(); c.setLineDash([]);
    FIG.note(c, x1 - 4, yl - 7, 'ηλ = 2', INK, 'right');
    for (const v of [-2, -1, 0, 1]) FIG.tick(c, x0 - 3, r.ty(v), String(v), 'right', 'middle');
  },
});

// --- the river valley and learning-rate schedules
function sheetRiver(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0.03 });
  const r = FEAT.river = { cy: R.range(-0.1, 0.1), A1: R.range(0.18, 0.26), w1: R.range(1.5, 1.9), p1: R.range(0, TAU), A2: R.range(0.05, 0.08), w2: R.range(3, 3.6), p2: R.range(0, TAU), lam: 140, Hc: 0.9, a: 0.08 };
  EXTRA = (x, y) => {
    const c = r.cy + r.A1 * Math.sin(r.w1 * x + r.p1) + r.A2 * Math.sin(r.w2 * x + r.p2), dc = r.A1 * r.w1 * Math.cos(r.w1 * x + r.p1) + r.A2 * r.w2 * Math.cos(r.w2 * x + r.p2);
    const v = (y - c) / Math.sqrt(1 + dc * dc), s = r.lam * v * v / (2 * r.Hc);
    EXCALM = s < 2 ? 1 / 0.88 : s < 30 ? Math.exp(2 - s) / 0.88 : 0;      // the valley carries no texture up to the height of the bounce
    let z = -r.a * x + r.Hc * s / (1 + s) + 0.05 * v * v;
    if (x > 1.42) z += 6 * (x - 1.42) * (x - 1.42);
    if (x < -1.5) z += 6 * (x + 1.5) * (x + 1.5);
    return z;
  };
  for (let k = 0; k < 8; k++) { const x = R.range(-1.4, 1.4), side = R() < 0.5 ? 1 : -1, c = r.cy + r.A1 * Math.sin(r.w1 * x + r.p1); addGauss(x, c + side * R.range(0.45, 0.8), R.range(0.08, 0.3), R.range(0.12, 0.2), R.range(0.08, 0.13), R.range(0, 3)); }
  sheetEnd(R, true);
}
const riverY = (x) => { const r = FEAT.river; return r.cy + r.A1 * Math.sin(r.w1 * x + r.p1) + r.A2 * Math.sin(r.w2 * x + r.p2); };
const RIVER_T = 1800;
// a batch-size ramp: η stays constant and the batch doubles at 80, 85, 90 and 95% of the run, so the noise variance halves each time
const riverBatch = (age) => (age < 0.8 * RIVER_T ? 1 : 2 ** Math.min(4, 1 + Math.floor((age - 0.8 * RIVER_T) / (0.05 * RIVER_T))));
function riverBatchNoise(i, x, y, s, R, o) {      // the Hessian-shaped noise of N_HESS, divided by √batch
  s /= Math.sqrt(riverBatch(Age[i]));
  hess(x, y);
  const tr = hXX + hYY, det = hXX * hYY - hXY * hXY, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = Math.abs(tr / 2 + disc), l2 = Math.abs(tr / 2 - disc), sum = l1 + l2 + 1e-12;
  let vx = hXY, vy = tr / 2 + disc - hXX; const vl = Math.hypot(vx, vy); if (vl < 1e-12) { vx = 1; vy = 0; } else { vx /= vl; vy /= vl; }
  const a1 = s * Math.sqrt(2 * l1 / sum) * R.normal(), a2 = s * Math.sqrt(2 * l2 / sum) * R.normal();
  o[0] = a1 * vx - a2 * vy; o[1] = a1 * vy + a2 * vx;
}
plate({
  id: 'river', ch: 3, seed: 2111,
  run: [
    (T) => { T.clear(); if (SIM.noise !== 1.4) { T.set('noise', 1.4); PL.st.fin = TRIBES.map(() => []); } const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
    null,
    null,
    (T) => { T.clear(); if (SIM.noise !== 0) { T.set('noise', 0); PL.st.fin = TRIBES.map(() => []); } const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
  ],
  status: 'open',
  tribes: [
    { k: 'sgd', name: 'Constant', rule: 'η(t) = η', maxAge: RIVER_T, rest: 'never', noise: N_HESS },
    { k: 'sgd', name: 'Cosine', color: '#23708f', sched: { kind: 'cos', T: RIVER_T, floor: 0.02 }, rule: 'η(t) = η(f + (1−f)·½(1 + cos πt/T)), f = 0.02', maxAge: RIVER_T, rest: 'never', noise: N_HESS },
    { k: 'sgd', name: 'Warmup–stable–decay', color: '#cf6d0c', sched: { kind: 'wsd', T: RIVER_T, decay: 0.2, floor: 0.02, warm: 40 }, rule: '40-step warmup, η, then linear decay to 0.02η over the last 20%', maxAge: RIVER_T, rest: 'never', noise: N_HESS },
    { k: 'sf', name: 'Schedule-free', etaMul: 10, sfBeta: 0.9, sched: { kind: 'const', warm: 100, T: 1e9 }, rule: 'γ = 10η after warmup, β = 0.9, no decay', maxAge: RIVER_T, rest: 'never', noise: N_HESS },
    { k: 'sgd', name: 'Batch ramp', color: '#4b3fa0', rule: 'η constant; batch ×2 at 80, 85, 90 and 95%', maxAge: RIVER_T, rest: 'never', noise: N_FN, noiseFn: riverBatchNoise },
  ],
  sim: { lr: 0.0125, noise: 1.4 },
  ctl: ['noise'],
  view: { yaw: -12, pitch: 44 },
  speed: 3, fade: 0.05,
  sheet: sheetRiver,
  features: () => { PL.st = { C: curveInit(TRIBES.length, RIVER_T), fin: TRIBES.map(() => []) }; },
  names: (S) => {
    const pts = []; for (let x = -0.9; x <= 0.2; x += 0.02) pts.push(x, riverY(x));
    S.paths.push({ text: 'River of Low Loss', pts, size: 12, offset: 0.09 });
  },
  print: () => {
    const c = sc; c.save(); c.strokeStyle = 'rgba(44,104,148,0.9)'; c.lineWidth = 1.5; c.beginPath();
    for (let x = X0 + 0.02; x <= 1.42; x += 0.005) { const y = riverY(x); if (x === X0 + 0.02) c.moveTo(ox(x), oy(y)); else c.lineTo(ox(x), oy(y)); }
    c.stroke(); c.restore();
  },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 60) { nextRelease = STAT.steps + 45; return; }
    curveReset(st.C);
    const p = [-1.35, riverY(-1.35)];
    stamp(p[0], p[1], 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
    for (let t = 0; t < TRIBES.length; t++) for (let k = 0; k < (PHONE ? 6 : 12); k++) { const i = spawn(p[0] + RREL.normal() * 0.004, p[1] + RREL.normal() * 0.004, t); if (i >= 0) Tag[i] = st.C.cid; }
    STAT.released++;
    nextRelease = STAT.steps + RIVER_T + 120;
  },
  step: (i) => { const st = PL.st; if (Tag[i] === st.C.cid) curveAdd(st.C, Tr[i], Age[i], Wl[i]); },
  retire: (i) => { const st = PL.st; if (Tag[i] === st.C.cid) { const f = st.fin[Tr[i]]; f.push(Wl[i]); if (f.length > 64) f.shift(); } },
  debug: () => TRIBES.map((T, t) => { const f = PL.st.fin[t]; if (f.length) return [T.name.slice(0, 5), 'fin', f.length, +(f.reduce((p, q) => p + q, 0) / f.length).toFixed(4)]; const a = []; for (let i = 0; i < hiW; i++) if (Alive[i] && Tr[i] === t) a.push(i); if (!a.length) return null; const m = (f) => +(a.reduce((p, i) => p + f(i), 0) / a.length).toFixed(3); return [T.name.slice(0, 4), Age[a[0]], m((i) => Wx[i]), T.kind === K_SF ? m((i) => Ax[i]) : null, m((i) => Wl[i])]; }),
  readouts: () => { const st = PL.st, m = (a) => (a.length ? (a.reduce((p, q) => p + q, 0) / a.length).toFixed(3) : '…'); return TRIBES.map((T, t) => [`${T.name}, final L`, m(st.fin[t])]).concat([['Batch ramp, samples', '2.3 × the others']]); },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28;
    FIG.axes(c, x0, y0, x1, y1, 'steps', 'L');
    const ser = TRIBES.map((T, t) => ({ ys: curveMean(st.C, t), color: T.color, w: 1.4 }));
    let lo = Infinity, hi = -Infinity; for (const s of ser) for (const v of s.ys) if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    if (!(hi > lo)) { lo = 0; hi = 1; }
    const r = figSeries(c, x0, y0, x1, y1, ser, { xmax: RIVER_T, ymin: lo - 0.02, ymax: hi + 0.02 });
    FIG.tick(c, x0 - 3, r.ty(hi), hi.toFixed(2), 'right', 'middle'); FIG.tick(c, x0 - 3, r.ty(lo), lo.toFixed(2), 'right', 'middle');
    const xd = x0 + (x1 - x0) * 0.8; c.setLineDash([2, 2]); c.strokeStyle = 'rgba(207,109,12,0.5)'; c.beginPath(); c.moveTo(xd, y0); c.lineTo(xd, y1); c.stroke(); c.setLineDash([]);
  },
});

// --- mode connectivity: train a Bézier curve between two minima
function sheetConnected(R) {
  sheetBase(R, { bk: 0.15, bk4: 0.02, na: 0.03 });
  const ay = R.range(-0.25, -0.1), ax = R.range(0.8, 0.9);
  FEAT.ma = [-ax, ay]; FEAT.mb = [ax, ay + R.range(-0.05, 0.05)];
  const ia = addGauss(-ax, ay, -0.62, 0.22, 0.2, R.range(0, 3));
  const ib = addGauss(ax, FEAT.mb[1], -0.6, 0.22, 0.2, R.range(0, 3));
  addGauss(R.range(-0.05, 0.05), ay, 0.55, 0.26, 0.2, R.range(-0.15, 0.15));
  const apex = R.range(0.26, 0.32), cy0 = (ax * ax + ay * ay - apex * apex) / (2 * (ay - apex)), Rr = apex - cy0;
  RVcx = 0; RVcy = cy0; RVR = Rr; RVmx = 0; RVmy = 1; RVhalf = Math.atan2(ax, ay - cy0) * 1.32; RVsgn = 1;
  RVw = 0.1; RViw2 = 1 / (2 * RVw * RVw); RVd0 = 0.5; RVd1 = 0; RVon = true;
  // the trench runs on through both wells and is faded out inside them (rvM is set by ravine() earlier in the same
  // Lraw call), so it joins each well without the deeper pit that well + trench used to make next to A and B
  const wg = (i, x, y) => { const ex = x - FX[i], ey = y - FY[i]; return Math.exp(-0.5 * (FA[i] * ex * ex + 2 * FB[i] * ex * ey + FC[i] * ey * ey)); };
  EXTRA = (x, y) => (rvM > 0 ? RVd0 * rvM * Math.min(1, wg(ia, x, y) + wg(ib, x, y)) : 0);
  addGauss(R.range(-1.35, -1.1), R.range(0.55, 0.8), R.range(0.2, 0.3), 0.2, 0.14, R.range(0, 3));
  addGauss(R.range(1.1, 1.35), R.range(0.55, 0.8), R.range(0.2, 0.3), 0.2, 0.14, R.range(0, 3));
  addGauss(R.range(-0.4, 0.4), R.range(-0.85, -0.7), R.range(-0.15, 0.2), 0.3, 0.12, R.range(-0.2, 0.2));
  sheetEnd(R);
}
const bez = (A, C, B, t, o) => { const u = 1 - t; o[0] = u * u * A.x + 2 * t * u * C[0] + t * t * B.x; o[1] = u * u * A.y + 2 * t * u * C[1] + t * t * B.y; return o; };
// the minimum a point drains to: a short descent, then Newton's method
function minNear(x, y) {
  for (let k = 0; k < 4000; k++) { grad(x, y); const g = Math.hypot(gX, gY); if (g < 1e-4) break; const s = Math.min(0.004, 0.02 * g) / g; x -= s * gX; y -= s * gY; }
  const c = critAt(x, y); if (c && c.type === 'min') return c;
  hess(x, y); const e = eig2(); return { x, y, L: L(x, y), l1: e[0], l2: e[1], type: 'min' };
}
function connectReset() { const st = PL.st; st.C = [(st.A.x + st.B.x) / 2, (st.A.y + st.B.y) / 2]; st.it = 0; st.hold = 0; st.calm = 0; st.e1 = st.e2 = 0; }
function barrierOf(fn) { let mx = -Infinity; const P = [0, 0]; for (let k = 0; k <= 100; k++) { fn(k / 100, P); mx = Math.max(mx, L(P[0], P[1])); } return mx; }
plate({
  id: 'connect', ch: 4, seed: 2203,
  run: [
    (T) => { PL.ctl.find((c) => c.type === 'button').buttons[0][1](); },
    null,
    null,
  ],
  status: 'established',
  tribes: [{ k: 'sgd', color: '#c22a40' }],
  sim: { lr: 0.004, noise: 0.3 },
  ctl: ['noise', { type: 'button', buttons: [['Start the curve again', () => { connectReset(); linesDirty = true; }]] }],
  view: { yaw: -4, pitch: 50 },
  sheet: sheetConnected,
  features: () => {
    const st = PL.st = { mli: [], mono: 0, runs: 0 };
    st.A = minNear(FEAT.ma[0], FEAT.ma[1]); st.B = minNear(FEAT.mb[0], FEAT.mb[1]);
    if (st.A && st.B) connectReset();
  },
  // monotonic linear interpolation: the line from each particle's start to its resting point
  step: (i) => { if (Age[i] === 1) { Sx[i] = Px[i]; Sy[i] = Py[i]; } },
  retire: (i, ring) => {
    if (!ring) return;
    const st = PL.st, x0 = Sx[i], y0 = Sy[i], x1 = Ex[i], y1 = Ey[i], prof = [];
    let rise = 0, prev = Infinity;
    for (let k = 0; k <= 60; k++) { const t = k / 60, v = L(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t); prof.push(v); if (v > prev) rise = Math.max(rise, v - prev); prev = Math.min(prev, v); }
    const mono = rise < 2e-3, key = `${Math.round(x0 * 40)},${Math.round(y0 * 40)},${Math.round(x1 * 10)},${Math.round(y1 * 10)}`;
    if (st.mli.some((m) => m.key === key)) return;          // one line per distinct run, not per particle
    st.runs++; if (mono) st.mono++; else { const tr = Math.abs(Math.hypot(x0 - RVcx, y0 - RVcy) - RVR) < 0.12; st.fails = st.fails || { trench: 0, other: 0 }; st.fails[tr ? 'trench' : 'other']++; }
    st.mli.push({ x0, y0, x1, y1, mono, prof, rise, key }); if (st.mli.length > 14) st.mli.shift();
    linesDirty = true;
  },
  names: (S) => {
    const { A, B } = PL.st; if (!A || !B) return;
    S.marks.push({ p: A, name: 'Minimum A', sub: `L ${A.L.toFixed(3)}`, sym: 'min', pri: 8 });
    S.marks.push({ p: B, name: 'Minimum B', sub: `L ${B.L.toFixed(3)}`, sym: 'min', pri: 8 });
    const pts = []; for (let t = 0.3; t <= 0.7; t += 0.02) { const a = Math.PI / 2 + (t - 0.5) * 2 * RVhalf; pts.push(RVcx + RVR * Math.cos(a), RVcy + RVR * Math.sin(a)); }
    S.paths.push({ text: 'the low road', pts, size: 11, offset: 0.09 });
  },
  frame: () => {
    const st = PL.st; if (!st.A || !st.B || F.paused) return;
    if (st.hold > 0) { if (--st.hold === 0) { connectReset(); linesDirty = true; } return; }
    const P = [0, 0], R = RPLAN, lr = 0.02;
    for (let it = 0; it < 3; it++) {
      let g1 = 0, g2 = 0; const m = 12;
      for (let j = 0; j < m; j++) { const t = (j + R()) / m; bez(st.A, st.C, st.B, t, P); grad(P[0], P[1]); const wgt = 2 * t * (1 - t); g1 += wgt * gX; g2 += wgt * gY; }
      g1 /= m; g2 /= m; const gn = Math.hypot(g1, g2); if (gn > 3) { g1 *= 3 / gn; g2 *= 3 / gn; }
      st.C[0] -= lr * g1; st.C[1] -= lr * g2; st.it++;
      st.e1 = 0.95 * st.e1 + 0.05 * g1; st.e2 = 0.95 * st.e2 + 0.05 * g2;          // single estimates stay near 0.03 after convergence
      st.calm = st.it > 200 && Math.hypot(st.e1, st.e2) < 0.015 ? st.calm + 1 : 0;
    }
    if (st.calm > 120) st.hold = 480;
    linesDirty = true;
  },
  lines: () => {
    const st = PL.st; if (!st.A || !st.B) return;
    line(drape([st.A.x, st.A.y, st.B.x, st.B.y]), '#c22a40', 1.5, 0.025, true, 0.85);
    const pts = [], P = [0, 0]; for (let k = 0; k <= 120; k++) { bez(st.A, st.C, st.B, k / 120, P); pts.push(P[0], P[1]); }
    line(drape(pts, 0.008), '#167a5b', 2, 0, true, 0.95);
    line(drape([st.A.x, st.A.y, st.C[0], st.C[1], st.B.x, st.B.y], 0.01), INK, 0.7, 0.012, true, 0.45);
    for (const m of st.mli) line(drape([m.x0, m.y0, m.x1, m.y1]), m.mono ? '#23708f' : '#cf6d0c', 1, m.mono ? 0 : 0.016, true, 0.75);
  },
  markers: (B, n) => {
    const st = PL.st; if (!st.C) return n;
    const o = n * 11; B[o] = st.C[0]; B[o + 1] = st.C[1]; B[o + 2] = 7; B[o + 3] = 1; B[o + 4] = 0; B[o + 5] = 0; B[o + 6] = 1; B[o + 7] = 0; B[o + 8] = 0.09; B[o + 9] = 0.48; B[o + 10] = 0.36;
    return n + 1;
  },
  plan: () => {
    // every third cohort starts inside the trench of the low road, near one of its ends
    const trench = () => { const f = (RPLAN() < 0.5 ? 0.3 : 0.62) + RPLAN() * 0.08, a = Math.PI / 2 + (f - 0.5) * 2 * RVhalf; return [RVcx + RVR * Math.cos(a), RVcy + RVR * Math.sin(a)]; };
    let k = 0;
    for (let q = 0; q < 3; q++) RELEASES.push(mitchellHigh(RPLAN));
    RELEASES.more = () => (++k % 3 === 0 ? trench() : mitchellHigh(RPLAN));
  },
  readouts: () => {
    const st = PL.st; if (!st.A) return [];
    const base = Math.max(st.A.L, st.B.L), P = [0, 0];
    const bs = barrierOf((t, o) => { o[0] = st.A.x + (st.B.x - st.A.x) * t; o[1] = st.A.y + (st.B.y - st.A.y) * t; }) - base;
    const bc = barrierOf((t, o) => bez(st.A, st.C, st.B, t, o)) - base;
    return [['barrier, straight', bs.toFixed(3)], ['barrier, curve', bc.toFixed(3)], ['start → solution, monotone', st.runs ? `${st.mono} of ${st.runs}` : '…']];
  },
  figH: 250,
  debug: () => ({ runs: PL.st.runs, mono: PL.st.mono, fails: PL.st.fails }),
  fig: (c, w, h) => {
    const st = PL.st; if (!st.A) return;
    const hh = (h - 12) / 2, x0 = 26, x1 = w - 6, n = 120, a = [], b = [], P = [0, 0];
    let y0 = 8, y1 = hh - 22;
    for (let k = 0; k <= n; k++) { const t = k / n; a.push(L(st.A.x + (st.B.x - st.A.x) * t, st.A.y + (st.B.y - st.A.y) * t)); bez(st.A, st.C, st.B, t, P); b.push(L(P[0], P[1])); }
    FIG.axes(c, x0, y0, x1, y1, 't, from A to B', 'L');
    const r = figSeries(c, x0, y0, x1, y1, [{ ys: a, color: '#c22a40', w: 1.3, dash: [4, 2] }, { ys: b, color: '#167a5b', w: 1.6 }], { xmax: n, ymin: 0 });
    FIG.tick(c, x0 - 3, r.ty(r.ymax), r.ymax.toFixed(2), 'right', 'middle');
    y0 = hh + 14; y1 = h - 28;
    FIG.axes(c, x0, y0, x1, y1, 't, from start to solution', 'L');
    if (st.mli.length) {
      const ser = st.mli.map((m) => ({ ys: m.prof, color: m.mono ? '#23708f' : '#cf6d0c', w: 1.1, a: 0.8 }));
      const r2 = figSeries(c, x0, y0, x1, y1, ser, { xmax: 60, ymin: 0 });
      FIG.tick(c, x0 - 3, r2.ty(r2.ymax), r2.ymax.toFixed(2), 'right', 'middle');
    } else FIG.note(c, (x0 + x1) / 2, (y0 + y1) / 2, 'waiting for particles to come to rest', 'rgba(36,38,43,0.5)', 'center');
  },
});

// --- forks: linear mode connectivity and the instability of early training
function sheetDome(R) {
  sheetBase(R, { bk: 0.16, bk4: 0.02, na: 0.035 });
  addGauss(0, 0, R.range(0.42, 0.5), 0.34, 0.28, R.range(0, 3));
  const off = R.range(-0.3, 0.3);
  FEAT.dome = [];
  for (let k = 0; k < 4; k++) { const a = off + Math.PI / 4 + k * Math.PI / 2, x = 0.98 * Math.cos(a), y = 0.6 * Math.sin(a); addGauss(x, y, -R.range(0.45, 0.6), R.range(0.22, 0.27), R.range(0.18, 0.22), R.range(0, 3)); FEAT.dome.push([x, y]); }
  for (let k = 0; k < 4; k++) { const a = off + k * Math.PI / 2, x = 0.85 * Math.cos(a), y = 0.62 * Math.sin(a); addGauss(x, y, R.range(0.28, 0.36), 0.2 + 0.1 * Math.abs(Math.sin(a)), 0.2 + 0.1 * Math.abs(Math.cos(a)), a); }
  sheetEnd(R);
}
const FORK_K = [0, 10, 25, 50, 100, 200, 400], FORK_N = 1100;
function lineBarrier(ax, ay, bx, by) { let mx = -Infinity; for (let k = 0; k <= 60; k++) { const t = k / 60; mx = Math.max(mx, L(ax + (bx - ax) * t, ay + (by - ay) * t)); } return mx - 0.5 * (L(ax, ay) + L(bx, by)); }
plate({
  id: 'forks', ch: 4, seed: 2309,
  run: [
    null,
    null,
    (T) => { T.set('noise', 0.5); },
    (T) => { T.set('noise', 2); },
  ],
  status: 'established',
  tribes: [{ k: 'sgd', rest: 'never', maxAge: FORK_N, color: '#4b3fa0' }],
  sim: { lr: 0.004, noise: 1.0 },
  ctl: ['noise'],
  onSim: (k) => { if (k === 'noise') { PL.st.rec.length = 0; PL.st.pairs.length = 0; linesDirty = true; } },
  view: { yaw: -6, pitch: 52 },
  sheet: sheetDome,
  features: () => {
    const st = PL.st = { k: 0, exps: new Map(), rec: [], pairs: [], id: 1 };
    let best = [0, 0], bv = -Infinity;
    for (let x = -0.45; x <= 0.45; x += 0.01) for (let y = -0.35; y <= 0.35; y += 0.01) { const v = L(x, y); if (v > bv) { bv = v; best = [x, y]; } }
    const c = critAt(best[0], best[1]); st.top = c && c.type === 'max' ? [c.x, c.y] : best;
  },
  names: (S) => { for (const p of FEAT.dome) { let m = critAt(p[0], p[1]); if (!m || m.type !== 'min') m = minNear(p[0], p[1]); if (m) S.marks.push({ p: m, name: '', sub: `${m.L.toFixed(2)}`, sym: 'min', pin: false }); } S.marks.push({ p: { x: PL.st.top[0], y: PL.st.top[1] }, name: 'Dome', sub: 'every particle starts here', sym: 'peak', pri: 8 }); },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 6) { nextRelease = STAT.steps + 45; return; }
    const k = FORK_K[st.k++ % FORK_K.length], id = st.id++;
    st.exps.set(id, { k, ends: [], fork: null });
    const i = spawn(st.top[0] + RREL.normal() * 0.003, st.top[1] + RREL.normal() * 0.003, 0, { tag: id });
    if (i >= 0) An[i] = 0;
    if (k === 0 && i >= 0) { const j = spawn(Wx[i], Wy[i], 0, { tag: id }); if (j >= 0) An[j] = 2; An[i] = 1; st.exps.get(id).fork = [Wx[i], Wy[i]]; stamp(Wx[i], Wy[i], 0.008, 3, 0.15, 0.15, 0.17, 0.85, 0.0022); }
    nextRelease = STAT.steps + Math.round(1.6 * 45);
  },
  step: (i) => {
    const st = PL.st, e = st.exps.get(Tag[i]);
    if (e && An[i] === 0 && Age[i] === e.k) {
      const j = spawn(Wx[i], Wy[i], 0, { tag: Tag[i] });
      if (j >= 0) { Age[j] = Age[i]; Px[j] = Px[i]; Py[j] = Py[i]; An[j] = 2; }
      An[i] = 1; e.fork = [Wx[i], Wy[i]];
      stamp(Wx[i], Wy[i], 0.008, 3, 0.15, 0.15, 0.17, 0.85, 0.0022);
    }
  },
  retire: (i) => {
    const st = PL.st, e = st.exps.get(Tag[i]); if (!e) return;
    e.ends.push([Wx[i], Wy[i]]);
    if (e.ends.length === 2 || An[i] === 0) {
      st.exps.delete(Tag[i]);
      if (e.ends.length < 2) return;
      const [a, b] = e.ends, bar = lineBarrier(a[0], a[1], b[0], b[1]);
      st.rec.push([e.k, bar]); if (st.rec.length > 420) st.rec.shift();
      st.pairs.push([a[0], a[1], b[0], b[1], bar]); if (st.pairs.length > 14) st.pairs.shift();
      linesDirty = true;
    }
  },
  lines: () => { for (const p of PL.st.pairs) line(drape([p[0], p[1], p[2], p[3]]), p[4] > 0.05 ? '#c22a40' : '#167a5b', 1.3, p[4] > 0.05 ? 0.022 : 0, true, 0.75); },
  readouts: () => {
    const st = PL.st, s = (k) => { const a = st.rec.filter((r) => r[0] === k); return a.length ? `${Math.round(100 * a.filter((r) => r[1] <= 0.05).length / a.length)}%` : '…'; };
    return [['experiments', String(st.rec.length)], ['connected, fork at 0', s(0)], ['at 50', s(50)], ['at 400', s(400)]];
  },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28;
    FIG.axes(c, x0, y0, x1, y1, 'fork step k', 'barrier');
    const tx = (k) => x0 + 6 + (x1 - x0 - 12) * FORK_K.indexOf(k) / (FORK_K.length - 1);
    let ymax = 0.2; for (const r of st.rec) ymax = Math.max(ymax, r[1]);
    const ty = (v) => y1 - (y1 - y0) * clamp(v, 0, ymax) / ymax;
    for (const k of FORK_K) FIG.tick(c, tx(k), y1 + 4, String(k));
    c.setLineDash([2, 2]); c.strokeStyle = 'rgba(36,38,43,0.4)'; c.beginPath(); c.moveTo(x0, ty(0.05)); c.lineTo(x1, ty(0.05)); c.stroke(); c.setLineDash([]);
    for (const r of st.rec) { c.fillStyle = r[1] > 0.05 ? 'rgba(194,42,64,0.55)' : 'rgba(22,122,91,0.6)'; c.beginPath(); c.arc(tx(r[0]) + ((r[1] * 997) % 1 - 0.5) * 8, ty(r[1]), 1.8, 0, TAU); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); let on = false;
    for (const k of FORK_K) { const a = st.rec.filter((r) => r[0] === k); if (!a.length) { on = false; continue; } const m = a.reduce((p, q) => p + q[1], 0) / a.length; if (on) c.lineTo(tx(k), ty(m)); else c.moveTo(tx(k), ty(m)); on = true; }
    c.stroke();
  },
});

// --- symmetry: a one-unit tanh network, whose loss is unchanged by flipping the signs of both weights
const NET = { xs: [], ys: [], sw: 1.65, sa: 1.85 };
function sheetTanh(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0 });
  NET.xs = []; NET.ys = [];
  const wt = R.range(1.3, 1.5), at = R.range(1.0, 1.15);
  for (let k = 0; k < 16; k++) { const x = -2 + 4 * k / 15; NET.xs.push(x); NET.ys.push(at * Math.tanh(wt * x) + 0.06 * R.normal()); }
  EXTRA = (x, y) => { const w = NET.sw * x, a = NET.sa * y; let s = 0; for (let k = 0; k < 16; k++) { const r = a * Math.tanh(w * NET.xs[k]) - NET.ys[k]; s += r * r; } return s / 32; };
  sheetEnd(R);
}
function minibatchNoise(i, x, y, s, R, out) {
  grad(x, y); const g1 = gX, g2 = gY, w = NET.sw * x, a = NET.sa * y, B = 4;
  let b1 = 0, b2 = 0;
  for (let q = 0; q < B; q++) { const k = (R() * 16) | 0, th = Math.tanh(w * NET.xs[k]), r = a * th - NET.ys[k]; b1 += r * a * (1 - th * th) * NET.xs[k]; b2 += r * th; }
  b1 = b1 / B * NET.sw * Lsc; b2 = b2 / B * NET.sa * Lsc;
  out[0] = (b1 - g1) * s; out[1] = (b2 - g2) * s;
}
plate({
  id: 'symmetry', ch: 4, seed: 2411,
  run: [
    null,
    null,
    (T) => { T.set('lr', 0.05); },
  ],
  status: 'open',
  tribes: [{ k: 'sgd', name: 'SGD, batches of 4', noise: N_FN, noiseFn: minibatchNoise, rule: 'g̃ = ∇L on 4 of 16 points', color: '#4b3fa0' }],
  sim: { lr: 0.5, noise: 1 },
  ctl: [{ key: 'lr', label: 'Learning rate η', min: 0.05, max: 1.2, scale: 'log', f: (v) => v.toFixed(3) }, { key: 'noise', label: 'Minibatch noise, ×', min: 0, max: 2, step: 0.05, f: (v) => v.toFixed(2) }],
  view: { yaw: -4, pitch: 54 },
  sheet: sheetTanh,
  features: () => {
    const st = PL.st = { plus: null, minus: null, rec: [] };
    st.mp = critAt(0.85, 0.6); st.mm = st.mp ? { x: -st.mp.x, y: -st.mp.y, L: st.mp.L, l1: st.mp.l1, l2: st.mp.l2 } : null;
  },
  names: (S) => {
    const st = PL.st; if (!st.mp) return;
    S.marks.push({ p: st.mp, name: 'Solution', sub: `w ${fmt(NET.sw * st.mp.x, 2)}, a ${fmt(NET.sa * st.mp.y, 2)}`, sym: 'min', pri: 8 });
    S.marks.push({ p: st.mm, name: 'Its twin', sub: `w ${fmt(NET.sw * st.mm.x, 2)}, a ${fmt(NET.sa * st.mm.y, 2)}`, sym: 'min', pri: 8 });
    S.marks.push({ p: { x: 0, y: 0 }, name: '', sub: 'centre of the half-turn', sym: 'x', pin: false });
  },
  plan: () => { for (let k = 0; k < 5; k++) RELEASES.push([RPLAN.range(-1.4, 1.4), RPLAN.range(-0.85, 0.85)]); RELEASES.more = () => [RPLAN.range(-1.4, 1.4), RPLAN.range(-0.85, 0.85)]; },
  retire: (i, ring) => {
    if (!ring) return;
    const st = PL.st, p = [Ex[i], Ey[i]];
    if (p[0] > 0) st.plus = p; else st.minus = p;
    if (st.plus && st.minus) {
      const b0 = lineBarrier(st.plus[0], st.plus[1], st.minus[0], st.minus[1]), b1 = lineBarrier(st.plus[0], st.plus[1], -st.minus[0], -st.minus[1]);
      st.rec.push([b0, b1]); if (st.rec.length > 60) st.rec.shift();
      linesDirty = true;
    }
  },
  lines: () => {
    const st = PL.st; if (!st.plus || !st.minus) return;
    const [px, py] = st.plus, [mx, my] = st.minus;
    line(drape([px, py, mx, my]), '#c22a40', 1.4, 0.025, true, 0.8);
    line(drape([px, py, -mx, -my], 0.004), '#167a5b', 1.8, 0, true, 0.95);
    const r = Math.hypot(mx, my), a0 = Math.atan2(my, mx), pts = [];
    for (let k = 0; k <= 60; k++) { const a = a0 + Math.PI * k / 60; pts.push(r * Math.cos(a), r * Math.sin(a)); }
    line(drape(pts, 0.01), INK, 0.9, 0.012, true, 0.55);
  },
  readouts: () => { const r = PL.st.rec[PL.st.rec.length - 1]; return r ? [['barrier between twins', r[0].toFixed(3)], ['after the flip', r[1].toFixed(3)]] : [['twins found', '…']]; },
  fig: (c, w, h) => {
    const rec = PL.st.rec, x0 = 8, y0 = 8, x1 = w - 4, y1 = h - 28;
    if (!rec.length) { FIG.note(c, w / 2, h / 2, 'waiting for a pair of twins', 'rgba(36,38,43,0.5)', 'center'); return; }
    const m0 = rec.reduce((p, q) => p + q[0], 0) / rec.length, m1 = rec.reduce((p, q) => p + Math.max(0, q[1]), 0) / rec.length;
    const ymax = figBars(c, x0, y0, x1, y1, [[m0], [m1]], ['twins, straight line', 'after the flip'], ['rgba(36,38,43,0.8)']);
    FIG.tick(c, x0 + (x1 - x0) / 4, y1 - (y1 - y0) * m0 / ymax - 12, m0.toFixed(3)); FIG.tick(c, x0 + 3 * (x1 - x0) / 4, y1 - (y1 - y0) * m1 / ymax - 12, m1.toFixed(3));
    c.strokeStyle = 'rgba(36,38,43,0.4)'; c.beginPath(); c.moveTo(x0, y1 + 0.5); c.lineTo(x1, y1 + 0.5); c.stroke();
  },
});

// --- label noise: drift along the valley of equivalent solutions
function labelNoise(i, x, y, s, R, out) {
  const e = s * R.normal(), w = HYP.s * x, a = HYP.s * y;
  out[0] = -e * a * HYP.s * Lsc; out[1] = -e * w * HYP.s * Lsc;
}
const LN_STARTS = [[1.45, 0.306], [0.47, 0.946], [-1.45, -0.306], [-0.47, -0.946], [1.2, 0.37], [-1.2, -0.37]];
plate({
  id: 'labelnoise', ch: 1, seed: 2503,
  run: [
    (T) => { T.set('noise', 0.3); T.clear(); const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
    null,
    (T) => { T.set('noise', 0.6); T.clear(); const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
    (T) => { T.set('noise', 1.2); T.clear(); const a = F.params.auto; F.params.auto = true; try { PL.release(); } finally { F.params.auto = a; } },
  ],
  status: 'established',
  tribes: [
    { k: 'gd', color: '#c22a40', rest: 'never', maxAge: 5000 },
    { k: 'sgd', name: 'SGD, label noise', color: '#167a5b', noise: N_FN, noiseFn: labelNoise, rule: 'y = 1 + εξ, ξ ~ N(0, 1), fresh each step', rest: 'never', maxAge: 5000 },
  ],
  sim: { lr: 0.15, noise: 0.3 },
  ctl: [{ key: 'noise', label: 'Label noise ε', min: 0, max: 2, step: 0.05 }],
  view: { yaw: -4, pitch: 52 },
  speed: 3,
  sheet: sheetHyperbola,
  features: () => { PL.st = { C: curveInit(2, 5000), k: 0 }; },
  names: (S) => {
    S.paths.push({ text: 'Valley of Equivalent Solutions', pts: hypFloorPts(1).slice(10, 110), size: 12, offset: 0.05 });
    const b = 1 / HYP.s; S.marks.push({ p: { x: b, y: b }, name: 'Balanced point', sub: 'w² + a² = 2', sym: 'min', pri: 8 }); S.marks.push({ p: { x: -b, y: -b }, name: '', sub: 'balanced', sym: 'min', pin: false });
  },
  print0: hypPrint,
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 40) { nextRelease = STAT.steps + 45; return; }
    curveReset(st.C);
    for (const p of LN_STARTS) { stamp(p[0], p[1], 0.008, 1, 0.12, 0.125, 0.14, 0.85, 0.0018); for (let t = 0; t < 2; t++) for (let k = 0; k < 3; k++) { const i = spawn(p[0], p[1], t); if (i >= 0) An[i] = st.C.cid; } }
    STAT.released++;
    nextRelease = STAT.steps + 5100;
  },
  step: (i) => { const st = PL.st; if (An[i] === st.C.cid) curveAdd(st.C, Tr[i], Age[i], HYP.s * HYP.s * (Wx[i] * Wx[i] + Wy[i] * Wy[i])); },
  readouts: () => {
    const st = PL.st, last = (t) => { const m = curveMean(st.C, t); for (let k = m.length - 1; k >= 0; k--) if (Number.isFinite(m[k])) return m[k].toFixed(2); return '…'; };
    return [['w² + a², gradient descent', last(0)], ['w² + a², label noise', last(1)], ['balanced', '2']];
  },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28;
    FIG.axes(c, x0, y0, x1, y1, 'steps', 'w² + a²');
    const r = figSeries(c, x0, y0, x1, y1, TRIBES.map((T, t) => ({ ys: curveMean(st.C, t), color: T.color, w: 1.4 })), { xmax: st.C.len, ymin: 1.5, ymax: 5.5 });
    const yl = r.ty(2); c.setLineDash([3, 2]); c.strokeStyle = 'rgba(36,38,43,0.5)'; c.beginPath(); c.moveTo(x0, yl); c.lineTo(x1, yl); c.stroke(); c.setLineDash([]);
    for (const v of [2, 3, 4, 5]) FIG.tick(c, x0 - 3, r.ty(v), String(v), 'right', 'middle');
  },
});
// ch4>>
// <<ch6
// ---------------------------------------------------------------------------------------------
// VI · Proving grounds: the classic test functions of numerical optimization, each drawn over its usual window,
// and a sheet to sculpt. A test function f(u, v) is shown as L = A f/(H + f) (with f measured from its global
// minimum): f scaled by A/H near the bottom, walls capped at A far up, every critical point kept in place and kind
// ---------------------------------------------------------------------------------------------
const pgU = (x) => PL.pg.s * x + PL.pg.u0, pgV = (y) => PL.pg.s * y + PL.pg.v0;
const pgX = (u) => (u - PL.pg.u0) / PL.pg.s, pgY = (v) => (v - PL.pg.v0) / PL.pg.s;
const pgF = (x, y) => PL.pg.f(pgU(x), pgV(y)) - PL.pg.fmin;
function sheetProving(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0 });
  const g = PL.pg, A = g.A || 1.8;
  EXTRA = (x, y) => { const f = Math.max(0, g.f(g.s * x + g.u0, g.s * y + g.v0) - g.fmin); return A * f / (g.H + f); };
  sheetEnd(R, true);
}
function pgFeatures() {
  const st = PL.st = { C: curveInit(TRIBES.length, PL.pg.race || 2400), k: 0, best: TRIBES.map(() => Infinity), arr: null, starts: [] };
  st.crit = findCritical(PL.pg.grid || 160, true).filter((c) => c.x > X0 + 0.02 && c.x < X1 - 0.02 && c.y > Y0 + 0.02 && c.y < Y1 - 0.02);
  st.Lstar = Math.min(...st.crit.filter((c) => c.type === 'min').map((c) => c.L));
  st.mins = st.crit.filter((c) => c.type === 'min').sort((a, b) => a.L - b.L || a.x - b.x);
  st.mins.forEach((m, k) => { m.letter = 'ABCDEFGH'[k] || '·'; });
  st.arr = TRIBES.map(() => new Float64Array(st.mins.length + 1));
}
const pgNum = (v) => { const d = Math.abs(v) < 10 ? 3 : 1; return fmt(Math.abs(v) < 0.5 * 10 ** -d ? 0 : v, d); };
function pgNames(S) {
  const st = PL.st, g = PL.pg, glob = (m) => m.L < st.Lstar + 1e-4;
  for (const c of st.crit) {
    const u = pgU(c.x), v = pgV(c.y), f = g.f(u, v), at = `f(${pgNum(u)}, ${pgNum(v)}) = ${fmt(f, 3)}`;
    if (c.type === 'min' && glob(c)) S.marks.push({ p: c, name: g.letters ? `Minimum ${c.letter}` : 'Global minimum', sub: at, sym: 'min', pri: 9 });
    else if (g.labels && (c.type !== 'max' || g.labels === 'all')) S.marks.push({ p: c, name: '', sub: c.type === 'min' && g.letters ? `${c.letter} · f ${fmt(f, 3)}` : `f ${fmt(f, 2)}`, sym: c.type === 'min' ? 'min' : c.type === 'saddle' ? 'pass' : 'peak', pri: 2, pin: false });
  }
  if (g.path) S.paths.push({ text: g.path.text, pts: g.path.pts.flatMap(([u, v]) => [pgX(u), pgY(v)]), size: 12, offset: 0.06 });
  if (g.area) S.areas.push(Object.assign({ size: 14, ls: 2.4 }, g.area, { x: pgX(g.area.u), y: pgY(g.area.v) }));
}
// critical points without a label still get their symbol
function pgPrint() { const st = PL.st, g = PL.pg; if (g.labels) return; for (const c of st.crit) if (!(c.type === 'min' && c.L < st.Lstar + 1e-4)) drawSymbol({ p: c, sym: c.type === 'min' ? 'min' : c.type === 'saddle' ? 'pass' : 'peak' }); }
function pgStart() {          // a start on high ground, away from earlier starts
  const st = PL.st; let best = null, bd = -1;
  for (let t = 0; t < 24; t++) {
    const x = RPLAN.range(X0 + 0.12, X1 - 0.12), y = RPLAN.range(Y0 + 0.12, Y1 - 0.12);
    if (L(x, y) < HIGHQ) continue;
    let md = 9; for (const p of st.starts.slice(-6)) md = Math.min(md, Math.hypot(p[0] - x, p[1] - y));
    if (md > bd) { bd = md; best = [x, y]; }
  }
  return best || [RPLAN.range(X0 + 0.2, X1 - 0.2), RPLAN.range(Y0 + 0.2, Y1 - 0.2)];
}
// a race: every optimizer leaves the same point together; the figure follows the latest race
function pgRelease(at) {
  const st = PL.st, g = PL.pg;
  if (!at && (!F.params.auto || STAT.alive > maxAlive - 60)) { nextRelease = STAT.steps + 45; return; }
  let p = at;
  if (!p) { const k = st.k++; p = g.starts && k < g.starts.length ? [pgX(g.starts[k][0]), pgY(g.starts[k][1])] : pgStart(); }
  curveReset(st.C); st.best = TRIBES.map(() => Infinity); st.starts.push(p);
  stamp(p[0], p[1], 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
  const n = PHONE ? 4 : 6;
  for (let t = 0; t < TRIBES.length; t++) for (let k = 0; k < n; k++) spawn(p[0] + RREL.normal() * 0.006, p[1] + RREL.normal() * 0.006, t, { tag: st.C.cid });
  STAT.released++;
  nextRelease = STAT.steps + (g.gap || 1400);
}
function pgStep(i) {
  const st = PL.st; if (Tag[i] !== st.C.cid) return;
  const d = Math.max(1e-6, Wl[i] - st.Lstar);
  curveAdd(st.C, Tr[i], Age[i], Math.log10(d));
  if (d < st.best[Tr[i]]) st.best[Tr[i]] = d;
}
function pgRetire(i, ring) {   // where each optimizer came to rest, by minimum
  const st = PL.st; if (!ring || !st.mins.length) return;
  let b = st.mins.length, bd = 0.05;
  st.mins.forEach((m, k) => { const d = Math.hypot(m.x - Ex[i], m.y - Ey[i]); if (d < bd) { bd = d; b = k; } });
  st.arr[Tr[i]][b]++;
}
function pgFigRace(c, w, h) {
  const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28, xm = st.C.len;
  FIG.axes(c, x0, y0, x1, y1, 'steps', 'log₁₀(L − L*)');
  const r = figSeries(c, x0, y0, x1, y1, TRIBES.map((T, t) => ({ ys: curveMean(st.C, t), color: T.color, w: 1.4 })), { xmax: xm, ymin: -5, ymax: 0.5 });
  for (const v of [-4, -2, 0]) FIG.tick(c, x0 - 3, r.ty(v), String(v), 'right', 'middle');
  FIG.tick(c, x1, y1 + 4, String(xm), 'right');
}
function pgFigArrivals(c, w, h) {
  const st = PL.st, x0 = 8, y0 = 8, x1 = w - 4, y1 = h - 28, nm = st.mins.length;
  const groups = [], labels = [];
  for (let b = 0; b < nm; b++) { groups.push(TRIBES.map((T, t) => { const tot = st.arr[t].reduce((p, q) => p + q, 0); return tot ? st.arr[t][b] / tot : 0; })); labels.push(st.mins[b].letter); }
  figBars(c, x0, y0, x1, y1, groups, labels, TRIBES.map((T) => T.color), { ymax: 1 });
  c.strokeStyle = 'rgba(36,38,43,0.4)'; c.beginPath(); c.moveTo(x0, y1 + 0.5); c.lineTo(x1, y1 + 0.5); c.stroke();
  if (!st.arr.some((a) => a.some((v) => v > 0))) FIG.note(c, (x0 + x1) / 2, (y0 + y1) / 2, 'no particle has come to rest yet', 'rgba(36,38,43,0.5)', 'center');
}
const pgReadRace = () => TRIBES.map((T, t) => [T.name, Number.isFinite(PL.st.best[t]) ? `best L − L* ${PL.st.best[t].toExponential(1)}` : '…']);
const pgReadArr = () => TRIBES.map((T, t) => [T.name, PL.st.mins.map((m, b) => `${m.letter} ${PL.st.arr[t][b] | 0}`).join(' · ')]);
function provingPlate(p) {
  plateText(p);
  return plate(Object.assign({
    ch: 5, sheet: sheetProving, features: pgFeatures, names: pgNames, print: pgPrint,
    release: () => pgRelease(), click: (x, y) => pgRelease([x, y]), step: pgStep, retire: pgRetire,
    frame: () => { if (STAT.alive === 0 && nextRelease - STAT.steps > 120) nextRelease = STAT.steps + 120; },      // the next race starts soon after the sheet empties
    fig: p.arrivals ? pgFigArrivals : pgFigRace, readouts: p.arrivals ? pgReadArr : pgReadRace,
    debug: () => ({ crit: PL.st.crit.length, mins: PL.st.mins.length, best: PL.st.best.map((v) => (Number.isFinite(v) ? +v.toExponential(2) : null)), arr: PL.st.arr.map((a) => Array.from(a)) }),
    cap: p.arrivals ? TEXT.pgCap.arrivals : TEXT.pgCap.race,
  }, p, p.lead ? { method: (p.method || '') + TEXT.pgHow } : { how: (p.how || '') + TEXT.pgHow }));
}
const PG_TRIBES = [{ k: 'gd', maxAge: 3000 }, { k: 'hb', name: 'Heavy ball', sigMul: 0, maxAge: 3000 }, { k: 'adam', name: 'Adam', sigMul: 0, maxAge: 3000 }];

provingPlate({
  id: 'rosenbrock', seed: 3101,
  run: [
    (T) => { T.set('lr', 0.003); T.set('beta', 0.9); T.clear(); T.release(pgX(-1.2), pgY(1)); },
    null,
    null,
    (T) => { T.set('beta', 0.9); T.set('lr', 0.006); T.clear(); T.release(pgX(-1.2), pgY(1)); },
  ],
  pg: { f: (u, v) => (1 - u) ** 2 + 100 * (v - u * u) ** 2, fmin: 0, s: 1.25, u0: 0, v0: 1, H: 6, race: 3000, gap: 3100,
    starts: [[-1.2, 1], [1.5, 2.2], [-1.6, 2], [0.4, -0.2]],
    path: { text: 'The Banana Valley', pts: [[-1.45, 2.1], [-1.1, 1.21], [-0.7, 0.49], [-0.3, 0.09], [0.1, 0.01], [0.5, 0.25]] } },
  tribes: PG_TRIBES,
  sim: { lr: 0.003, noise: 0, beta: 0.9 },
  ctl: ['lr', 'beta'],
  view: { yaw: -4, pitch: 50 }, speed: 4,
});
provingPlate({
  id: 'himmelblau', seed: 3102, arrivals: true,
  run: [
    null,
    (T) => { T.set('lr', 0.02); T.set('beta', 0.9); T.clear(); const c = PL.st.crit.find((q) => q.type === 'max'); T.release(c.x, c.y); },
    (T) => { T.set('lr', 0.02); T.set('beta', 0.9); T.clear(); const c = PL.st.crit.find((q) => q.type === 'max'); T.release(c.x, c.y); },
    (T) => { T.set('beta', 0.9); const D = PL.st.mins.find((m) => m.letter === 'D'); T.set('lr', 1.1 * 2 / D.l2); },
  ],
  pg: { f: (u, v) => (u * u + v - 11) ** 2 + (u + v * v - 7) ** 2, fmin: 0, s: 3.6, u0: 0, v0: 0, H: 60, letters: true, labels: 'all', gap: 900 },
  tribes: PG_TRIBES.map((t) => Object.assign({}, t, { maxAge: 1600 })),
  sim: { lr: 0.02, noise: 0, beta: 0.9 },
  ctl: ['lr', 'beta'],
  view: { yaw: -6, pitch: 52 }, speed: 2,
});
provingPlate({
  id: 'rastrigin', seed: 3103,
  run: [
    (T) => { T.set('lr', 0.004); T.set('beta', 0.9); T.set('noise', 6); T.clear(); T.release(...pgStart()); },
    (T) => { T.set('lr', 0.004); T.set('beta', 0.9); T.set('noise', 8); T.clear(); T.release(...pgStart()); },
    (T) => { T.set('lr', 0.004); T.set('noise', 6); T.set('beta', 0.99); T.clear(); T.release(...pgStart()); },
  ],
  pg: { f: (u, v) => 20 + u * u - 10 * Math.cos(TAU * u) + v * v - 10 * Math.cos(TAU * v), fmin: 0, s: 3.2, u0: 0, v0: 0, H: 200, A: 6, race: 2400, gap: 2500, grid: 260,
    area: { u: 0, v: 2.55, lines: ['The Egg Crate'], size: 15, ls: 3.2 } },
  tribes: [{ k: 'gd', maxAge: 2400 }, { k: 'hb', name: 'Heavy ball', sigMul: 0, maxAge: 2400 }, { k: 'adam', name: 'Adam', sigMul: 0, maxAge: 2400 },
    { k: 'sgd', name: 'SGD', color: '#23708f', maxAge: 2400, rest: 'never' }],
  sim: { lr: 0.004, noise: 6, beta: 0.9 },
  ctl: ['lr', 'beta', { key: 'noise', label: 'Gradient noise σ (SGD)', min: 0, max: 12, step: 0.1 }],
  view: { yaw: -4, pitch: 54 }, speed: 3,
});
provingPlate({
  id: 'ackley', seed: 3104,
  run: [
    (T) => { T.set('lr', 0.012); T.set('beta', 0.9); T.clear(); const s = PL.pg.starts[0]; T.release(pgX(s[0]), pgY(s[1])); PL.st.k = 1; },
    (T) => { T.set('lr', 0.012); T.set('beta', 0.9); T.clear(); const s = PL.pg.starts[1]; T.release(pgX(s[0]), pgY(s[1])); PL.st.k = 2; },
    (T) => { T.set('lr', 0.012); T.set('beta', 0.9); T.clear(); const a = Math.PI / 18; T.release(pgX(1.6 * Math.cos(a)), pgY(1.6 * Math.sin(a))); },
    (T) => { T.set('lr', 0.012); T.set('beta', 0.9); T.clear(); const a = Math.PI / 18; T.release(pgX(1.0 * Math.cos(a)), pgY(1.0 * Math.sin(a))); },
  ],
  pg: { f: (u, v) => -20 * Math.exp(-0.2 * Math.sqrt(0.5 * (u * u + v * v) + 0.0025)) - Math.exp(0.5 * (Math.cos(TAU * u) + Math.cos(TAU * v))) + Math.E + 20 * Math.exp(-0.01),
    fmin: 0.0, s: 2, u0: 0, v0: 0, H: 10, A: 2.2, race: 2400, gap: 2500, grid: 200,
    starts: [[1.3, 0.95], [-1.5, -0.6], [2.2, 0.5], [0.4, -1.55], [-2.6, 1.3]] },
  tribes: PG_TRIBES.map((t) => Object.assign({}, t, { maxAge: 2400 })),
  sim: { lr: 0.012, noise: 0, beta: 0.9 },
  ctl: ['lr', 'beta'],
  view: { yaw: -4, pitch: 50 }, speed: 3,
});
provingPlate({
  id: 'camel', seed: 3105, arrivals: true,
  run: [
    null,
    (T) => { T.set('lr', 0.03); T.set('beta', 0.9); T.clear(); const o = PL.st.crit.filter((q) => q.type === 'saddle').sort((p, q) => Math.hypot(p.x - pgX(0), p.y - pgY(0)) - Math.hypot(q.x - pgX(0), q.y - pgY(0)))[0]; T.release(o.x, o.y); },
    (T) => { T.set('lr', 0.03); T.set('beta', 0.99); },
    null,
  ],
  pg: { f: (u, v) => (4 - 2.1 * u * u + u ** 4 / 3) * u * u + u * v + (-4 + 4 * v * v) * v * v, fmin: -1.031628453, s: 1.25, u0: 0, v0: 0, H: 6, letters: true, labels: 'all', gap: 900 },
  tribes: PG_TRIBES.map((t) => Object.assign({}, t, { maxAge: 1600 })),
  sim: { lr: 0.03, noise: 0, beta: 0.9 },
  ctl: ['lr', 'beta'],
  view: { yaw: -4, pitch: 52 }, speed: 2,
});

// --- a sheet to sculpt: the user's strokes are Gaussian wells and hills on a seeded base
const SCULPT = [];
function sheetSculpt(R) {
  sheetBase(R, { bk: 0.12, bk4: 0.012, na: 0.025 });
  BX = R.range(-0.2, 0.2); BY = R.range(-0.15, 0.15);
  for (let k = 0; k < 3; k++) addGauss(R.range(-1.2, 1.2), R.range(-0.65, 0.65), R.range(-0.25, 0.25), R.range(0.18, 0.3), R.range(0.14, 0.24), R.range(0, 3));
  for (const s of SCULPT) addGauss(s.x, s.y, s.a, s.r, s.r, 0);
  sheetEnd(R, true);
}
function sculptAt(x, y) {
  const t = SIM.tool;
  if (t === 'walk') { releaseCaravan(x, y); return; }
  if (SCULPT.length >= MAXF - 3) { F.toast('The sheet is full: undo a stroke or smooth the sheet', 2400); return; }
  SCULPT.push({ x, y, a: t === 'raise' ? 0.3 : -0.3, r: SIM.brush });
  reshape(40);
}
plate({
  id: 'sculpt', ch: 5, seed: 3106,
  run: [
    (T) => {
      const n = () => ({ x: BX + 0.45, y: BY, a: -0.3, r: 0.06 }), want = [n(), n(), n(), { x: BX, y: BY, a: -0.3, r: 0.3 }];
      if (JSON.stringify(SCULPT) !== JSON.stringify(want)) { SCULPT.length = 0; SCULPT.push(...want); reshape(40); }
      T.set('lr', 0.004); T.set('noise', 0.25); T.set('brush', 0.3); T.set('tool', 'dig');
    },
    (T) => {
      const n = () => ({ x: BX + 0.45, y: BY, a: -0.3, r: 0.06 }), want = [n(), n(), n(), { x: BX, y: BY, a: -0.3, r: 0.3 }];
      if (JSON.stringify(SCULPT) !== JSON.stringify(want)) { SCULPT.length = 0; SCULPT.push(...want); reshape(40); }
      T.set('noise', 0.25); T.set('tool', 'walk'); T.clear();
      const go = () => T.set('lr', 1.3 * 2 / NAMED.sharp.l2);
      if (reshapeWait) reshapeWait.push(go); else go();
      T.release('Sharp Minimum');
    },
    (T) => {
      const n = () => ({ x: BX + 0.45, y: BY, a: -0.3, r: 0.06 }), want = [n(), n(), n(), { x: BX, y: BY, a: -0.3, r: 0.3 }];
      if (JSON.stringify(SCULPT) !== JSON.stringify(want)) { SCULPT.length = 0; SCULPT.push(...want); reshape(40); }
      T.set('noise', 0.25); T.set('lr', 0.03); T.set('tool', 'walk'); T.clear();
      T.release('Sharp Minimum');
    },
    (T) => {
      const want = [{ x: BX, y: BY, a: -0.3, r: 0.3 }, { x: BX + 0.45, y: BY, a: -0.3, r: 0.06 }];
      if (JSON.stringify(SCULPT) !== JSON.stringify(want)) { SCULPT.length = 0; SCULPT.push(...want); reshape(40); }
      T.set('noise', 0.25); T.set('lr', 0.03); T.set('brush', 0.06); T.set('tool', 'walk'); T.clear();
      T.release('Sharp Minimum');
    },
  ],
  tribes: [{ k: 'sgd' }, { k: 'hb' }, { k: 'adam' }],
  sim: { lr: 0.004, noise: 0.25, beta: 0.9, tool: 'dig', brush: 0.16 },
  ctl: [{ type: 'select', key: 'tool', label: 'Tool (click the relief)', options: { dig: 'Dig a well', raise: 'Raise a hill', walk: 'Release a cohort' } },
    { key: 'brush', label: 'Brush width r', min: 0.05, max: 0.4, step: 0.01 },
    { type: 'button', buttons: [['Undo the last stroke', () => { if (SCULPT.length) { SCULPT.pop(); reshape(40); } }], ['Smooth the sheet', () => { SCULPT.length = 0; reshape(40); F.toast('Smoothed'); }]] },
    'lr', 'noise'],
  view: { yaw: -8, pitch: 48 },
  sheet: sheetSculpt,
  features: () => { nameSurvey(); surveyLakes(); },
  names: surveyNames,
  plan: planSurvey,
  click: sculptAt,
  readouts: () => [['strokes', String(SCULPT.length)], ['minima', String(CRIT.filter((c) => c.type === 'min').length)], ['saddles', String(CRIT.filter((c) => c.type === 'saddle').length)], ['particles', String(STAT.alive)]],
  debug: () => ({ strokes: SCULPT.length, crit: CRIT.length, named: Object.keys(NAMED) }),
  fig: figRestHistogram,
});
// ch6>>
// <<ch7
// ---------------------------------------------------------------------------------------------
// VII · Where there is no bottom: dynamics that are not descent to a minimum. A game, whose players pull in
// opposite directions; a policy whose best value lies at infinity; a classifier whose loss has no minimum at all.
// Particles of kind K_FN take steps their optimizer computes (game updates, natural gradients, steps in weight space)
// ---------------------------------------------------------------------------------------------
const K_FN = 40;
function curveRace(st) { curveReset(st.C); }
function raceSpawn(p, per, spread, tag) {
  stamp(p[0], p[1], 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
  for (let t = 0; t < TRIBES.length; t++) for (let k = 0; k < per; k++) spawn(p[0] + RREL.normal() * spread, p[1] + RREL.normal() * spread, t, { tag });
  STAT.released++;
}

// --- two players on one sheet: f(θ₁, θ₂) = a θ₁θ₂, θ₁ moving down the slope and θ₂ up it
const GAME_A = 0.6;
function sheetGame(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0 });
  EXTRA = (x, y) => GAME_A * x * y;
  sheetEnd(R, true);
}
const GAME_TRIBES = [
  { k: 'sgd', name: 'Simultaneous', color: '#c22a40', kind: K_FN, sigMul: 0, rest: 'never', maxAge: 2600, rule: 'θ₁ ← θ₁ − η∂₁f,  θ₂ ← θ₂ + η∂₂f',
    fn: (i, x, y, eta, g1, g2) => [-eta * g1, eta * g2] },
  { k: 'sgd', name: 'Alternating', color: '#cf6d0c', kind: K_FN, sigMul: 0, rest: 'never', maxAge: 2600, rule: 'θ₂ uses the θ₁ just moved',
    fn: (i, x, y, eta, g1) => { const xn = x - eta * g1; grad(xn, y); return [xn - x, eta * gY]; } },
  { k: 'sgd', name: 'Extragradient', color: '#23708f', kind: K_FN, sigMul: 0, rest: 'never', maxAge: 2600, rule: 'look ahead one step, move with the gradient found there',
    fn: (i, x, y, eta, g1, g2) => { grad(x - eta * g1, y + eta * g2); return [-eta * gX, eta * gY]; } },
  { k: 'sgd', name: 'Optimistic', color: '#167a5b', kind: K_FN, sigMul: 0, rest: 'never', maxAge: 2600, rule: 'θ ← θ ∓ η(2gₜ − gₜ₋₁)',
    fn: (i, x, y, eta, g1, g2) => { if (Age[i] === 0) { Vx[i] = g1; Vy[i] = g2; } const d = [-eta * (2 * g1 - Vx[i]), eta * (2 * g2 - Vy[i])]; Vx[i] = g1; Vy[i] = g2; return d; } },
];
plate({
  id: 'games', ch: 6, seed: 3201,
  run: [
    (T) => { T.clear(); T.set('lr', 0.1); T.release(0.35 * Math.SQRT1_2, 0.35 * Math.SQRT1_2); },
    null,
    null,
    (T) => { T.clear(); T.set('lr', 0.3); T.release(0.35 * Math.SQRT1_2, 0.35 * Math.SQRT1_2); },
  ],
  status: 'established',
  tribes: GAME_TRIBES,
  sim: { lr: 0.1, noise: 0 },
  ctl: [{ key: 'lr', label: 'Step η', min: 0.02, max: 0.4, scale: 'log', f: (v) => v.toFixed(3) }],
  view: { yaw: -10, pitch: 46 }, speed: 3,
  sheet: sheetGame,
  features: () => { PL.st = { C: curveInit(4, 2600), r0: 0.35, rad: [0, 0, 0, 0] }; },
  names: (S) => {
    S.marks.push({ p: { x: 0, y: 0 }, name: 'Equilibrium', sub: 'f = 0 · a saddle, not a minimum', sym: 'pass', pri: 9 });
    S.paths.push({ text: 'the first player moves along θ₁, downhill', pts: [-1.35, -0.04, 1.35, -0.04], size: 11, offset: 0.05 });
    S.paths.push({ text: 'the second along θ₂, uphill', pts: [-0.04, -0.85, -0.04, 0.85], size: 11, offset: 0.05 });
  },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 40) { nextRelease = STAT.steps + 45; return; }
    const a = RPLAN.range(0, TAU); st.r0 = RPLAN.range(0.28, 0.42);
    curveRace(st); raceSpawn([st.r0 * Math.cos(a), st.r0 * Math.sin(a)], PHONE ? 3 : 5, 0.004, st.C.cid);
    nextRelease = STAT.steps + 2700;
  },
  click: (x, y) => { const st = PL.st; st.r0 = Math.max(0.02, Math.hypot(x, y)); curveRace(st); raceSpawn([x, y], PHONE ? 3 : 5, 0.004, st.C.cid); nextRelease = STAT.steps + 2700; },
  frame: () => { if (STAT.alive === 0 && nextRelease - STAT.steps > 120) nextRelease = STAT.steps + 120; },
  step: (i) => {
    const st = PL.st, r = Math.hypot(Wx[i], Wy[i]);
    if (Tag[i] === st.C.cid) { curveAdd(st.C, Tr[i], Age[i], Math.log10(Math.max(1e-4, r))); st.rad[Tr[i]] = r; }
    if (r < 0.006) { Ex[i] = Wx[i]; Ey[i] = Wy[i]; retire(i, true); return false; }
  },
  readouts: () => TRIBES.map((T, t) => [T.name, PL.st.rad[t] ? `distance ${PL.st.rad[t].toFixed(3)}` : '…']),
  debug: () => {
    const st = PL.st, e = SIM.lr * GAME_A, m = TRIBES.map((T, t) => curveMean(st.C, t));
    const at = (t, k) => (Number.isFinite(m[t][k]) ? +m[t][k].toFixed(4) : null);
    return { r0: +st.r0.toFixed(3), at500: TRIBES.map((T, t) => at(t, 500)), simTheory500: +Math.log10(st.r0 * (1 + e * e) ** 250).toFixed(4), egTheory500: +Math.log10(st.r0 * (1 - e * e + e ** 4) ** 250).toFixed(4) };
  },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28, xm = st.C.len, e = SIM.lr * GAME_A;
    FIG.axes(c, x0, y0, x1, y1, 'steps', 'log₁₀ distance to the equilibrium');
    const r = figSeries(c, x0, y0, x1, y1, TRIBES.map((T, t) => ({ ys: curveMean(st.C, t), color: T.color, w: 1.5 })), { xmax: xm, ymin: -2.5, ymax: 0.3 });
    const th = (q) => { const ys = new Float64Array(xm); for (let k = 0; k < xm; k++) ys[k] = Math.log10(st.r0) + 0.5 * k * Math.log10(q); return ys; };
    figSeries(c, x0, y0, x1, y1, [{ ys: th(1 + e * e), color: INK, w: 1, dash: [3, 2], a: 0.7 }, { ys: th(1 - e * e + e ** 4), color: INK, w: 1, dash: [3, 2], a: 0.7 }], { xmax: xm, ymin: -2.5, ymax: 0.3 });
    for (const v of [-2, -1, 0]) FIG.tick(c, x0 - 3, r.ty(v), String(v), 'right', 'middle');
    FIG.tick(c, x1, y1 + 4, String(xm), 'right');
  },
});

// --- softmax policy gradient on a three-armed bandit: logits (θ₁, θ₂), θ₃ = 0, rewards 1, 0.8 and 0. Logit space
// is drawn in a projection whose rim is infinity, |x| = R|θ|/(|θ| + c), so every walk stays on the sheet
const BAND = { r: [1, 0.8, 0], A: 1.5, tau: 0.25, R: 0.97, c: 4, starts: [[0, 1], [0, 2], [-1, 2], [-0.5, 2.8], [-1, 3], [-1.5, 3.5], [-2, 4]] };
function banditPi(t1, t2, o) { const m = Math.max(t1, t2, 0), a = Math.exp(t1 - m), b = Math.exp(t2 - m), c = Math.exp(-m), z = a + b + c; o[0] = a / z; o[1] = b / z; o[2] = c / z; return o; }
const BPI = [0, 0, 0], BTH = [0, 0], BXY = [0, 0];
const banditJ = (p) => p[0] * BAND.r[0] + p[1] * BAND.r[1] + p[2] * BAND.r[2];
function bTheta(x, y, o) { const q = Math.hypot(x, y); if (q < 1e-12) { o[0] = o[1] = 0; return o; } const n = q >= BAND.R * 0.9999 ? 1e4 : BAND.c * q / (BAND.R - q); o[0] = x / q * n; o[1] = y / q * n; return o; }
function bMap(t1, t2, o) { const n = Math.hypot(t1, t2); if (n < 1e-12) { o[0] = o[1] = 0; return o; } const q = BAND.R * n / (n + BAND.c); o[0] = t1 / n * q; o[1] = t2 / n * q; return o; }
function sheetBandit(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0 });
  EXTRA = (x, y) => { bTheta(x, y, BTH); return BAND.A * (1 - banditJ(banditPi(BTH[0], BTH[1], BPI))); };
  sheetEnd(R, true);
}
// each optimizer returns its step in logits; the particle moves to where that lands on the projected sheet
const bStep = (dth) => (i, x, y, eta) => { bTheta(x, y, BTH); const d = dth(BTH[0], BTH[1], eta); bMap(BTH[0] + d[0], BTH[1] + d[1], BXY); return [BXY[0] - x, BXY[1] - y]; };
const BANDIT_TRIBES = [
  { k: 'sgd', name: 'Policy gradient', color: '#c22a40', kind: K_FN, sigMul: 0, rest: 'never', maxAge: 3200, rule: 'θ ← θ + η∇J(θ)',
    fn: bStep((t1, t2, e) => { const p = banditPi(t1, t2, BPI), j = banditJ(p), g3 = p[2] * (BAND.r[2] - j); return [e * (p[0] * (BAND.r[0] - j) - g3), e * (p[1] * (BAND.r[1] - j) - g3)]; }) },
  { k: 'sgd', name: 'Natural policy gradient', color: '#23708f', kind: K_FN, sigMul: 0, rest: 'never', maxAge: 3200, rule: 'θₐ ← θₐ + η rₐ, so π ← π·exp(ηr)/Z',
    fn: bStep((t1, t2, e) => [e * (BAND.r[0] - BAND.r[2]), e * (BAND.r[1] - BAND.r[2])]) },
  { k: 'sgd', name: 'Entropy-regularized', color: '#167a5b', kind: K_FN, sigMul: 0, rest: 'never', maxAge: 3200, rule: 'θ ← θ + η∇(J + τH)',
    fn: bStep((t1, t2, e) => {
      const p = banditPi(t1, t2, BPI), tau = BAND.tau, r = BAND.r;
      const v = p[0] * (r[0] - tau * Math.log(p[0])) + p[1] * (r[1] - tau * Math.log(p[1])) + p[2] * (r[2] - tau * Math.log(p[2]));
      const g3 = p[2] * (r[2] - tau * Math.log(p[2]) - v);          // all three logits move; subtracting θ₃’s step keeps θ₃ = 0
      return [e * (p[0] * (r[0] - tau * Math.log(p[0]) - v) - g3), e * (p[1] * (r[1] - tau * Math.log(p[1]) - v) - g3)];
    }) },
];
plate({
  id: 'softmax', ch: 6, seed: 3202,
  run: [
    null,
    null,
    null,
    null,
    null,
  ],
  status: 'established',
  tribes: BANDIT_TRIBES,
  sim: { lr: 0.4, noise: 0 },
  view: { yaw: -6, pitch: 50 }, speed: 4,
  sheet: sheetBandit,
  features: () => { PL.st = { k: 0, depth: 0, esc: TRIBES.map(() => []), stuck: TRIBES.map(() => []), cur: TRIBES.map(() => null), cid: 1, raced: false }; },
  names: (S) => {
    const at = (t1, t2) => bMap(t1, t2, [0, 0]);
    let p = at(14, 2); S.areas.push({ x: p[0], y: p[1], lines: ['Arm 1', 'r = 1'], size: 13, ls: 2.4 });
    p = at(-3, 9); S.areas.push({ x: p[0], y: p[1], lines: ['Terrace of arm 2', 'r = 0.8'], size: 13, ls: 2.4 });
    p = at(-7, -7); S.areas.push({ x: p[0], y: p[1], lines: ['Terrace of arm 3', 'r = 0'], size: 13, ls: 2.4 });
    const t = BAND.tau, th = [(BAND.r[0] - BAND.r[2]) / t, (BAND.r[1] - BAND.r[2]) / t], o = at(th[0], th[1]);
    S.marks.push({ p: { x: o[0], y: o[1] }, name: 'Regularized optimum', sub: `π ∝ exp(r/τ) · π₁ ${banditPi(th[0], th[1], [0, 0, 0])[0].toFixed(2)}`, sym: 'min', pri: 9 });
  },
  print: () => {             // where two arms are equally likely (rays from the origin), and the rim, which is infinity
    const c = sc, R = BAND.R, k = Math.SQRT1_2; c.save(); c.strokeStyle = 'rgba(36,38,43,0.55)'; c.lineWidth = 0.8; c.setLineDash([5, 3]);
    c.beginPath(); c.moveTo(ox(0), oy(0)); c.lineTo(ox(R * k), oy(R * k)); c.moveTo(ox(0), oy(0)); c.lineTo(ox(0), oy(-R)); c.moveTo(ox(0), oy(0)); c.lineTo(ox(-R), oy(0)); c.stroke();
    c.setLineDash([]); c.lineWidth = 1; c.beginPath(); c.arc(ox(0), oy(0), R * OPU, 0, TAU); c.stroke();
    c.font = `italic 400 ${11 * FS}px ${SERIF}`; c.fillStyle = 'rgba(36,38,43,0.75)'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('∞', ox(R * 0.995) + 6, oy(0)); c.restore();
  },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 40) { nextRelease = STAT.steps + 45; return; }
    const s = BAND.starts[st.k++ % BAND.starts.length];
    bRace(bMap(s[0], s[1], [0, 0]));
  },
  click: (x, y) => bRace([x, y]),
  frame: () => { if (STAT.alive === 0 && nextRelease - STAT.steps > 120) nextRelease = STAT.steps + 120; },
  step: (i) => {
    const st = PL.st; bTheta(Wx[i], Wy[i], BTH); const p = banditPi(BTH[0], BTH[1], BPI);
    if (Tag[i] === st.cid && st.cur[Tr[i]] === null && p[0] > Math.max(p[1], p[2])) { st.cur[Tr[i]] = Age[i]; st.esc[Tr[i]].push([st.depth, Age[i]]); if (st.esc[Tr[i]].length > 40) st.esc[Tr[i]].shift(); }
    if (TRIBES[Tr[i]].name === 'Entropy-regularized') {
      const o = BAND.tau;
      if (Math.hypot(BTH[0] - (BAND.r[0] - BAND.r[2]) / o, BTH[1] - (BAND.r[1] - BAND.r[2]) / o) < 0.02) { Ex[i] = Wx[i]; Ey[i] = Wy[i]; retire(i, true); return false; }
    } else if (p[0] > 0.995) { Ex[i] = Wx[i]; Ey[i] = Wy[i]; retire(i, true); return false; }
  },
  readouts: () => TRIBES.map((T, t) => [T.name, PL.st.cur[t] != null ? `out of the trap in ${PL.st.cur[t]} steps` : '…']),
  debug: () => ({ depth: PL.st.depth, esc: PL.st.esc.map((a) => a.slice(-8)), stuck: PL.st.stuck }),
  fig: (c, w, h) => {
    const st = PL.st, x0 = 32, y0 = 8, x1 = w - 8, y1 = h - 28, dmax = 6, lmax = Math.log10(3200);
    FIG.axes(c, x0, y0, x1, y1, 'depth of the start, θ₂ − θ₁', 'log₁₀ steps to escape');
    const tx = (d) => x0 + (x1 - x0) * d / dmax, ty = (v) => y1 - (y1 - y0) * v / (lmax + 0.25);
    const e = SIM.lr * (BAND.r[0] - BAND.r[1]);
    c.setLineDash([3, 2]); c.strokeStyle = 'rgba(36,38,43,0.6)'; c.lineWidth = 1; c.beginPath();
    for (let d = 0.2; d <= dmax; d += 0.1) { const v = Math.log10(Math.max(1, d / e)); if (d <= 0.21) c.moveTo(tx(d), ty(v)); else c.lineTo(tx(d), ty(v)); }
    c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(36,38,43,0.35)'; c.beginPath(); c.moveTo(x0, ty(lmax)); c.lineTo(x1, ty(lmax)); c.stroke();
    FIG.note(c, x1 - 2, ty(lmax) - 7, 'end of the race', 'rgba(36,38,43,0.55)', 'right');
    TRIBES.forEach((T, t) => {
      c.fillStyle = T.color;
      for (const [d, n] of st.esc[t]) { c.beginPath(); c.arc(tx(d), ty(Math.log10(Math.max(1, n))), 2.6, 0, TAU); c.fill(); }
      c.strokeStyle = T.color; c.lineWidth = 1.2;
      for (const d of st.stuck[t]) { c.beginPath(); c.arc(tx(d), ty(lmax), 2.6, 0, TAU); c.stroke(); }
    });
    for (const v of [1, 2, 3]) FIG.tick(c, x0 - 3, ty(v), String(v), 'right', 'middle');
    for (const d of [0, 2, 4, 6]) FIG.tick(c, tx(d), y1 + 4, String(d));
  },
});
function bRace(p) {
  const st = PL.st;
  if (st.raced) st.cur.forEach((v, t) => { if (v === null) { st.stuck[t].push(st.depth); if (st.stuck[t].length > 20) st.stuck[t].shift(); } });
  st.raced = true;
  bTheta(p[0], p[1], BTH); st.depth = +(BTH[1] - BTH[0]).toFixed(2); st.cur = TRIBES.map(() => null); st.cid++;
  raceSpawn(p, PHONE ? 3 : 5, 0.003, st.cid);
  nextRelease = STAT.steps + 3300;
}

// --- the road to infinity: logistic regression on separable data, in an azimuthal projection of weight space
// whose radius grows like log ‖w‖. Particles step in weight space; only the drawing is projected
const MM = {
  Z: [[1.815, 0.835], [0.015, 0.663], [1.893, 0.834], [-0.203, 1.047], [1.695, 0.845], [-0.1, 1], [1.642, 0.726], [0.006, 0.771], [1.639, 0.922], [-0.193, 0.914], [1.621, 0.97], [-0.214, 0.904], [1.757, 0.685], [-0.125, 0.959]],
  r0: 0.5, rmax: 1500, q1: 0.95, A: 1.8, D: 8, nq: 480, na: 720, minT: null, roads: null,
};
MM.K = Math.log(1 + MM.rmax / MM.r0) / MM.q1;
function mmW(x, y, o) { const q = Math.hypot(x, y); if (q < 1e-12) { o[0] = o[1] = 0; return o; } const r = MM.r0 * (Math.exp(MM.K * q) - 1); o[0] = x * r / q; o[1] = y * r / q; return o; }
function mmP(w0, w1, o) { const r = Math.hypot(w0, w1); if (r < 1e-12) { o[0] = o[1] = 0; return o; } const q = Math.log(1 + r / MM.r0) / MM.K; o[0] = w0 * q / r; o[1] = w1 * q / r; return o; }
function mmLogF(w0, w1) {    // log of the mean logistic loss, stable for margins of any size
  let mx = -Infinity; const lt = MM._lt || (MM._lt = new Float64Array(MM.Z.length));
  for (let k = 0; k < MM.Z.length; k++) { const m = w0 * MM.Z[k][0] + w1 * MM.Z[k][1]; lt[k] = m > 30 ? -m : m < -30 ? Math.log(-m) : Math.log(Math.log1p(Math.exp(-m))); if (lt[k] > mx) mx = lt[k]; }
  let s = 0; for (let k = 0; k < MM.Z.length; k++) s += Math.exp(lt[k] - mx);
  return mx + Math.log(s / MM.Z.length);
}
function mmGrad(w0, w1, o) { let a = 0, b = 0; for (const z of MM.Z) { const m = w0 * z[0] + w1 * z[1], s = m > 30 ? -Math.exp(-m) : -1 / (1 + Math.exp(m)); a += s * z[0]; b += s * z[1]; } o[0] = a / MM.Z.length; o[1] = b / MM.Z.length; return o; }
function mmMaxMargin(norm) { let best = -Infinity, ba = 0; for (let k = 0; k < 72000; k++) { const a = k / 72000 * TAU, u0 = Math.cos(a), u1 = Math.sin(a), n = norm === 2 ? 1 : Math.max(Math.abs(u0), Math.abs(u1)); let m = Infinity; for (const z of MM.Z) m = Math.min(m, (u0 * z[0] + u1 * z[1]) / n); if (m > best) { best = m; ba = a; } } return { a: ba, m: best }; }
function mmSetup() {          // the lowest log-loss on each circle ‖w‖ = r, and the two max-margin directions
  if (MM.minT) return;
  const T = new Float64Array(MM.nq + 1), qmax = 2;
  for (let j = 0; j <= MM.nq; j++) { const q = qmax * j / MM.nq, r = MM.r0 * (Math.exp(MM.K * q) - 1); let mn = Infinity; for (let k = 0; k < MM.na; k++) { const a = k / MM.na * TAU; mn = Math.min(mn, mmLogF(r * Math.cos(a), r * Math.sin(a))); } T[j] = mn; }
  MM.minT = T; MM.qmax = qmax;
  MM.roads = { l2: mmMaxMargin(2), li: mmMaxMargin('inf') };
}
const MMW = [0, 0], MMG = [0, 0], MMP = [0, 0];
function sheetMargin(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0 });
  mmSetup();
  EXTRA = (x, y) => {
    const q = Math.hypot(x, y), u = Math.min(q / MM.qmax, 1) * MM.nq, j = Math.min(MM.nq - 1, Math.floor(u)), f = u - j;
    const base = MM.minT[j] * (1 - f) + MM.minT[j + 1] * f;
    mmW(x, y, MMW);
    const ex = Math.max(0, mmLogF(MMW[0], MMW[1]) - base);
    return MM.A * (1 - Math.exp(-ex / MM.D));
  };
  sheetEnd(R, true);
}
const mmStep = (upd) => (i, x, y) => { mmW(x, y, MMW); mmGrad(MMW[0], MMW[1], MMG); upd(MMW, MMG); mmP(MMW[0], MMW[1], MMP); return [MMP[0] - x, MMP[1] - y]; };
const MM_TRIBES = [
  { k: 'sgd', name: 'Gradient descent', color: '#c22a40', kind: K_FN, sigMul: 0, rest: 'never', maxAge: 6000, rule: 'w ← w − η∇L, η = 1',
    fn: mmStep((w, g) => { w[0] -= g[0]; w[1] -= g[1]; }) },
  { k: 'sgd', name: 'Normalized descent', color: '#4b3fa0', kind: K_FN, sigMul: 0, rest: 'never', maxAge: 6000, rule: 'w ← w − η∇L/‖∇L‖₂, η = 0.2',
    fn: mmStep((w, g) => { const n = Math.hypot(g[0], g[1]) || 1; w[0] -= 0.2 * g[0] / n; w[1] -= 0.2 * g[1] / n; }) },
  { k: 'sgd', name: 'Sign descent', color: '#5e7316', kind: K_FN, sigMul: 0, rest: 'never', maxAge: 6000, rule: 'w ← w − η sign(∇L), η = 0.2',
    fn: mmStep((w, g) => { w[0] -= 0.2 * Math.sign(g[0]); w[1] -= 0.2 * Math.sign(g[1]); }) },
];
const mmQ = (r) => Math.log(1 + r / MM.r0) / MM.K;
plate({
  id: 'margin', ch: 6, seed: 3203,
  run: [
    (T) => { T.clear(); T.release('Origin'); },
    null,
    null,
    (T) => { T.clear(); const a = RPLAN.range(0, TAU), q = RPLAN.range(0.12, 0.25); T.release(q * Math.cos(a), q * Math.sin(a)); },
  ],
  status: 'established',
  tribes: MM_TRIBES,
  sim: { lr: 1, noise: 0 },
  view: { yaw: -4, pitch: 54 }, speed: 6,
  sheet: sheetMargin,
  features: () => { PL.st = { C: curveInit(3, 6000), cid: 1, ang: [null, null, null], nrm: [0, 0, 0] }; },
  names: (S) => {
    const ro = MM.roads, q = mmQ(1000);
    for (const [k, txt] of [['l2', 'ℓ₂ max-margin road'], ['li', 'ℓ∞ max-margin road']]) { const a = ro[k].a; S.paths.push({ text: txt, pts: [0.25 * Math.cos(a), 0.25 * Math.sin(a), q * Math.cos(a), q * Math.sin(a)], size: 11.5, offset: 0.035 }); }
    S.marks.push({ p: { x: 0, y: 0 }, name: 'Origin', sub: 'w = 0 · L = log 2', sym: 'peak', pri: 6, pin: false });
  },
  print: () => {
    const c = sc; c.save(); c.strokeStyle = 'rgba(36,38,43,0.5)'; c.lineWidth = 0.7; c.setLineDash([2, 3]);
    c.font = `400 ${7 * FS}px ${MONO}`; c.fillStyle = 'rgba(36,38,43,0.7)'; c.textAlign = 'left'; c.textBaseline = 'middle';
    for (const r of [1, 10, 100, 1000]) { const q = mmQ(r); c.beginPath(); c.arc(ox(0), oy(0), q * OPU, 0, TAU); c.stroke(); c.fillText(`‖w‖ ${r}`, ox(q * 0.72) + 3, oy(-q * 0.69)); }
    c.restore();
  },
  lines: () => { const ro = MM.roads, q = mmQ(MM.rmax); for (const [k, col] of [['l2', '#4b3fa0'], ['li', '#5e7316']]) { const a = ro[k].a; line(drape([0, 0, q * Math.cos(a), q * Math.sin(a)]), col, 1.6, 0.03, true, 0.85); } },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 40) { nextRelease = STAT.steps + 45; return; }
    const p = st.cid === 1 ? [0, 0] : [RPLAN.range(-0.25, 0.25), RPLAN.range(-0.25, 0.25)];
    mmRace(p);
  },
  click: (x, y) => mmRace([x, y]),
  frame: () => { if (STAT.alive === 0 && nextRelease - STAT.steps > 120) nextRelease = STAT.steps + 120; },
  step: (i) => {
    const st = PL.st; if (Tag[i] !== st.cid) return;
    mmW(Wx[i], Wy[i], MMW); const a = Math.atan2(MMW[1], MMW[0]) * 180 / Math.PI;
    curveAdd(st.C, Tr[i], Age[i], a); st.ang[Tr[i]] = a; st.nrm[Tr[i]] = Math.hypot(MMW[0], MMW[1]);
  },
  readouts: () => [['roads', `ℓ₂ ${(MM.roads.l2.a * 180 / Math.PI).toFixed(1)}° · ℓ∞ ${(MM.roads.li.a * 180 / Math.PI).toFixed(1)}°`]].concat(TRIBES.map((T, t) => [T.name, PL.st.ang[t] == null ? '…' : `${PL.st.ang[t].toFixed(1)}° · ‖w‖ ${PL.st.nrm[t].toFixed(PL.st.nrm[t] < 100 ? 1 : 0)}`])),
  debug: () => ({ l2: +(MM.roads.l2.a * 180 / Math.PI).toFixed(2), li: +(MM.roads.li.a * 180 / Math.PI).toFixed(2), ang: PL.st.ang.map((v) => (v == null ? null : +v.toFixed(2))), nrm: PL.st.nrm.map((v) => +v.toFixed(1)) }),
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28, n = st.C.len, lx = Math.log10(n);
    const a2 = MM.roads.l2.a * 180 / Math.PI, ai = MM.roads.li.a * 180 / Math.PI, lo = Math.min(a2, ai) - 30, hi = Math.max(a2, ai) + 15;
    FIG.axes(c, x0, y0, x1, y1, 'log₁₀ steps', 'direction of w (degrees)');
    const tx = (k) => x0 + (x1 - x0) * Math.log10(Math.max(1, k)) / lx, ty = (v) => y1 - (y1 - y0) * (v - lo) / (hi - lo);
    for (const [v, col, txt] of [[a2, '#4b3fa0', 'ℓ₂ road'], [ai, '#5e7316', 'ℓ∞ road']]) { c.setLineDash([3, 2]); c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, ty(v)); c.lineTo(x1, ty(v)); c.stroke(); c.setLineDash([]); FIG.note(c, x0 + 6, ty(v) - 7, txt, col); }
    TRIBES.forEach((T, t) => {
      const m = curveMean(st.C, t); c.strokeStyle = T.color; c.lineWidth = 1.5; c.beginPath(); let on = false;
      for (let k = 4; k < n; k++) { const v = m[k]; if (!Number.isFinite(v)) { on = false; continue; } const X = tx(k), Y = clamp(ty(v), y0 - 2, y1 + 2); if (on) c.lineTo(X, Y); else c.moveTo(X, Y); on = true; }
      c.stroke();
    });
    for (const k of [1, 10, 100, 1000]) FIG.tick(c, tx(k), y1 + 4, String(Math.log10(k)));
    for (const v of [Math.round(lo / 10) * 10 + 10, Math.round(hi / 10) * 10 - 10]) FIG.tick(c, x0 - 3, ty(v), `${v}°`, 'right', 'middle');
  },
});
function mmRace(p) {
  const st = PL.st; curveReset(st.C); st.cid = st.C.cid; st.ang = [null, null, null];
  raceSpawn(p, PHONE ? 3 : 5, 0.002, st.cid);
  nextRelease = STAT.steps + 6100;
}
// ch7>>
// <<ch8
// ---------------------------------------------------------------------------------------------
// VIII · After pretraining: preference optimization, reinforcement learning from verifiable rewards and safety
// fine-tuning, each on a sheet small enough to be exact. Three plates draw an unbounded space (a hidden state, or a
// policy's logits) in the projection of 'The pull of softmax' (bMap, bTheta: directions true, the rim is infinity);
// the safety plate is a slice of weight space
// ---------------------------------------------------------------------------------------------
function rimPrint(rays) {      // the rim of the projection, and dashed rays where two answers are equally likely
  const c = sc, R = BAND.R; c.save(); c.strokeStyle = 'rgba(36,38,43,0.55)'; c.lineWidth = 0.8; c.setLineDash([5, 3]);
  c.beginPath(); for (const a of rays) { c.moveTo(ox(0), oy(0)); c.lineTo(ox(R * Math.cos(a)), oy(R * Math.sin(a))); } c.stroke();
  c.setLineDash([]); c.lineWidth = 1; c.beginPath(); c.arc(ox(0), oy(0), R * OPU, 0, TAU); c.stroke();
  c.font = `italic 400 ${11 * FS}px ${SERIF}`; c.fillStyle = 'rgba(36,38,43,0.75)'; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText('∞', ox(R * 0.995) + 6, oy(0)); c.restore();
}
function isoPrint(G, levs, color, dash, fmt, frac = 0.5) {   // iso-lines of a derived field, each labelled on its longest chain
  const c = sc;
  for (const lev of levs) {
    const ch = isoChains(G.G, G.W, G.H, X0, Y0, G.dx, G.dy, lev); if (!ch.length) continue;
    strokeChains(ch, color, 0.85, dash);
    let best = ch[0]; for (const p of ch) if (p.length > best.length) best = p;
    if (best.length < 12) continue;
    const k = 2 * Math.floor(best.length / 2 * frac), x = best[k], y = best[k + 1], txt = fmt(lev);
    c.save(); c.font = `400 ${7.5 * FS}px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(txt).width; c.fillStyle = 'rgba(236,239,233,0.92)'; c.fillRect(x - w / 2 - 2, y - 5.5 * FS, w + 4, 11 * FS);
    c.fillStyle = color; c.fillText(txt, x, y); c.restore();
  }
}
const ch8Wait = () => { if (STAT.alive === 0 && nextRelease - STAT.steps > 120) nextRelease = STAT.steps + 120; };

// --- likelihood displacement. The particle is the last hidden state h ∈ R² of one prompt; a frozen unembedding gives
// four one-word answers the logits zₖ = ⟨wₖ, h⟩ with |wₖ| = 1. The sheet is 1 − π(No) − π(Never): the chance that the
// answer does not mean no. With one prompt and one-token answers, log π(No) − log π(rej) = ⟨w₊ − w₋, h⟩, so every preference loss
// moves h along the fixed direction d = w₊ − w₋
const DPX = { A: 1.5, deg: [-75, -105, 10, 175], word: ['No', 'Never', 'Yes', 'Unsure'], beta: 1, tau: 0.5, alpha: 0.3, h0: [0, -3], rej: 1, races: [1, 3], T: 3000 };
DPX.W = DPX.deg.map((a) => [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)]);
const DPI = [0, 0, 0, 0], DH = [0, 0], DXY = [0, 0], DPI2 = [0, 0, 0, 0], DH2 = [0, 0];
function dpxPi(h0, h1, o) {
  let m = -Infinity; for (let k = 0; k < 4; k++) { o[k] = DPX.W[k][0] * h0 + DPX.W[k][1] * h1; if (o[k] > m) m = o[k]; }
  let s = 0; for (let k = 0; k < 4; k++) { o[k] = Math.exp(o[k] - m); s += o[k]; }
  for (let k = 0; k < 4; k++) o[k] /= s;
  return o;
}
const dpxD = () => { const w = DPX.W[0], v = DPX.W[DPX.rej]; return [w[0] - v[0], w[1] - v[1]]; };
const dpxM = (h) => { const d = dpxD(), r = PL.st.h0; return d[0] * (h[0] - r[0]) + d[1] * (h[1] - r[1]); };   // the margin over the reference model
const dpxSig = (v) => 1 / (1 + Math.exp(-v));
function sheetDisplace(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0 });
  EXTRA = (x, y) => { bTheta(x, y, DH2); const q = dpxPi(DH2[0], DH2[1], DPI2); return DPX.A * (q[2] + q[3]); };
  sheetEnd(R, true);
}
const dpxStep = (dh) => (i, x, y, eta) => { bTheta(x, y, DH); const p = dpxPi(DH[0], DH[1], DPI), s = dh(i, DH, p, eta); bMap(DH[0] + s[0], DH[1] + s[1], DXY); return [DXY[0] - x, DXY[1] - y]; };
const DPX_TRIBES = [
  { k: 'sgd', name: 'DPO', color: '#c22a40', kind: K_FN, sigMul: 0, rest: 'never', maxAge: DPX.T, rule: 'h ← h + ηβσ(−βm)(w₊ − w₋)',
    fn: dpxStep((i, h, p, e) => {
      const d = dpxD(), W = DPX.W; let q = 0; for (let k = 0; k < 4; k++) q += p[k] * (W[k][0] * d[0] + W[k][1] * d[1]);
      Sx[i] = p[0]; Sy[i] = Math.sign(W[0][0] * d[0] + W[0][1] * d[1] - q);      // predicted sign of the change in π(No)
      if (Age[i] === 0) { Ax[i] = h[0]; Ay[i] = h[1]; }                          // this particle's own start
      const g = e * DPX.beta * dpxSig(-DPX.beta * dpxM(h)); return [g * d[0], g * d[1]];
    }) },
  { k: 'sgd', name: 'IPO', color: '#23708f', kind: K_FN, sigMul: 0, rest: 'never', maxAge: DPX.T, rule: 'h ← h − 2η(m − 1/2τ)(w₊ − w₋)',
    fn: dpxStep((i, h, p, e) => { const d = dpxD(), g = -2 * e * (dpxM(h) - 1 / (2 * DPX.tau)); return [g * d[0], g * d[1]]; }) },
  { k: 'sgd', name: 'DPO + NLL', color: '#167a5b', kind: K_FN, sigMul: 0, rest: 'never', maxAge: DPX.T, rule: 'adds α∇log π(No) = α(w₊ − w̄)',
    fn: dpxStep((i, h, p, e) => {
      const d = dpxD(), W = DPX.W, g = e * DPX.beta * dpxSig(-DPX.beta * dpxM(h));
      let a = W[0][0], b = W[0][1]; for (let k = 0; k < 4; k++) { a -= p[k] * W[k][0]; b -= p[k] * W[k][1]; }
      return [g * d[0] + e * DPX.alpha * a, g * d[1] + e * DPX.alpha * b];
    }) },
];
function dpxRace(p) {
  const st = PL.st; curveReset(st.C); curveReset(st.Y); st.cid = st.C.cid;
  st.h0 = bTheta(p[0], p[1], [0, 0]); st.cross = null; st.mCross = null; st.bad = 0; st.n = 0; st.badAt = [];
  st.pNo = [null, null, null]; st.pYes = [null, null, null]; st.peak = [0, 0, 0];
  const d = dpxD(), dn = Math.hypot(d[0], d[1]), a = [DPX.W[2][0] - DPX.W[0][0], DPX.W[2][1] - DPX.W[0][1]], ad = (a[0] * d[0] + a[1] * d[1]) / dn;
  st.mc = ad > 1e-9 ? -(a[0] * st.h0[0] + a[1] * st.h0[1]) / ad * dn : null;         // margin at which Yes overtakes No on DPO's line
  raceSpawn(p, PHONE ? 3 : 5, 0.003, st.cid);
  nextRelease = STAT.steps + DPX.T + 100; linesDirty = true; printDirty = true;
}
plate({
  id: 'displace', ch: 7, seed: 3301,
  run: [
    (T) => { T.clear(); T.release(...bMap(DPX.h0[0], DPX.h0[1], [0, 0])); },
    null,
    null,
    (T) => { T.clear(); DPX.rej = DPX.word.indexOf('Unsure'); dpxRace(bMap(DPX.h0[0], DPX.h0[1], [0, 0])); },
  ],
  status: 'established',
  tribes: DPX_TRIBES,
  sim: { lr: 0.05, noise: 0 },
  ctl: [{ key: 'lr', label: 'Step η', min: 0.01, max: 0.2, scale: 'log', f: (v) => v.toFixed(3) }],
  view: { yaw: -8, pitch: 50 }, speed: 4, liveNames: true,
  sheet: sheetDisplace,
  features: () => { PL.st = { C: curveInit(3, DPX.T), Y: curveInit(1, DPX.T), h0: DPX.h0.slice(), k: 0, cid: 1, pNo: [null, null, null], pYes: [null, null, null], peak: [0, 0, 0], cross: null, mCross: null, mc: null, bad: 0, n: 0, badAt: [] }; },
  names: (S) => {
    const sub = DPX.word.map((w, k) => (k === 0 ? 'the chosen answer' : k === DPX.rej ? 'the rejected answer' : '')), mid = [-55, -125, 30, 150];     // the middle of each territory, in degrees
    for (let k = 0; k < 4; k++) { const a = mid[k] * Math.PI / 180, p = bMap(11 * Math.cos(a), 11 * Math.sin(a), [0, 0]); S.areas.push({ x: p[0], y: p[1], lines: [`“${DPX.word[k]}”`].concat(sub[k] ? [sub[k]] : []), size: 13, ls: 2.4 }); }
    const h = PL.st.h0, p = bMap(h[0], h[1], [0, 0]), q = dpxPi(h[0], h[1], [0, 0, 0, 0]);
    S.marks.push({ p: { x: p[0], y: p[1] }, name: 'Reference model', sub: `π(No) ${q[0].toFixed(2)} · π(${DPX.word[DPX.rej]}) ${q[DPX.rej].toFixed(2)}`, sym: 'x', pri: 9 });
  },
  print: () => {
    const r = DPX.deg.map((a) => a * Math.PI / 180), o = [1, 0, 2, 3];      // answers in angular order: Never, No, Yes, Unsure
    const rays = []; for (let k = 0; k < 4; k++) { let a = r[o[k]], b = r[o[(k + 1) % 4]]; if (b < a) b += TAU; rays.push((a + b) / 2); }
    rimPrint(rays);
  },
  lines: () => {     // the line DPO and IPO travel: the reference model plus multiples of d, for the pair being raced
    const st = PL.st; if (!st) return;
    const d = dpxD(), n = Math.hypot(d[0], d[1]), pts = [];
    for (let s = 0; s <= 60; s += s < 10 ? 0.1 : 0.5) { const q = bMap(st.h0[0] + s * d[0] / n, st.h0[1] + s * d[1] / n, [0, 0]); pts.push(q[0], q[1]); }
    line(drape(pts), '#c22a40', 1.1, 0.02, true, 0.55);
  },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 40) { nextRelease = STAT.steps + 45; return; }
    DPX.rej = DPX.races[st.k++ % DPX.races.length];
    dpxRace(bMap(DPX.h0[0], DPX.h0[1], [0, 0]));
  },
  click: (x, y) => { DPX.rej = 1; dpxRace([x, y]); },
  frame: ch8Wait,
  step: (i) => {
    const st = PL.st; if (Tag[i] !== st.cid) return;
    bTheta(Wx[i], Wy[i], DH); const p = dpxPi(DH[0], DH[1], DPI), t = Tr[i], a = Age[i];
    curveAdd(st.C, t, a, p[0]); st.pNo[t] = p[0]; st.pYes[t] = p[2]; if (p[0] > st.peak[t]) st.peak[t] = p[0];
    if (t === 0) {
      curveAdd(st.Y, 0, a, p[2]);
      if (st.cross === null && p[2] > p[0]) {        // the margin gained since its own start, against the line's crossing point
        const d = dpxD(), dn = Math.hypot(d[0], d[1]), u = [DPX.W[2][0] - DPX.W[0][0], DPX.W[2][1] - DPX.W[0][1]], ud = (u[0] * d[0] + u[1] * d[1]) / dn;
        st.cross = a; st.mCross = d[0] * (DH[0] - Ax[i]) + d[1] * (DH[1] - Ay[i]); st.mc = -(u[0] * Ax[i] + u[1] * Ay[i]) / ud * dn;
      }
      const s = Math.sign(p[0] - Sx[i]); if (s !== 0) { st.n++; if (s !== Sy[i]) { st.bad++; st.badAt.push(+Sx[i].toFixed(3)); if (st.badAt.length > 12) st.badAt.shift(); } }
    } else if (t === 1 && Math.abs(dpxM(DH) - 1 / (2 * DPX.tau)) < 1e-5) { Ex[i] = Wx[i]; Ey[i] = Wy[i]; retire(i, true); return false; }
  },
  readouts: () => [['pair', `No over ${DPX.word[DPX.rej]}`]].concat(TRIBES.map((T, t) => [T.name, PL.st.pNo[t] == null ? '…' : `π(No) ${PL.st.pNo[t].toFixed(3)} · π(Yes) ${PL.st.pYes[t].toFixed(3)}`])),
  debug: () => { const st = PL.st, f = (v) => (v == null ? null : +v.toFixed(4)); return { rej: DPX.word[DPX.rej], cross: st.cross, mCross: f(st.mCross), mTheory: f(st.mc), peak: st.peak.map(f), pNo: st.pNo.map(f), pYes: st.pYes.map(f), signBad: st.bad, signN: st.n, badAt: st.badAt }; },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28, xm = DPX.T;
    FIG.axes(c, x0, y0, x1, y1, 'steps', 'π(No), the chosen answer');
    const r = figSeries(c, x0, y0, x1, y1, TRIBES.map((T, t) => ({ ys: curveMean(st.C, t), color: T.color, w: 1.5 })), { xmax: xm, ymin: 0, ymax: 1 });
    figSeries(c, x0, y0, x1, y1, [{ ys: curveMean(st.Y, 0), color: TRIBES[0].color, w: 1, dash: [3, 2], a: 0.85 }], { xmax: xm, ymin: 0, ymax: 1 });
    if (DPX.rej === 1) FIG.note(c, x1 - 4, r.ty(0.68), 'π(Yes) under DPO', TRIBES[0].color, 'right');
    for (const v of [0, 0.5, 1]) FIG.tick(c, x0 - 3, r.ty(v), String(v), 'right', 'middle');
    FIG.tick(c, x1, y1 + 4, String(xm), 'right');
  },
});

// --- entropy collapse under RL from verifiable rewards. A policy over three solution strategies, logits (θ₁, θ₂, 0),
// for two kinds of problem; the verifier passes strategy a on kind j with probability P[a][j]
const ENT = { A: 1.6, w: [0.6, 0.4], P: [[0.9, 0], [0.4, 0.45], [0.1, 0.05]], k: 16, G: 8, tau: 0.2, word: ['Shortcut', 'Derivation', 'Guess'], T: 3000,
  starts: [[0.3, 0.2, 0.5], [0.45, 0.25, 0.3], [0.2, 0.15, 0.65], [0.34, 0.33, 0.33]], best: null };
const EPI = [0, 0, 0], ETH = [0, 0], EXY = [0, 0], EQ = [0, 0], EDIR = [0, 0], EPI2 = [0, 0, 0], ETH2 = [0, 0];
const entQ = (p, o) => { for (let j = 0; j < 2; j++) o[j] = p[0] * ENT.P[0][j] + p[1] * ENT.P[1][j] + p[2] * ENT.P[2][j]; return o; };
const entPass1 = (p) => { entQ(p, EQ); return ENT.w[0] * EQ[0] + ENT.w[1] * EQ[1]; };
const entPassK = (p, k = ENT.k) => { entQ(p, EQ); return ENT.w[0] * (1 - (1 - EQ[0]) ** k) + ENT.w[1] * (1 - (1 - EQ[1]) ** k); };
const entLog = (v) => Math.log(Math.max(v, 1e-300));
const entH = (p) => -(p[0] * entLog(p[0]) + p[1] * entLog(p[1]) + p[2] * entLog(p[2]));
const entLogits = (p) => [Math.log(p[0] / p[2]), Math.log(p[1] / p[2])];
const ENT_A = new Uint8Array(16), ENT_R = new Float64Array(16);
function entGrpo(p, o) {      // one GRPO step's direction: a group of G rollouts on each kind of problem, advantage (r − mean)/std
  o[0] = o[1] = 0;
  for (let j = 0; j < 2; j++) {
    let m = 0;
    for (let g = 0; g < ENT.G; g++) { const u = NR(), a = u < p[0] ? 0 : u < p[0] + p[1] ? 1 : 2; ENT_A[g] = a; ENT_R[g] = NR() < ENT.P[a][j] ? 1 : 0; m += ENT_R[g]; }
    m /= ENT.G; let v = 0; for (let g = 0; g < ENT.G; g++) v += (ENT_R[g] - m) ** 2;
    const sd = Math.sqrt(v / ENT.G); if (sd < 1e-9) continue;                 // a group that all passed or all failed teaches nothing
    for (let g = 0; g < ENT.G; g++) { const adv = ENT.w[j] * (ENT_R[g] - m) / sd / ENT.G; o[0] += adv * ((ENT_A[g] === 0) - p[0]); o[1] += adv * ((ENT_A[g] === 1) - p[1]); }
  }
  return o;
}
function sheetEntropy(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0 });
  EXTRA = (x, y) => { bTheta(x, y, ETH2); return ENT.A * (1 - entPass1(banditPi(ETH2[0], ETH2[1], EPI2))); };
  sheetEnd(R, true);
  if (!ENT.best) {          // the policy with the highest pass@16, searched over logits
    let b = -1, at = null; for (let i = 0; i <= 160; i++) for (let j = 0; j <= 160; j++) { const t1 = -8 + i * 0.1, t2 = -8 + j * 0.1, v = entPassK(banditPi(t1, t2, EPI2)); if (v > b + 1e-9) { b = v; at = [t1, t2]; } }
    ENT.best = { th: at, v: b, p1: entPass1(banditPi(at[0], at[1], EPI2)) };
  }
}
// every optimizer also accumulates the first-order entropy change of its steps, −Cov_π(log π, Δz), in Sx (Sy holds the start)
const entStep = (dir) => (i, x, y, eta) => {
  bTheta(x, y, ETH); const p = banditPi(ETH[0], ETH[1], EPI), d = dir(p, EDIR), d0 = eta * d[0], d1 = eta * d[1];
  if (Age[i] === 0) Sy[i] = entH(p);
  const l0 = entLog(p[0]), l1 = entLog(p[1]), l2 = entLog(p[2]), El = p[0] * l0 + p[1] * l1 + p[2] * l2, Ed = p[0] * d0 + p[1] * d1;
  Sx[i] -= p[0] * (l0 - El) * (d0 - Ed) + p[1] * (l1 - El) * (d1 - Ed) - p[2] * (l2 - El) * Ed;
  bMap(ETH[0] + d0, ETH[1] + d1, EXY); return [EXY[0] - x, EXY[1] - y];
};
const ENT_TRIBES = [
  { k: 'sgd', name: 'GRPO', color: '#c22a40', kind: K_FN, sigMul: 0, rest: 'never', maxAge: ENT.T, rule: 'groups of 8, advantage (r − r̄)/σ',
    fn: entStep((p, o) => entGrpo(p, o)) },
  { k: 'sgd', name: 'GRPO + entropy bonus', color: '#167a5b', kind: K_FN, sigMul: 0, rest: 'never', maxAge: ENT.T, rule: 'adds τ∇H, τ = 0.2',
    fn: entStep((p, o) => { entGrpo(p, o); const h = entH(p); o[0] -= ENT.tau * p[0] * (entLog(p[0]) + h); o[1] -= ENT.tau * p[1] * (entLog(p[1]) + h); return o; }) },
  { k: 'sgd', name: 'Pass@16 objective', color: '#23708f', kind: K_FN, sigMul: 0, rest: 'never', maxAge: ENT.T, rule: 'θ ← θ + η∇pass@16, exact',
    fn: entStep((p, o) => {
      entQ(p, EQ); o[0] = o[1] = 0;
      for (let j = 0; j < 2; j++) { const c = ENT.w[j] * ENT.k * (1 - EQ[j]) ** (ENT.k - 1); for (let b = 0; b < 2; b++) o[b] += c * p[b] * (ENT.P[b][j] - EQ[j]); }
      return o;
    }) },
];
function entRace(p) {
  const st = PL.st; curveReset(st.H); curveReset(st.Pd); st.cid = st.H.cid;
  st.cur = TRIBES.map(() => null); st.p0 = banditPi(...bTheta(p[0], p[1], [0, 0]), [0, 0, 0]);
  raceSpawn(p, PHONE ? 3 : 5, 0.003, st.cid);
  nextRelease = STAT.steps + ENT.T + 100; printDirty = true;
}
plate({
  id: 'entropy', ch: 7, seed: 3302,
  run: [
    null,
    null,
    null,
    (T) => { T.clear(); const th = entLogits(ENT.starts.find((q) => q[2] === 0.65)); T.release(...bMap(th[0], th[1], [0, 0])); },
  ],
  status: 'contested',
  tribes: ENT_TRIBES,
  sim: { lr: 0.15, noise: 0 },
  ctl: [{ key: 'lr', label: 'Step η', min: 0.03, max: 0.6, scale: 'log', f: (v) => v.toFixed(3) }],
  view: { yaw: -6, pitch: 50 }, speed: 4, liveNames: true,
  sheet: sheetEntropy,
  features: () => { PL.st = { H: curveInit(3, ENT.T), Pd: curveInit(1, ENT.T), cid: 1, k: 0, cur: [null, null, null], p0: ENT.starts[0].slice() }; },
  names: (S) => {
    const at = (t1, t2) => bMap(t1, t2, [0, 0]), sc1 = ENT.P.map((r) => ENT.w[0] * r[0] + ENT.w[1] * r[1]);
    [[14, 2], [-3, 9], [-7, -7]].forEach((q, k) => { const p = at(q[0], q[1]); S.areas.push({ x: p[0], y: p[1], lines: [ENT.word[k], `pass@1 ${sc1[k].toFixed(2)}`], size: 13, ls: 2.4 }); });
    const b = PL.st.p0, th = entLogits(b), p = at(th[0], th[1]);
    S.marks.push({ p: { x: p[0], y: p[1] }, name: 'Base model', sub: `pass@1 ${entPass1(b).toFixed(2)} · pass@16 ${entPassK(b).toFixed(2)}`, sym: 'x', pri: 9 });
    if (ENT.best) { const q = at(ENT.best.th[0], ENT.best.th[1]); S.marks.push({ p: { x: q[0], y: q[1] }, name: 'Best pass@16', sub: `pass@16 ${ENT.best.v.toFixed(4)} · pass@1 ${ENT.best.p1.toFixed(2)}`, sym: 'peak', pri: 7 }); }
  },
  print: () => {
    rimPrint([Math.PI / 4, -Math.PI / 2, Math.PI]);
    if (!ENT.F16) ENT.F16 = fieldGrid((x, y) => { bTheta(x, y, ETH2); return entPassK(banditPi(ETH2[0], ETH2[1], EPI2)); }, 160);
    isoPrint(ENT.F16, [0.7, 0.8, 0.9, 0.99], 'rgba(35,112,143,0.85)', [4, 2.5], (v) => `pass@16 ${v}`, 0.35);
  },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 40) { nextRelease = STAT.steps + 45; return; }
    const th = entLogits(ENT.starts[st.k++ % ENT.starts.length]);
    entRace(bMap(th[0], th[1], [0, 0]));
  },
  click: (x, y) => entRace([x, y]),
  frame: ch8Wait,
  step: (i) => {
    const st = PL.st; if (Tag[i] !== st.cid) return;
    bTheta(Wx[i], Wy[i], ETH); const p = banditPi(ETH[0], ETH[1], EPI), t = Tr[i], h = entH(p);
    curveAdd(st.H, t, Age[i], h); if (t === 0) curveAdd(st.Pd, 0, Age[i], Sy[i] + Sx[i]);
    st.cur[t] = [entPass1(p), entPassK(p), h, Sy[i] + Sx[i]];
  },
  readouts: () => [['base', `π₀ ${PL.st.p0.map((v) => v.toFixed(2)).join(' · ')} · pass@1 ${entPass1(PL.st.p0).toFixed(2)} · pass@16 ${entPassK(PL.st.p0).toFixed(2)} · H ${entH(PL.st.p0).toFixed(2)}`]].concat(TRIBES.map((T, t) => { const c = PL.st.cur[t]; return [T.name, c ? `pass@1 ${c[0].toFixed(2)} · pass@16 ${c[1].toFixed(2)} · H ${c[2].toFixed(2)}` : '…']; })),
  debug: () => ({ p0: PL.st.p0.map((v) => +v.toFixed(3)), cur: PL.st.cur.map((c) => (c ? c.map((v) => +v.toFixed(4)) : null)), best: ENT.best && { v: +ENT.best.v.toFixed(4), p1: +ENT.best.p1.toFixed(3) } }),
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28, xm = ENT.T, hm = Math.log(3);
    FIG.axes(c, x0, y0, x1, y1, 'steps', 'entropy H (nats)');
    const r = figSeries(c, x0, y0, x1, y1, TRIBES.map((T, t) => ({ ys: curveMean(st.H, t), color: T.color, w: 1.5 })), { xmax: xm, ymin: 0, ymax: hm });
    figSeries(c, x0, y0, x1, y1, [{ ys: curveMean(st.Pd, 0), color: INK, w: 1, dash: [3, 2], a: 0.75 }], { xmax: xm, ymin: 0, ymax: hm });
    c.setLineDash([1.5, 2.5]); c.strokeStyle = 'rgba(36,38,43,0.45)'; c.beginPath(); c.moveTo(x0, r.ty(hm)); c.lineTo(x1, r.ty(hm)); c.stroke(); c.setLineDash([]);
    FIG.note(c, x1 - 4, r.ty(hm) + 8, 'log 3, uniform', 'rgba(36,38,43,0.6)', 'right');
    for (const v of [0, 0.5, 1]) FIG.tick(c, x0 - 3, r.ty(v), String(v), 'right', 'middle');
    FIG.tick(c, x1, y1 + 4, String(xm), 'right');
  },
});

// --- RL's razor: a policy over three answers to a new task's prompt, logits (θ₁, θ₂, 0); answers A and B are right
// and C is wrong. Every policy with π(C) → 0 solves the task; the sheet is the error, π(C)
const RZ = { A: 1.5, starts: [[0.3, 0.1, 0.6], [0.12, 0.28, 0.6], [0.4, 0.15, 0.45], [0.2, 0.06, 0.74]], p0: [0.3, 0.1, 0.6], teach: 1, T: 4000 };
const RPI = [0, 0, 0], RTH = [0, 0], RXY = [0, 0], RPI2 = [0, 0, 0], RTH2 = [0, 0];
const rzKL = (p) => { const q = RZ.p0; let s = 0; for (let k = 0; k < 3; k++) s += q[k] * Math.log(q[k] / Math.max(p[k], 1e-300)); return s; };   // KL(π₀ ‖ π)
const rzStep = (dth) => (i, x, y, eta) => { bTheta(x, y, RTH); if (Age[i] === 0) Ax[i] = RTH[0] - RTH[1]; const p = banditPi(RTH[0], RTH[1], RPI), d = dth(p); bMap(RTH[0] + eta * d[0], RTH[1] + eta * d[1], RXY); return [RXY[0] - x, RXY[1] - y]; };
function sheetRazor(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0 });
  EXTRA = (x, y) => { bTheta(x, y, RTH2); return RZ.A * banditPi(RTH2[0], RTH2[1], RPI2)[2]; };
  sheetEnd(R, true);
}
const RZ_TRIBES = [
  { k: 'sgd', name: 'Policy gradient', color: '#c22a40', kind: K_FN, sigMul: 0, rest: 'never', maxAge: RZ.T, rule: 'θ ← θ + η∇E_π[r]',
    fn: rzStep((p) => { const j = p[0] + p[1]; return [p[0] * (1 - j), p[1] * (1 - j)]; }) },
  { k: 'sgd', name: 'Natural policy gradient', color: '#23708f', kind: K_FN, sigMul: 0, rest: 'never', maxAge: RZ.T, rule: 'θₐ ← θₐ + η rₐ, so π ∝ π₀·exp(ηt r)',
    fn: rzStep(() => [1, 1]) },
  { k: 'sgd', name: 'SFT on a teacher', color: '#cf6d0c', kind: K_FN, sigMul: 0, rest: 'never', maxAge: RZ.T, rule: 'θ ← θ + η∇log π(the teacher’s answer)',
    fn: rzStep((p) => (RZ.teach === 1 ? [-p[0], 1 - p[1]] : [1 - p[0], -p[1]])) },
  { k: 'sgd', name: 'SFT on π₀ given success', color: '#167a5b', kind: K_FN, sigMul: 0, rest: 'never', maxAge: RZ.T, rule: 'cross-entropy towards π₀ restricted to right answers',
    fn: rzStep((p) => { const q = RZ.p0, s = q[0] + q[1]; return [q[0] / s - p[0], q[1] / s - p[1]]; }) },
];
function rzRace(p) {
  const st = PL.st; curveReset(st.K); curveReset(st.E); st.cid = st.K.cid;
  const th = bTheta(p[0], p[1], [0, 0]); RZ.p0 = banditPi(th[0], th[1], [0, 0, 0]); RZ.teach = RZ.p0[0] >= RZ.p0[1] ? 1 : 0;   // the teacher gives the right answer the base model finds less likely
  st.cur = TRIBES.map(() => null); st.at90 = TRIBES.map(() => null); st.at99 = TRIBES.map(() => null);
  raceSpawn(p, PHONE ? 3 : 5, 0.003, st.cid);
  nextRelease = STAT.steps + RZ.T + 100; linesDirty = true; printDirty = true;
}
plate({
  id: 'razor', ch: 7, seed: 3303,
  run: [
    (T) => { T.clear(); const q = RZ.starts[0]; T.release(...bMap(Math.log(q[0] / q[2]), Math.log(q[1] / q[2]), [0, 0])); },
    null,
    null,
    null,
  ],
  status: 'open',
  tribes: RZ_TRIBES,
  sim: { lr: 0.05, noise: 0 },
  ctl: [{ key: 'lr', label: 'Step η', min: 0.01, max: 0.25, scale: 'log', f: (v) => v.toFixed(3) }],
  view: { yaw: -6, pitch: 50 }, speed: 5, liveNames: true,
  sheet: sheetRazor,
  features: () => { RZ.p0 = RZ.starts[0].slice(); RZ.teach = 1; PL.st = { K: curveInit(4, RZ.T), E: curveInit(4, RZ.T), cid: 1, k: 0, cur: [null, null, null, null], at90: [null, null, null, null], at99: [null, null, null, null] }; },
  names: (S) => {
    const at = (t1, t2) => bMap(t1, t2, [0, 0]);
    [[[14, 2], ['Answer A', 'right']], [[-3, 9], ['Answer B', 'right']], [[-7, -7], ['Answer C', 'wrong']]].forEach(([q, l]) => { const p = at(q[0], q[1]); S.areas.push({ x: p[0], y: p[1], lines: l, size: 13, ls: 2.4 }); });
    const q = RZ.p0, th = [Math.log(q[0] / q[2]), Math.log(q[1] / q[2])], p = at(th[0], th[1]), s = q[0] + q[1], e = at(th[0] + 11, th[1] + 11);
    S.marks.push({ p: { x: p[0], y: p[1] }, name: 'Base model', sub: `π₀ = ${q.map((v) => v.toFixed(2)).join(' · ')}`, sym: 'x', pri: 9 });
    S.marks.push({ p: { x: e[0], y: e[1] }, name: 'π₀ given success', sub: `π = ${(q[0] / s).toFixed(2)} · ${(q[1] / s).toFixed(2)} · 0 · KL(π ‖ π₀) ${(-Math.log(s)).toFixed(2)}`, sym: 'min', pri: 8 });
  },
  print: () => {
    rimPrint([Math.PI / 4, -Math.PI / 2, Math.PI]);
    const G = fieldGrid((x, y) => { bTheta(x, y, RTH2); return rzKL(banditPi(RTH2[0], RTH2[1], RPI2)); }, 160);
    isoPrint(G, [0.5, 1, 2, 3], 'rgba(75,63,160,0.85)', [4, 2.5], (v) => `KL ${v}`, 0.3);
  },
  lines: () => {     // natural policy gradient's road: the base logits plus t(1, 1)
    const q = RZ.p0, th = [Math.log(q[0] / q[2]), Math.log(q[1] / q[2])], pts = [];
    for (let s = 0; s <= 80; s += s < 10 ? 0.1 : 0.5) { const m = bMap(th[0] + s, th[1] + s, [0, 0]); pts.push(m[0], m[1]); }
    line(drape(pts), '#23708f', 1.1, 0.02, true, 0.6);
  },
  release: () => {
    const st = PL.st;
    if (!F.params.auto || STAT.alive > maxAlive - 40) { nextRelease = STAT.steps + 45; return; }
    const q = RZ.starts[st.k++ % RZ.starts.length];
    rzRace(bMap(Math.log(q[0] / q[2]), Math.log(q[1] / q[2]), [0, 0]));
  },
  click: (x, y) => rzRace([x, y]),
  frame: ch8Wait,
  step: (i) => {
    const st = PL.st; if (Tag[i] !== st.cid) return;
    bTheta(Wx[i], Wy[i], RTH); const p = banditPi(RTH[0], RTH[1], RPI), t = Tr[i], err = p[2], kl = rzKL(p);
    curveAdd(st.K, t, Age[i], kl); curveAdd(st.E, t, Age[i], -Math.log10(Math.max(err, 1e-12)));
    st.cur[t] = [1 - err, kl, Math.exp(RTH[0] - RTH[1] - Ax[i])];          // A:B against this particle's own start
    if (st.at90[t] == null && err < 0.1) st.at90[t] = kl;
    if (st.at99[t] == null && err < 0.01) st.at99[t] = kl;
    if (err < 1e-7) { Ex[i] = Wx[i]; Ey[i] = Wy[i]; retire(i, true); return false; }
  },
  readouts: () => [['base', `π₀ = ${RZ.p0.map((v) => v.toFixed(2)).join(' · ')} · teacher answers ${RZ.teach === 1 ? 'B' : 'A'}`]].concat(TRIBES.map((T, t) => { const c = PL.st.cur[t]; return [T.name, c ? `right ${(100 * c[0]).toFixed(1)}% · KL(π₀ ‖ π) ${c[1].toFixed(2)} · A:B ×${c[2] > 999 ? '>999' : c[2] < 0.001 ? '<0.001' : c[2].toPrecision(3)}` : '…']; })),
  debug: () => { const st = PL.st, f = (v) => (v == null ? null : +v.toFixed(3)); return { p0: RZ.p0.map(f), at90: st.at90.map(f), at99: st.at99.map(f), cur: st.cur.map((c) => (c ? c.map(f) : null)), iproj: f(-Math.log(RZ.p0[0] + RZ.p0[1])) }; },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28, xmx = 3, ymx = 4;
    FIG.axes(c, x0, y0, x1, y1, 'error on the new task', 'KL(π₀ ‖ π)');
    const ser = TRIBES.map((T, t) => ({ xs: curveMean(st.E, t), ys: curveMean(st.K, t), color: T.color, w: 1.5 }));
    for (const s of ser) for (let k = 0; k < s.xs.length; k++) if (!(s.xs[k] <= xmx) || !(s.ys[k] <= ymx)) s.ys[k] = NaN;
    const r = figSeries(c, x0, y0, x1, y1, ser, { xmax: xmx, ymin: 0, ymax: ymx });
    for (const [v, txt] of [[1, '10%'], [2, '1%'], [3, '0.1%']]) FIG.tick(c, r.tx(v), y1 + 4, txt);
    for (const v of [0, 1, 2, 3, 4]) FIG.tick(c, x0 - 3, r.ty(v), String(v), 'right', 'middle');
  },
});

// --- the safety basin: a slice of weight space through an aligned model at the origin, spanned by the alignment
// direction θ₁ (from the base model before safety training to the aligned one) and a worst-case direction θ₂.
// Refusal holds while the margin s(θ) = 1 − (θ₁/a)² − (θ₂/b)² is positive; the sheet is the attack success rate
const SAF = { a: 0.95, b: 0.3, kap: 24, lo: 0.04, hi: 0.92, A: 1.2, base: [-1.32, 0], harm: [0.16, 0.8], ben: [0.8, 0.36], hb: [1, 0.6], lam: 6, T: 1600 };
const safS = (x, y) => 1 - (x / SAF.a) ** 2 - (y / SAF.b) ** 2;
const safASR = (x, y) => SAF.lo + (SAF.hi - SAF.lo) / (1 + Math.exp(SAF.kap * safS(x, y)));
const safTask = (x, y) => 0.5 * (SAF.hb[0] * (x - SAF.ben[0]) ** 2 + SAF.hb[1] * (y - SAF.ben[1]) ** 2);
function sheetSafety(R) {
  sheetBase(R, { bk: 0, bk4: 0, na: 0.02 });
  EXTRA = (x, y) => { const s = safS(x, y); EXCALM = s > 0.15 ? 1 / 0.88 : 0; return SAF.A * safASR(x, y); };
  sheetEnd(R, true);
}
const safStep = (gr) => (i, x, y, eta) => { const g = gr(x, y), s = SIM.noise; return [-eta * (g[0] + s * NR.normal()), -eta * (g[1] + s * NR.normal())]; };
const SAF_TRIBES = [
  { k: 'sgd', name: 'Harmful fine-tuning', color: '#c22a40', kind: K_FN, sigMul: 0, rest: 'never', maxAge: SAF.T, rule: 'θ ← θ − η∇L_harm',
    fn: safStep((x, y) => [x - SAF.harm[0], y - SAF.harm[1]]) },
  { k: 'sgd', name: 'Benign fine-tuning', color: '#cf6d0c', kind: K_FN, sigMul: 0, rest: 'never', maxAge: SAF.T, rule: 'θ ← θ − η∇L_task',
    fn: safStep((x, y) => [SAF.hb[0] * (x - SAF.ben[0]), SAF.hb[1] * (y - SAF.ben[1])]) },
  { k: 'sgd', name: 'Benign, anchored', color: '#167a5b', kind: K_FN, sigMul: 0, rest: 'never', maxAge: SAF.T, rule: 'θ ← θ − η(∇L_task + λP⊥θ), λ = 6',
    fn: safStep((x, y) => [SAF.hb[0] * (x - SAF.ben[0]), SAF.hb[1] * (y - SAF.ben[1]) + SAF.lam * y]) },
];
function safRace(p) {
  const st = PL.st; curveReset(st.C); st.cid = st.C.cid; st.cur = TRIBES.map(() => null); st.exit = TRIBES.map(() => null); st.L0 = safTask(p[0], p[1]);
  raceSpawn(p, PHONE ? 4 : 8, 0.004, st.cid);
  nextRelease = STAT.steps + SAF.T + 100;
}
plate({
  id: 'safety', ch: 7, seed: 3304,
  run: [
    null,
    null,
    (T) => { T.set('noise', 1); T.clear(); T.release('Aligned model'); },
  ],
  status: 'open',
  tribes: SAF_TRIBES,
  sim: { lr: 0.01, noise: 0.3 },
  ctl: ['noise'],
  view: { yaw: -14, pitch: 42 }, speed: 3,
  sheet: sheetSafety,
  features: () => { PL.st = { C: curveInit(3, SAF.T), cid: 1, cur: [null, null, null], exit: [null, null, null], L0: safTask(0, 0) }; },
  names: (S) => {
    S.areas.push({ x: 0.02, y: -0.16, lines: ['Safety Basin'], size: 15, ls: 3 });
    S.areas.push({ x: 0.95, y: 0.78, lines: ['Compromised'], size: 13, ls: 2.4 });
    S.marks.push({ p: { x: 0, y: 0 }, name: 'Aligned model', sub: `attack success ${(100 * safASR(0, 0)).toFixed(0)}%`, sym: 'x', pri: 9 });
    S.marks.push({ p: { x: SAF.base[0], y: SAF.base[1] }, name: 'Base model', sub: `before safety training · attack success ${(100 * safASR(...SAF.base)).toFixed(0)}%`, sym: 'x', pri: 7 });
    S.marks.push({ p: { x: SAF.harm[0], y: SAF.harm[1] }, name: 'Harmful data', sub: 'its loss is lowest here', sym: 'min', pri: 6, pin: false });
    S.marks.push({ p: { x: SAF.ben[0], y: SAF.ben[1] }, name: 'Benign task', sub: 'its loss is lowest here', sym: 'min', pri: 6, pin: false });
    S.paths.push({ text: 'alignment direction', pts: [-1.25, -0.06, -0.35, -0.06], size: 11, offset: 0.04 });
    S.paths.push({ text: 'worst-case direction', pts: [-0.06, 0.34, -0.06, 0.95], size: 11, offset: 0.04 });
  },
  print: () => {
    const c = sc; c.save(); c.strokeStyle = 'rgba(36,38,43,0.6)'; c.lineWidth = 0.9; c.setLineDash([4, 3]);
    c.beginPath(); c.arc(ox(0), oy(0), SAF.b * OPU, 0, TAU); c.stroke();
    c.setLineDash([2, 3]); c.beginPath(); c.moveTo(ox(SAF.base[0]), oy(0)); c.lineTo(ox(1.5), oy(0)); c.moveTo(ox(0), oy(-0.95)); c.lineTo(ox(0), oy(0.95)); c.stroke();
    c.font = `italic 400 ${9.5 * FS}px ${SERIF}`; c.fillStyle = 'rgba(36,38,43,0.75)'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('safe in every direction', ox(SAF.b * 0.72) + 4, oy(-SAF.b * 0.72) + 6); c.restore();
    const G = fieldGrid(safTask, 192); isoPrint(G, [0.02, 0.08, 0.18], 'rgba(207,109,12,0.8)', [3, 2.4], (v) => `L_task ${v}`, 0.6);
  },
  release: () => {
    if (!F.params.auto || STAT.alive > maxAlive - 40) { nextRelease = STAT.steps + 45; return; }
    safRace([0, 0]);
  },
  click: (x, y) => safRace([x, y]),
  frame: ch8Wait,
  step: (i) => {
    const st = PL.st; if (Tag[i] !== st.cid) return;
    const t = Tr[i], a = safASR(Wx[i], Wy[i]); curveAdd(st.C, t, Age[i], a);
    if (Age[i] % 5 === 0 || !st.cur[t]) st.cur[t] = [a, safTask(Wx[i], Wy[i])];
    if (st.exit[t] == null && a > 0.5) st.exit[t] = Age[i];
  },
  readouts: () => TRIBES.map((T, t) => { const c = PL.st.cur[t]; return [T.name, c ? `attack success ${(100 * c[0]).toFixed(0)}% · task loss ${c[1].toFixed(3)}${PL.st.exit[t] != null ? ` · left at step ${PL.st.exit[t]}` : ''}` : '…']; }),
  debug: () => { const st = PL.st, f = (v) => +v.toFixed(4); return { exit: st.exit, cur: st.cur.map((c) => (c ? c.map(f) : null)), L0: f(st.L0) }; },
  fig: (c, w, h) => {
    const st = PL.st, x0 = 30, y0 = 8, x1 = w - 6, y1 = h - 28, xm = 800;
    FIG.axes(c, x0, y0, x1, y1, 'steps', 'attack success rate');
    const r = figSeries(c, x0, y0, x1, y1, TRIBES.map((T, t) => ({ ys: curveMean(st.C, t), color: T.color, w: 1.5 })), { xmax: xm, ymin: 0, ymax: 1 });
    for (const v of [0, 0.5, 1]) FIG.tick(c, x0 - 3, r.ty(v), `${Math.round(100 * v)}%`, 'right', 'middle');
    FIG.tick(c, x1, y1 + 4, String(xm), 'right');
  },
});
// ch8>>
// <<ch9
// ---------------------------------------------------------------------------------------------
// many dimensions: helpers shared by the plates of chapter IX. Their particles live in d dimensions; the
// map shows a plane through that space (a slice, or a projection), and the plate draws each particle at
// its projection onto the plane while its loss is the full d-dimensional one.
// ---------------------------------------------------------------------------------------------
const dotN = (a, b, n = a.length) => { let s = 0; for (let k = 0; k < n; k++) s += a[k] * b[k]; return s; };
const normN = (a, n = a.length) => Math.sqrt(dotN(a, a, n));
function gaussN(R, n, out = new Float64Array(n)) { for (let k = 0; k < n; k++) out[k] = R.normal(); return out; }
function unitN(R, n) { const v = gaussN(R, n), l = normN(v); for (let k = 0; k < n; k++) v[k] /= l; return v; }
// Gram–Schmidt: make b orthonormal to the unit vector a (in place); returns b
function orthoN(a, b, n = a.length) { const c = dotN(a, b, n); for (let k = 0; k < n; k++) b[k] -= c * a[k]; const l = normN(b, n); for (let k = 0; k < n; k++) b[k] /= l; return b; }
// eigen-decomposition of a symmetric n×n matrix A (row-major Float64Array, left intact) by cyclic Jacobi rotations.
// Returns { vals, vecs } with vals ascending and eigenvector k in column k of vecs (vecs[i * n + k]). Fine to n ≈ 60.
function symEig(A, n) {
  const a = Float64Array.from(A), v = new Float64Array(n * n);
  for (let i = 0; i < n; i++) v[i * n + i] = 1;
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i * n + j] * a[i * n + j];
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      const apq = a[p * n + q]; if (Math.abs(apq) < 1e-300) continue;
      const th = (a[q * n + q] - a[p * n + p]) / (2 * apq), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k * n + p], akq = a[k * n + q]; a[k * n + p] = c * akp - s * akq; a[k * n + q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p * n + k], aqk = a[q * n + k]; a[p * n + k] = c * apk - s * aqk; a[q * n + k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = v[k * n + p], vkq = v[k * n + q]; v[k * n + p] = c * vkp - s * vkq; v[k * n + q] = s * vkp + c * vkq; }
    }
  }
  const idx = Array.from({ length: n }, (_, k) => k).sort((x, y) => a[x * n + x] - a[y * n + y]);
  const vals = new Float64Array(n), vecs = new Float64Array(n * n);
  idx.forEach((k, c) => { vals[c] = a[k * n + k]; for (let i = 0; i < n; i++) vecs[i * n + c] = v[i * n + k]; });
  return { vals, vecs };
}
// plate: sinking (minima in many dimensions)
//
// plate: slices (what a slice hides)
//
// plate: pca (trajectories in PCA)
//
// plate: ddescent (double descent)
//
// plate: mup (learning rates across widths)
//
// ch9>>
// reading order: the plate blocks above are grouped by the code they share; the atlas is read in this order
{
  const ORDER = ['survey', 'catchments', 'saddles', 'plateaus', 'ravines', 'cliffs', 'sharpflat', 'stability', 'eos', 'eoss', 'igr', 'temperature', 'anisotropic', 'heavytail', 'labelnoise', 'momentum', 'adam', 'wd', 'newton', 'sam', 'averaging', 'staircase', 'warmup', 'river', 'grokking', 'plasticity', 'connect', 'forks', 'symmetry', 'singular', 'common', 'rosenbrock', 'himmelblau', 'rastrigin', 'ackley', 'camel', 'sculpt', 'games', 'softmax', 'margin', 'displace', 'entropy', 'razor', 'safety', 'lora', 'merging', 'sinking', 'slices', 'pca', 'ddescent', 'mup'];
  PLATES.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  PLATES.forEach((p, i) => { p.index = i; });
}

// ---------------------------------------------------------------------------------------------
// frame
// ---------------------------------------------------------------------------------------------
const SIMKEYS = {
  lr: { label: 'Learning rate η', min: 0.0005, max: 0.05, scale: 'log', f: (v) => v.toFixed(4) },
  noise: { label: 'Gradient noise σ', min: 0, max: 2, step: 0.01 },
  beta: { label: 'Momentum β', min: 0, max: 0.99, step: 0.01 },
  beta2: { label: 'Adam β₂', min: 0.9, max: 0.9999, step: 0.0001, f: (v) => v.toFixed(4) },
};
const F = Frame.init({ standalone: true, byline: 'By hematteo, made with Claude (Anthropic).',
  slug: 'atlas-of-loss-surfaces', number: 3, title: 'An Atlas of Loss Surfaces', year: 2026,
  medium: "A map of the places gradient descent gets stuck, and the ways it gets out.",
  tone: 'light', accent: '#4b3fa0', seed: 1938, maxDpr: 2,
  statement: TEXT.about,
  hint: 'drag to turn · right-drag to pan · scroll to approach · click to release a cohort · <kbd>↑</kbd><kbd>↓</kbd> plates',
  gestures: [['Drag', 'turn the relief model'], ['Right-drag, Shift-drag, two fingers', 'pan across the sheet; twist two fingers to turn'], ['Scroll, pinch', 'approach the pointer'],
    ['Click', 'release a cohort (or the plate’s own action); click a stick man to walk with it'], ['Double-click', 'return to the plate’s view'], ['Hover', 'read θ, L, |∇L| and the downhill direction'],
    ['Option-drag, Alt-drag', 'move the lamp']],
  params: [
    { type: 'section', label: 'Atlas' },
    { type: 'select', key: 'plate', label: 'Plate', options: PLATES.map((p, i) => [p.id, `${i + 1}. ${p.title}`]), value: 'survey' },
    { type: 'toggle', key: 'turn', label: 'Turn pages when idle', value: !REDUCED },
    { type: 'section', label: 'Relief model' },
    { key: 'exag', label: 'Vertical exaggeration', min: 0, max: 3, step: 0.05, value: 1, format: (v) => `${v.toFixed(2)}×` },
    { key: 'relief', label: 'Hill shading', min: 0, max: 2, step: 0.05, value: 1 },
    { type: 'toggle', key: 'lamp', label: 'Lamp and cast shadows', value: true },
    { key: 'lampAz', label: 'Lamp bearing', min: 0, max: 360, step: 1, value: 315, format: (v) => `${Math.round(v)}°` },
    { key: 'lampEl', label: 'Lamp height', min: 15, max: 80, step: 1, value: 32, format: (v) => `${Math.round(v)}°` },
    { key: 'interval', label: 'Contour interval', min: 0.02, max: 0.1, step: 0.005, value: 0.05 },
    { type: 'toggle', key: 'spin', label: 'Slow turn when idle', value: !REDUCED },
    { type: 'toggle', key: 'scaffold', label: 'Disconnectivity scaffold (D)', value: false },
    { type: 'toggle', key: 'dusk', label: 'Dusk, with lanterns (N)', value: false },
    { type: 'section', label: 'Survey' },
    { key: 'speed', label: 'Steps per second', min: 10, max: 240, step: 5, value: 45 },
    { key: 'caravan', label: 'Cohort size', min: 4, max: 48, step: 1, value: 24, format: (v) => `${v | 0} per optimizer` },
    { type: 'toggle', key: 'auto', label: 'Auto-release cohorts', value: true },
    { type: 'button', label: 'Clear trails', action: () => clearInk(true) },
  ],
  keys: {
    ArrowUp: ['previous plate', () => gotoPlate(PL.index - 1)],
    ArrowDown: ['next plate', () => gotoPlate(PL.index + 1)],
    e: ['show or hide the plate card', () => toggleCard()],
    v: ['return to the plate’s view', () => resetView(true)],
    t: ['plan view, straight down (T or Esc returns to the relief)', () => planView()],
    w: ['walk with a stick man; again for the next optimizer (Esc leaves)', () => walkWith()],
    l: ['lamp on or off', (F) => { F.setParam('lamp', !F.params.lamp); F.toast(F.params.lamp ? 'Lamp on' : 'Lamp off'); }],
    d: ['flood the sheet and raise its disconnectivity scaffold', () => toggleScaffold()],
    n: ['dusk: the lamp drops low and the stick men light their lanterns (N or Esc returns to day)', () => toggleDusk()],
    o: ['watch a few stick men up close, each in its own small view (O or Esc closes them)', () => toggleWatch()],
    x: ['cross-section: click two points on the relief (X or Esc puts it away)', () => toggleSection()],
    Escape: ['close the contents or the close-up views, else leave the current mode: section, walk, dusk, plan view, then flood', () => {}],
    '[': ['slower: fewer steps per second', (F) => { F.setParam('speed', Math.max(10, Math.round(F.params.speed / 1.5 / 5) * 5)); F.toast(`${F.params.speed} steps per second`); }],
    ']': ['faster: more steps per second', (F) => { F.setParam('speed', Math.min(240, Math.round(F.params.speed * 1.5 / 5) * 5)); F.toast(`${F.params.speed} steps per second`); }],
    c: ['clear trails and rings', () => clearInk(true)],
    a: ['toggle auto-release', (F) => { F.setParam('auto', !F.params.auto); F.toast(F.params.auto ? 'Auto-release on' : 'Auto-release off'); }],
  },
  onSeed: () => turnTo(rebuild),
  onParam: (k, v) => onParam(k, v),
});

// ---------------------------------------------------------------------------------------------
// WebGL
// ---------------------------------------------------------------------------------------------
let gl;
try { gl = GL.context(F.canvas, { depth: true, antialias: true }, [], ['EXT_texture_filter_anisotropic']); }
catch (e) { Frame.fail(e.message, e.detail); throw e; }
const ANISO = gl.ext.EXT_texture_filter_anisotropic;
const MAXTEX = gl.getParameter(gl.MAX_TEXTURE_SIZE);
const HEAD = '#version 300 es\nprecision highp float;\nprecision highp int;\n';
const HAT = `
uniform highp sampler2D uData;
uniform vec2 uGrid;
uniform vec4 uMap;
float hAt(vec2 xy) {
  vec2 g = clamp((xy - uMap.xy) / uMap.zw, 0., 1.) * (uGrid - 1.);
  ivec2 i = ivec2(min(floor(g), uGrid - 2.));
  vec2 f = g - vec2(i);
  float a = texelFetch(uData, i, 0).x, b = texelFetch(uData, i + ivec2(1, 0), 0).x;
  float c = texelFetch(uData, i + ivec2(0, 1), 0).x, d = texelFetch(uData, i + ivec2(1, 1), 0).x;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
uniform float uCut, uTerr, uIvL;
float hDraw(vec2 xy) {           // the height drawn: while a plate is built, cards one contour interval thick, capped at uCut
  float h = hAt(xy);
  return uTerr > 0. ? mix(h, min(floor(h / uIvL + 1e-4) * uIvL, uCut), uTerr) : h;
}`;
const LIGHT = 'const vec3 L1 = vec3(-0.5529, 0.5529, 0.6233), L2 = vec3(-0.7498, 0.05, 0.6598), L3 = vec3(0.0501, 0.7012, 0.7112);';
const HYPS = `
vec3 hyps(float t) {
  vec3 c0 = vec3(178., 196., 176.) / 255., c1 = vec3(194., 207., 184.) / 255., c2 = vec3(211., 217., 197.) / 255., c3 = vec3(226., 227., 213.) / 255., c4 = vec3(243., 242., 235.) / 255.;
  if (t < 0.2) return mix(c0, c1, t / 0.2);
  if (t < 0.42) return mix(c1, c2, (t - 0.2) / 0.22);
  if (t < 0.68) return mix(c2, c3, (t - 0.42) / 0.26);
  return mix(c3, c4, clamp((t - 0.68) / 0.32, 0., 1.));
}
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float grain(vec2 p) {            // paper tooth: smooth value noise, so that it stays grain when seen up close
  vec2 i = floor(p), f = p - i, u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + 1.), u.x), u.y);
}`;
// the lamp: a physical light on the model on top of the printed shading. Its visibility (cast shadows)
// and the ambient occlusion are baked into a map-space texture; haze thickens with distance from the eye
const LAMPF = `
uniform sampler2D uLight;
uniform vec4 uLightR;
uniform vec3 uLamp, uEye, uFogC;
uniform float uLampOn, uAo, uFog, uDusk;
vec3 lamp(vec3 col, vec3 n, vec3 w, float baked) {
  vec3 c0 = col;
  vec2 uv = (w.xy - uLightR.xy) / uLightR.zw;
  float edge = 1. - smoothstep(0.46, 0.5, max(abs(uv.x - 0.5), abs(uv.y - 0.5)));
  vec2 va = mix(vec2(1.), texture(uLight, uv).rg, edge * baked);
  float e = 0.68 + 0.32 * min(2.2, max(0., dot(n, uLamp)) / max(uLamp.z, 0.05)) * va.r;   // open flat ground stays 1
  e = mix(1., e * mix(1., va.g, uAo), uLampOn);
  if (e < 1.) col *= e * mix(vec3(0.9, 0.94, 1.06), vec3(1.), e);
  else col = mix(col, vec3(1., 0.985, 0.945), min(0.45, (e - 1.) * 0.6));
  // dusk: a cool ambient with the hollows kept, and the low warm lamp with its shadows
  vec2 pc = w.xy - vec2(0., -0.04);
  float pool = exp(-dot(pc, pc) / 3.6);                    // the lamp lights a pool round the model; the far table falls into the dark
  vec3 nite = c0 * (vec3(0.17, 0.2, 0.31) * mix(1., va.g, 0.7) * (0.45 + 0.55 * pool) + vec3(1.15, 0.7, 0.33) * max(0., dot(n, uLamp)) * va.r * pool);
  col = mix(col, nite, uDusk);
  float d = length(w - uEye);
  return mix(col, uFogC, uFog * (1. - exp(-0.16 * d * d)));
}`;
let lightDirty = true, aoDirty = true;

const P_TERRAIN = GL.program(gl, HEAD + HAT + `
layout(location = 0) in vec2 aUV;
uniform mat4 uVP;
uniform float uZs;
out vec2 vXY;
out vec3 vW;
void main() {
  vXY = uMap.xy + aUV * uMap.zw;
  vW = vec3(vXY, hDraw(vXY) * uZs);
  gl_Position = uVP * vec4(vW, 1.);
}`, HEAD + LIGHT + HYPS + LAMPF + `
uniform highp sampler2D uData;
uniform sampler2D uSheet, uMask, uInk;
uniform vec4 uMap, uSheetR;
uniform vec2 uGrid;
uniform float uIv, uHmin, uSpan, uRelief, uDpr, uPrint, uFlood, uZs, uCut, uTerr, uIvL, uWalk;
uniform sampler2D uNames;
in vec2 vXY;
in vec3 vW;
out vec4 o;
vec3 inkAt(vec2 uv) {            // mipmapped far off; a cubic B-spline when magnified, so close trails stay smooth
  vec3 lin = texture(uInk, uv).rgb;
  vec2 ts = vec2(textureSize(uInk, 0)), st = uv * ts - 0.5, i = floor(st), f = st - i;
  float mg = 1. - smoothstep(0.45, 0.9, max(fwidth(st.x), fwidth(st.y)));
  if (mg <= 0.) return lin;
  vec2 w0 = (1. - f) * (1. - f) * (1. - f) / 6., w1 = (4. - 6. * f * f + 3. * f * f * f) / 6., w3 = f * f * f / 6., w2 = 1. - w0 - w1 - w3;
  vec2 g0 = w0 + w1, g1 = w2 + w3, c0 = (i - 0.5 + w1 / g0) / ts, c1 = (i + 1.5 + w3 / g1) / ts;
  vec3 cub = g0.y * (g0.x * textureLod(uInk, c0, 0.).rgb + g1.x * textureLod(uInk, vec2(c1.x, c0.y), 0.).rgb)
           + g1.y * (g0.x * textureLod(uInk, vec2(c0.x, c1.y), 0.).rgb + g1.x * textureLod(uInk, c1, 0.).rgb);
  return mix(lin, cub, mg);
}
void main() {
  vec2 g = clamp((vXY - uMap.xy) / uMap.zw, 0., 1.) * (uGrid - 1.);
  ivec2 i = ivec2(min(floor(g), uGrid - 2.));
  vec2 f = g - vec2(i);
  vec4 d = mix(mix(texelFetch(uData, i, 0), texelFetch(uData, i + ivec2(1, 0), 0), f.x),
               mix(texelFetch(uData, i + ivec2(0, 1), 0), texelFetch(uData, i + ivec2(1, 1), 0), f.x), f.y);
  float lake = max(texelFetch(uData, ivec2(floor(g + 0.5)), 0).w, uFlood);
  float h = d.x;
  // while the plate is built: the card this point lies on, and how far the drawn surface here is from it (a cut edge)
  float tr = uTerr, hT = min(floor(h / max(uIvL, 1e-4) + 1e-4) * uIvL, uCut), hS = mix(h, hT, tr);
  float edge = tr > 0. ? clamp(abs(vW.z / max(uZs, 1e-6) - hS) / (0.3 * uIvL), 0., 1.) : 0.;
  vec3 nCard = mix(vec3(0., 0., 1.), vec3(-d.yz / max(length(d.yz), 1e-6), 0.), edge);
  // Imhof shading on the map-space normal: NW key light, W and N fills, vertical light for slope
  float z = 0.5 * uRelief * (0.35 + 0.65 * uPrint);
  float gm = length(d.yz), cmp = z / sqrt(1. + (gm / 2.4) * (gm / 2.4));
  vec3 n = normalize(vec3(-cmp * d.yz, 1.));
  if (tr > 0.) n = normalize(mix(n, nCard, tr));
  float s = (max(0., dot(n, L1)) + 0.34 * max(0., dot(n, L2)) + 0.24 * max(0., dot(n, L3)) + 0.45 * n.z) / 1.4683;
  float hn = clamp((hS - uHmin) / uSpan, 0., 1.);
  s = 1. + (s - 1.) * (0.55 + 0.6 * hn) * min(1., uRelief);
  vec3 col = mix(hyps(hn), vec3(196., 204., 206.) / 255., 0.22 * (1. - hn));
  if (s < 1.) { float dd = 1. - max(0., s); col *= vec3(1. - 0.52 * dd, 1. - 0.47 * dd, 1. - 0.36 * dd); }
  else col = mix(col, vec3(254., 251., 239.) / 255., min(1., (s - 1.) * 1.1));
  bool wet = lake > -0.5 && h < lake;
  if (wet) { float dp = clamp((lake - h) / 0.3, 0., 1.); col = vec3(176. - 34. * dp, 205. - 24. * dp, 222. - 14. * dp) / 255.; }
  col *= 1. + (0.65 * grain(vXY * 1400.) + 0.35 * grain(vXY * 5200.) - 0.5) * 0.05;
  col *= 1. - 0.14 * edge * tr;
  // contours: distance to the nearest level in device pixels; intermediates thin out where they crowd
  vec2 suv = (vXY - uSheetR.xy) / uSheetR.zw;
  float knock = texture(uMask, suv).r;
  float fl = h / uIv, fw = max(fwidth(fl), 1e-6), k = floor(fl + 0.5), dist = abs(fl - k) / fw;
  bool idx = mod(k, 5.) < 0.5;
  float wpx = (idx ? 1.05 : 0.6) * uDpr;
  float cov = clamp(wpx * 0.5 + 0.5 - dist, 0., 1.) * min(1., wpx);
  float spacing = 1. / (fw * uDpr);                 // css px between neighbouring contours
  cov *= idx ? smoothstep(1.0, 1.8, spacing) : smoothstep(2.0, 3.2, spacing);
  cov *= (1. - knock) * uPrint;
  if (k * uIv > uCut + 1e-4) cov *= 1. - tr;          // the top card is blank: the land above it is not built yet
  vec4 cc = wet ? (idx ? vec4(40., 96., 142., 0.55) : vec4(52., 108., 152., 0.36)) : (idx ? vec4(112., 76., 44., 0.86) : vec4(126., 90., 56., 0.56));
  col = mix(col, cc.rgb / 255., cc.a * cov);
  if (lake > -0.5) {                                 // shoreline
    float sd = abs(lake - h) / max(fwidth(h), 1e-6);
    col = mix(col, vec3(40., 96., 142.) / 255., 0.92 * clamp(0.9 * uDpr + 0.5 - sd, 0., 1.) * uPrint);
  }
  vec3 dn = -log(max(inkAt((vXY - uMap.xy) / uMap.zw), vec3(1. / 512.)));
  float dm = max(max(dn.r, dn.g), dn.b);
  if (dm > 1e-4) dn *= 1.2 * (1. - exp(-dm / 1.2)) / dm;
  col *= mix(vec3(1.), exp(-dn), uPrint);
  vec4 lb = texture(uSheet, suv) * uPrint;
  col = col * (1. - lb.a) + lb.rgb;
  vec4 nb = texture(uNames, suv) * uPrint * (1. - uWalk);      // names lie flat on the sheet; in walk mode they stand up as signposts
  col = col * (1. - nb.a) + nb.rgb;
  vec3 nw = normalize(vec3(-uZs * d.yz, 1.));
  if (tr > 0.) nw = normalize(mix(nw, nCard, tr));
  vec3 tr3 = exp(-dn), hue = tr3 / max(max(tr3.r, tr3.g), max(tr3.b, 1e-3));
  vec3 gl3 = hue * hue * (1. - (tr3.r + tr3.g + tr3.b) / 3.) * 0.75 * uDusk * uPrint;    // at dusk the inks glow, each in its own colour
  o = vec4(lamp(col, nw, vW, 1.) + gl3, 1.);
}`, 'terrain');

// the cut faces of the relief: strata at every index contour, a dark rule along the top edge
const P_WALL = GL.program(gl, HEAD + HAT + `
layout(location = 0) in vec3 aP;
layout(location = 1) in vec2 aN;
uniform mat4 uVP;
uniform float uZs;
out float vL;
out float vTop;
out vec2 vN;
out vec3 vWp;
void main() {
  vec2 xy = uMap.xy + aP.xy * uMap.zw;
  float h = hDraw(xy);
  float z = aP.z > 0.5 ? h * uZs : 0.;
  vL = aP.z > 0.5 ? h : 0.;
  vTop = aP.z; vN = aN; vWp = vec3(xy, z);
  gl_Position = uVP * vec4(xy, z, 1.);
}`, HEAD + LIGHT + HYPS + LAMPF + `
uniform float uIv, uHmin, uSpan, uDpr, uPrint;
in float vL;
in float vTop;
in vec2 vN;
in vec3 vWp;
out vec4 o;
void main() {
  float hn = clamp((vL - uHmin) / uSpan, 0., 1.);
  vec3 base = mix(vec3(0.84, 0.835, 0.80), hyps(hn), 0.4);
  float lam = max(0., dot(vec3(vN, 0.), L1));
  vec3 col = base * mix(0.74 + 0.34 * lam, 0.94, uLampOn);
  float fl = vL / (5. * uIv), fw = max(fwidth(fl), 1e-6), dist = abs(fl - floor(fl + 0.5)) / fw;
  col = mix(col, vec3(0.44, 0.31, 0.2), 0.22 * clamp(0.9 * uDpr * 0.5 + 0.5 - dist, 0., 1.) * uPrint);
  float te = (1. - vTop) / max(fwidth(vTop), 1e-6);
  col = mix(col, vec3(0.16, 0.17, 0.19), 0.75 * clamp(1.1 * uDpr + 0.5 - te, 0., 1.));
  o = vec4(lamp(col, vec3(vN, 0.), vWp, 0.), 1.);
}`, 'wall');

// the flat parts: the table with the sheet's shadow, the printed margin, the board's edges
const P_FLAT = GL.program(gl, HEAD + `
layout(location = 0) in vec3 aP;
layout(location = 1) in vec3 aN;
layout(location = 2) in float aMode;
uniform mat4 uVP;
out vec3 vW;
out vec3 vN;
out float vMode;
void main() { vW = aP; vN = aN; vMode = aMode; gl_Position = uVP * vec4(aP, 1.); }`, HEAD + LIGHT + LAMPF + `
uniform sampler2D uSheet;
uniform vec4 uSheetR, uMapR;
uniform vec3 uBg;
uniform vec2 uShOff;
uniform float uPrint;
in vec3 vW;
in vec3 vN;
in float vMode;
out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float grain(vec2 p) {
  vec2 i = floor(p), f = p - i, u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + 1.), u.x), u.y);
}
float sdRect(vec2 p, vec4 r) { vec2 q = abs(p - r.xy - r.zw * .5) - r.zw * .5; return length(max(q, 0.)) + min(max(q.x, q.y), 0.); }
void main() {
  if (vMode < 0.5) {
    float sd = sdRect(vW.xy - uShOff, uSheetR), sd0 = sdRect(vW.xy, uSheetR);
    float sh = 0.17 * (1. - smoothstep(-0.12, 0.34, sd)) + 0.16 * (1. - smoothstep(0., 0.04, sd0));
    o = vec4(lamp(uBg * (1. - sh), vec3(0., 0., 1.), vW, 1.), 1.);
  } else if (vMode < 1.5) {
    vec3 col = vec3(236., 238., 232.) / 255. * (1. + (0.65 * grain(vW.xy * 1400.) + 0.35 * grain(vW.xy * 5200.) - 0.5) * 0.045);
    float sd = sdRect(vW.xy, uMapR);
    col *= 1. - 0.12 * exp(-max(sd, 0.) / 0.022);
    vec4 lb = texture(uSheet, (vW.xy - uSheetR.xy) / uSheetR.zw) * uPrint;
    o = vec4(lamp(col * (1. - lb.a) + lb.rgb, vec3(0., 0., 1.), vW, 1.), 1.);
  } else {
    float lam = max(0., dot(normalize(vN), L1));
    o = vec4(lamp(vec3(0.83, 0.83, 0.79) * mix(0.6 + 0.42 * lam, 0.9, uLampOn), normalize(vN), vW, 0.), 1.);
  }
}`, 'flat');

// ink: trail segments and stamps rendered into a map-space texture; a fade pass ages old ink
const P_SEG = GL.program(gl, HEAD + `
layout(location = 0) in vec2 aC;
layout(location = 1) in vec4 aSeg;
layout(location = 2) in vec4 aCol;
layout(location = 3) in float aW;
uniform vec4 uMap;
uniform vec2 uTex;
out float vA;
out vec4 vCol;
out float vHW;
out float vT;
out float vLen;
void main() {
  vec2 a = aSeg.xy, b = aSeg.zw, d = b - a;
  float l = length(d);
  vec2 t = l > 1e-9 ? d / l : vec2(1., 0.), n = vec2(-t.y, t.x);
  float px = uMap.z / uTex.x, hw = aW * 0.5 + px;   // half width plus one texel for coverage
  vec2 p = mix(a, b, aC.x) + t * (aC.x * 2. - 1.) * px + n * aC.y * hw;
  vA = aC.y * hw / px; vHW = aW * 0.5 / px; vCol = aCol;
  vT = (aC.x * l + (aC.x * 2. - 1.) * px) / px; vLen = l / px;
  gl_Position = vec4((p - uMap.xy) / uMap.zw * 2. - 1., 0., 1.);
}`, HEAD + `
in float vA;
in vec4 vCol;
in float vHW;
in float vT;
in float vLen;
out vec4 o;
void main() {
  float c = clamp(vHW + 0.5 - abs(vA), 0., 1.) * min(1., vHW * 2.);
  c *= clamp(vT + 0.5, 0., 1.) * clamp(vLen - vT + 0.5, 0., 1.);    // ends cross-fade, so joints are not inked twice
  vec4 pm = vCol * c; o = vec4(1. - (pm.a - pm.rgb), 1.);
}`, 'ink-seg');

const P_STAMP = GL.program(gl, HEAD + `
layout(location = 0) in vec2 aC;
layout(location = 1) in vec4 aS;     // x, y, radius, kind
layout(location = 2) in vec4 aCol;
layout(location = 3) in float aW;
uniform vec4 uMap;
uniform vec2 uTex;
out vec2 vP;
out vec4 vCol;
out float vK;
out float vR;
out float vW;
void main() {
  float px = uMap.z / uTex.x, R = aS.z + aW + 2. * px;
  vP = aC * R / px; vR = aS.z / px; vW = aW / px; vK = aS.w; vCol = aCol;
  gl_Position = vec4((aS.xy + aC * R - uMap.xy) / uMap.zw * 2. - 1., 0., 1.);
}`, HEAD + `
in vec2 vP;
in vec4 vCol;
in float vK;
in float vR;
in float vW;
out vec4 o;
void main() {
  float r = length(vP), c = 0.;
  if (vK < 0.5) c = clamp(vW * 0.5 + 0.5 - abs(r - vR), 0., 1.);                      // ring
  else if (vK < 1.5) {                                                                  // survey station: triangle and centre dot
    vec2 p = vP / vR; p.y = -p.y;
    float e = max(max(-p.y - 0.55, 0.866 * p.x + 0.5 * p.y - 0.55), -0.866 * p.x + 0.5 * p.y - 0.55) * vR;
    c = max(clamp(vW * 0.5 + 0.5 - abs(e), 0., 1.), clamp(vR * 0.2 + 0.5 - r, 0., 1.));
  } else if (vK < 2.5) c = clamp(vR + 0.5 - r, 0., 1.);                                // dot
  else { vec2 a = abs(vP); c = clamp(vW * 0.5 + 0.5 - min(abs(a.x - a.y), 1e9), 0., 1.) * step(max(a.x, a.y), vR); }   // cross
  vec4 pm = vCol * c; o = vec4(1. - (pm.a - pm.rgb), 1.);
}`, 'ink-stamp');

const P_FADE = GL.program(gl, GL.FULLSCREEN_VS, HEAD + `
uniform float uF;
out vec4 o;
void main() { o = vec4(uF); }`, 'ink-fade');

// baking the lamp: visibility toward the lamp (soft, from a marched ray) and ambient occlusion (the
// horizon in twelve directions), over the sheet and a border of table, into the R and G of one texture
const BAKE = `
uniform vec4 uLightR, uSheetR;
uniform vec2 uRes;
uniform float uZs, uTh;
float solid(vec2 p) {            // top of the solid at p: the relief, the sheet, the table
  vec2 q = clamp(p, uMap.xy, uMap.xy + uMap.zw);
  float d = length(p - q), hb = hDraw(q) * uZs;
  if (d == 0.) return hb;
  bool sheet = p.x >= uSheetR.x && p.y >= uSheetR.y && p.x <= uSheetR.x + uSheetR.z && p.y <= uSheetR.y + uSheetR.w;
  return max(sheet ? 0. : -uTh, hb * (1. - d / 0.06));   // a steep fillet at the walls keeps cast edges smooth
}
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 here() { return uLightR.xy + gl_FragCoord.xy / uRes * uLightR.zw; }`;
const P_SHADOW = GL.program(gl, GL.FULLSCREEN_VS, HEAD + HAT + BAKE + `
uniform vec3 uLamp;
uniform float uTop;
out vec4 o;
void main() {
  vec2 p = here();
  float z0 = solid(p) + 0.0015, hz = max(length(uLamp.xy), 1e-3), rise = uLamp.z / hz;
  vec2 dir = uLamp.xy / hz;
  float smax = (uTop - z0) / rise, vis = 1., s = 0.003 * (0.5 + hash(gl_FragCoord.xy));
  for (int k = 0; k < 120; k++) {
    if (s > smax || vis < 0.004) break;
    float c = z0 + rise * s - solid(p + dir * s);
    vis = min(vis, clamp(c / (0.09 * s + 0.003), 0., 1.));     // the penumbra widens with distance
    s += 0.0025 + 0.03 * s;
  }
  o = vec4(smoothstep(0., 1., vis));
}`, 'bake-shadow');
const P_AO = GL.program(gl, GL.FULLSCREEN_VS, HEAD + HAT + BAKE + `
out vec4 o;
void main() {
  vec2 p = here();
  float z0 = solid(p), occ = 0., j = hash(gl_FragCoord.xy);
  for (int a = 0; a < 12; a++) {
    float an = (float(a) + j) * 0.5235988, t = 0., s = 0.005;
    vec2 d = vec2(cos(an), sin(an));
    for (int k = 0; k < 13; k++) { t = max(t, (solid(p + d * s) - z0) / s); s *= 1.34; }
    occ += t / sqrt(1. + t * t);                              // sine of the horizon's elevation
  }
  o = vec4(1. - occ / 12.);
}`, 'bake-ao');

// particles: billboards on the relief with a paper halo, a dot and a heading tick; ghosts are hollow rings.
// Close up, where a particle would stand taller than ~12 px, the dot gives way to a little ink stick man standing on
// the ground: hat, pack and staff, the hat and pack in the optimizer colour, and a gait set by its optimizer's state
const P_WALK = GL.program(gl, HEAD + HAT + `
layout(location = 0) in vec2 aC;
layout(location = 1) in vec4 aP;     // x, y, size (css px), style
layout(location = 2) in vec4 aH;     // hx, hy, alpha, lift
layout(location = 3) in vec3 aCol;
layout(location = 4) in vec4 aG;     // gait: phase, stride amplitude, lean, sway
layout(location = 5) in vec4 aK;     // flail, hop, march, kind (0 stick man, 1 ghost, 2 tent, −1 never a figure)
layout(location = 6) in vec4 aF;     // facing (±1 across the screen), prop, emote, highlight
uniform mat4 uVP;
uniform vec3 uEye;
uniform vec2 uView;
uniform float uZs, uDpr, uPxW, uHW, uDusk;
out vec2 vL;
out vec2 vHd;
out vec3 vCol;
out float vSt;
out float vA;
out float vFig;
out float vHp;
out vec4 vG;
out vec4 vK;
out vec4 vF;
void main() {
  vec3 p = vec3(aP.xy, (hDraw(aP.xy) + aH.w) * uZs);
  p += normalize(uEye - p) * 0.008;
  vec4 c = uVP * vec4(p, 1.);
  vec4 c2 = uVP * vec4(p + vec3(aH.xy * 0.01, 0.), 1.);
  vec2 hd = (c2.xy / c2.w - c.xy / c.w) * uView;
  float hl = length(hd);
  vHd = hl > 1e-7 ? hd / hl : vec2(0.);
  float R = aP.z * uDpr, hp = uHW * uPxW / max(c.w, 1e-4) * uDpr;      // dot radius and figure height, device px
  float Rg = R * (1. + 1.6 * uDusk);                                     // room for a lantern glow round dots at dusk
  float fig = aK.w < -0.5 ? 0. : smoothstep(9., 15., hp / uDpr);
  vec2 lo = vec2(-max(Rg, 0.7 * hp * fig), -max(Rg, 0.16 * hp * fig)), hi = vec2(max(Rg, 0.7 * hp * fig), max(Rg, 1.34 * hp * fig));
  vec2 q = mix(lo, hi, aC * 0.5 + 0.5);
  vL = q; vCol = aCol; vSt = aP.w; vA = aH.z; vFig = fig; vHp = hp; vG = aG; vK = aK; vF = aF;
  c.xy += q * 2. / uView * c.w;
  gl_Position = c;
}`, HEAD + `
uniform float uDpr, uDusk;
in vec2 vL;
in vec2 vHd;
in vec3 vCol;
in float vSt;
in float vA;
in float vFig;
in float vHp;
in vec4 vG;
in vec4 vK;
in vec4 vF;
out vec4 o;
const vec3 INKC = vec3(0.14, 0.15, 0.17), PAPER = vec3(236., 239., 233.) / 255., WARM = vec3(1., 0.76, 0.4), LAMPLIT = vec3(0.92, 0.76, 0.52);
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)); }
vec2 tilt(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x + s * v.y, -s * v.x + c * v.y); }   // positive leans forward (+x)
void over(inout vec4 c, vec3 rgb, float a) { c = vec4(rgb * a, a) + c * (1. - a); }
float box(vec2 q, vec2 b, float r) { vec2 d = abs(q) - b + r; return length(max(d, 0.)) + min(max(d.x, d.y), 0.) - r; }
float tri(vec2 p, vec2 p0, vec2 p1, vec2 p2) {     // signed distance to a triangle
  vec2 e0 = p1 - p0, e1 = p2 - p1, e2 = p0 - p2, v0 = p - p0, v1 = p - p1, v2 = p - p2;
  vec2 q0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0., 1.), q1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0., 1.), q2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0., 1.);
  float s = sign(e0.x * e2.y - e0.y * e2.x);
  vec2 d = min(min(vec2(dot(q0, q0), s * (v0.x * e0.y - v0.y * e0.x)), vec2(dot(q1, q1), s * (v1.x * e1.y - v1.y * e1.x))), vec2(dot(q2, q2), s * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}
#define COV(d, hw) clamp(((hw) - (d)) * cv + 0.5, 0., 1.)
// a camp: a paper tent with a dark door, lit from inside at dusk, and a pennant in the colour of the optimizer that rests there
vec4 tent(vec2 p, float H, vec3 tc) {
  float cv = H, w = max(0.05, 1.25 / H);
  vec4 c = vec4(0.);
  vec2 qs = p / vec2(0.7, 0.07);
  over(c, INKC, 0.2 * (1. - smoothstep(0.5, 1., length(qs))));
  float dT = tri(p, vec2(-0.56, 0.), vec2(0.56, 0.), vec2(0., 0.8)), dD = tri(p, vec2(-0.13, 0.), vec2(0.13, 0.), vec2(0., 0.4));
  float dP = seg(p, vec2(0., 0.8), vec2(0., 1.16)), dF = tri(p, vec2(0., 1.16), vec2(0.34, 1.06), vec2(0., 0.96));
  over(c, mix(PAPER, LAMPLIT, uDusk), (0.6 - 0.25 * uDusk) * clamp((1.6 / cv - min(dT - w * 0.5, min(dP - w * 0.4, dF))) * cv + 0.5, 0., 1.));
  over(c, mix(vec3(0.95, 0.945, 0.915), vec3(0.62, 0.5, 0.38), uDusk), clamp(-dT * cv + 0.5, 0., 1.));
  over(c, INKC, COV(abs(dT), w * 0.5));
  over(c, mix(INKC, WARM, uDusk), COV(dD, 0.));
  over(c, INKC, COV(dP, w * 0.4));
  over(c, tc, COV(dF, 0.));
  vec2 g = p - vec2(0., 0.16);
  c.rgb += WARM * exp(-dot(g, g) / 0.09) * 0.55 * uDusk;
  return c;
}
// hats, in head coordinates (head centre at 0, up +y, facing +x): 0 wide brim, 1 bowler, 2 cap, 3 top hat, 4 shako.
// band: the paper hatband, so that a dark hat still reads as a hat
float hatD(vec2 q, int s, out float band) {
  if (s == 1) { band = seg(q, vec2(-0.08, 0.108), vec2(0.08, 0.108)) - 0.013; return min(seg(q, vec2(-0.13, 0.075), vec2(0.13, 0.075)) - 0.022, max(length(q - vec2(0., 0.1)) - 0.088, 0.075 - q.y)); }
  if (s == 2) { band = length(q - vec2(-0.01, 0.168)) - 0.022; return min(max(length(q - vec2(-0.01, 0.06)) - 0.112, 0.07 - q.y), seg(q, vec2(0.04, 0.075), vec2(0.2, 0.058)) - 0.022); }
  if (s == 3) { band = box(q - vec2(0., 0.115), vec2(0.072, 0.017), 0.); return min(seg(q, vec2(-0.14, 0.07), vec2(0.14, 0.07)) - 0.022, box(q - vec2(0., 0.19), vec2(0.072, 0.115), 0.012)); }
  if (s == 4) { band = min(box(q - vec2(0., 0.215), vec2(0.062, 0.012), 0.), length(q - vec2(0., 0.29)) - 0.035); return min(box(q - vec2(0., 0.165), vec2(0.062, 0.085), 0.01), seg(q, vec2(0., 0.075), vec2(0.15, 0.055)) - 0.02); }
  band = seg(q, vec2(-0.05, 0.095), vec2(0.05, 0.095)) - 0.014;
  return min(seg(q, vec2(-0.17, 0.07), vec2(0.17, 0.07)) - 0.03, seg(q, vec2(0., 0.09), vec2(0., 0.15)) - 0.055);
}
// the stick man in figure units: feet at y = 0, about 1 tall, facing +x. Props: 0 staff, 1 heavy ball, 2 surveyor's rod,
// 3 lantern, 4 spyglass, 5 flag. Emotes: 1 puzzled (a saddle), 2 trudging (a plateau), 3 thrown through the air, 4 waving
vec4 pilgrim(vec2 p, float H, vec3 tc, bool ghost) {
  float ph = vG.x, amp = vG.y, th = vG.z + vG.w, fl = vK.x, aim = vK.y, sq = vK.z;
  int pr = int(vF.y + 0.5), em = int(vF.z + 0.5);
  float hop = pr == 3 && em != 4 ? 1. : 0., mar = pr == 5 ? 1. : 0.;     // Newton hops, sign descent marches
  float cw = 0.; if (em == 7) { cw = sq; sq = 0.; }                        // a cartwheel: sq carries how far round it is
  if (em == 7) { vec2 cc = vec2(0., 0.5); p = cc + tilt(p - cc, -6.2832 * cw) * 1.12; }
  p = vec2(p.x / (1. + 0.14 * sq), p.y / (1. - 0.24 * sq));              // squashed for a moment after bouncing off a wall
  float cv = H, w = max(0.055, 1.25 / H);
  if (em == 3) fl = 1.;
  if (em == 2) th += 0.32;
  if (em == 1) th -= 0.1;
  if (em == 5) { th -= 0.34; fl = 0.; }                                    // skidding: leans back with its heels dug in
  if (em == 6) th += 0.1;                                                   // asleep on its feet
  if (pr == 1 && em != 3 && em != 5 && em < 6) th += 0.14;
  if (em == 7) th = 0.;
  float la = em == 3 ? 0.5 + 0.12 * sin(ph * 2.) : em == 5 ? 0.46 : em == 7 ? 0.55 : amp * sin(ph);
  float lift = hop * 0.2 * abs(sin(ph));
  vec2 hip = vec2(0., 0.44 * cos(em == 3 ? 0.3 : la) + lift);
  vec2 up = tilt(vec2(0., 1.), th);
  vec2 sh = hip + up * 0.27, hc = hip + up * (em == 2 ? 0.39 : 0.42);
  if (em == 6) hc += tilt(vec2(0.03, -0.03), th);                          // its head nodding
  float leg = 0.44 * (1. - 0.3 * hop);
  vec2 f1 = hip + leg * vec2(sin(la), -cos(la)), f2 = hip + leg * vec2(sin(-la), -cos(-la));
  float sw = (1. - mar) * 0.9 * amp * sin(ph) * (em == 2 ? 0.3 : 1.);
  float ar = mix(-sw, 2.7 + 0.35 * sin(ph * 3.), fl), af = mix(0.6 + 0.3 * sw, 2.35 - 0.35 * sin(ph * 3.1), fl);
  if (em == 4) ar = 2.55 + 0.45 * sin(ph * 4.);
  if (em == 5) { ar = ph * 1.4; af = ph * 1.4 + 3.1416; }                 // and windmills its arms
  if (em == 6) { ar = 1.5 + 0.06 * sin(ph); af = 1.42 + 0.06 * sin(ph + 1.); }   // sleepwalking, arms out in front
  if (em == 7) { ar = 2.4; af = -2.4; }                                    // a star, turning
  if (em == 8) { ar = 3.; af = 3.1; }                                      // a stretch on waking
  vec2 h1 = sh + 0.27 * vec2(sin(ar), -cos(ar)), h2 = sh + 0.27 * vec2(sin(af), -cos(af));
  if (em == 1) h1 = hc + tilt(vec2(-0.06, 0.1), th);                    // scratches its head
  vec2 sdir = normalize(mix(vec2(em == 2 ? 0.3 : 0.07, 1.), vec2(0.55, 0.84), fl));
  // props
  vec2 bc = vec2(0.37, 0.085), tip = h2 + mix(vec2(0.16, 0.13), sdir * 0.25, fl), lc = tip - vec2(0., 0.08);
  float sa = pr == 4 ? aim : 0.25 * sin(ph * 0.37);                       // SAM looks along its perturbation, uphill
  float bk = pr == 4 && cos(sa) < 0. ? -1. : 1.;                           // over its shoulder when that lies behind it
  vec2 g0 = hc + tilt(vec2(0.07 * bk, 0.015), th), g1 = g0 + 0.2 * vec2(cos(sa), sin(sa));
  if (pr == 1 && em != 3 && em != 4 && em < 5) { h1 = bc + vec2(-0.07, 0.065); h2 = bc + vec2(-0.05, 0.075); }
  if (pr == 4 && em < 3) h1 = mix(g0, g1, 0.5) - vec2(0., 0.03);
  vec2 s0 = h2 - sdir * 0.58, s1 = h2 + sdir * 0.3;
  bool staff = pr == 0 || pr == 4 || pr == 5 || pr > 5;
  float big = 1e3;
  float dBody = min(min(seg(p, hip, hip + up * 0.32), min(seg(p, hip, f1), seg(p, hip, f2))), min(seg(p, sh, h1), seg(p, sh, h2)));
  float dStaff = staff ? seg(p, s0, s1) : big;
  float dRod = pr == 2 ? seg(p, h2 - sdir * 0.5, h2 + sdir * 0.5) - 0.026 : big;
  float dBall = pr == 1 ? length(p - bc) - 0.085 : big;
  float dPole = pr == 3 ? min(seg(p, h2, tip), seg(p, tip, lc + vec2(0., 0.048))) : big;
  float dLan = pr == 3 ? box(p - lc, vec2(0.038, 0.048), 0.012) : big;
  float dGlass = pr == 4 && em < 3 ? seg(p, g0, g1) - 0.024 : big;
  float dFlag = pr == 5 ? tri(p, s1, s1 + vec2(-0.27, -0.045 + 0.03 * sin(ph * 2.)), s1 + vec2(0., -0.12)) : big;
  // at dusk every stick man carries a light: from the free hand, from the staff for the spyglass, from the pack for the ball
  vec2 hl = pr == 1 ? hip + tilt(vec2(-0.16, 0.13), th) : pr == 4 ? s1 + vec2(0.02, -0.08) : h1 - vec2(0., 0.07);
  vec2 hk = pr == 1 ? hl + vec2(0., 0.04) : pr == 4 ? s1 : h1;
  bool dl = uDusk > 0.01 && pr != 3;
  float dLan2 = dl ? box(p - hl, vec2(0.03, 0.037), 0.01) : big, dHook = dl ? seg(p, hk, hl + vec2(0., 0.037)) : big;
  float r = 0.105;
  float dHead = length(p - hc) - r;
  float band;
  float dHat = hatD(tilt(p - hc, -th), pr == 1 ? 1 : pr == 2 ? 2 : pr == 3 ? 3 : pr == 5 ? 4 : 0, band);
  float dPack = seg(p, hip + tilt(vec2(-0.085, 0.12), th), hip + tilt(vec2(-0.085, 0.22), th));
  vec4 c = vec4(0.);
  vec2 qs = p / vec2(0.26, 0.05);
  if (!ghost) over(c, INKC, 0.2 * (1. - smoothstep(0.5, 1., length(qs))) * (1. - 0.5 * hop) * (em == 3 || em == 7 ? 0.3 : 1.));   // its shadow on the ground
  if (vF.w > 0.5) {                                                      // hovered or followed: a ring at its feet
    float e = length(p / vec2(0.3, 0.075)) - 1.;
    over(c, vF.w > 1.5 ? INKC : tc, COV(abs(e) * 0.075, w * (vF.w > 1.5 ? 0.6 : 0.45)));
  }
  float dAll = min(min(min(dBody - w * 0.5, dStaff - w * 0.4), min(dHead, min(dHat, dPack - 0.06))),
                   min(min(dRod, dBall), min(min(dPole - w * 0.4, dLan), min(min(dGlass, dFlag), min(dLan2, dHook - w * 0.3)))));
  over(c, mix(PAPER, LAMPLIT, uDusk), (0.6 - 0.2 * uDusk) * COV(dAll, 1.6 / cv));                 // paper halo; lamp-lit at dusk
  vec3 ink = ghost ? tc : INKC;
  over(c, tc, COV(dPack, 0.06));
  over(c, ink, COV(dStaff, w * 0.4));
  if (pr == 2) {                                                         // the surveyor's rod, banded in its colour and paper
    vec2 a0 = h2 - sdir * 0.5;
    float t = dot(p - a0, sdir);
    over(c, mix(tc, PAPER, step(0.5, fract(t * 5.))), COV(dRod, 0.));
    over(c, ink, COV(abs(dRod), w * 0.3));
  }
  over(c, ink, COV(dPole, w * 0.4));
  over(c, ink, COV(dHook, w * 0.3));
  over(c, ink, COV(dBody, w * 0.5));
  over(c, PAPER, COV(dHead, 0.));
  over(c, ink, COV(abs(dHead), w * 0.45));
  vec2 eye = em == 1 ? vec2(0.035, 0.035) : em == 2 ? vec2(0.045, -0.015) : vec2(0.048, 0.008);
  if (pr == 4 && em < 3) eye.x *= bk;
  if (em == 6) over(c, ink, COV(seg(p, hc + tilt(vec2(0.022, -0.012), th), hc + tilt(vec2(0.07, -0.012), th)), w * 0.28));   // eyes shut
  else over(c, ink, COV(length(p - hc - tilt(eye, th)), max(0.02, 0.9 / cv)));                         // an eye, looking the way it walks
  over(c, tc, COV(dHat, 0.));
  over(c, ink, COV(abs(dHat), w * 0.22));
  over(c, PAPER, COV(band, 0.) * step(dHat, 0.));
  if (pr == 1) {                                                         // the heavy ball, rolling
    over(c, tc, COV(dBall, 0.));
    vec2 rr = vec2(cos(-ph * 1.7), sin(-ph * 1.7)) * 0.085;
    over(c, PAPER, COV(seg(p, bc - rr, bc + rr), w * 0.25) * step(dBall, 0.));
    over(c, ink, COV(abs(dBall), w * 0.4));
  }
  if (pr == 3) { over(c, mix(vec3(0.97, 0.86, 0.58), vec3(1., 0.9, 0.6), uDusk), COV(dLan, 0.)); over(c, ink, COV(abs(dLan), w * 0.3)); }
  if (pr == 4) { over(c, vec3(0.72, 0.58, 0.3), COV(dGlass, 0.)); over(c, ink, COV(abs(dGlass), w * 0.28)); }
  if (pr == 5) { over(c, tc, COV(dFlag, 0.)); over(c, ink, COV(abs(dFlag), w * 0.25)); }
  if (dl) { over(c, vec3(1., 0.9, 0.6), COV(dLan2, 0.)); over(c, ink, COV(abs(dLan2), w * 0.28)); }
  if (uDusk > 0.01) {                                                    // the lantern's glow, added
    vec2 gv = p - (pr == 3 ? lc : hl);
    c.rgb += WARM * exp(-dot(gv, gv) / 0.025) * 0.45 * uDusk;
  }
  return ghost ? c * 0.45 : c;
}
// a camper at a rest point, the fire to its +x. vG: time, pose (0 lying back, 1 sitting, 2 standing hunched), what it is
// doing, a seed; vK: a greeting (1 a wave, 2 a raised hat) and its progress, then how toasted its marshmallow is
vec4 camper(vec2 p, float H, vec3 tc) {
  float t = vG.x, sd = vG.w, gu = vK.y, toast = vK.z;
  int pose = int(vG.y + 0.5), act = int(vG.z + 0.5), pr = int(vF.y + 0.5), gr = int(vK.x + 0.5);
  float cv = H, w = max(0.055, 1.25 / H), big = 1e3, wv = 0.45 * sin(t * 9.), lift = sin(3.1416 * clamp(gu, 0., 1.));
  float th = 0., hatTh = 0., dStick = big, dMal = big, dBook = big, dPen = big;
  vec2 hip = vec2(0.), sh = vec2(0.), hc = vec2(0.), e1 = vec2(0.), h1 = vec2(0.), e2 = vec2(0.), h2 = vec2(0.);
  vec2 k1 = vec2(0.), f1 = vec2(0.), k2 = vec2(0.), f2 = vec2(0.), hatC = vec2(0.), eye = vec2(0.048, 0.008);
  bool onFace = false;
  if (pose == 0) {                                       // on its back, head at −x
    float br = 0.008 * sin(t * 1.7 + sd * 6.);
    hip = vec2(0.06, 0.07); sh = vec2(-0.2, 0.08 + br); hc = vec2(-0.33, 0.105);
    k1 = vec2(0.22, 0.24); f1 = vec2(0.38, 0.02); k2 = vec2(0.27, 0.06); f2 = vec2(0.48, 0.04);
    e1 = vec2(-0.24, 0.25); h1 = vec2(-0.37, 0.2);       // a hand behind its head
    e2 = vec2(-0.09, 0.16); h2 = vec2(0.03, 0.115);      // the other on its belly
    eye = vec2(0.02, 0.07);
    hatC = vec2(-0.53, -0.07);                           // its hat on the grass
    if (act == 1) { vec2 d = normalize(vec2(0.3 + 0.1 * sin(t * 0.6 + sd * 9.), 1.)); e1 = sh + 0.15 * d; h1 = sh + 0.31 * d; }   // pointing at the stars
    if (act == 2) { onFace = true; e1 = vec2(-0.12, 0.17); h1 = vec2(-0.02, 0.125); hatC = hc + vec2(0., 0.035 + (gr == 2 ? 0.1 * lift : 0.)); }   // asleep under its hat
    if (gr == 1 || (gr == 2 && !onFace)) { vec2 d = vec2(sin(0.35 + wv), cos(0.35 + wv)); e1 = sh + 0.15 * d; h1 = sh + 0.31 * d; }
  } else {
    float sx = pose == 2 ? 0.006 * sin(t * 47. + sd * 20.) : 0.;    // a shiver
    if (pose == 1) {                                     // sitting by the fire
      th = act == 1 ? 0.24 : 0.06;
      hip = vec2(0., 0.1);
      k1 = vec2(0.19, 0.22); f1 = vec2(0.28, 0.); k2 = vec2(0.15, 0.19); f2 = vec2(0.24, 0.);
    } else {                                             // standing hunched, as close to the fire as it can get
      th = 0.2;
      hip = vec2(sx * 0.3, 0.4);
      k1 = vec2(0.06, 0.2); f1 = vec2(0.03, 0.); k2 = vec2(0.03, 0.2); f2 = vec2(-0.03, 0.);
    }
    vec2 up = tilt(vec2(0., 1.), th);
    sh = hip + up * (pose == 2 ? 0.23 : 0.27);
    hc = hip + up * (pose == 2 ? 0.35 : 0.42) + vec2(sx, pose == 1 ? 0.006 * sin(t * 1.3 + sd * 5.) : 0.);
    hatC = hc; hatTh = th;
    if (pose == 2) { e1 = sh + vec2(0.1, -0.05); h1 = sh + vec2(0.22 + sx, -0.03); e2 = sh + vec2(0.09, -0.02); h2 = sh + vec2(0.2 - sx, 0.03); eye = vec2(0.045, -0.01); }
    else if (act == 1) {                                 // writing up the log on its knees
      vec2 bc = vec2(0.2, 0.27), bd = vec2(cos(0.45), sin(0.45)), q = p - bc;
      dBook = box(vec2(dot(q, bd), dot(q, vec2(-bd.y, bd.x))), vec2(0.075, 0.014), 0.004);
      h2 = bc + bd * 0.03 * sin(t * 4. + sd * 7.) + vec2(0., 0.035) + 0.008 * vec2(sin(t * 13.), cos(t * 11.));
      dPen = seg(p, h2, h2 + vec2(0.035, -0.035));
      e2 = mix(sh, h2, 0.5) + vec2(0., -0.03);
      h1 = bc - bd * 0.07; e1 = mix(sh, h1, 0.5) + vec2(-0.02, -0.03);
      eye = vec2(0.04, -0.035);
    } else if (act == 3) {                               // arms round its knees
      h1 = k1 + vec2(-0.01, -0.02); e1 = mix(sh, h1, 0.5) + vec2(0.03, -0.03); h2 = k2 + vec2(-0.01, -0.03); e2 = mix(sh, h2, 0.5) + vec2(0.03, -0.04);
    } else {                                             // toasting something on a stick
      vec2 sdr = normalize(vec2(1., 0.28));
      h2 = sh + vec2(0.2, -0.05); e2 = mix(sh, h2, 0.5) + vec2(0., -0.03);
      vec2 tipS = h2 + sdr * 0.26 + vec2(0., 0.012 * sin(t * 1.3 + sd * 4.));
      dStick = seg(p, h2 - sdr * 0.05, tipS);
      dMal = length((p - tipS - sdr * 0.02) / vec2(1.3, 1.)) - 0.026;
      h1 = k1 + vec2(-0.03, 0.03); e1 = mix(sh, h1, 0.5) + vec2(0.02, -0.02);
    }
    if (gr == 1) { float a = 2.55 + wv; h1 = sh + 0.27 * vec2(sin(a), -cos(a)); e1 = mix(sh, h1, 0.5); }
    if (gr == 2) { hatC = hc + up * 0.08 * lift; hatTh = th - 0.35 * lift; h1 = hatC + up * 0.2; e1 = mix(sh, h1, 0.5) + vec2(0.05, 0.); }
  }
  float dBody = min(min(seg(p, hip, sh), seg(p, sh, hc)), min(min(seg(p, hip, k1), seg(p, k1, f1)), min(seg(p, hip, k2), seg(p, k2, f2))));
  dBody = min(dBody, min(min(seg(p, sh, e1), seg(p, e1, h1)), min(seg(p, sh, e2), seg(p, e2, h2))));
  float dHead = length(p - hc) - 0.105, band;
  float dHat = hatD(tilt(p - hatC, -hatTh), pr == 1 ? 1 : pr == 2 ? 2 : pr == 3 ? 3 : pr == 5 ? 4 : 0, band);
  vec4 c = vec4(0.);
  vec2 qs = (p - vec2(pose == 0 ? 0.05 : 0.08, 0.)) / vec2(pose == 0 ? 0.55 : 0.28, 0.06);
  over(c, INKC, 0.2 * (1. - smoothstep(0.5, 1., length(qs))));
  float dAll = min(min(dBody - w * 0.5, min(dHead, dHat)), min(min(dStick - w * 0.4, dMal), min(dBook, dPen - w * 0.3)));
  over(c, mix(PAPER, LAMPLIT, uDusk), (0.6 - 0.2 * uDusk) * COV(dAll, 1.6 / cv));
  over(c, INKC, COV(dStick, w * 0.35));
  over(c, INKC, COV(dBody, w * 0.5));
  over(c, PAPER, COV(dHead, 0.));
  over(c, INKC, COV(abs(dHead), w * 0.45));
  if (!onFace) over(c, INKC, COV(length(p - hc - tilt(eye, th)), max(0.02, 0.9 / cv)));
  over(c, tc, COV(dHat, 0.));
  over(c, INKC, COV(abs(dHat), w * 0.22));
  over(c, PAPER, COV(band, 0.) * step(dHat, 0.));
  if (dMal < 500.) { over(c, mix(vec3(0.97, 0.95, 0.9), vec3(0.62, 0.4, 0.2), toast), COV(dMal, 0.)); over(c, INKC, COV(abs(dMal), w * 0.25)); }
  if (dBook < 500.) { over(c, vec3(0.96, 0.95, 0.9), COV(dBook, 0.)); over(c, INKC, COV(abs(dBook), w * 0.25)); over(c, INKC, COV(dPen, w * 0.3)); }
  if (uDusk > 0.01) c.rgb += WARM * 0.22 * uDusk * smoothstep(-0.2, 0.5, p.x) * c.a;      // firelight on the side that faces the fire
  return c;
}
void main() {
  float u = uDpr, r = length(vL);
  vec4 c = vec4(0.);
  if (vFig < 1. && vK.w < 2.5) {
    if (vSt < 0.5) {
      float halo = clamp(2.8 * u + 0.5 - r, 0., 1.) * 0.62 * (1. - 0.5 * uDusk);
      c = vec4(PAPER * halo, halo);
      float along = dot(vL, vHd), across = abs(vL.x * vHd.y - vL.y * vHd.x);
      float tick = clamp(0.5 * u + 0.5 - across, 0., 1.) * step(2.4 * u, along) * step(along, 5.8 * u) * step(0.5, dot(vHd, vHd));
      float dt = max(clamp(1.6 * u + 0.5 - r, 0., 1.), tick);
      c = vec4(vCol, 1.) * dt + c * (1. - dt);
      c.rgb += WARM * exp(-r * r / (2. * 12.25 * u * u)) * 0.3 * uDusk;      // a lantern seen from far off
    } else {
      float ring = clamp(0.6 * u + 0.5 - abs(r - 3.6 * u), 0., 1.), dot0 = clamp(0.9 * u + 0.5 - r, 0., 1.);
      float halo = clamp(4.9 * u + 0.5 - r, 0., 1.) * 0.55;
      c = vec4(PAPER * halo, halo);
      float k = max(ring, dot0);
      c = vec4(mix(vCol, INKC, step(0.5, dot0) * (1. - ring)), 1.) * k + c * (1. - k);
    }
    c *= 1. - vFig;
  }
  if (vFig > 0.) {
    vec2 p = vL / vHp; p.x *= vF.x;
    vec4 f = (vK.w > 2.5 ? camper(p, vHp, vCol) : vK.w > 1.5 ? tent(vL / vHp, vHp, vCol) : pilgrim(p, vHp, vCol, vSt > 0.5 || vK.w > 0.5)) * vFig;
    c = f + c * (1. - f.a);
  }
  o = c * vA;
}`, 'walkers');

// lines: draped on the relief (z from the height texture) or aerial (z given), dashed in world units
const P_RIB = GL.program(gl, HEAD + HAT + `
layout(location = 0) in vec4 aA;    // x, y, zL, drape
layout(location = 1) in vec4 aB;
layout(location = 2) in vec4 aS;    // t (0 at A, 1 at B), side, distA, distB
layout(location = 3) in vec4 aCol;
layout(location = 4) in vec2 aW;    // width (css px), dash period (world)
uniform mat4 uVP;
uniform vec2 uView;
uniform float uZs, uDpr, uPxW;   // uPxW: css px per world unit at unit distance
out float vAc;
out float vHW;
out float vD;
out float vDash;
out vec4 vCol;
vec3 pos(vec4 a) { return vec3(a.xy, (a.w > 0.5 ? hDraw(a.xy) + a.z : a.z) * uZs + 0.0025 * a.w); }
void main() {
  vec4 ca = uVP * vec4(pos(aA), 1.), cb = uVP * vec4(pos(aB), 1.);
  vec2 sa = ca.xy / ca.w * uView * .5, sb = cb.xy / cb.w * uView * .5;
  vec2 dir = sb - sa; float l = length(dir); dir = l > 1e-6 ? dir / l : vec2(1., 0.);
  vec2 nrm = vec2(-dir.y, dir.x);
  vec4 c = aS.x < 0.5 ? ca : cb;
  float w = aW.x < 0. ? -aW.x * uPxW / max(c.w, 1e-4) : aW.x, hw = w * 0.5 * uDpr + 1.;
  c.xy += (nrm * aS.y * hw + dir * (aS.x * 2. - 1.) * 0.5) / (uView * .5) * c.w;
  vAc = aS.y * hw; vHW = w * 0.5 * uDpr; vD = mix(aS.z, aS.w, aS.x); vDash = aW.y; vCol = aCol;
  gl_Position = c;
}`, HEAD + `
in float vAc;
in float vHW;
in float vD;
in float vDash;
in vec4 vCol;
out vec4 o;
void main() {
  float c = clamp(vHW + 0.5 - abs(vAc), 0., 1.) * min(1., vHW * 2.);
  if (vDash > 0.) { float ph = fract(vD / vDash); c *= step(ph, 0.58); }
  o = vCol * c;
}`, 'lines');

const P_MIST = GL.program(gl, HEAD + HAT + `
layout(location = 0) in vec2 aUV;
uniform mat4 uVP;
uniform float uZs, uLift;
out vec2 vXY;
void main() {
  vXY = uMap.xy + aUV * uMap.zw;
  gl_Position = uVP * vec4(vXY, hDraw(vXY) * uZs + uLift, 1.);
}`, HEAD + `
uniform highp sampler2D uData;
uniform vec4 uMap;
uniform vec2 uGrid;
uniform vec3 uC1, uC2;
uniform float uT1, uT2, uW2, uLmin, uA, uDrift;
in vec2 vXY;
out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float grain(vec2 p) { vec2 i = floor(p), f = p - i, u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + 1.), u.x), u.y); }
void main() {
  vec2 g = clamp((vXY - uMap.xy) / uMap.zw, 0., 1.) * (uGrid - 1.);
  ivec2 i = ivec2(min(floor(g), uGrid - 2.));
  vec2 f = g - vec2(i);
  float h = mix(mix(texelFetch(uData, i, 0).x, texelFetch(uData, i + ivec2(1, 0), 0).x, f.x),
                mix(texelFetch(uData, i + ivec2(0, 1), 0).x, texelFetch(uData, i + ivec2(1, 1), 0).x, f.x), f.y);
  float e = max(0., h - uLmin);
  float w = uA * (0.72 + 0.56 * (0.62 * grain(vXY * 6. + uDrift * vec2(0.031, 0.017)) + 0.38 * grain(vXY * 17. - uDrift * vec2(0.022, 0.04))));
  // optical depth proportional to each density (relative to its peak at the lowest point), opacity by Beer–Lambert
  float a1 = 1. - exp(-w * exp(-e / uT1)), a2 = uW2 * (1. - exp(-w * exp(-e / uT2)));
  vec3 c = uC1 * a1;
  c = uC2 * a2 + c * (1. - a2);
  o = vec4(c, a2 + a1 * (1. - a2));
}`, 'mist');

// --- buffers and geometry
const quadC = new Float32Array([0, -1, 1, -1, 1, 1, 0, -1, 1, 1, 0, 1]);           // along 0..1, across -1..1
const quadS = new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]);
function vbo(data, usage) { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage || gl.STATIC_DRAW); return b; }
function attr(loc, buf, size, stride, off, div) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off);
  gl.vertexAttribDivisor(loc, div || 0);
}
// relief mesh: every second grid node
const MSTEP = 2, MW = Math.floor((GW - 1) / MSTEP), MH = Math.floor((GH - 1) / MSTEP);
const meshVAO = gl.createVertexArray();
let meshCount = 0;
{
  const uv = new Float32Array((MW + 1) * (MH + 1) * 2);
  for (let j = 0, k = 0; j <= MH; j++) for (let i = 0; i <= MW; i++, k += 2) { uv[k] = i * MSTEP / (GW - 1); uv[k + 1] = j * MSTEP / (GH - 1); }
  const idx = new Uint32Array(MW * MH * 6);
  for (let j = 0, q = 0; j < MH; j++) for (let i = 0; i < MW; i++) {
    const a = j * (MW + 1) + i, b = a + 1, c = a + MW + 1, d = c + 1;
    idx[q++] = a; idx[q++] = b; idx[q++] = d; idx[q++] = a; idx[q++] = d; idx[q++] = c;
  }
  gl.bindVertexArray(meshVAO);
  attr(0, vbo(uv), 2, 8, 0);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  meshCount = idx.length;
  gl.bindVertexArray(null);
}
// walls round the relief
const wallVAO = gl.createVertexArray();
let wallCount = 0;
{
  const V = [];
  const edge = (n, f, nx, ny) => {
    for (let s = 0; s < n; s++) {
      const [ua, va] = f(s / n), [ub, vb] = f((s + 1) / n);
      V.push(ua, va, 0, nx, ny, ub, vb, 0, nx, ny, ub, vb, 1, nx, ny, ua, va, 0, nx, ny, ub, vb, 1, nx, ny, ua, va, 1, nx, ny);
    }
  };
  edge(MW, (t) => [t, 0], 0, -1); edge(MW, (t) => [1 - t, 1], 0, 1); edge(MH, (t) => [0, 1 - t], -1, 0); edge(MH, (t) => [1, t], 1, 0);
  const a = new Float32Array(V);
  gl.bindVertexArray(wallVAO);
  const b = vbo(a); attr(0, b, 3, 20, 0); attr(1, b, 2, 20, 12);
  wallCount = a.length / 5;
  gl.bindVertexArray(null);
}
// sheet, board and table
const ML = 0.13, MR = 0.13, MT = 0.17, MB = 0.25, TH = 0.035;
const SX0 = X0 - ML, SX1 = X1 + MR, SY0 = Y0 - MB, SY1 = Y1 + MT, SW = SX1 - SX0, SH = SY1 - SY0;
const flatVAO = gl.createVertexArray();
let flatCount = 0;
{
  const V = [];
  const quad = (p, n, m) => { for (const k of [0, 1, 2, 0, 2, 3]) V.push(p[k][0], p[k][1], p[k][2], n[0], n[1], n[2], m); };
  const G = 16, cx = (SX0 + SX1) / 2, cy = (SY0 + SY1) / 2;
  quad([[cx - G, cy - G, -TH], [cx + G, cy - G, -TH], [cx + G, cy + G, -TH], [cx - G, cy + G, -TH]], [0, 0, 1], 0);
  quad([[SX0, SY0, 0], [SX1, SY0, 0], [SX1, SY1, 0], [SX0, SY1, 0]], [0, 0, 1], 1);
  quad([[SX0, SY0, -TH], [SX1, SY0, -TH], [SX1, SY0, 0], [SX0, SY0, 0]], [0, -1, 0], 2);
  quad([[SX1, SY1, -TH], [SX0, SY1, -TH], [SX0, SY1, 0], [SX1, SY1, 0]], [0, 1, 0], 2);
  quad([[SX0, SY1, -TH], [SX0, SY0, -TH], [SX0, SY0, 0], [SX0, SY1, 0]], [-1, 0, 0], 2);
  quad([[SX1, SY0, -TH], [SX1, SY1, -TH], [SX1, SY1, 0], [SX1, SY0, 0]], [1, 0, 0], 2);
  const a = new Float32Array(V);
  gl.bindVertexArray(flatVAO);
  const b = vbo(a); attr(0, b, 3, 28, 0); attr(1, b, 3, 28, 12); attr(2, b, 1, 28, 24);
  flatCount = a.length / 7;
  gl.bindVertexArray(null);
}
// textures
function tex2D(w, h, internal, levels, filterMip) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texStorage2D(gl.TEXTURE_2D, levels, internal, w, h);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterMip ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterMip ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (filterMip && ANISO) gl.texParameterf(gl.TEXTURE_2D, ANISO.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(ANISO.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  t.width = w; t.height = h;
  return t;
}
const mips = (w, h) => Math.floor(Math.log2(Math.max(w, h))) + 1;
const dataTex = tex2D(GW, GH, gl.RGBA32F, 1, false);
const PXU = Math.min(PHONE ? 380 : 760, Math.floor(MAXTEX / SW));
const SHW = Math.round(SW * PXU), SHH = Math.round(SH * PXU);
const sheetTex = tex2D(SHW, SHH, gl.RGBA8, mips(SHW, SHH), true);
const namesTex = tex2D(SHW, SHH, gl.RGBA8, mips(SHW, SHH), true);
const maskTex = tex2D(SHW, SHH, gl.R8, mips(SHW, SHH), true);
const INKW = Math.min(MAXTEX, PHONE ? 1600 : 3200), INKH = Math.round(INKW * MAPH / MAPW);
const inkTex = tex2D(INKW, INKH, gl.RGBA8, mips(INKW, INKH), true);
const inkFbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, inkFbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, inkTex, 0);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
const LMB = 1.1, LMW = PHONE ? 640 : 1280, LMH = Math.round(LMW * (SH + 2 * LMB) / (SW + 2 * LMB));
const lightTex = tex2D(LMW, LMH, gl.RG8, 1, false);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
const lightFbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, lightFbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lightTex, 0);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
// instanced ink, particles and lines
const SEG_CAP = 16384, STAMP_CAP = 1024;
const SEGB = new Float32Array(SEG_CAP * 9), STAMPB = new Float32Array(STAMP_CAP * 9);
let segN = 0, stampN = 0;
const segBuf = vbo(SEGB.byteLength, gl.DYNAMIC_DRAW), stampBuf = vbo(STAMPB.byteLength, gl.DYNAMIC_DRAW);
const segVAO = gl.createVertexArray(), stampVAO = gl.createVertexArray();
gl.bindVertexArray(segVAO);
attr(0, vbo(quadC), 2, 8, 0); attr(1, segBuf, 4, 36, 0, 1); attr(2, segBuf, 4, 36, 16, 1); attr(3, segBuf, 1, 36, 32, 1);
gl.bindVertexArray(stampVAO);
attr(0, vbo(quadS), 2, 8, 0); attr(1, stampBuf, 4, 36, 0, 1); attr(2, stampBuf, 4, 36, 16, 1); attr(3, stampBuf, 1, 36, 32, 1);
const CAP = 2400;
const WALKB = new Float32Array((CAP * 2 + 96) * 11);
const walkBuf = vbo(WALKB.byteLength, gl.DYNAMIC_DRAW);
const walkVAO = gl.createVertexArray();
gl.bindVertexArray(walkVAO);
attr(0, vbo(quadS), 2, 8, 0); attr(1, walkBuf, 4, 44, 0, 1); attr(2, walkBuf, 4, 44, 16, 1); attr(3, walkBuf, 3, 44, 32, 1);
const GAITB = new Float32Array((CAP * 2 + 96) * 12), gaitBuf = vbo(GAITB.byteLength, gl.DYNAMIC_DRAW);    // per instance: gait, kind, facing
attr(4, gaitBuf, 4, 48, 0, 1); attr(5, gaitBuf, 4, 48, 16, 1); attr(6, gaitBuf, 4, 48, 32, 1);
const RIB_CAP = 60000;
const RIBB = new Float32Array(RIB_CAP * 6 * 18);
const ribBuf = vbo(RIBB.byteLength, gl.DYNAMIC_DRAW);
const ribVAO = gl.createVertexArray();
gl.bindVertexArray(ribVAO);
attr(0, ribBuf, 4, 72, 0); attr(1, ribBuf, 4, 72, 16); attr(2, ribBuf, 4, 72, 32); attr(3, ribBuf, 4, 72, 48); attr(4, ribBuf, 2, 72, 64);
// the followed particle's recent steps, draped on the relief with a world-unit width; rebuilt as it walks
const TRAILN = 200, TRSEG_CAP = 4000, TRX = new Float64Array(TRAILN), TRY = new Float64Array(TRAILN);
const TRB = new Float32Array(TRSEG_CAP * 6 * 18), trBuf = vbo(TRB.byteLength, gl.DYNAMIC_DRAW), trVAO = gl.createVertexArray();
let trHead = 0, trLen = 0, trN = 0, trDirty = false;
gl.bindVertexArray(trVAO);
attr(0, trBuf, 4, 72, 0); attr(1, trBuf, 4, 72, 16); attr(2, trBuf, 4, 72, 32); attr(3, trBuf, 4, 72, 48); attr(4, trBuf, 2, 72, 64);
gl.bindVertexArray(null);

// ---------------------------------------------------------------------------------------------
// the printed layer: names, contour figures, symbols, plate overlays and the margin furniture are
// drawn on a canvas in the coordinates of the original paper sheet (370 print units per θ unit)
// ---------------------------------------------------------------------------------------------
const OPU = 370;
const ox = (x) => (x - SX0) * OPU, oy = (y) => (SY1 - y) * OPU;
const wxo = (px) => SX0 + px / OPU, wyo = (py) => SY1 - py / OPU;
const mapL = ox(X0), mapR = ox(X1), mapT = oy(Y1), mapB = oy(Y0), mapW = mapR - mapL, mapH = mapB - mapT, sheetWo = SW * OPU;
const sheetCv = document.createElement('canvas'), maskCv = document.createElement('canvas'), namesCv = document.createElement('canvas');
namesCv.width = SHW; namesCv.height = SHH;
const nc = namesCv.getContext('2d');
let SIGNS = [];
sheetCv.width = maskCv.width = SHW; sheetCv.height = maskCv.height = SHH;
const sc = sheetCv.getContext('2d'), mc = maskCv.getContext('2d');
const SERIF = 'Newsreader, "Iowan Old Style", Palatino, Georgia, serif', MONO = '"Fragment Mono", ui-monospace, Menlo, monospace';
const FS = 1.32;                       // print sizes are enlarged a little because the model is seen from further away
let BOXES = [], CLABELS = 0, NAMES = { areas: [], paths: [], marks: [] };
const boxHit = (b) => { for (const r of BOXES) if (b[0] < r[2] && b[2] > r[0] && b[1] < r[3] && b[3] > r[1]) return true; return false; };
const inMap = (b, m) => b[0] > mapL + m && b[2] < mapR - m && b[1] > mapT + m && b[3] < mapB - m;
function textBox(x, y, w, h, pad) { return [x - w / 2 - pad, y - h / 2 - pad, x + w / 2 + pad, y + h / 2 + pad]; }
function meas(font, ls, txt) { sc.font = font; sc.letterSpacing = ls + 'px'; const w = sc.measureText(txt).width; sc.letterSpacing = '0px'; return w; }

const MSQ = [null, [3, 2], [2, 1], [3, 1], [0, 1], null, [0, 2], [3, 0], [3, 0], [0, 2], null, [0, 1], [3, 1], [2, 1], [3, 2], null];
function chainSegs(S) { // S: flat [x1,y1,x2,y2,k1,k2]*; returns arrays of [x,y,x,y...]
  const n = S.length / 6, m1 = new Map(), m2 = new Map(), used = new Uint8Array(n), out = [];
  for (let s = 0; s < n; s++) for (let e = 4; e <= 5; e++) { const k = S[s * 6 + e]; if (m1.has(k)) m2.set(k, s); else m1.set(k, s); }
  const other = (k, s) => { const a = m1.get(k); if (a !== s) return a; const b = m2.get(k); return b === undefined ? -1 : b; };
  for (let s0 = 0; s0 < n; s0++) {
    if (used[s0]) continue; used[s0] = 1;
    const fw = [S[s0 * 6], S[s0 * 6 + 1], S[s0 * 6 + 2], S[s0 * 6 + 3]], bw = [];
    for (let dir = 0; dir < 2; dir++) {
      let k = S[s0 * 6 + (dir ? 4 : 5)], s = s0;
      for (;;) {
        const t = other(k, s); if (t < 0 || used[t]) break; used[t] = 1;
        const first = S[t * 6 + 4] === k, px = first ? S[t * 6 + 2] : S[t * 6], py = first ? S[t * 6 + 3] : S[t * 6 + 1];
        if (dir) bw.push(px, py); else fw.push(px, py);
        k = first ? S[t * 6 + 5] : S[t * 6 + 4]; s = t;
      }
    }
    const pts = [];
    for (let q = bw.length - 2; q >= 0; q -= 2) pts.push(bw[q], bw[q + 1]);
    for (let q = 0; q < fw.length; q++) pts.push(fw[q]);
    out.push(pts);
  }
  return out;
}
// iso-lines of any gridded field (row 0 = south), returned as chains in print units
function isoChains(G, W, H, x0, y0, dx, dy, lev) {
  const S = [], P = new Float64Array(4);
  const ep = (e, a, b, c, d, i, j, o) => {
    let t, x, y;
    if (e === 0) { t = (lev - a) / (b - a); x = i + t; y = j; }
    else if (e === 1) { t = (lev - b) / (c - b); x = i + 1; y = j + t; }
    else if (e === 2) { t = (lev - d) / (c - d); x = i + t; y = j + 1; }
    else { t = (lev - a) / (d - a); x = i; y = j + t; }
    P[o] = ox(x0 + x * dx); P[o + 1] = oy(y0 + y * dy);
  };
  const key = (e, i, j) => e === 0 ? (j * W + i) * 2 : e === 2 ? ((j + 1) * W + i) * 2 : e === 3 ? (j * W + i) * 2 + 1 : (j * W + i + 1) * 2 + 1;
  for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) {
    const q = j * W + i, a = G[q], b = G[q + 1], c = G[q + W + 1], d = G[q + W];
    const cs = (a > lev ? 8 : 0) | (b > lev ? 4 : 0) | (c > lev ? 2 : 0) | (d > lev ? 1 : 0);
    if (cs === 0 || cs === 15) continue;
    let pr;
    if (cs === 5 || cs === 10) { const up = (a + b + c + d) * 0.25 > lev; pr = cs === 5 ? (up ? [3, 0, 2, 1] : [3, 2, 0, 1]) : (up ? [0, 1, 3, 2] : [3, 0, 2, 1]); }
    else pr = MSQ[cs];
    for (let p = 0; p < pr.length; p += 2) {
      ep(pr[p], a, b, c, d, i, j, 0); ep(pr[p + 1], a, b, c, d, i, j, 2);
      S.push(P[0], P[1], P[2], P[3], key(pr[p], i, j), key(pr[p + 1], i, j));
    }
  }
  return chainSegs(S);
}
const fmtLev = (v, iv) => v.toFixed(Math.abs(Math.round(iv * 500) - iv * 500) < 1e-6 ? 2 : 3);
function contourFigures() {
  const iv = F.params.interval, c = sc;
  const sub = PHONE ? 1 : 2, W = Math.floor((GW - 1) / sub) + 1, H = Math.floor((GH - 1) / sub) + 1;
  const G = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) G[j * W + i] = HG[j * sub * GW + i * sub];
  const chains = [];
  for (let li = Math.ceil(HMIN / iv); li <= Math.floor(HMAX / iv); li++) {
    if (li % 5 !== 0) continue;
    for (const pts of isoChains(G, W, H, X0, Y0, GDX * sub, GDY * sub, li * iv)) {
      const n = pts.length / 2, cum = new Float64Array(n);
      for (let k = 1; k < n; k++) cum[k] = cum[k - 1] + Math.hypot(pts[2 * k] - pts[2 * k - 2], pts[2 * k + 1] - pts[2 * k - 1]);
      chains.push({ pts, cum, len: cum[n - 1], li });
    }
  }
  const at = (ch, s, o) => {
    const C = ch.cum, n = C.length; let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (C[m] < s) lo = m; else hi = m; }
    const t = (s - C[lo]) / Math.max(1e-9, C[hi] - C[lo]);
    o[0] = ch.pts[2 * lo] + (ch.pts[2 * hi] - ch.pts[2 * lo]) * t; o[1] = ch.pts[2 * lo + 1] + (ch.pts[2 * hi + 1] - ch.pts[2 * lo + 1]) * t;
  };
  chains.sort((p, q) => q.len - p.len);
  const fsz = 7.5 * FS;
  c.font = `400 ${fsz}px ${MONO}`;
  const A = [0, 0], B = [0, 0], M = [0, 0], cent = [], labs = [], maxL = 22;
  CLABELS = 0;
  for (const ch of chains) {
    if (CLABELS >= maxL || ch.len < 150) continue;
    const txt = fmtLev(ch.li * iv, iv), w = c.measureText(txt).width + 6;
    let last = -1e9;
    for (let s = 40; s < ch.len - 40 && CLABELS < maxL; s += 16) {
      if (s - last < 300) continue;
      at(ch, s - w / 2, A); at(ch, s + w / 2, B); at(ch, s, M);
      if (Math.hypot(B[0] - A[0], B[1] - A[1]) < 0.95 * w) continue;
      const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
      if (Math.hypot(M[0] - mid[0], M[1] - mid[1]) > 1.2) continue;
      let ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
      const ex = (w / 2 + 2) * Math.abs(Math.cos(ang)) + 6 * Math.abs(Math.sin(ang)), ey = (w / 2 + 2) * Math.abs(Math.sin(ang)) + 6 * Math.abs(Math.cos(ang));
      const box = [M[0] - ex, M[1] - ey, M[0] + ex, M[1] + ey];
      if (!inMap(box, 16) || boxHit(box)) continue;
      let near = false; for (const p of cent) if (Math.hypot(p[0] - M[0], p[1] - M[1]) < 110) { near = true; break; }
      if (near) continue;
      grad(wxo(M[0]), wyo(M[1]));
      if (Math.sin(ang) * gX + Math.cos(ang) * gY < 0) ang += Math.PI;   // the figure's top points uphill
      labs.push([M[0], M[1], ang, txt, w]); BOXES.push(box); cent.push([M[0], M[1]]); CLABELS++; last = s;
    }
  }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const [x, y, a, txt, w] of labs) {
    c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = 'rgba(100,66,38,0.95)'; c.fillText(txt, 0, 0.4); c.restore();
    mc.save(); mc.translate(x, y); mc.rotate(a); mc.fillStyle = '#fff'; mc.fillRect(-w / 2, -fsz * 0.62, w, fsz * 1.24); mc.restore();
  }
}
// escarpment symbol round a mesa: tapered wedges, alternately long and short, down the fall line of the rim
function escarpment() {
  if (!PLon) return;
  const sub = 2, W = Math.floor((GW - 1) / sub) + 1, H = Math.floor((GH - 1) / sub) + 1, PM = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = X0 + i * sub * GDX, y = Y0 + j * sub * GDY;
    PM[j * W + i] = plateauRho(x, y) > 1.5 ? 0 : plateauMask(x, y);
  }
  const iv = F.params.interval, wp = new Path2D();
  for (const pts of isoChains(PM, W, H, X0, Y0, GDX * sub, GDY * sub, 0.5)) {
    let acc = 0, n = 0;
    for (let k = 2; k < pts.length; k += 2) {
      const x0 = pts[k - 2], y0 = pts[k - 1], x1 = pts[k], y1 = pts[k + 1], sl = Math.hypot(x1 - x0, y1 - y0);
      acc += sl;
      while (acc >= 2.6) {
        acc -= 2.6; const t = 1 - acc / Math.max(1e-6, sl), px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
        grad(wxo(px), wyo(py)); n++;
        const g = Math.hypot(gX, gY) / OPU;                 // loss per print unit
        if (g < iv / 2.4) continue;
        const ux = -gX / (g * OPU), uy = gY / (g * OPU), ln = (n & 1 ? 1 : 0.5) * clamp(3 + g * 120, 4.5, 9), hw = 0.65;
        wp.moveTo(px - ux * 1.2 - uy * hw, py - uy * 1.2 + ux * hw); wp.lineTo(px - ux * 1.2 + uy * hw, py - uy * 1.2 - ux * hw);
        wp.lineTo(px + ux * ln, py + uy * ln); wp.closePath();
      }
    }
  }
  sc.fillStyle = 'rgba(86,64,46,0.62)'; sc.fill(wp);
}
function placeAreas() {
  const placed = [];
  for (const a of NAMES.areas) {
    const size = a.size * FS, font = `italic 400 ${size}px ${SERIF}`;
    let lines = a.lines;
    if (a.one && meas(font, a.ls, a.one) < a.w * OPU * 1.25) lines = [a.one];
    const ws = lines.map((t) => meas(font, a.ls, t)), w = Math.max(...ws), h = lines.length * size * 1.15;
    const x = ox(a.x), y = oy(a.y), rot = a.rot || 0;
    const cands = a.south ? [[0, 0], [0, 16], [0, 26], [0, 38], [0, 50], [-30, 0], [30, 0], [0, -26], [0, -38]] : [[0, 0], [0, -16], [0, 16], [0, -26], [0, 26], [-30, 0], [30, 0], [0, -38], [0, 38]];
    for (const [dx, dy] of cands) {
      const cx = x + dx, cy = y + dy, ca = Math.abs(Math.cos(rot)), sa = Math.abs(Math.sin(rot));
      const b = textBox(cx, cy, w * ca + h * sa, w * sa + h * ca, 3);
      if (!inMap(b, 12) || boxHit(b)) continue;
      if (a.clear && x > b[0] - a.clear && x < b[2] + a.clear && y > b[1] - a.clear && y < b[3] + a.clear) continue;
      BOXES.push(b);
      placed.push({ cx, cy, lines, font, ls: a.ls, color: a.color || INK, rot, size });
      break;
    }
  }
  return placed;
}
function placeRavineName(txt) {
  const c = sc, size = 11.5 * FS;
  c.font = `italic 400 ${size}px ${SERIF}`;
  const ls = 1.3, widths = [...txt].map((ch) => c.measureText(ch).width + ls), total = widths.reduce((a, b) => a + b, 0);
  const pm = Math.atan2(RVmy, RVmx);
  for (const side of [1, -1]) {
    const r = RVR + side * (RVw * 1.6 + 9 / OPU);
    if (2 * RVhalf * r * OPU * 0.82 < total) continue;
    const tx0 = -Math.sin(pm), dir = tx0 >= 0 ? 1 : -1, glyphs = [], boxes = [];
    let s = -total / 2, ok = true;
    for (let k = 0; k < widths.length; k++) {
      const sc0 = s + widths[k] / 2, phi = pm + dir * sc0 / (r * OPU);
      const px = ox(RVcx + r * Math.cos(phi)), py = oy(RVcy + r * Math.sin(phi));
      const ang = Math.atan2(-dir * Math.cos(phi), -dir * Math.sin(phi));
      const b = [px - 6, py - 7, px + 6, py + 7];
      if (!inMap(b, 10) || boxHit(b)) { ok = false; break; }
      glyphs.push([txt[k], px, py, ang]); boxes.push(b); s += widths[k];
    }
    if (!ok) continue;
    BOXES.push(...boxes);
    return { glyphs, font: `italic 400 ${size}px ${SERIF}` };
  }
  return null;
}
// a path name along any polyline (world coordinates), letter by letter, reading left to right
function placePathName(txt, pts, size = 11.5, offset = 0.035) {
  const c = sc, sz = size * FS; c.font = `italic 400 ${sz}px ${SERIF}`;
  const ls = 1.3, widths = [...txt].map((ch) => c.measureText(ch).width + ls), total = widths.reduce((a, b) => a + b, 0);
  const P = []; for (let k = 0; k < pts.length; k += 2) P.push([ox(pts[k]), oy(pts[k + 1])]);
  if (P[P.length - 1][0] < P[0][0]) P.reverse();
  const cum = [0]; for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
  const len = cum[cum.length - 1]; if (len < total * 1.1) return null;
  const at = (s) => { let k = 1; while (k < cum.length - 1 && cum[k] < s) k++; const t = (s - cum[k - 1]) / Math.max(1e-9, cum[k] - cum[k - 1]);
    return [P[k - 1][0] + (P[k][0] - P[k - 1][0]) * t, P[k - 1][1] + (P[k][1] - P[k - 1][1]) * t, Math.atan2(P[k][1] - P[k - 1][1], P[k][0] - P[k - 1][0])]; };
  for (const side of [-1, 1]) for (const frac of [0.5, 0.35, 0.65]) {
    let s = len * frac - total / 2; const glyphs = [], boxes = []; let ok = s > 0 && s + total < len;
    for (let k = 0; k < widths.length && ok; k++) {
      const [px, py, a] = at(s + widths[k] / 2), nx = -Math.sin(a), ny = Math.cos(a), d = side * offset * OPU;
      const gx = px + nx * d, gy = py + ny * d, b = [gx - 6, gy - 7, gx + 6, gy + 7];
      if (!inMap(b, 10) || boxHit(b)) ok = false;
      glyphs.push([txt[k], gx, gy, a]); boxes.push(b); s += widths[k];
    }
    if (!ok) continue;
    BOXES.push(...boxes);
    return { glyphs, font: `italic 400 ${sz}px ${SERIF}` };
  }
  return null;
}
function drawAreal(n, c = sc) {
  const halo = 'rgba(233,236,230,0.8)';
  c.save(); c.translate(n.cx, n.cy); c.rotate(n.rot);
  c.font = n.font; c.letterSpacing = n.ls + 'px'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const lh = n.size * 1.15, y0 = -(n.lines.length - 1) * lh / 2;
  n.lines.forEach((t, k) => {
    if (n.color === INK) { c.strokeStyle = halo; c.lineWidth = 2.6; c.strokeText(t, n.ls / 2, y0 + k * lh); }
    c.fillStyle = n.color; c.fillText(t, n.ls / 2, y0 + k * lh);
  });
  c.restore(); c.letterSpacing = '0px';
}
function drawGlyphs(g, color = INK, c = sc) {
  c.font = g.font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  for (const [ch, x, y, a] of g.glyphs) {
    c.save(); c.translate(x, y); c.rotate(a);
    c.strokeStyle = 'rgba(233,236,230,0.8)'; c.lineWidth = 2.4; c.strokeText(ch, 0, 0); c.fillStyle = color; c.fillText(ch, 0, 0);
    c.restore();
  }
}
function drawSymbol(m) {
  const c = sc, x = ox(m.p.x), y = oy(m.p.y);
  c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 0.9;
  if (m.sym === 'min') { c.beginPath(); c.arc(x, y, 1.7, 0, TAU); c.fill(); }
  else if (m.sym === 'peak') { c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + 3.5, y + 2.2); c.lineTo(x - 3.5, y + 2.2); c.closePath(); c.stroke(); c.beginPath(); c.arc(x, y, 0.8, 0, TAU); c.fill(); }
  else if (m.sym === 'pass') {
    hess(m.p.x, m.p.y); const e = eig2();
    let vx = hXY, vy = e[1] - hXX; if (Math.hypot(vx, vy) < 1e-9) { vx = e[1] - hYY; vy = hXY; }
    const a = Math.atan2(-vy, vx);
    c.save(); c.translate(x, y); c.rotate(a); c.lineWidth = 1.2;
    c.beginPath(); c.arc(-7.4, 0, 4.6, -0.7, 0.7); c.stroke();
    c.beginPath(); c.arc(7.4, 0, 4.6, Math.PI - 0.7, Math.PI + 0.7); c.stroke();
    c.restore();
  } else if (m.sym === 'x') { c.beginPath(); c.moveTo(x - 3, y - 3); c.lineTo(x + 3, y + 3); c.moveTo(x + 3, y - 3); c.lineTo(x - 3, y + 3); c.stroke(); }
}
function placePoint(m) {
  const c = sc, x = ox(m.p.x), y = oy(m.p.y);
  const f1 = `500 ${8.6 * FS}px ${SERIF}`, f2 = `400 ${6.9 * FS}px ${MONO}`;
  const w1 = m.name ? meas(f1, 1.5, m.name.toUpperCase()) : 0, w2 = meas(f2, 0.2, m.sub), w = Math.max(w1, w2), h = (m.name ? 20 : 9) * FS;
  const sr = m.sym === 'pass' ? 12 : 6;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [-1, -1], [1, 1], [-1, 1]]) {
    const cx = x + dx * (w / 2 + sr + 3), cy = y + dy * (h / 2 + sr + 2), b = textBox(cx, cy, w, h, 2);
    if (!inMap(b, 10) || boxHit(b)) continue;
    BOXES.push(b);
    const halo = 'rgba(233,236,230,0.82)', two = !!m.name;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    if (two) { c.font = f1; c.letterSpacing = '1.5px'; c.strokeStyle = halo; c.lineWidth = 2.6; c.strokeText(m.name.toUpperCase(), cx + 0.75, cy - 5 * FS); c.fillStyle = m.color || INK; c.fillText(m.name.toUpperCase(), cx + 0.75, cy - 5 * FS); }
    c.font = f2; c.letterSpacing = '0.2px'; c.strokeStyle = halo; c.lineWidth = 2.4; c.strokeText(m.sub, cx, two ? cy + 5.5 * FS : cy);
    c.fillStyle = 'rgba(36,38,43,0.85)'; c.fillText(m.sub, cx, two ? cy + 5.5 * FS : cy);
    c.letterSpacing = '0px';
    return;
  }
}
function niceStep(target) {
  const p = Math.pow(10, Math.floor(Math.log10(target))), m = target / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}
// neatline, graduations, coordinates, title, scale bar in learning rates, and the key to the inks
function furniture() {
  const c = sc, bw = 6, band = 3.5, mono = (s) => `400 ${s * FS}px ${MONO}`;
  c.strokeStyle = 'rgba(36,38,43,0.45)'; c.lineWidth = 0.6; c.beginPath();
  for (let gx = -1.5; gx <= 1.5 + 1e-9; gx += 0.5) for (let gy = -0.5; gy <= 0.5 + 1e-9; gy += 0.5) {
    const px = ox(gx), py = oy(gy); c.moveTo(px - 4, py); c.lineTo(px + 4, py); c.moveTo(px, py - 4); c.lineTo(px, py + 4);
  }
  c.stroke();
  c.strokeStyle = INK; c.fillStyle = INK;
  c.lineWidth = 0.6; c.strokeRect(mapL, mapT, mapW, mapH);
  c.lineWidth = 0.5; c.strokeRect(mapL - band, mapT - band, mapW + 2 * band, mapH + 2 * band);
  c.lineWidth = 1.4; c.strokeRect(mapL - bw, mapT - bw, mapW + 2 * bw, mapH + 2 * bw);
  for (let k = Math.round(X0 * 10); k < X1 * 10 - 1e-6; k++) if ((k & 1) === 0) {
    const a = ox(k / 10), b = ox((k + 1) / 10); c.fillRect(a, mapT - band, b - a, band); c.fillRect(a, mapB, b - a, band);
  }
  for (let k = Math.round(Y0 * 10); k < Y1 * 10 - 1e-6; k++) if ((k & 1) === 0) {
    const a = oy((k + 1) / 10), b = oy(k / 10); c.fillRect(mapL - band, a, band, b - a); c.fillRect(mapR, a, band, b - a);
  }
  c.lineWidth = 0.8; c.beginPath();
  for (let gx = -1.5; gx <= 1.5 + 1e-9; gx += 0.5) { const p = ox(gx); c.moveTo(p, mapB + bw); c.lineTo(p, mapB + bw + 3); }
  for (let gy = -1; gy <= 1 + 1e-9; gy += 0.5) { const p = oy(gy); c.moveTo(mapL - bw - 3, p); c.lineTo(mapL - bw, p); c.moveTo(mapR + bw, p); c.lineTo(mapR + bw + 3, p); }
  c.stroke();
  const num = (v) => (v < -1e-9 ? '−' : '') + Math.abs(v).toFixed(1);
  c.font = mono(7); c.fillStyle = 'rgba(36,38,43,0.8)'; c.textBaseline = 'middle'; c.textAlign = 'center';
  for (let gx = -1.5; gx <= 1.5 + 1e-9; gx += 0.5) c.fillText(num(gx), ox(gx), mapB + bw + 10);
  c.textAlign = 'right'; for (let gy = -1; gy <= 1 + 1e-9; gy += 0.5) c.fillText(num(gy), mapL - bw - 5, oy(gy));
  c.textAlign = 'left'; for (let gy = -1; gy <= 1 + 1e-9; gy += 0.5) c.fillText(num(gy), mapR + bw + 5, oy(gy));
  c.font = `italic 400 ${10 * FS}px ${SERIF}`;
  c.fillText('θ₁', mapR + bw + 5, mapB + bw + 11);
  c.fillText('θ₂', mapR + bw + 5, mapT - bw - 9);
  // top margin: contour note · title · scale bar
  const capsF = `500 ${10 * FS}px ${SERIF}`, shF = `italic 400 ${12.5 * FS}px ${SERIF}`, capLS = 3.2;
  const t1 = `PLATE ${PL.index + 1} · ${PL.title.toUpperCase()}`, t2 = `Sheet ${F.seed}`;
  c.font = capsF; c.letterSpacing = capLS + 'px'; const w1 = c.measureText(t1).width;
  c.font = shF; c.letterSpacing = '0.6px'; const w2 = c.measureText(t2).width, gap = 18;
  const tL = sheetWo / 2 - (w1 + gap + w2) / 2, ty = mapT - bw - 19;
  c.textAlign = 'left'; c.fillStyle = INK; c.textBaseline = 'middle';
  c.font = capsF; c.letterSpacing = capLS + 'px'; c.fillText(t1, tL, ty);
  c.fillStyle = 'rgba(36,38,43,0.55)'; c.letterSpacing = '0px'; c.font = `400 ${10 * FS}px ${SERIF}`; c.fillText('·', tL + w1 + gap / 2 - 2, ty);
  c.fillStyle = INK; c.font = shF; c.letterSpacing = '0.6px'; c.fillText(t2, tL + w1 + gap, ty - 0.5);
  c.letterSpacing = '0px';
  c.font = mono(7); c.fillStyle = 'rgba(36,38,43,0.62)'; c.textAlign = 'left';
  c.fillText(`contour interval ${+F.params.interval.toFixed(3)} · relief after Imhof`, mapL, ty + 0.5);
  const eta = SIM.lr, N = niceStep(110 / (eta * OPU)), len = N * eta * OPU, sbx = mapR - len - 26, sby = ty;
  c.lineWidth = 0.7; c.strokeStyle = INK; c.fillStyle = INK;
  for (let k = 0; k < 4; k += 2) c.fillRect(sbx + len * k / 4, sby - 1.8, len / 4, 3.6);
  c.strokeRect(sbx, sby - 1.8, len, 3.6);
  c.font = mono(7); c.fillStyle = 'rgba(36,38,43,0.85)';
  c.textAlign = 'right'; c.fillText('0', sbx - 4, sby + 0.5);
  c.textAlign = 'left'; c.fillText(`${N} η`, sbx + len + 4, sby + 0.5);
  // bottom margin: the key to the inks
  const nameF = `500 ${8 * FS}px ${SERIF}`, ruleF = mono(6.8);
  const items = TRIBES.map((T) => {
    c.font = nameF; c.letterSpacing = '1.3px'; const wn = c.measureText(T.name.toUpperCase()).width + 21;
    c.font = ruleF; c.letterSpacing = '0px'; const wr = c.measureText(T.rule).width;
    return { T, w: Math.max(wn, wr) };
  });
  const sep = 40, tw = items.reduce((q, it) => q + it.w, 0) + sep * (items.length - 1);
  let x = sheetWo / 2 - tw / 2;
  const ly = mapB + bw + 32;
  for (const it of items) {
    c.strokeStyle = it.T.color; c.lineWidth = 1.6; c.globalAlpha = 0.85;
    c.beginPath(); c.moveTo(x, ly); c.lineTo(x + 14, ly); c.stroke(); c.globalAlpha = 1;
    c.fillStyle = it.T.color; c.beginPath(); c.arc(x + 14, ly, 2.1, 0, TAU); c.fill();
    c.textAlign = 'left'; c.fillStyle = INK; c.font = nameF; c.letterSpacing = '1.3px'; c.fillText(it.T.name.toUpperCase(), x + 21, ly + 0.5);
    c.letterSpacing = '0px'; c.font = ruleF; c.fillStyle = 'rgba(36,38,43,0.7)'; c.fillText(it.T.rule, x, ly + 14);
    x += it.w + sep;
  }
}
let fontsOK = false, printDirty = false;
function printSheet() {
  sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, SHW, SHH);
  mc.setTransform(1, 0, 0, 1, 0, 0); mc.fillStyle = '#000'; mc.fillRect(0, 0, SHW, SHH);
  const k = PXU / OPU;
  sc.setTransform(k, 0, 0, k, 0, 0); mc.setTransform(k, 0, 0, k, 0, 0);
  nc.setTransform(1, 0, 0, 1, 0, 0); nc.clearRect(0, 0, SHW, SHH); nc.setTransform(k, 0, 0, k, 0, 0);
  SIGNS = [];
  sc.letterSpacing = '0px'; sc.lineCap = 'butt'; sc.lineJoin = 'miter';
  BOXES = [];
  if (PL.liveNames && PL.names) { NAMES = { areas: [], paths: [], marks: [] }; PL.names(NAMES); }
  sc.save(); sc.beginPath(); sc.rect(mapL, mapT, mapW, mapH); sc.clip();
  if (PL.print0) PL.print0(sc);
  escarpment();
  if (fontsOK) {
    for (const m of NAMES.marks) { const x = ox(m.p.x), y = oy(m.p.y); BOXES.push([x - 8, y - 8, x + 8, y + 8]); }
    const areas = placeAreas();
    const paths = [];
    for (const p of NAMES.paths) { const g = p.ravine ? placeRavineName(p.text) : placePathName(p.text, p.pts, p.size, p.offset); if (g) paths.push([g, p.color, p.text]); }
    contourFigures();
    for (const n of areas) { drawAreal(n, nc); SIGNS.push({ x: wxo(n.cx), y: wyo(n.cy), text: n.lines.join(' '), color: n.color }); }
    for (const [g, col, text] of paths) { drawGlyphs(g, col, nc); const m = g.glyphs[g.glyphs.length >> 1]; SIGNS.push({ x: wxo(m[1]), y: wyo(m[2]), text, color: col || INK }); }
  }
  for (const m of NAMES.marks) drawSymbol(m);
  if (fontsOK) for (const m of NAMES.marks) if (m.pin === false) placePoint(m);
  if (PL.print) PL.print(sc);
  sc.restore();
  if (fontsOK) furniture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, sheetTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, sheetCv);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, namesTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, namesCv);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.bindTexture(gl.TEXTURE_2D, maskTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RED, gl.UNSIGNED_BYTE, maskCv);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  printDirty = false;
}
function uploadData() {
  lightDirty = aoDirty = true;
  gl.bindTexture(gl.TEXTURE_2D, dataTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GW, GH, gl.RGBA, gl.FLOAT, DATA);
}

// ---------------------------------------------------------------------------------------------
// lines (draped or aerial): plates hand over polylines; the buffer is rebuilt when they change
// ---------------------------------------------------------------------------------------------
let ribN = 0, ribDirty = true;
const LINES = [];      // {pts: [x, y, zL]*, drape, color [r,g,b,a], w, dash}
function line(pts, color, w = 1, dash = 0, drape = true, alpha = 1) {
  const c = typeof color === 'string' ? hexRGB(color) : color;
  LINES.push({ pts, drape, col: [c[0] * alpha, c[1] * alpha, c[2] * alpha, alpha], w, dash });
  ribDirty = true;
}
function rebuildLines() {
  let n = 0;
  for (const Ln of LINES) {
    const p = Ln.pts, m = p.length / 3, dr = Ln.drape ? 1 : 0;
    let dist = 0;
    for (let k = 0; k < m - 1 && n < RIB_CAP; k++, n++) {
      const ax = p[3 * k], ay = p[3 * k + 1], az = p[3 * k + 2], bx = p[3 * k + 3], by = p[3 * k + 4], bz = p[3 * k + 5];
      const d1 = dist + Math.hypot(bx - ax, by - ay, (bz - az) * 0.25);
      for (let v = 0; v < 6; v++) {
        const t = v === 1 || v === 2 || v === 4 ? 1 : 0, side = v === 2 || v === 4 || v === 5 ? 1 : -1, o = (n * 6 + v) * 18;
        RIBB[o] = ax; RIBB[o + 1] = ay; RIBB[o + 2] = az; RIBB[o + 3] = dr;
        RIBB[o + 4] = bx; RIBB[o + 5] = by; RIBB[o + 6] = bz; RIBB[o + 7] = dr;
        RIBB[o + 8] = t; RIBB[o + 9] = side; RIBB[o + 10] = dist; RIBB[o + 11] = d1;
        RIBB[o + 12] = Ln.col[0]; RIBB[o + 13] = Ln.col[1]; RIBB[o + 14] = Ln.col[2]; RIBB[o + 15] = Ln.col[3];
        RIBB[o + 16] = Ln.w; RIBB[o + 17] = Ln.dash;
      }
      dist = d1;
    }
  }
  ribN = n;
  gl.bindBuffer(gl.ARRAY_BUFFER, ribBuf);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, RIBB, 0, n * 6 * 18);
  ribDirty = false;
}
// a draped polyline from world (x, y) pairs, densified so it follows the relief
function drape(xy, step = 0.006) {
  const out = [];
  for (let k = 0; k < xy.length - 2; k += 2) {
    const ax = xy[k], ay = xy[k + 1], bx = xy[k + 2], by = xy[k + 3], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let s = 0; s < n; s++) out.push(ax + (bx - ax) * s / n, ay + (by - ay) * s / n, 0.002);
  }
  out.push(xy[xy.length - 2], xy[xy.length - 1], 0.002);
  return out;
}

// ---------------------------------------------------------------------------------------------
// particles: struct of arrays, a free list, a dozen optimizers on one stochastic gradient
// ---------------------------------------------------------------------------------------------
const RSET = 0.03, SEG_W = 0.0022;
const Wx = new Float64Array(CAP), Wy = new Float64Array(CAP), Px = new Float64Array(CAP), Py = new Float64Array(CAP);
const Vx = new Float64Array(CAP), Vy = new Float64Array(CAP), Sx = new Float64Array(CAP), Sy = new Float64Array(CAP);
const B1 = new Float64Array(CAP), B2 = new Float64Array(CAP), Fx = new Float64Array(CAP), Fy = new Float64Array(CAP);
const Ex = new Float64Array(CAP), Ey = new Float64Array(CAP), Dx = new Float64Array(CAP), Dy = new Float64Array(CAP);
const Ax = new Float64Array(CAP), Ay = new Float64Array(CAP), An = new Float64Array(CAP), EtaW = new Float64Array(CAP);
const Hx = new Float32Array(CAP), Hy = new Float32Array(CAP), Age = new Int32Array(CAP), Tr = new Uint8Array(CAP), Tag = new Int32Array(CAP);
const CRr = new Float32Array(CAP), CGg = new Float32Array(CAP), CBb = new Float32Array(CAP), Wl = new Float64Array(CAP);
const Alive = new Uint8Array(CAP), Okc = new Uint8Array(CAP), FREE = new Int32Array(CAP);
let nFree = 0, hiW = 0;
const STAT = { alive: 0, converged: 0, lost: 0, nan: 0, released: 0, best: Infinity, steps: 0, time: 0, rest: [] };
let TRIBES = [], SIM = {}, PL = PLATES[0];
let NR = Frame.rng(1), RREL = Frame.rng(2), RPLAN = Frame.rng(3);
let maxAlive = PHONE ? 520 : 1500;
const NOISEFN = [0, 0];      // plates with structured noise write the sample here

function resetWalkers() {
  Alive.fill(0); nFree = 0; LEAVERS.length = 0;
  for (let k = CAP - 1; k >= 0; k--) FREE[nFree++] = k;
  hiW = 0;
  Object.assign(STAT, { alive: 0, converged: 0, lost: 0, nan: 0, released: 0, best: Infinity, steps: 0, time: 0, rest: [] });
  segN = 0; stampN = 0;
}
function retire(i, ring) {
  if (STAT.nan < NANSEEN) NANSEEN = STAT.nan;                                            // the count restarts with each plate
  const nan = STAT.nan > NANSEEN; NANSEEN = STAT.nan;
  const off = Wx[i] < X0 || Wx[i] > X1 || Wy[i] < Y0 || Wy[i] > Y1;
  if (!ring && (nan || (off && GC[i] >= 10))) popAt(i);                                 // it diverged: each step longer than the last until it left
  else if (!ring && (Wx[i] < X0 || Wx[i] > X1 || Wy[i] < Y0 || Wy[i] > Y1)) leaver(i);      // it walked off the sheet
  Alive[i] = 0; STAT.alive--; FREE[nFree++] = i;
  if (PL.retire) PL.retire(i, ring);
  if (ring) {
    STAT.converged++;
    if (STAT.rest.length < 4000) STAT.rest.push([Tr[i], L(Ex[i], Ey[i]), Ex[i], Ey[i]]);
    stamp(Ex[i], Ey[i], 0.0062, 0, CRr[i], CGg[i], CBb[i], 0.72, 0.0019);
  }
}
function spawn(x, y, t, opts) {
  if (nFree === 0 || STAT.alive >= maxAlive) return -1;
  const i = FREE[--nFree], T = TRIBES[t];
  Wx[i] = Px[i] = Fx[i] = Ex[i] = Dx[i] = x; Wy[i] = Py[i] = Fy[i] = Ey[i] = Dy[i] = y;
  Vx[i] = Vy[i] = Sx[i] = Sy[i] = Ax[i] = Ay[i] = An[i] = 0; B1[i] = B2[i] = 1; Hx[i] = Hy[i] = 0;
  GP[i] = i * 2.39996; GS[i] = GT[i] = GN[i] = 0; GF[i] = 1; EM[i] = 0; FT[i] = 0; SER[i] = ++SERIAL;
  BNC[i] = SK[i] = PT[i] = BULB[i] = 0; SAD0[i] = ESC[i] = 0; EPX[i] = EPY[i] = 0;
  CWF[i] = GC[i] = 0; LREF[i] = Infinity; PLT0[i] = 0; WK[i] = 0; LSL[i] = 0;
  Age[i] = 0; Tr[i] = t; Alive[i] = 1; Okc[i] = 0; Tag[i] = 0; EtaW[i] = 1; Wl[i] = L(x, y);
  CRr[i] = T.rgb[0]; CGg[i] = T.rgb[1]; CBb[i] = T.rgb[2];
  if (opts) { if (opts.eta) EtaW[i] = opts.eta; if (opts.rgb) { CRr[i] = opts.rgb[0]; CGg[i] = opts.rgb[1]; CBb[i] = opts.rgb[2]; } if (opts.tag) Tag[i] = opts.tag; if (opts.v) { Vx[i] = opts.v[0]; Vy[i] = opts.v[1]; } }
  STAT.alive++;
  if (i >= hiW) hiW = i + 1;
  return i;
}
function releaseCaravan(x, y, n, tribes, spread = 0.011) {
  if (n == null) { n = F.params.caravan | 0; if (PHONE) n = Math.max(4, Math.round(n * 0.6)); }
  stamp(x, y, 0.0115, 1, 0.12, 0.125, 0.14, 0.85, 0.0023);
  let any = false;
  for (let t = 0; t < TRIBES.length; t++) {
    if (tribes && tribes.indexOf(t) < 0) continue;
    if (TRIBES[t].off) continue;
    for (let k = 0; k < n; k++) if (spawn(x + RREL.normal() * spread, y + RREL.normal() * spread, t) >= 0) any = true;
  }
  if (any) STAT.released++;
}
function stamp(x, y, r, kind, cr, cg, cb, a, w) {
  if (stampN >= STAMP_CAP) return;
  const o = stampN++ * 9;
  STAMPB[o] = x; STAMPB[o + 1] = y; STAMPB[o + 2] = r; STAMPB[o + 3] = kind;
  STAMPB[o + 4] = cr * a; STAMPB[o + 5] = cg * a; STAMPB[o + 6] = cb * a; STAMPB[o + 7] = a; STAMPB[o + 8] = w;
}
function inkSeg(x0, y0, x1, y1, cr, cg, cb, a, w) {
  if (segN >= SEG_CAP) return;
  const o = segN++ * 9;
  SEGB[o] = x0; SEGB[o + 1] = y0; SEGB[o + 2] = x1; SEGB[o + 3] = y1;
  SEGB[o + 4] = cr * a; SEGB[o + 5] = cg * a; SEGB[o + 6] = cb * a; SEGB[o + 7] = a; SEGB[o + 8] = w;
}
// learning-rate schedules over a particle's own age (steps)
function sched(S, age) {
  if (!S) return 1;
  const T = S.T, w = S.warm || 0;
  if (w > 0 && age < w) return (age + 1) / w;
  if (S.kind === 'cos') return age >= T ? S.floor : S.floor + (1 - S.floor) * 0.5 * (1 + Math.cos(Math.PI * clamp((age - w) / (T - w), 0, 1)));
  if (S.kind === 'wsd') { const d0 = T * (1 - S.decay); return age < d0 ? 1 : age >= T ? S.floor : 1 - (1 - S.floor) * (age - d0) / (T - d0); }
  return 1;
}
function stepAll() {
  const lr = SIM.lr, sig = SIM.noise, beta = SIM.beta, b1 = 0.9, b2 = SIM.beta2, eps = 1e-8, rho = SIM.rho || 0.05, alpha = SIM.alpha || 0.1;
  const mx = 0.04 * MAPW, xa = X0 - mx, xb = X1 + mx, ya = Y0 - mx, yb = Y1 + mx;
  const seg2 = 0.003 * 0.003;
  const hook = PL.step || null;
  for (let i = 0; i < hiW; i++) {
    if (!Alive[i]) continue;
    const t = Tr[i], T = TRIBES[t], x = Wx[i], y = Wy[i];
    const eta = (T.absEta ? EtaW[i] : lr * T.etaMul * EtaW[i]) * (T.sched ? sched(T.sched, Age[i]) : 1);
    const s = sig * T.sigMul;
    let n1 = 0, n2 = 0;
    if (s > 0 || T.noise === N_FN) {
      if (T.noise === N_ISO) { n1 = s * NR.normal(); n2 = s * NR.normal(); }
      else if (T.noise === N_HESS) {                    // covariance ∝ |H|, same total variance 2σ² as isotropic noise
        hess(x, y);
        const tr = hXX + hYY, det = hXX * hYY - hXY * hXY, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
        const l1 = Math.abs(tr / 2 + disc), l2 = Math.abs(tr / 2 - disc), sum = l1 + l2 + 1e-12;
        let vx = hXY, vy = tr / 2 + disc - hXX; let vl = Math.hypot(vx, vy); if (vl < 1e-12) { vx = 1; vy = 0; vl = 1; } vx /= vl; vy /= vl;
        const a1 = s * Math.sqrt(2 * l1 / sum) * NR.normal(), a2 = s * Math.sqrt(2 * l2 / sum) * NR.normal();
        n1 = a1 * vx - a2 * vy; n2 = a1 * vy + a2 * vx;
      } else if (T.noise === N_FN) { T.noiseFn(i, x, y, s, NR, NOISEFN); n1 = NOISEFN[0]; n2 = NOISEFN[1]; }
      else if (T.noise === N_LEVY) { const q = s * Math.sqrt(posStable((T.tail != null ? T.tail : SIM.tail || 2) / 2, NR)); n1 = q * NR.normal(); n2 = q * NR.normal(); }
    }
    let dx = 0, dy = 0;
    const k = T.kind;
    if (k === K_NAG) { const bb = T.beta != null ? T.beta : beta; grad(x + bb * Vx[i], y + bb * Vy[i]); }
    else if (k === K_SAM) {
      grad(x, y); const a1 = gX + n1, a2 = gY + n2, an = Math.hypot(a1, a2) || 1;
      EPX[i] = a1 / an; EPY[i] = a2 / an;
      grad(x + rho * a1 / an, y + rho * a2 / an);
    } else grad(x, y);
    if (k === K_NAG || k === K_SAM) Wl[i] = L(x, y); else Wl[i] = gL;
    if (Wl[i] < STAT.best) STAT.best = Wl[i];
    let g1 = gX + n1, g2 = gY + n2;
    if (T.clip > 0) { const gn = Math.hypot(g1, g2); if (gn > T.clip) { g1 *= T.clip / gn; g2 *= T.clip / gn; } }
    const wdk = T.wd ? SIM.wd * (T.wdMul || 1) : 0;          // weight decay: 'l2' adds λθ to the gradient, 'dec' (AdamW) shrinks θ after the step
    if (T.wd === 'l2') { g1 += wdk * x; g2 += wdk * y; }
    switch (k) {
      case K_SGD: case K_SAM: dx = -eta * g1; dy = -eta * g2; break;
      case K_HB: case K_NAG: { const bb = T.beta != null ? T.beta : beta; Vx[i] = bb * Vx[i] - eta * g1; Vy[i] = bb * Vy[i] - eta * g2; dx = Vx[i]; dy = Vy[i]; break; }
      case K_ADAM: {
        const bb2 = T.beta2 != null ? T.beta2 : b2, bb1 = T.beta1 != null ? T.beta1 : b1;
        Vx[i] = bb1 * Vx[i] + (1 - bb1) * g1; Vy[i] = bb1 * Vy[i] + (1 - bb1) * g2;
        Sx[i] = bb2 * Sx[i] + (1 - bb2) * g1 * g1; Sy[i] = bb2 * Sy[i] + (1 - bb2) * g2 * g2;
        B1[i] *= bb1; B2[i] *= bb2;
        const c1 = 1 / (1 - B1[i]), c2 = 1 / (1 - B2[i]);
        dx = -eta * Vx[i] * c1 / (Math.sqrt(Sx[i] * c2) + eps); dy = -eta * Vy[i] * c1 / (Math.sqrt(Sy[i] * c2) + eps);
        break;
      }
      case K_RMS: {
        const bb2 = T.beta2 != null ? T.beta2 : 0.99;
        Sx[i] = bb2 * Sx[i] + (1 - bb2) * g1 * g1; Sy[i] = bb2 * Sy[i] + (1 - bb2) * g2 * g2; B2[i] *= bb2;
        const c2 = 1 / (1 - B2[i]);
        dx = -eta * g1 / (Math.sqrt(Sx[i] * c2) + eps); dy = -eta * g2 / (Math.sqrt(Sy[i] * c2) + eps);
        break;
      }
      case K_SIGN: dx = -eta * Math.sign(g1); dy = -eta * Math.sign(g2); break;
      case K_FN: { const d = T.fn(i, x, y, eta, g1, g2); dx = d[0]; dy = d[1]; break; }
      case K_LION: {
        const l1 = 0.9, l2 = 0.99;
        dx = -eta * Math.sign(l1 * Vx[i] + (1 - l1) * g1); dy = -eta * Math.sign(l1 * Vy[i] + (1 - l1) * g2);
        Vx[i] = l2 * Vx[i] + (1 - l2) * g1; Vy[i] = l2 * Vy[i] + (1 - l2) * g2;
        break;
      }
      case K_NEWTON: case K_SFN: {
        hess(x, y);
        let a = hXX, b = hXY, d = hYY;
        if (k === K_SFN) {          // |H| = V |Λ| Vᵀ, with a floor so flat directions do not explode
          const tr = a + d, det = a * d - b * b, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
          const e1 = tr / 2 + disc, e2 = tr / 2 - disc;
          let vx = b, vy = e1 - a; let vl = Math.hypot(vx, vy); if (vl < 1e-12) { vx = 1; vy = 0; vl = 1; } vx /= vl; vy /= vl;
          const m1 = Math.max(Math.abs(e1), 0.5), m2 = Math.max(Math.abs(e2), 0.5);
          a = m1 * vx * vx + m2 * vy * vy; b = (m1 - m2) * vx * vy; d = m1 * vy * vy + m2 * vx * vx;
        }
        const det = a * d - b * b;
        if (Math.abs(det) < 1e-9) { dx = -0.002 * g1; dy = -0.002 * g2; break; }
        dx = -alpha * (d * g1 - b * g2) / det; dy = -alpha * (a * g2 - b * g1) / det;
        const sl = Math.hypot(dx, dy), cap = 0.02;
        if (sl > cap) { dx *= cap / sl; dy *= cap / sl; }
        break;
      }
      case K_SF: {      // schedule-free SGD (Defazio et al. 2024): the particle stands at y, z in V, the average x in A
        if (Age[i] === 0) { Vx[i] = x; Vy[i] = y; Ax[i] = x; Ay[i] = y; An[i] = 1; }
        const bsf = T.sfBeta != null ? T.sfBeta : 0.9;
        Vx[i] -= eta * g1; Vy[i] -= eta * g2;
        Sx[i] += eta * eta;                       // weights c_t = γ_t² / Σγ², the uniform average once warmup is over
        const c = T.sfC ? Math.min(1, (1 - bsf) * T.sfC / (Age[i] + 1)) : eta * eta / Sx[i];
        Ax[i] += c * (Vx[i] - Ax[i]); Ay[i] += c * (Vy[i] - Ay[i]);
        dx = (1 - bsf) * Vx[i] + bsf * Ax[i] - x; dy = (1 - bsf) * Vy[i] + bsf * Ay[i] - y;
        Wl[i] = L(Ax[i], Ay[i]);
        break;
      }
    }
    if (T.wd === 'dec') { dx -= eta * wdk * x; dy -= eta * wdk * y; }
    const nx = x + dx, ny = y + dy;
    Px[i] = x; Py[i] = y; Wx[i] = nx; Wy[i] = ny; Age[i]++;
    if (!(Number.isFinite(nx) && Number.isFinite(ny))) { STAT.nan++; Wx[i] = x; Wy[i] = y; retire(i, false); continue; }
    if (nx < xa || nx > xb || ny < ya || ny > yb) { STAT.lost++; if (PL.lost) PL.lost(i); retire(i, false); continue; }
    gaitStep(i, dx, dy, n1, n2);
    const sl = Math.hypot(dx, dy); if (sl > 1e-12) { Hx[i] = dx / sl; Hy[i] = dy / sl; }
    Fx[i] += (nx - Fx[i]) / 12; Fy[i] += (ny - Fy[i]) / 12;
    Ex[i] += (nx - Ex[i]) / 60; Ey[i] += (ny - Ey[i]) / 60;
    if (T.avg && Age[i] > T.avg) { An[i]++; Ax[i] += (nx - Ax[i]) / An[i]; Ay[i] += (ny - Ay[i]) / An[i]; }
    const ddx = nx - Dx[i], ddy = ny - Dy[i];
    if (ddx * ddx + ddy * ddy > seg2) {
      if (PL.jump && sl > (PL.jumpMin || 0.05)) addArc(i, Dx[i], Dy[i], nx, ny);
      else inkSeg(Dx[i], Dy[i], nx, ny, CRr[i], CGg[i], CBb[i], T.inkA, SEG_W);
      Dx[i] = nx; Dy[i] = ny;
    }
    if (hook && hook(i) === false) continue;
    if (T.rest !== 'never' && Age[i] > 60 && (Age[i] + i) % 15 === 0 && atRest(i, T.rest === 'crit') && (!PL.restOK || PL.restOK(i))) { retire(i, true); continue; }
    if (Age[i] > (T.maxAge || PL.maxAge || 45 * 55)) retire(i, false);
  }
  STAT.steps++;
}
// at rest: averaged position within a short Newton step of a critical point (a minimum unless crit)
function atRest(i, crit) {
  const ex = Ex[i], ey = Ey[i];
  grad(ex, ey); const ggx = gX, ggy = gY; hess(ex, ey);
  const det = hXX * hYY - hXY * hXY;
  let ok = false;
  if (crit ? Math.abs(det) > 1e-6 : det > 0 && hXX + hYY > 0) {
    const nsx = (hYY * ggx - hXY * ggy) / det, nsy = (hXX * ggy - hXY * ggx) / det;
    ok = Math.hypot(nsx, nsy) < RSET && Math.hypot(Wx[i] - ex, Wy[i] - ey) < RSET && Math.hypot(Fx[i] - ex, Fy[i] - ey) < RSET;
  }
  Okc[i] = ok ? Okc[i] + 1 : 0;
  return Okc[i] >= 4;
}

// releases. A plan is a list of points the auto-release walks through; the survey plan picks a pass
// ridge, the ravine head, the sharp well's rim, the plateau, then the emptiest high ground.
let RELEASES = [], nextRelease = 0, relCount = 0;
function planSurvey() {
  const R = RPLAN, specials = [];
  const away = (x, y, d) => { const vx = x - BX, vy = y - BY, l = Math.hypot(vx, vy) || 1; return [x + d * vx / l, y + d * vy / l]; };
  if (FEAT.pass) {
    let s = null;
    for (const c of CRIT) if (c.type === 'saddle' && Math.hypot(c.x - FEAT.pass.x, c.y - FEAT.pass.y) < 0.2 && (!s || Math.hypot(c.x - FEAT.pass.x, c.y - FEAT.pass.y) < Math.hypot(s.x - FEAT.pass.x, s.y - FEAT.pass.y))) s = c;
    if (s) {
      hess(s.x, s.y); const e = eig2(); let vx = hXY, vy = e[1] - hXX; const l = Math.hypot(vx, vy) || 1; vx /= l; vy /= l;
      const a = [s.x + vx * 0.15, s.y + vy * 0.15], b = [s.x - vx * 0.15, s.y - vy * 0.15];
      specials.push(L(a[0], a[1]) > L(b[0], b[1]) ? a : b);
    }
  }
  if (FEAT.ravine && RVon) { const h = arcPt(-0.84), r = RVR + 0.05; specials.push([RVcx + r * Math.cos(h[2]), RVcy + r * Math.sin(h[2])]); }
  if (FEAT.sharp) specials.push(away(FEAT.sharp[0], FEAT.sharp[1], 0.24));
  specials.push(null);
  if (FEAT.flat) specials.push(away(FEAT.flat[0], FEAT.flat[1], 0.55));
  for (let k = 0; k < 6; k++) specials.push(null);
  if (FEAT.plateau && PLon) { const tl = Math.hypot(PLtx, PLty) || 1; specials.push([PLcx + 0.55 * PLb * PLtx / tl, PLcy + 0.55 * PLb * PLty / tl]); }
  const sample = []; for (let k = 0; k < HG.length; k += 37) sample.push(HG[k]); sample.sort((a, b) => a - b);
  const hiG = sample[(sample.length * 0.45) | 0];
  const drainsToEdge = (x, y) => {
    for (let k = 0; k < 110; k++) { grad(x, y); const g = Math.hypot(gX, gY); if (g < 1e-3) break; x -= 0.022 * gX / g; y -= 0.022 * gY / g; }
    return x < X0 + 0.16 || x > X1 - 0.16 || y < Y0 + 0.16 || y > Y1 - 0.16;
  };
  const mitchell = () => {
    let best = null, bd = -1;
    for (let t = 0; t < 12; t++) {
      const x = R.range(X0 + 0.12, X1 - 0.12), y = R.range(Y0 + 0.12, Y1 - 0.12), v = L(x, y);
      if (v < hiG || inLake(x, y) || drainsToEdge(x, y)) continue;
      let md = 9; for (const p of RELEASES) if (p) md = Math.min(md, Math.hypot(p[0] - x, p[1] - y));
      if (md > bd) { bd = md; best = [x, y]; }
    }
    return best || [R.range(X0 + 0.2, X1 - 0.2), R.range(Y0 + 0.2, Y1 - 0.2)];
  };
  for (const s of specials) RELEASES.push(s && s[0] > X0 + 0.05 && s[0] < X1 - 0.05 && s[1] > Y0 + 0.05 && s[1] < Y1 - 0.05 ? s : mitchell());
  RELEASES.more = mitchell;
}
function autoRelease() {
  if (STAT.steps < nextRelease || performance.now() < printAt + 900) return;
  if (PL.release) { PL.release(); return; }
  if (!F.params.auto || STAT.alive > maxAlive - TRIBES.length * (F.params.caravan | 0)) { nextRelease = STAT.steps + 45; return; }
  if (relCount >= RELEASES.length && !RELEASES.more) { nextRelease = STAT.steps + 45; return; }
  const p = relCount < RELEASES.length ? RELEASES[relCount] : RELEASES.more();
  if (relCount >= RELEASES.length) RELEASES.push(p);
  relCount++;
  releaseCaravan(p[0], p[1]);
  const gap = relCount < 12 ? 2.6 : 6.2 + RPLAN() * 1.8;
  nextRelease = STAT.steps + Math.round(gap * 45);
}

// ---------------------------------------------------------------------------------------------
// camera: orbit about a target on the model; perspective with a lens shift so the model sits in
// the part of the screen the plate card leaves free
// ---------------------------------------------------------------------------------------------
const CAM = { yaw: 0, pitch: 0.8, dist: 5, tx: 0, ty: 0, tz: 0.15 }, GOAL = Object.assign({}, CAM);
const FOV0 = 0.56;
let FOV = FOV0;
const VP = new Float32Array(16), EYE = new Float32Array(3), CR = [1, 0, 0], CU = [0, 0, 1], CFW = [0, 1, 0];
const ZS0 = 0.19;
let ZS = ZS0, ZT = ZS0, viewCx = 0, viewCy = 0, aspect = 1.6, cardW = 0, cardH = 0, labelB = 0;   // ZS: height scale drawn now, ZT: the model's full height
let camK = 6;
function camBasis(c, eye, r, u, f) {
  const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch), cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
  eye[0] = c.tx - c.dist * sy * cp; eye[1] = c.ty - c.dist * cy * cp; eye[2] = c.tz + c.dist * sp;
  f[0] = sy * cp; f[1] = cy * cp; f[2] = -sp;
  r[0] = cy; r[1] = -sy; r[2] = 0;
  u[0] = r[1] * f[2] - r[2] * f[1]; u[1] = r[2] * f[0] - r[0] * f[2]; u[2] = r[0] * f[1] - r[1] * f[0];
}
function viewProj(c, out, eye, r, u, f, fov = FOV) {
  camBasis(c, eye, r, u, f);
  const n = Math.max(0.004, c.dist * 0.035), fa = c.dist * 6 + 30;
  const ty = 1 / Math.tan(fov / 2), tx = ty / aspect, A = (fa + n) / (n - fa), B = 2 * fa * n / (n - fa);
  const sx = -viewCx, sy = -viewCy;
  const ex = -(r[0] * eye[0] + r[1] * eye[1] + r[2] * eye[2]), ey = -(u[0] * eye[0] + u[1] * eye[1] + u[2] * eye[2]), ez = f[0] * eye[0] + f[1] * eye[1] + f[2] * eye[2];
  // P · V with V rows r, u, -f (column-major)
  const V = [r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, ex, ey, ez, 1];
  for (let col = 0; col < 4; col++) {
    const vx = V[col * 4], vy = V[col * 4 + 1], vz = V[col * 4 + 2], vw = V[col * 4 + 3];
    out[col * 4] = tx * vx + sx * vz;
    out[col * 4 + 1] = ty * vy + sy * vz;
    out[col * 4 + 2] = A * vz + B * vw;
    out[col * 4 + 3] = -vz;
  }
}
const PRJ = [0, 0, 0];
function project(M, x, y, z, o = PRJ) {
  const cx = M[0] * x + M[4] * y + M[8] * z + M[12], cy = M[1] * x + M[5] * y + M[9] * z + M[13], cw = M[3] * x + M[7] * y + M[11] * z + M[15];
  o[0] = (cx / cw * 0.5 + 0.5) * F.cssWidth; o[1] = (0.5 - cy / cw * 0.5) * F.cssHeight; o[2] = cw;
  return o;
}
function region() {
  const W = F.cssWidth, H = F.cssHeight, phone = W < 700;
  const right = cardOpen() && !phone ? W - cardW - 34 : W - 14;
  const clean = document.body.classList.contains('hl-clean');
  let bottom = phone ? H - 60 : H - (clean ? 54 : 96);              // above the toolbar
  if (phone && !clean) bottom = H - (cardShut ? 46 : cardH) - 10;   // a phone's card is a sheet along the bottom: frame the map above it
  return [14, phone ? (clean ? 64 : Math.max(64, labelB + 8)) : 50, right, bottom];
}
function updateViewCenter() {
  const [l, t, r, b] = region();
  aspect = F.cssWidth / F.cssHeight;
  viewCx = (l + r) / F.cssWidth - 1; viewCy = 1 - (t + b) / F.cssHeight;
}
const TMPM = new Float32Array(16), TE = [0, 0, 0], TR = [0, 0, 0], TU = [0, 0, 0], TF = [0, 0, 0];
function fitDist(c) {
  const [l, t, r, b] = region(), pad = 6;
  const zt = HMAX * ZT, pts = [[SX0, SY0, 0], [SX1, SY0, 0], [SX1, SY1, 0], [SX0, SY1, 0], [X0, Y0, zt], [X1, Y0, zt], [X1, Y1, zt], [X0, Y1, zt]];
  let lo = 0.5, hi = 40;
  const tmp = Object.assign({}, c);
  for (let it = 0; it < 26; it++) {
    tmp.dist = (lo + hi) / 2;
    viewProj(tmp, TMPM, TE, TR, TU, TF, FOV0);
    let ok = true;
    for (const p of pts) { const s = project(TMPM, p[0], p[1], p[2], [0, 0, 0]); if (s[2] <= 0 || s[0] < l + pad || s[0] > r - pad || s[1] < t + pad || s[1] > b - pad) { ok = false; break; } }
    if (ok) hi = tmp.dist; else lo = tmp.dist;
  }
  return hi;
}
function plateView() {
  const [l, t, r, b] = region(), v = PL.view || {}, portrait = (r - l) / (b - t) < 0.8;
  const c = { yaw: ((v.yaw || 0) + (portrait ? 90 : 0)) * DEG, pitch: Math.max(v.pitch || 45, portrait ? 58 : 0) * DEG, tx: 0, ty: (SY0 + SY1) / 2, tz: (HMIN + HMAX) * 0.5 * ZT, dist: 5 };
  c.dist = fitDist(c) * (v.zoom || 1);
  if (v.at) { const at = typeof v.at === 'function' ? v.at() : v.at; if (at) { c.tx = at[0]; c.ty = at[1]; c.tz = hgrid(at[0], at[1]) * ZT; } }
  return c;
}
let baseYaw = 0, planOn = false, planSave = null;
function resetView(animate) {
  leaveWalk();
  const c = plateView();
  Object.assign(GOAL, c); baseYaw = c.yaw;
  if (!animate) Object.assign(CAM, c);
  camK = 4;
}
// the camera glides to a new plate's view in step with the rise, holding still while the sheet is still flat.
// After a page turn it starts from where the last plate's camera was, so the view never jumps
const INTRO = { on: false, t0: 0, from: null };
function introView(keep) {
  planOn = false;
  const c = plateView();
  Object.assign(GOAL, c); baseYaw = c.yaw;
  if (REDUCED) { Object.assign(CAM, c); INTRO.on = false; return; }
  if (!keep) Object.assign(CAM, c, { dist: c.dist * 1.28, pitch: Math.min(1.45, c.pitch + 0.2), yaw: c.yaw - 0.32 });
  Object.assign(INTRO, { on: true, t0: performance.now(), from: Object.assign({}, CAM) });
  camK = 1.7;
}
function introGlide(now) {         // false once the glide is over or the reader has taken the camera
  if (gesture || dragging || FOL.on || planOn || lastInteract > INTRO.t0) return (INTRO.on = false);
  const u = easeIO(clamp((now - riseT0 - RISE_DELAY) / RISE_MS, 0, 1)), A = INTRO.from;
  CAM.yaw = A.yaw + wrapAngle(GOAL.yaw - A.yaw) * u; CAM.pitch = A.pitch + (GOAL.pitch - A.pitch) * u; CAM.dist = A.dist + (GOAL.dist - A.dist) * u;
  CAM.tx = A.tx + (GOAL.tx - A.tx) * u; CAM.ty = A.ty + (GOAL.ty - A.ty) * u; CAM.tz = A.tz + (GOAL.tz - A.tz) * u;
  if (u >= 1) INTRO.on = false;
  return true;
}
function planView() {
  leaveWalk();
  if (!planOn) { planSave = Object.assign({}, GOAL); const c = { yaw: 0, pitch: Math.PI / 2 - 0.0001, tx: 0, ty: (SY0 + SY1) / 2, tz: 0, dist: 5 }; c.dist = fitDist(c); Object.assign(GOAL, c); baseYaw = 0; planOn = true; }
  else { Object.assign(GOAL, planSave || plateView()); baseYaw = GOAL.yaw; planOn = false; }
  camK = 4;
}
function wrapAngle(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }
let lastInteract = 0;
function camUpdate(dt, now) {
  if (F.params.spin && !planOn && !FOL.on && now - lastInteract > 9000 && !dragging) GOAL.yaw = baseYaw + 0.2 * Math.sin((now - lastInteract - 9000) / 1000 * 0.045);
  if (!(INTRO.on && introGlide(now))) {
    const k = REDUCED && !gesture && !FOL.on ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * camK);
    CAM.yaw += wrapAngle(GOAL.yaw - CAM.yaw) * k; CAM.pitch += (GOAL.pitch - CAM.pitch) * k; CAM.dist += (GOAL.dist - CAM.dist) * k;
    CAM.tx += (GOAL.tx - CAM.tx) * k; CAM.ty += (GOAL.ty - CAM.ty) * k; CAM.tz += (GOAL.tz - CAM.tz) * k;
    camK += (7 - camK) * Math.min(1, dt * 0.6);
  }
  viewProj(CAM, VP, EYE, CR, CU, CFW);
}
// walking with a stick man: a low chase camera behind one particle, a wider lens and haze on the distance.
// It follows the particle's smoothed position and the direction of its recent travel, so that SGD's
// zigzags shake the particle and not the camera; drag looks round, scroll comes closer, V leaves
const FOL = { on: false, i: -1, age: 0, tribe: 0, x: 0, y: 0, yaw: 0, yawOff: 0, pitch: 0.3, dist: 0.32, restAt: 0 };
let FOGV = 0;
function pilgrimOf(t) {        // the youngest particle of an optimizer that is already on its way
  let best = -1, age = 1e9;
  for (let i = 0; i < hiW; i++) if (Alive[i] && Tr[i] === t && Age[i] > 6 && Age[i] < age) { best = i; age = Age[i]; }
  return best;
}
function followPilgrim(i) {
  if (planOn) planView();
  if (!FOL.on) Object.assign(FOL, { yawOff: 0, pitch: 0.3, dist: 0.2, yaw: CAM.yaw });
  Object.assign(FOL, { on: true, i, age: Age[i], tribe: Tr[i], x: Fx[i], y: Fy[i], restAt: 0 });
  trailReset();
  const hx = Fx[i] - Ex[i], hy = Fy[i] - Ey[i];
  if (Math.hypot(hx, hy) > 1e-5) FOL.yaw = Math.atan2(hx, hy);
  camK = 2.2; walkBtn.setAttribute('aria-pressed', 'true');
}
function walkWith() {
  const n = TRIBES.length, t0 = FOL.on ? FOL.tribe : 0;
  for (let k = FOL.on ? 1 : 0; k <= n; k++) {
    const t = (t0 + k) % n, i = pilgrimOf(t);
    if (i < 0) continue;
    followPilgrim(i);
    return;
  }
  F.toast(FOL.on ? 'No particles still moving' : 'No particles on the move: click the relief to release a cohort', 2400);
}
function leaveWalk() {
  if (!FOL.on) return;
  FOL.on = false; FOL.i = -1; walkBtn.setAttribute('aria-pressed', 'false'); F.readout('Walking with', null); trailReset();
}
function trailReset() { trLen = 0; trHead = 0; trDirty = true; }
function trailPush() {
  const i = FOL.i; if (i < 0 || !Alive[i]) return;
  TRX[trHead] = Wx[i]; TRY[trHead] = Wy[i]; trHead = (trHead + 1) % TRAILN; trLen = Math.min(TRAILN, trLen + 1); trDirty = true;
}
function trSeg(n, x0, y0, x1, y1, r, g, b, al, w) {
  for (let v = 0; v < 6; v++) {
    const t = v === 1 || v === 2 || v === 4 ? 1 : 0, side = v === 2 || v === 4 || v === 5 ? 1 : -1, o = (n * 6 + v) * 18;
    TRB[o] = x0; TRB[o + 1] = y0; TRB[o + 2] = 0.0012; TRB[o + 3] = 1;
    TRB[o + 4] = x1; TRB[o + 5] = y1; TRB[o + 6] = 0.0012; TRB[o + 7] = 1;
    TRB[o + 8] = t; TRB[o + 9] = side; TRB[o + 10] = 0; TRB[o + 11] = 0;
    TRB[o + 12] = r * al; TRB[o + 13] = g * al; TRB[o + 14] = b * al; TRB[o + 15] = al;
    TRB[o + 16] = w; TRB[o + 17] = 0;
  }
}
function rebuildTrail() {        // oldest first, each step densified so that it follows the relief, fading towards the tail
  let n = 0;
  const T = TRIBES[FOL.tribe], c = T ? T.rgb : [0.2, 0.2, 0.2], w = -0.0034;
  for (let q = 0; q < trLen - 1 && n < TRSEG_CAP - 240; q++) {
    const a = (trHead - trLen + q + TRAILN) % TRAILN, b = (a + 1) % TRAILN;
    const ax = TRX[a], ay = TRY[a], bx = TRX[b], by = TRY[b], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.006));
    const al = 0.4 * Math.pow((q + 1) / trLen, 1.6);
    for (let s = 0; s < m && n < TRSEG_CAP; s++, n++) {
      const x0 = ax + (bx - ax) * s / m, y0 = ay + (by - ay) * s / m, x1 = ax + (bx - ax) * (s + 1) / m, y1 = ay + (by - ay) * (s + 1) / m;
      for (let v = 0; v < 6; v++) {
        const t = v === 1 || v === 2 || v === 4 ? 1 : 0, side = v === 2 || v === 4 || v === 5 ? 1 : -1, o = (n * 6 + v) * 18;
        TRB[o] = x0; TRB[o + 1] = y0; TRB[o + 2] = 0.0012; TRB[o + 3] = 1;
        TRB[o + 4] = x1; TRB[o + 5] = y1; TRB[o + 6] = 0.0012; TRB[o + 7] = 1;
        TRB[o + 8] = t; TRB[o + 9] = side; TRB[o + 10] = 0; TRB[o + 11] = 0;
        TRB[o + 12] = c[0] * al; TRB[o + 13] = c[1] * al; TRB[o + 14] = c[2] * al; TRB[o + 15] = al;
        TRB[o + 16] = w; TRB[o + 17] = 0;
      }
    }
  }
  // footprints: one where each step landed, left and right in turn, so the spacing is its real step length
  let lx = 1e9, ly = 1e9, side = 1;
  const fr = 0.2 + 0.25 * c[0], fg = 0.19 + 0.25 * c[1], fb = 0.18 + 0.25 * c[2];
  for (let q = 1; q < trLen && n < TRSEG_CAP; q++) {
    const a = (trHead - trLen + q - 1 + TRAILN) % TRAILN, b = (a + 1) % TRAILN;
    const bx = TRX[b], by = TRY[b], dx = bx - TRX[a], dy = by - TRY[a], dl = Math.hypot(dx, dy);
    if (dl < 1e-9 || Math.hypot(bx - lx, by - ly) < 0.22 * PIL_H) continue;
    lx = bx; ly = by; side = -side;
    const ux = dx / dl, uy = dy / dl, cx = bx - uy * side * 0.065 * PIL_H, cy = by + ux * side * 0.065 * PIL_H, H = PIL_H, al = 0.85 * Math.pow((q + 1) / trLen, 1.1);
    trSeg(n++, cx + ux * 0.01 * H, cy + uy * 0.01 * H, cx + ux * 0.15 * H, cy + uy * 0.15 * H, fr, fg, fb, al, -0.075 * H);      // the sole
    if (n < TRSEG_CAP) trSeg(n++, cx - ux * 0.12 * H, cy - uy * 0.12 * H, cx - ux * 0.05 * H, cy - uy * 0.05 * H, fr, fg, fb, al, -0.065 * H);   // the heel
  }
  trN = n; trDirty = false;
  if (n) { gl.bindBuffer(gl.ARRAY_BUFFER, trBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, TRB, 0, n * 6 * 18); }
}
function followUpdate(dt, now) {
  FOV += ((FOL.on ? 0.98 : FOV0) - FOV) * (REDUCED ? 1 : Math.min(1, dt * 2.5));
  FOGV += ((FOL.on ? 1 : 0) - FOGV) * Math.min(1, dt * 2);
  if (Math.abs(FOV - FOV0) < 1e-4) FOV = FOV0;
  if (FOGV < 1e-3) FOGV = 0;
  if (!FOL.on) return;
  lastInteract = now;
  const i = FOL.i;
  if (Alive[i] && Age[i] >= FOL.age) {
    FOL.age = Age[i]; FOL.restAt = 0;
    const k = 1 - Math.exp(-dt * (3 + 30 * Math.hypot(Fx[i] - FOL.x, Fy[i] - FOL.y) / Math.max(0.05, FOL.dist)));   // tighter as a runner pulls away
    FOL.x += (Fx[i] - FOL.x) * k; FOL.y += (Fy[i] - FOL.y) * k;
    const hx = Fx[i] - Ex[i], hy = Fy[i] - Ey[i];
    if (Math.hypot(hx, hy) > 2e-4) FOL.yaw += wrapAngle(Math.atan2(hx, hy) - FOL.yaw) * (1 - Math.exp(-dt * 0.9));
    if (F.frame % 6 === 0) F.readout('Walking with', `No. ${SER[i]}, ${TRIBES[Tr[i]].name} · step ${Age[i]} · L ${Wl[i].toFixed(3)}`);
  } else {                     // it came to rest or left the map: stay a moment, then join the next of its optimizer
    if (!FOL.restAt) FOL.restAt = now;
    if (now - FOL.restAt > 2400) {
      const j = pilgrimOf(FOL.tribe);
      if (j >= 0) { FOL.i = j; FOL.age = Age[j]; FOL.restAt = 0; camK = 1.5; trailReset(); }
      else if (now - FOL.restAt > 8000) { resetView(true); return; }
    }
  }
  GOAL.tx = FOL.x; GOAL.ty = FOL.y; GOAL.tz = hgrid(FOL.x, FOL.y) * ZS + 0.004;
  GOAL.yaw = FOL.yaw + FOL.yawOff; GOAL.dist = FOL.dist;
  let p = FOL.pitch;           // keep the eye, and the middle of the sight line, above the ground
  for (let q = 0; q < 24; q++) {
    const cp = Math.cos(p), ex = GOAL.tx - GOAL.dist * Math.sin(GOAL.yaw) * cp, ey = GOAL.ty - GOAL.dist * Math.cos(GOAL.yaw) * cp, ez = GOAL.tz + GOAL.dist * Math.sin(p);
    if (ez > hgrid(ex, ey) * ZS + 0.02 && (ez + GOAL.tz) / 2 > hgrid((ex + GOAL.tx) / 2, (ey + GOAL.ty) / 2) * ZS + 0.008) break;
    p += 0.06;
  }
  GOAL.pitch = Math.min(p, 1.45);
}
// ray from the eye through a css pixel, marched against the height grid
function pick(px, py) {
  const ndx = px / F.cssWidth * 2 - 1 - viewCx, ndy = 1 - py / F.cssHeight * 2 - viewCy;
  const t = Math.tan(FOV / 2);
  let dx = CFW[0] + ndx * t * aspect * CR[0] + ndy * t * CU[0], dy = CFW[1] + ndx * t * aspect * CR[1] + ndy * t * CU[1], dz = CFW[2] + ndx * t * aspect * CR[2] + ndy * t * CU[2];
  const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
  const ex = EYE[0], ey = EYE[1], ez = EYE[2], top = HMAX * ZS + 0.01;
  let t0 = 0, t1 = 1e3;
  for (const [o, d, a, b] of [[ex, dx, X0, X1], [ey, dy, Y0, Y1], [ez, dz, -0.01, top]]) {
    if (Math.abs(d) < 1e-12) { if (o < a || o > b) return null; continue; }
    let ta = (a - o) / d, tb = (b - o) / d; if (ta > tb) { const q = ta; ta = tb; tb = q; }
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
  }
  if (t0 > t1) return null;
  const n = 320, step = (t1 - t0) / n;
  let prev = t0, pd = ez + dz * t0 - hgrid(ex + dx * t0, ey + dy * t0) * ZS;
  for (let s = 1; s <= n; s++) {
    const tt = t0 + s * step, d = ez + dz * tt - hgrid(ex + dx * tt, ey + dy * tt) * ZS;
    if (d <= 0 && pd > 0) {
      let a = prev, b = tt;
      for (let q = 0; q < 16; q++) { const m = (a + b) / 2, dm = ez + dz * m - hgrid(ex + dx * m, ey + dy * m) * ZS; if (dm > 0) a = m; else b = m; }
      const tm = (a + b) / 2; return [ex + dx * tm, ey + dy * tm, ez + dz * tm];
    }
    prev = tt; pd = d;
  }
  return null;
}
// is a world point hidden behind the relief?
function occluded(x, y, z) {
  const ex = EYE[0], ey = EYE[1], ez = EYE[2], n = 48;
  for (let s = 2; s < n - 1; s++) {
    const t = s / n, px = ex + (x - ex) * t, py = ey + (y - ey) * t, pz = ez + (z - ez) * t;
    if (px > X0 && px < X1 && py > Y0 && py < Y1 && pz < hgrid(px, py) * ZS - 0.004) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------------------------
// pointer: drag to orbit, right-drag or shift-drag or two fingers to pan, wheel or pinch to zoom
// ---------------------------------------------------------------------------------------------
const PTRS = new Map();
let dragging = false, gesture = null, hoverAt = -1e9, hoverPt = null, hoverKey = '';
const RIPPLES = [];
function panBy(dxp, dyp) {
  const s = 2 * CAM.dist * Math.tan(FOV / 2) / F.cssHeight;
  const fx = Math.sin(CAM.yaw), fy = Math.cos(CAM.yaw), rx = Math.cos(CAM.yaw), ry = -Math.sin(CAM.yaw);
  const k = s / Math.max(0.35, Math.sin(CAM.pitch));
  GOAL.tx = clamp(GOAL.tx - dxp * s * rx + dyp * k * fx, SX0, SX1);
  GOAL.ty = clamp(GOAL.ty - dxp * s * ry + dyp * k * fy, SY0, SY1);
}
function zoomAt(px, py, f) {
  const p = pick(px, py);
  const nd = clamp(GOAL.dist * f, 0.35, fitDist(GOAL) * 2.2);
  const ff = nd / GOAL.dist;
  if (p) { GOAL.tx += (p[0] - GOAL.tx) * (1 - ff); GOAL.ty += (p[1] - GOAL.ty) * (1 - ff); GOAL.tz += (p[2] - GOAL.tz) * (1 - ff); }
  GOAL.dist = nd;
}
F.canvas.addEventListener('pointerdown', (e) => {
  lastInteract = performance.now();
  PTRS.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (PTRS.size === 1) gesture = { mode: e.altKey && e.button === 0 ? 'lamp' : e.button === 2 || e.shiftKey ? 'pan' : 'orbit', x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false, button: e.button, lx: e.clientX, ly: e.clientY };
  else if (PTRS.size === 2) {
    const [a, b] = [...PTRS.values()];
    gesture = { mode: 'two', moved: true, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }
  camK = 22;
});
F.canvas.addEventListener('pointermove', (e) => {
  hoverAt = performance.now();
  const p = PTRS.get(e.pointerId);
  if (!p || !gesture) return;
  p.x = e.clientX; p.y = e.clientY;
  lastInteract = performance.now(); camK = 22;
  if (gesture.mode === 'two' && PTRS.size >= 2) {
    leaveWalk();
    const [a, b] = [...PTRS.values()];
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
    panBy(cx - gesture.cx, cy - gesture.cy);
    if (gesture.d > 10 && d > 10) GOAL.dist = clamp(GOAL.dist * gesture.d / d, 0.35, fitDist(GOAL) * 2.2);
    GOAL.yaw -= wrapAngle(ang - gesture.ang); baseYaw = GOAL.yaw;
    Object.assign(gesture, { cx, cy, d, ang });
    return;
  }
  const dx = e.clientX - gesture.lx, dy = e.clientY - gesture.ly;
  gesture.lx = e.clientX; gesture.ly = e.clientY;
  if (!gesture.moved && Math.hypot(e.clientX - gesture.x0, e.clientY - gesture.y0) > 5) { gesture.moved = true; dragging = true; F.canvas.classList.add('pl-grab'); }
  if (!gesture.moved) return;
  if (gesture.mode === 'lamp') {
    if (!F.params.lamp) F.setParam('lamp', true);
    F.setParam('lampAz', ((F.params.lampAz + dx * 0.4) % 360 + 360) % 360);
    F.setParam('lampEl', clamp(F.params.lampEl - dy * 0.25, 15, 80));
  } else if (gesture.mode === 'pan') { leaveWalk(); panBy(dx, dy); }
  else if (FOL.on) { FOL.yawOff -= dx * 0.0062; FOL.pitch = clamp(FOL.pitch + dy * 0.0052, 0.05, 1.3); }
  else {
    GOAL.yaw -= dx * 0.0062; baseYaw = GOAL.yaw;
    GOAL.pitch = clamp(GOAL.pitch + dy * 0.0052, 0.16, Math.PI / 2 - 0.0001);
    if (planOn && Math.abs(dy) + Math.abs(dx) > 0) planOn = false;
  }
});
const endPtr = (e) => {
  const g = gesture;
  PTRS.delete(e.pointerId);
  if (g && g.mode !== 'two' && !g.moved && e.type === 'pointerup' && (g.button === 0 || e.pointerType !== 'mouse') && performance.now() - g.t0 < 600) click(e.clientX, e.clientY);
  if (PTRS.size === 0) { gesture = null; dragging = false; F.canvas.classList.remove('pl-grab'); }
  else if (PTRS.size === 1) { const [a] = [...PTRS.values()]; gesture = { mode: 'orbit', x0: a.x, y0: a.y, lx: a.x, ly: a.y, t0: 0, moved: true, button: 0 }; }
};
F.canvas.addEventListener('pointerup', endPtr);
F.canvas.addEventListener('pointercancel', endPtr);
F.canvas.addEventListener('pointerleave', () => { hoverAt = -1e9; });
F.canvas.addEventListener('wheel', (e) => {
  lastInteract = performance.now(); camK = 14;
  const f = Math.exp(e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016));
  if (FOL.on) FOL.dist = clamp(FOL.dist * f, 0.07, 2); else zoomAt(e.clientX, e.clientY, f);
}, { passive: true });
F.canvas.addEventListener('dblclick', () => resetView(true));
addEventListener('keydown', () => { lastInteract = performance.now(); });
function click(px, py) {
  if (!SECT.on) { const m = pilgrimAt(px, py); if (m >= 0) { followPilgrim(OI[m]); return; } }
  const p = pick(px, py);
  if (!p) return;
  if (p[0] < X0 || p[0] > X1 || p[1] < Y0 || p[1] > Y1) return;
  RIPPLES.push([p[0], p[1], performance.now()]); if (RIPPLES.length > 6) RIPPLES.shift();
  if (SECT.on) { sectionClick(p[0], p[1]); return; }
  if (PL.click) PL.click(p[0], p[1]); else releaseCaravan(p[0], p[1]);
}

// ---------------------------------------------------------------------------------------------
// overlay: pins and point names, the hover instrument, ripples
// ---------------------------------------------------------------------------------------------
function moodOf(i, long) {
  const fly = FT[i] && NOWMS - FT[i] < FLIGHT_MS;
  if (fly && CWF[i]) return long ? 'cartwheeling: a catapult, thrown from where ηλ > 2 to where ηλ < 2' : 'cartwheeling: a catapult';
  if (fly) return long ? 'thrown through the air: one step was far too long' : 'thrown through the air';
  if (BULB[i] && NOWMS - BULB[i] < 2600) return long ? `found the way down after ${ESC[i]} steps at the saddle` : 'found the way down';
  if (SK[i] && NOWMS - SK[i] < 400) return long ? 'skidding: its momentum carried it past the bottom and up the far side' : 'skidding past the bottom';
  if (WK[i] && NOWMS - WK[i] < 1500) return long ? 'waking with a stretch: the slope is back' : 'waking up';
  if (EM[i] === 2 && Age[i] - PLT0[i] >= NAP) return long ? `asleep on its feet: ${Age[i] - PLT0[i]} steps on a plateau with almost no gradient` : 'sleepwalking across a plateau';
  if (EM[i] === 1) return long ? 'puzzled at a saddle: the slope is gone and one way curves down' : 'puzzled at a saddle';
  if (EM[i] === 2) return long ? 'trudging across a plateau: no slope and no curve' : 'trudging across a plateau';
  if (GT[i] > 0.6) return long ? 'its steps keep reversing: each one overshoots the valley floor (for gradient descent, η > 1/λ)' : 'bouncing: its steps keep reversing';
  return GS[i] < 1e-5 ? 'all but standing still' : 'walking downhill';
}
// a campfire in front of a tent, and smoke that rises higher the more stick men sit round it (fx, fy: the fire's foot)
function campFire(oc, fx, fy, hp, cp, a, tt) {
  const s = 1 + 0.12 * Math.sin(tt * 17 + cp.x * 40) + 0.08 * Math.sin(tt * 29 + cp.y * 50);
  if (DUSKV > 0.01) {
    const gr = oc.createRadialGradient(fx, fy - hp * 0.1, 0, fx, fy - hp * 0.1, hp * 1.5);
    gr.addColorStop(0, `rgba(255,170,80,${0.4 * DUSKV * a})`); gr.addColorStop(1, 'rgba(255,170,80,0)');
    oc.globalCompositeOperation = 'lighter'; oc.fillStyle = gr; oc.fillRect(fx - hp * 1.5, fy - hp * 1.6, hp * 3, hp * 3); oc.globalCompositeOperation = 'source-over';
  }
  oc.globalAlpha = a; oc.strokeStyle = INK; oc.lineWidth = Math.max(1, hp * 0.035); oc.lineCap = 'round';
  oc.beginPath(); oc.moveTo(fx - hp * 0.13, fy); oc.lineTo(fx + hp * 0.13, fy - hp * 0.035); oc.moveTo(fx - hp * 0.13, fy - hp * 0.035); oc.lineTo(fx + hp * 0.13, fy); oc.stroke(); oc.lineCap = 'butt';
  for (const [k, col] of [[1, '#d9662b'], [0.6, '#f2c14e']]) {
    oc.fillStyle = col; oc.beginPath(); oc.moveTo(fx - hp * 0.08 * k, fy - hp * 0.02);
    oc.quadraticCurveTo(fx - hp * 0.09 * k, fy - hp * 0.16 * k * s, fx, fy - hp * 0.28 * k * s);
    oc.quadraticCurveTo(fx + hp * 0.09 * k, fy - hp * 0.16 * k * s, fx + hp * 0.08 * k, fy - hp * 0.02); oc.closePath(); oc.fill();
  }
  const plume = hp * (0.5 + 0.42 * Math.log2(1 + cp.n));
  oc.fillStyle = DUSKV > 0.5 ? 'rgb(150,152,162)' : 'rgb(118,121,128)';
  for (let k = 0; k < 7; k++) {
    const u = ((tt * 0.2 + k / 7 + cp.x * 3) % 1 + 1) % 1, sr = hp * (0.05 + 0.17 * u);
    oc.globalAlpha = a * 0.3 * (1 - u) * smoothstep(0, 0.1, u);
    oc.beginPath(); oc.arc(fx + Math.sin(u * 5 + k + cp.x * 9) * hp * 0.1 + u * hp * 0.4, fy - hp * 0.32 - u * plume, sr, 0, TAU); oc.fill();
  }
  oc.globalAlpha = 1;
}
function pilgrimCard(i, sx, sy, hp, alpha) {       // a stick man's papers: its number, its optimizer, where it is and how it is doing
  const T = TRIBES[Tr[i]], mood = moodOf(i, true);
  const l1 = `Stick man No. ${SER[i]}`, l2 = `${T.name} · step ${Age[i]} · L ${Wl[i].toFixed(3)}`, l3 = mood, l4 = FOL.on && FOL.i === i ? 'you are walking with it' : 'click to walk with it';
  const f1 = `italic 400 ${PHONE ? 13 : 14}px ${SERIF}`, f2 = `400 ${PHONE ? 8.5 : 9}px ${MONO}`, f3 = `italic 400 ${PHONE ? 11 : 12}px ${SERIF}`;
  oc.font = f1; const w1 = oc.measureText(l1).width; oc.font = f2; const w2 = Math.max(oc.measureText(l2).width, oc.measureText(l4).width); oc.font = f3; const w3 = oc.measureText(l3).width;
  const W = Math.max(w1, w2, w3) + 22, H = 70, [rl, rt, rr, rb] = region();
  let x = sx + hp * 0.42 + 8, y = sy - hp * 1.25 - 6;
  if (x + W > rr) x = sx - hp * 0.42 - 8 - W;
  x = clamp(x, rl + 4, rr - W - 4); y = clamp(y, rt + 4, rb - H - 4);
  oc.globalAlpha = alpha;
  oc.fillStyle = 'rgba(241,241,234,0.96)'; oc.strokeStyle = 'rgba(36,38,43,0.35)'; oc.lineWidth = 1;
  oc.beginPath(); oc.roundRect(x, y, W, H, 4); oc.fill(); oc.stroke();
  oc.fillStyle = T.color; oc.fillRect(x, y + 6, 3, H - 12);
  oc.textAlign = 'left'; oc.textBaseline = 'middle'; oc.fillStyle = INK;
  oc.font = f1; oc.fillText(l1, x + 12, y + 14);
  oc.font = f2; oc.fillText(l2, x + 12, y + 31);
  oc.font = f3; oc.fillStyle = 'rgba(36,38,43,0.85)'; oc.fillText(l3, x + 12, y + 46);
  oc.font = f2; oc.fillStyle = 'rgba(36,38,43,0.55)'; oc.fillText(l4, x + 12, y + 60);
  oc.globalAlpha = 1;
}
const ov = document.createElement('canvas'); ov.className = 'pl-overlay';
document.body.insertBefore(ov, F.canvas.nextSibling);
const oc = ov.getContext('2d');
F.captureLayers = [F.canvas, ov];
const OPLACED = [], P0 = [0, 0, 0], P1 = [0, 0, 0];
let labelVis = [];
function drawOverlay(now, alpha) {
  const dpr = F.dpr; if (ov.width !== F.width || ov.height !== F.height) { ov.width = F.width; ov.height = F.height; }
  oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, ov.width, ov.height);
  oc.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (alpha <= 0) return;
  OPLACED.length = 0;
  const marks = NAMES.marks;
  if (labelVis.length !== marks.length) labelVis = marks.map(() => 0);
  const order = marks.map((m, k) => k).sort((a, b) => (marks[b].pri || 0) - (marks[a].pri || 0));
  const pinH = 0.075;
  for (const k of order) {
    const m = marks[k];
    if (m.pin === false) continue;
    const z0 = hgrid(m.p.x, m.p.y) * ZS;
    project(VP, m.p.x, m.p.y, z0, P0); project(VP, m.p.x, m.p.y, z0 + pinH, P1);
    let vis = P0[2] > 0 && P1[2] > 0 && !occluded(m.p.x, m.p.y, z0 + pinH * 0.5);
    const f1 = `500 ${PHONE ? 9 : 10}px ${SERIF}`, f2 = `400 ${PHONE ? 8 : 8.5}px ${MONO}`;
    oc.font = f1; oc.letterSpacing = '1.4px'; const w1 = m.name ? oc.measureText(m.name.toUpperCase()).width : 0;
    oc.font = f2; oc.letterSpacing = '0px'; const w2 = oc.measureText(m.sub).width;
    const w = Math.max(w1, w2), h = m.name ? 24 : 11, lx = P1[0], ly = P1[1] - h / 2 - 3;
    const box = [lx - w / 2 - 4, ly - h / 2 - 2, lx + w / 2 + 4, ly + h / 2 + 2];
    if (vis) for (const b of OPLACED) if (box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]) { vis = false; break; }
    labelVis[k] += ((vis ? 1 : 0) - labelVis[k]) * 0.18;
    const a = labelVis[k] * alpha;
    if (vis) OPLACED.push(box);
    if (a < 0.02) continue;
    oc.globalAlpha = a;
    oc.strokeStyle = 'rgba(36,38,43,0.8)'; oc.lineWidth = 0.8;
    oc.beginPath(); oc.moveTo(P0[0], P0[1]); oc.lineTo(P1[0], P1[1]); oc.stroke();
    oc.fillStyle = INK; oc.beginPath(); oc.arc(P1[0], P1[1], 1.6, 0, TAU); oc.fill();
    oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.lineJoin = 'round';
    const halo = 'rgba(236,238,232,0.88)';
    if (m.name) {
      oc.font = f1; oc.letterSpacing = '1.4px';
      oc.strokeStyle = halo; oc.lineWidth = 3; oc.strokeText(m.name.toUpperCase(), lx + 0.7, ly - 5.5);
      oc.fillStyle = INK; oc.fillText(m.name.toUpperCase(), lx + 0.7, ly - 5.5);
    }
    oc.font = f2; oc.letterSpacing = '0px';
    oc.strokeStyle = halo; oc.lineWidth = 3; oc.strokeText(m.sub, lx, m.name ? ly + 6.5 : ly);
    oc.fillStyle = 'rgba(36,38,43,0.85)'; oc.fillText(m.sub, lx, m.name ? ly + 6.5 : ly);
  }
  oc.globalAlpha = 1; oc.letterSpacing = '0px';
  if (PL.overlay) PL.overlay(oc, now);
  if (SCAF.on) scaffoldOverlay(oc, now);
  if (SECT.on) sectionOverlay(oc);
  // ripples where cohorts were released
  oc.strokeStyle = INK;
  for (let k = RIPPLES.length - 1; k >= 0; k--) {
    const R = RIPPLES[k], u = (now - R[2]) / 900;
    if (u >= 1) { RIPPLES.splice(k, 1); continue; }
    const e = 1 - (1 - u) * (1 - u) * (1 - u), rr = 0.012 + 0.07 * e;
    oc.globalAlpha = 0.6 * (1 - u); oc.lineWidth = 0.9; oc.beginPath();
    for (let q = 0; q <= 32; q++) {
      const a = q / 32 * TAU, x = R[0] + rr * Math.cos(a), y = R[1] + rr * Math.sin(a);
      project(VP, x, y, hgrid(x, y) * ZS, P0); if (q) oc.lineTo(P0[0], P0[1]); else oc.moveTo(P0[0], P0[1]);
    }
    oc.stroke();
  }
  oc.globalAlpha = 1;
  // signposts: names stand on the ground at their print positions, facing the particle, nearest first
  if (FOGV > 0.02 && SIGNS.length) {
    const vis = [];
    for (const s of SIGNS) {
      const z0 = hgrid(s.x, s.y) * ZS, zt = z0 + 0.03;
      project(VP, s.x, s.y, zt, P1); if (P1[2] <= 0.02) continue;
      const d = Math.hypot(s.x - EYE[0], s.y - EYE[1], zt - EYE[2]);
      if (d > 2.4 || occluded(s.x, s.y, zt)) continue;
      vis.push([d, s, P1[0], P1[1], z0]);
    }
    vis.sort((a, b) => a[0] - b[0]);
    oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.lineJoin = 'round';
    for (const [d, s, sx, sy, z0] of vis) {
      const fs = clamp(5.2 / d, 9, 19), a = FOGV * alpha * clamp((2.4 - d) / 0.7, 0, 1);
      oc.font = `italic 400 ${fs}px ${SERIF}`; oc.letterSpacing = '0.4px';
      const tw = oc.measureText(s.text).width, bw = tw + fs * 0.9, bh = fs * 1.5, bx = sx - bw / 2, by = sy - bh - 2;
      const box = [bx, by, bx + bw, by + bh];
      if (OPLACED.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
      OPLACED.push(box);
      project(VP, s.x, s.y, z0, P0);
      oc.globalAlpha = a;
      oc.strokeStyle = 'rgba(36,38,43,0.85)'; oc.lineWidth = 1.1;
      oc.beginPath(); oc.moveTo(P0[0], P0[1]); oc.lineTo(sx, sy); oc.stroke();
      oc.fillStyle = 'rgba(241,241,234,0.94)'; oc.beginPath(); oc.roundRect(bx, by, bw, bh, 2); oc.fill();
      oc.lineWidth = 0.8; oc.stroke();
      oc.fillStyle = s.color || INK; oc.fillText(s.text, sx, by + bh / 2 + 0.5);
    }
    oc.globalAlpha = 1; oc.letterSpacing = '0px';
  }
  // camps, when the stick men are big enough to see
  if (CAMPS.length) {
    const pxW = 0.5 * F.cssHeight / Math.tan(FOV / 2);
    oc.textAlign = 'left'; oc.textBaseline = 'middle'; oc.lineJoin = 'round';
    for (const cp of CAMPS) {
      const z0 = hgrid(cp.x, cp.y) * ZS;
      project(VP, cp.x, cp.y, z0, P0); if (P0[2] <= 0.02) continue;
      const hp = PIL_H * pxW / P0[2], a = alpha * smoothstep(9, 15, hp);
      if (a < 0.02 || occluded(cp.x, cp.y, z0 + 0.004)) continue;
      campFire(oc, P0[0] + hp * 0.82, P0[1] + hp * 0.03, hp, cp, a, REDUCED ? 0 : now / 1000);
      const x = P0[0] + hp * 0.62, y = P0[1] - hp * 1.05, fs = clamp(hp * 0.36, 8, 13);    // the head-count, by the pennant
      oc.globalAlpha = a; oc.font = `400 ${fs}px ${MONO}`;
      oc.strokeStyle = 'rgba(236,238,232,0.92)'; oc.lineWidth = 3; oc.strokeText(`× ${cp.n}`, x, y);
      oc.fillStyle = INK; oc.fillText(`× ${cp.n}`, x, y);
    }
    oc.globalAlpha = 1;
  }
  if (F.params.lamp && now - lampShown < 1900) {
    const u = clamp((1900 - (now - lampShown)) / 700, 0, 1), cy = (Y0 + Y1) / 2, Rl = 1.9;
    project(VP, 0, cy, 0, P0); const c0 = [P0[0], P0[1], P0[2]];
    project(VP, LAMP[0] * Rl, cy + LAMP[1] * Rl, LAMP[2] * Rl, P1);
    if (c0[2] > 0 && P1[2] > 0) {
      oc.globalAlpha = 0.85 * u; oc.strokeStyle = INK; oc.lineWidth = 0.8;
      oc.setLineDash([3, 3]); oc.beginPath(); oc.moveTo(c0[0], c0[1]); oc.lineTo(P1[0], P1[1]); oc.stroke(); oc.setLineDash([]);
      oc.fillStyle = 'rgb(250,246,232)'; oc.beginPath(); oc.arc(P1[0], P1[1], 5, 0, TAU); oc.fill(); oc.stroke();
      oc.beginPath();
      for (let q = 0; q < 8; q++) { const a = q / 8 * TAU; oc.moveTo(P1[0] + 7.5 * Math.cos(a), P1[1] + 7.5 * Math.sin(a)); oc.lineTo(P1[0] + 10.5 * Math.cos(a), P1[1] + 10.5 * Math.sin(a)); }
      oc.stroke();
      const txt = `lamp ${Math.round(F.params.lampAz)}° · ${Math.round(F.params.lampEl)}°`;
      oc.font = `400 ${PHONE ? 8 : 8.5}px ${MONO}`; oc.textAlign = 'left'; oc.textBaseline = 'middle'; oc.lineJoin = 'round';
      oc.strokeStyle = 'rgba(236,238,232,0.92)'; oc.lineWidth = 3; oc.strokeText(txt, P1[0] + 15, P1[1]);
      oc.fillStyle = INK; oc.fillText(txt, P1[0] + 15, P1[1]);
    }
    oc.globalAlpha = 1;
  }
  // the cams' pointer: a pulsing ring round the stick man whose view is hovered, figure or dot
  if (RHOVER >= 0 && Alive[RHOVER]) {
    for (let m = ORDN - 1; m >= 0; m--) {
      if (OI[m] !== RHOVER) continue;
      const hp = OH[m], fig = hp >= 9, cx = OX[m], cy = fig ? OY[m] - hp * 0.55 : OY[m], pul = REDUCED ? 0.5 : 0.5 + 0.5 * Math.sin(now / 150);
      const rr = (fig ? Math.max(10, hp * 0.7) : 9) + 3 * pul, col = hex3(CRr[RHOVER], CGg[RHOVER], CBb[RHOVER]);
      oc.globalAlpha = alpha; oc.lineWidth = 4; oc.strokeStyle = 'rgba(241,241,234,0.85)'; oc.beginPath(); oc.arc(cx, cy, rr, 0, TAU); oc.stroke();
      oc.lineWidth = 1.6; oc.strokeStyle = col; oc.beginPath(); oc.arc(cx, cy, rr, 0, TAU); oc.stroke();
      oc.font = `400 ${PHONE ? 9 : 10}px ${MONO}`; oc.textAlign = 'center'; oc.textBaseline = 'bottom'; oc.lineJoin = 'round';
      oc.strokeStyle = 'rgba(241,241,234,0.92)'; oc.lineWidth = 3; oc.strokeText(`No. ${SER[RHOVER]}`, cx, cy - rr - 3);
      oc.fillStyle = INK; oc.fillText(`No. ${SER[RHOVER]}`, cx, cy - rr - 3);
      oc.globalAlpha = 1;
      break;
    }
  }
  // a card's map link: a pulsing ring round the named point while its phrase is hovered
  if (MLINK) {
    project(VP, MLINK.x, MLINK.y, hgrid(MLINK.x, MLINK.y) * ZS, P0);
    if (P0[2] > 0.02) {
      const rr = 15 + 4 * (REDUCED ? 0.5 : 0.5 + 0.5 * Math.sin(now / 150));
      oc.globalAlpha = alpha; oc.lineWidth = 4; oc.strokeStyle = 'rgba(241,241,234,0.85)'; oc.beginPath(); oc.arc(P0[0], P0[1], rr, 0, TAU); oc.stroke();
      oc.lineWidth = 1.6; oc.strokeStyle = '#4b3fa0'; oc.beginPath(); oc.arc(P0[0], P0[1], rr, 0, TAU); oc.stroke();
      oc.globalAlpha = 1;
    }
  }
  // a question mark over each stick man puzzled at a saddle
  {
    let nq = 0;
    oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.lineJoin = 'round';
    for (let m = ORDN - 1; m >= 0 && nq < 40; m--) {
      if (!OFg[m] || OE[m] !== 1 || OH[m] < 12 || OI[m] < 0) continue;
      const i = OI[m], hp = OH[m];
      if (occluded(Wx[i], Wy[i], hgrid(Wx[i], Wy[i]) * ZS + PIL_H)) continue;
      const fs = clamp(hp * 0.42, 10, 26), qx = OX[m] + hp * 0.14 * GF[i], qy = OY[m] - hp * 1.38;
      oc.globalAlpha = alpha; oc.font = `italic 500 ${fs}px ${SERIF}`;
      oc.strokeStyle = 'rgba(236,238,232,0.9)'; oc.lineWidth = 3; oc.strokeText('?', qx, qy);
      oc.fillStyle = INK; oc.fillText('?', qx, qy); nq++;
    }
    oc.globalAlpha = 1;
  }
  // a ! the moment one finds the way down, and dust where they bounce or skid
  {
    let nb = 0;
    for (let m = ORDN - 1; m >= 0 && nb < 24; m--) {
      if (!OFg[m] || OH[m] < 12 || OI[m] < 0) continue;
      const i = OI[m], u = (NOWMS - BULB[i]) / BULB_MS;
      if (!BULB[i] || u < 0 || u >= 1 || occluded(Wx[i], Wy[i], hgrid(Wx[i], Wy[i]) * ZS + PIL_H)) continue;
      drawBang(oc, OX[m] + OH[m] * 0.14 * GF[i], OY[m] - OH[m] * 1.42, OH[m], u, alpha, 3); nb++;
    }
    while (PUFFS.length && NOWMS - PUFFS[0].t0 > PUFF_MS) PUFFS.shift();
    const pxW = 0.5 * F.cssHeight / Math.tan(FOV / 2);
    for (const pf of PUFFS) {
      const z = hgrid(pf.x, pf.y) * ZS; project(VP, pf.x, pf.y, z, P0); if (P0[2] <= 0.02) continue;
      const hp = PIL_H * pxW / P0[2]; if (hp < 12 || occluded(pf.x, pf.y, z + 0.002)) continue;
      drawPuff(oc, P0[0], P0[1], hp, pf, alpha);
    }
    while (POPS.length && NOWMS - POPS[0].t0 > POP_MS) POPS.shift();
    for (const pp of POPS) {
      const z = hgrid(pp.x, pp.y) * ZS; project(VP, pp.x, pp.y, z, P0); if (P0[2] <= 0.02) continue;
      const hp = PIL_H * pxW / P0[2]; if (hp < 9 || occluded(pp.x, pp.y, z + 0.002)) continue;
      drawPop(oc, P0[0], P0[1], hp, pp, alpha);
    }
    let nz = 0; const tz = REDUCED ? 0 : now / 1000;
    for (let m = ORDN - 1; m >= 0 && nz < 30; m--) {
      if (!OFg[m] || OE[m] !== 6 || OH[m] < 12 || OI[m] < 0) continue;
      const i = OI[m]; if (occluded(Wx[i], Wy[i], hgrid(Wx[i], Wy[i]) * ZS + PIL_H)) continue;
      drawZ(oc, OX[m] + OH[m] * 0.2 * GF[i], OY[m] - OH[m] * 1.3, OH[m], tz + i * 0.37, alpha); nz++;
    }
  }
  // the hover instrument: a ring on the relief, the downhill arrow, θ, L and |∇L|; over a stick man, its papers instead
  const cl = document.body.classList;
  const hovering = !(now - hoverAt > 2200 || dragging || cl.contains('hl-clean') || cl.contains('hl-idle'));
  const hm = hovering ? pilgrimAt(F.pointer.x, F.pointer.y) : -1;
  HOVER = hm >= 0 ? OI[hm] : -1;
  const cur = HOVER >= 0 ? 'pointer' : SECT.on ? 'crosshair' : '';
  if (F.canvas.style.cursor !== cur) F.canvas.style.cursor = cur;
  if (HOVER >= 0) { pilgrimCard(HOVER, OX[hm], OY[hm], OH[hm], alpha); return; }
  if (!hovering) return;
  const P = F.pointer;
  if (!hoverPt || hoverKey !== P.x + ',' + P.y) { hoverKey = P.x + ',' + P.y; hoverPt = pick(P.x, P.y); }
  const hp = hoverPt;
  if (!hp || hp[0] < X0 || hp[0] > X1 || hp[1] < Y0 || hp[1] > Y1) return;
  grad(hp[0], hp[1]);
  const g = Math.hypot(gX, gY) || 1, ux = -gX / g, uy = -gY / g, Lh = gL;
  oc.globalAlpha = 0.85; oc.strokeStyle = INK; oc.lineWidth = 0.9;
  oc.beginPath();
  for (let q = 0; q <= 24; q++) { const a = q / 24 * TAU, x = hp[0] + 0.012 * Math.cos(a), y = hp[1] + 0.012 * Math.sin(a); project(VP, x, y, hgrid(x, y) * ZS, P0); if (q) oc.lineTo(P0[0], P0[1]); else oc.moveTo(P0[0], P0[1]); }
  oc.stroke();
  const a0 = [hp[0] + ux * 0.014, hp[1] + uy * 0.014], a1 = [hp[0] + ux * 0.05, hp[1] + uy * 0.05];
  project(VP, a0[0], a0[1], hgrid(a0[0], a0[1]) * ZS, P0); const s0 = [P0[0], P0[1]];
  project(VP, a1[0], a1[1], hgrid(a1[0], a1[1]) * ZS, P1);
  const ax = P1[0] - s0[0], ay = P1[1] - s0[1], al = Math.hypot(ax, ay) || 1, bx = ax / al, by = ay / al;
  oc.beginPath(); oc.moveTo(s0[0], s0[1]); oc.lineTo(P1[0], P1[1]);
  oc.moveTo(P1[0] - bx * 4 + by * 2.4, P1[1] - by * 4 - bx * 2.4); oc.lineTo(P1[0], P1[1]); oc.lineTo(P1[0] - bx * 4 - by * 2.4, P1[1] - by * 4 + bx * 2.4);
  oc.stroke();
  const txt = `θ ${fmt(hp[0], 2)}, ${fmt(hp[1], 2)} · L ${Lh.toFixed(3)} · |∇L| ${g.toFixed(2)}`;
  project(VP, hp[0], hp[1], hp[2], P0);
  oc.font = `400 ${PHONE ? 8 : 8.5}px ${MONO}`; oc.textBaseline = 'middle';
  const right = P0[0] > region()[2] - 230;
  oc.textAlign = right ? 'right' : 'left';
  const tx = right ? P0[0] - 14 : P0[0] + 14, ty = P0[1] - 16;
  oc.lineJoin = 'round'; oc.strokeStyle = 'rgba(236,238,232,0.92)'; oc.lineWidth = 3; oc.strokeText(txt, tx, ty);
  oc.fillStyle = INK; oc.fillText(txt, tx, ty);
  oc.globalAlpha = 1;
}

// ---------------------------------------------------------------------------------------------
// rendering
// ---------------------------------------------------------------------------------------------
const VIEW = new Float32Array(2), MAPU = new Float32Array([X0, Y0, MAPW, MAPH]), GRIDU = new Float32Array([GW, GH]);
const SHEETU = new Float32Array([SX0, SY0, SW, SH]), MAPRU = new Float32Array([X0, Y0, MAPW, MAPH]), BGU = new Float32Array(BG);
const INKTEXU = new Float32Array([INKW, INKH]);
const LAMP = new Float32Array([-0.6, 0.6, 0.53]), FOGC = new Float32Array(BG), SHOFF = new Float32Array([0.05, -0.075]);
const LIGHTR = new Float32Array([SX0 - LMB, SY0 - LMB, SW + 2 * LMB, SH + 2 * LMB]);
const LAMPU = { uLight: lightTex, uLightR: LIGHTR, uLamp: LAMP, uEye: EYE, uFogC: FOGC, uLampOn: 1, uAo: 0.5, uFog: 0, uDusk: 0 };
const U_BK = { uData: dataTex, uGrid: GRIDU, uMap: MAPU, uLightR: LIGHTR, uSheetR: SHEETU, uRes: new Float32Array([LMW, LMH]), uZs: 0, uTh: TH, uCut: 0, uTerr: 0, uIvL: 0.05 };
function terrU(U) { U.uCut = CUT; U.uTerr = TERR; U.uIvL = F.params.interval; return U; }
let lampShown = -1e9;
function setLamp() {
  const az = F.params.lampAz * DEG, el = F.params.lampEl * DEG;
  LAMP[0] = Math.sin(az) * Math.cos(el); LAMP[1] = Math.cos(az) * Math.cos(el); LAMP[2] = Math.sin(el);
  const k = 0.068 / Math.max(0.3, LAMP[2]);
  if (F.params.lamp) { SHOFF[0] = -LAMP[0] * k; SHOFF[1] = -LAMP[1] * k; } else { SHOFF[0] = 0.05; SHOFF[1] = -0.075; }
  lightDirty = true;
}
function bakeLight() {
  if (!F.params.lamp || (!lightDirty && !aoDirty)) return;
  gl.bindFramebuffer(gl.FRAMEBUFFER, lightFbo); gl.viewport(0, 0, LMW, LMH);
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
  if (lightDirty) { gl.colorMask(true, false, false, false); U_BK.uZs = ZS; P_SHADOW.set(terrU(U_BK)).set({ uLamp: LAMP, uTop: HMAX * ZS + 0.002 }); GL.fullscreen(gl); lightDirty = false; }
  if (aoDirty) { gl.colorMask(false, true, false, false); U_BK.uZs = ZT; terrU(U_BK).uTerr = 0; P_AO.set(U_BK); GL.fullscreen(gl); aoDirty = false; }
  gl.colorMask(true, true, true, true);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
setLamp();
const U_T = { uVP: VP, uZs: 0, uData: dataTex, uSheet: sheetTex, uMask: maskTex, uInk: inkTex, uMap: MAPU, uSheetR: SHEETU, uGrid: GRIDU, uIv: 0.05, uHmin: 0, uSpan: 1, uRelief: 1, uDpr: 1, uPrint: 1, uFlood: -1, uCut: 0, uTerr: 0, uIvL: 0.05, uNames: namesTex, uWalk: 0 };
const U_W = { uVP: VP, uZs: 0, uData: dataTex, uMap: MAPU, uGrid: GRIDU, uIv: 0.05, uHmin: 0, uSpan: 1, uDpr: 1, uPrint: 1, uCut: 0, uTerr: 0, uIvL: 0.05 };
const U_F = { uVP: VP, uSheet: sheetTex, uSheetR: SHEETU, uMapR: MAPRU, uBg: BGU, uPrint: 1 };
const U_K = { uVP: VP, uEye: EYE, uView: VIEW, uZs: 0, uDpr: 1, uPxW: 1, uHW: 0.018, uDusk: 0, uData: dataTex, uMap: MAPU, uGrid: GRIDU, uCut: 0, uTerr: 0, uIvL: 0.05 };
const U_R = { uVP: VP, uView: VIEW, uZs: 0, uDpr: 1, uPxW: 1, uData: dataTex, uMap: MAPU, uGrid: GRIDU, uCut: 0, uTerr: 0, uIvL: 0.05 };
const U_M = { uVP: VP, uZs: 0, uLift: 0, uData: dataTex, uMap: MAPU, uGrid: GRIDU, uCut: 0, uTerr: 0, uIvL: 0.05,
  uC1: new Float32Array(3), uC2: new Float32Array(3), uT1: 1, uT2: 1, uW2: 0, uLmin: 0, uA: 0, uDrift: 0 };
const MIST_LAYERS = [[0.003, 1.2], [0.01, 0.85], [0.02, 0.55]];      // lift above the relief (world units), optical depth at the peak
function drawMist(k) {
  const ms = PL.mist(); if (!ms || !ms.length || k <= 0) return;
  const tint = (o, hex) => { const c = hexRGB(hex); for (let q = 0; q < 3; q++) o[q] = 0.62 + 0.38 * c[q]; };
  terrU(U_M); U_M.uZs = ZS; U_M.uLmin = HMIN; U_M.uDrift = REDUCED ? 0 : performance.now() / 1000;
  U_M.uT1 = Math.max(1e-6, ms[0].T); tint(U_M.uC1, ms[0].color);
  U_M.uW2 = ms[1] ? 1 : 0; U_M.uT2 = ms[1] ? Math.max(1e-6, ms[1].T) : 1; tint(U_M.uC2, ms[1] ? ms[1].color : ms[0].color);
  gl.bindVertexArray(meshVAO);
  for (const [lift, a] of MIST_LAYERS) { U_M.uLift = lift; U_M.uA = a * k; P_MIST.set(U_M); gl.drawElements(gl.TRIANGLES, meshCount, gl.UNSIGNED_INT, 0); }
}
const U_SEG = { uMap: MAPU, uTex: INKTEXU };
Object.assign(U_T, LAMPU); Object.assign(U_W, LAMPU); Object.assign(U_F, LAMPU, { uShOff: SHOFF });
for (const [P, U] of [[P_TERRAIN, U_T], [P_WALL, U_W], [P_FLAT, U_F]]) for (const k in U) if (!P.uniforms[k]) delete U[k];
function lampUniforms(U) {
  if ('uLampOn' in U) U.uLampOn = F.params.lamp ? 1 : 0;
  if ('uAo' in U) U.uAo = 0.5 * (1 - TERR);
  if ('uFog' in U) U.uFog = FOGV;
  if ('uDusk' in U) U.uDusk = DUSKV;
}
let inkMipDirty = false, inkFadeAcc = 0;
function flushInk() {
  if (!segN && !stampN) return;
  gl.bindFramebuffer(gl.FRAMEBUFFER, inkFbo); gl.viewport(0, 0, INKW, INKH);
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.DST_COLOR, gl.ZERO);
  if (segN) {
    gl.bindBuffer(gl.ARRAY_BUFFER, segBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, SEGB, 0, segN * 9);
    P_SEG.set(U_SEG); gl.bindVertexArray(segVAO); gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, segN);
  }
  if (stampN) {
    gl.bindBuffer(gl.ARRAY_BUFFER, stampBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, STAMPB, 0, stampN * 9);
    P_STAMP.set(U_SEG); gl.bindVertexArray(stampVAO); gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, stampN);
  }
  segN = 0; stampN = 0; inkMipDirty = true;
  gl.bindVertexArray(null); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
function fadeInk(f) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, inkFbo); gl.viewport(0, 0, INKW, INKH);
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  P_FADE.set({ uF: f }); GL.fullscreen(gl);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); inkMipDirty = true;
}
function clearInk(toast) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, inkFbo); gl.viewport(0, 0, INKW, INKH);
  gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); inkMipDirty = true; segN = 0; stampN = 0;
  if (toast) F.toast('Trails cleared');
}
// a stick man's gait: the phase of its stride advances with the distance it walks; it runs and leans when fast
// (momentum), staggers in proportion to its gradient noise, throws up its arms when its steps reverse (an
// unstable step size), hops if it is a Newton particle and marches if it follows a sign
const PIL_H = 0.018;              // a stick man's height, in θ units
const smoothstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const GP = new Float32Array(CAP), GS = new Float32Array(CAP), GT = new Float32Array(CAP), GN = new Float32Array(CAP), GF = new Float32Array(CAP).fill(1);
// reactions: EM is read from the landscape under its feet every ten steps (1 a saddle, 2 a plateau); FT.. is a flight,
// shown when a single step is long enough to throw it (a cliff, a catapult); SER is the number on its papers
const EM = new Uint8Array(CAP), SER = new Int32Array(CAP), FT = new Float64Array(CAP);
// BNC a bounce off a wall (its step reversed), SK a skid uphill on momentum, PT its last puff of dust; BULB the moment a
// particle puzzled at a saddle finds the way down, ESC the steps since it arrived there (SAD0); EPX EPY SAM's perturbation
const BNC = new Float64Array(CAP), SK = new Float64Array(CAP), PT = new Float64Array(CAP), BULB = new Float64Array(CAP), SAD0 = new Int32Array(CAP), ESC = new Int32Array(CAP);
const EPX = new Float32Array(CAP), EPY = new Float32Array(CAP), FIGV = new Uint8Array(CAP), PUFFS = [];
// catapults (CWF: this flight is one; LREF the loss it had come down to), naps on a plateau (PLT0 when it got there, WK
// when it woke), divergence (GC the run of steps each longer than the last, LSL the last step's length)
const CWF = new Uint8Array(CAP), LREF = new Float64Array(CAP), PLT0 = new Int32Array(CAP), WK = new Float64Array(CAP), GC = new Uint8Array(CAP), LSL = new Float32Array(CAP), POPS = [];
const NAP = 150, POP_MS = 800;
let NANSEEN = 0;
const PUFF_MS = 650, BULB_MS = 1300;
function puff(x, y, k) { if (REDUCED) return; PUFFS.push({ x, y, k, t0: NOWMS }); if (PUFFS.length > 80) PUFFS.shift(); }
function drawPuff(g, sx, sy, hp, pf, a) {      // a little cloud of dust, kicked up by a bounce or a skid
  const u = (NOWMS - pf.t0) / PUFF_MS; if (u < 0 || u >= 1) return;
  g.fillStyle = DUSKV > 0.5 ? 'rgb(150,146,138)' : 'rgb(170,162,148)';
  for (let q = 0; q < 3; q++) {
    const ox = (q - 1) * hp * (0.09 + 0.12 * u), oy = -hp * (0.03 + 0.1 * u * (q === 1 ? 1.3 : 0.8)), r = hp * (0.045 + 0.06 * u) * (q === 1 ? 1.2 : 1);
    g.globalAlpha = a * 0.5 * (1 - u) * (1 - u); g.beginPath(); g.arc(sx + ox, sy + oy, r, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
}
function drawBang(g, x, y, hp, u, a, lw) {    // the moment a puzzled particle finds the way down
  const fs = clamp(hp * 0.46, 10, 28) * (1 + 0.35 * (1 - Math.min(1, u * 4)) ** 2);
  g.globalAlpha = a * (1 - smoothstep(0.75, 1, u)); g.font = `italic 600 ${fs}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = 'rgba(236,238,232,0.9)'; g.lineWidth = lw; g.strokeText('!', x, y); g.fillStyle = INK; g.fillText('!', x, y);
  g.strokeStyle = INK; g.lineWidth = Math.max(1, fs * 0.06); g.beginPath();
  for (const ra of [-2.4, -1.57, -0.74]) { const r0 = fs * 0.62, r1 = fs * (0.8 + 0.12 * Math.min(1, u * 5)); g.moveTo(x + r0 * Math.cos(ra), y + r0 * Math.sin(ra)); g.lineTo(x + r1 * Math.cos(ra), y + r1 * Math.sin(ra)); }
  g.stroke(); g.globalAlpha = 1;
}
function popAt(i) { if (REDUCED) return; POPS.push({ x: clamp(Px[i], X0, X1), y: clamp(Py[i], Y0, Y1), rgb: [CRr[i], CGg[i], CBb[i]], t0: NOWMS, s: SER[i] }); if (POPS.length > 24) POPS.shift(); }
function drawPop(g, sx, sy, hp, pp, a) {     // a particle that diverged bursts into ink, and its hat flies off
  const u = (NOWMS - pp.t0) / POP_MS; if (u < 0 || u >= 1) return;
  const col = hex3(pp.rgb[0], pp.rgb[1], pp.rgb[2]), cy = sy - hp * 0.5;
  g.fillStyle = col;
  g.globalAlpha = a * 0.45 * (1 - u) ** 2; g.beginPath(); g.arc(sx, cy, hp * (0.12 + 0.3 * u), 0, TAU); g.fill();
  for (let k = 0; k < 9; k++) {
    const an = k / 9 * TAU + pp.s, r = hp * (0.1 + 0.75 * u) * (0.7 + 0.3 * Math.sin(k * 7.1 + pp.s));
    g.globalAlpha = a * (1 - u); g.beginPath(); g.arc(sx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.8 + hp * 0.7 * u * u, hp * 0.045 * (1 - 0.5 * u), 0, TAU); g.fill();
  }
  g.save(); g.translate(sx + hp * 0.35 * u, sy - hp * (1 + 1.3 * u - 1.4 * u * u)); g.rotate(u * 7); g.globalAlpha = a * (1 - smoothstep(0.7, 1, u));
  g.fillStyle = col; g.strokeStyle = INK; g.lineWidth = Math.max(1, hp * 0.025);
  g.beginPath(); g.ellipse(0, 0, hp * 0.17, hp * 0.035, 0, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.arc(0, -hp * 0.02, hp * 0.09, Math.PI, TAU); g.fill(); g.stroke();
  g.restore();
  if (u < 0.45) { g.globalAlpha = a * (1 - u / 0.45); g.font = `italic 500 ${clamp(hp * 0.32, 9, 22)}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText('pop', sx - hp * 0.45, cy - hp * 0.45 - hp * 0.2 * u); }
  g.globalAlpha = 1;
}
function drawZ(g, x, y, hp, tt, a) {          // asleep on its feet
  const fs = clamp(hp * 0.3, 8, 20); g.font = `italic 400 ${fs}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK;
  for (let q = 0; q < 2; q++) { const u = ((tt * 0.45 + q / 2) % 1 + 1) % 1; g.globalAlpha = a * Math.sin(Math.PI * u) * 0.85; g.fillText('z', x + hp * 0.3 * u, y - hp * 0.45 * u); }
  g.globalAlpha = 1;
}
function samAim(i, face) {      // the spyglass's angle in the figure's frame, towards θ + ρĝ where SAM looks for the worst loss nearby
  const r = SIM.rho || 0.05, x = Wx[i], y = Wy[i], x1 = x + r * EPX[i], y1 = y + r * EPY[i], M = VP;
  const z0 = hgrid(x, y) * ZS, z1 = hgrid(x1, y1) * ZS;
  const w0 = M[3] * x + M[7] * y + M[11] * z0 + M[15], w1 = M[3] * x1 + M[7] * y1 + M[11] * z1 + M[15];
  if (w0 < 1e-4 || w1 < 1e-4) return 0;
  const sx = ((M[0] * x1 + M[4] * y1 + M[8] * z1 + M[12]) / w1 - (M[0] * x + M[4] * y + M[8] * z0 + M[12]) / w0) * aspect;
  const sy = (M[1] * x1 + M[5] * y1 + M[9] * z1 + M[13]) / w1 - (M[1] * x + M[5] * y + M[9] * z0 + M[13]) / w0;
  let a = Math.atan2(sy, sx * face);
  if (Math.cos(a) >= 0) return clamp(a, -0.5, 1.2);
  let b = Math.PI - a; if (b > Math.PI) b -= TAU;
  return Math.PI - clamp(b, -0.5, 1.2);
}
const FX0 = new Float32Array(CAP), FY0 = new Float32Array(CAP), FZ0 = new Float32Array(CAP), FX1 = new Float32Array(CAP), FY1 = new Float32Array(CAP), FZ1 = new Float32Array(CAP);
const FLIGHT_MS = 650, LEAVE_MS = 1700, LEAVERS = [];
let SERIAL = 0, NOWMS = 0, HOVER = -1;
function propOf(T) {             // what each optimizer carries: 0 staff, 1 heavy ball, 2 surveyor's rod, 3 lantern, 4 spyglass, 5 flag
  if (T.prop == null) {
    const k = T.kind;
    T.prop = k === K_HB || k === K_NAG ? 1 : k === K_ADAM || k === K_RMS ? 2 : k === K_NEWTON || k === K_SFN ? 3 : k === K_SAM ? 4 : k === K_SIGN || k === K_LION ? 5 : 0;
  }
  return T.prop;
}
function leaver(i) {             // a particle that left the sheet stands at the edge a moment and waves
  LEAVERS.push({ x: clamp(Px[i], X0 + 0.015, X1 - 0.015), y: clamp(Py[i], Y0 + 0.015, Y1 - 0.015), rgb: [CRr[i], CGg[i], CBb[i]], prop: propOf(TRIBES[Tr[i]]), face: GF[i], t0: NOWMS });
  if (LEAVERS.length > 24) LEAVERS.shift();
}
function gaitStep(i, dx, dy, n1, n2) {
  const sl = Math.hypot(dx, dy), sps = Math.max(1, F.params.speed * (PL.speed || 1));
  GS[i] += (sl - GS[i]) * 0.15;
  const c = sl > 1e-12 && (Hx[i] || Hy[i]) ? (dx * Hx[i] + dy * Hy[i]) / sl : 1;
  GT[i] += ((1 - c) / 2 - GT[i]) * 0.2;
  if (sl > 0.12 * PIL_H && c < -0.5 && NOWMS - BNC[i] > 300) { BNC[i] = NOWMS; if (FIGV[i]) puff(Px[i], Py[i], 0); }   // its step reversed: off a wall
  GC[i] = sl > 1.001 * LSL[i] && sl > 0.2 * PIL_H ? Math.min(GC[i] + 1, 250) : 0;      // an unbroken run of ever longer steps: diverging
  LSL[i] = sl;
  if (!(LREF[i] <= Wl[i])) LREF[i] = Wl[i]; else LREF[i] += (Wl[i] - LREF[i]) * 0.01;            // the loss it had come down to, slowly forgotten
  const kd = TRIBES[Tr[i]].kind;
  if ((kd === K_HB || kd === K_NAG) && sl > 0.15 * PIL_H) {          // momentum carrying it uphill, past the bottom
    const gg = Math.hypot(gX, gY);
    if (gg > 0.05 && (dx * gX + dy * gY) / (sl * gg) > 0.4) { SK[i] = NOWMS; if (FIGV[i] && NOWMS - PT[i] > 140) { PT[i] = NOWMS; puff(Wx[i], Wy[i], 1); } }
  }
  const nn = Math.hypot(n1, n2);
  GN[i] += (nn / (nn + Math.hypot(gX, gY) + 1e-12) - GN[i]) * 0.1;
  GP[i] += Math.min(TAU * sl / PIL_H, TAU * 2.4 / sps);          // at most 2.4 strides a second, however fast the sheet runs
  const jmp = !REDUCED && sl > (PL.jump ? 0.05 : 0.16), air = FT[i] && NOWMS - FT[i] < FLIGHT_MS;
  let cat = false;
  if (jmp && kd === K_SGD && Wl[i] > LREF[i] * 1.3 + 1e-3) {      // a catapult (gradient descent only): its loss spiked because ηλ > 2
    const TT = TRIBES[Tr[i]], et = TT.absEta ? EtaW[i] : SIM.lr * TT.etaMul * EtaW[i];   // where it was, and it lands where ηλ < 2
    cat = et * lamMax(Px[i], Py[i]) > 2 && et * lamMax(Wx[i], Wy[i]) < 2;
  }
  if (air && !(cat && !CWF[i])) { FX1[i] = Wx[i]; FY1[i] = Wy[i]; FZ1[i] = hgrid(Wx[i], Wy[i]); }   // still in the air: land where it is now
  else if (jmp) {
    if (air) {                                                    // thrown again in mid-air: from where it is now
      const u = (NOWMS - FT[i]) / FLIGHT_MS, d = Math.hypot(FX1[i] - FX0[i], FY1[i] - FY0[i]);
      FX0[i] += (FX1[i] - FX0[i]) * u; FY0[i] += (FY1[i] - FY0[i]) * u; FZ0[i] += (FZ1[i] - FZ0[i]) * u + 4 * u * (1 - u) * (0.12 + 1.1 * d);
    } else { FX0[i] = Px[i]; FY0[i] = Py[i]; FZ0[i] = hgrid(Px[i], Py[i]); }
    FT[i] = NOWMS; FX1[i] = Wx[i]; FY1[i] = Wy[i]; FZ1[i] = hgrid(Wx[i], Wy[i]); CWF[i] = cat ? 1 : 0;
  } else if (FT[i]) FT[i] = 0;
  if ((Age[i] + i) % 10 === 0) {
    const g = Math.hypot(gX, gY); let em = 0;
    if (g < 0.2) {
      hess(Wx[i], Wy[i]);
      const e = eig2(), lm = Math.max(Math.abs(e[0]), Math.abs(e[1]), 1e-6);
      if (e[0] < -0.2 && g < 0.15) em = 1;                 // a saddle: the slope is gone and one direction curves down
      else if (g < 0.08 && g / lm > 0.12) em = 2;          // a plateau: the slope is gone and nothing curves; a minimum is still far off
    }
    if (em === 1 && EM[i] !== 1) SAD0[i] = Age[i];
    else if (EM[i] === 1 && em === 0 && g >= 0.15 && Age[i] - SAD0[i] >= 20 && NOWMS - BULB[i] > 4000) { BULB[i] = NOWMS; ESC[i] = Age[i] - SAD0[i]; }   // it found the way down
    if (em === 2 && EM[i] !== 2) PLT0[i] = Age[i];
    else if (EM[i] === 2 && em !== 2 && Age[i] - PLT0[i] >= NAP) WK[i] = NOWMS;             // it woke: the slope is back
    EM[i] = em;
  }
}
function packGait(o, i) {
  const T = TRIBES[Tr[i]], k = T.kind, sps = Math.max(1, F.params.speed * (PL.speed || 1)), v = GS[i] * sps / PIL_H;   // body heights per second
  const ex = Fx[i] - Ex[i], ey = Fy[i] - Ey[i], el = Math.hypot(ex, ey);
  if (el > 1e-6) { const f = (ex * CR[0] + ey * CR[1]) / el; if (f > 0.25) GF[i] = 1; else if (f < -0.25) GF[i] = -1; }
  const march = k === K_SIGN || k === K_LION ? 1 : 0;
  const amp = march ? 0.42 * smoothstep(0.1, 0.6, v) : 0.42 * smoothstep(0.1, 1.2, v) + 0.22 * smoothstep(3, 9, v);
  GAITB[o] = GP[i]; GAITB[o + 1] = amp; GAITB[o + 2] = 0.3 * smoothstep(3, 10, v);
  GAITB[o + 3] = 0.3 * smoothstep(0.35, 0.85, GN[i]) * Math.sin(GP[i] * 1.3 + i);
  GAITB[o + 4] = smoothstep(0.55, 0.85, GT[i]) * smoothstep(0.5, 2.5, v); GAITB[o + 7] = 0;
  GAITB[o + 8] = GF[i]; GAITB[o + 9] = propOf(T);
  const fly = FT[i] && NOWMS - FT[i] < FLIGHT_MS;
  GAITB[o + 5] = T.prop === 4 ? samAim(i, GF[i]) : 0;                                                                     // spyglass
  GAITB[o + 6] = fly && CWF[i] ? (NOWMS - FT[i]) / FLIGHT_MS : REDUCED ? 0 : Math.max(0, 1 - (NOWMS - BNC[i]) / 220);   // cartwheel, or squash
  GAITB[o + 10] = fly ? (CWF[i] ? 7 : 3) : SK[i] && NOWMS - SK[i] < 260 ? 5 : WK[i] && NOWMS - WK[i] < 700 ? 8 : EM[i] === 2 && Age[i] - PLT0[i] >= NAP ? 6 : EM[i];
  GAITB[o + 11] = FOL.on && FOL.i === i ? 2 : HOVER === i || RHOVER === i ? 1 : 0;
}
let CAMPS = [], campT = 0;
function updateCamps(now) {      // particles that came to rest, gathered within a few stick man heights of each other
  if (now - campT < 600) return;
  campT = now;
  const out = [], R = 2.2 * PIL_H, rest = STAT.rest;
  for (let j = 0; j < rest.length; j++) {
    const [t, , x, y] = rest[j];
    let c = null; for (const q of out) if (Math.hypot(q.x - x, q.y - y) < R) { c = q; break; }
    if (!c) { c = { x, y, n: 0, sx: 0, sy: 0, by: new Map(), last: -1 }; out.push(c); }
    c.n++; c.sx += x; c.sy += y; c.by.set(t, (c.by.get(t) || 0) + 1); c.last = j;
  }
  for (const c of out) { c.x = c.sx / c.n; c.y = c.sy / c.n; let bn = -1; for (const [t, k] of c.by) if (k > bn) { bn = k; c.tribe = t; } }
  const prev = CAMPS;
  CAMPS = out.filter((c) => c.n >= 2);
  for (const c of CAMPS) settle(c, prev);
}
// how a camp settles in: by the curvature there against the step size, ηλ/2 (1 is the edge of stability): hunched
// round the fire above 0.3, lying back below 0.03, sitting in between. Up to three campers, one per optimizer present
// first; each newcomer is greeted, with a wave from its own optimizer and a raised hat from the others
function settle(c, prev) {
  hess(c.x, c.y); const e = eig2(), T = TRIBES[c.tribe], eta = T ? (T.absEta ? SIM.lr : SIM.lr * T.etaMul) : SIM.lr;
  c.s = eta * Math.max(Math.abs(e[0]), Math.abs(e[1])) / 2;
  c.pose = c.s > 0.3 ? 2 : c.s < 0.03 ? 0 : 1;
  const ts = [...c.by.entries()].sort((a, b) => b[1] - a[1]).map((q) => q[0]);
  c.who = []; for (let s = 0; s < Math.min(3, c.n); s++) c.who.push(ts[s] != null ? ts[s] : c.tribe);
  c.seed = ((Math.sin(c.x * 127.1 + c.y * 311.7) * 43758.5453) % 1 + 1) % 1;
  let p = null, pd = 2.2 * PIL_H; for (const q of prev) { const d = Math.hypot(q.x - c.x, q.y - c.y); if (d < pd) { pd = d; p = q; } }
  c.greetT = p ? p.greetT : -1e9; c.greetTr = p ? p.greetTr : -1;
  if (p && c.last > p.last) { c.greetT = NOWMS; c.greetTr = STAT.rest[c.last][0]; }
}
// where the campers sit round the fire (which the overlay draws 0.82 stick man heights right of the tent): r along the
// screen's right, f away from the eye, both in stick man heights, and which way each faces; for lying, sitting, standing
const CAMPL = [
  [[1.55, -0.15, 1], [1.0, 0.8, -1], [-0.15, -0.5, -1]],
  [[0.32, -0.2, 1], [1.42, -0.04, -1], [0.85, 0.8, 1]],
  [[0.48, -0.14, 1], [1.16, -0.06, -1], [0.8, 0.36, 1]],
];
const STARL = [1.25, 1.35, -1], CXY = [0, 0];
function campXY(cx, cy, r, f, out) {
  let rx = CR[0], ry = CR[1]; const rl = Math.hypot(rx, ry) || 1; rx /= rl; ry /= rl;
  let fx = -ry, fy = rx; if (fx * CFW[0] + fy * CFW[1] < 0) { fx = -fx; fy = -fy; }
  out[0] = cx + PIL_H * (r * rx + f * fx); out[1] = cy + PIL_H * (r * ry + f * fy);
}
let walkN = 0;
// everything that stands on the relief is staged, then drawn back to front; where figures crowd one patch of the screen
// the nearest two stay figures and the rest become small dots, so a busy camp stays legible. The drawn order is kept
// (OI particle, OX OY feet on screen, OH figure height in css px) for picking stick men under the pointer
const NPK = CAP * 2 + 96;
const WALKO = new Float32Array(NPK * 11), GAITO = new Float32Array(NPK * 12);
const PKI = new Int32Array(NPK), PKW = new Float32Array(NPK), PKX = new Float32Array(NPK), PKY = new Float32Array(NPK), PKH = new Float32Array(NPK), THN = new Uint8Array(NPK);
const OI = new Int32Array(NPK), OX = new Float32Array(NPK), OY = new Float32Array(NPK), OH = new Float32Array(NPK), OE = new Uint8Array(NPK), OFg = new Uint8Array(NPK);
const CMPF = new Uint8Array(NPK), CMPX = new Float32Array(NPK), CMPY = new Float32Array(NPK), CMPR = new Float32Array(NPK), CMPV = new Float32Array(NPK);   // campers: their camp and spot
const ORD = [], CELLN = new Int32Array(8192), CELLS = new Int32Array(8192);
let ORDN = 0, cellStamp = 0, STAGEN = 0;
function stagePut(n, x, y, size, style, lift, rgb, wi) {
  const o = n * 11;
  WALKB[o] = x; WALKB[o + 1] = y; WALKB[o + 2] = size; WALKB[o + 3] = style; WALKB[o + 4] = 0; WALKB[o + 5] = 0; WALKB[o + 6] = 1; WALKB[o + 7] = lift;
  WALKB[o + 8] = rgb[0]; WALKB[o + 9] = rgb[1]; WALKB[o + 10] = rgb[2];
  PKI[n] = wi; CMPF[n] = 0;
}
const RGBW = [0, 0, 0];
function packWalkers(a) {
  let n = 0;
  for (const cp of CAMPS.slice(0, 32)) {
    const T = TRIBES[cp.tribe];
    stagePut(n, cp.x, cp.y, 0, 0, 0, T ? T.rgb : [0.2, 0.2, 0.2], -1);
    GAITB.fill(0, n * 12, n * 12 + 12); GAITB[n * 12 + 7] = 2; GAITB[n * 12 + 8] = 1;
    n++;
  }
  FIGV.fill(0, 0, hiW);
  const tt = REDUCED ? 0 : (NOWMS / 1000) % 1000;
  for (const cp of CAMPS.slice(0, 32)) {       // its campers round the fire
    if (!cp.who) continue;
    const lay = CAMPL[cp.pose], gu = (NOWMS - cp.greetT) / 1600;
    for (let s = 0; s < cp.who.length; s++) {
      const tr = cp.who[s], T = TRIBES[tr]; if (!T) continue;
      let pose = cp.pose, act = 0;
      if (pose === 1) act = s === 1 ? 1 : s === 2 ? (Math.floor(tt / 20 + cp.seed * 2) & 1 ? 1 : 3) : 0;
      if (pose === 0) act = DUSKV > 0.5 ? (s === 1 ? 0 : 1) : s === 0 ? 2 : 0;
      if (pose === 1 && s === 2 && DUSKV > 0.5) { pose = 0; act = 1; }
      const L = pose === cp.pose ? lay[s] : STARL;             // a stargazer lies back, clear of the others
      campXY(cp.x, cp.y, L[0], L[1], CXY);
      stagePut(n, CXY[0], CXY[1], 0, 0, 0, T.rgb, -1); CMPF[n] = 1; CMPX[n] = cp.x; CMPY[n] = cp.y; CMPR[n] = L[0]; CMPV[n] = L[1];
      const g = n * 12; GAITB.fill(0, g, g + 12);
      GAITB[g] = tt + s * 3.7 + cp.seed * 50; GAITB[g + 1] = pose; GAITB[g + 2] = act; GAITB[g + 3] = (cp.seed + s * 0.37) % 1;
      if (gu >= 0 && gu < 1) { GAITB[g + 4] = tr === cp.greetTr ? 1 : 2; GAITB[g + 5] = gu; }
      GAITB[g + 6] = (tt / 40 + cp.seed + s * 0.3) % 1; GAITB[g + 7] = 3; GAITB[g + 8] = L[2]; GAITB[g + 9] = propOf(T);
      n++;
    }
  }
  for (let q = LEAVERS.length - 1; q >= 0; q--) {
    const lv = LEAVERS[q], u = (NOWMS - lv.t0) / LEAVE_MS;
    if (u >= 1 || u < 0) { LEAVERS.splice(q, 1); continue; }
    stagePut(n, lv.x, lv.y, 6.6, 0, 0, lv.rgb, -1); WALKB[n * 11 + 6] = 1 - smoothstep(0.7, 1, u);
    const g = n * 12; GAITB.fill(0, g, g + 12); GAITB[g] = (NOWMS - lv.t0) * 0.012; GAITB[g + 8] = lv.face; GAITB[g + 9] = lv.prop; GAITB[g + 10] = 4;
    n++;
  }
  for (let i = 0; i < hiW; i++) {
    if (!Alive[i]) continue;
    let x = Px[i] + (Wx[i] - Px[i]) * a, y = Py[i] + (Wy[i] - Py[i]) * a, lift = 0;
    if (FT[i]) {                 // in flight along a parabola from where it was thrown to where it lands
      const u = (NOWMS - FT[i]) / FLIGHT_MS;
      if (u < 1) {
        x = FX0[i] + (FX1[i] - FX0[i]) * u; y = FY0[i] + (FY1[i] - FY0[i]) * u;
        const d = Math.hypot(FX1[i] - FX0[i], FY1[i] - FY0[i]), z = FZ0[i] + (FZ1[i] - FZ0[i]) * u + 4 * u * (1 - u) * (0.12 + 1.1 * d);
        lift = Math.max(0, z - hgrid(x, y));
      }
    }
    RGBW[0] = CRr[i]; RGBW[1] = CGg[i]; RGBW[2] = CBb[i];
    packGait(n * 12, i);
    stagePut(n, x, y, FOL.on && i === FOL.i ? 10 : 6.6, 0, lift, RGBW, i);
    WALKB[n * 11 + 4] = Hx[i]; WALKB[n * 11 + 5] = Hy[i];
    n++;
    const T = TRIBES[Tr[i]];
    if (T.avg && An[i] > 0) {
      packGait(n * 12, i); GAITB[n * 12 + 7] = 1;
      stagePut(n, Ax[i], Ay[i], 6, 1, 0, RGBW, i);
      n++;
    }
  }
  STAGEN = n;
  // depth and screen position of each; sort near to far, thin crowds from the front, then write far to near
  const pxW = 0.5 * F.cssHeight / Math.tan(FOV / 2);
  for (let k = 0; k < n; k++) {
    const o = k * 11, x = WALKB[o], y = WALKB[o + 1];
    project(VP, x, y, (hgrid(x, y) + WALKB[o + 7]) * ZS, P0);
    PKX[k] = P0[0]; PKY[k] = P0[1]; PKW[k] = P0[2]; PKH[k] = P0[2] > 1e-4 ? PIL_H * pxW / P0[2] : 0; THN[k] = 0;
  }
  ORD.length = n; for (let k = 0; k < n; k++) ORD[k] = k;
  ORD.sort((p, q) => PKW[p] - PKW[q]);
  cellStamp++;
  for (const k of ORD) {
    if (PKH[k] < 9 || GAITB[k * 12 + 7] > 1.5 || PKW[k] <= 0) continue;
    const hp = PKH[k], cx = Math.floor(PKX[k] / (hp * 0.5)), cy = Math.floor(PKY[k] / (hp * 0.8)), h = ((cx * 73856093) ^ (cy * 19349663)) & 8191;
    if (CELLS[h] !== cellStamp) { CELLS[h] = cellStamp; CELLN[h] = 0; }
    if (CELLN[h] >= 2 && PKI[k] !== FOL.i) THN[k] = 1; else CELLN[h]++;
  }
  let m = 0;
  for (let j = n - 1; j >= 0; j--, m++) {
    const k = ORD[j];
    WALKO.set(WALKB.subarray(k * 11, k * 11 + 11), m * 11); GAITO.set(GAITB.subarray(k * 12, k * 12 + 12), m * 12);
    if (THN[k]) { GAITO[m * 12 + 7] = -1; WALKO[m * 11 + 2] = 4.2; WALKO[m * 11 + 6] *= 0.6; }
    OI[m] = PKI[k]; OX[m] = PKX[k]; OY[m] = PKY[k]; OH[m] = PKH[k]; OE[m] = GAITB[k * 12 + 10];
    OFg[m] = PKH[k] >= 9 && !THN[k] && GAITB[k * 12 + 7] > -0.5 && GAITB[k * 12 + 7] < 1.5 ? 1 : 0;
    if (OFg[m] && PKI[k] >= 0) FIGV[PKI[k]] = 1;
  }
  ORDN = m;
  if (PL.markers) m = PL.markers(WALKO, m);
  for (let q = ORDN; q < m; q++) { GAITO.fill(0, q * 12, q * 12 + 12); GAITO[q * 12 + 7] = -1; GAITO[q * 12 + 8] = 1; }
  walkN = m;
}
// the stick man under a css pixel, nearest first (an index into the drawn order), or −1
function pilgrimAt(px, py) {
  for (let m = ORDN - 1; m >= 0; m--) {
    if (!OFg[m] || OI[m] < 0 || !Alive[OI[m]]) continue;
    const hp = OH[m], dx = px - OX[m], dy = py - OY[m];
    if (Math.abs(dx) < hp * 0.34 && dy < hp * 0.12 && dy > -hp * 1.2) return m;
  }
  return -1;
}
function render(printA, vp) {    // vp: a small view in the lower-left corner of the buffer {w, h, pxW, dpr}, or the screen
  if (vp) { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, vp.w, vp.h); gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, vp.w, vp.h); }
  else GL.screen(gl);
  for (let k = 0; k < 3; k++) FOGC[k] = BG[k] + (NIGHT[k] - BG[k]) * DUSKV;
  gl.clearColor(FOGC[0], FOGC[1], FOGC[2], 1); gl.clearDepth(1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.disable(gl.BLEND);
  if (inkMipDirty && F.frame % 3 === 0) { gl.bindTexture(gl.TEXTURE_2D, inkTex); gl.generateMipmap(gl.TEXTURE_2D); inkMipDirty = false; }
  VIEW[0] = vp ? vp.w : F.width; VIEW[1] = vp ? vp.h : F.height;
  const dpr = vp ? vp.dpr : F.dpr, span = Math.max(1e-6, HMAX - HMIN), pxW = vp ? vp.pxW : 0.5 * F.cssHeight / Math.tan(FOV / 2);
  lampUniforms(U_F); lampUniforms(U_W); lampUniforms(U_T);
  if (vp) for (const U of [U_F, U_W, U_T]) if ('uFog' in U) U.uFog = 0.5;       // a little haze on the distance
  U_F.uPrint = printA; P_FLAT.set(U_F); gl.bindVertexArray(flatVAO);
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(2, 4);      // the sheet sits a hair behind the relief, which lies on it when flat
  gl.drawArrays(gl.TRIANGLES, 0, flatCount);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  terrU(U_W); terrU(U_T); terrU(U_K); terrU(U_R); U_T.uWalk = vp ? 1 : FOGV;
  U_W.uZs = ZS; U_W.uIv = F.params.interval; U_W.uHmin = HMIN; U_W.uSpan = span; U_W.uDpr = dpr; U_W.uPrint = printA;
  P_WALL.set(U_W); gl.bindVertexArray(wallVAO); gl.drawArrays(gl.TRIANGLES, 0, wallCount);
  U_T.uFlood = SCAF.on && SCAF.flood > -0.5 ? SCAF.flood : -1;
  U_T.uZs = ZS; U_T.uIv = F.params.interval; U_T.uHmin = HMIN; U_T.uSpan = span; U_T.uRelief = F.params.relief; U_T.uDpr = dpr; U_T.uPrint = printA;
  P_TERRAIN.set(U_T); gl.bindVertexArray(meshVAO); gl.drawElements(gl.TRIANGLES, meshCount, gl.UNSIGNED_INT, 0);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  if (PL.mist) drawMist(printA * (1 - TERR));
  if (ribDirty) rebuildLines();
  U_R.uPxW = pxW;
  if (ribN && printA > 0) {
    U_R.uZs = ZS; U_R.uDpr = dpr; P_RIB.set(U_R);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -4);
    gl.bindVertexArray(ribVAO); gl.drawArrays(gl.TRIANGLES, 0, ribN * 6);
    gl.disable(gl.POLYGON_OFFSET_FILL);
  }
  if (FOL.on && trDirty) rebuildTrail();
  if (FOL.on && trN && printA > 0) {
    U_R.uZs = ZS; U_R.uDpr = dpr; P_RIB.set(U_R);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -4);
    gl.bindVertexArray(trVAO); gl.drawArrays(gl.TRIANGLES, 0, trN * 6);
    gl.disable(gl.POLYGON_OFFSET_FILL);
  }
  const wn = vp ? camN : walkN;
  if (wn) {
    gl.bindBuffer(gl.ARRAY_BUFFER, walkBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, vp ? CAMW : WALKO, 0, wn * 11);
    gl.bindBuffer(gl.ARRAY_BUFFER, gaitBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, vp ? CAMG : GAITO, 0, wn * 12);
    U_K.uZs = ZS; U_K.uDpr = dpr; U_K.uDusk = DUSKV; U_K.uPxW = pxW; U_K.uHW = PIL_H;
    P_WALK.set(U_K); gl.bindVertexArray(walkVAO); gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, wn);
  }
  gl.bindVertexArray(null); gl.depthMask(true); gl.disable(gl.BLEND);
  if (vp) gl.disable(gl.SCISSOR_TEST);
}

// ---------------------------------------------------------------------------------------------
// the plate card: entry, figure, controls, references, and the contents of the atlas
// ---------------------------------------------------------------------------------------------
const ICO = {
  up: '<path d="M5 12.5l5-5 5 5"/>', down: '<path d="M5 7.5l5 5 5-5"/>', list: '<path d="M4 5.5h12M4 10h12M4 14.5h12"/>',
  close: '<path d="M6 6l8 8M14 6l-8 8"/>',
  watch: '<path d="M2.4 10.2s2.9-5 7.6-5 7.6 5 7.6 5-2.9 5-7.6 5-7.6-5-7.6-5z"/><circle cx="10" cy="10.2" r="2.4"/>',
  again: '<path d="M15.6 8.4A6 6 0 1 0 15.8 12"/><path d="M15.9 4.4v4.2h-4.2"/>',
  walk: '<path d="M3.5 16c2.6-.4 3.6-3.2 6-4.4s4.6-1.6 6.5-6.1"/><circle cx="10" cy="11.4" r="1.9"/>',
  section: '<path d="M3 14.5l3.4-6.2 3.2 3.6 3.1-5.6 4.3 8.2"/><circle cx="3" cy="14.5" r="1.2"/><circle cx="17" cy="14.5" r="1.2"/>',
  flood: '<path d="M2.5 8.5c1.8-1.5 3.6-1.5 5.4 0s3.6 1.5 5.4 0 3.1-1.3 4.2-.4M2.5 13c1.8-1.5 3.6-1.5 5.4 0s3.6 1.5 5.4 0 3.1-1.3 4.2-.4"/>',
  dusk: '<path d="M14.8 12.6A6.2 6.2 0 0 1 7.4 5.2a6.2 6.2 0 1 0 7.4 7.4z"/>',
  map: '<path d="M2.5 5.2l5-1.7 5 1.7 5-1.7v11.3l-5 1.7-5-1.7-5 1.7z"/><path d="M7.5 3.5v11.3M12.5 5.2v11.3"/>',
};
const svgI = (n) => `<svg viewBox="0 0 20 20" aria-hidden="true">${ICO[n]}</svg>`;
const card = document.createElement('aside');
card.className = 'pl-card'; card.setAttribute('aria-label', 'Plate');
card.innerHTML = `<div class="pl-head"><span class="pl-chap"></span>
  <button class="pl-nav" data-a="prev" title="Previous plate (↑)" aria-label="Previous plate">${svgI('up')}</button>
  <button class="pl-nav" data-a="next" title="Next plate (↓)" aria-label="Next plate">${svgI('down')}</button>
  <button class="pl-nav" data-a="toc" title="Contents" aria-label="Contents" aria-pressed="false">${svgI('list')}</button>
  <button class="pl-nav" data-a="hide" title="Hide the plate card (E)" aria-label="Hide the plate card">${svgI('close')}</button></div>
  <div class="pl-scroll"><div class="pl-entry"></div><div class="pl-toc"></div><div class="pl-watch" aria-label="Stick men up close"></div></div>`;
const TOOLS = [['walk', 'Walk', 'W', 'Walk with a stick man; click again to leave'], ['section', 'Section', 'X', 'Cross-section: click two points on the relief'],
  ['flood', 'Flood', 'D', 'Flood the sheet and raise its disconnectivity scaffold'], ['map', 'Plan', 'T', 'Plan view, straight down'],
  ['dusk', 'Dusk', 'N', 'Dusk: the stick men light their lanterns'], ['watch', 'Watch', 'O', 'Watch a few stick men up close']];
const tools = document.createElement('div');
tools.className = 'pl-tools'; tools.setAttribute('role', 'toolbar'); tools.setAttribute('aria-label', 'Tools');
tools.innerHTML = TOOLS.map(([a, name, key, title]) => `<button class="pl-tool" type="button" data-a="${a}" aria-pressed="false" title="${title} (${key})">${svgI(a)}<span>${name}</span><kbd>${key}</kbd></button>`).join('');
function placeTools() {          // along the bottom of the screen, or at the top of the card on a phone
  const inCard = F.cssWidth < 700;
  if (inCard && tools.parentNode !== card) card.querySelector('.pl-head').after(tools);
  else if (!inCard && tools.parentNode !== document.body) document.body.appendChild(tools);
  tools.classList.toggle('pl-tools-card', inCard);
}
const tab = document.createElement('button');
tab.className = 'pl-tab'; tab.type = 'button';
document.body.append(card, tab);
const walkBtn = tools.querySelector('[data-a="walk"]');
const cardEntry = card.querySelector('.pl-entry'), cardToc = card.querySelector('.pl-toc'), cardChap = card.querySelector('.pl-chap'), cardScroll = card.querySelector('.pl-scroll');
let cardShut = innerWidth < 700, figCv = null, figCtx = null;
// modes: walk, cross-section, plan view and flood each show a chip at the top that names the mode, says what to
// do next and how to leave. Esc leaves the first chip's mode (unless a panel or the contents list is open)
const modesEl = document.createElement('div');
modesEl.className = 'pl-modes'; modesEl.setAttribute('aria-live', 'polite');
document.body.appendChild(modesEl);
let modesSig = '';
const NIGHT = [0.085, 0.095, 0.13];
let DUSK = false, DUSKV = 0, duskSave = null;
function toggleDusk(v) {         // the lamp drops low and warm, the room goes dark, stick men light lanterns, the inks glow
  DUSK = v != null ? v : !DUSK;
  if (F.params.dusk !== DUSK) F.setParam('dusk', DUSK, true);
  if (DUSK) { duskSave = { lamp: F.params.lamp, az: F.params.lampAz, el: F.params.lampEl }; F.setParam('lamp', true, true); F.setParam('lampAz', 248, true); F.setParam('lampEl', 16, true); }
  else if (duskSave) { F.setParam('lamp', duskSave.lamp, true); F.setParam('lampAz', duskSave.az, true); F.setParam('lampEl', duskSave.el, true); duskSave = null; }
  setLamp(); aoDirty = true;
  F.setTone(DUSK ? 'dark' : 'light');
}
function activeModes() {
  const m = [];
  if (SECT.on) m.push(['section', 'Cross-section', !SECT.a ? 'click the first point' : !SECT.b ? 'click the second point' : 'click to start another', 'Done', 'X']);
  if (FOL.on) m.push(['walk', `Walking with No. ${SER[FOL.i] || ''} · ${TRIBES[FOL.tribe] ? TRIBES[FOL.tribe].name : 'a stick man'}`, 'W next optimizer · click a stick man to join it · drag to look round', 'Leave', 'V']);
  if (DUSK) m.push(['dusk', 'Dusk', 'the stick men carry lanterns and the inks glow', 'Daylight', 'N']);
  if (planOn) m.push(['plan', 'Plan view', 'the sheet seen straight down', 'Back to relief', 'T']);
  if (SCAF.on) m.push(['flood', 'Flood scaffold', 'basins fill and join at their passes', 'Remove', 'D']);
  return m;
}
function leaveMode(k) {
  if (k === 'section') toggleSection(false);
  else if (k === 'walk') resetView(true);
  else if (k === 'plan') planView();
  else if (k === 'flood') toggleScaffold(false);
  else if (k === 'dusk') toggleDusk(false);
}
function modesUpdate() {
  const m = activeModes(), sig = m.map((r) => r.join('|')).join('/');
  if (sig === modesSig) return;
  modesSig = sig;
  modesEl.innerHTML = m.map(([k, name, help, leave, key], i) => `<div class="pl-mode"><b>${name}</b><span class="pl-mode-help">${help}</span>` +
    `<button type="button" data-leave="${k}" aria-label="${leave}: ${name}">${leave}<kbd>${i === 0 ? 'Esc' : key}</kbd></button></div>`).join('');
  document.body.classList.toggle('pl-moded', m.length > 0);
  for (const [a, on] of [['walk', FOL.on], ['section', SECT.on], ['flood', SCAF.on], ['map', planOn], ['dusk', DUSK]]) tools.querySelector(`[data-a="${a}"]`).setAttribute('aria-pressed', on ? 'true' : 'false');
}
modesEl.addEventListener('click', (e) => { const b = e.target.closest('[data-leave]'); if (b) leaveMode(b.dataset.leave); });
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (document.querySelector('.hl-panel.hl-open, .hl-capture')) return;               // the frame closes those first
  if (card.classList.contains('pl-toc-open')) { card.classList.remove('pl-toc-open'); card.querySelector('[data-a="toc"]').setAttribute('aria-pressed', 'false'); return; }
  if (card.classList.contains('pl-watch-open')) { toggleWatch(false); return; }
  const m = activeModes();
  if (m.length) { e.preventDefault(); leaveMode(m[0][0]); }
}, true);
function cardOpen() { return !cardShut && !document.body.classList.contains('hl-clean'); }
function layoutCard() {
  placeTools();
  card.classList.toggle('pl-shut', cardShut);
  tab.classList.toggle('pl-show', cardShut);
  tab.textContent = `Plate ${PL.index + 1} ▸`;
  cardW = card.getBoundingClientRect().width || 340; cardH = card.offsetHeight;
  const lb = document.querySelector('.hl-label'); labelB = lb ? lb.offsetTop + lb.offsetHeight : 0;
  updateViewCenter();
}
function toggleCard(v) {
  cardShut = v != null ? !v : !cardShut; layoutCard();
  const c = plateView(); GOAL.dist = c.dist * (GOAL.dist / Math.max(1e-6, fitDistSaved || c.dist)); fitDistSaved = c.dist;
}
let fitDistSaved = 0;
function cardAct(a, b) {
  if (a === 'prev') gotoPlate(PL.index - 1);
  else if (a === 'next') gotoPlate(PL.index + 1);
  else if (a === 'toc') { const open = !card.classList.contains('pl-toc-open'); if (open) toggleWatch(false); card.classList.toggle('pl-toc-open', open); b.setAttribute('aria-pressed', open); if (open) { const on = cardToc.querySelector('.pl-on'); if (on) on.scrollIntoView({ block: 'center' }); } }
  else if (a === 'watch') toggleWatch();
  else if (a === 'hide') toggleCard(false);
  else if (a === 'walk') { if (FOL.on) resetView(true); else walkWith(); }
  else if (a === 'section') toggleSection();
  else if (a === 'flood') toggleScaffold();
  else if (a === 'dusk') toggleDusk();
  else if (a === 'map') planView();
  else if (a === 'plate') { card.classList.remove('pl-toc-open'); card.querySelector('[data-a="toc"]').setAttribute('aria-pressed', 'false'); gotoPlate(+b.dataset.i); }
}
card.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) cardAct(b.dataset.a, b); });
card.addEventListener('click', (e) => { const b = e.target.closest('.pl-run'); if (b) runStep(+b.dataset.r); });
tools.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (!b) return; e.stopPropagation(); cardAct(b.dataset.a, b); });
card.querySelector('.pl-head').addEventListener('click', (e) => { if (innerWidth < 700 && !e.target.closest('[data-a]')) toggleCard(cardShut); });
tab.addEventListener('click', () => toggleCard(true));
// watching: a few stick men seen up close in small live views on the card, each followed by its own camera. A view
// is drawn into a corner of the drawing buffer before the main view and copied out to its canvas; the main view then
// clears the buffer, so it never shows. When its stick man camps or leaves, a view lingers there, then joins another
const WATCHN = PHONE ? 2 : 3, WFOV = 0.95;
const watchEl = card.querySelector('.pl-watch'), watchBtn = tools.querySelector('[data-a="watch"]');
const CAMS = [], ICONS = new Map();
let watchT = 0, RHOVER = -1, MLINK = null;
const hex3 = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');
function watchOpen() { return card.classList.contains('pl-watch-open') && !cardShut && !document.body.classList.contains('hl-clean'); }
function toggleWatch(v) {
  const open = v != null ? v : !card.classList.contains('pl-watch-open');
  if (open && cardShut) toggleCard(true);
  if (open) { card.classList.remove('pl-toc-open'); card.querySelector('[data-a="toc"]').setAttribute('aria-pressed', 'false'); }
  card.classList.toggle('pl-watch-open', open); watchBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
  if (!open) RHOVER = -1;
  if (open) { if (!CAMS.length) buildWatch(); for (const c of CAMS) if (c.i < 0 || !Alive[c.i]) watchPick(c); watchCaptions(); cardScroll.scrollTop = 0; }
}
function pilIcon(prop, col) {    // a small portrait: its hat and what it carries, in its colour
  const key = prop + col;
  if (ICONS.has(key)) return ICONS.get(key);
  const ink = '#24262b', hats = [
    `<path d="M4.4 5.7h9.2" stroke="${col}" stroke-width="1.7"/><rect x="7.2" y="3" width="3.6" height="2.6" rx=".6" fill="${col}"/>`,
    `<path d="M5.4 5.8h7.2" stroke="${col}" stroke-width="1.4"/><path d="M6.3 5.8a2.7 2.7 0 0 1 5.4 0z" fill="${col}"/>`,
    `<path d="M6.2 5.8a2.8 2.8 0 0 1 5.6 0z" fill="${col}"/><path d="M11 5.6l3.2-.5" stroke="${col}" stroke-width="1.3"/>`,
    `<path d="M5.4 5.8h7.2" stroke="${col}" stroke-width="1.3"/><rect x="7" y=".7" width="4" height="5" rx=".5" fill="${col}"/><path d="M7 4.6h4" stroke="#f1f1ea" stroke-width=".8"/>`,
    `<rect x="7.2" y="1.6" width="3.6" height="4.2" rx=".5" fill="${col}"/><path d="M10 5.7l3.2-.3" stroke="${col}" stroke-width="1.2"/>`];
  const staff = `<path d="M13.2 9l1.1 13.4" stroke="${ink}" stroke-width="1"/>`;
  const props = [staff,
    `<circle cx="14.2" cy="20.6" r="2.3" fill="${col}" stroke="${ink}" stroke-width=".9"/>`,
    `<path d="M13.6 7.5v15.6" stroke="${col}" stroke-width="1.7"/><path d="M13.6 7.5v15.6" stroke="#f1f1ea" stroke-width="1.7" stroke-dasharray="1.6 1.6"/>`,
    `<path d="M12.4 14l2.3-2.8" stroke="${ink}" stroke-width="1"/><rect x="13.8" y="11.6" width="2.6" height="3.2" rx=".7" fill="#f4d98a" stroke="${ink}" stroke-width=".8"/>`,
    staff + `<path d="M10.8 7.6l5.6-1" stroke="#b8933f" stroke-width="1.8"/>`,
    staff + `<path d="M13.3 8.6l-4.3 1.3 4.5 1.4z" fill="${col}"/>`];
  const s = `<svg class="ic" viewBox="0 0 18 24" aria-hidden="true"><g fill="none" stroke-linecap="round">` +
    `<path d="M9 10.7V16M9 16l-2.5 6M9 16l2.6 6M9 12.2l-3 3M9 12.2l3.4 1.6" stroke="${ink}" stroke-width="1.1"/>` +
    props[prop] + `<circle cx="9" cy="8" r="2.5" fill="#f1f1ea" stroke="${ink}" stroke-width="1"/>` + hats[prop === 1 ? 1 : prop === 2 ? 2 : prop === 3 ? 3 : prop === 5 ? 4 : 0] + `</g></svg>`;
  ICONS.set(key, s);
  return s;
}
function buildWatch() {
  watchEl.innerHTML = `<p class="pl-watch-intro">A few stick men up close (particles: each is the current iterate θ<sub>t</sub> of its optimizer). Click one to walk with it.</p>` + Array.from({ length: WATCHN }, (_, k) =>
    `<figure class="pl-cam" data-k="${k}"><canvas tabindex="0" aria-label="A stick man seen up close; press Enter to walk with it"></canvas><figcaption><span class="icn"></span>` +
    `<span class="nm"></span><span class="st"></span><button type="button" class="pl-cam-next" data-k="${k}" title="Watch another stick man" aria-label="Watch another stick man">${svgI('again')}</button></figcaption></figure>`).join('');
  CAMS.length = 0;
  watchEl.querySelectorAll('.pl-cam').forEach((el) => {
    const cv = el.querySelector('canvas');
    CAMS.push({ el, cv, ctx: cv.getContext('2d'), icn: el.querySelector('.icn'), nm: el.querySelector('.nm'), st: el.querySelector('.st'),
      i: -1, ser: 0, x: 0, y: 0, yaw: 0, rest: 0, cap: '', cam: { yaw: 0, pitch: 0.27, dist: 0.095, tx: 0, ty: 0, tz: 0 } });
  });
}
function watchPick(c) {          // a stick man on the road somewhere no other view is looking, from an optimizer none is watching, the youngest first
  const tribes = new Set(), taken = new Set(), spots = [];
  for (const d of CAMS) if (d !== c && d.i >= 0) { spots.push(d.x, d.y); if (Alive[d.i] && SER[d.i] === d.ser) { tribes.add(Tr[d.i]); taken.add(d.i); } }
  let best = -1, score = -Infinity;
  for (let i = 0; i < hiW; i++) {
    if (!Alive[i] || Age[i] < 6 || taken.has(i) || (i === c.i && SER[i] === c.ser)) continue;
    let near = 0; for (let q = 0; q < spots.length; q += 2) if (Math.hypot(Fx[i] - spots[q], Fy[i] - spots[q + 1]) < 0.25) near = 1;
    const s = (near ? 0 : 2e6) + (tribes.has(Tr[i]) ? 0 : 1e6) - Age[i];
    if (s > score) { score = s; best = i; }
  }
  c.rest = 0;
  if (best < 0) { if (c.i < 0 || !Alive[c.i]) c.i = -1; return; }
  const i = best, hx = Fx[i] - Ex[i], hy = Fy[i] - Ey[i], T = TRIBES[Tr[i]];
  Object.assign(c, { i, ser: SER[i], x: Fx[i], y: Fy[i], plate: PL.id, icon: pilIcon(propOf(T), hex3(CRr[i], CGg[i], CBb[i])),
    who: `<b>No. ${SER[i]}</b> · ${String(T.name).replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))}` });
  if (Math.hypot(hx, hy) > 1e-5) c.yaw = Math.atan2(hx, hy);
  Object.assign(c.cam, { tx: c.x, ty: c.y, tz: hgrid(c.x, c.y) * ZS, yaw: c.yaw, dist: 0.095, pitch: 0.27 });
}
function watchUpdate(dt, now) {
  if (!watchOpen()) return;
  for (const c of CAMS) {
    if (c.i >= 0 && c.plate !== PL.id) { c.i = -1; watchPick(c); }                // a new plate: new stick men at once
    const i = c.i, ok = i >= 0 && Alive[i] && SER[i] === c.ser;
    if (ok) {
      const k = 1 - Math.exp(-dt * (3 + 30 * Math.hypot(Fx[i] - c.x, Fy[i] - c.y) / 0.13));
      c.x += (Fx[i] - c.x) * k; c.y += (Fy[i] - c.y) * k;
      const hx = Fx[i] - Ex[i], hy = Fy[i] - Ey[i];
      if (Math.hypot(hx, hy) > 2e-4) c.yaw += wrapAngle(Math.atan2(hx, hy) - c.yaw) * (1 - Math.exp(-dt * 0.8));
    } else {
      if (!c.rest) c.rest = now;
      c.yaw += dt * (REDUCED ? 0 : 0.14);                          // a slow turn round where it stopped
      const dup = CAMS.some((d) => d !== c && CAMS.indexOf(d) < CAMS.indexOf(c) && Math.hypot(d.x - c.x, d.y - c.y) < 0.12);   // another view already sits here
      if (i < 0 || dup || now - c.rest > 4000) { watchPick(c); continue; }
    }
    const m = c.cam, kk = 1 - Math.exp(-dt * 4);
    m.tx += (c.x - m.tx) * kk; m.ty += (c.y - m.ty) * kk; m.tz += (hgrid(m.tx, m.ty) * ZS + 0.003 - m.tz) * kk;
    m.yaw += wrapAngle(c.yaw - m.yaw) * kk;
    let p = 0.26;                // keep the eye, and the middle of the sight line, above the ground
    for (let q = 0; q < 24; q++) {
      const cp = Math.cos(p), ex = m.tx - m.dist * Math.sin(m.yaw) * cp, ey = m.ty - m.dist * Math.cos(m.yaw) * cp, ez = m.tz + m.dist * Math.sin(p);
      if (ez > hgrid(ex, ey) * ZS + 0.015 && (ez + m.tz) / 2 > hgrid((ex + m.tx) / 2, (ey + m.ty) / 2) * ZS + 0.006) break;
      p += 0.06;
    }
    m.pitch += (Math.min(p, 1.3) - m.pitch) * kk;
  }
}
function watchCaptions() {
  for (const c of CAMS) {
    const i = c.i, ok = i >= 0 && Alive[i] && SER[i] === c.ser;
    let cap;
    if (i < 0) cap = ['', '<b>Nobody on the road</b>', 'click the relief to release a cohort'];
    else cap = [c.icon, c.who, ok ? moodOf(i, false) : 'come to rest or gone; another along soon'];
    const key = cap.join('|');
    if (key === c.cap) continue;
    c.cap = key; c.icn.innerHTML = cap[0]; c.nm.innerHTML = cap[1]; c.st.textContent = cap[2];
  }
}
const SAVE = { vp: new Float32Array(16), eye: new Float32Array(3), cr: [0, 0, 0], cu: [0, 0, 0], cf: [0, 0, 0] };
const CAMW = new Float32Array((CAP * 2 + 96) * 11), CAMG = new Float32Array((CAP * 2 + 96) * 12), CORD = [], CDIST = new Float32Array(CAP * 2 + 96);
let camN = 0;
function watchRender(printA) {
  if (!watchOpen() || !CAMS.length || (PHONE && F.frame % 2)) return;
  const dpr = Math.min(2, F.dpr);
  SAVE.vp.set(VP); SAVE.eye.set(EYE); for (let k = 0; k < 3; k++) { SAVE.cr[k] = CR[k]; SAVE.cu[k] = CU[k]; SAVE.cf[k] = CFW[k]; }
  const sAspect = aspect, sCx = viewCx, sCy = viewCy;
  for (const c of CAMS) {
    const r = c.cv.getBoundingClientRect(), w = Math.min(F.width, Math.round(r.width * dpr)), h = Math.min(F.height, Math.round(r.height * dpr));
    if (w < 8 || h < 8 || r.bottom < 0 || r.top > innerHeight) continue;          // scrolled out of sight
    if (c.cv.width !== w || c.cv.height !== h) { c.cv.width = w; c.cv.height = h; }
    aspect = w / h; viewCx = 0; viewCy = 0;
    viewProj(c.cam, VP, EYE, CR, CU, CFW, WFOV);
    // everything that stands on the relief, unthinned, drawn far to near from this camera
    camN = STAGEN; CORD.length = camN;
    for (let k = 0; k < camN; k++) if (CMPF[k]) { campXY(CMPX[k], CMPY[k], CMPR[k], CMPV[k], CXY); WALKB[k * 11] = CXY[0]; WALKB[k * 11 + 1] = CXY[1]; }   // round the fire as this camera sees it
    for (let k = 0; k < camN; k++) { CORD[k] = k; const o = k * 11, dx = WALKB[o] - EYE[0], dy = WALKB[o + 1] - EYE[1]; CDIST[k] = dx * dx + dy * dy; }
    CORD.sort((p, q) => CDIST[q] - CDIST[p]);
    const pxW = 0.5 * h / Math.tan(WFOV / 2);                   // device px per world unit at unit distance
    for (let m = 0; m < camN; m++) {
      const k = CORD[m], i = PKI[k], o = m * 12; CAMW.set(WALKB.subarray(k * 11, k * 11 + 11), m * 11); CAMG.set(GAITB.subarray(k * 12, k * 12 + 12), o);
      if (i < 0 || CAMG[o + 7] > 1.5) continue;
      const ex = Fx[i] - Ex[i], ey = Fy[i] - Ey[i], el = Math.hypot(ex, ey);   // which way it faces, and where SAM looks, from this camera
      if (el > 1e-6) { const f = (ex * CR[0] + ey * CR[1]) / el; if (f > 0.25) CAMG[o + 8] = 1; else if (f < -0.25) CAMG[o + 8] = -1; }
      if (CAMG[o + 9] === 4) CAMG[o + 5] = samAim(i, CAMG[o + 8]);
      if (PIL_H * pxW / dpr / Math.sqrt(CDIST[k] + 1e-9) > 12) FIGV[i] = 1;
    }
    render(printA, { w, h, pxW: pxW / dpr, dpr });
    c.ctx.drawImage(F.canvas, 0, F.height - h, w, h, 0, 0, w, h);
    // campfires and a puzzled stick man's question mark, drawn on the copy
    const g = c.ctx, tt = REDUCED ? 0 : performance.now() / 1000, prj = (x, y, z) => {
      const cx = VP[0] * x + VP[4] * y + VP[8] * z + VP[12], cy = VP[1] * x + VP[5] * y + VP[9] * z + VP[13], cw = VP[3] * x + VP[7] * y + VP[11] * z + VP[15];
      return cw > 0.005 ? [(cx / cw * 0.5 + 0.5) * w, (0.5 - cy / cw * 0.5) * h, cw] : null;
    };
    for (const cp of CAMPS) {
      const z0 = hgrid(cp.x, cp.y) * ZS, s = prj(cp.x, cp.y, z0); if (!s) continue;
      const hp = PIL_H * pxW / s[2]; if (hp < 9 * dpr || s[0] < -hp * 2 || s[0] > w + hp * 2 || occluded(cp.x, cp.y, z0 + 0.004)) continue;
      campFire(g, s[0] + hp * 0.82, s[1] + hp * 0.03, hp, cp, 1, tt);
      if (c.rest && c.i >= 0 && Math.hypot(cp.x - c.x, cp.y - c.y) < 3 * PIL_H) {          // its tent: z z drift from the door
        g.font = `italic 400 ${Math.round(hp * 0.3)}px ${SERIF}`; g.textAlign = 'center'; g.fillStyle = INK;
        for (let q = 0; q < 3; q++) { const u = (tt * 0.35 + q / 3) % 1; g.globalAlpha = Math.sin(Math.PI * u) * 0.8; g.fillText('z', s[0] + hp * (0.1 + 0.35 * u), s[1] - hp * (0.55 + 0.6 * u)); }
        g.globalAlpha = 1;
      }
    }
    for (const pf of PUFFS) {
      const s = prj(pf.x, pf.y, hgrid(pf.x, pf.y) * ZS); if (!s) continue;
      const hp = PIL_H * pxW / s[2]; if (hp >= 9 * dpr) drawPuff(g, s[0], s[1], hp, pf, 1);
    }
    for (const pp of POPS) {
      const s = prj(pp.x, pp.y, hgrid(pp.x, pp.y) * ZS); if (!s) continue;
      const hp = PIL_H * pxW / s[2]; if (hp >= 9 * dpr) drawPop(g, s[0], s[1], hp, pp, 1);
    }
    const i = c.i;
    if (i >= 0 && Alive[i] && SER[i] === c.ser && BULB[i] && NOWMS - BULB[i] < BULB_MS) {
      const s = prj(Wx[i], Wy[i], hgrid(Wx[i], Wy[i]) * ZS); if (s) { const hp = PIL_H * pxW / s[2]; drawBang(g, s[0] + hp * 0.14, s[1] - hp * 1.42, hp, (NOWMS - BULB[i]) / BULB_MS, 1, 3 * dpr); }
    }
    if (i >= 0 && Alive[i] && SER[i] === c.ser && EM[i] === 2 && Age[i] - PLT0[i] >= NAP) {
      const s = prj(Wx[i], Wy[i], hgrid(Wx[i], Wy[i]) * ZS); if (s) { const hp = PIL_H * pxW / s[2]; drawZ(g, s[0] + hp * 0.2, s[1] - hp * 1.3, hp, tt, 1); }
    }
    if (i >= 0 && Alive[i] && SER[i] === c.ser && EM[i] === 1) {
      const s = prj(Wx[i], Wy[i], hgrid(Wx[i], Wy[i]) * ZS); if (s) {
        const hp = PIL_H * pxW / s[2];
        g.font = `italic 500 ${Math.round(hp * 0.42)}px ${SERIF}`; g.textAlign = 'center'; g.lineJoin = 'round';
        g.strokeStyle = 'rgba(236,238,232,0.9)'; g.lineWidth = 3 * dpr; g.strokeText('?', s[0] + hp * 0.14, s[1] - hp * 1.38); g.fillStyle = INK; g.fillText('?', s[0] + hp * 0.14, s[1] - hp * 1.38);
      }
    }
  }
  VP.set(SAVE.vp); EYE.set(SAVE.eye); for (let k = 0; k < 3; k++) { CR[k] = SAVE.cr[k]; CU[k] = SAVE.cu[k]; CFW[k] = SAVE.cf[k]; }
  aspect = sAspect; viewCx = sCx; viewCy = sCy;
}
watchEl.addEventListener('click', (e) => {
  const b = e.target.closest('.pl-cam-next'); if (b) { const c = CAMS[+b.dataset.k]; if (c) { watchPick(c); watchCaptions(); } return; }
  const f = e.target.closest('.pl-cam'); if (!f || e.target.tagName !== 'CANVAS') return;
  const c = CAMS[+f.dataset.k]; if (c && c.i >= 0 && Alive[c.i] && SER[c.i] === c.ser) followPilgrim(c.i);
});
watchEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'CANVAS') e.target.click(); });
watchEl.addEventListener('pointermove', (e) => { const f = e.target.closest('.pl-cam'); const c = f ? CAMS[+f.dataset.k] : null; RHOVER = c && c.i >= 0 && Alive[c.i] && SER[c.i] === c.ser ? c.i : -1; });
watchEl.addEventListener('pointerleave', () => { RHOVER = -1; });
function buildToc() {
  let h = '';
  CHAPTERS.forEach((ch, ci) => {
    const ps = PLATES.filter((p) => p.ch === ci); if (!ps.length) return;
    h += `<div class="pl-chh">${ROMAN[ci]} · ${ch}</div>${TEXT.chapterIntros && TEXT.chapterIntros[ci] ? `<p class="pl-chi">${gloss(TEXT.chapterIntros[ci])}</p>` : ''}`;
    for (const p of ps) h += `<button type="button" data-a="plate" data-i="${p.index}"><b>${p.index + 1}</b><span>${p.title}</span></button>`;
  });
  cardToc.innerHTML = h;
}
function ctlHTML(key) {
  const d = typeof key === 'string' ? Object.assign({ key }, SIMKEYS[key]) : key;
  if (d.type === 'button') return `<div class="pl-btns">${d.buttons.map((b, k) => `<button class="hl-pill" type="button" data-b="${k}">${b[0]}</button>`).join('')}</div>`;
  if (d.type === 'toggle') return `<label class="hl-switch"><span>${d.label}</span><input type="checkbox" role="switch" data-k="${d.key}"></label>`;
  if (d.type === 'select') return `<div class="hl-ctl"><label style="font:11px var(--hl-mono)">${d.label}</label><select data-k="${d.key}">${Object.entries(d.options).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>`;
  return `<div class="hl-ctl"><div class="hl-ctl-row"><label>${d.label}</label><span class="hl-val"></span></div><input type="range" data-k="${d.key}" min="${d.scale === 'log' ? 0 : d.min}" max="${d.scale === 'log' ? 1000 : d.max}" step="${d.scale === 'log' ? 1 : (d.step || 'any')}"></div>`;
}
const GLOSS = TEXT.gloss;   // text/glossary.js
const gloss = (h) => (h || '').replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_, t, k) => (k[0] === '@' ? `<span class="pl-g pl-gm" tabindex="0" data-m="${k.slice(1)}">${t}</span>`
  : GLOSS[k] ? `<span class="pl-g" tabindex="0" data-g="${k}">${t}</span>` : t));
function mapTarget(name) {
  for (const m of NAMES.marks) if (m.name === name) return m.p;
  for (const a of NAMES.areas) if ((a.one || (a.lines || []).join(' ')) === name) return a;
  for (const q of NAMES.paths) {      // a path name: the middle of its line
    if (q.text !== name || !q.pts || !q.pts.length) continue;
    const P = q.pts;
    if (typeof P[0] === 'number') { const n = P.length >> 1, a = (n - 1) >> 1, b = n >> 1; return { x: (P[2 * a] + P[2 * b]) / 2, y: (P[2 * a + 1] + P[2 * b + 1]) / 2 }; }
    const m = P[P.length >> 1]; return Array.isArray(m) ? { x: m[0], y: m[1] } : m;
  }
  return null;
}
const tipEl = document.createElement('div'); tipEl.className = 'pl-tip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl);
function tipShow(el) {
  if (el.dataset.m) { MLINK = mapTarget(el.dataset.m); return; }
  const g = GLOSS[el.dataset.g]; if (!g) return;
  tipEl.innerHTML = `<b>${g[0]}</b>${g[1]}`; tipEl.classList.add('on');
  const r = el.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  const x = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8), y = r.top - h - 8 >= 8 ? r.top - h - 8 : r.bottom + 8;
  tipEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}
function tipHide() { tipEl.classList.remove('on'); MLINK = null; }
cardEntry.addEventListener('pointerover', (e) => { const g = e.target.closest('[data-g], [data-m]'); if (g) tipShow(g); });
cardEntry.addEventListener('pointerout', (e) => { const g = e.target.closest('[data-g], [data-m]'); if (g && !g.contains(e.relatedTarget)) tipHide(); });
cardEntry.addEventListener('focusin', (e) => { const g = e.target.closest('[data-g], [data-m]'); if (g) tipShow(g); });
cardEntry.addEventListener('focusout', tipHide);
cardScroll.addEventListener('scroll', tipHide, { passive: true });
// the first plate of a chapter opens with the chapter's introduction
const chapterLead = (p) => (TEXT.chapterIntros && TEXT.chapterIntros[p.ch] && PLATES.find((q) => q.ch === p.ch) === p ? `<p class="pl-chintro">${gloss(TEXT.chapterIntros[p.ch])}</p>` : '');
const OPENSEC = new Set();      // which card sections are open; kept from plate to plate
function renderCard() {
  const p = PL;
  tipHide();
  cardChap.textContent = `${ROMAN[p.ch]} · ${CHAPTERS[p.ch]}`;
  const ctls = (p.ctl || []).map((k) => (typeof k === 'string' ? Object.assign({ key: k }, SIMKEYS[k]) : k));
  const keyRow = TRIBES.map((T) => `<span><i style="background:${T.color}"></i>${T.name}</span>`).join('');
  const refs = (p.refs || []).map((r) => (Array.isArray(r) ? `<p>${r[0]}<span class="pl-rn">${gloss(r[1])}</span></p>` : `<p>${r}</p>`)).join('');
  const fig = `<div class="pl-figwrap"><canvas class="pl-fig"></canvas><div class="pl-key">${keyRow}</div><div class="pl-cap">${gloss(p.cap)}</div></div>
    ${ctls.length ? `<div class="pl-h">Instruments</div><div class="pl-ctls">${ctls.map(ctlHTML).join('')}</div>` : ''}`;
  const sec = (k, t, h) => (h ? `<details class="pl-sec" data-sec="${k}"${OPENSEC.has(k) ? ' open' : ''}><summary>${t}</summary>${k === 'refs' ? `<div class="pl-refs">${h}</div>` : `<div class="pl-body">${gloss(h)}</div>`}</details>` : '');
  // new-style cards: a lead and a Try always visible, the rest in sections; older cards keep text, how and look
  cardEntry.innerHTML = p.lead
    ? `${chapterLead(p)}<div class="pl-noline"><div class="pl-no">Plate ${p.index + 1}</div>${p.status ? `<span class="pl-status" data-s="${p.status}" data-g="st-${p.status}" tabindex="0">${p.status}</span>` : ''}</div>
    <h2 class="pl-title">${p.title}</h2>${p.deck ? `<div class="pl-deck">${gloss(p.deck)}</div>` : ''}
    <div class="pl-body pl-lead">${gloss(p.lead)}</div>${p.take ? `<div class="pl-body pl-take"><div class="pl-h">In practice</div>${gloss(p.take)}</div>` : ''}
    ${fig}${p.try ? `<div class="pl-h">Try</div><div class="pl-body pl-try">${gloss(p.try)}</div>` : ''}
    <div class="pl-secs">${sec('bg', 'Background', p.bg)}${sec('method', 'Method', p.method)}${sec('limits', 'Limits', p.limits)}${sec('refs', 'References', refs)}</div>`
    : `<div class="pl-no">Plate ${p.index + 1}</div><h2 class="pl-title">${p.title}</h2>
    <div class="pl-body">${gloss(p.text)}${p.how ? `<div class="pl-h">How it works</div>${gloss(p.how)}` : ''}${p.look ? `<div class="pl-h">Try</div><p>${gloss(p.look)}</p>` : ''}</div>
    ${fig}
    <div class="pl-h">References</div><div class="pl-refs">${refs}</div>`;
  cardEntry.querySelectorAll('details.pl-sec').forEach((d) => d.addEventListener('toggle', () => { if (d.open) OPENSEC.add(d.dataset.sec); else OPENSEC.delete(d.dataset.sec); }));
  cardEntry.querySelectorAll('.pl-try > ol > li').forEach((li, k) => { if (p.run && p.run[k]) li.insertAdjacentHTML('afterbegin', `<button type="button" class="pl-run" data-r="${k}" title="Set the instruments and release particles for this step">Set up</button>`); });
  figCv = cardEntry.querySelector('.pl-fig'); figCtx = figCv.getContext('2d');
  if (p.figH) figCv.style.height = p.figH + 'px';
  // wire the instruments to SIM
  for (const d of ctls) {
    if (d.type === 'button') { cardEntry.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => d.buttons[+b.dataset.b][1]())); continue; }
    const el = cardEntry.querySelector(`[data-k="${d.key}"]`);
    if (d.type === 'toggle') { el.checked = !!SIM[d.key]; el.addEventListener('change', () => setSim(d.key, el.checked)); continue; }
    if (d.type === 'select') { el.value = SIM[d.key]; el.addEventListener('change', () => setSim(d.key, el.value)); continue; }
    const val = el.parentElement.querySelector('.hl-val'), log = d.scale === 'log';
    const toPos = (v) => (log ? 1000 * Math.log(v / d.min) / Math.log(d.max / d.min) : v), fromPos = (x) => (log ? d.min * Math.pow(d.max / d.min, x / 1000) : x);
    const f = d.f || ((v) => (+v).toFixed(d.step && d.step < 0.01 ? 3 : 2));
    const sync = (v) => { el.value = toPos(v); val.textContent = f(v); const lo = log ? 0 : d.min, hi = log ? 1000 : d.max; el.style.setProperty('--fill', (100 * (toPos(v) - lo) / (hi - lo)).toFixed(2) + '%'); };
    sync(SIM[d.key]);
    el.addEventListener('input', () => { const v = fromPos(parseFloat(el.value)); sync(v); setSim(d.key, v); });
    d.sync = sync;
  }
  p._ctls = ctls;
  cardToc.querySelectorAll('button').forEach((b) => b.classList.toggle('pl-on', +b.dataset.i === p.index));
  cardScroll.scrollTop = 0;
  layoutCard();
}
function setSim(k, v) {
  SIM[k] = v; lastInteract = performance.now();
  if (k === 'lr') printDirty = true;
  if (PL.onSim) PL.onSim(k, v);
  clearTimeout(urlTimer); urlTimer = setTimeout(writeURL, 250);
}
// set an instrument as if its control had been moved
function setCtl(k, v) {
  if (SIM[k] === v) return;
  const d = (PL._ctls || []).find((c) => c.key === k), el = d && cardEntry.querySelector(`[data-k="${k}"]`);
  if (el) { if (d.type === 'toggle') el.checked = !!v; else if (d.type === 'select') el.value = v; else if (d.sync) d.sync(v); }
  setSim(k, v);
}
// the instruments' settings live in the query string, so a link reopens the same experiment
const SIM0 = { lr: 0.004, noise: 0.25, beta: 0.9, beta2: 0.999, rho: 0.05, alpha: 0.1 };
const simFor = (p) => Object.assign({}, SIM0, p.sim);
let urlTimer = 0, URLSTATE = null;
const urlCtls = () => (PL._ctls || []).filter((d) => d.key && d.type !== 'button');
const urlValue = (d, v) => (d.type === 'toggle' ? (v ? '1' : '0') : d.type === 'select' ? String(v) : String(+(+v).toPrecision(4)));
function parseValue(d, s) {
  if (d.type === 'toggle') return s === '1';
  if (d.type === 'select') return Object.prototype.hasOwnProperty.call(d.options, s) ? s : undefined;
  const v = parseFloat(s); return Number.isFinite(v) ? clamp(v, d.min, d.max) : undefined;
}
function writeURL() {
  try {
    const u = new URL(location.href), q = new URLSearchParams({ plate: PL.id }), s0 = simFor(PL);
    if (u.searchParams.get('scaffold') === '1') q.set('scaffold', '1');
    for (const d of urlCtls()) if (SIM[d.key] != null && urlValue(d, SIM[d.key]) !== urlValue(d, s0[d.key])) q.set(d.key, urlValue(d, SIM[d.key]));
    history.replaceState(null, '', u.pathname + '?' + q + '#' + F.seed);
  } catch (_) { /* file:// may refuse */ }
}
function applyURLState() {        // once, after the first plate is built
  const st = URLSTATE; URLSTATE = null;
  for (const [k, v] of st || []) { const d = urlCtls().find((c) => c.key === k), x = d && parseValue(d, v); if (x !== undefined) setCtl(k, x); }
}
// Try steps that can be set up with one click: PL.run[i] is null or a function of the helpers in STEP
const STEP = {
  set: setCtl,
  sim: setSim,
  at(name) { const m = mapTarget(name); if (!m) throw new Error(`no map label '${name}' on ${PL.id}`); return [m.x, m.y]; },
  release(x, y) {
    if (reshapeWait) { reshapeWait.push(() => STEP.release(x, y)); return; }      // a label moves when the terrain is reshaped
    if (typeof x === 'string') [x, y] = STEP.at(x);
    RIPPLES.push([x, y, performance.now()]); if (RIPPLES.length > 6) RIPPLES.shift();
    if (PL.click) PL.click(x, y); else releaseCaravan(x, y);
  },
  clear() { resetWalkers(); clearInk(false); },
};
function runStep(i) {
  const f = PL.run && PL.run[i]; if (!f) return;
  leaveWalk(); if (planOn) planView(); if (SECT.on) toggleSection(false);
  lastInteract = performance.now();
  f(STEP);
  const li = cardEntry.querySelectorAll('.pl-try > ol > li')[i];
  if (li) { li.classList.remove('pl-ran'); void li.offsetWidth; li.classList.add('pl-ran'); }
}
// figures in the card share one small vocabulary: axes, ticks in mono, curves in the optimizer inks
const FIG = {
  begin(c, w, h) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, figCv.width, figCv.height); const d = figCv.width / w; c.setTransform(d, 0, 0, d, 0, 0); },
  axes(c, x0, y0, x1, y1, xl, yl) {
    c.strokeStyle = 'rgba(36,38,43,0.55)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.lineTo(x1, y1); c.stroke();
    c.font = `400 9px ${MONO}`; c.fillStyle = 'rgba(36,38,43,0.65)';
    if (xl) { c.textAlign = 'right'; c.textBaseline = 'top'; c.fillText(xl, x1, y1 + 16); }
    if (yl) { c.textAlign = 'left'; c.textBaseline = 'bottom'; c.fillText(yl, x0 + 3, y0 + 1); }
  },
  tick(c, x, y, txt, align = 'center', base = 'top') { c.font = `400 8.5px ${MONO}`; c.fillStyle = 'rgba(36,38,43,0.6)'; c.textAlign = align; c.textBaseline = base; c.fillText(String(txt).replace(/^-/, '−'), x, y); },
  note(c, x, y, txt, color = 'rgba(36,38,43,0.75)', align = 'left') { c.font = `italic 400 11px ${SERIF}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(txt, x, y); },
};
function drawFig() {
  if (!figCv || cardShut || card.classList.contains('pl-toc-open') || card.classList.contains('pl-watch-open') || !PL.fig) return;
  const r = figCv.getBoundingClientRect(); if (r.width < 10) return;
  const dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(r.width), h = Math.round(r.height);
  if (figCv.width !== w * dpr || figCv.height !== h * dpr) { figCv.width = w * dpr; figCv.height = h * dpr; }
  FIG.begin(figCtx, w, h);
  PL.fig(figCtx, w, h);
}
function figRestHistogram(c, w, h) {
  const x0 = 26, y0 = 10, x1 = w - 6, y1 = h - 28, nb = 28;
  const rest = STAT.rest;
  FIG.axes(c, x0, y0, x1, y1, 'L at rest', 'particles');
  const lo = HMIN, hi = Math.min(HMAX, HMIN + 1.2), bins = TRIBES.map(() => new Float64Array(nb));
  for (const [t, Lv] of rest) { const b = clamp(Math.floor((Lv - lo) / (hi - lo) * nb), 0, nb - 1); bins[t][b]++; }
  let mx = 1; for (let b = 0; b < nb; b++) { let s = 0; for (const B of bins) s += B[b]; mx = Math.max(mx, s); }
  const bw = (x1 - x0 - 4) / nb;
  for (let b = 0; b < nb; b++) {
    let yy = y1;
    for (let t = 0; t < TRIBES.length; t++) {
      const hh = bins[t][b] / mx * (y1 - y0 - 6);
      if (hh <= 0) continue;
      c.fillStyle = rgba(TRIBES[t].color, 0.78); c.fillRect(x0 + 3 + b * bw, yy - hh, bw - 1.2, hh); yy -= hh;
    }
  }
  FIG.tick(c, x0 + 3, y1 + 4, lo.toFixed(2), 'left'); FIG.tick(c, (x0 + x1) / 2, y1 + 4, ((lo + hi) / 2).toFixed(2));
  if (!rest.length) FIG.note(c, (x0 + x1) / 2, (y0 + y1) / 2, 'no particle has come to rest yet', 'rgba(36,38,43,0.5)', 'center');
}

// ---------------------------------------------------------------------------------------------
// building a plate: terrain, grid, features, print, particles, camera
// ---------------------------------------------------------------------------------------------
const fontsReady = (async () => {
  const link = document.querySelector('link[data-hl-fonts]');
  if (link && !link.sheet) await new Promise((r) => { link.addEventListener('load', r, { once: true }); link.addEventListener('error', r, { once: true }); setTimeout(r, 2500); });
  try {
    await Promise.race([
      Promise.all([document.fonts.load('italic 400 16px Newsreader'), document.fonts.load('500 10px Newsreader'), document.fonts.load('400 10px "Fragment Mono"')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (e) { /* offline: system faces stand in */ }
})();
let token = 0, introT0 = 0, printAt = Infinity, buildMs = 0, sheetFadeT = 0, pendingPlate = -1;
const RISE_DELAY = 450, RISE_MS = 2300, SINK_MS = 800, SMOOTH_MS = 700;
let RISE = 0, PRINTK = 1, riseT0 = 0, sinkT0 = 0, sinkFrom = 1, sinkFn = null, built = false, turning = false;
let CUT = 0, TERR = 0, sinkCut = 0, sinkTerr = 0;     // the build: cards stacked up to CUT; TERR = 1 stepped, 0 smooth
const easeIO = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);      // sine in-out: the gentlest peak speed, so contour lines do not strobe as the land moves
function turnTo(fn) {          // lay the standing model flat, then build the next sheet
  if (!built || turning || REDUCED) { fn(); return; }
  if (!sinkFn) { sinkT0 = performance.now(); sinkFrom = RISE; sinkCut = Math.min(CUT, HMAX + F.params.interval); sinkTerr = TERR; }
  sinkFn = fn;
}
// a plate is built as a cut-card relief model: cards one contour interval thick are stacked up to the top of the
// land, then the steps are smoothed away. On leaving, the model turns back into cards and they come off top first
function riseUpdate(now) {
  PRINTK = 1;
  const iv = F.params.interval, top = HMAX + iv, layer = (v) => Math.floor(v / iv + 1e-6) * iv;
  let cut, terr;
  if (sinkFn) {
    const u = clamp((now - sinkT0) / SINK_MS, 0, 1);
    terr = Math.max(sinkTerr, clamp(u / 0.3, 0, 1));
    cut = layer(sinkCut * (1 - easeIO(clamp((u - 0.15) / 0.85, 0, 1))));
    RISE = sinkFrom * (1 - easeIO(u)); PRINTK = 1 - clamp((u - 0.4) / 0.6, 0, 1);
    if (u >= 1) { const fn = sinkFn; sinkFn = null; turning = true; try { F.rand = Frame.rng(F.seed); fn(); } finally { turning = false; } RISE = 0; PRINTK = 0; cut = 0; terr = 1; }
  } else if (REDUCED) { cut = top; terr = 0; RISE = 1; }
  else {
    if (riseT0 === Infinity) riseT0 = now;      // the rise clock starts on the first frame after the build, so the build's own time never eats into it
    const t = now - riseT0 - RISE_DELAY;
    cut = layer(easeIO(clamp(t / RISE_MS, 0, 1)) * top);
    terr = 1 - easeIO(clamp((t - RISE_MS) / SMOOTH_MS, 0, 1));
    RISE = clamp(t / (RISE_MS + SMOOTH_MS), 0, 1);
  }
  if (cut !== CUT || terr !== TERR) { CUT = cut; TERR = terr; lightDirty = true; }
  if (ZS !== ZT) { ZS = ZT; lightDirty = true; }
}
const mmss = (s) => `${(s / 60) | 0}:${String((s | 0) % 60).padStart(2, '0')}`;
let prevReadouts = [];
function buildSheet() {
  const p = PL;
  TRIBES = p.tribes.map(makeTribe);
  p.sheet(F.rand);
  buildGrid();
  HIGHQ = highQuantile();
  NAMES = { areas: [], paths: [], marks: [] }; CRIT = []; NAMED = {};
  if (p.features) p.features();
  buildData();
  uploadData();
  if (p.names) p.names(NAMES);
}
function startWalkers() {
  SCAF.tree = null; SECT.a = SECT.b = SECT.res = null;
  const p = PL;
  resetWalkers(); clearInk(false);
  const h = (F.seed ^ (p.index * 0x9e3779b1)) >>> 0;
  NR = Frame.rng((h ^ 0x2c1b3c6d) >>> 0); RREL = Frame.rng((h ^ 0x297a2d39) >>> 0); RPLAN = Frame.rng((h ^ 0x6a09e667) >>> 0);
  RELEASES = []; RELEASES.more = null; nextRelease = 0; relCount = 0; ARCS.length = 0;
  if (p.setup) p.setup();
  if (p.plan) p.plan();
  nextRelease = Math.round(1.9 * 45);
  refreshLines();
}
function rebuild() {
  const t0 = performance.now(), my = ++token;
  buildSheet();
  startWalkers();
  leaveWalk();
  if (SECT.on) toggleSection(false);
  ZT = ZS0 * F.params.exag; ZS = ZT; RISE = 0; CUT = 0; TERR = 1; riseT0 = Infinity; built = true; lightDirty = aoDirty = true;
  for (const [k] of prevReadouts) F.readout(k, null);
  prevReadouts = [];
  renderCard();
  introView(turning); fitDistSaved = GOAL.dist;
  sheetFadeT = 0; introT0 = performance.now(); printAt = Infinity; STAT.time = 0;
  if (fontsOK) { printSheet(); printAt = introT0 + 350; }
  else { printSheet(); fontsReady.then(() => { fontsOK = true; if (my !== token) return; printSheet(); printAt = Math.max(performance.now(), introT0 + 350); }); }
  if (URLSTATE) applyURLState();
  buildMs = performance.now() - t0;
}
// an instrument changed the terrain itself: rebuild the sheet with the same seed, keep the view
let reshapeTimer = 0, reshapeWait = null;      // reshapeWait: what to do once the new terrain is in (a Try step's release)
function reshape(delay = 220) {
  clearTimeout(reshapeTimer);
  reshapeWait = reshapeWait || [];
  reshapeTimer = setTimeout(() => {
    const t0 = performance.now();
    F.rand = Frame.rng(F.seed);
    buildSheet(); startWalkers();
    STAT.time = 0; printSheet(); printAt = Math.min(printAt, performance.now());
    GOAL.tz = clamp(GOAL.tz, 0, HMAX * ZT);
    buildMs = performance.now() - t0;
    const w = reshapeWait; reshapeWait = null; for (const f of w) f();
  }, delay);
}
function gotoPlate(i, seed) {
  i = (i + PLATES.length) % PLATES.length;
  card.classList.remove('pl-toc-open');
  turnTo(() => switchPlate(i, seed));
}
function switchPlate(i, seed) {
  PL = PLATES[i];
  SIM = simFor(PL);
  F.setParam('plate', PL.id, true);
  try { const u = new URL(location.href), q = new URLSearchParams({ plate: PL.id }); if (u.searchParams.get('scaffold') === '1') q.set('scaffold', '1'); history.replaceState(null, '', u.pathname + '?' + q + '#' + (seed != null ? seed : PL.seed)); } catch (_) { /* file:// may refuse */ }
  F.setSeed(seed != null ? seed : PL.seed, true);
  card.classList.remove('pl-toc-open');
}
function onParam(k, v) {
  lastInteract = performance.now();
  if (k === 'plate') { const i = PLATES.findIndex((p) => p.id === v); if (i >= 0 && i !== PL.index) gotoPlate(i); }
  else if (k === 'interval') { printDirty = true; }
  else if (k === 'scaffold') { if (v !== SCAF.on) toggleScaffold(v); }
  else if (k === 'dusk') { if (v !== DUSK) toggleDusk(v); }
  else if (k === 'exag') { const z = ZS0 * v, r = z / Math.max(1e-6, ZT); ZT = z; GOAL.tz *= r; CAM.tz *= r; aoDirty = lightDirty = true; }
  else if (k === 'lamp' || k === 'lampAz' || k === 'lampEl') { setLamp(); aoDirty = true; if (k !== 'lamp' || v) lampShown = performance.now(); }
}
let resizeTimer = 0;
F.onResize(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { layoutCard(); const c = plateView(); GOAL.dist = c.dist; fitDistSaved = c.dist; }, 150); });
document.fonts.addEventListener('loadingdone', () => { if (fontsOK) printDirty = true; });
buildToc();
layoutCard();
{ // a plate named in the query string, else the first plate
  let id = null; try { id = new URL(location.href).searchParams.get('plate'); } catch (_) { /* ignore */ }
  id = { sign: 'adam', catapult: 'stability' }[id] || id;   // plates that were merged
  try { if (new URL(location.href).searchParams.get('scaffold') === '1') { SCAF.on = true; F.setParam('scaffold', true, true); } } catch (_) { /* ignore */ }
  const i = PLATES.findIndex((p) => p.id === id);
  PL = PLATES[i >= 0 ? i : 0];
  SIM = simFor(PL);
  try { URLSTATE = [...new URL(location.href).searchParams].filter(([k]) => k !== 'plate' && k !== 'scaffold'); } catch (_) { /* ignore */ }
  F.setParam('plate', PL.id, true);
  if (!/^#s?\d{1,10}$/.test(location.hash || '')) { F.seed = PL.seed >>> 0; F.rand = Frame.rng(F.seed); const si = document.getElementById('hl-seed'); if (si) si.value = F.seed; }
}

// ---------------------------------------------------------------------------------------------
// loop
// ---------------------------------------------------------------------------------------------
if (matchMedia('(pointer: coarse)').matches) {
  const hint = document.querySelector('.hl-hint');
  if (hint) for (const sp of [...hint.children]) if (sp.querySelector('kbd')) sp.remove();
}
window.__debug = {};
let acc = 0, loopMs = 0, simMs = 0, lastPrint = 0, figT = 0, lastClean = false;
F.start((t, dt) => {
  const now = performance.now();
  NOWMS = now;
  DUSKV += ((DUSK ? 1 : 0) - DUSKV) * (REDUCED ? 1 : Math.min(1, Math.max(dt, 1 / 60) * 1.6));
  if (Math.abs(DUSKV - (DUSK ? 1 : 0)) < 1e-3) DUSKV = DUSK ? 1 : 0;
  if (printDirty && fontsOK && now - lastPrint > 120) { lastPrint = now; printSheet(); }
  const clean = document.body.classList.contains('hl-clean');
  if (clean !== lastClean) { lastClean = clean; const before = fitDistSaved || GOAL.dist; layoutCard(); const c = plateView(); GOAL.dist *= c.dist / before; fitDistSaved = c.dist; }
  riseUpdate(now);
  followUpdate(Math.max(dt, 1 / 60), now);
  watchUpdate(Math.max(dt, 1 / 60), now);
  camUpdate(Math.max(dt, 1 / 60), now);
  scaffoldFrame(now);
  if (dt > 0) {
    STAT.time += dt;
    const sps = F.params.speed * (PL.speed || 1);
    acc += dt * sps;
    let n = Math.floor(acc); const cap = Math.max(4, Math.ceil(sps / 30)); if (n > cap) { n = cap; acc = 0; }
    acc -= n;
    const s0 = performance.now();
    for (let k = 0; k < n; k++) { autoRelease(); stepAll(); if (FOL.on) trailPush(); }
    if (PL.frame) PL.frame(dt, n);
    simMs = simMs * 0.95 + (performance.now() - s0) * 0.05;
    inkFadeAcc += dt;
    if (inkFadeAcc > 9 && STAT.time > 60) { inkFadeAcc = 0; fadeInk(PL.fade || 0.035); }
    if (!sinkFn && F.params.turn && STAT.time > (PL.dwell || 6 * 60) && now - lastInteract > 120000) { const ni = (PL.index + 1) % PLATES.length; gotoPlate(ni); F.toast(`Plate ${ni + 1}`); }
  }
  if (linesDirty) { linesDirty = false; refreshLines(); }
  flushInk();
  packWalkers(acc);
  const ac = clamp((now - printAt) / 900, 0, 1) * PRINTK;
  bakeLight();
  watchRender(ac);
  render(ac);
  updateCamps(now);
  modesUpdate();
  drawOverlay(now, clamp((now - printAt - 300) / 800, 0, 1) * PRINTK * (1 - TERR));
  if (F.frame % 6 === 0 && PL.readouts) {
    const ro = PL.readouts();
    for (const [k] of prevReadouts) if (!ro.some((r) => r[0] === k)) F.readout(k, null);
    for (const [k, v] of ro) F.readout(k, v);
    prevReadouts = ro;
  }
  if (now - figT > 250) { figT = now; drawFig(); }
  if (now - watchT > 250 && watchOpen()) { watchT = now; watchCaptions(); }
  loopMs = loopMs * 0.95 + (performance.now() - now) * 0.05;
  if (F.frame % 30 === 0) {
    const D = window.__debug;
    D.plate = PL.id; D.seed = F.seed; D.alive = STAT.alive; D.converged = STAT.converged; D.lost = STAT.lost; D.nan = STAT.nan; D.caravans = STAT.released;
    D.best = STAT.best; D.steps = STAT.steps; D.buildMs = Math.round(buildMs); D.fps = Math.round(F.fps);
    D.named = Object.fromEntries(Object.entries(NAMED).map(([k, v]) => [k, { x: +v.x.toFixed(3), y: +v.y.toFixed(3), L: +v.L.toFixed(4), l1: +v.l1.toFixed(2), l2: +v.l2.toFixed(2) }]));
    D.lakes = LAKE_LEV.slice(1).map((v) => +v.toFixed(3)); D.contourLabels = CLABELS; D.fontsOK = fontsOK; D.marks = NAMES.marks.length;
    D.H = [+HMIN.toFixed(3), +HMAX.toFixed(3)]; D.cam = { yaw: +CAM.yaw.toFixed(3), pitch: +CAM.pitch.toFixed(3), dist: +CAM.dist.toFixed(3) };
    D.loopMs = +loopMs.toFixed(2); D.simMs = +simMs.toFixed(2);
    D.rise = +RISE.toFixed(3); D.build = { cut: +CUT.toFixed(3), terr: +TERR.toFixed(3), reduced: REDUCED }; D.signs = SIGNS.length; D.trail = trN; D.camps = CAMPS.map((c) => c.n);
    D.campers = CAMPS.map((c) => [c.n, c.pose, c.s != null ? +c.s.toFixed(3) : null, c.who ? c.who.length : 0]); D.puffs = PUFFS.length; D.pops = POPS.length;
    { const em = [0, 0, 0, 0, 0, 0, 0, 0, 0]; let thin = 0, fig = 0; for (let m = 0; m < ORDN; m++) { em[OE[m]]++; fig += OFg[m]; } for (let k = 0; k < ORDN; k++) thin += THN[k];
      D.pilgrims = { emotes: em, figures: fig, thinned: thin, leavers: LEAVERS.length, hover: HOVER, dusk: +DUSKV.toFixed(2) };
      D.watch = { open: watchOpen(), cams: CAMS.map((c) => (c.i >= 0 && Alive[c.i] && SER[c.i] === c.ser ? c.ser : c.rest ? 'resting' : 0)), staged: STAGEN }; }
    D.mist = PL.mist ? PL.mist().map((m) => +m.T.toFixed(5)) : null; D.lamp = F.params.lamp ? [Math.round(F.params.lampAz), Math.round(F.params.lampEl)] : null;
    D.walk = FOL.on ? { tribe: TRIBES[FOL.tribe].key, i: FOL.i, age: FOL.age, fov: +FOV.toFixed(3) } : null;
    D.p = PL.debug ? PL.debug() : null;
  }
});
