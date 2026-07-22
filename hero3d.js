import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.querySelector("[data-hero-3d]");
const hero = canvas?.closest(".hero");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && hero) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.2, 7.8);

  const rig = new THREE.Group();
  rig.position.set(1.65, -0.12, -0.25);
  scene.add(rig);

  const key = new THREE.PointLight(0xc8ff4d, 6.8, 18);
  key.position.set(2.7, 2.4, 3.4);
  scene.add(key);

  const warm = new THREE.PointLight(0xf05a3f, 2.2, 14);
  warm.position.set(-3.6, -2.2, 2.6);
  scene.add(warm);

  const fill = new THREE.DirectionalLight(0xf5f2ec, 1.4);
  fill.position.set(-2, 3, 5);
  scene.add(fill);

  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x11130f,
    metalness: 0.76,
    roughness: 0.28,
    clearcoat: 0.7,
    clearcoatRoughness: 0.22,
    emissive: 0x203000,
    emissiveIntensity: 0.18
  });

  const core = new THREE.Mesh(new THREE.TorusKnotGeometry(1.05, 0.16, 220, 18, 2, 3), coreMaterial);
  core.rotation.set(0.4, -0.58, 0.18);
  rig.add(core);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xc8ff4d,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const rings = [];
  [
    [2.55, 0.012, 0.82, 0.18],
    [3.25, 0.01, -0.72, -0.34],
    [4.05, 0.008, 1.12, 0.48]
  ].forEach(([radius, tube, x, z], index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 220, 8), ringMaterial.clone());
    ring.rotation.set(x, index * 0.72, z);
    ring.material.opacity = 0.22 - index * 0.035;
    rig.add(ring);
    rings.push(ring);
  });

  const particleCount = 520;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const colorA = new THREE.Color(0xc8ff4d);
  const colorB = new THREE.Color(0xf5f2ec);
  const colorC = new THREE.Color(0xf05a3f);

  for (let i = 0; i < particleCount; i += 1) {
    const i3 = i * 3;
    const radius = 1.7 + Math.random() * 5.2;
    const angle = Math.random() * Math.PI * 2;
    const depth = -2.2 + Math.random() * 3.8;
    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = (Math.random() - 0.5) * 4.8;
    positions[i3 + 2] = Math.sin(angle) * radius * 0.42 + depth;

    const mixed = (i % 9 === 0 ? colorC : i % 3 === 0 ? colorA : colorB).clone();
    colors[i3] = mixed.r;
    colors[i3 + 1] = mixed.g;
    colors[i3 + 2] = mixed.b;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      size: 0.026,
      vertexColors: true,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  particles.position.set(0.9, 0, -0.4);
  scene.add(particles);

  const veil = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.2, 2),
    new THREE.MeshBasicMaterial({
      color: 0xc8ff4d,
      wireframe: true,
      transparent: true,
      opacity: 0.045,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  veil.position.set(-1.4, -0.9, -1.4);
  veil.scale.set(1.6, 0.78, 1);
  scene.add(veil);

  const clock = new THREE.Clock();

  const resize = () => {
    const width = Math.max(1, hero.clientWidth);
    const height = Math.max(1, hero.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const mobile = width < 760;
    rig.position.set(mobile ? 0.42 : 1.65, mobile ? -1.25 : -0.12, mobile ? -0.75 : -0.25);
    rig.scale.setScalar(mobile ? 0.5 : 0.88);
    particles.position.x = mobile ? 0 : 0.9;
    camera.position.z = mobile ? 9.3 : 7.8;
  };

  const observer = new ResizeObserver(resize);
  observer.observe(hero);
  resize();

  const render = () => {
    const elapsed = clock.getElapsedTime();
    const speed = reduceMotion ? 0.08 : 1;

    core.rotation.x = 0.4 + Math.sin(elapsed * 0.32 * speed) * 0.08;
    core.rotation.y = -0.58 + elapsed * 0.14 * speed;
    core.rotation.z = 0.18 + Math.sin(elapsed * 0.23 * speed) * 0.05;

    rings.forEach((ring, index) => {
      ring.rotation.z += (0.0018 + index * 0.0007) * speed;
      ring.rotation.y += (0.001 + index * 0.0005) * speed;
    });

    particles.rotation.y = elapsed * 0.024 * speed;
    particles.rotation.z = Math.sin(elapsed * 0.13 * speed) * 0.035;
    veil.rotation.x = elapsed * 0.035 * speed;
    veil.rotation.y = elapsed * -0.045 * speed;
    key.intensity = 6.2 + Math.sin(elapsed * 0.8 * speed) * 0.8;

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  render();
}
