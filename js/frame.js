/* Hidden Layers — exhibition frame runtime. Exposes window.Frame (wall label, drawers, seed, params, capture, loop). */
(function () {
  'use strict';
  const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Fragment+Mono:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..600&display=swap';
  const ICON = {
    info: '<circle cx="10" cy="10" r="7.25"/><path d="M10 9.2v4.6M10 6.4v.2"/>',
    tune: '<path d="M3.5 6.5h8M15.5 6.5h1M3.5 13.5h2M9.5 13.5h7"/><circle cx="13.5" cy="6.5" r="1.7"/><circle cx="7.5" cy="13.5" r="1.7"/>',
    capture: '<path d="M3.5 7.5v-2a2 2 0 0 1 2-2h2M12.5 3.5h2a2 2 0 0 1 2 2v2M16.5 12.5v2a2 2 0 0 1-2 2h-2M7.5 16.5h-2a2 2 0 0 1-2-2v-2"/><circle cx="10" cy="10" r="2.3"/>',
    full: '<path d="M4 8V4h4M12 4h4v4M16 12v4h-4M8 16H4v-4"/>',
    pause: '<path d="M7.5 5v10M12.5 5v10"/>',
    play: '<path d="M7 4.8l8 5.2-8 5.2z"/>',
    close: '<path d="M5.5 5.5l9 9M14.5 5.5l-9 9"/>',
    back: '<path d="M11.5 5L6.5 10l5 5"/>',
  };
  const svg = (n) => `<svg class="hl-svg" viewBox="0 0 20 20" aria-hidden="true">${ICON[n]}</svg>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const el = (tag, attrs, html) => {
    const e = document.createElement(tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeRng(seed) {
    const r = mulberry32(seed >>> 0);
    let spare = null;
    r.normal = () => {
      if (spare !== null) { const s = spare; spare = null; return s; }
      let u = 0; while (u === 0) u = r();
      const v = r(), m = Math.sqrt(-2 * Math.log(u));
      spare = m * Math.sin(2 * Math.PI * v);
      return m * Math.cos(2 * Math.PI * v);
    };
    r.range = (a, b) => a + (b - a) * r();
    r.int = (a, b) => Math.floor(a + (b - a + 1) * r());
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    return r;
  }

  const Frame = { rng: makeRng };
  let F = null, failed = false;

  Frame.fail = function (msg, detail) {
    if (failed) return; failed = true;
    if (F) F._stop();
    console.error('[Frame] ' + msg + (detail ? '\n' + detail : ''));
    const back = (F && F.opts.back) || '../index.html', alone = F && F.opts.standalone;
    document.body.appendChild(el('div', { class: 'hl-error', role: 'alert' },
      `<div>${alone ? '' : '<div class="hl-eyebrow">Hidden Layers</div>'}<h2>${alone ? 'This page' : 'This piece'} could not start</h2><p>${esc(msg)}</p>` +
      (detail ? `<pre>${esc(detail)}</pre>` : '') + (alone ? '' : `<p><a href="${esc(back)}" style="color:inherit">Back to the exhibition</a></p>`) + '</div>'));
  };

  Frame.init = function (o) {
    if (F) return F;
    const opts = Object.assign({
      slug: 'piece', number: 0, title: 'Untitled', year: 2026, medium: '', statement: '', hint: '',
      gestures: [], params: [], keys: {}, tone: 'dark', accent: null, maxDpr: 2, renderScale: 1,
      seed: null, back: '../index.html', exhibition: 'Hidden Layers', idleMs: 3200,
      standalone: false,          // published on its own: no exhibition link, no catalogue number
      maxFps: null,               // draw at most this often, except during a drag or a scroll
      still: null, stillMs: 3000, // still(): nothing on screen moves until the next input; while paused, the loop then sleeps
      onSeed: null, onParam: null, onReset: null,
    }, o || {});
    F = { opts, params: {}, paused: false, timeScale: 1, time: 0, frame: 0, fps: 60, captureLayers: null,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches };
    window.__frame = F;
    if (opts.standalone) document.documentElement.classList.add('hl-standalone');

    if (!document.querySelector('link[data-hl-fonts]')) {
      const pre = el('link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' });
      document.head.append(pre, el('link', { rel: 'stylesheet', href: FONT_HREF, 'data-hl-fonts': '' }));
    }
    document.documentElement.dataset.hlTone = opts.tone;
    F.setTone = (t) => { document.documentElement.dataset.hlTone = t; };
    if (opts.accent) document.documentElement.style.setProperty('--hl-accent', opts.accent);

    // ---------- canvas & sizing ----------
    const canvas = opts.canvas || el('canvas', { class: 'hl-canvas', tabindex: '0', 'aria-label': opts.title });
    if (!opts.canvas) document.body.prepend(canvas); else canvas.classList.add('hl-canvas');
    F.canvas = canvas;
    F.renderScale = opts.renderScale;
    const resizeFns = [];
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr) * F.renderScale;
      const w = Math.max(1, Math.round(innerWidth * dpr)), h = Math.max(1, Math.round(innerHeight * dpr));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      F.width = w; F.height = h; F.dpr = dpr; F.cssWidth = innerWidth; F.cssHeight = innerHeight;
      for (const fn of resizeFns) fn(w, h, dpr);
    }
    F.onResize = (fn) => { resizeFns.push(fn); };
    F.setRenderScale = (s) => { F.renderScale = s; resize(); };
    resize();
    addEventListener('resize', resize);

    // ---------- pointer ----------
    const P = F.pointer = { x: innerWidth / 2, y: innerHeight / 2, nx: 0.5, ny: 0.5, dx: 0, dy: 0, wheel: 0,
      down: false, buttons: 0, shift: false, alt: false, type: 'mouse', inside: false };
    const upd = (e) => {
      P.dx += e.clientX - P.x; P.dy += e.clientY - P.y; P.x = e.clientX; P.y = e.clientY;
      P.nx = P.x / innerWidth; P.ny = P.y / innerHeight; P.buttons = e.buttons; P.shift = e.shiftKey; P.alt = e.altKey;
      P.type = e.pointerType || 'mouse'; P.inside = true;
    };
    canvas.addEventListener('pointerdown', (e) => { P.dx = P.dy = 0; P.x = e.clientX; P.y = e.clientY; upd(e); P.down = true; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} });
    canvas.addEventListener('pointermove', upd);
    const up = (e) => { upd(e); P.down = false; P.buttons = 0; };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', () => { P.inside = false; });
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); P.wheel += e.deltaY; }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // ---------- chrome ----------
    const num = String(opts.number).padStart(2, '0');
    const chrome = el('div', { class: 'hl-chrome' });
    const label = el('header', { class: 'hl-label' },
      (opts.standalone ? '' : `<div class="hl-eyebrow"><a href="${esc(opts.back)}" title="Back to the exhibition">${svg('back')}${esc(opts.exhibition)}</a><span>No. ${num}</span></div>`) +
      `<h1 class="hl-title">${opts.title}</h1><div class="hl-medium">${opts.medium}</div>`);
    const tools = el('nav', { class: 'hl-tools', 'aria-label': opts.standalone ? 'Controls' : 'Piece controls' });
    const tool = (icon, title, fn) => {
      const b = el('button', { class: 'hl-btn', type: 'button', title, 'aria-label': title }, svg(icon));
      b.addEventListener('click', fn); tools.appendChild(b); return b;
    };
    const hint = el('div', { class: 'hl-hint' });
    const hintBits = (opts.hint ? opts.hint.split(/\s*·\s*/) : []).concat(['<kbd>I</kbd> about', '<kbd>P</kbd> tune', '<kbd>H</kbd> hide']);
    hint.innerHTML = hintBits.map((b) => `<span>${b}</span>`).join('');
    const readouts = el('dl', { class: 'hl-readouts', 'aria-live': 'off' });
    chrome.append(label, tools, hint, readouts);

    // info drawer
    const builtinKeys = [['Space', 'pause / resume'], ['R', 'new random seed'], ['← →', 'previous / next seed'],
      ['S', 'capture PNG'], ['P', 'parameters and seed'], ['I', opts.standalone ? 'about this page' : 'about this piece'], ['H', 'hide interface'], ['F', 'fullscreen']];
    const KEYNAME = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Escape: 'Esc' };
    const pieceKeys = Object.entries(opts.keys).map(([k, v]) => [k.length === 1 ? k.toUpperCase() : (KEYNAME[k] || k), v[0]]);
    const kbd = (k) => k.split(/\s+/).map((x) => `<kbd>${esc(x)}</kbd>`).join(' ');
    const keyRows = opts.gestures.map(([g, d]) => `<dt>${esc(g)}</dt><dd>${esc(d)}</dd>`).join('') +
      pieceKeys.concat(builtinKeys).map(([k, d]) => `<dt>${kbd(k)}</dt><dd>${esc(d)}</dd>`).join('');
    const info = el('aside', { class: 'hl-panel hl-info', 'aria-label': opts.standalone ? 'About' : 'About this piece' },
      `<div class="hl-panel-head"><div class="hl-eyebrow">${opts.standalone ? '' : `No. ${num} · `}${esc(opts.year)}</div><button class="hl-btn" type="button" data-close title="Close (Esc)" aria-label="Close">${svg('close')}</button></div>` +
      `<h2>${opts.title}</h2><div class="hl-medium">${opts.medium}</div>${opts.byline ? `<div class="hl-medium">${opts.byline}</div>` : ''}<h3>Statement</h3><div class="hl-statement">${opts.statement}</div>` +
      `<h3>Controls</h3><dl class="hl-keys">${keyRows}</dl>`);

    // tune drawer
    const tune = el('aside', { class: 'hl-panel hl-tune', 'aria-label': 'Parameters and seed' },
      `<div class="hl-panel-head"><div class="hl-eyebrow">Tune${opts.standalone ? '' : ` · No. ${num}`}</div><button class="hl-btn" type="button" data-close title="Close (Esc)" aria-label="Close">${svg('close')}</button></div>` +
      `<h3 style="margin-top:4px">Seed</h3>` +
      `<div class="hl-seed"><input id="hl-seed" type="number" min="0" max="4294967295" step="1" aria-label="Seed"><button class="hl-pill" type="button" data-act="jump">Go</button></div>` +
      `<div class="hl-row3"><button class="hl-pill" type="button" data-act="prev">← Prev</button><button class="hl-pill" type="button" data-act="next">Next →</button><button class="hl-pill" type="button" data-act="random">Random</button></div>` +
      (opts.params.length ? `<h3>Parameters</h3><div class="hl-group" data-params></div>` : '') +
      `<h3>Actions</h3><div class="hl-row"><button class="hl-pill" type="button" data-act="regen">Regenerate</button><button class="hl-pill" type="button" data-act="reset">Reset parameters</button></div>` +
      `<div style="margin-top:6px;display:grid"><button class="hl-pill hl-primary" type="button" data-act="capture">Capture PNG</button></div>`);
    const toast = el('div', { class: 'hl-toast', role: 'status' });
    document.body.append(chrome, info, tune, toast);

    const panels = [info, tune];
    const anyOpen = () => panels.some((p) => p.classList.contains('hl-open'));
    function togglePanel(p, force) {
      const open = force != null ? force : !p.classList.contains('hl-open');
      for (const q of panels) q.classList.remove('hl-open');
      if (open) p.classList.add('hl-open');
      bInfo.setAttribute('aria-pressed', info.classList.contains('hl-open'));
      bTune.setAttribute('aria-pressed', tune.classList.contains('hl-open'));
      wake();
    }
    for (const p of panels) p.querySelector('[data-close]').addEventListener('click', () => togglePanel(p, false));
    const bPause = tool('pause', 'Pause (Space)', () => F.togglePause());
    const bInfo = tool('info', opts.standalone ? 'About (I)' : 'About this piece (I)', () => togglePanel(info));
    const bTune = tool('tune', 'Parameters and seed (P)', () => togglePanel(tune));
    tool('capture', 'Capture PNG (S)', () => F.capture());
    tool('full', 'Fullscreen (F)', () => toggleFullscreen());
    F.openInfo = (v = true) => togglePanel(info, v);
    F.openTune = (v = true) => togglePanel(tune, v);

    // ---------- idle hiding ----------
    let idleTimer = 0, overChrome = false;
    function wake() {
      document.body.classList.remove('hl-idle');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { if (!anyOpen() && !overChrome) document.body.classList.add('hl-idle'); }, opts.idleMs);
    }
    for (const c of [label, tools, hint, readouts]) {
      c.addEventListener('pointerenter', () => { overChrome = true; wake(); });
      c.addEventListener('pointerleave', () => { overChrome = false; wake(); });
    }
    addEventListener('pointermove', wake, { passive: true });
    addEventListener('pointerdown', wake, { passive: true });

    // ---------- toast ----------
    let toastTimer = 0;
    F.toast = (msg, ms = 1600) => {
      toast.textContent = msg; toast.classList.add('hl-show');
      clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('hl-show'), ms);
    };

    // ---------- readouts ----------
    const ro = new Map(); let roDirty = false;
    F.readout = (k, v, now) => {
      if (v == null) { const r = ro.get(k); if (r) { r.dt.remove(); r.dd.remove(); ro.delete(k); } return; }
      let r = ro.get(k);
      if (!r) { r = { dt: el('dt', {}, esc(k)), dd: el('dd'), v: null }; readouts.append(r.dt, r.dd); ro.set(k, r); }
      if (r.v !== v) { r.v = v; r.dirty = true; roDirty = true; }
      if (now && r.dirty) { r.dd.textContent = v; r.dirty = false; }
    };
    const flushReadouts = () => {
      if (!roDirty) return; roDirty = false;
      for (const r of ro.values()) if (r.dirty) { r.dd.textContent = r.v; r.dirty = false; }
    };

    // ---------- params ----------
    const ctls = {};
    const commit = (k, v) => { F.params[k] = v; if (opts.onParam) opts.onParam(k, v, F.params, F); };
    F.setParam = (k, v, silent) => { F.params[k] = v; if (ctls[k]) ctls[k](v); if (!silent && opts.onParam) opts.onParam(k, v, F.params, F); F.redraw(); };
    const group = tune.querySelector('[data-params]');
    for (const p of opts.params) {
      const type = p.type || 'range';
      if (type === 'section') { group.appendChild(el('div', { class: 'hl-sub' }, esc(p.label))); continue; }
      if (type === 'button') {
        const b = el('button', { class: 'hl-pill', type: 'button' }, esc(p.label));
        b.addEventListener('click', () => p.action && p.action(F)); group.appendChild(b); continue;
      }
      if (type === 'html') { group.appendChild(el('div', {}, p.html)); continue; }
      const id = 'hl-p-' + p.key;
      F.params[p.key] = p.value;
      let wrap;
      if (type === 'range') {
        const log = p.scale === 'log';
        wrap = el('div', { class: 'hl-ctl' }, `<div class="hl-ctl-row"><label for="${id}">${esc(p.label)}</label><span class="hl-val"></span></div>` +
          `<input id="${id}" type="range" min="${log ? 0 : p.min}" max="${log ? 1000 : p.max}" step="${log ? 1 : (p.step ?? 'any')}">`);
        const input = wrap.querySelector('input'), val = wrap.querySelector('.hl-val');
        const dec = p.step ? Math.max(0, Math.min(5, Math.ceil(-Math.log10(p.step) - 1e-9))) : 2;
        const fmt = p.format || ((v) => (log ? (+v).toPrecision(3) : (+v).toFixed(dec)) + (p.unit || ''));
        const toPos = (v) => log ? 1000 * Math.log(v / p.min) / Math.log(p.max / p.min) : v;
        const fromPos = (x) => log ? p.min * Math.pow(p.max / p.min, x / 1000) : x;
        const sync = (v) => {
          input.value = toPos(v); val.textContent = fmt(v);
          const lo = log ? 0 : p.min, hi = log ? 1000 : p.max;
          input.style.setProperty('--fill', (100 * (toPos(v) - lo) / (hi - lo)).toFixed(2) + '%');
        };
        input.addEventListener('input', () => { const v = fromPos(parseFloat(input.value)); sync(v); commit(p.key, v); });
        ctls[p.key] = sync;
      } else if (type === 'select') {
        const opt = Array.isArray(p.options) ? p.options.map((x) => Array.isArray(x) ? x : [x, x]) : Object.entries(p.options);
        wrap = el('div', { class: 'hl-ctl' }, `<label for="${id}" style="font-size:11.5px">${esc(p.label)}</label><select id="${id}">` +
          opt.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('') + `</select>`);
        const s = wrap.querySelector('select');
        s.addEventListener('change', () => commit(p.key, s.value));
        ctls[p.key] = (v) => { s.value = v; };
      } else if (type === 'toggle') {
        wrap = el('label', { class: 'hl-switch', for: id }, `<span>${esc(p.label)}</span><input id="${id}" type="checkbox" role="switch">`);
        const c = wrap.querySelector('input');
        c.addEventListener('change', () => commit(p.key, c.checked));
        ctls[p.key] = (v) => { c.checked = !!v; };
      } else if (type === 'text') {
        wrap = el('div', { class: 'hl-ctl' }, `<label for="${id}" style="font-size:11.5px">${esc(p.label)}</label><input id="${id}" type="text" maxlength="${p.maxLength || 64}" spellcheck="false" autocomplete="off">`);
        const t = wrap.querySelector('input');
        t.addEventListener(p.live ? 'input' : 'change', () => commit(p.key, t.value));
        t.addEventListener('keydown', (e) => { if (e.key === 'Enter') { commit(p.key, t.value); t.blur(); } });
        ctls[p.key] = (v) => { t.value = v; };
      } else if (type === 'color') {
        wrap = el('div', { class: 'hl-ctl-row' }, `<label for="${id}">${esc(p.label)}</label><input id="${id}" type="color" style="width:34px;height:24px;border:0;background:none;padding:0">`);
        const c = wrap.querySelector('input');
        c.addEventListener('input', () => commit(p.key, c.value));
        ctls[p.key] = (v) => { c.value = v; };
      }
      ctls[p.key](p.value);
      group.appendChild(wrap);
    }
    F.resetParams = () => {
      for (const p of opts.params) if (p.key && p.type !== 'button' && p.type !== 'section') F.setParam(p.key, p.value);
      if (opts.onReset) opts.onReset(F);
      F.toast('Parameters reset');
    };

    // ---------- seed ----------
    const seedInput = tune.querySelector('#hl-seed');
    const hashSeed = (() => { const m = /^#s?(\d{1,10})$/.exec(location.hash || ''); return m ? Number(m[1]) >>> 0 : null; })();
    F.seed = hashSeed != null ? hashSeed : (opts.seed != null ? opts.seed >>> 0 : (Math.random() * 4294967296) >>> 0);
    F.rand = makeRng(F.seed);
    seedInput.value = F.seed;
    F.setSeed = (s, quiet) => {
      F.seed = Number(s) >>> 0; F.rand = makeRng(F.seed); seedInput.value = F.seed;
      try { history.replaceState(null, '', '#' + F.seed); } catch (_) {}
      if (opts.onSeed) opts.onSeed(F.seed, F);
      if (!quiet) F.toast('Seed ' + F.seed);
      F.redraw();
    };
    F.randomSeed = () => F.setSeed((Math.random() * 4294967296) >>> 0);
    F.regenerate = () => F.setSeed(F.seed, true);
    tune.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'jump') F.setSeed(seedInput.value || 0);
      else if (act === 'prev') F.setSeed((F.seed - 1) >>> 0);
      else if (act === 'next') F.setSeed((F.seed + 1) >>> 0);
      else if (act === 'random') F.randomSeed();
      else if (act === 'regen') { F.regenerate(); F.toast('Regenerated seed ' + F.seed); }
      else if (act === 'reset') F.resetParams();
      else if (act === 'capture') F.capture();
    });
    seedInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { F.setSeed(seedInput.value || 0); seedInput.blur(); } });

    // ---------- pause, fullscreen ----------
    F.togglePause = (v) => {
      F.paused = v != null ? !!v : !F.paused;
      bPause.innerHTML = svg(F.paused ? 'play' : 'pause');
      bPause.title = F.paused ? 'Resume (Space)' : 'Pause (Space)';
      bPause.setAttribute('aria-label', bPause.title);
      F.toast(F.paused ? 'Paused' : 'Resumed', 900);
      F.redraw();
    };
    function toggleFullscreen() {
      const d = document;
      if (d.fullscreenElement) { d.exitFullscreen && d.exitFullscreen(); return; }
      const r = d.documentElement.requestFullscreen ? d.documentElement.requestFullscreen() : null;
      if (!r) F.toast('Fullscreen is not available here'); else r.catch(() => F.toast('Fullscreen is not available here'));
    }

    // ---------- capture ----------
    let captureWanted = false, running = false, lightbox = null;
    F.capture = () => { captureWanted = true; if (!running) doCapture(); else F.redraw(); };
    function doCapture() {
      captureWanted = false;
      const layers = F.captureLayers || [canvas];
      let src = canvas;
      if (layers.length > 1 || layers[0] !== canvas) {
        src = document.createElement('canvas'); src.width = canvas.width; src.height = canvas.height;
        const c = src.getContext('2d');
        c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--hl-ground').trim() || '#000';
        c.fillRect(0, 0, src.width, src.height);
        for (const L of layers) c.drawImage(L, 0, 0, src.width, src.height);
      }
      src.toBlob((blob) => { if (!blob) { F.toast('Capture failed'); return; } showCapture(blob); }, 'image/png');
    }
    function showCapture(blob) {
      closeCapture();
      const url = URL.createObjectURL(blob);
      const name = opts.standalone ? `${opts.slug}-${F.seed}.png` : `hidden-layers-${num}-${opts.slug}-${F.seed}.png`;
      lightbox = el('div', { class: 'hl-capture', role: 'dialog', 'aria-label': 'Captured image' },
        `<button class="hl-btn" type="button" title="Close (Esc)" aria-label="Close">${svg('close')}</button>` +
        `<figure><img alt="${esc(opts.title)}, seed ${F.seed}" src="${url}"><figcaption><span>${esc(name)}</span>` +
        `<a href="${url}" download="${esc(name)}">Save PNG</a><span>or right-click the image to save it</span></figcaption></figure>`);
      lightbox.addEventListener('click', (e) => { if (e.target === lightbox || e.target.closest('.hl-btn')) closeCapture(); });
      lightbox._url = url;
      document.body.appendChild(lightbox);
    }
    function closeCapture() { if (lightbox) { URL.revokeObjectURL(lightbox._url); lightbox.remove(); lightbox = null; } }

    // ---------- keyboard ----------
    addEventListener('keydown', (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) {
        if (e.key === 'Escape') t.blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      wake();
      const handled = () => { e.preventDefault(); };
      switch (k) {
        case ' ': handled(); F.togglePause(); return;
        case 'h': handled(); document.body.classList.toggle('hl-clean'); return;
        case 'i': handled(); togglePanel(info); return;
        case 'p': handled(); togglePanel(tune); return;
        case 's': handled(); F.capture(); return;
        case 'f': handled(); toggleFullscreen(); return;
        case 'r': handled(); F.randomSeed(); return;
        case 'ArrowLeft': handled(); F.setSeed((F.seed - 1) >>> 0); return;
        case 'ArrowRight': handled(); F.setSeed((F.seed + 1) >>> 0); return;
        case 'Escape': if (lightbox) closeCapture(); else togglePanel(info, false); return;
      }
      const pk = opts.keys[k] || opts.keys[e.key];
      if (pk) { handled(); pk[1](F, e); }
    });

    // ---------- loop ----------
    // Frames are drawn on every Nth display refresh, so as not to exceed opts.maxFps (every other refresh at 120 Hz),
    // and on every refresh while a drag or a scroll is under way. Paused, the loop sleeps once opts.still() holds and
    // nothing has been touched for opts.stillMs; input, F.redraw() or still() turning false wakes it.
    let loopFn = null, last = 0, roLast = 0, rafId = 0;
    let prevRaf = 0, gapMin = Infinity, gapN = 0, vsync = 1 / 60, skip = 0, inputAt = 0, wheelAt = -1e9, asleep = false, sleepTimer = 0;
    F._stop = () => { running = false; cancelAnimationFrame(rafId); clearInterval(sleepTimer); };
    F.start = (fn) => {
      loopFn = fn || null;
      try { if (opts.onSeed) opts.onSeed(F.seed, F); }
      catch (err) { Frame.fail(err.message || String(err), err.detail || err.stack); return; }
      running = true; last = performance.now(); rafId = requestAnimationFrame(tick); wake();
    };
    F.redraw = () => {
      inputAt = performance.now();
      if (!asleep || !running) return;
      asleep = false; clearInterval(sleepTimer);
      last = performance.now(); rafId = requestAnimationFrame(tick);
    };
    for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'keydown', 'input', 'change', 'resize']) addEventListener(ev, F.redraw, { capture: true, passive: true });
    addEventListener('wheel', () => { wheelAt = performance.now(); F.redraw(); }, { capture: true, passive: true });
    function tick(now) {
      if (!running) return;
      if (prevRaf) {        // the display's refresh interval: the shortest gap between callbacks over the last 60
        gapMin = Math.min(gapMin, now - prevRaf);
        if (++gapN === 60) { if (gapMin > 2 && gapMin < 50) vsync = gapMin / 1000; gapMin = Infinity; gapN = 0; }
      }
      prevRaf = now;
      const every = opts.maxFps ? Math.max(1, Math.floor(1 / (vsync * opts.maxFps) + 0.25)) : 1;
      if (++skip < every && !P.down && now - wheelAt > 300) { rafId = requestAnimationFrame(tick); return; }
      skip = 0;
      const raw = Math.min(Math.max((now - last) / 1000, 0), 1 / 15); last = now;
      const dt = F.paused ? 0 : raw * F.timeScale;
      F.time += dt; F.frame++;
      try { if (loopFn) loopFn(F.time, dt, F); }
      catch (err) { Frame.fail(err.message || String(err), err.detail || err.stack); return; }
      if (captureWanted) doCapture();
      P.dx = 0; P.dy = 0; P.wheel = 0;
      if (raw > 0) F.fps = F.fps * 0.94 + (1 / raw) * 0.06;
      if (now - roLast > 120) { flushReadouts(); roLast = now; }
      if (F.paused && opts.still && now - inputAt > opts.stillMs && opts.still()) {
        asleep = true;
        sleepTimer = setInterval(() => { if (!F.paused || !opts.still()) F.redraw(); }, 250);
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    addEventListener('error', (e) => {
      if (!e.error && !e.message) return;
      const err = e.error || {};
      if (!running) Frame.fail(e.message || 'Script error', err.detail || err.stack);
      else F.toast('Error: ' + (e.message || 'script error'), 3000);
    });
    addEventListener('unhandledrejection', (e) => {
      const r = e.reason || {};
      if (!running) Frame.fail(r.message || String(r), r.detail || r.stack);
    });
    return F;
  };

  window.Frame = Frame;
})();
