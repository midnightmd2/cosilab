/* COSI Lab — shared interactions. Each feature is independent and degrades
   gracefully: with JS off, all content stays visible and unfiltered. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Smooth scrolling (Lenis). On the homepage GSAP's ticker drives it
     (see home.js); on other pages we run our own rAF loop. */
  function initLenis() {
    if (reduce || !window.Lenis) return;
    try {
      var lenis = new Lenis({ duration: 1.05 });
      window.__lenis = lenis;
      if (!window.gsap) {
        var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    } catch (e) {}
  }
  initLenis();

  function initReveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    if (document.body.classList.contains('home') && window.gsap) return;
    var sel = '.program, .work-card, .rd, .problem, .level, .member, .pub, .step, .collab, .news-item, .pi-feature, .section-head, .figure-card';
    var els = Array.prototype.slice.call(document.querySelectorAll(sel));
    els.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = ((i % 6) * 60) + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  function initPubFilter() {
    var pf = document.getElementById('pub-filters');
    if (!pf) return;
    var groups = Array.prototype.slice.call(document.querySelectorAll('.pub-group'));
    pf.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      var area = b.getAttribute('data-area');
      pf.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('on', c === b); });
      groups.forEach(function (g) {
        var show = (area === 'all' || g.getAttribute('data-area') === area);
        g.style.display = show ? '' : 'none';
        if (show) g.querySelectorAll('.reveal').forEach(function (x) { x.classList.add('in'); });
      });
    });
  }

  function initNav() {
    var t = document.querySelector('.nav-toggle');
    var links = document.getElementById('primary-nav');
    if (!t || !links) return;
    t.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initReveal();
    initPubFilter();
  });
})();

/* cursor-tracking light on cards (CSS vars consumed by ::after) */
(function () {
  if (!matchMedia('(pointer:fine)').matches) return;
  document.querySelectorAll('.work-card, .level').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  });
})();
