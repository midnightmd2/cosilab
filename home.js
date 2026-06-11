/* COSI Lab — homepage motion (calm editorial). All entrances are .from()
   tweens: if GSAP fails to load or reduced motion is set, everything
   simply stays visible in its final state. */
(function () {
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduced) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* Lenis <-> ScrollTrigger */
  if (window.__lenis) {
    window.__lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { window.__lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* Hero intro — wait for fonts so SplitText measures real metrics.
     The mask wrappers get descender padding while animating, and the
     split is reverted afterward so no clipping can persist at rest. */
  function intro() {
    var split = new SplitText('.hero-title', { type: 'lines', mask: 'lines', linesClass: 'hero-line' });
    split.lines.forEach(function (line) {
      var m = line.parentNode;
      if (m && m !== line.closest('.hero-title')) {
        m.style.paddingBottom = '0.15em';
        m.style.marginBottom = '-0.15em';
      }
    });
    gsap.from(split.lines, {
      yPercent: 135, duration: 1.05, stagger: 0.1, ease: 'power3.out', delay: 0.08,
      onComplete: function () { split.revert(); }
    });
    gsap.from('.hero-ed .lede, .hero-ed .hero-ctas', { y: 22, autoAlpha: 0, duration: 0.85, stagger: 0.12, delay: 0.5, ease: 'power3.out' });
    gsap.from('.focus-cell', { y: 18, autoAlpha: 0, duration: 0.7, stagger: 0.07, delay: 0.7, ease: 'power3.out' });
  }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(intro); } else { intro(); }

  /* Calm section reveals */
  gsap.from('.manifesto p', {
    y: 28, autoAlpha: 0, duration: 0.85, stagger: 0.18, ease: 'power2.out',
    scrollTrigger: { trigger: '.manifesto', start: 'top 78%' }
  });
  gsap.from('#research .section-head, #research .thesis', {
    y: 26, autoAlpha: 0, duration: 0.75, stagger: 0.1, ease: 'power2.out',
    scrollTrigger: { trigger: '#research', start: 'top 80%' }
  });
  gsap.from('#research .program', {
    y: 26, autoAlpha: 0, duration: 0.6, stagger: 0.06, ease: 'power2.out',
    scrollTrigger: { trigger: '#research .program', start: 'top 88%' }
  });
  gsap.from('#work .section-head', {
    y: 22, autoAlpha: 0, duration: 0.65, ease: 'power2.out',
    scrollTrigger: { trigger: '#work', start: 'top 82%' }
  });
  gsap.from('#work .work-card', {
    y: 30, autoAlpha: 0, duration: 0.7, stagger: 0.09, ease: 'power2.out',
    scrollTrigger: { trigger: '#work .work-grid', start: 'top 86%' }
  });
  gsap.from('.home-cta h2, .home-cta .inv', {
    y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out',
    scrollTrigger: { trigger: '.home-cta', start: 'top 84%' }
  });
  ScrollTrigger.refresh();
})();
