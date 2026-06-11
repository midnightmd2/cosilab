/* COSI Lab — hero particle field (Three.js, single draw call).
   Degrades gracefully: if WebGL or module support is missing, the CSS
   gradient hero stands alone. Respects prefers-reduced-motion. */
import * as THREE from 'three';

(() => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 820px)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 140);
  camera.position.set(0, 7.4, 16);

  /* point grid */
  const COLS = small ? 95 : 160;
  const ROWS = small ? 60 : 95;
  const W = 60, D = 38;
  const N = COLS * ROWS;
  const pos = new Float32Array(N * 3);
  const rnd = new Float32Array(N);
  let i = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      pos[i * 3]     = (c / (COLS - 1) - 0.5) * W + (Math.random() - 0.5) * 0.25;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = -(r / (ROWS - 1)) * D + 4 + (Math.random() - 0.5) * 0.25;
      rnd[i] = Math.random();
      i++;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime:   { value: 0 },
      uColorA: { value: new THREE.Color('#6CB1F2') },
      uColorB: { value: new THREE.Color('#5566E6') },
    },
    vertexShader: [
      'attribute float aRand;',
      'uniform float uTime;',
      'varying float vMix; varying float vFade; varying float vRand;',
      'void main(){',
      '  vec3 p = position;',
      '  float t = uTime;',
      '  float w = sin(p.x*0.16 + t*0.55)*0.85',
      '          + cos(p.z*0.21 + t*0.42)*0.65',
      '          + sin((p.x+p.z)*0.072 + t*0.26)*1.45;',
      '  p.y += w;',
      '  vMix  = clamp(0.5 + w*0.22, 0.0, 1.0);',
      '  vRand = aRand;',
      '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
      '  vFade = smoothstep(-46.0, -10.0, mv.z);',
      '  gl_PointSize = (1.5 + aRand*1.6) * (340.0 / -mv.z);',
      '  gl_Position = projectionMatrix * mv;',
      '}',
    ].join('\n'),
    fragmentShader: [
      'precision mediump float;',
      'uniform vec3 uColorA; uniform vec3 uColorB;',
      'varying float vMix; varying float vFade; varying float vRand;',
      'void main(){',
      '  float d = length(gl_PointCoord - 0.5);',
      '  float a = smoothstep(0.5, 0.1, d);',
      '  float alpha = a * (0.28 + 0.5*vRand) * vFade;',
      '  if (alpha < 0.004) discard;',
      '  gl_FragColor = vec4(mix(uColorA, uColorB, vMix), alpha);',
      '}',
    ].join('\n'),
  });
  scene.add(new THREE.Points(geo, mat));

  /* sizing */
  const wrap = canvas.parentElement;
  function size() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  size();
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(wrap);
  else window.addEventListener('resize', size);

  /* mouse parallax (fine pointers only) */
  let tx = 0, ty = 0, cx = 0, cy = 0;
  if (!reduced && matchMedia('(pointer:fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }

  /* render loop — paused offscreen and on hidden tabs */
  let inView = true, raf = null, t0 = performance.now(), time = 0;
  function frame(now) {
    raf = null;
    const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
    time += dt;
    cx += (tx - cx) * 0.045; cy += (ty - cy) * 0.045;
    camera.position.x = cx * 2.2;
    camera.position.y = 7.4 + cy * 1.1;
    camera.lookAt(0, 0.6, -4);
    mat.uniforms.uTime.value = time;
    renderer.render(scene, camera);
    if (!canvas.classList.contains('is-on')) canvas.classList.add('is-on');
    if (!reduced && inView && !document.hidden) loop();
  }
  function loop() { if (raf == null) raf = requestAnimationFrame(frame); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((e) => {
      inView = e[0].isIntersecting;
      if (inView && !reduced) { t0 = performance.now(); loop(); }
    }, { threshold: 0 }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && inView && !reduced) { t0 = performance.now(); loop(); }
  });

  if (reduced) {
    time = 2.4;
    camera.lookAt(0, 0.6, -4);
    mat.uniforms.uTime.value = time;
    renderer.render(scene, camera);
    canvas.classList.add('is-on');
  } else {
    loop();
  }

  window.__heroFX = true;
})();
