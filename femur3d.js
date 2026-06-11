/* COSI Lab — hero proximal femur.
   Intro: ~300 filled axial slices (femur_slices.json) reveal bottom-to-top
   as if scrolling through an MRI study, then CROSS-FADE into a studio-lit
   solid mesh (femur_mesh.json) you can read and spin — the slices resolve
   into the bone. Both built from the real Visible Human geometry and share a
   coordinate space, so they overlap exactly. Own rAF clock (clamped deltas).
   Desktop drag-to-spin; mobile keeps scrolling; reduced-motion = static. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 3.6);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* lighting tuned to read the bone's form clearly */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xaab8d2, 0.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(2.6, 3.4, 2.8); scene.add(key);
  const fill = new THREE.DirectionalLight(0xc4d2ff, 0.5);
  fill.position.set(-3.2, -0.6, 1.2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0x7fa8f5, 1.5);
  rim.position.set(-2.4, 1.4, -3.0); scene.add(rim);

  const group = new THREE.Group();
  const sliceGroup = new THREE.Group();
  group.add(sliceGroup);
  scene.add(group);

  const GA = new THREE.Color(0xa4d8f4), GB = new THREE.Color(0x86a8ef), GC = new THREE.Color(0xa6a2f1);
  const WHITE = new THREE.Color(0xffffff);
  function gradAt(t) {
    const c = new THREE.Color();
    return t < 0.5 ? c.copy(GA).lerp(GB, t / 0.5) : c.copy(GB).lerp(GC, (t - 0.5) / 0.5);
  }
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  const SCROLL_DUR = 4.6, FADE_AT = 4.7, FADE_DUR = 1.7, BASE_OP = 0.3;
  const TOTAL = FADE_AT + FADE_DUR + 0.1;
  let ready = false, built = false, lastTs = null, buildT = 0;
  const slices = [];
  let meshMat = null;

  function updateBuild(T) {
    const front = Math.min(1, T / SCROLL_DUR) * slices.length;
    const fade = smooth((T - FADE_AT) / FADE_DUR);          // slices -> mesh
    const inv = 1 - fade;
    for (let i = 0; i < slices.length; i++) {
      const s = slices[i], d = front - i;
      if (d < 0) { s.mat.opacity = 0; }
      else if (d < 1) { s.mat.opacity = 0.95 * inv; s.mat.color.copy(s.base).lerp(WHITE, 0.6); }
      else { s.mat.opacity = BASE_OP * inv; s.mat.color.copy(s.base); }
    }
    if (meshMat) meshMat.opacity = fade;
    if (T > TOTAL) {
      built = true;
      sliceGroup.visible = false;
      if (meshMat) { meshMat.opacity = 1; meshMat.transparent = false; meshMat.needsUpdate = true; }
    }
  }

  Promise.all([
    fetch('femur_slices.json?v=17').then((r) => r.json()),
    fetch('femur_mesh.json?v=17').then((r) => r.json())
  ]).then(([sliceData, meshData]) => {
    /* slices */
    const arr = sliceData.slices.slice().sort((a, b) => a.y - b.y);
    const lo = arr[0].y, hi = arr[arr.length - 1].y, span = Math.max(1e-4, hi - lo);
    arr.forEach((sl) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(sl.v, 3));
      g.setIndex(sl.f);
      const base = gradAt((sl.y - lo) / span);
      const mat = new THREE.MeshBasicMaterial({
        color: base.clone(), transparent: true, opacity: reduced ? 0 : 0,
        side: THREE.DoubleSide, depthWrite: false
      });
      sliceGroup.add(new THREE.Mesh(g, mat));
      slices.push({ mat, base });
    });

    /* solid mesh, cool gradient vertex colours + lighting */
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.Float32BufferAttribute(meshData.v, 3));
    mg.setIndex(meshData.f);
    mg.computeVertexNormals();
    mg.computeBoundingBox();
    const my0 = mg.boundingBox.min.y, mh = Math.max(1e-4, mg.boundingBox.max.y - mg.boundingBox.min.y);
    const mpos = mg.attributes.position, mcol = new Float32Array(mpos.count * 3);
    for (let i = 0; i < mpos.count; i++) {
      const c = gradAt((mpos.getY(i) - my0) / mh);
      mcol[i * 3] = c.r; mcol[i * 3 + 1] = c.g; mcol[i * 3 + 2] = c.b;
    }
    mg.setAttribute('color', new THREE.BufferAttribute(mcol, 3));
    meshMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.5, metalness: 0.0,
      clearcoat: 0.35, clearcoatRoughness: 0.4,
      sheen: 0.4, sheenColor: new THREE.Color(0xeef3ff),
      envMapIntensity: 0.65, transparent: true, opacity: reduced ? 1 : 0
    });
    group.add(new THREE.Mesh(mg, meshMat));

    group.rotation.set(-0.17, -0.45, 0);
    ready = true;
    canvas.classList.add('is-ready');
    resize();
    if (reduced) { built = true; sliceGroup.visible = false; renderer.render(scene, camera); }
  }).catch((e) => console.error('[femur] load failed:', e && e.message));

  let dragging = false, lastX = 0, lastY = 0, velY = 0, tiltTarget = -0.17;
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
