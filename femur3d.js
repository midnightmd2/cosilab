/* COSI Lab — hero proximal femur as a stack of imaging slices.
   100 filled axial cross-sections (femur_slices.json, built from the real
   Visible Human mesh) reveal bottom-to-top as if scrolling through an MRI
   study — the slices stack into the bone. Driven by this module's own rAF
   clock (accumulated clamped deltas). Desktop drag-to-spin; mobile keeps
   scrolling; reduced-motion = static stack. */
import * as THREE from 'three';

const canvas = document.getElementById('femur-canvas');
if (canvas) boot(canvas);

function boot(canvas) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 3.6);

  const group = new THREE.Group();
  scene.add(group);

  /* cool gradient by height (no rainbow) */
  const GA = new THREE.Color(0xa4d8f4), GB = new THREE.Color(0x86a8ef), GC = new THREE.Color(0xa6a2f1);
  const WHITE = new THREE.Color(0xffffff);
  function gradAt(t) {
    const c = new THREE.Color();
    return t < 0.5 ? c.copy(GA).lerp(GB, t / 0.5) : c.copy(GB).lerp(GC, (t - 0.5) / 0.5);
  }

  const DUR = 5.6, BUILD_X = -0.17, BUILD_Y = -0.45, BASE_OP = 0.3;
  let ready = false, built = false, lastTs = null, buildT = 0;
  const slices = [];

  function updateBuild(T) {
    const front = Math.min(1, T / DUR) * slices.length;   // scan position
    for (let i = 0; i < slices.length; i++) {
      const s = slices[i], d = front - i;
      if (d < 0) { s.mat.opacity = 0; }
      else if (d < 1) { s.mat.opacity = 0.95; s.mat.color.copy(s.base).lerp(WHITE, 0.6); }  // active cursor
      else { s.mat.opacity = BASE_OP; s.mat.color.copy(s.base); }
    }
    if (T / DUR >= 1) {
      built = true;
      for (const s of slices) { s.mat.opacity = BASE_OP; s.mat.color.copy(s.base); }
    }
  }

  fetch('femur_slices.json?v=16').then((r) => r.json()).then((data) => {
    const arr = data.slices.slice().sort((a, b) => a.y - b.y);
    const lo = arr[0].y, hi = arr[arr.length - 1].y, span = Math.max(1e-4, hi - lo);
    arr.forEach((sl) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(sl.v, 3));
      g.setIndex(sl.f);
      const base = gradAt((sl.y - lo) / span);
      const mat = new THREE.MeshBasicMaterial({
        color: base.clone(), transparent: true, opacity: reduced ? BASE_OP : 0,
        side: THREE.DoubleSide, depthWrite: false
      });
      group.add(new THREE.Mesh(g, mat));
      slices.push({ mat, base });
    });
    group.rotation.set(BUILD_X, BUILD_Y, 0);

    ready = true;
    canvas.classList.add('is-ready');
    resize();
    if (reduced) { built = true; renderer.render(scene, camera); }
  }).catch((e) => console.error('[femur] slices load failed:', e && e.message));

  let dragging = false, lastX = 0, lastY = 0, velY = 0, tiltTarget = BUILD_X;
  const AUTO = 0.0028;
  if (fine) {
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', (e) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY; velY = 0;
      canvas.style.cursor = 'grabbing'; canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = (e.clientX - lastX) * 0.008, dy = (e.clientY - lastY) * 0.006;
      group.rotation.y += dx; velY = dx;
      tiltTarget = Math.max(-0.4, Math.min(0.35, tiltTarget + dy));
      lastX = e.clientX; lastY = e.clientY;
    });
    const release = (e) => { dragging = false; canvas.style.cursor = 'grab'; if (e.pointerId != null && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!ready || reduced) return;
    if (lastTs === null) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000); lastTs = ts;
    if (!built) { buildT += dt; updateBuild(buildT); }
    else {
      if (!dragging) { group.rotation.y += AUTO + velY; velY *= 0.94; }
      group.rotation.x += (tiltTarget - group.rotation.x) * 0.06;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (reduced && ready) renderer.render(scene, camera);
  }
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); }, { passive: true });
  resize();
}
