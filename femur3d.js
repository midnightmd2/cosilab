/* COSI Lab — hero femur (real Visible Human mesh, decimated to femur.glb).
   Frosted candy material with a smooth pastel gradient + a GSAP "scan
   reconstruction" intro: a horizontal slice sweeps up from the bottom and
   the bone builds in behind it, as if assembled from imaging slices.
   Desktop drag-to-spin; mobile keeps scrolling; reduced-motion = static. */
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
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 4.4);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* soft, even, low-contrast lighting — frosted look, no hotspots, gentle
     blue/pink two-tone on the sides */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xccd8ec, 0.95));
  const key = new THREE.DirectionalLight(0xffffff, 0.5);
  key.position.set(1.6, 3.6, 2.6); scene.add(key);
  const cool = new THREE.DirectionalLight(0x8fb6ff, 0.5);
  cool.position.set(-3.4, 0.6, -1.4); scene.add(cool);
  const warm = new THREE.DirectionalLight(0xffa9cd, 0.5);
  warm.position.set(3.2, -1.6, 0.8); scene.add(warm);

  const group = new THREE.Group();
  scene.add(group);

  /* smooth pastel candy gradient baked along the bone's length */
  function candyColors(geo) {
    geo.computeBoundingBox();
    const bb = geo.boundingBox, pos = geo.attributes.position;
    const minY = bb.min.y, hY = Math.max(1e-4, bb.max.y - bb.min.y);
    const stops = [
      [0.00, new THREE.Color(0xf2a3c4)],  // condyles — pink
      [0.28, new THREE.Color(0xf7bf8a)],  // peach
      [0.54, new THREE.Color(0x86dcc0)],  // mint
      [0.78, new THREE.Color(0x77c2ee)],  // sky
      [1.00, new THREE.Color(0x97a4ee)]   // head — periwinkle
    ];
    const col = new THREE.Color();
    const arr = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const ty = (pos.getY(i) - minY) / hY;
      let a = stops[0][1], b = stops[stops.length - 1][1], seg = 0;
      for (let s = 0; s < stops.length - 1; s++) {
        if (ty >= stops[s][0] && ty <= stops[s + 1][0]) {
          a = stops[s][1]; b = stops[s + 1][1];
          seg = (ty - stops[s][0]) / (stops[s + 1][0] - stops[s][0]); break;
        }
      }
      col.copy(a).lerp(b, seg);
      arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }

  /* world-space clipping plane: keep points with y <= constant (build up) */
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

  let ready = false, built = false, scan = null;
  new GLTFLoader().load('femur.glb', (gltf) => {
    const model = gltf.scene;
    const meshes = [];
    model.traverse((o) => { if (o.isMesh) meshes.push(o); });
    meshes.forEach((o) => {
      candyColors(o.geometry);
      o.material = new THREE.MeshPhysicalMaterial({
        vertexColors: true, roughness: 0.42, metalness: 0.0,
        clearcoat: 0.5, clearcoatRoughness: 0.42,
        sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff),
        envMapIntensity: 0.6, side: THREE.DoubleSide,
        clippingPlanes: [clip]
      });
      /* faint even surface mesh — the Isomorphic "scientific" grid */
      o.add(new THREE.Mesh(o.geometry, new THREE.MeshBasicMaterial({
        color: 0xaebbe8, wireframe: true, transparent: true, opacity: 0.06,
        depthWrite: false, clippingPlanes: [clip]
      })));
    });
    group.rotation.set(0.12, -0.5, 0.06);
    group.add(model);

    /* world bounding box -> clip range + scan-slice size */
    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3(), ctr = new THREE.Vector3();
    box.getSize(size); box.getCenter(ctr);
    const yMin = box.min.y, yMax = box.max.y;

    /* the glowing imaging slice that sweeps up */
    const sg = new THREE.PlaneGeometry(size.x * 1.5, size.z * 1.5);
    scan = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({
      color: 0x7fd2f5, transparent: true, opacity: 0.0,
      side: THREE.DoubleSide, depthWrite: false
    }));
    scan.rotation.x = -Math.PI / 2;
    scan.position.set(ctr.x, yMin, ctr.z);
    scene.add(scan);

    ready = true;
    canvas.classList.add('is-ready');
    resize();

    if (window.gsap && !reduced) {
      clip.constant = yMin - 0.02;                 // hidden
      const tl = window.gsap.timeline();
      tl.to(scan.material, { opacity: 0.55, duration: 0.4, ease: 'sine.out' }, 0);
      tl.to(clip, {
        constant: yMax + 0.02, duration: 2.4, ease: 'power2.inOut',
        onUpdate: () => { scan.position.y = clip.constant; }
      }, 0);
      tl.to(scan.material, { opacity: 0.0, duration: 0.5, ease: 'sine.in' }, 2.1);
      tl.add(() => { built = true; });
    } else {
      clip.constant = yMax + 0.02;                 // full reveal
      built = true;
      if (reduced) renderer.render(scene, camera);
    }
  });

  /* desktop drag + inertia; mobile untouched (page scrolls) */
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

  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((ents) => { visible = ents[0].isIntersecting; }).observe(canvas);
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!ready || !visible || reduced) return;
    if (built && !dragging) { group.rotation.y += AUTO + velY; velY *= 0.94; }
    group.rotation.x += (tiltTarget - group.rotation.x) * 0.08;
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
