import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.querySelector("[data-hero-3d]");
const hero = canvas?.closest(".hero");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const makeLabelTexture = (label, sublabel, accent = "#c8ff4d") => {
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512;
  labelCanvas.height = 512;
  const ctx = labelCanvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, "rgba(245, 242, 236, 0.16)");
  gradient.addColorStop(0.52, "rgba(12, 14, 12, 0.88)");
  gradient.addColorStop(1, "rgba(200, 255, 77, 0.16)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "rgba(200, 255, 77, 0.42)";
  ctx.lineWidth = 10;
  ctx.strokeRect(28, 28, 456, 456);

  const labelSize = label.length > 7 ? 68 : label.length > 5 ? 92 : 138;

  ctx.fillStyle = accent;
  ctx.font = `900 ${labelSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 256, 236);

  ctx.fillStyle = "rgba(245, 242, 236, 0.78)";
  ctx.font = "800 34px Arial, sans-serif";
  ctx.fillText(sublabel, 256, 340);

  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

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
  camera.position.set(0, 0.2, 8.2);

  const rig = new THREE.Group();
  rig.position.set(1.55, -0.05, -0.3);
  scene.add(rig);

  const key = new THREE.PointLight(0xc8ff4d, 7.4, 18);
  key.position.set(2.7, 2.4, 3.4);
  scene.add(key);

  const warm = new THREE.PointLight(0xf05a3f, 2.1, 14);
  warm.position.set(-3.8, -2.2, 2.6);
  scene.add(warm);

  const fill = new THREE.DirectionalLight(0xf5f2ec, 1.5);
  fill.position.set(-2, 3, 5);
  scene.add(fill);

  const faceData = [
    ["RAJAT", "AI BUILDER", "#c8ff4d"],
    ["CSE", "VIT-AP", "#f5f2ec"],
    ["FLYRANK", "AI INTERN", "#66d9ff"],
    ["PREPPEER", "AI INTERVIEWS", "#ff7a59"],
    ["NEXTSTEP", "EDTECH AI", "#c8ff4d"],
    ["STACK", "WEB + API", "#f5f2ec"]
  ];

  const cubeMaterials = faceData.map(([label, sublabel, accent]) =>
    new THREE.MeshPhysicalMaterial({
      map: makeLabelTexture(label, sublabel, accent),
      color: 0xffffff,
      metalness: 0.42,
      roughness: 0.2,
      clearcoat: 0.82,
      clearcoatRoughness: 0.16,
      transparent: true,
      opacity: 0.88,
      emissive: 0x101806,
      emissiveIntensity: 0.2
    })
  );

  const cube = new THREE.Mesh(new THREE.BoxGeometry(1.86, 1.86, 1.86, 16, 16, 16), cubeMaterials);
  cube.rotation.set(0.26, -0.58, 0.12);
  rig.add(cube);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(cube.geometry),
    new THREE.LineBasicMaterial({
      color: 0xc8ff4d,
      transparent: true,
      opacity: 0.42
    })
  );
  cube.add(edge);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xc8ff4d,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const rings = [];
  [
    [2.58, 0.012, 0.82, 0.18],
    [3.18, 0.01, -0.72, -0.34],
    [3.72, 0.008, 1.12, 0.48]
  ].forEach(([radius, tube, x, z], index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 220, 8), ringMaterial.clone());
    ring.rotation.set(x, index * 0.72, z);
    ring.material.opacity = 0.24 - index * 0.04;
    rig.add(ring);
    rings.push(ring);
  });

  const nodeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc8ff4d,
    metalness: 0.18,
    roughness: 0.24,
    emissive: 0x638000,
    emissiveIntensity: 0.85,
    clearcoat: 0.5
  });

  const nodeGroup = new THREE.Group();
  const nodePositions = [
    [2.5, 0.24, 0],
    [-2.1, -0.72, 0.8],
    [0.34, 1.9, -0.7],
    [0.85, -1.8, -0.94]
  ];
  nodePositions.forEach((position) => {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), nodeMaterial);
    node.position.set(...position);
    nodeGroup.add(node);
  });
  rig.add(nodeGroup);

  const particleCount = 430;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const colorA = new THREE.Color(0xc8ff4d);
  const colorB = new THREE.Color(0xf5f2ec);
  const colorC = new THREE.Color(0xf05a3f);

  for (let i = 0; i < particleCount; i += 1) {
    const i3 = i * 3;
    const radius = 1.8 + Math.random() * 5.4;
    const angle = Math.random() * Math.PI * 2;
    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = (Math.random() - 0.5) * 4.7;
    positions[i3 + 2] = Math.sin(angle) * radius * 0.42 - 0.7 + Math.random() * 2.6;

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
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  particles.position.set(0.8, 0, -0.55);
  scene.add(particles);

  const targetRotation = new THREE.Vector3(0, 0, 0);
  const currentRotation = targetRotation.clone();
  const dragStart = new THREE.Vector2();
  const rotationStart = new THREE.Vector3();
  let dragging = false;

  const isInteractiveTarget = (target) => target.closest?.("a, button, input, textarea, select, [data-ai-drawer]");

  hero.addEventListener("pointerdown", (event) => {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    event.preventDefault();
    dragging = true;
    dragStart.set(event.clientX, event.clientY);
    rotationStart.copy(targetRotation);
    hero.classList.add("is-rotating-3d");
    hero.setPointerCapture?.(event.pointerId);
  });

  window.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }

    event.preventDefault();
    const dx = (event.clientX - dragStart.x) / Math.max(1, hero.clientWidth);
    const dy = (event.clientY - dragStart.y) / Math.max(1, hero.clientHeight);
    targetRotation.y = rotationStart.y + dx * Math.PI * 3.2;
    targetRotation.x = rotationStart.x + dy * Math.PI * 3.2;
    targetRotation.z = rotationStart.z + (dx - dy) * Math.PI * 0.35;
  });

  const endDrag = (event) => {
    dragging = false;
    hero.classList.remove("is-rotating-3d");
    if (event?.pointerId !== undefined) {
      hero.releasePointerCapture?.(event.pointerId);
    }
  };

  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  const clock = new THREE.Clock();

  const resize = () => {
    const width = Math.max(1, hero.clientWidth);
    const height = Math.max(1, hero.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const mobile = width < 760;
    rig.position.set(mobile ? 0.78 : 3.72, mobile ? -1.38 : -0.72, mobile ? -1.02 : -0.5);
    rig.scale.setScalar(mobile ? 0.3 : 0.42);
    particles.position.x = mobile ? 0.28 : 1.56;
    camera.position.z = mobile ? 9.4 : 8.2;
  };

  const observer = new ResizeObserver(resize);
  observer.observe(hero);
  resize();

  const render = () => {
    const elapsed = clock.getElapsedTime();
    const speed = reduceMotion ? 0.08 : 1;

    if (!dragging) {
      targetRotation.y += 0.0017 * speed;
      targetRotation.x += Math.sin(elapsed * 0.38 * speed) * 0.0007;
    }

    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;
    currentRotation.z += (targetRotation.z - currentRotation.z) * 0.08;
    rig.rotation.set(currentRotation.x, currentRotation.y, currentRotation.z);
    cube.rotation.z = 0.12 + Math.sin(elapsed * 0.26 * speed) * 0.035;

    rings.forEach((ring, index) => {
      ring.rotation.z += (0.0014 + index * 0.0006) * speed;
      ring.rotation.y += (0.0008 + index * 0.0004) * speed;
    });

    nodeGroup.rotation.y = -rig.rotation.y * 0.42 + elapsed * 0.05 * speed;
    particles.rotation.y = elapsed * 0.022 * speed;
    particles.rotation.z = Math.sin(elapsed * 0.13 * speed) * 0.035;
    key.intensity = 6.6 + Math.sin(elapsed * 0.8 * speed) * 0.8;

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  render();
}
