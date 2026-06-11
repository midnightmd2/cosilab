/* COSI Lab — homepage motion (GSAP + Lenis). All entrance animations use
   .from() tweens, so if GSAP fails to load or reduced motion is on,
   every element simply stays visible in its final state. */
(function () {
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('header');
  var hero = document.querySelector('.hero-dark');

  /* Header: transparent over the dark hero, solid past it (functional,
     so it runs regardless of motion preference). */
  if (header && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      header.classList.toggle('over-hero', e[0].isIntersecting);
    }, { rootMargin: '-90px 0px 0px 0px', threshold: 0 }).observe(hero);
  }

  if (!window.gsap || reduced) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* Lenis <-> ScrollTrigger */
  if (window.__lenis) {
    window.__lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { window.__lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* Hero intro — wait for fonts so SplitText measures real metrics */
  function intro() {
    var split = new SplitText('.hero-title', { type: 'lines', mask: 'lines', linesClass: 'hero-line' });
    gsap.from(split.lines, { yPercent: 118, duration: 1.2, stagger: 0.09, ease: 'power4.out', delay: 0.12 });
    gsap.from('.hero-dark .lede', { y: 26, autoAlpha: 0, duration: 0.95, delay: 0.6, ease: 'power3.out' });
    gsap.from('.hero-ctas .btn', { y: 18, autoAlpha: 0, duration: 0.7, delay: 0.82, stagger: 0.09, ease: 'power3.out' });
    gsap.from('.scroll-hint', { autoAlpha: 0, duration: 0.9, delay: 1.35 });
  }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(intro); } else { intro(); }

  /* Scroll choreography */
  gsap.from('#research .section-head, #research .thesis', {
    y: 34, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '#research', start: 'top 78%' }
  });
  gsap.from('#research .program', {
    y: 40, autoAlpha: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out',
    scrollTrigger: { trigger: '#research .program', start: 'top 86%' }
  });
  gsap.from('#work .section-head', {
    y: 30, autoAlpha: 0, duration: 0.7, ease: 'power3.out',
    scrollTrigger: { trigger: '#work', start: 'top 80%' }
  });
  gsap.from('#work .work-card', {
    y: 46, autoAlpha: 0, duration: 0.8, stagger: 0.11, ease: 'power3.out',
    scrollTrigger: { trigger: '#work .work-grid', start: 'top 84%' }
  });
  gsap.from('.home-cta .band-grid > *', {
    y: 32, autoAlpha: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.home-cta', start: 'top 82%' }
  });
  ScrollTrigger.refresh();

  /* Magnetic CTAs — desktop fine pointers only */
  if (matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * 0.28,
          y: (e.clientY - r.top - r.height / 2) * 0.34,
          duration: 0.4, ease: 'power3.out'
        });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.45)' });
      });
    });
  }
})();
