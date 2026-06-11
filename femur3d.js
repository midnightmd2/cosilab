/* COSI Lab — hero femur (real Visible Human mesh, decimated to femur.glb).
   Studio-lit WebGL centerpiece: soft auto-rotation, drag-to-spin on desktop
   (mobile keeps scrolling — no rotation hijack), renders only while visible,
   and degrades to nothing if WebGL or the model is unavailable. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('femur-canvas');
if (canvas) boot(canvas);

function boot(canvas) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return; }                       // no WebGL — leave the glow-only fallback
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 4.4);

  /* soft studio reflections (no HDR file needed) */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* lighting: warm key, cool periwinkle rim (brand halo), gentle fill */
  const hemi = new THREE.HemisphereLight(0xffffff, 0x96a3bd, 0.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff4e6, 1.7);
  key.position.set(3.2, 4.5, 3.0);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6cb1f2, 1.5);
  rim.position.set(-3.5, 1.5, -3.2);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xdfe7ff, 0.4);
  fill.position.set(-2.4, -1.5, 2.6);
  scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  let model = null, ready = false;
  new GLTFLoader().load('femur.glb', (gltf) => {
    model = gltf.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.material = new THREE.MeshPhysicalMaterial({
        color: 0xece3d2, roughness: 0.62, metalness: 0.0,
        clearcoat: 0.25, clearcoatRoughness: 0.55,
        sheen: 0.35, sheenColor: new THREE.Color(0xfff1dc),
        envMapIntensity: 0.85
      });
      o.castShadow = o.receiveShadow = false;
    });
    /* tilt slightly off-axis so the head reads as anatomy, not a club */
    group.rotation.set(0.12, -0.5, 0.06);
    group.add(model);
    ready = true;
    canvas.classList.add('is-ready');
    resize();
    if (reduced) renderer.render(scene, camera);  // one frame, no spin
  });

  /* ---- interaction: desktop drag + inertia; mobile scroll untouched ---- */
  let dragging = false, lastX = 0, lastY = 0, velY = 0, tiltTarget = 0.12;
  const AUTO = 0.0032;
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
      tiltTarget = Math.max(-0.35, Math.min(0.4, tiltTarget + dy));
      lastX = e.clientX; lastY = e.clientY;
    });
    const release = (e) => { dragging = false; canvas.style.cursor = 'grab'; if (e.pointerId != null && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
  }

  /* ---- render only while the hero is on screen ---- */
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((ents) => { visible = ents[0].isIntersecting; })
      .observe(canvas);
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!ready || !visible) return;
    if (reduced) return;                          // static for reduced-motion
    if (!dragging) { group.rotation.y += AUTO + velY; velY *= 0.94; }
    group.rotation.x += (tiltTarget - group.rotation.x) * 0.08;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  /* ---- sizing ---- */
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
