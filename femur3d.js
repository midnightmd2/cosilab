/* COSI Lab — hero proximal femur (real Visible Human mesh -> femur.glb).
   Intro: bright cross-section contours (computed from the mesh) light up and
   stack from the bottom into the bone's shape, then the solid frosted model
   materializes over them — imaging slices adding together into the mesh.
   Driven by this module's own rAF clock. Desktop drag-to-spin; mobile keeps
   scrolling; reduced-motion = static. */
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

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 3.6);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xccd8ec, 0.95));
  const key = new THREE.DirectionalLight(0xffffff, 0.5);
  key.position.set(1.4, 3.4, 2.6); scene.add(key);
  const fillA = new THREE.DirectionalLight(0x9fc0ff, 0.45);
  fillA.position.set(-3.4, 0.8, -1.0); scene.add(fillA);
  const fillB = new THREE.DirectionalLight(0xeaf0ff, 0.35);
  fillB.position.set(2.8, -1.8, 1.0); scene.add(fillB);

  const group = new THREE.Group();
  scene.add(group);

  function candyColors(geo) {
    geo.computeBoundingBox();
    const bb = geo.boundingBox, pos = geo.attributes.position;
    const minY = bb.min.y, hY = Math.max(1e-4, bb.max.y - bb.min.y);
    const stops = [
      [0.00, new THREE.Color(0xaad6f2)], [0.50, new THREE.Color(0x88a9ee)],
      [1.00, new THREE.Color(0xa6a2f1)]
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

  function sliceSegments(geo, N) {
    const pos = geo.attributes.position, idx = geo.index;
    geo.computeBoundingBox();
    const bb = geo.boundingBox, H = bb.max.y - bb.min.y;
    const y0 = bb.min.y + H * 0.02, y1 = bb.max.y - H * 0.02;
    const triN = idx ? idx.count / 3 : pos.count / 3;
    const out = [];
    for (let s = 0; s < N; s++) {
      const h = y0 + (y1 - y0) * (s / (N - 1)), seg = [];
      for (let t = 0; t < triN; t++) {
        const a = idx ? idx.getX(t * 3) : t * 3;
        const b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
        const c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
        const ay = pos.getY(a), by = pos.getY(b), cy = pos.getY(c);
        if (h < Math.min(ay, by, cy) || h > Math.max(ay, by, cy)) continue;
        const hit = [];
        const E = [[a, b, ay, by], [b, c, by, cy], [c, a, cy, ay]];
        for (const [i0, i1, u, w] of E) {
          if ((u <= h && w >= h) || (w <= h && u >= h)) {
            if (u === w) continue;
            const f = (h - u) / (w - u);
            hit.push(pos.getX(i0) + (pos.getX(i1) - pos.getX(i0)) * f, h,
              pos.getZ(i0) + (pos.getZ(i1) - pos.getZ(i0)) * f);
          }
        }
        if (hit.length >= 6) seg.push(hit[0], hit[1], hit[2], hit[3], hit[4], hit[5]);
      }
      out.push(new Float32Array(seg));
    }
    return out;
  }

  const N = 22, STAG = 0.16;
  const SOLID_AT = N * STAG + 0.35, SOLID_DUR = 1.7;
  const BUILD_X = -0.17, BUILD_Y = -0.45;

  let ready = false, built = false, lastTs = null, buildT = 0;
  const mats = [], slices = [];
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  function updateBuild(T) {
    const fade = smooth((T - SOLID_AT) / SOLID_DUR);   // 0..1 solidify
    for (let i = 0; i < slices.length; i++) {
      const up = smooth((T - i * STAG) / 0.28);         // contour ramps in
      slices[i].material.opacity = up * 0.8 * (1 - fade);
    }
    for (const mm of mats) mm.opacity = fade;
    if (T > SOLID_AT + SOLID_DUR + 0.1) {
      built = true;
      for (const mm of mats) mm.opacity = 1;
      for (const l of slices) l.material.opacity = 0;
    }
  }

  new GLTFLoader().load('femur.glb', (gltf) => {
    const model = gltf.scene;
    const meshes = [];
    model.traverse((o) => { if (o.isMesh) meshes.push(o); });
    meshes.forEach((o) => {
      candyColors(o.geometry);
      o.material = new THREE.MeshPhysicalMaterial({
        vertexColors: true, roughness: 0.42, metalness: 0.0,
        clearcoat: 0.5, clearcoatRoughness: 0.4,
        sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff),
        envMapIntensity: 0.6, side: THREE.FrontSide,
        transparent: true, opacity: reduced ? 1 : 0, depthWrite: true
      });
      mats.push(o.material);
      sliceSegments(o.geometry, N).forEach((arr) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        const line = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
          color: 0x2f9fe0, transparent: true, opacity: 0, depthTest: false, depthWrite: false
        }));
        line.renderOrder = 2; o.add(line); slices.push(line);
      });
    });
    group.add(model);
    group.rotation.set(BUILD_X, BUILD_Y, 0);

    ready = true;
    canvas.classList.add('is-ready');
    resize();
    if (reduced) { built = true; renderer.render(scene, camera); }
  });

  let dragging = false, lastX = 0, lastY = 0, velY = 0, tiltTarget = BUILD_X;
  const AUTO = 0.0030;
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
