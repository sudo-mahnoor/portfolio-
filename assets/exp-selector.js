/*
 * Experience selector: one tall panel per job. The chosen panel widens and shows the
 * job; the others shrink to slim strips with an icon and the company name.
 * Written from scratch for this site (an expanding-panels pattern); no library.
 * It is built from the .job blocks in the HTML, which are what shows without JavaScript.
 */
(function () {
  'use strict';
  var section = document.getElementById('work');
  if (!section) return;
  var jobs = [].slice.call(section.querySelectorAll('.job'));
  if (jobs.length < 2) return;
  var list = jobs[0].parentNode;

  var ICONS = {
    ops: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7l8-4z"/><path d="M9 12l2 2 4-4"/></svg>',
    mkt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3l6 4V6L7 10H4z"/><path d="M17 9a4 4 0 010 6M19.5 6.5a8 8 0 010 11"/></svg>'
  };
  var ART = ['xp-art-a', 'xp-art-b', 'xp-art-c'];

  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function text(n) { return n ? n.textContent.trim() : ''; }

  var root = el('div', 'xp');
  var panels = [];
  jobs.forEach(function (job, i) {
    var h3 = job.querySelector('h3');
    var full = text(h3), cut = full.lastIndexOf(', ');
    var role = cut > 0 ? full.slice(0, cut) : full, company = cut > 0 ? full.slice(cut + 2) : '';
    var when = text(job.querySelector('.when')).replace(' to present', ' – now').replace(' to ', ' – ');
    var where = text(job.querySelector('.where'));
    var paras = [].slice.call(job.querySelectorAll(':scope > div:last-child > p:not(.where)'));
    var bullets = [].slice.call(job.querySelectorAll('details li'));
    var icon = /marketing/i.test(role) ? ICONS.mkt : (i === 0 ? ICONS.ops : ICONS.mail);

    var panel = el('article', 'xp-panel ' + ART[i % ART.length]);
    panel.style.setProperty('--i', i);
    var id = 'xp-body-' + i;

    var head = el('button', 'xp-head');
    head.type = 'button';
    head.setAttribute('aria-controls', id);
    head.appendChild(el('span', 'xp-icon', icon));
    var strip = el('span', 'xp-strip'); strip.textContent = company || role;
    head.appendChild(strip);
    var titles = el('span', 'xp-titles');
    var w = el('span', 'xp-when'); w.textContent = when; titles.appendChild(w);
    var r = el('span', 'xp-role'); r.textContent = role; titles.appendChild(r);
    var c = el('span', 'xp-co'); c.textContent = company + (where ? ' · ' + where : ''); titles.appendChild(c);
    head.appendChild(titles);

    var body = el('div', 'xp-body'); body.id = id;
    var inner = el('div', 'xp-inner');
    paras.forEach(function (p) { var q = el('p', 'xp-lede'); q.textContent = p.textContent; inner.appendChild(q); });
    if (bullets.length) {
      var ul = el('ul', 'xp-list');
      bullets.forEach(function (li) { var x = el('li'); x.textContent = li.textContent; ul.appendChild(x); });
      inner.appendChild(ul);
    }
    body.appendChild(inner);

    panel.appendChild(el('span', 'xp-grid')); /* faint blueprint grid */
    panel.appendChild(head);
    panel.appendChild(body);
    root.appendChild(panel);
    panels.push({ el: panel, head: head, body: body });

    head.addEventListener('click', function () { select(i); });
  });

  function select(n) {
    panels.forEach(function (p, i) {
      var on = i === n;
      p.el.classList.toggle('is-active', on);
      p.head.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) p.body.removeAttribute('inert'); else p.body.setAttribute('inert', '');
    });
  }

  /* arrow keys move between panels */
  root.addEventListener('keydown', function (e) {
    var i = panels.map(function (p) { return p.head; }).indexOf(document.activeElement);
    if (i < 0) return;
    var next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    next = (next + panels.length) % panels.length;
    panels[next].head.focus(); select(next);
  });

  list.parentNode.replaceChild(root, list);
  section.classList.add('has-xp');
  select(0);

  /* panels rise in one after another the first time the section is seen */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting) return;
      io.disconnect(); root.classList.add('is-in');
    }, { threshold: 0.2 });
    io.observe(root);
  } else { root.classList.add('is-in'); }
})();
