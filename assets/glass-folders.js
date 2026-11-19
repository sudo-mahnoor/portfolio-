/*
 * Glass folders: a folder drawn as an object. A back panel holding generated artwork,
 * the files it contains, and a frosted-glass front panel hinged on its bottom edge.
 * Hover to lean the glass, select to open and fan the files, select a file to read it.
 * Plain-JavaScript port of the "Glass Folder Cards" React component (add and menu keys left out).
 * Folders are built from the .project articles on the page; without JavaScript the list just shows.
 */
(function () {
  'use strict';
  var host = document.getElementById('folders');
  var projects = [].slice.call(document.querySelectorAll('.project'));
  if (!host || !projects.length) return;

  // #region art: a domain-warped noise field shaded as a liquid surface
  function hexToRgb(hex) {
    var h = hex.trim().replace(/^#/, '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = /^[0-9a-f]{6}$/i.test(h) ? parseInt(h, 16) : 0x808080;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  function makeFbm(seed) {
    var r = rng(seed);
    var perm = new Uint8Array(512), grad = new Float32Array(512), p = [], i;
    for (i = 0; i < 256; i++) p.push(i);
    for (i = 255; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
    for (i = 0; i < 256; i++) { var a = r() * Math.PI * 2; grad[i * 2] = Math.cos(a); grad[i * 2 + 1] = Math.sin(a); }
    function noise(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
      var h00 = perm[X + perm[Y]] * 2, h10 = perm[X + 1 + perm[Y]] * 2, h01 = perm[X + perm[Y + 1]] * 2, h11 = perm[X + 1 + perm[Y + 1]] * 2;
      var d00 = grad[h00] * xf + grad[h00 + 1] * yf;
      var d10 = grad[h10] * (xf - 1) + grad[h10 + 1] * yf;
      var d01 = grad[h01] * xf + grad[h01 + 1] * (yf - 1);
      var d11 = grad[h11] * (xf - 1) + grad[h11 + 1] * (yf - 1);
      var u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
      var v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
      return d00 + u * (d10 - d00) + v * (d01 - d00 + u * (d11 - d01 - d10 + d00));
    }
    return function (x, y, octaves) {
      var sum = 0, amp = 0.5;
      for (var o = 0; o < octaves; o++) {
        sum += amp * noise(x, y);
        var nx = 1.6 * x + 1.2 * y + 7.1;
        y = -1.2 * x + 1.6 * y + 3.3;
        x = nx;
        amp *= 0.5;
      }
      return sum;
    };
  }
  function createArtJob(width, height, recipe, seed) {
    var w = Math.max(1, Math.round(width)), h = Math.max(1, Math.round(height));
    var colors = recipe.colors.length >= 2 ? recipe.colors : ['#111111', '#eeeeee'];
    var stops = colors.map(function (c, i) { return { t: i / (colors.length - 1), c: hexToRgb(c) }; });
    var scale = recipe.scale == null ? 0.7 : recipe.scale;
    var warp = recipe.warp == null ? 3 : recipe.warp;
    var gloss = recipe.gloss == null ? 0.4 : recipe.gloss;
    var veins = recipe.veins == null ? 0 : recipe.veins;
    var streak = recipe.style === 'streak';
    var fbm = makeFbm(seed * 977 + 13);
    var r = rng(seed + 1);
    var ox = r() * 50, oy = r() * 50;
    var angle = (recipe.angle || 0) + (r() - 0.5) * 0.5;
    var ca = Math.cos(angle), sa = Math.sin(angle);
    var m = Math.min(w, h);
    // sampled on a half-resolution grid and brought up with Catmull-Rom
    var gw = Math.ceil(w / 2) + 3, gh = Math.ceil(h / 2) + 3;
    var G = new Float32Array(gw * gh), GQ = new Float32Array(gw * gh);
    var F = new Float32Array(w * h), Q = new Float32Array(w * h);
    var pixels = new Uint8ClampedArray(w * h * 4);
    var row = 0;

    function field(gy) {
      for (var gx = 0; gx < gw; gx++) {
        var u = ((gx - 1) * 2 - w / 2) / m, v = ((gy - 1) * 2 - h / 2) / m;
        var px = (u * ca - v * sa) * scale, py = (u * sa + v * ca) * scale;
        if (streak) { px *= 0.14; py *= 2.2; }
        px += ox; py += oy;
        var qx = fbm(px, py, 3), qy = fbm(px + 5.2, py + 1.3, 3);
        var rx = fbm(px + warp * qx + 1.7, py + warp * qy + 9.2, 3);
        var ry = fbm(px + warp * qx + 8.3, py + warp * qy + 2.8, 3);
        G[gy * gw + gx] = fbm(px + warp * rx, py + warp * ry, 4);
        GQ[gy * gw + gx] = Math.sqrt(qx * qx + qy * qy);
      }
    }
    function upsample() {
      function cr(a, b, c, d) { return (-a + 9 * b + 9 * c - d) / 16; }
      var T = new Float32Array(w * gh), x, c;
      for (var gy = 0; gy < gh; gy++) {
        var rr = gy * gw;
        for (x = 0; x < w; x++) {
          c = (x >> 1) + 1;
          T[gy * w + x] = x & 1 ? cr(G[rr + c - 1], G[rr + c], G[rr + c + 1], G[rr + c + 2]) : G[rr + c];
        }
      }
      for (var y = 0; y < h; y++) {
        c = (y >> 1) + 1;
        for (x = 0; x < w; x++) {
          F[y * w + x] = y & 1 ? cr(T[(c - 1) * w + x], T[c * w + x], T[(c + 1) * w + x], T[(c + 2) * w + x]) : T[c * w + x];
          var gx = (x >> 1) + 1;
          var q0 = GQ[c * gw + gx];
          var qx = x & 1 ? (q0 + GQ[c * gw + gx + 1]) / 2 : q0;
          var q1 = y & 1 ? (x & 1 ? (GQ[(c + 1) * gw + gx] + GQ[(c + 1) * gw + gx + 1]) / 2 : GQ[(c + 1) * gw + gx]) : qx;
          Q[y * w + x] = (qx + q1) / 2;
        }
      }
    }
    function colorize() {
      var sample = [], stride = Math.max(1, Math.floor(F.length / 4096)), i;
      for (i = 0; i < F.length; i += stride) sample.push(F[i]);
      sample.sort(function (a, b) { return a - b; });
      var lo = sample[Math.floor(sample.length * 0.02)], hi = sample[Math.floor(sample.length * 0.98)];
      var k = 1 / (hi - lo || 1);
      var lx = -0.55, ly = -0.65, lz = 0.52;
      var slope = k * m * 0.012;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          i = y * w + x;
          var t = (F[i] - lo) * k;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          var j = 1;
          while (j < stops.length - 1 && stops[j].t < t) j++;
          var a = stops[j - 1], b = stops[j];
          var f = (t - a.t) / (b.t - a.t || 1);
          f = f < 0 ? 0 : f > 1 ? 1 : f;
          f = f * f * (3 - 2 * f);
          var gx = (F[x < w - 1 ? i + 1 : i] - F[x > 0 ? i - 1 : i]) * slope;
          var gy = (F[y < h - 1 ? i + w : i] - F[y > 0 ? i - w : i]) * slope;
          var nd = (-gx * lx - gy * ly + lz) / Math.sqrt(gx * gx + gy * gy + 1);
          var spec = Math.pow(nd > 0 ? nd : 0, 24) * gloss * 255;
          var silk = 1 + 0.035 * Math.sin(t * 150 + Q[i] * 24);
          var vein = veins * Math.max(0, 1 - Math.abs(Q[i] - 0.42) * 14) * 0.6;
          var lit = (0.82 + 0.28 * nd) * silk * (1 - vein);
          pixels[i * 4] = (a.c[0] + (b.c[0] - a.c[0]) * f) * lit + spec;
          pixels[i * 4 + 1] = (a.c[1] + (b.c[1] - a.c[1]) * f) * lit + spec;
          pixels[i * 4 + 2] = (a.c[2] + (b.c[2] - a.c[2]) * f) * lit + spec;
          pixels[i * 4 + 3] = 255;
        }
      }
    }
    function step(rows) {
      if (row >= gh) return true;
      var end = Math.min(gh, row + Math.max(1, rows));
      while (row < end) field(row++);
      if (row < gh) return false;
      upsample();
      colorize();
      return true;
    }
    return { width: w, height: h, pixels: pixels, step: step };
  }
  function fanSlot(index, count) { return count <= 1 ? 0 : (index / (count - 1)) * 2 - 1; }
  // #endregion

  /* one shared painter: a few milliseconds a frame, so a row of folders never janks */
  var queue = [], pumping = false;
  function pump() {
    if (pumping) return;
    pumping = true;
    function tick() {
      var until = performance.now() + 7;
      while (queue.length && performance.now() < until) {
        var head = queue[0];
        if (head.job.step(4)) {
          queue.shift();
          head.done(head.job);
        }
      }
      if (queue.length) requestAnimationFrame(tick); else pumping = false;
    }
    requestAnimationFrame(tick);
  }
  function paintInto(canvas, recipe, seed, w, h) {
    queue.push({
      job: createArtJob(w, h, recipe, seed),
      done: function (job) {
        canvas.width = job.width; canvas.height = job.height;
        var ctx = canvas.getContext('2d');
        if (ctx) ctx.putImageData(new ImageData(job.pixels, job.width, job.height), 0, 0);
        canvas.setAttribute('data-ready', '');
      }
    });
    pump();
  }

  /* artwork in the site's own colours: deep indigo ink, coral, signal green */
  var ART = {
    odoo: { style: 'marble', colors: ['#0B0A1E', '#1E1B4B', '#3B3591', '#0F0E24', '#E04A2A', '#FF6B4A', '#FFD3C7'], scale: 0.66, warp: 3.3, angle: -0.5, gloss: 0.55, veins: 0.55 },
    watch: { style: 'streak', colors: ['#EAF4F1', '#9FD8C4', '#15803D', '#1E1B4B', '#1A1838', '#4FD1A0', '#F7F5F2'], scale: 0.7, warp: 1.5, angle: -0.62, gloss: 0.2, veins: 0 },
    ai: { style: 'marble', colors: ['#0F0E24', '#2E2B52', '#8E89D6', '#14123A', '#B5386A', '#FF6B4A', '#FFE4DC'], scale: 0.74, warp: 3.6, angle: 0.8, gloss: 0.5, veins: 0.5 }
  };

  var W = 340, H = 272, HEADROOM = 54, FRONT_TOP = 74, FRONT_H = H - FRONT_TOP;
  var BACK_PATH = 'M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z';
  var FRONT_PATH = 'M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 ' + (FRONT_H - 22) + 'A22 22 0 0 1 318 ' + FRONT_H + 'L22 ' + FRONT_H + 'A22 22 0 0 1 0 ' + (FRONT_H - 22) + 'Z';

  var CSS = [
    '.gf-root{--gf-px:0;--gf-py:0;--gf-ease:cubic-bezier(.2,.8,.2,1);--gf-spring:cubic-bezier(.34,1.36,.5,1);--gf-hinge:0deg;--gf-lift:42px;--gf-spread:0px;--gf-fan:0deg;--gf-stack:15px;--gf-ink:#1E1B4B;--gf-ink-soft:rgba(30,27,75,.6);',
    'position:relative;display:inline-block;flex:none;vertical-align:top;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;isolation:isolate}',
    '.gf-root[data-tone="dark"]{--gf-ink:#f5f5f7;--gf-ink-soft:rgba(245,245,247,.62)}',
    '.gf-root:hover,.gf-root:focus-within{--gf-hinge:-11deg;--gf-lift:-34px;--gf-spread:8px;--gf-fan:1.4deg;--gf-stack:10px}',
    '.gf-root[data-open]{--gf-hinge:-24deg;--gf-lift:-96px;--gf-spread:40px;--gf-fan:5deg;--gf-stack:30px}',
    '.gf-stage{position:absolute;left:0;top:0;width:340px;height:272px;transform-origin:0 0}',
    '.gf-tilt{position:absolute;inset:0;transform:perspective(1400px) rotateX(calc(var(--gf-py) * -3deg)) rotateY(calc(var(--gf-px) * 4deg));transition:transform .9s var(--gf-ease)}',
    '.gf-shadow{position:absolute;left:18px;right:18px;bottom:-6px;height:60px;border-radius:40px;background:rgba(16,18,24,.34);filter:blur(22px);transform:translateX(calc(var(--gf-px) * -8px));transition:transform .9s var(--gf-ease),opacity .9s var(--gf-ease)}',
    '.gf-root[data-tone="dark"] .gf-shadow{background:rgba(0,0,0,.62)}',
    '.gf-back{position:absolute;inset:0;overflow:hidden;background:linear-gradient(180deg,#f3f3f4 0%,#e3e3e6 100%);transition:translate 1s var(--gf-ease),opacity .9s var(--gf-ease)}',
    '.gf-root[data-tone="dark"] .gf-back{background:linear-gradient(180deg,#2a2a2e 0%,#121214 100%)}',
    '.gf-art{position:absolute;left:-12px;top:-12px;width:364px;height:296px;max-width:none;transform:translate(calc(var(--gf-px) * -7px),calc(var(--gf-py) * -6px)) scale(1.02);transition:transform 1.1s var(--gf-ease),opacity 1.2s var(--gf-ease),filter 1.2s var(--gf-ease);opacity:0;filter:blur(14px) saturate(.6)}',
    '.gf-art[data-ready]{opacity:1;filter:none}',
    '.gf-back-sheen{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 22%),radial-gradient(120% 80% at 80% 0%,rgba(255,255,255,.16),rgba(255,255,255,0) 60%);pointer-events:none}',
    '.gf-rim{position:absolute;left:0;top:0;max-width:none;overflow:visible;pointer-events:none;fill:none}',
    '.gf-back-rim{width:340px;height:272px;transition:translate 1s var(--gf-ease),opacity .9s var(--gf-ease)}',
    '.gf-back-rim path{stroke:rgba(255,255,255,.45);stroke-width:1}',
    '.gf-root[data-tone="dark"] .gf-back-rim path{stroke:rgba(255,255,255,.16)}',
    '.gf-files{position:absolute;inset:0;z-index:5;pointer-events:none;clip-path:inset(-400px -400px 10px -400px)}',
    '.gf-sheet-slot{display:contents}',
    '.gf-sheet{all:unset;box-sizing:border-box;position:absolute;left:34px;top:96px;width:272px;height:184px;border-radius:16px;overflow:hidden;cursor:pointer;pointer-events:auto;background:linear-gradient(180deg,#ffffff 0%,#f2f2f0 100%);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 0 0 .5px rgba(0,0,0,.1),0 10px 26px -8px rgba(10,12,20,.28);transform-origin:50% 100%;',
    'transform:translate(calc(var(--gf-jx) + var(--gf-slot) * var(--gf-spread)),calc(var(--gf-lift) + var(--gf-depth) * var(--gf-stack) * -1)) rotate(calc(var(--gf-jr) + var(--gf-slot) * var(--gf-fan)));',
    'transition:transform .75s var(--gf-spring) calc(var(--gf-depth) * 40ms),box-shadow .4s var(--gf-ease),translate .9s var(--gf-ease),opacity .9s var(--gf-ease)}',
    '.gf-root[data-tone="dark"] .gf-sheet{background:linear-gradient(180deg,#2c2c30 0%,#1c1c1f 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 0 0 .5px rgba(255,255,255,.08),0 12px 28px -8px rgba(0,0,0,.7)}',
    '.gf-root[data-open] .gf-sheet:hover,.gf-root[data-open] .gf-sheet:focus-visible{transform:translate(calc(var(--gf-jx) + var(--gf-slot) * var(--gf-spread)),calc(var(--gf-lift) + var(--gf-depth) * var(--gf-stack) * -1 - 18px)) rotate(calc(var(--gf-slot) * var(--gf-fan) * .6));',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 0 0 .5px rgba(0,0,0,.1),0 22px 40px -12px rgba(10,12,20,.42);transition-delay:0s}',
    '.gf-sheet:focus-visible{outline:3px solid #FF6B4A;outline-offset:2px}',
    '.gf-sheet-head{position:absolute;left:14px;right:14px;top:11px;z-index:1;display:flex;align-items:baseline;justify-content:space-between;gap:10px;white-space:nowrap}',
    '.gf-sheet-name{overflow:hidden;text-overflow:ellipsis;font-size:calc(12.5px / var(--gf-k,1));font-weight:650;color:#1E1B4B}',
    '.gf-sheet-meta{flex:none;font-size:calc(10.5px / var(--gf-k,1));color:rgba(30,27,75,.6)}',
    '.gf-root[data-tone="dark"] .gf-sheet-name{color:#fafafa}',
    '.gf-root[data-tone="dark"] .gf-sheet-meta{color:rgba(250,250,250,.66)}',
    '.gf-lines{position:absolute;left:14px;right:14px;top:46px;display:flex;flex-direction:column;gap:9px}',
    '.gf-lines i{display:block;height:5px;border-radius:3px;background:rgba(24,24,27,.08)}',
    '.gf-lines i:first-child{height:9px;margin-bottom:4px;background:rgba(255,107,74,.55)}',
    '.gf-root[data-tone="dark"] .gf-lines i{background:rgba(255,255,255,.08)}',
    '.gf-root[data-tone="dark"] .gf-lines i:first-child{background:rgba(255,107,74,.6)}',
    '.gf-front{position:absolute;left:0;top:74px;width:340px;height:198px;z-index:10;-webkit-backdrop-filter:blur(22px) saturate(1.5);backdrop-filter:blur(22px) saturate(1.5);transform-origin:50% 100%;transform:perspective(760px) rotateX(var(--gf-hinge));transition:transform .8s var(--gf-spring),translate 1s var(--gf-ease),opacity 1s var(--gf-ease)}',
    '.gf-tint{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,.5) 42%,rgba(252,252,252,.93) 100%)}',
    '.gf-root[data-tone="dark"] .gf-tint{background:linear-gradient(180deg,rgba(18,18,20,.18) 0%,rgba(14,14,16,.62) 46%,rgba(8,8,10,.94) 100%)}',
    '.gf-spec{position:absolute;inset:0;background:radial-gradient(260px 200px at calc(50% + var(--gf-px) * 46%) calc(30% + var(--gf-py) * 40%),rgba(255,255,255,.5),rgba(255,255,255,0) 70%);mix-blend-mode:soft-light;opacity:.9;pointer-events:none}',
    '.gf-root[data-tone="dark"] .gf-spec{mix-blend-mode:screen;opacity:.16}',
    '.gf-front-rim{width:340px;height:198px}',
    '.gf-front-rim path{stroke-width:2.4;transition:stroke-width .3s var(--gf-ease)}',
    '.gf-root[data-tone="dark"] .gf-front-rim{opacity:.55}',
    '.gf-hit{all:unset;position:absolute;inset:0;z-index:1;cursor:pointer}',
    '.gf-hit:focus-visible ~ .gf-label .gf-title{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}',
    '.gf-front:has(.gf-hit:focus-visible) .gf-front-rim path{stroke-width:5}',
    '.gf-label{position:absolute;z-index:2;left:28px;bottom:30px;display:flex;flex-direction:column;gap:5px;max-width:280px;pointer-events:none;color:var(--gf-ink)}',
    '.gf-title{font-family:var(--display,inherit);font-size:calc(17px / var(--gf-k,1));font-weight:700;line-height:1.15;white-space:nowrap}',
    '.gf-meta{font-size:calc(13.5px / var(--gf-k,1));color:var(--gf-ink-soft);white-space:nowrap}',
    '.gf-root:not([data-entered]) .gf-back,.gf-root:not([data-entered]) .gf-back-rim{translate:0 22px;opacity:0}',
    '.gf-root:not([data-entered]) .gf-sheet{translate:0 -120px;opacity:0}',
    '.gf-root:not([data-entered]) .gf-front{translate:0 46px;opacity:0}',
    '.gf-root:not([data-entered]) .gf-shadow{opacity:0}',
    '.gf-root[data-entered] .gf-sheet{transition-delay:calc(var(--gf-depth) * 40ms),0s,calc(.18s + var(--gf-depth) * 90ms),calc(.18s + var(--gf-depth) * 90ms)}',
    '.gf-root[data-entered] .gf-front{transition-delay:0s,.42s,.42s}',
    '@media (prefers-reduced-motion:reduce){.gf-root *,.gf-root *::before,.gf-root *::after{transition-duration:0s!important;transition-delay:0s!important;animation:none!important}.gf-tilt{transform:none}}'
  ].join('\n');

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var root = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* group the projects on the page into folders, keeping page order */
  var groups = [], byLabel = {};
  projects.forEach(function (p) {
    var label = p.getAttribute('data-folder') || 'Projects';
    if (!byLabel[label]) { byLabel[label] = { label: label, art: p.getAttribute('data-art') || 'odoo', items: [] }; groups.push(byLabel[label]); }
    byLabel[label].items.push(p);
    p.setAttribute('tabindex', '-1');
  });

  var count = document.getElementById('count');
  var showAllBtn = document.getElementById('show-all');
  var folders = [];

  /* with JS the list stays in the HTML (for search engines and no-JS readers) but is
     hidden; a file opens its project in a modal dialog instead */
  function show() {
    projects.forEach(function (p) { p.hidden = true; });
    if (count) count.textContent = 'Open a folder, then pick a file to read the project.';
    if (showAllBtn) showAllBtn.hidden = true;
  }
  function showAll() {
    folders.forEach(function (f) { f.setOpen(false); });
    show();
  }

  var modal = document.createElement('dialog');
  modal.className = 'pj-modal';
  modal.setAttribute('aria-labelledby', 'pj-modal-title');
  var modalClose = document.createElement('button');
  modalClose.type = 'button'; modalClose.className = 'pj-close'; modalClose.setAttribute('aria-label', 'Close project');
  modalClose.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var modalTag = document.createElement('p'); modalTag.className = 'pj-tag';
  var modalBody = document.createElement('div'); modalBody.className = 'pj-body';
  modal.appendChild(modalClose); modal.appendChild(modalTag); modal.appendChild(modalBody);
  /* inside the projects band so the page's .band styles (chips, flow) still apply */
  ((projects[0] && projects[0].closest('.band')) || document.body).appendChild(modal);
  var returnFocus = null;
  function closeProject() { if (modal.open) modal.close(); }
  modalClose.addEventListener('click', closeProject);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeProject(); });
  modal.addEventListener('close', function () {
    document.documentElement.classList.remove('pj-lock');
    modalBody.textContent = '';
    if (returnFocus) { returnFocus.focus({ preventScroll: true }); returnFocus = null; }
  });
  function openProject(p, from) {
    var clone = p.cloneNode(true);
    clone.hidden = false; clone.removeAttribute('tabindex'); clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    var h = clone.querySelector('h3'); if (h) h.id = 'pj-modal-title';
    modalTag.textContent = (p.getAttribute('data-folder') || 'Project') + (p.getAttribute('data-meta') ? ' · ' + p.getAttribute('data-meta') : '');
    modalBody.textContent = ''; modalBody.appendChild(clone);
    returnFocus = from || null;
    document.documentElement.classList.add('pj-lock');
    if (modal.showModal) modal.showModal(); else modal.setAttribute('open', '');
    modalBody.scrollTop = 0; modalClose.focus();
  }

  function buildFolder(group, index, width) {
    var k = width / W;
    var density = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1)) * k;
    var uid = 'gf' + index;
    var n = group.items.length;
    var metaText = n + (n === 1 ? ' project' : ' projects');

    var rootEl = el('div', 'gf-root');
    rootEl.setAttribute('data-tone', isDark() ? 'dark' : 'light');
    rootEl.style.width = width + 'px';
    rootEl.style.setProperty('--gf-k', k.toFixed(4));
    rootEl.style.height = (H + HEADROOM) * k + 'px';

    var stage = el('div', 'gf-stage');
    stage.style.transform = 'translateY(' + HEADROOM * k + 'px) scale(' + k + ')';
    var tilt = el('div', 'gf-tilt');
    var shadow = el('div', 'gf-shadow'); shadow.setAttribute('aria-hidden', 'true');

    var back = el('div', 'gf-back'); back.setAttribute('aria-hidden', 'true');
    back.style.clipPath = "path('" + BACK_PATH + "')";
    var art = el('canvas', 'gf-art');
    back.appendChild(art);
    back.appendChild(el('div', 'gf-back-sheen'));
    var backRim = svg('svg', { 'class': 'gf-rim gf-back-rim', viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' });
    backRim.appendChild(svg('path', { d: BACK_PATH }));

    var front = el('div', 'gf-front');
    front.style.clipPath = "path('" + FRONT_PATH + "')";
    var tint = el('div', 'gf-tint'); tint.setAttribute('aria-hidden', 'true');
    var spec = el('div', 'gf-spec'); spec.setAttribute('aria-hidden', 'true');
    var frontRim = svg('svg', { 'class': 'gf-rim gf-front-rim', viewBox: '0 0 ' + W + ' ' + FRONT_H, 'aria-hidden': 'true' });
    var defs = svg('defs', {});
    var lg = svg('linearGradient', { id: 'gf-rim-' + uid, x1: '0', y1: '0', x2: '0', y2: '1' });
    lg.appendChild(svg('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0.95' }));
    lg.appendChild(svg('stop', { offset: '0.35', 'stop-color': '#fff', 'stop-opacity': '0.35' }));
    lg.appendChild(svg('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0.12' }));
    defs.appendChild(lg); frontRim.appendChild(defs);
    frontRim.appendChild(svg('path', { d: FRONT_PATH, stroke: 'url(#gf-rim-' + uid + ')' }));
    var hit = el('button', 'gf-hit'); hit.type = 'button';
    var label = el('div', 'gf-label');
    label.appendChild(el('span', 'gf-title', group.label));
    label.appendChild(el('span', 'gf-meta', metaText));
    front.appendChild(tint); front.appendChild(spec); front.appendChild(frontRim); front.appendChild(hit); front.appendChild(label);

    var files = el('div', 'gf-files');
    files.setAttribute('role', 'list');
    files.setAttribute('aria-label', group.label + ' projects');
    group.items.forEach(function (p, v) {
      var name = p.getAttribute('data-short') || p.querySelector('h3').textContent;
      var meta = p.getAttribute('data-meta') || '';
      var slot = el('div', 'gf-sheet-slot'); slot.setAttribute('role', 'listitem');
      var sheet = el('button', 'gf-sheet'); sheet.type = 'button';
      var jitter = rng(hashString(name) + v);
      sheet.style.setProperty('--gf-slot', fanSlot(v, n));
      sheet.style.setProperty('--gf-depth', n - 1 - v);
      sheet.style.setProperty('--gf-jx', ((jitter() - 0.5) * 10).toFixed(2) + 'px');
      sheet.style.setProperty('--gf-jr', ((jitter() - 0.5) * 3.2).toFixed(2) + 'deg');
      sheet.style.zIndex = v + 1;
      var lines = el('span', 'gf-lines'); lines.setAttribute('aria-hidden', 'true');
      ['86%', '92%', '64%', '88%', '42%'].forEach(function (wd) { var i = el('i'); i.style.width = wd; lines.appendChild(i); });
      var head = el('span', 'gf-sheet-head');
      head.appendChild(el('span', 'gf-sheet-name', name));
      if (meta) head.appendChild(el('span', 'gf-sheet-meta', meta));
      sheet.appendChild(lines); sheet.appendChild(head);
      sheet.addEventListener('click', function () { openProject(p, sheet); });
      slot.appendChild(sheet); files.appendChild(slot);
    });

    tilt.appendChild(shadow); tilt.appendChild(back); tilt.appendChild(backRim); tilt.appendChild(front); tilt.appendChild(files);
    stage.appendChild(tilt); rootEl.appendChild(stage);

    var open = false;
    function setOpen(next) {
      open = next;
      if (open) rootEl.setAttribute('data-open', ''); else rootEl.removeAttribute('data-open');
      hit.setAttribute('aria-expanded', open ? 'true' : 'false');
      hit.setAttribute('aria-label', (open ? 'Close ' : 'Open ') + group.label + ', ' + metaText);
      if (open) files.removeAttribute('inert'); else files.setAttribute('inert', '');
    }
    setOpen(false);
    hit.addEventListener('click', function () {
      if (open) { showAll(); return; }
      folders.forEach(function (f) { if (f.setOpen !== setOpen) f.setOpen(false); });
      setOpen(true);
    });
    rootEl.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open && !modal.open) { showAll(); hit.focus(); }
    });

    /* light and parallax follow the cursor */
    var raf = 0, px = 0, py = 0;
    function write() { raf = 0; rootEl.style.setProperty('--gf-px', px.toFixed(3)); rootEl.style.setProperty('--gf-py', py.toFixed(3)); }
    rootEl.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = rootEl.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) * 2 - 1;
      py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(write);
    });
    rootEl.addEventListener('pointerleave', function () { px = 0; py = 0; if (!raf) raf = requestAnimationFrame(write); });

    /* assemble the first time the folder is on screen */
    function enter() { rootEl.setAttribute('data-entered', ''); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!entries.some(function (e) { return e.isIntersecting; })) return;
        io.disconnect();
        setTimeout(enter, index * 140);
      }, { threshold: 0.25 });
      io.observe(rootEl);
    } else { enter(); }

    paintInto(art, ART[group.art] || ART.odoo, 3 + index * 4, Math.round((W + 24) * density), Math.round((H + 24) * density));

    return { el: rootEl, setOpen: setOpen, retone: function () { rootEl.setAttribute('data-tone', isDark() ? 'dark' : 'light'); } };
  }

  function folderWidth() {
    var avail = host.clientWidth || 320;
    if (avail < 560) return Math.min(320, avail);
    var per = Math.floor((avail - 28 * (groups.length - 1)) / groups.length);
    return Math.max(220, Math.min(300, per));
  }
  function render() {
    host.textContent = '';
    folders = groups.map(function (g, i) { return buildFolder(g, i, folderWidth()); });
    folders.forEach(function (f) { host.appendChild(f.el); });
  }

  render();
  host.hidden = false;
  showAll();
  if (showAllBtn) showAllBtn.addEventListener('click', showAll);
  document.addEventListener('themechange', function () { folders.forEach(function (f) { f.retone(); }); });

  var lastAvail = host.clientWidth, resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (Math.abs(host.clientWidth - lastAvail) < 24) return;
      lastAvail = host.clientWidth;
      render(); showAll();
    }, 200);
  });
})();
