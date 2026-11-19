/*
 * Liquid FAQ: one coloured "pool" of liquid sits behind frosted-glass questions.
 * Opening a question pulls the pool to it: the leading edge races ahead, the trailing edge
 * lags, so it stretches and pinches like a drop, then pours down as the answer opens.
 * Closing drains it back into the + button.
 * Written from scratch for this site after the idea of gughigug's "Liquid Glass Accordion"
 * on 21st.dev (MIT); no WebGL, no library: springs + CSS backdrop blur.
 * The <details> markup stays as it is, so it works without JavaScript.
 */
(function () {
  'use strict';
  var section = document.getElementById('faq');
  if (!section) return;
  var items = [].slice.call(section.querySelectorAll('details'));
  if (!items.length) return;
  var list = items[0].parentNode;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  section.classList.add('has-lq');
  list.classList.add('lq-list');
  var pool = document.createElement('div');
  pool.className = 'lq-pool';
  pool.setAttribute('aria-hidden', 'true');
  list.insertBefore(pool, list.firstChild);

  items.forEach(function (d) {
    var summary = d.querySelector('summary');
    var plus = document.createElement('span');
    plus.className = 'lq-plus';
    plus.setAttribute('aria-hidden', 'true');
    summary.appendChild(plus);
    /* wrap the answer so its height can animate */
    var ans = document.createElement('div');
    ans.className = 'lq-ans';
    while (summary.nextSibling) ans.appendChild(summary.nextSibling);
    d.appendChild(ans);
    d._plus = plus; d._ans = ans;
    if (!d.open) ans.style.height = '0px';
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      if (d.open) close(d); else { items.forEach(function (o) { if (o !== d && o.open) close(o); }); open(d); }
      kick();
    });
  });
  /* only one open at a time to begin with */
  var firstOpen = items.filter(function (d) { return d.open; })[0];
  items.forEach(function (d) { if (d.open && d !== firstOpen) { d.open = false; d._ans.style.height = '0px'; } });

  function open(d) {
    var ans = d._ans;
    d.open = true;
    ans.style.height = '0px';
    var h = ans.scrollHeight;
    requestAnimationFrame(function () { ans.style.height = h + 'px'; });
    ans.addEventListener('transitionend', function done(e) {
      if (e.propertyName !== 'height') return;
      ans.removeEventListener('transitionend', done);
      if (d.open) ans.style.height = 'auto';
    });
  }
  function close(d) {
    var ans = d._ans;
    ans.style.height = ans.scrollHeight + 'px';
    d.classList.add('lq-closing');
    requestAnimationFrame(function () { requestAnimationFrame(function () { ans.style.height = '0px'; }); });
    ans.addEventListener('transitionend', function done(e) {
      if (e.propertyName !== 'height') return;
      ans.removeEventListener('transitionend', done);
      d.classList.remove('lq-closing');
      if (ans.style.height === '0px') d.open = false;
    });
  }

  /* springs for each edge of the pool */
  function Spring(k) { this.x = 0; this.v = 0; this.k = k; }
  Spring.prototype.step = function (to, dt) {
    var f = -this.k * (this.x - to) - 2 * Math.sqrt(this.k) * 0.82 * this.v;
    this.v += f * dt; this.x += this.v * dt;
    return Math.abs(this.x - to) + Math.abs(this.v) * 0.02;
  };
  var T = new Spring(120), B = new Spring(120), L = new Spring(170), R = new Spring(170), O = new Spring(90);
  var lastTop = null;

  function target() {
    var lr = list.getBoundingClientRect();
    var d = items.filter(function (x) { return x.open && !x.classList.contains('lq-closing'); })[0];
    if (d) {
      var r = d.getBoundingClientRect();
      return { t: r.top - lr.top, b: r.bottom - lr.top, l: r.left - lr.left, r: r.right - lr.left, o: 1 };
    }
    /* nothing open: drain into the + of the last item that was open */
    var src = items.filter(function (x) { return x.classList.contains('lq-closing'); })[0] || lastItem || items[0];
    var p = src._plus.getBoundingClientRect();
    var cx = p.left + p.width / 2 - lr.left, cy = p.top + p.height / 2 - lr.top, s = 14;
    return { t: cy - s, b: cy + s, l: cx - s, r: cx + s, o: 0 };
  }
  var lastItem = firstOpen || null;
  items.forEach(function (d) { d.querySelector('summary').addEventListener('click', function () { lastItem = d; }); });

  function snap() {
    var g = target();
    T.x = g.t; B.x = g.b; L.x = g.l; R.x = g.r; O.x = g.o; T.v = B.v = L.v = R.v = O.v = 0;
    draw();
  }
  function draw() {
    var h = Math.max(0, B.x - T.x), w = Math.max(0, R.x - L.x);
    /* pinch: the faster the pool travels, the narrower its waist */
    var speed = Math.abs(T.v - B.v) * 0.012 + Math.abs(T.v + B.v) * 0.004;
    var pinch = Math.min(w * 0.12, speed * 6);
    pool.style.transform = 'translate3d(' + (L.x + pinch).toFixed(1) + 'px,' + T.x.toFixed(1) + 'px,0)';
    pool.style.width = Math.max(0, w - pinch * 2).toFixed(1) + 'px';
    pool.style.height = h.toFixed(1) + 'px';
    pool.style.borderRadius = Math.min(26, h / 2, w / 2).toFixed(1) + 'px';
    pool.style.opacity = Math.max(0, Math.min(1, O.x)).toFixed(3);
  }

  var raf = 0, last = 0;
  function frame(ts) {
    raf = 0;
    var dt = last ? Math.min(0.033, (ts - last) / 1000) : 0.016; last = ts;
    var g = target();
    /* the edge moving toward the new question leads, the other lags behind */
    var down = g.t > (lastTop == null ? g.t : lastTop);
    T.k = down ? 70 : 190; B.k = down ? 190 : 70;
    if (g.o === 0) { T.k = B.k = 150; }
    var rest = T.step(g.t, dt) + B.step(g.b, dt) + L.step(g.l, dt) + R.step(g.r, dt) + O.step(g.o, dt) * 40;
    draw();
    if (rest > 0.3) raf = requestAnimationFrame(frame); else { last = 0; lastTop = g.t; }
  }
  function kick() {
    if (reduce) { requestAnimationFrame(function () { setTimeout(snap, 460); snap(); }); return; }
    lastTop = T.x;
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }

  snap();
  window.addEventListener('resize', snap);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(snap);
})();
