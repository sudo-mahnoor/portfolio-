/*
 * Stack corridor: a full-width 3D corridor with two perspective walls, the tools from
 * "The stack I run" flying toward the viewer in an endless loop.
 * Written from scratch for this site after the idea of Weblisy's "Endless" on 21st.dev
 * (MIT). No library: CSS 3D transforms + requestAnimationFrame.
 * The tile names are read from the .layer cards on the page, so the content lives in HTML
 * once; without JavaScript only the cards show.
 */
(function () {
  'use strict';
  var section = document.getElementById('skills');
  if (!section) return;
  var layers = [].slice.call(section.querySelectorAll('.layer'));
  if (!layers.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* tiles: one per tool, tagged with its layer number */
  var items = [];
  layers.forEach(function (layer, li) {
    var group = layer.querySelector('h3').textContent;
    [].forEach.call(layer.querySelectorAll('.chips li'), function (chip) {
      items.push({ name: chip.textContent.replace(/^AWS: .*/, 'AWS'), group: group, n: li + 1 });
    });
  });

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  var root = el('div', 'sc');
  root.setAttribute('aria-hidden', 'true');
  var view = el('div', 'sc-view');
  var scene = el('div', 'sc-scene');
  view.appendChild(scene);
  root.appendChild(view);
  root.appendChild(el('div', 'sc-fog'));

  /* the heading sits over the vanishing point */
  var wrap = section.querySelector('.wrap');
  var h2 = wrap.querySelector('h2'), intro = wrap.querySelector('.intro');
  var over = el('div', 'sc-over');
  over.setAttribute('aria-hidden', 'false');
  if (h2) over.appendChild(h2);
  if (intro) over.appendChild(intro);
  section.insertBefore(root, wrap);
  section.insertBefore(over, wrap);
  section.classList.add('has-sc');

  /* place tiles: left / right wall, top / bottom row, evenly spread along the depth */
  var tiles = [];
  items.forEach(function (it, i) {
    var t = el('div', 'sc-tile');
    t.appendChild(el('span', 'sc-num', (it.n < 10 ? '0' : '') + it.n + ' · ' + it.group));
    t.appendChild(el('span', 'sc-name', it.name));
    scene.appendChild(t);
    tiles.push({ el: t, side: i % 2 ? 1 : -1, row: (i >> 1) % 2, slot: i });
  });

  var DEPTH, NEAR, X, ROWY, SPEED = 95; /* px per second */
  function measure() {
    var w = root.clientWidth, h = root.clientHeight;
    var small = w < 640;
    DEPTH = small ? 2600 : 3400;
    NEAR = small ? 420 : 560;
    X = Math.max(small ? 150 : 300, w * (small ? 0.36 : 0.38));
    ROWY = small ? [-h * 0.17, h * 0.17] : [-h * 0.19, h * 0.19];
    view.style.perspective = (small ? 520 : 760) + 'px';
  }

  var offset = 0;
  function place() {
    var n = tiles.length;
    tiles.forEach(function (t) {
      /* z runs from -DEPTH (far) to NEAR (passing the viewer), then wraps */
      var span = DEPTH + NEAR;
      var z = (t.slot * (span / n) + offset) % span - DEPTH;
      var far = (z + DEPTH) / span;                 /* 0 far .. 1 near */
      var fade = Math.min(1, far * 3.2) * Math.min(1, (NEAR - z) / 260);
      t.el.style.opacity = fade.toFixed(3);
      t.el.style.transform = 'translate3d(' + (t.side * X) + 'px,' + ROWY[t.row] + 'px,' + z.toFixed(1) + 'px) rotateY(' + (t.side * -72) + 'deg)';
    });
  }

  measure(); place();

  var running = false, last = 0, raf = 0, hover = false, speedNow = SPEED;
  function frame(ts) {
    raf = 0;
    if (!running) return;
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
    var target = hover ? SPEED * 0.25 : SPEED;          /* slow down while pointed at */
    speedNow += (target - speedNow) * Math.min(1, dt * 3);
    offset += speedNow * dt;
    place();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running || reduce) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }, { threshold: 0.05 }).observe(root);
  } else { start(); }
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  section.addEventListener('pointerenter', function () { hover = true; });
  section.addEventListener('pointerleave', function () { hover = false; });

  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { measure(); place(); }, 150); });
})();
