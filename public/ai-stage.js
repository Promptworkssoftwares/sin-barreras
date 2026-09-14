const THREE_CDN = 'https://unpkg.com/three@0.179.1/build/three.module.js';
const VALID_STATES = new Set(['idle', 'listening', 'thinking', 'translating', 'speaking', 'paused']);
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));

const STATE_PALETTE = Object.freeze({
  idle: { primary: '#8fd7c5', secondary: '#ef9d84', dim: '#90a7a2', accent: '#cbeee4' },
  listening: { primary: '#74d9c0', secondary: '#b4f0e2', dim: '#7da59b', accent: '#d9fbf3' },
  thinking: { primary: '#b7ebe1', secondary: '#f2b29d', dim: '#9bb0ab', accent: '#fff1ea' },
  translating: { primary: '#9fe1d2', secondary: '#dc6247', dim: '#c78774', accent: '#fde1d7' },
  speaking: { primary: '#a7e5d5', secondary: '#d9593d', dim: '#d07c67', accent: '#ffd8cd' },
  paused: { primary: '#c9d4d1', secondary: '#a9b3b0', dim: '#b0bbb8', accent: '#eef2f0' }
});

let threePromise = null;
const loadThree = () => {
  if (!threePromise) threePromise = import(THREE_CDN);
  return threePromise;
};

export function initAIStage({ stage, canvas, fallback } = {}) {
  if (!stage || !canvas) return null;

  let THREE = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let animationFrame = 0;
  let resizeObserver = null;
  let destroyed = false;
  let currentState = 'idle';
  let currentEnergy = 0;
  let palette = null;

  let gridLines = null;
  let lanes = [];
  let signalPoints = null;
  let signalMeta = [];
  let nodeMesh = null;
  let nodeMeta = [];
  let focusBands = [];
  let pulseStrips = [];
  let bridgeLines = [];
  let bridgeOrbs = [];
  let frameLines = null;

  const api = { ready: false, setState, setVolume, destroy };

  function setState(kind = 'idle') {
    currentState = VALID_STATES.has(kind) ? kind : 'idle';
    stage.dataset.aiState = currentState;
  }

  function setVolume(volume = 0, speaking = false) {
    currentEnergy = clamp(volume);
    stage.style.setProperty('--ai-energy', currentEnergy.toFixed(3));
    stage.dataset.aiOutput = speaking || currentState === 'speaking' ? 'active' : 'idle';
  }

  function resize() {
    if (!renderer || !camera || destroyed) return;
    const width = Math.max(280, stage.clientWidth || canvas.clientWidth || 620);
    const height = Math.max(220, stage.clientHeight || canvas.clientHeight || 340);
    renderer.setSize(width, height, false);
    const aspect = width / height;
    camera.left = -6.2 * aspect;
    camera.right = 6.2 * aspect;
    camera.top = 3.2;
    camera.bottom = -3.2;
    camera.updateProjectionMatrix();
  }

  function buildGrid() {
    const positions = [];
    const xMax = 10.8;
    const yMax = 3.1;
    for (let x = -10.2; x <= 10.2; x += 0.95) {
      positions.push(x, -yMax, -0.8, x, yMax, -0.8);
    }
    for (let y = -2.85; y <= 2.85; y += 0.56) {
      positions.push(-xMax, y, -0.8, xMax, y, -0.8);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: 0xa7e5d5, transparent: true, opacity: 0.055 })
    );
  }

  function makeLanePath(baseY = 0, laneIndex = 0) {
    const points = [];
    const length = 9.7;
    for (let i = 0; i <= 18; i += 1) {
      const x = -length + (length * 2 * i) / 18;
      const bend = Math.sin((i / 18) * Math.PI * 2 + laneIndex * 0.6) * 0.09;
      const soft = Math.sin((i / 18) * Math.PI) * 0.04;
      points.push(new THREE.Vector3(x, baseY + bend + soft, -0.12));
    }
    return points;
  }

  function buildLane(path, color, opacity = 0.16) {
    const geometry = new THREE.BufferGeometry().setFromPoints(path);
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
    return line;
  }

  function buildLanes() {
    const defs = [
      { y: -1.56, side: 'left', color: 0xb9ece0 },
      { y: -0.9, side: 'left', color: 0x9fe1d2 },
      { y: -0.28, side: 'center', color: 0xeec9bc },
      { y: 0.38, side: 'center', color: 0xc3efe5 },
      { y: 1.02, side: 'right', color: 0xf2b29d },
      { y: 1.68, side: 'right', color: 0xe58f74 }
    ];
    return defs.map((def, index) => {
      const path = makeLanePath(def.y, index);
      const line = buildLane(path, def.color, def.side === 'center' ? 0.18 : 0.13);
      line.userData.path = path;
      line.userData.side = def.side;
      line.userData.baseY = def.y;
      scene.add(line);
      return line;
    });
  }

  function buildSignalPoints() {
    const count = 124;
    const positions = new Float32Array(count * 3);
    signalMeta = [];
    const laneIndices = [0, 1, 2, 3, 4, 5];
    for (let i = 0; i < count; i += 1) {
      const lane = laneIndices[i % laneIndices.length];
      const line = lanes[lane];
      const progress = Math.random();
      const x = -9.2 + progress * 18.4;
      const y = line.userData.baseY + Math.sin(progress * Math.PI * 2 + lane * 0.7) * 0.07;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = 0.16;
      signalMeta.push({ lane, progress, speed: 0.0015 + Math.random() * 0.0026, direction: lane < 3 ? 1 : -1, jitter: Math.random() * 6.28 });
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xa7e5d5, size: 0.072, transparent: true, opacity: 0.54, depthWrite: false })
    );
  }

  function buildNodes() {
    const nodePositions = [
      [-8.0,-1.55],[-5.9,-1.0],[-3.7,-0.32],[-1.7,-0.05],[0.1,0.2],[2.2,0.55],[4.2,1.02],[6.45,1.64],
      [-8.2,1.55],[-6.0,1.05],[-3.9,0.44],[-1.8,0.06],[0.15,-0.22],[2.0,-0.52],[4.0,-1.02],[6.35,-1.62],
      [-4.7,1.82],[-2.6,1.2],[1.9,1.2],[4.9,-1.88]
    ];
    nodeMeta = nodePositions.map(([x,y], index) => ({ x, y, scale: index % 4 === 0 ? 1.35 : 1, phase: Math.random() * 6.28 }));
    const geometry = new THREE.BoxGeometry(0.09, 0.09, 0.09);
    const material = new THREE.MeshBasicMaterial({ color: 0xa7e5d5, transparent: true, opacity: 0.58 });
    const mesh = new THREE.InstancedMesh(geometry, material, nodeMeta.length);
    const dummy = new THREE.Object3D();
    nodeMeta.forEach((node, index) => {
      dummy.position.set(node.x, node.y, 0.2);
      dummy.scale.setScalar(node.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  function buildBridgeLines() {
    const defs = [
      [[-9.1,-2.2],[-7.1,-2.2],[-5.8,-1.65],[-3.8,-1.65]],
      [[9.1,2.15],[7.1,2.15],[5.7,1.6],[3.8,1.6]],
      [[-9.2,2.2],[-7.3,2.2],[-5.9,1.64],[-4.1,1.64]],
      [[9.25,-2.15],[7.1,-2.15],[5.6,-1.6],[3.8,-1.6]]
    ];
    return defs.map((path) => {
      const points = path.map(([x,y]) => new THREE.Vector3(x, y, -0.2));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xeec9bc, transparent: true, opacity: 0.115 }));
      scene.add(line);
      return line;
    });
  }

  function buildBridgeOrbs() {
    const defs = [
      { path: [[-9.1,-2.2],[-7.1,-2.2],[-5.8,-1.65],[-3.8,-1.65]], speed: 0.0019, color: 0xa7e5d5 },
      { path: [[9.1,2.15],[7.1,2.15],[5.7,1.6],[3.8,1.6]], speed: 0.0018, color: 0xd9593d },
      { path: [[-9.2,2.2],[-7.3,2.2],[-5.9,1.64],[-4.1,1.64]], speed: 0.0016, color: 0xa7e5d5 },
      { path: [[9.25,-2.15],[7.1,-2.15],[5.6,-1.6],[3.8,-1.6]], speed: 0.0017, color: 0xd9593d }
    ];
    return defs.map((def, index) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, 0.2),
        new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.26, depthWrite: false })
      );
      mesh.userData.points = def.path.map(([x,y]) => ({ x, y }));
      mesh.userData.progress = Math.random();
      mesh.userData.speed = def.speed;
      mesh.userData.index = index;
      scene.add(mesh);
      return mesh;
    });
  }

  function buildFocusBands() {
    const defs = [
      { y: -1.58, height: 0.44, color: 0xa7e5d5 },
      { y: 1.58, height: 0.44, color: 0xf2b29d }
    ];
    return defs.map((def) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(19.5, def.height),
        new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.055, depthWrite: false })
      );
      mesh.position.set(0, def.y, -0.45);
      scene.add(mesh);
      return mesh;
    });
  }

  function buildPulseStrips() {
    const defs = [-0.06, 0.06];
    return defs.map((y, index) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(15.2, 0.075),
        new THREE.MeshBasicMaterial({ color: index === 0 ? 0xa7e5d5 : 0xd9593d, transparent: true, opacity: 0.115, depthWrite: false })
      );
      mesh.position.set(0, y, -0.3);
      scene.add(mesh);
      return mesh;
    });
  }

  function buildFrameLines() {
    const positions = [
      -10.2, 2.45, -0.52, -8.9, 2.45, -0.52,
      -10.2, 2.45, -0.52, -10.2, 1.65, -0.52,
       10.2, 2.45, -0.52,  8.9, 2.45, -0.52,
       10.2, 2.45, -0.52, 10.2, 1.65, -0.52,
      -10.2,-2.45, -0.52, -8.9,-2.45, -0.52,
      -10.2,-2.45, -0.52, -10.2,-1.65, -0.52,
       10.2,-2.45, -0.52,  8.9,-2.45, -0.52,
       10.2,-2.45, -0.52, 10.2,-1.65, -0.52
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xd9eae4, transparent: true, opacity: 0.23 }));
  }

  function pointOnPolyline(points, progress) {
    const total = points.length - 1;
    const scaled = Math.max(0, Math.min(total - 0.0001, progress * total));
    const i = Math.floor(scaled);
    const local = scaled - i;
    const a = points[i];
    const b = points[i + 1];
    return {
      x: a.x + (b.x - a.x) * local,
      y: a.y + (b.y - a.y) * local
    };
  }

  function updateSignals(speedMultiplier, time) {
    if (!signalPoints) return;
    const positions = signalPoints.geometry.attributes.position.array;
    for (let i = 0; i < signalMeta.length; i += 1) {
      const idx = i * 3;
      const meta = signalMeta[i];
      meta.progress += meta.speed * speedMultiplier * (meta.direction > 0 ? 1 : -1);
      if (meta.progress > 1) meta.progress = 0;
      if (meta.progress < 0) meta.progress = 1;
      const line = lanes[meta.lane];
      const point = pointOnPolyline(line.userData.path, meta.progress);
      positions[idx] = point.x;
      positions[idx + 1] = point.y + Math.sin(time * 1.25 + meta.jitter) * 0.014;
    }
    signalPoints.geometry.attributes.position.needsUpdate = true;
  }

  function updateNodes(time, energy, activeState) {
    if (!nodeMesh) return;
    const dummy = new THREE.Object3D();
    nodeMeta.forEach((node, index) => {
      const pulse = 1 + Math.sin(time * 1.8 + node.phase) * (activeState ? 0.15 : 0.08) + energy * 0.18;
      dummy.position.set(node.x, node.y, 0.2);
      dummy.scale.setScalar(node.scale * pulse);
      dummy.updateMatrix();
      nodeMesh.setMatrixAt(index, dummy.matrix);
    });
    nodeMesh.instanceMatrix.needsUpdate = true;
  }

  function updateBridgeOrbs(time, speedMultiplier, tone) {
    bridgeOrbs.forEach((orb, index) => {
      const direction = index < 2 ? 1 : -1;
      orb.userData.progress += orb.userData.speed * speedMultiplier * direction;
      if (orb.userData.progress > 1) orb.userData.progress = 0;
      if (orb.userData.progress < 0) orb.userData.progress = 1;
      const point = pointOnPolyline(orb.userData.points, orb.userData.progress);
      orb.position.set(point.x, point.y, 0.25);
      orb.material.opacity = currentState === 'paused' ? 0.12 : 0.24 + currentEnergy * 0.24;
      orb.material.color.lerp(index % 2 === 0 ? tone.primary : tone.secondary, 0.08);
      orb.scale.setScalar(1 + Math.sin(time * 2.4 + index) * 0.16 + currentEnergy * 0.32);
    });
  }

  function animate(now = 0) {
    if (destroyed || !renderer || !scene || !camera || !palette) return;
    const t = now * 0.001;
    const tone = palette[currentState] || palette.idle;
    const activeState = ['listening','thinking','translating','speaking'].includes(currentState);
    const stateSpeed = currentState === 'speaking' ? 2.2
      : currentState === 'translating' ? 1.78
        : currentState === 'thinking' ? 1.18
          : currentState === 'listening' ? 1.02
            : currentState === 'paused' ? 0.28 : 0.58;
    const energy = currentEnergy;

    gridLines.material.color.lerp(tone.dim, 0.03);
    gridLines.material.opacity = currentState === 'paused' ? 0.026 : 0.042 + energy * 0.03;
    frameLines.material.color.lerp(tone.accent, 0.03);
    frameLines.material.opacity = 0.16 + (activeState ? 0.05 : 0) + energy * 0.06;

    lanes.forEach((line, index) => {
      const emphasis = (currentState === 'listening' && index < 2) || (currentState === 'thinking' && index < 4)
        || (currentState === 'translating' && index >= 2 && index <= 4) || (currentState === 'speaking' && index >= 4);
      line.material.color.lerp(index < 3 ? tone.primary : tone.secondary, 0.07);
      line.material.opacity = emphasis ? 0.42 + energy * 0.22 : 0.17 + energy * 0.09;
    });

    focusBands.forEach((band, index) => {
      band.material.color.lerp(index === 0 ? tone.primary : tone.secondary, 0.06);
      band.material.opacity = currentState === 'paused' ? 0.026 : 0.05 + energy * 0.08 + (activeState ? 0.028 : 0);
    });

    pulseStrips.forEach((strip, index) => {
      strip.material.color.lerp(index === 0 ? tone.primary : tone.secondary, 0.08);
      strip.material.opacity = currentState === 'paused' ? 0.05 : 0.1 + energy * 0.1 + (activeState ? 0.035 : 0);
      strip.scale.x = 1 + Math.sin(t * (1.25 + index * 0.3)) * 0.02 + energy * 0.04;
    });

    signalPoints.material.color.lerp(tone.primary, 0.06);
    signalPoints.material.opacity = currentState === 'paused' ? 0.2 : 0.4 + energy * 0.32;
    updateSignals(1 + stateSpeed + energy * 3.1, t);

    bridgeLines.forEach((line, index) => {
      line.material.color.lerp(index % 2 === 0 ? tone.primary : tone.secondary, 0.05);
      line.material.opacity = 0.08 + energy * 0.06 + (activeState ? 0.03 : 0);
    });
    updateBridgeOrbs(t, 1 + stateSpeed + energy * 2.1, tone);

    nodeMesh.material.color.lerp(tone.primary, 0.05);
    nodeMesh.material.opacity = currentState === 'paused' ? 0.26 : 0.42 + energy * 0.24;
    updateNodes(t, energy, activeState);

    renderer.render(scene, camera);
    animationFrame = window.requestAnimationFrame(animate);
  }

  async function boot() {
    try {
      THREE = await loadThree();
      if (destroyed) return;

      palette = Object.fromEntries(Object.entries(STATE_PALETTE).map(([key, value]) => [
        key,
        {
          primary: new THREE.Color(value.primary),
          secondary: new THREE.Color(value.secondary),
          dim: new THREE.Color(value.dim),
          accent: new THREE.Color(value.accent)
        }
      ]));

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearAlpha(0);
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-8, 8, 3.2, -3.2, 0.1, 20);
      camera.position.z = 8;

      gridLines = buildGrid();
      scene.add(gridLines);
      lanes = buildLanes();
      signalPoints = buildSignalPoints();
      scene.add(signalPoints);
      nodeMesh = buildNodes();
      scene.add(nodeMesh);
      bridgeLines = buildBridgeLines();
      bridgeOrbs = buildBridgeOrbs();
      focusBands = buildFocusBands();
      pulseStrips = buildPulseStrips();
      frameLines = buildFrameLines();
      scene.add(frameLines);

      api.ready = true;
      stage.classList.add('ai-stage-ready');
      stage.classList.remove('ai-stage-error');
      if (fallback) fallback.hidden = true;
      resize();
      animationFrame = window.requestAnimationFrame(animate);
    } catch (error) {
      console.warn('Sin Barreras tech background could not initialize Three.js:', error);
      stage.classList.add('ai-stage-error');
      if (fallback) fallback.hidden = false;
    }
  }

  function destroy() {
    destroyed = true;
    api.ready = false;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect?.();
    window.removeEventListener('resize', resize);
    try { renderer?.dispose?.(); } catch { /* no-op */ }
    renderer = null;
    scene = null;
    camera = null;
  }

  setState('idle');
  setVolume(0, false);
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
  } else {
    window.addEventListener('resize', resize, { passive: true });
  }
  boot();
  return api;
}
