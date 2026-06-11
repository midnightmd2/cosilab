/* COSI Lab — homepage motion + procedural hero figure.
   All entrances are .from() tweens: if GSAP fails to load or reduced
   motion is set, everything stays visible in its final state. The hero
   figure is generated below and renders complete without JS animation. */
(function () {
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- hero figure: procedural femur blueprint ---------- */
  function buildFemur() {
    var svg = document.getElementById('femur-svg');
    if (!svg) return null;
    var NS = 'http://www.w3.org/2000/svg';
    var W = 520, H = 660;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var g = document.createElementNS(NS, 'g');
    svg.appendChild(g);
    var slices = [];
    function add(x, y, rx, rot) {
      var e = document.createElementNS(NS, 'ellipse');
      e.setAttribute('cx', x); e.setAttribute('cy', y);
      e.setAttribute('rx', rx); e.setAttribute('ry', Math.max(4.5, rx * 0.3));
      if (rot) e.setAttribute('transform', 'rotate(' + rot + ' ' + x + ' ' + y + ')');
      e.setAttribute('pathLength', '100');
      g.appendChild(e);
      slices.push({ el: e, y: y });
    }
    /* center/radius profile along the bone, head -> condyles */
    function profile(t) {
      /* head: offset sphere upper-left; neck: diagonal; shaft: bowed; condyles: flare */
      if (t < 0.16) {                       /* head */
        var th = t / 0.16;
        var y = 78 + th * 64;
        var R = 44 * Math.sin(Math.acos(Math.min(1, Math.abs(1 - th * 2))));
        return { x: 168, y: y, rx: Math.max(10, R), ry: 0.34 };
      }
      if (t < 0.30) {                       /* neck */
        var tn = (t - 0.16) / 0.14;
        return { x: 178 + tn * 86, y: 140 + tn * 48, rx: 27 - 5 * Math.sin(tn * Math.PI), ry: 0.30 };
      }
      if (t < 0.78) {                       /* shaft */
        var ts = (t - 0.30) / 0.48;
        var bump = ts < 0.12 ? (1 - ts / 0.12) * 9 : 0;   /* greater trochanter */
        return { x: 266 + Math.sin(ts * Math.PI) * 8 + bump, y: 190 + ts * 282, rx: 25 - 6 * Math.sin(ts * Math.PI * 0.9) + bump, ry: 0.26 };
      }
      var tc = (t - 0.78) / 0.22;           /* condyles */
      return { x: 268, y: 474 + tc * 96, rx: 28 + 38 * Math.sin(tc * Math.PI * 0.6), ry: 0.30 };
    }

    var COUNT = 44, pts = [];
    for (var i = 0; i < COUNT; i++) {
      var p = profile(i / (COUNT - 1));
      var e = document.createElementNS(NS, 'ellipse');
      e.setAttribute('cx', p.x); e.setAttribute('cy', p.y);
      e.setAttribute('rx', p.rx); e.setAttribute('ry', Math.max(4, p.rx * p.ry));
      e.setAttribute('pathLength', '100');
      g.appendChild(e);
      slices.push({ el: e, y: p.y });
      pts.push(p);
    }
    /* silhouette curves bind the slices into one form */
    function sil(side) {
      var d = '';
      for (var k = 0; k < pts.length; k++) {
        var px = pts[k].x + side * pts[k].rx;
        d += (k ? ' L ' : 'M ') + px.toFixed(1) + ' ' + pts[k].y.toFixed(1);
      }
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', 'sil');
      path.setAttribute('pathLength', '100');
      g.appendChild(path);
      return path;
    }
    sil(-1); sil(1);

    /* scan band + line (kept to the bone's width) */
    var band = document.createElementNS(NS, 'rect');
    band.setAttribute('x', 110); band.setAttribute('width', 290);
    band.setAttribute('height', 26); band.setAttribute('y', -60);
    band.setAttribute('fill', '#4150DE'); band.setAttribute('opacity', '0.07');
    var line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', 110); line.setAttribute('x2', 400);
    line.setAttribute('y1', -60); line.setAttribute('y2', -60);
    line.setAttribute('class', 'scanline');
    svg.appendChild(band); svg.appendChild(line);
    return { g: g, slices: slices, band: band, line: line, H: H };
  }

  var fig = buildFemur();

  function setScan(y) {
    if (!fig) return;
    fig.line.setAttribute('y1', y); fig.line.setAttribute('y2', y);
    fig.band.setAttribute('y', y - 13);
    for (var i = 0; i < fig.slices.length; i++) {
      var s = fig.slices[i];
      if (Math.abs(s.y - y) < 17) { s.el.classList.add('lit'); }
      else { s.el.classList.remove('lit'); }
    }
  }

  /* Static fallbacks: figure fully drawn, scan resting mid-shaft */
  if (!window.gsap || reduced) { setScan(330); return; }

  gsap.registerPlugin(ScrollTrigger);

  /* Lenis <-> ScrollTrigger */
  if (window.__lenis) {
    window.__lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { window.__lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* Hero intro — plain rise/fade on the two headline lines (no masks,
     so descenders can never be clipped) */
  gsap.from('.hero-title .hl-line', { y: 44, autoAlpha: 0, duration: 1.0, stagger: 0.12, ease: 'power3.out', delay: 0.05 });
  gsap.from('.hero-ed .lede, .hero-ed .hero-ctas', { y: 22, autoAlpha: 0, duration: 0.85, stagger: 0.12, delay: 0.45, ease: 'power3.out' });

  if (fig) {
    /* contour draw-on */
    gsap.from(fig.slices.map(function (s) { return s.el; }), {
      strokeDashoffset: 100, autoAlpha: 0, duration: 0.9, stagger: 0.016,
      ease: 'power2.out', delay: 0.35
    });
    gsap.from('.ann', { autoAlpha: 0, x: -8, duration: 0.7, stagger: 0.15, delay: 1.25, ease: 'power2.out' });

    /* imaging-scan sweep */
    var scan = { y: 64 };
    gsap.to(scan, {
      y: fig.H - 70, duration: 5.5, ease: 'sine.inOut', repeat: -1, yoyo: true,
      delay: 1.2, onUpdate: function () { setScan(scan.y); }
    });

    /* gentle parallax (fine pointers only) */
    if (matchMedia('(pointer:fine)').matches) {
      window.addEventListener('mousemove', function (e) {
        var nx = e.clientX / window.innerWidth - 0.5;
        var ny = e.clientY / window.innerHeight - 0.5;
        gsap.to(fig.g, {
          x: nx * 10, y: ny * 8, rotation: nx * 2.2,
          transformOrigin: '50% 50%', duration: 0.9, ease: 'power2.out', overwrite: 'auto'
        });
      }, { passive: true });
    }
  }

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
