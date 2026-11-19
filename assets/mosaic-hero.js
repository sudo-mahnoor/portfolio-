/*!
 * Mosaic hero: a living WebGL mosaic sky, a headline set in a pixel face drawn in code,
 * and a glass prompt box that turns a project description into an email.
 *
 * Adapted to plain JavaScript (no React, no GSAP) from "Mosaic Prompt Template"
 * by Kedhareswer Naidu, https://kedhar.pages.dev
 *
 * MIT License
 * Copyright (c) 2026 Kedhareswer Naidu
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function () {
  'use strict';
  var hero = document.getElementById('top');
  if (!hero) return;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var SVGNS = 'http://www.w3.org/2000/svg';
  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ---------- pixel face: rows top to bottom, # lit ---------- */
  var GLYPHS = {
    A: '.###./#...#/#...#/#####/#...#/#...#/#...#', B: '####./#...#/#...#/####./#...#/#...#/####.',
    C: '.###./#...#/#..../#..../#..../#...#/.###.', D: '####./#...#/#...#/#...#/#...#/#...#/####.',
    E: '#####/#..../#..../####./#..../#..../#####', F: '#####/#..../#..../####./#..../#..../#....',
    G: '.###./#...#/#..../#.###/#...#/#...#/.####', H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
    I: '###/.#./.#./.#./.#./.#./###', J: '..###/...#./...#./...#./...#./#..#./.##..',
    K: '#...#/#..#./#.#../##.../#.#../#..#./#...#', L: '#..../#..../#..../#..../#..../#..../#####',
    M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#', N: '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
    O: '.###./#...#/#...#/#...#/#...#/#...#/.###.', P: '####./#...#/#...#/####./#..../#..../#....',
    Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#', R: '####./#...#/#...#/####./#.#../#..#./#...#',
    S: '.####/#..../#..../.###./....#/....#/####.', T: '#####/..#../..#../..#../..#../..#../..#..',
    U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.', V: '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
    W: '#...#/#...#/#...#/#.#.#/#.#.#/#.#.#/.#.#.', X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
    Y: '#...#/#...#/.#.#./..#../..#../..#../..#..', Z: '#####/....#/...#./..#../.#.../#..../#####',
    a: '...../...../.###./....#/.####/#...#/.####', b: '#..../#..../####./#...#/#...#/#...#/####.',
    c: '..../..../.###/#.../#.../#.../.###', d: '....#/....#/.####/#...#/#...#/#...#/.####',
    e: '...../...../.###./#...#/#####/#..../.###.', f: '.##/#../###/#../#../#../#..',
    g: '...../...../.####/#...#/#...#/.####/....#/.###.', h: '#..../#..../####./#...#/#...#/#...#/#...#',
    i: '#/./#/#/#/#/#', j: '..#/.../..#/..#/..#/..#/..#/##.', k: '#.../#.../#..#/#.#./##../#.#./#..#',
    l: '#./#./#./#./#./#./.#', m: '...../...../##.#./#.#.#/#.#.#/#...#/#...#',
    n: '...../...../####./#...#/#...#/#...#/#...#', o: '...../...../.###./#...#/#...#/#...#/.###.',
    p: '...../...../####./#...#/#...#/####./#..../#....', q: '...../...../.####/#...#/#...#/.####/....#/....#',
    r: '..../..../#.##/##../#.../#.../#...', s: '...../...../.####/#..../.###./....#/####.',
    t: '.#../.#../####/.#../.#../.#../..##', u: '...../...../#...#/#...#/#...#/#...#/.####',
    v: '...../...../#...#/#...#/#...#/.#.#./..#..', w: '...../...../#...#/#...#/#.#.#/#.#.#/.#.#.',
    x: '...../...../#...#/.#.#./..#../.#.#./#...#', y: '...../...../#...#/#...#/#...#/.####/....#/.###.',
    z: '...../...../#####/...#./..#../.#.../#####'
  };
  var ICONS = {
    window: '#######/#.#.#.#/#######/#.....#/#.....#/#.....#/#######',
    bars: '......#/....#.#/....#.#/..#.#.#/..#.#.#/#.#.#.#/#######',
    bolt: '....##./...##../..##.../.######/...##../..##.../.##....',
    rocket: '...#.../..###../..#.#../..###../.#####./#.###.#/..#.#..',
    chat: '#######/#.....#/#.#.#.#/#.....#/#######/.##..../.#.....',
    arrow: '...#.../..###../.#.#.#./#..#..#/...#.../...#.../...#...',
    down: '...#.../...#.../...#.../#..#..#/.#.#.#./..###../...#...'
  };

  function layoutPixels(text) {
    var glyphs = [], x = 0;
    for (var c = 0; c < text.length; c++) {
      var ch = text[c], g = GLYPHS[ch] || GLYPHS[ch.toUpperCase()];
      if (!g) { x += 3; continue; }
      var rows = g.split('/'), w = 0, cells = [];
      rows.forEach(function (r, y) {
        if (r.length > w) w = r.length;
        for (var i = 0; i < r.length; i++) if (r[i] === '#') cells.push([x + i, y]);
      });
      glyphs.push({ cells: cells });
      x += w + 1;
    }
    return { width: Math.max(1, x - 1), height: 8, glyphs: glyphs };
  }
  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function pixelText(lay, wmax) {
    var vw = lay.width + 1, vh = lay.height + 1;
    var svg = svgEl('svg', { 'class': 'px-svg', viewBox: '-0.5 -0.5 ' + vw + ' ' + vh, 'aria-hidden': 'true', focusable: 'false' });
    svg.style.setProperty('--w', vw);
    svg.style.setProperty('--wmax', wmax || vw);
    svg.style.aspectRatio = vw + ' / ' + vh;
    lay.glyphs.forEach(function (g) {
      var group = svgEl('g', { 'class': 'px-g' });
      g.cells.forEach(function (c) {
        group.appendChild(svgEl('rect', { 'class': 'px', x: c[0] + 0.06, y: c[1] + 0.06, width: 0.88, height: 0.88, rx: 0.16 }));
      });
      svg.appendChild(group);
    });
    return svg;
  }
  function pixelIcon(name) {
    var svg = svgEl('svg', { viewBox: '0 0 7 7', 'aria-hidden': 'true', focusable: 'false' });
    (ICONS[name] || ICONS.bolt).split('/').forEach(function (r, y) {
      for (var x = 0; x < r.length; x++) if (r[x] === '#') svg.appendChild(svgEl('rect', { x: x + 0.08, y: y + 0.08, width: 0.84, height: 0.84, rx: 0.12 }));
    });
    return svg;
  }

  /* ---------- the headline ---------- */
  var h1 = hero.querySelector('.mz-h1');
  var lineEls = [].slice.call(hero.querySelectorAll('.px-line'));
  var lays = lineEls.map(function (l) { return layoutPixels(l.getAttribute('data-text') || ''); });
  var wmax = Math.max.apply(null, lays.map(function (l) { return l.width + 1; }));
  var svgs = lineEls.map(function (l, i) { var s = pixelText(lays[i], wmax); l.appendChild(s); return s; });
  var rects = [], groups = [];
  svgs.forEach(function (s) {
    [].forEach.call(s.querySelectorAll('rect'), function (r) {
      rects.push({ el: r, x: +r.getAttribute('x'), y: +r.getAttribute('y'), svg: s, off: false });
    });
    [].forEach.call(s.querySelectorAll('.px-g'), function (g) {
      groups.push({ el: g, x: rand(-3, 3), y: rand(-14, -4), rot: rand(-30, 30), start: Math.random() * 0.5 });
    });
  });

  /* ---------- prompt box icons ---------- */
  [].forEach.call(hero.querySelectorAll('[data-icon]'), function (n) { n.insertBefore(pixelIcon(n.getAttribute('data-icon')), n.firstChild); });

  /* ---------- the sky ---------- */
  var VERT = 'attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}';
  var FRAG = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uPtr;uniform float uPtrOn;uniform vec3 uAccent;',
    'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }',
    'float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return v; }',
    'vec3 mosaic(vec2 frag){',
    '  float cell = max(uRes.y / 30.0, 9.0);',
    '  vec2 id = floor(frag / cell); vec2 f = fract(frag / cell);',
    '  vec2 p = (id + 0.5) * cell / uRes.y; float ax = uRes.x / uRes.y; float t = uTime * 0.07;',
    '  vec2 l1 = vec2(ax * 0.5 + 0.38 * sin(t * 2.1), 0.56 + 0.14 * cos(t * 1.7));',
    '  vec2 l2 = vec2(ax * 0.5 - 0.55 * cos(t * 1.3), 0.2 + 0.1 * sin(t * 2.3));',
    '  vec2 l3 = vec2(ax * 0.5 + 0.62 * cos(t * 0.9 + 2.0), 0.86 + 0.08 * sin(t * 1.1));',
    '  float L = 0.62 * exp(-2.6 * dot(p - l1, p - l1)) + 0.42 * exp(-3.8 * dot(p - l2, p - l2)) + 0.3 * exp(-5.0 * dot(p - l3, p - l3));',
    '  L += uPtrOn * 0.5 * exp(-14.0 * dot(p - uPtr, p - uPtr));',
    '  float n = fbm(p * 3.0 + vec2(t * 1.6, -t * 1.1)); L *= 0.45 + n;',
    '  float h = hash(id); L *= 0.8 + 0.28 * sin(uTime * (0.5 + h * 1.4) + h * 40.0);',
    '  L = clamp(L, 0.0, 1.0); L = floor(L * 8.0 + h * 0.6) / 8.0;',
    '  vec2 q = abs(f - 0.5); float tile = smoothstep(0.47, 0.41, max(q.x, q.y));',
    '  vec3 cool = vec3(0.50, 0.70, 0.74); vec3 warm = vec3(0.96, 0.86, 0.66);',
    '  vec3 col = mix(cool, warm, smoothstep(0.25, 0.75, n)) * L * 0.6;',
    '  col = mix(col, uAccent * L * 0.75, 0.2 * L);',
    '  col *= tile * (0.82 + 0.36 * f.y);',
    '  return col + vec3(0.008, 0.016, 0.018);',
    '}',
    'void main(){',
    '  vec2 frag = gl_FragCoord.xy; vec3 col = mosaic(frag);',
    '  vec2 uv = frag / uRes; float vig = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(1.0, 1.15)));',
    '  col *= 0.55 + 0.45 * vig; col += (hash(frag + fract(uTime)) - 0.5) / 255.0;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  var sky = hero.querySelector('.mz-sky');
  var skyState = { ptr: [0, 0], ptrOn: 0, dirty: true };
  (function startSky() {
    if (!sky) return;
    var canvas = document.createElement('canvas');
    sky.appendChild(canvas);
    var gl = null;
    try { gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (!gl) { canvas.remove(); hero.setAttribute('data-sky', 'fallback'); return; }
    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { gl.deleteShader(sh); return null; }
      return sh;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG), prog = gl.createProgram();
    if (!vs || !fs) { canvas.remove(); hero.setAttribute('data-sky', 'fallback'); return; }
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); hero.setAttribute('data-sky', 'fallback'); return; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {
      res: gl.getUniformLocation(prog, 'uRes'), time: gl.getUniformLocation(prog, 'uTime'),
      ptr: gl.getUniformLocation(prog, 'uPtr'), ptrOn: gl.getUniformLocation(prog, 'uPtrOn'),
      accent: gl.getUniformLocation(prog, 'uAccent')
    };
    gl.uniform3f(U.accent, 1.0, 0.70, 0.12); // marigold
    hero.setAttribute('data-sky', 'webgl');

    var w = 0, h = 0;
    function size() {
      var r = sky.getBoundingClientRect();
      var scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75; // the mosaic hides the lower resolution
      w = Math.max(1, Math.round(r.width * scale));
      h = Math.max(1, Math.round(r.height * scale));
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      skyState.dirty = true;
      kick();
    }
    var visible = true, raf = 0, t0 = performance.now(), ptrOn = 0;
    function frame(now) {
      raf = 0;
      if (!visible) return;
      if (reduce && !skyState.dirty) return;
      skyState.dirty = false;
      ptrOn += (skyState.ptrOn - ptrOn) * 0.08;
      gl.uniform2f(U.res, w, h);
      gl.uniform1f(U.time, reduce ? 12.0 : (now - t0) / 1000);
      gl.uniform2f(U.ptr, skyState.ptr[0], skyState.ptr[1]);
      gl.uniform1f(U.ptrOn, reduce ? 0 : ptrOn);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(sky); else window.addEventListener('resize', size);
    size();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { skyState.dirty = true; kick(); } }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { visible = document.visibilityState === 'visible'; if (visible) kick(); });
    hero.addEventListener('pointermove', function (e) {
      var r = sky.getBoundingClientRect();
      skyState.ptr = [(e.clientX - r.left) / r.height, (r.bottom - e.clientY) / r.height];
      skyState.ptrOn = 1;
    });
    hero.addEventListener('pointerleave', function () { skyState.ptrOn = 0; });
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); canvas.remove(); hero.setAttribute('data-sky', 'fallback'); });
  })();

  /* ---------- choreography ---------- */
  var wrap = hero.querySelector('.mz-composer-wrap');
  var cue = hero.querySelector('.mz-cue');
  var introDone = reduce;

  function startShimmer() {
    if (reduce || !rects.length) return;
    (function shimmer() {
      for (var i = 0; i < 7; i++) {
        (function (r, k) {
          setTimeout(function () { r.el.classList.add('is-lit'); }, k * 90);
          setTimeout(function () { r.el.classList.remove('is-lit'); }, 900 + k * 90);
        })(rects[Math.floor(Math.random() * rects.length)], i);
      }
      setTimeout(shimmer, rand(1800, 3200));
    })();
  }

  function startRepel() {
    if (reduce || !h1) return;
    var last = { x: -1e4, y: -1e4 }, pending = 0, RADIUS = 3.4;
    function repel() {
      pending = 0;
      var boxes = svgs.map(function (s) {
        var r = s.getBoundingClientRect();
        return { r: r, unit: r.width / (s.viewBox.baseVal.width || 1) };
      });
      rects.forEach(function (p) {
        var b = boxes[svgs.indexOf(p.svg)];
        var ux = (last.x - b.r.left) / b.unit - 0.5, uy = (last.y - b.r.top) / b.unit - 0.5;
        var dx = p.x + 0.44 - ux, dy = p.y + 0.44 - uy, d = Math.sqrt(dx * dx + dy * dy);
        if (d < RADIUS) {
          var push = (1 - d / RADIUS) * 1.5, nx = d ? dx / d : 0, ny = d ? dy / d : -1;
          p.off = true;
          p.el.classList.add('is-off');
          p.el.style.translate = (nx * push).toFixed(3) + 'px ' + (ny * push).toFixed(3) + 'px';
        } else if (p.off) {
          p.off = false;
          p.el.classList.remove('is-off');
          p.el.style.translate = '';
        }
      });
    }
    h1.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      last = { x: e.clientX, y: e.clientY };
      if (!pending) pending = requestAnimationFrame(repel);
    });
    h1.addEventListener('pointerleave', function () {
      last = { x: -1e4, y: -1e4 };
      if (!pending) pending = requestAnimationFrame(repel);
    });
  }

  if (!reduce) {
    // intro: the pixels fly in from everywhere and assemble the name
    rects.forEach(function (p) {
      p.el.style.transform = 'translate(' + rand(-40, 40).toFixed(2) + 'px,' + rand(-26, 26).toFixed(2) + 'px) scale(' + rand(0, 2.4).toFixed(2) + ')';
      p.el.style.opacity = '0';
    });
    hero.classList.add('mz-intro');
    void hero.offsetWidth;
    requestAnimationFrame(function () {
      rects.forEach(function (p) {
        var d = Math.round(Math.random() * 750);
        p.el.style.transition = 'transform 1.5s cubic-bezier(.16,1,.3,1) ' + d + 'ms, opacity 1.5s cubic-bezier(.16,1,.3,1) ' + d + 'ms';
        p.el.style.transform = '';
        p.el.style.opacity = '';
      });
      setTimeout(function () { hero.classList.remove('mz-intro'); }, 550);
      setTimeout(function () {
        rects.forEach(function (p) { p.el.style.transition = ''; });
        hero.classList.add('mz-settled');
        introDone = true;
        startRepel();
        onScroll();
      }, 2350);
      setTimeout(startShimmer, 2400);
    });
  } else {
    hero.classList.add('mz-settled');
  }

  // leaving the hero: the glyphs scatter upward one by one, the prompt box sinks back
  var scrollRaf = 0;
  function applyScroll() {
    scrollRaf = 0;
    if (!introDone || reduce) return;
    var p = clamp01(window.scrollY / Math.max(1, hero.offsetHeight));
    groups.forEach(function (g) {
      var e = clamp01((p - g.start) / 0.5); e = e * e;
      g.el.style.transform = e ? 'translate(' + (g.x * e).toFixed(2) + 'px,' + (g.y * e).toFixed(2) + 'px) rotate(' + (g.rot * e).toFixed(1) + 'deg)' : '';
      g.el.style.opacity = e ? (1 - e).toFixed(3) : '';
    });
    if (wrap) {
      var k = clamp01((p - 0.15) / 0.85); k = k * k;
      wrap.style.transform = k ? 'translateY(' + (-80 * k).toFixed(1) + 'px) scale(' + (1 - 0.08 * k).toFixed(4) + ')' : '';
      wrap.style.opacity = k ? (1 - k).toFixed(3) : '';
    }
    if (cue) {
      var c = clamp01(p * 3);
      cue.style.opacity = c ? (1 - c).toFixed(3) : '';
      cue.style.transform = c ? 'translateY(' + (20 * c).toFixed(1) + 'px)' : '';
    }
  }
  function onScroll() { if (!scrollRaf) scrollRaf = requestAnimationFrame(applyScroll); }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- the prompt box ---------- */
  var form = document.getElementById('ask');
  if (!form) return;
  var input = document.getElementById('ask-text');
  var field = form.querySelector('.mz-field');
  var ph = document.getElementById('ask-ph');
  var send = form.querySelector('.mz-send');
  var status = document.getElementById('ask-status');
  var composer = form.querySelector('.mz-composer');
  var chips = [].slice.call(form.querySelectorAll('.mz-chip'));
  var EMAIL = form.getAttribute('data-email');
  var prompts = (form.getAttribute('data-prompts') || '').split('|').filter(Boolean);

  // the placeholder types the example requests out, then deletes them again
  if (ph && prompts.length) {
    if (reduce) {
      ph.textContent = prompts[0];
    } else {
      var pi = 0, n = 0, back = false;
      var tick = function () {
        var full = prompts[pi % prompts.length];
        if (!back) {
          n++;
          ph.textContent = full.slice(0, n);
          if (n >= full.length) { back = true; setTimeout(tick, 2200); return; }
          setTimeout(tick, 26 + Math.random() * 40);
        } else {
          n = Math.max(0, n - 3);
          ph.textContent = full.slice(0, n);
          if (n === 0) { back = false; pi++; setTimeout(tick, 380); return; }
          setTimeout(tick, 14);
        }
      };
      setTimeout(tick, 1400);
    }
  }

  function grow() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 180) + 'px';
  }
  function sync() {
    var has = input.value.trim().length > 0;
    if (input.value.length) field.setAttribute('data-filled', ''); else field.removeAttribute('data-filled');
    send.setAttribute('data-ready', has ? 'true' : 'false');
    grow();
  }
  input.addEventListener('input', sync);
  sync();

  // area chips: a radio group with arrow keys
  function check(i, focus) {
    chips.forEach(function (c, k) {
      c.setAttribute('aria-checked', k === i ? 'true' : 'false');
      c.tabIndex = k === i ? 0 : -1;
    });
    if (focus) chips[i].focus();
  }
  chips.forEach(function (c, i) {
    c.addEventListener('click', function () { check(i); });
    c.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      check((i + d + chips.length) % chips.length, true);
    });
  });
  var start = chips.findIndex(function (c) { return c.getAttribute('aria-checked') === 'true'; });
  check(start < 0 ? 0 : start);

  function nudge() {
    if (reduce) return;
    composer.removeAttribute('data-nudge');
    void composer.offsetWidth;
    composer.setAttribute('data-nudge', 'true');
  }
  composer.addEventListener('animationend', function () { composer.removeAttribute('data-nudge'); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) {
      nudge();
      status.textContent = 'Describe the project first, then send it.';
      input.focus();
      return;
    }
    var chosen = chips.filter(function (c) { return c.getAttribute('aria-checked') === 'true'; })[0];
    var area = chosen ? chosen.getAttribute('data-value') : 'DevOps';
    var href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Project enquiry: ' + area) + '&body=' + encodeURIComponent(text + '\n\n(Sent from mahnoordevops.me)');
    status.textContent = 'Opening your email app with this message. If nothing opens, write to ' + EMAIL + '.';
    window.location.href = href;
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });
})();
