/* ============================================================
   COSI Lab — generated technical figures (brand motif)
   No stock imagery. Each figure draws into an <svg id="...">.
   ============================================================ */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function mk(svg, t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; }
  function grid(svg, w, h) {
    for (var gx = 25; gx <= w - 15; gx += 50) mk(svg, 'line', { x1: gx, y1: 10, x2: gx, y2: h - 35, stroke: '#EDF0F3', 'stroke-width': 0.7 });
    for (var gy = 15; gy <= h - 35; gy += 50) mk(svg, 'line', { x1: 15, y1: gy, x2: w - 15, y2: gy, stroke: '#EDF0F3', 'stroke-width': 0.7 });
  }

  /* Femoral-head finite element mesh with stress annotations */
  function femoralMesh(svg) {
    var w = 300, h = 250; grid(svg, w, h);
    var cx = 150, cy = 118, rings = [18, 38, 58, 78], pts = [[[cx, cy]]];
    rings.forEach(function (r, ri) {
      var n = 8 + ri * 6, ring = [];
      for (var i = 0; i < n; i++) { var a = (Math.PI * 2 * i) / n - Math.PI / 2; ring.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
      pts.push(ring);
    });
    for (var r = 1; r < pts.length; r++) {
      var ring = pts[r], prev = pts[r - 1];
      for (var i = 0; i < ring.length; i++) {
        var p = ring[i], q = ring[(i + 1) % ring.length];
        mk(svg, 'line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: '#052049', 'stroke-width': 0.6, opacity: 0.45 });
        var m = prev[Math.round(i * prev.length / ring.length) % prev.length];
        mk(svg, 'line', { x1: p[0], y1: p[1], x2: m[0], y2: m[1], stroke: '#052049', 'stroke-width': 0.55, opacity: 0.3 });
      }
    }
    var hot = pts[2];
    for (var i = 1; i < 5; i++) {
      var p = hot[i], q = hot[(i + 1) % hot.length], m = pts[1][Math.round(i * pts[1].length / hot.length) % pts[1].length];
      mk(svg, 'polygon', { points: p[0] + ',' + p[1] + ' ' + q[0] + ',' + q[1] + ' ' + m[0] + ',' + m[1], fill: '#18A3AC', opacity: 0.3, 'class': 'stress-pulse' });
    }
    mk(svg, 'circle', { cx: cx, cy: cy, r: 78, fill: 'none', stroke: '#052049', 'stroke-width': 1.1 });
    mk(svg, 'path', { d: 'M 52 45 A 118 118 0 0 1 248 45', fill: 'none', stroke: '#052049', 'stroke-width': 0.9, 'stroke-dasharray': '4 4', opacity: 0.55 });
    mk(svg, 'line', { x1: cx + 55, y1: cy - 55, x2: 262, y2: 34, stroke: '#058488', 'stroke-width': 0.8 });
    mk(svg, 'circle', { cx: cx + 55, cy: cy - 55, r: 2.2, fill: '#058488' });
    var t1 = mk(svg, 'text', { x: 262, y: 29, 'text-anchor': 'end', 'font-size': '10', 'font-family': 'SF Mono, Menlo, monospace', fill: '#058488' }); t1.textContent = 'peak stress region';
    mk(svg, 'line', { x1: cx - 72, y1: cy + 38, x2: 32, y2: 196, stroke: '#506380', 'stroke-width': 0.8 });
    mk(svg, 'circle', { cx: cx - 72, cy: cy + 38, r: 2.2, fill: '#506380' });
    var t2 = mk(svg, 'text', { x: 32, y: 208, 'font-size': '10', 'font-family': 'SF Mono, Menlo, monospace', fill: '#506380' }); t2.textContent = 'elements n=14,202';
    mk(svg, 'line', { x1: 72, y1: 228, x2: 228, y2: 228, stroke: '#052049', 'stroke-width': 0.8 });
    mk(svg, 'line', { x1: 72, y1: 223, x2: 72, y2: 233, stroke: '#052049', 'stroke-width': 0.8 });
    mk(svg, 'line', { x1: 228, y1: 223, x2: 228, y2: 233, stroke: '#052049', 'stroke-width': 0.8 });
    var t3 = mk(svg, 'text', { x: 150, y: 244, 'text-anchor': 'middle', 'font-size': '10', 'font-family': 'SF Mono, Menlo, monospace', fill: '#506380' }); t3.textContent = '48.2 mm';
  }

  /* Load-displacement curves: native vs scaffold-augmented construct */
  function loadCurve(svg) {
    var w = 300, h = 250; grid(svg, w, h);
    var ox = 46, oy = 205, pw = 230, ph = 165;
    mk(svg, 'line', { x1: ox, y1: oy, x2: ox + pw, y2: oy, stroke: '#052049', 'stroke-width': 1 });
    mk(svg, 'line', { x1: ox, y1: oy, x2: ox, y2: oy - ph, stroke: '#052049', 'stroke-width': 1 });
    var yl = mk(svg, 'text', { x: 14, y: oy - ph / 2, 'font-size': '10', 'font-family': 'SF Mono, Menlo, monospace', fill: '#506380', transform: 'rotate(-90 14 ' + (oy - ph / 2) + ')', 'text-anchor': 'middle' }); yl.textContent = 'load (N)';
    var xl = mk(svg, 'text', { x: ox + pw / 2, y: 240, 'font-size': '10', 'font-family': 'SF Mono, Menlo, monospace', fill: '#506380', 'text-anchor': 'middle' }); xl.textContent = 'displacement (mm)';
    function curve(k, color, dash, peak) {
      var d = 'M ' + ox + ' ' + oy, n = 40;
      for (var i = 1; i <= n; i++) {
        var x = i / n, X = ox + x * pw;
        var y = peak * (1 - Math.exp(-k * x)) * (x < 0.86 ? 1 : 1 - (x - 0.86) * 3.4);
        var Y = oy - Math.max(0, y) * ph;
        d += ' L ' + X.toFixed(1) + ' ' + Y.toFixed(1);
      }
      mk(svg, 'path', { d: d, fill: 'none', stroke: color, 'stroke-width': 1.7, 'stroke-dasharray': dash || 'none' });
    }
    curve(3.4, '#9BA6B6', '4 3', 0.62);
    curve(4.6, '#058488', null, 0.92);
    mk(svg, 'circle', { cx: ox + pw * 0.86, cy: oy - 0.92 * ph, r: 2.6, fill: '#058488' });
    var a1 = mk(svg, 'text', { x: ox + pw * 0.86 - 6, y: oy - 0.92 * ph - 8, 'font-size': '9.5', 'font-family': 'SF Mono, Menlo, monospace', fill: '#058488', 'text-anchor': 'end' }); a1.textContent = 'augmented · failure';
    var a2 = mk(svg, 'text', { x: ox + pw * 0.78, y: oy - 0.50 * ph + 16, 'font-size': '9.5', 'font-family': 'SF Mono, Menlo, monospace', fill: '#506380', 'text-anchor': 'end' }); a2.textContent = 'native repair';
  }

  /* Robotic TKA: planned vs measured gap across coronal deformity */
  function gapPlot(svg) {
    var w = 300, h = 250; grid(svg, w, h);
    var ox = 46, oy = 205, pw = 230, ph = 165;
    mk(svg, 'line', { x1: ox, y1: oy, x2: ox + pw, y2: oy, stroke: '#052049', 'stroke-width': 1 });
    mk(svg, 'line', { x1: ox, y1: oy, x2: ox, y2: oy - ph, stroke: '#052049', 'stroke-width': 1 });
    var yl = mk(svg, 'text', { x: 14, y: oy - ph / 2, 'font-size': '10', 'font-family': 'SF Mono, Menlo, monospace', fill: '#506380', transform: 'rotate(-90 14 ' + (oy - ph / 2) + ')', 'text-anchor': 'middle' }); yl.textContent = 'medial gap (mm)';
    var xl = mk(svg, 'text', { x: ox + pw / 2, y: 240, 'font-size': '10', 'font-family': 'SF Mono, Menlo, monospace', fill: '#506380', 'text-anchor': 'middle' }); xl.textContent = 'native coronal deformity (deg)';
    mk(svg, 'line', { x1: ox, y1: oy - 0.5 * ph, x2: ox + pw, y2: oy - 0.5 * ph, stroke: '#052049', 'stroke-width': 0.8, 'stroke-dasharray': '4 3', opacity: 0.5 });
    var pl = mk(svg, 'text', { x: ox + pw - 2, y: oy - 0.5 * ph - 6, 'font-size': '9.5', 'font-family': 'SF Mono, Menlo, monospace', fill: '#506380', 'text-anchor': 'end' }); pl.textContent = 'robot-planned gap';
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 26; i++) {
      var dx = rnd(), under = dx * 0.34 + (rnd() - 0.5) * 0.12;
      var X = ox + 12 + dx * (pw - 24);
      var Y = oy - 0.5 * ph + under * ph;
      mk(svg, 'circle', { cx: X.toFixed(1), cy: Y.toFixed(1), r: 2.6, fill: '#18A3AC', opacity: 0.78 });
    }
    mk(svg, 'path', { d: 'M ' + (ox + 12) + ' ' + (oy - 0.5 * ph) + ' L ' + (ox + pw - 12) + ' ' + (oy - 0.5 * ph + 0.34 * ph), fill: 'none', stroke: '#058488', 'stroke-width': 1.6 });
    var tr = mk(svg, 'text', { x: ox + pw - 14, y: oy - 0.5 * ph + 0.34 * ph + 14, 'font-size': '9.5', 'font-family': 'SF Mono, Menlo, monospace', fill: '#058488', 'text-anchor': 'end' }); tr.textContent = 'measured · underpredicted';
  }

  /* progressive draw-in: each element fades on with a small stagger */
  function animateIn(svg) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var kids = Array.prototype.slice.call(svg.children);
    kids.forEach(function (el, i) {
      var target = el.getAttribute('opacity') || 1;
      el.style.opacity = 0;
      el.style.transition = 'opacity 0.5s ease ' + (i * 12) + 'ms';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.style.opacity = target; });
      });
    });
  }

  function clear(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }

  var FIG = { femoralMesh: femoralMesh, loadCurve: loadCurve, gapPlot: gapPlot };
  function draw(svg, name) { var fn = FIG[name]; if (fn) { clear(svg); fn(svg); animateIn(svg); } }

  /* Interactive gap figure: a slider moves along the deformity axis and shows
     how the measured medial gap diverges from the robot's planned gap. */
  function initIGap(svg) {
    var range = document.getElementById('igap-range');
    var val = document.getElementById('igap-val');
    var out = document.getElementById('igap-readout');
    var w = 300, h = 250, ox = 46, oy = 205, pw = 230, ph = 165;
    function render(d) {
      clear(svg); grid(svg, w, h);
      mk(svg, 'line', { x1: ox, y1: oy, x2: ox + pw, y2: oy, stroke: '#052049', 'stroke-width': 1 });
      mk(svg, 'line', { x1: ox, y1: oy, x2: ox, y2: oy - ph, stroke: '#052049', 'stroke-width': 1 });
      var yl = mk(svg, 'text', { x: 14, y: oy - ph / 2, 'font-size': '10', 'font-family': 'SF Mono, Menlo, monospace', fill: '#506380', transform: 'rotate(-90 14 ' + (oy - ph / 2) + ')', 'text-anchor': 'middle' }); yl.textContent = 'medial gap (mm)';
      var xl = mk(svg, 'text', { x: ox + pw / 2, y: 240, 'font-size': '10', 'font-family': 'SF Mono, Menlo, monospace', fill: '#506380', 'text-anchor': 'middle' }); xl.textContent = 'native coronal deformity (deg)';
      var yPlan = oy - 0.42 * ph;
      mk(svg, 'line', { x1: ox, y1: yPlan, x2: ox + pw, y2: yPlan, stroke: '#506380', 'stroke-width': 0.9, 'stroke-dasharray': '4 3', opacity: 0.7 });
      var pl = mk(svg, 'text', { x: ox + pw - 2, y: yPlan - 6, 'font-size': '9.5', 'font-family': 'SF Mono, Menlo, monospace', fill: '#506380', 'text-anchor': 'end' }); pl.textContent = 'robot-planned gap';
      mk(svg, 'path', { d: 'M ' + ox + ' ' + yPlan + ' L ' + (ox + pw) + ' ' + (oy - 0.84 * ph), fill: 'none', stroke: '#058488', 'stroke-width': 1.6, opacity: 0.45 });
      var frac = d / 15, X = ox + frac * pw, yMeas = oy - (0.42 + 0.42 * frac) * ph;
      mk(svg, 'line', { x1: X, y1: oy, x2: X, y2: yMeas, stroke: '#18A3AC', 'stroke-width': 0.9, 'stroke-dasharray': '2 2' });
      mk(svg, 'circle', { cx: X, cy: yPlan, r: 3, fill: '#506380' });
      var dot = mk(svg, 'circle', { cx: X, cy: yMeas, r: 3.8, fill: '#058488' });
      if (frac > 0) {
        var ml = mk(svg, 'text', { x: X, y: yMeas - 9, 'font-size': '9.5', 'font-family': 'SF Mono, Menlo, monospace', fill: '#058488', 'text-anchor': 'middle' }); ml.textContent = 'measured';
      }
    }
    function update() {
      var d = parseInt(range.value, 10);
      val.textContent = d + '°';
      render(d);
      var under = (d * 0.18).toFixed(1);
      out.innerHTML = d === 0
        ? 'At <strong>0°</strong> of deformity, the planned and measured medial gap agree.'
        : 'At <strong>' + d + '°</strong> of native deformity, the robot underpredicts the medial gap by about <strong>' + under + ' mm</strong>.';
    }
    if (range) { range.addEventListener('input', update); update(); } else { render(6); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('svg[data-figure]').forEach(function (svg) {
      var fn = FIG[svg.getAttribute('data-figure')];
      if (fn) { fn(svg); animateIn(svg); }
    });

    var sw = document.querySelector('.fig-switch');
    if (sw) {
      var fig = document.getElementById('hero-fig');
      var cap = document.getElementById('hero-cap');
      var caps = {
        femoralMesh: 'Patient-specific finite element model of a gluteus medius repair construct.',
        loadCurve: 'Load to failure: native repair versus scaffold-augmented construct (schematic).',
        gapPlot: 'Robotic knee replacement: measured medial gap versus the planned gap (schematic).'
      };
      sw.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var name = b.getAttribute('data-fig');
        if (fig) draw(fig, name);
        if (cap) cap.textContent = caps[name] || '';
        sw.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    }

    var ig = document.getElementById('igap');
    if (ig) initIGap(ig);
  });
})();
