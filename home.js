/* COSI Lab — homepage motion.
   All entrances are .from() tweens: if GSAP fails to load or reduced
   motion is set, everything stays visible in its final state. */
(function () {
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduced) return;

  gsap.registerPlugin(ScrollTrigger);

  /* Native scroll — ScrollTrigger reads the browser's own scroll position. */

  /* Hero intro — plain rise/fade on the two headline lines (no masks,
     so descenders can never be clipped) */
  gsap.from('.hero-title .hl-line', { y: 44, autoAlpha: 0, filter: 'blur(7px)', duration: 1.05, stagger: 0.12, ease: 'power3.out', delay: 0.05, clearProps: 'filter' });
  gsap.from('.hero-ed .lede, .hero-ed .hero-ctas', { y: 22, autoAlpha: 0, duration: 0.85, stagger: 0.12, delay: 0.45, ease: 'power3.out' });

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
