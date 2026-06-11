/* COSI Lab — hero proximal femur.
   Intro: the studio-lit solid mesh (femur_mesh.json) is revealed bottom-to-top
   by a clipping plane ("raising the curtain"), with the bone's cross-section
   filled at the cut line (femur_slices.json) so you see the section as it
   builds — shaded the whole way — until the full bone stands. Both built from
   the real Visible Human geometry in one coordinate space. Own rAF clock.
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
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 3.3);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xaab8d2, 0.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(2.6, 3.4, 2.8); scene.add(key);
  const fill = new THREE.DirectionalLight(0xc4d2ff, 0.5);
  fill.position.set(-3.2, -0.6, 1.2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0x7fa8f5, 1.5);
  rim.position.set(-2.4, 1.4, -3.0); scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  const GA = new THREE.Color(0x9cc8ee), GB = new THREE.Color(0x88a8ef), GC = new THREE.Color(0xa6a2f1);
  function gradAt(t) {
    const c = new THREE.Color();
    return t < 0.5 ? c.copy(GA).lerp(GB, t / 0.5) : c.copy(GB).lerp(GC, (t - 0.5) / 0.5);
  }
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  const REVEAL_DUR = 4.0, BUILD_TILT = -0.4, REST_TILT = -0.16;
  const localClip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);   // keep y <= constant
  const worldClip = new THREE.Plane();

  let ready = false, built = false, lastTs = null, buildT = 0, meshObj = null;
  let yMin = -1, yMax = 1;
  const caps = [];

  function updateBuild(T) {
    const p = Math.min(1, T / REVEAL_DUR);
    const cut = yMin + (yMax - yMin) * p;
    localClip.constant = cut + 0.006;                 // reveal mesh up to the cut
    const idx = Math.min(caps.length - 1, Math.round(p * (caps.length - 1)));
    for (let i = 0; i < caps.length; i++) caps[i].visible = !built && (i === idx || i === idx - 1);
    if (p >= 1) {
      built = true;
      localClip.constant = 1e6;                       // unclip
      for (const c of caps) c.visible = false;
    }
  }

  Promise.all([
    fetch('femur_mesh.json?v=22').then((r) => r.json()),
    fetch('femur_slices.json?v=22').then((r) => r.json())
  ]).then(([meshData, sliceData]) => {
    /* solid mesh: lit, opaque, revealed by the clipping plane */
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.Float32BufferAttribute(meshData.v, 3));
    mg.setIndex(meshData.f);
    mg.computeVertexNormals();
    mg.computeBoundingBox();
    yMin = mg.boundingBox.min.y; yMax = mg.boundingBox.max.y;
    const mh = Math.max(1e-4, yMax - yMin);
    const mpos = mg.attributes.position, mcol = new Float32Array(mpos.count * 3);
    for (let i = 0; i < mpos.count; i++) {
      const c = gradAt((mpos.getY(i) - yMin) / mh);
      mcol[i * 3] = c.r; mcol[i * 3 + 1] = c.g; mcol[i * 3 + 2] = c.b;
    }
    mg.setAttribute('color', new THREE.BufferAttribute(mcol, 3));
    const meshMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.5, metalness: 0.0,
      clearcoat: 0.35, clearcoatRoughness: 0.4,
      sheen: 0.4, sheenColor: new THREE.Color(0xeef3ff),
      envMapIntensity: 0.65, side: THREE.DoubleSide,
      clippingPlanes: reduced ? [] : [worldClip]
    });
    meshObj = new THREE.Mesh(mg, meshMat);
    group.add(meshObj);

    /* cross-section caps (the cut face), one shown at the curtain line */
    const arr = sliceData.slices.slice().sort((a, b) => a.y - b.y);
    const capMat = new THREE.MeshBasicMaterial({ color: 0xc3d2f7, side: THREE.DoubleSide });
    arr.forEach((sl) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(sl.v, 3));
      g.setIndex(sl.f);
      const m = new THREE.Mesh(g, capMat);
      m.visible = false;
      group.add(m); caps.push(m);
    });

    group.rotation.set(BUILD_TILT, -0.45, 0);
    ready = true;
    canvas.classList.add('is-ready');
    resize();
    if (reduced) { built = true; renderer.render(scene, camera); }
  }).catch((e) => console.error('[femur] load failed:', e && e.message));

  let dragging = false, lastX = 0, lastY = 0, velY = 0, tiltTarget = REST_TILT;
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
    if (!built) {
      buildT += dt; updateBuild(buildT);
      meshObj.updateWorldMatrix(true, false);
      worldClip.copy(localClip).applyMatrix4(meshObj.matrixWorld);
    } else {
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
