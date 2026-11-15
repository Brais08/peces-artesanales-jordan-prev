/* Recorrido 3D del taller · Poteras artesanales Jordan Nito
   La potera se transforma según el scroll: modelado → lastrado → pintado → prueba en agua.
   Solo se dibuja cuando algo cambia (ahorra batería). Librería: three.js r170 en /vendor. */
import {
  Scene, PerspectiveCamera, WebGLRenderer, Color, HemisphereLight, DirectionalLight,
  Box3, Vector3, Quaternion, Group, Plane, Mesh, TorusGeometry, MeshBasicMaterial, AdditiveBlending,
  MeshPhysicalMaterial, SRGBColorSpace, ACESFilmicToneMapping, PMREMGenerator,
  GLTFLoader, OrbitControls, RoomEnvironment
} from './vendor/three-lite.js';

const MODEL_URL = 'assets/potera.glb';
const RAW_COLOR = '#EEE6D8';   // poliuretano en bruto, antes de pintar

/* Colores para probar al final (el modelo es una sola pieza) */
export const FINISHES = [
  { name: 'Original', color: null, swatch: '#D9521A' },
  { name: 'Flúor',    color: '#FFC21A' },
  { name: 'Rosa',     color: '#D9577A' },
  { name: 'Noche',    color: '#1D5FA8' }
];

/* Fotogramas clave del recorrido. t: 0 = inicio del paso 1 … 4 = final.
   cam/look: cámara y punto al que mira; rx/ry/rz: giro de la potera; y: altura */
const KEYS = [
  { t: 0,    cam: [0.5, 0.35, 3.0],   look: [0, 0, 0],         rx: 0.25, ry: -0.7, rz: 0,     y: 0 },
  { t: 0.9,  cam: [0.9, 0.5, 2.6],    look: [0, 0, 0],         rx: 0.1,  ry: 0.55, rz: 0,     y: 0 },
  { t: 1.5,  cam: [0.75, -0.15, 1.2], look: [0.3, -0.18, 0],   rx: 0,    ry: 0.2,  rz: 0,     y: 0 },   // primer plano del plomo
  { t: 1.95, cam: [0.35, 0.25, 3.1],  look: [0, -0.05, 0],    rx: 0,    ry: 0.1,  rz: -0.78, y: 0 },   // caída a 45°
  { t: 2.2,  cam: [0, 0.2, 2.5],      look: [0, 0, 0],         rx: 0.05, ry: 0,    rz: -0.05, y: 0 },
  { t: 2.9,  cam: [0, 0.2, 2.5],      look: [0, 0, 0],         rx: 0.05, ry: 0,    rz: -0.05, y: 0 },   // pintado
  { t: 3.2,  cam: [0.6, 0.6, 3.0],    look: [0, -0.2, 0],      rx: 0,    ry: 0.35, rz: -0.78, y: -0.25 }, // se hunde en el agua
  { t: 3.5,  cam: [0.9, 0.55, 2.6],   look: [0, 0, 0],         rx: 0,    ry: 0,    rz: 0,     y: 0 }    // libre
];
// A partir de aquí el cliente la gira (antes de que la escena deje de estar fija)
export const FREE_FROM = 3.5;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = x => x * x * (3 - 2 * x);
const mix = (a, b, f) => a + (b - a) * f;

function sample(t) {
  t = clamp(t, 0, KEYS[KEYS.length - 1].t);
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const f = smooth(clamp((t - a.t) / (b.t - a.t), 0, 1));
  return {
    cam: a.cam.map((v, k) => mix(v, b.cam[k], f)),
    look: a.look.map((v, k) => mix(v, b.look[k], f)),
    rx: mix(a.rx, b.rx, f), ry: mix(a.ry, b.ry, f), rz: mix(a.rz, b.rz, f), y: mix(a.y, b.y, f),
    paint: smooth(clamp((t - 2.15) / 0.7, 0, 1))
  };
}

export function mountViewer(host, { onReady, onError, reducedMotion = false } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (err) { onError && onError(err); return null; }

  const maxDpr = innerWidth < 768 ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.localClippingEnabled = true;     // para el efecto de pintado
  host.appendChild(renderer.domElement);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  scene.add(new HemisphereLight(0xcfe8ff, 0x0a1a2f, 0.5));
  const key = new DirectionalLight(0xffffff, 1.3); key.position.set(3, 5, 4); scene.add(key);
  const rim = new DirectionalLight(0xffc21a, 0.9); rim.position.set(-4, 1, -3); scene.add(rim);

  const camera = new PerspectiveCamera(32, 1, 0.01, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;           // la rueda sigue desplazando la página
  controls.autoRotateSpeed = 1.6;
  controls.minPolarAngle = Math.PI * 0.18;
  controls.maxPolarAngle = Math.PI * 0.82;
  controls.addEventListener('start', () => { controls.autoRotate = false; host.classList.add('is-touched'); });
  // En móvil el dedo debe poder seguir bajando la página sobre la potera (giro solo horizontal)
  renderer.domElement.style.touchAction = 'pan-y';

  const pivot = new Group();              // la potera gira y se mueve desde aquí
  scene.add(pivot);

  // Pintado: dos copias del cuerpo (en bruto y pintada) cortadas por un plano que avanza
  const rawMat = new MeshPhysicalMaterial({ color: RAW_COLOR, roughness: 0.85, metalness: 0, clearcoat: 0 });
  let paintMat = null, baseColor = null;
  const rawPlane = new Plane(), paintPlane = new Plane();
  rawMat.clippingPlanes = [rawPlane];

  // Anillo de luz que recorre la potera al pintarla (como el sonar del escaparate)
  const ring = new Group();
  const ringCore = new MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
  const ringGlow = new MeshBasicMaterial({ color: 0xffc21a, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
  ring.add(
    new Mesh(new TorusGeometry(0.3, 0.006, 8, 64), ringCore),
    new Mesh(new TorusGeometry(0.3, 0.035, 8, 64), ringGlow)
  );
  ring.rotation.y = Math.PI / 2;        // el anillo rodea el eje largo de la potera
  ring.visible = false;
  pivot.add(ring);

  let ready = false;
  const state = { cam: [0.5, 0.35, 3], look: [0, 0, 0], rx: 0.25, ry: -0.7, rz: 0, y: 0, paint: 0 };
  let progress = reducedMotion ? 4 : 0, free = false, needRender = true, lastNow = 0;

  new GLTFLoader().load(MODEL_URL, gltf => {
    const model = gltf.scene;
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3()), center = box.getCenter(new Vector3());
    const s = 2 / Math.max(size.x, size.y, size.z);   // largo = 2 unidades (de -1 a 1 en x)
    model.scale.setScalar(s);
    model.position.copy(center.multiplyScalar(-s));
    pivot.add(model);

    const meshes = [];
    model.traverse(o => { if (o.isMesh) meshes.push(o); });
    meshes.forEach(m => {
      baseColor = m.material && m.material.color ? m.material.color.clone() : new Color(FINISHES[0].swatch);
      paintMat = new MeshPhysicalMaterial({ color: baseColor.clone(), roughness: 0.32, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12, clippingPlanes: [paintPlane] });
      m.material = paintMat;
      const raw = m.clone();
      raw.material = rawMat;
      m.parent.add(raw);
    });

    ready = true; needRender = true;
    onReady && onReady();
  }, undefined, err => { onError && onError(err); });

  const BASE_DIST = 1;
  let fit = 1;
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fit = BASE_DIST * Math.max(1, 1.6 / camera.aspect);  // en pantallas estrechas, cámara más lejos
    needRender = true;
  }
  new ResizeObserver(resize).observe(host);
  resize();

  const q = new Quaternion(), n = new Vector3(), p = new Vector3();
  function apply() {
    pivot.position.y = state.y;
    pivot.rotation.set(state.rx, state.ry, state.rz);
    pivot.updateMatrixWorld(true);
    // planos de corte del pintado en coordenadas del mundo
    const sx = mix(-1.1, 1.1, state.paint);
    pivot.getWorldQuaternion(q);
    n.set(1, 0, 0).applyQuaternion(q);
    pivot.localToWorld(p.set(sx, 0, 0));
    rawPlane.setFromNormalAndCoplanarPoint(n, p);
    paintPlane.setFromNormalAndCoplanarPoint(n.clone().negate(), p);
    ring.position.x = sx;
    const glowK = Math.sin(Math.PI * state.paint);
    ringCore.opacity = glowK; ringGlow.opacity = glowK * 0.35;
    ring.visible = glowK > 0.01;
  }

  function enterFree() {
    free = true;
    controls.target.set(...state.look);
    controls.enabled = true;
    controls.autoRotate = !reducedMotion;
    controls.update();
  }
  function leaveFree() {
    free = false;
    controls.enabled = false;
    controls.autoRotate = false;
  }

  function placeCamera() {
    const look = new Vector3(...state.look);
    camera.position.set(...state.cam).sub(look).multiplyScalar(fit).add(look);
    camera.lookAt(look);
  }

  let started = false;
  function tick(now) {
    if (!ready) return;
    const f60 = lastNow ? Math.min(6, (now - lastNow) / (1000 / 60)) : 1;
    lastNow = now;

    // Primer fotograma: se coloca directamente donde indica el scroll (sin recorrer desde el inicio)
    if (!started) {
      started = true;
      Object.assign(state, sample(progress));
      apply();
      placeCamera();
      needRender = true;
    }

    if (progress >= FREE_FROM && !free) enterFree();
    if (progress < FREE_FROM - 0.05 && free) leaveFree();

    if (free) {
      // La potera vuelve a su postura neutra y la cámara la controla el cliente
      const k = 1 - Math.pow(1 - 0.12, f60);
      let moving = false;
      for (const key of ['rx', 'ry', 'rz', 'y']) { const d = 0 - state[key]; if (Math.abs(d) > 1e-4) { state[key] += d * k; moving = true; } }
      if (state.paint < 1) { state.paint = 1; moving = true; }
      if (moving) apply();
      if (controls.update() || moving || needRender) { renderer.render(scene, camera); needRender = false; }
      return;
    }

    // Recorrido guiado: se acerca suavemente al fotograma del scroll
    const target = sample(progress);
    const k = reducedMotion ? 1 : 1 - Math.pow(1 - 0.14, f60);
    let delta = 0;
    const step = (cur, tgt) => { const d = tgt - cur; delta = Math.max(delta, Math.abs(d)); return cur + d * k; };
    state.cam = state.cam.map((v, i) => step(v, target.cam[i]));
    state.look = state.look.map((v, i) => step(v, target.look[i]));
    for (const key of ['rx', 'ry', 'rz', 'y', 'paint']) state[key] = step(state[key], target[key]);

    if (delta > 1e-4 || needRender) {
      apply();
      placeCamera();
      renderer.render(scene, camera);
      needRender = false;
    }
  }

  // Solo hay bucle mientras el recorrido está en pantalla
  new IntersectionObserver(([en]) => {
    lastNow = 0;
    renderer.setAnimationLoop(en.isIntersecting ? tick : null);
  }).observe(host);

  return {
    setProgress(t) { progress = reducedMotion ? 4 : clamp(t, 0, 4); },
    setColor(hex) { if (!paintMat) return; hex ? paintMat.color.set(hex) : paintMat.color.copy(baseColor); needRender = true; }
  };
}
