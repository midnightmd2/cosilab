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
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9aa7bd, 0.4);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff4e6, 1.15);
  key.position.set(3.2, 4.5, 3.0);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6cb1f2, 1.4);     // periwinkle edge
  rim.position.set(-3.5, 1.5, -3.2);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xdfe7ff, 0.35);
  fill.position.set(-2.4, -1.5, 2.6);
  scene.add(fill);
  const blush = new THREE.DirectionalLight(0xff9ec6, 0.7);   // warm pink from lower-right
  blush.position.set(3.0, -1.4, -1.8);
  scene.add(blush);

  const group = new THREE.Group();
  scene.add(group);

  /* bake a pastel candy gradient across the mesh (vertical ramp + a faint
     horizontal warm/cool shimmer), the way Isomorphic tints its molecules */
  function candyColors(geo) {
    geo.computeBoundingBox();
    const bb = geo.boundingBox, pos = geo.attributes.position;
    const minY = bb.min.y, hY = Math.max(1e-4, bb.max.y - bb.min.y);
    const minX = bb.min.x, wX = Math.max(1e-4, bb.max.x - bb.min.x);
    const stops = [
      [0.00, new THREE.Color(0xf48ab9)],  // condyles — pink
      [0.26, new THREE.Color(0xf9b870)],  // peach
      [0.52, new THREE.Color(0x77ddbb)],  // mint
      [0.76, new THREE.Color(0x6cbef0)],  // sky
      [1.00, new THREE.Color(0x8e9bf2)]   // head — periwinkle
    ];
    const warm = new THREE.Color(0xf7a9c8), cool = new THREE.Color(0x9fb6ff);
    const col = new THREE.Color(), tmp = new THREE.Color();
    const arr = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const ty = (pos.getY(i) - minY) / hY, tx = (pos.getX(i) - minX) / wX;
      let a = stops[0][1], b = stops[stops.length - 1][1], seg = 0;
      for (let s = 0; s < stops.length - 1; s++) {
        if (ty >= stops[s][0] && ty <= stops[s + 1][0]) {
          a = stops[s][1]; b = stops[s + 1][1];
          seg = (ty - stops[s][0]) / (stops[s + 1][0] - stops[s][0]); break;
        }
      }
      col.copy(a).lerp(b, seg);
      tmp.copy(cool).lerp(warm, tx);
      col.lerp(tmp, 0.13);
      arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }

  let model = null, ready = false;
  new GLTFLoader().load('femur.glb', (gltf) => {
    model = gltf.scene;
    const meshes = [];
    model.traverse((o) => { if (o.isMesh) meshes.push(o); });   // collect first — don't mutate mid-traverse
    meshes.forEach((o) => {
      candyColors(o.geometry);
      o.material = new THREE.MeshPhysicalMaterial({
        vertexColors: true, roughness: 0.34, metalness: 0.0,
        clearcoat: 0.9, clearcoatRoughness: 0.22,
        sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffe6f1),
        iridescence: 0.25, iridescenceIOR: 1.3,
        transmission: 0.06, thickness: 1.2, ior: 1.3,
        attenuationColor: new THREE.Color(0xffd9ec), attenuationDistance: 3.0,
        envMapIntensity: 0.8, transparent: true
      });
      o.castShadow = o.receiveShadow = false;
      /* faint surface mesh, the Isomorphic "scientific" texture */
      o.add(new THREE.Mesh(o.geometry, new THREE.MeshBasicMaterial({
        color: 0x9fb0e8, wireframe: true, transparent: true, opacity: 0.05, depthWrite: false
      })));
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
