/**
 * Warm Wood Living Room — Exhibition Booth 3D Mockup
 * Booth: 15 m wide × 3 m deep floor platform, with a 3 m high backdrop wall.
 * Zones: A Kitchen Bar · B Living Lounge · C Sculpture Gallery (50 cm sculptures)
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ---------------------------------------------------------------------------
// Booth dimensions (metres)
// ---------------------------------------------------------------------------
const W = 15;        // backdrop wall width
const H = 3;         // backdrop wall height
const D = 3;         // platform depth: 3 m
const FY = 0.1;      // platform top height
const SCULPT_H = 0.5; // sculpture height (50 cm)

const V2 = THREE.Vector2;
const V3 = THREE.Vector3;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);

// ---------------------------------------------------------------------------
// Renderer / scene / camera
// ---------------------------------------------------------------------------
const container = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.className = 'label-layer';
container.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14100c);
scene.fog = new THREE.Fog(0x14100c, 36, 85);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.05, 200);
camera.position.set(10, 5, 12.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.3, 1.2);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 1.2;
controls.maxDistance = 36;
controls.autoRotateSpeed = 0.6;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new V2(window.innerWidth, window.innerHeight), 0.12, 0.22, 0.94);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const booth = new THREE.Group();
scene.add(booth);

// Registries for lighting modes
const accentLights = []; // { light, base }
const glowMats = [];     // { mat, base }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = booth, cast = true, receive = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
}
function B(w, h, d, r = 0) {
  return r > 0 ? new RoundedBoxGeometry(w, h, d, 4, r) : new THREE.BoxGeometry(w, h, d);
}
function std(color, roughness = 0.6, metalness = 0, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}
function glow(color, intensity = 2) {
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.5 });
  glowMats.push({ mat: m, base: intensity });
  return m;
}
function addAccent(light, base) {
  light.intensity = base;
  accentLights.push({ light, base });
  return light;
}

// ---------------------------------------------------------------------------
// Procedural textures (no external image assets needed)
// ---------------------------------------------------------------------------
function canvasTex(w, h, draw, repeat = [1, 1], srgb = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function texRepeat(tex, rx, ry, rotation = 0) {
  const t = tex.clone();
  t.repeat.set(rx, ry);
  if (rotation) { t.center.set(0.5, 0.5); t.rotation = rotation; }
  t.needsUpdate = true;
  return t;
}
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) * f) | 0;
  const g = Math.min(255, ((n >> 8) & 255) * f) | 0;
  const b = Math.min(255, (n & 255) * f) | 0;
  return `rgb(${r},${g},${b})`;
}
function grain(g, x, y, w, h, dark, light, n) {
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  for (let i = 0; i < n; i++) {
    const yy = y + Math.random() * h;
    const amp = 1 + Math.random() * h * 0.05;
    const f = 0.003 + Math.random() * 0.012;
    const ph = Math.random() * 6.28;
    g.strokeStyle = Math.random() < 0.6 ? dark : light;
    g.globalAlpha = 0.06 + Math.random() * 0.2;
    g.lineWidth = 0.6 + Math.random() * 2;
    g.beginPath();
    for (let xx = x; xx <= x + w + 6; xx += 6) {
      const v = yy + Math.sin(xx * f + ph) * amp + Math.sin(xx * f * 3.1 + ph) * amp * 0.25;
      xx === x ? g.moveTo(xx, v) : g.lineTo(xx, v);
    }
    g.stroke();
  }
  g.restore();
}
function noise(g, w, h, count, colors, size = [1, 2], alpha = [0.03, 0.12]) {
  for (let i = 0; i < count; i++) {
    g.globalAlpha = rand(alpha[0], alpha[1]);
    g.fillStyle = colors[(Math.random() * colors.length) | 0];
    const s = rand(size[0], size[1]);
    g.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
  g.globalAlpha = 1;
}

function woodTex(base, dark, light) {
  return canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    grain(g, 0, 0, w, h, dark, light, 170);
  });
}

const TEX = {};
function buildTextures() {
  // Wide oak plank floor — canvas represents 2 m × 2 m
  TEX.floor = canvasTex(1024, 1024, (g, w, h) => {
    const rows = 9, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -Math.random() * w * 0.6;
      while (x < w) {
        const len = w * rand(0.45, 0.85);
        g.fillStyle = shade('#a87445', rand(0.82, 1.12));
        g.fillRect(x, r * rh, len, rh);
        grain(g, x, r * rh, len, rh, '#5e3b1f', '#d3a46d', 26);
        g.fillStyle = 'rgba(45,28,14,0.55)';
        g.fillRect(x, r * rh, 2, rh);
        x += len;
      }
      g.fillStyle = 'rgba(45,28,14,0.5)';
      g.fillRect(0, r * rh, w, 2);
    }
  }, [W / 2, D / 2]);

  TEX.oak = woodTex('#b5804c', '#6e4523', '#dcb07a');
  TEX.walnut = woodTex('#5c3b24', '#2c1a0e', '#8a5f3d');
  TEX.honey = woodTex('#c08a52', '#7a4c27', '#e5bd88');

  // Cream stone brick (colour + bump) — canvas represents 2 m × 1 m
  const bw = 1024, bh = 512, rows = 8, rh = bh / rows, gap = 6;
  const layout = [];
  for (let r = 0; r < rows; r++) {
    let x = -(r % 2) * 70 - Math.random() * 40;
    while (x < bw) {
      const len = rand(95, 185);
      layout.push([x, r * rh, len, rh, rand(0.86, 1.08)]);
      x += len;
    }
  }
  TEX.brick = canvasTex(bw, bh, (g) => {
    g.fillStyle = '#cbbda3'; g.fillRect(0, 0, bw, bh);
    for (const [x, y, l, hh, t] of layout) {
      g.fillStyle = shade('#ece0ca', t);
      g.fillRect(x + gap / 2, y + gap / 2, l - gap, hh - gap);
    }
    noise(g, bw, bh, 9000, ['#a8977c', '#fff8ea', '#8c7a60'], [1, 3]);
  });
  TEX.brickBump = canvasTex(bw, bh, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, bw, bh);
    for (const [x, y, l, hh] of layout) {
      g.fillStyle = '#b8b8b8';
      g.fillRect(x + gap / 2, y + gap / 2, l - gap, hh - gap);
    }
    noise(g, bw, bh, 14000, ['#ffffff', '#555555'], [1, 4], [0.1, 0.35]);
  }, [1, 1], false);

  // Calacatta-style marble
  TEX.marble = canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#f3eee6'; g.fillRect(0, 0, w, h);
    const vein = (lw, alpha, blur) => {
      g.filter = `blur(${blur}px)`;
      g.strokeStyle = `rgba(128,112,96,${alpha})`;
      g.lineWidth = lw;
      g.beginPath();
      let x = Math.random() * w, y = 0;
      g.moveTo(x, y);
      while (y < h) { x += rand(-40, 40); y += rand(20, 60); g.lineTo(x, y); }
      g.stroke();
    };
    for (let i = 0; i < 7; i++) vein(rand(3, 7), 0.18, 4);
    for (let i = 0; i < 16; i++) vein(rand(0.6, 1.6), 0.35, 0.6);
    g.filter = 'none';
  });

  // Woven jute rug with border
  TEX.jute = canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#a98c63'; g.fillRect(0, 0, w, h);
    const s = 8;
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        const alt = ((x + y) / s) % 2 === 0;
        g.fillStyle = shade('#c2a479', rand(0.8, 1.1));
        g.beginPath();
        g.ellipse(x + s / 2, y + s / 2, alt ? s * 0.55 : s * 0.3, alt ? s * 0.3 : s * 0.55, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.strokeStyle = 'rgba(70,48,26,0.55)'; g.lineWidth = 26;
    g.strokeRect(40, 40, w - 80, h - 80);
    g.strokeStyle = 'rgba(70,48,26,0.3)'; g.lineWidth = 6;
    g.strokeRect(80, 80, w - 160, h - 160);
  });

  TEX.fabric = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#efe6d7'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(150,130,100,${rand(0.02, 0.07)})`; g.fillRect(0, y, w, 1); }
    for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(255,255,255,${rand(0.02, 0.06)})`; g.fillRect(x, 0, 1, h); }
    noise(g, w, h, 4000, ['#b8a587', '#ffffff'], [1, 2]);
  }, [3, 3]);

  TEX.knit = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#7e3a1f'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) {
      for (let x = 0; x < w; x += 16) {
        g.fillStyle = shade('#a2532e', rand(0.9, 1.1));
        g.beginPath(); g.ellipse(x + 4, y + 8, 4, 7, 0.5, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(x + 12, y + 8, 4, 7, -0.5, 0, Math.PI * 2); g.fill();
      }
    }
  }, [4, 4]);

  TEX.plaster = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#ece2d2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '180,160,130' : '255,250,240'},0.05)`;
      g.beginPath(); g.arc(Math.random() * w, Math.random() * h, rand(10, 60), 0, Math.PI * 2); g.fill();
    }
    noise(g, w, h, 3000, ['#bba98d', '#ffffff'], [1, 2]);
  }, [4, 1]);

  // Exhibition hall floor with soft radial pool of light
  TEX.hall = canvasTex(1024, 1024, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, '#3a3029'); grd.addColorStop(0.35, '#2a221c'); grd.addColorStop(1, '#17110c');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    noise(g, w, h, 20000, ['#000000', '#5a4a3e'], [1, 2], [0.05, 0.15]);
  });

  // 4 Fine Art Canvas Textures (Tuscan Earth, Minimalist Wave, Botanical Balance, Horizon Dunes)
  TEX.art1 = canvasTex(512, 680, (g, w, h) => {
    g.fillStyle = '#f2e8d9'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b56138';
    g.beginPath(); g.arc(w * 0.45, h * 0.52, w * 0.35, Math.PI, 0); g.lineTo(w * 0.8, h); g.lineTo(w * 0.1, h); g.fill();
    g.fillStyle = '#db9c68';
    g.beginPath(); g.arc(w * 0.65, h * 0.3, w * 0.18, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5c6440';
    g.beginPath(); g.arc(w * 0.32, h * 0.72, w * 0.2, 0, Math.PI * 2); g.fill();
    noise(g, w, h, 8000, ['#8a7558', '#ffffff'], [1, 2]);
  });

  TEX.art2 = canvasTex(512, 680, (g, w, h) => {
    g.fillStyle = '#ece3d2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4a3b32';
    g.beginPath();
    g.moveTo(w * 0.15, h * 0.15);
    g.bezierCurveTo(w * 0.85, h * 0.2, w * 0.2, h * 0.7, w * 0.85, h * 0.85);
    g.bezierCurveTo(w * 0.4, h * 0.95, w * 0.05, h * 0.5, w * 0.15, h * 0.15);
    g.fill();
    g.fillStyle = '#c98a5b';
    g.beginPath(); g.arc(w * 0.65, h * 0.45, w * 0.15, 0, Math.PI * 2); g.fill();
    noise(g, w, h, 8000, ['#6b5a45', '#ffffff'], [1, 2]);
  });

  TEX.art3 = canvasTex(512, 680, (g, w, h) => {
    g.fillStyle = '#f2ece0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#656e4a';
    g.beginPath(); g.ellipse(w * 0.45, h * 0.4, w * 0.3, h * 0.22, -0.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#a4532d';
    g.fillRect(w * 0.2, h * 0.65, w * 0.6, h * 0.18);
    g.fillStyle = '#dbb27a';
    g.beginPath(); g.arc(w * 0.5, h * 0.22, w * 0.12, 0, Math.PI * 2); g.fill();
    noise(g, w, h, 8000, ['#7a6850', '#ffffff'], [1, 2]);
  });

  TEX.art4 = canvasTex(800, 512, (g, w, h) => {
    g.fillStyle = '#ede5d5'; g.fillRect(0, 0, w, h);
    const bands = [
      ['#cca37b', 0.4, 0.6],
      ['#5d6849', 0.55, 0.75],
      ['#a65836', 0.7, 0.9],
      ['#3b3027', 0.82, 1.0],
    ];
    for (const [col, y0, y1] of bands) {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(0, h * y0);
      for (let x = 0; x <= w; x += 20) {
        const ny = h * y0 + Math.sin(x * 0.015) * 18 + Math.cos(x * 0.03) * 10;
        g.lineTo(x, ny);
      }
      g.lineTo(w, h * y1);
      g.lineTo(0, h * y1);
      g.fill();
    }
    g.fillStyle = '#e8be78';
    g.beginPath(); g.arc(w * 0.65, h * 0.3, h * 0.18, 0, Math.PI * 2); g.fill();
    noise(g, w, h, 10000, ['#7a6850', '#ffffff'], [1, 2]);
  });
  TEX.art = TEX.art1;
}

function logoTexture(main, sub, color = '#f4dcae') {
  return canvasTex(2048, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '28px';
    g.font = '600 230px "Cormorant Garamond", serif';
    g.fillText(main, w / 2, h * 0.4);
    g.letterSpacing = '22px';
    g.font = '400 62px "Outfit", sans-serif';
    g.fillText(sub, w / 2, h * 0.84);
  });
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------
const M = {};
function buildMaterials() {
  M.floor = std(0xffffff, 0.55, 0, { map: TEX.floor });
  M.oak = std(0xffffff, 0.55, 0, { map: TEX.oak });
  M.oakV = std(0xffffff, 0.6, 0, { map: texRepeat(TEX.honey, 1, 1, Math.PI / 2) });
  M.walnut = std(0xffffff, 0.45, 0, { map: TEX.walnut });
  M.plaster = std(0xffffff, 0.92, 0, { map: TEX.plaster });
  M.limewash = std(0xd9c0a0, 0.95, 0, { map: texRepeat(TEX.plaster, 2, 2) });
  M.olive = std(0x56603f, 0.55);
  M.oliveDoor = std(0x5f6a46, 0.5);
  M.marble = std(0xffffff, 0.25, 0, { map: TEX.marble });
  M.brass = std(0xc9a25a, 0.28, 1);
  M.brassSatin = std(0xb8904c, 0.45, 1);
  M.blackMetal = std(0x1c1a18, 0.45, 0.6);
  M.leather = std(0x8e5532, 0.48);
  M.leatherDark = std(0x6b3c22, 0.5);
  M.linen = std(0xffffff, 0.95, 0, { map: TEX.fabric });
  M.knit = std(0xffffff, 0.95, 0, { map: TEX.knit });
  M.jute = std(0xffffff, 0.98, 0, { map: TEX.jute });
  M.ceramic = std(0xefe9df, 0.35, 0, { side: THREE.DoubleSide });
  M.terracotta = std(0xb5653b, 0.8, 0, { side: THREE.DoubleSide });
  M.basalt = std(0x2d2a27, 0.55, 0, { side: THREE.DoubleSide });
  M.travertine = std(0xd8c8ad, 0.85, 0, { map: texRepeat(TEX.plaster, 0.5, 0.5) });
  M.bronze = std(0x8c6239, 0.32, 1, { side: THREE.DoubleSide });
  M.soil = std(0x3b2a1d, 1);
  M.bark = std(0x5a4636, 0.9);
  M.leaf = std(0xffffff, 0.7, 0, { side: THREE.DoubleSide });
  M.shade = std(0xf3e6cf, 0.9, 0, { side: THREE.DoubleSide, emissive: 0xffd7a0, emissiveIntensity: 0.25 });
  M.candle = std(0xf4ecdc, 0.6);
  M.hall = std(0xffffff, 0.85, 0, { map: TEX.hall });
  M.led = glow(0xffdfb0, 1.0);
  M.bulb = glow(0xffd699, 1.4);
  M.flame = glow(0xffa64a, 1.5);
  M.art1 = std(0xffffff, 0.9, 0, { map: TEX.art1 });
  M.art2 = std(0xffffff, 0.9, 0, { map: TEX.art2 });
  M.art3 = std(0xffffff, 0.9, 0, { map: TEX.art3 });
  M.art4 = std(0xffffff, 0.9, 0, { map: TEX.art4 });
  M.art = M.art1;
  M.pillow = {
    rust: std(0xa4532d, 0.95, 0, { map: TEX.fabric }),
    olive: std(0x6a7248, 0.95, 0, { map: TEX.fabric }),
    beige: std(0xd7c4a3, 0.95, 0, { map: TEX.fabric }),
    cream: std(0xf3ece0, 0.95, 0, { map: TEX.fabric }),
    terra: std(0xc0805a, 0.95, 0, { map: TEX.fabric }),
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
function lathe(points, mat, seg = 48) {
  return new THREE.Mesh(new THREE.LatheGeometry(points.map(([x, y]) => new V2(x, y)), seg), mat);
}

function makePlant({ potR = 0.18, potH = 0.38, potMat = M.ceramic, trunkH = 1.1, crown = [0.45, 0.4, 0.45], leaves = 160, leafSize = 0.07, hue = 0.25, tree = true } = {}) {
  const g = new THREE.Group();
  const pot = lathe([[0, 0], [potR * 0.72, 0], [potR, potH * 0.55], [potR * 0.96, potH], [potR * 0.86, potH]], potMat, 32);
  pot.castShadow = pot.receiveShadow = true;
  g.add(pot);
  mesh(new THREE.CircleGeometry(potR * 0.86, 24).rotateX(-Math.PI / 2), M.soil, 0, potH * 0.96, 0, g);
  let cy = potH + 0.12;
  if (tree) {
    const trunk = mesh(new THREE.CylinderGeometry(0.014, 0.026, trunkH, 8), M.bark, 0.02, potH + trunkH / 2, 0, g);
    trunk.rotation.z = 0.05;
    cy = potH + trunkH;
  }
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), M.leaf, leaves);
  const d = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < leaves; i++) {
    const dir = new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(Math.cbrt(Math.random()));
    d.position.set(dir.x * crown[0], cy + dir.y * crown[1] + (tree ? 0 : crown[1] * 0.6), dir.z * crown[2]);
    d.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
    const s = leafSize * rand(0.7, 1.3);
    d.scale.set(s, s * 0.16, s * 0.42);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
    c.setHSL(hue + rand(-0.02, 0.04), rand(0.28, 0.45), rand(0.2, 0.34));
    im.setColorAt(i, c);
  }
  im.castShadow = true;
  g.add(im);
  return g;
}

function makeBouquet() {
  const g = new THREE.Group();
  const vase = lathe([[0, 0], [0.06, 0], [0.1, 0.08], [0.11, 0.15], [0.07, 0.24], [0.05, 0.28], [0.06, 0.3]], M.ceramic);
  vase.castShadow = true; g.add(vase);
  const leaves = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), M.leaf, 90);
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std(0xf6f1e6, 0.8), 26);
  const d = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < 90; i++) {
    const a = rand(0, Math.PI * 2), r = rand(0.02, 0.24), y = 0.3 + rand(0, 0.32) - r * 0.3;
    d.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    d.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    const s = rand(0.03, 0.05); d.scale.set(s, s * 0.18, s * 0.45); d.updateMatrix();
    leaves.setMatrixAt(i, d.matrix);
    c.setHSL(rand(0.22, 0.28), rand(0.25, 0.4), rand(0.25, 0.38)); leaves.setColorAt(i, c);
  }
  for (let i = 0; i < 26; i++) {
    const a = rand(0, Math.PI * 2), r = rand(0.03, 0.2);
    d.position.set(Math.cos(a) * r, 0.42 + rand(0, 0.22), Math.sin(a) * r);
    d.rotation.set(0, 0, 0); d.scale.setScalar(rand(0.016, 0.026)); d.updateMatrix();
    flowers.setMatrixAt(i, d.matrix);
  }
  leaves.castShadow = flowers.castShadow = true;
  g.add(leaves, flowers);
  return g;
}

function makeBooks(n = 3) {
  const g = new THREE.Group();
  const cols = [0xd8c8ad, 0x6a4a33, 0x8e8a6a, 0xa4532d, 0xefe6d7];
  let y = 0;
  for (let i = 0; i < n; i++) {
    const h = rand(0.025, 0.04);
    const b = mesh(B(rand(0.2, 0.26), h, rand(0.15, 0.19)), std(cols[(Math.random() * cols.length) | 0], 0.8), 0, y + h / 2, 0, g);
    b.rotation.y = rand(-0.2, 0.2);
    y += h;
  }
  return g;
}

function makeCandle(h = 0.1) {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.035, 0.035, h, 20), M.candle, 0, h / 2, 0, g);
  const f = mesh(new THREE.SphereGeometry(0.012, 10, 8), M.flame, 0, h + 0.016, 0, g, false, false);
  f.scale.y = 1.8;
  return g;
}

function makeBowl(r = 0.14, mat = M.walnut) {
  const g = new THREE.Group();
  const bowl = lathe([[0, 0], [r * 0.5, 0], [r * 0.85, r * 0.25], [r, r * 0.45]], mat, 40);
  bowl.material = mat.clone(); bowl.material.side = THREE.DoubleSide;
  bowl.castShadow = true; g.add(bowl);
  return g;
}

function makeFruitBowl() {
  const g = makeBowl(0.18, M.ceramic);
  const lemon = std(0xe8c24a, 0.55);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const l = mesh(new THREE.SphereGeometry(0.038, 16, 12), lemon, Math.cos(a) * 0.08, 0.06 + (i % 2) * 0.02, Math.sin(a) * 0.08, g);
    l.scale.set(1, 0.85, 1.25);
  }
  return g;
}

function makeFramedPicture(w, h, mat) {
  const g = new THREE.Group();
  const frameD = 0.04, frameBorder = 0.05;
  // Outer frame
  mesh(B(w + frameBorder * 2, h + frameBorder * 2, frameD), M.walnut, 0, 0, 0, g);
  // Gold inner reveal
  mesh(B(w + 0.015, h + 0.015, frameD + 0.005), M.brassSatin, 0, 0, 0, g);
  // Canvas
  mesh(new THREE.PlaneGeometry(w, h), mat, 0, 0, frameD / 2 + 0.004, g, false, true);
  // Frame shadow reveal
  mesh(B(w + frameBorder * 2 + 0.02, h + frameBorder * 2 + 0.02, 0.005), std(0x1a140e, 0.95), 0, 0, -frameD / 2, g, false, false);

  // Picture light fixture
  const lightBar = new THREE.Group();
  lightBar.position.set(0, h / 2 + frameBorder + 0.1, frameD + 0.08);
  mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 8), M.brass, -w * 0.25, -0.05, -0.05, lightBar).rotation.x = Math.PI / 3;
  mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 8), M.brass, w * 0.25, -0.05, -0.05, lightBar).rotation.x = Math.PI / 3;
  mesh(new THREE.CylinderGeometry(0.01, 0.01, Math.min(w * 0.65, 0.55), 16), M.brass, 0, 0, 0, lightBar).rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.006, 0.006, Math.min(w * 0.6, 0.5), 16), M.led, 0, -0.008, 0, lightBar, false, false).rotation.z = Math.PI / 2;
  g.add(lightBar);

  const pl = addAccent(new THREE.PointLight(0xffe8cc, 0.95, 2.2, 2), 0.95);
  pl.position.set(0, h / 2 + 0.08, frameD + 0.1);
  g.add(pl);

  return g;
}

// ---------------------------------------------------------------------------
// Sculptures — every one normalised to exactly 50 cm tall
// ---------------------------------------------------------------------------
function normalize(inner, targetH = SCULPT_H) {
  inner.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(new V3());
  inner.scale.multiplyScalar(targetH / size.y);
  inner.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(inner);
  const c = b2.getCenter(new V3());
  inner.position.set(-c.x, -b2.min.y, -c.z);
  const wrap = new THREE.Group();
  wrap.add(inner);
  wrap.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return wrap;
}
function plinthBase(g, r = 0.08, h = 0.04, mat = M.travertine) {
  mesh(new THREE.CylinderGeometry(r, r * 1.05, h, 32), mat, 0, h / 2, 0, g);
  return h;
}
const SCULPTURES = [
  // 1. Curved amphora vase
  (mat = M.ceramic) => {
    const g = new THREE.Group();
    g.add(lathe([[0, 0], [0.07, 0], [0.09, 0.03], [0.125, 0.12], [0.135, 0.2], [0.1, 0.3], [0.05, 0.38], [0.044, 0.44], [0.062, 0.5]], mat, 64));
    return g;
  },
  // 2. Bronze torus knot on stone base
  () => {
    const g = new THREE.Group();
    const h = plinthBase(g);
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8), M.bronze, 0, h + 0.035, 0, g);
    mesh(new THREE.TorusKnotGeometry(0.11, 0.032, 200, 24, 2, 3), M.bronze, 0, h + 0.07 + 0.15, 0, g);
    return g;
  },
  // 3. Stacked pebbles
  () => {
    const g = new THREE.Group();
    const mats = [M.basalt, M.travertine, M.ceramic, M.basalt];
    let y = 0;
    [0.13, 0.105, 0.085, 0.06].forEach((r, i) => {
      y += r * 0.52;
      const p = mesh(new THREE.SphereGeometry(r, 40, 24), mats[i], rand(-0.012, 0.012), y, rand(-0.012, 0.012), g);
      p.scale.y = 0.52;
      y += r * 0.52;
    });
    return g;
  },
  // 4. Standing ring
  (mat = M.terracotta) => {
    const g = new THREE.Group();
    mesh(B(0.16, 0.05, 0.1, 0.008), M.travertine, 0, 0.025, 0, g);
    mesh(new THREE.TorusGeometry(0.18, 0.034, 32, 100), mat, 0, 0.05 + 0.18, 0, g);
    return g;
  },
  // 5. Twisted column
  () => {
    const g = new THREE.Group();
    const h = plinthBase(g, 0.09, 0.04, M.travertine);
    const geo = new THREE.BoxGeometry(0.11, 0.5, 0.11, 1, 60, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), a = (y + 0.25) * Math.PI * 1.3;
      const x = p.getX(i), z = p.getZ(i);
      p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a));
    }
    geo.computeVertexNormals();
    mesh(geo, M.basalt, 0, h + 0.25, 0, g);
    return g;
  },
  // 6. Abstract bust
  (mat = M.ceramic) => {
    const g = new THREE.Group();
    mesh(B(0.14, 0.05, 0.14, 0.008), M.walnut, 0, 0.025, 0, g);
    const b = lathe([[0, 0], [0.075, 0], [0.075, 0.015], [0.04, 0.05], [0.034, 0.12], [0.068, 0.18], [0.088, 0.26], [0.084, 0.33], [0.06, 0.39], [0.001, 0.425]], mat, 64);
    b.position.y = 0.05; b.scale.set(0.8, 1, 1);
    g.add(b);
    return g;
  },
  // 7. Travertine arch
  () => {
    const g = new THREE.Group();
    mesh(B(0.46, 0.04, 0.14, 0.008), M.basalt, 0, 0.02, 0, g);
    mesh(new THREE.TorusGeometry(0.16, 0.05, 24, 64, Math.PI), M.travertine, 0, 0.04, 0, g);
    return g;
  },
  // 8. Terracotta teardrop
  () => {
    const g = new THREE.Group();
    g.add(lathe([[0, 0], [0.05, 0.004], [0.11, 0.06], [0.13, 0.14], [0.112, 0.24], [0.07, 0.33], [0.03, 0.42], [0.001, 0.47]], M.terracotta, 64));
    return g;
  },
  // 9. Totem
  () => {
    const g = new THREE.Group();
    let y = 0;
    const add = (geo, mat, h) => { mesh(geo, mat, 0, y + h / 2, 0, g); y += h; };
    add(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 40), M.basalt, 0.03);
    add(new THREE.SphereGeometry(0.075, 32, 20), M.travertine, 0.15);
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.015, 40), M.brass, 0.015);
    add(new THREE.SphereGeometry(0.06, 32, 20), M.basalt, 0.12);
    add(new THREE.ConeGeometry(0.055, 0.14, 40), M.terracotta, 0.14);
    return g;
  },
];
let sculptIdx = 0;
let foxyTemplate = null;

function loadFoxyModel(onProgress) {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.load(
      'Foxy.glb',
      (gltf) => {
        try {
          const root = gltf.scene || gltf.scenes[0];
          // In Foxy.glb, +Z is naturally the front (face, eyes, and envelope flap)
          root.rotation.y = 0;
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                // Enhance vibrancy and responsiveness to lighting
                child.material.envMapIntensity = 1.35;
                child.material.roughness = Math.min(child.material.roughness, 0.60);
                if (child.material.metalness > 0.35) {
                  child.material.metalness = 0.22; // diffuse reflection responds brightly to spotlights
                }
                child.material.needsUpdate = true;
              }
            }
          });
          foxyTemplate = normalize(root, SCULPT_H);
          resolve(foxyTemplate);
        } catch (e) {
          console.warn('Error processing Foxy.glb:', e);
          resolve(null);
        }
      },
      (xhr) => {
        if (xhr.lengthComputable && onProgress) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          onProgress(pct);
        }
      },
      (err) => {
        console.warn('Could not load Foxy.glb, falling back to procedural sculptures', err);
        resolve(null);
      }
    );
  });
}

const SCULPT_SEQ = [
  () => SCULPTURES[0](M.ceramic), () => SCULPTURES[1](), () => SCULPTURES[2](), () => SCULPTURES[3](M.terracotta),
  () => SCULPTURES[4](), () => SCULPTURES[5](M.ceramic), () => SCULPTURES[6](), () => SCULPTURES[7](),
  () => SCULPTURES[8](), () => SCULPTURES[3](M.bronze), () => SCULPTURES[0](M.terracotta), () => SCULPTURES[5](M.basalt),
];
function nextSculpture() {
  if (foxyTemplate) {
    const clone = foxyTemplate.clone(true);
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    sculptIdx++;
    return clone;
  }
  const s = normalize(SCULPT_SEQ[sculptIdx % SCULPT_SEQ.length]());
  sculptIdx++;
  return s;
}
function place(obj, x, y, z, parent = booth, ry = 0) {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  parent.add(obj);
  return obj;
}

// ---------------------------------------------------------------------------
// Booth structure
// ---------------------------------------------------------------------------
function buildHallAndPlatform() {
  const hall = mesh(new THREE.CircleGeometry(48, 64).rotateX(-Math.PI / 2), M.hall, 0, 0, 2, scene, false, true);
  hall.position.y = 0;

  // Platform
  const plat = mesh(B(W, FY, D), M.floor, 0, FY / 2, D / 2);
  plat.castShadow = false;
  // Front & side trims in walnut + LED kick line
  mesh(B(W + 0.04, FY, 0.03), M.walnut, 0, FY / 2, D + 0.015);
  mesh(B(0.03, FY, D), M.walnut, -W / 2 - 0.015, FY / 2, D / 2);
  mesh(B(0.03, FY, D), M.walnut, W / 2 + 0.015, FY / 2, D / 2);
  mesh(B(W, 0.012, 0.012), M.led, 0, 0.02, D + 0.035, booth, false, false);
}

// ---------------------------------------------------------------------------
// Wall Registry & See-Through / X-Ray Mode
// ---------------------------------------------------------------------------
// Wall Registry & See-Through / X-Ray Mode
// ---------------------------------------------------------------------------
const wallRegistry = [];
const xRayMaterial = new THREE.MeshStandardMaterial({
  color: 0x90b2cc,
  roughness: 0.05,
  metalness: 0.0,
  transparent: true,
  opacity: 0.035, // 3.5% opacity — ULTRA FAINT & SHEER
  depthWrite: false,
  side: THREE.DoubleSide,
});

const xRayTrimMaterial = new THREE.MeshStandardMaterial({
  color: 0x768f9f,
  roughness: 0.1,
  metalness: 0.05,
  transparent: true,
  opacity: 0.065, // 6.5% opacity for subtle architectural framing
  depthWrite: false,
  side: THREE.DoubleSide,
});

function registerWall(meshObj, type = 'wall') {
  wallRegistry.push({
    mesh: meshObj,
    origMat: meshObj.material,
    origVisible: meshObj.visible,
    type: type, // 'wall', 'slat', 'roof', 'trim', 'sign'
  });
  return meshObj;
}

let isSeeThrough = false;
let xRayOpacity = 0.035;

function setWallsTransparent(val, customOpacity = null) {
  isSeeThrough = val;
  if (customOpacity !== null && !isNaN(customOpacity)) {
    xRayOpacity = customOpacity;
    xRayMaterial.opacity = customOpacity;
    xRayTrimMaterial.opacity = Math.min(1.0, customOpacity * 1.8);
  }
  wallRegistry.forEach(({ mesh: m, origMat, origVisible, type }) => {
    if (val) {
      if (type === 'slat' || type === 'roof' || type === 'sign') {
        // Hiding dense slats, roof rafters, and signs gives a 100% clean, clear view!
        m.visible = false;
      } else if (type === 'trim') {
        m.material = xRayTrimMaterial;
        m.castShadow = false;
        m.receiveShadow = false;
        m.visible = true;
      } else {
        m.material = xRayMaterial;
        m.castShadow = false;
        m.receiveShadow = false;
        m.visible = true;
      }
    } else {
      m.material = origMat;
      m.visible = origVisible;
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
}

function buildBackWall() {
  // 15 m × 3 m backdrop wall
  registerWall(mesh(B(W, H, 0.15), M.plaster, 0, FY + H / 2, -0.075), 'wall');
  registerWall(mesh(B(W + 0.04, 0.04, 0.19), M.walnut, 0, FY + H + 0.02, -0.075), 'trim');
}

function buildEnclosureAndPartitions() {
  // --- Side Walls (Left & Right 3m walls) ---
  registerWall(mesh(B(0.10, H, D), M.plaster, -W / 2 - 0.05, FY + H / 2, D / 2), 'wall');
  registerWall(mesh(B(0.10, H, D), M.plaster, W / 2 + 0.05, FY + H / 2, D / 2), 'wall');
  registerWall(mesh(B(0.12, 0.04, D + 0.04), M.walnut, -W / 2 - 0.05, FY + H + 0.02, D / 2), 'trim');
  registerWall(mesh(B(0.12, 0.04, D + 0.04), M.walnut, W / 2 + 0.05, FY + H + 0.02, D / 2), 'trim');

  // --- Front Facade ---
  const zf = D - 0.04; // Front wall position (~2.96m)
  const doorW = 1.50;  // Entrance/Exit width = 1.50 m
  const doorH = 2.45;  // Entrance/Exit height = 2.45 m
  const headerH = H - doorH; // 0.55 m

  // ==========================================
  // 1. LEFT ENTRANCE (ทางเข้าอยู่ซ้าย: x = -5.00)
  // ==========================================
  const entX = -5.00;
  // Header wall above Left Entrance door
  registerWall(mesh(B(doorW, headerH, 0.08), M.plaster, entX, FY + doorH + headerH / 2, zf), 'wall');
  // Walnut surround frame for Left Entrance
  registerWall(mesh(B(0.08, doorH, 0.16), M.walnut, entX - doorW / 2 - 0.04, FY + doorH / 2, zf), 'trim'); // left jamb
  registerWall(mesh(B(0.08, doorH, 0.16), M.walnut, entX + doorW / 2 + 0.04, FY + doorH / 2, zf), 'trim'); // right jamb
  registerWall(mesh(B(doorW + 0.20, 0.08, 0.18), M.walnut, entX, FY + doorH + 0.04, zf), 'trim');          // lintel
  // Satin brass entrance welcome floor threshold
  mesh(B(doorW, 0.008, 0.30), M.brassSatin, entX, FY + 0.004, zf);
  // Downlight spotlight for Entrance
  const entSpot = addAccent(new THREE.SpotLight(0xffe8cc, 3.5, 4.5, 0.45, 0.6, 2), 3.5);
  entSpot.position.set(entX, FY + doorH + 0.02, zf);
  entSpot.target.position.set(entX, FY, zf);
  booth.add(entSpot, entSpot.target);
  // Backlit Signboard over Left Entrance
  const entSignMat = new THREE.MeshStandardMaterial({
    map: logoTexture('MAISON TERRA', 'ENTRANCE · ทางเข้า'),
    transparent: true,
    color: 0xffffff,
    emissive: 0xffd9a0,
    roughness: 0.5,
  });
  entSignMat.emissiveMap = entSignMat.map;
  entSignMat.emissiveIntensity = 0.9;
  glowMats.push({ mat: entSignMat, base: 0.9 });
  registerWall(mesh(new THREE.PlaneGeometry(1.40, 0.24), entSignMat, entX, FY + doorH + 0.30, zf + 0.045, booth, false, false), 'sign');

  // ==========================================
  // 2. RIGHT EXIT (ทางออกอยู่ขวา: x = +5.00)
  // ==========================================
  const exitX = 5.00;
  // Header wall above Right Exit door
  registerWall(mesh(B(doorW, headerH, 0.08), M.plaster, exitX, FY + doorH + headerH / 2, zf), 'wall');
  // Walnut surround frame for Right Exit
  registerWall(mesh(B(0.08, doorH, 0.16), M.walnut, exitX - doorW / 2 - 0.04, FY + doorH / 2, zf), 'trim'); // left jamb
  registerWall(mesh(B(0.08, doorH, 0.16), M.walnut, exitX + doorW / 2 + 0.04, FY + doorH / 2, zf), 'trim'); // right jamb
  registerWall(mesh(B(doorW + 0.20, 0.08, 0.18), M.walnut, exitX, FY + doorH + 0.04, zf), 'trim');          // lintel
  // Satin brass exit floor threshold
  mesh(B(doorW, 0.008, 0.30), M.brassSatin, exitX, FY + 0.004, zf);
  // Downlight spotlight for Exit
  const exitSpot = addAccent(new THREE.SpotLight(0xffe8cc, 3.5, 4.5, 0.45, 0.6, 2), 3.5);
  exitSpot.position.set(exitX, FY + doorH + 0.02, zf);
  exitSpot.target.position.set(exitX, FY, zf);
  booth.add(exitSpot, exitSpot.target);
  // Backlit Signboard over Right Exit
  const exitSignMat = new THREE.MeshStandardMaterial({
    map: logoTexture('MAISON TERRA', 'EXIT · ทางออก'),
    transparent: true,
    color: 0xffffff,
    emissive: 0xffd9a0,
    roughness: 0.5,
  });
  exitSignMat.emissiveMap = exitSignMat.map;
  exitSignMat.emissiveIntensity = 0.9;
  glowMats.push({ mat: exitSignMat, base: 0.9 });
  registerWall(mesh(new THREE.PlaneGeometry(1.40, 0.24), exitSignMat, exitX, FY + doorH + 0.30, zf + 0.045, booth, false, false), 'sign');

  // ==========================================
  // 3. OUTER FACADE WALLS (Leftmost & Rightmost)
  // ==========================================
  // Left outer wall panel: x from -7.50 to -5.75 (width 1.75 m, center -6.625)
  registerWall(mesh(B(1.75, H, 0.08), M.plaster, -6.625, FY + H / 2, zf), 'wall');
  const slatGeo = new THREE.BoxGeometry(0.045, H - 0.35, 0.025);
  for (let sx = -7.30; sx <= -5.95; sx += 0.22) {
    registerWall(mesh(slatGeo, M.oakV, sx, FY + H / 2, zf + 0.042), 'slat');
  }

  // Right outer wall panel: x from +5.75 to +7.50 (width 1.75 m, center +6.625)
  registerWall(mesh(B(1.75, H, 0.08), M.plaster, 6.625, FY + H / 2, zf), 'wall');
  for (let sx = 5.95; sx <= 7.30; sx += 0.22) {
    registerWall(mesh(slatGeo, M.oakV, sx, FY + H / 2, zf + 0.042), 'slat');
  }

  // ==========================================
  // 4. CENTER FACADE & PEEK WINDOW (หน้าต่างส่องเห็นภายใน)
  // ==========================================
  // Span between Entrance and Exit: x from -4.25 to +4.25 (total 8.50 m)
  // Flanking sub-wall panels:
  // - Left center panel: x from -4.25 to -1.60 (width 2.65 m, center -2.925)
  registerWall(mesh(B(2.65, H, 0.08), M.plaster, -2.925, FY + H / 2, zf), 'wall');
  for (let sx = -4.05; sx <= -1.85; sx += 0.22) {
    registerWall(mesh(slatGeo, M.oakV, sx, FY + H / 2, zf + 0.042), 'slat');
  }

  // - Right center panel: x from +1.60 to +4.25 (width 2.65 m, center +2.925)
  registerWall(mesh(B(2.65, H, 0.08), M.plaster, 2.925, FY + H / 2, zf), 'wall');
  for (let sx = 1.85; sx <= 4.05; sx += 0.22) {
    registerWall(mesh(slatGeo, M.oakV, sx, FY + H / 2, zf + 0.042), 'slat');
  }

  // Window Section: x from -1.60 to +1.60 (width 3.20 m)
  const winW = 3.20;
  const winSillH = 0.85;
  const winTopY = 2.35;
  const winH = winTopY - winSillH; // 1.50 m
  const winHeadH = H - winTopY;   // 0.65 m

  // Sill wall below window
  registerWall(mesh(B(winW, winSillH, 0.08), M.plaster, 0, FY + winSillH / 2, zf), 'wall');
  // Header wall above window
  registerWall(mesh(B(winW, winHeadH, 0.08), M.plaster, 0, FY + winTopY + winHeadH / 2, zf), 'wall');

  // Window Casing (Solid Walnut Frame + Center Mullion)
  registerWall(mesh(B(winW + 0.10, 0.05, 0.18), M.walnut, 0, FY + winSillH + 0.025, zf), 'trim'); // sill ledge
  registerWall(mesh(B(winW + 0.10, 0.05, 0.18), M.walnut, 0, FY + winTopY - 0.025, zf), 'trim');  // top casing
  registerWall(mesh(B(0.05, winH, 0.18), M.walnut, -winW / 2 + 0.025, FY + winSillH + winH / 2, zf), 'trim'); // left jamb
  registerWall(mesh(B(0.05, winH, 0.18), M.walnut, winW / 2 - 0.025, FY + winSillH + winH / 2, zf), 'trim');  // right jamb
  // Center vertical mullion dividing the glass into 2 showcase panes
  registerWall(mesh(B(0.05, winH - 0.05, 0.16), M.walnut, 0, FY + winSillH + winH / 2, zf), 'trim');
  mesh(B(0.02, winH - 0.05, 0.005), M.brassSatin, 0, FY + winSillH + winH / 2, zf + 0.085); // brass reveal

  // Clear Architectural Glass Pane (หน้าต่างกระจกใสบานส่องชม)
  const peekGlassMat = new THREE.MeshStandardMaterial({
    color: 0xe8f2fc,
    roughness: 0.04,
    metalness: 0.08,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  mesh(new THREE.PlaneGeometry(winW - 0.08, winH - 0.08), peekGlassMat, 0, FY + winSillH + winH / 2, zf + 0.01, booth, false, false);
  // Interior warm LED strip wash along window sill ledge
  mesh(B(winW - 0.10, 0.01, 0.01), M.led, 0, FY + winSillH + 0.05, zf - 0.05, booth, false, false);

  // Pavilion Title Badge over Window Header
  const winSignMat = new THREE.MeshStandardMaterial({
    map: logoTexture('MAISON TERRA', 'ART PAVILION · SHOWCASE'),
    transparent: true,
    color: 0xffffff,
    emissive: 0xffd9a0,
    roughness: 0.5,
  });
  winSignMat.emissiveMap = winSignMat.map;
  winSignMat.emissiveIntensity = 0.9;
  glowMats.push({ mat: winSignMat, base: 0.9 });
  registerWall(mesh(new THREE.PlaneGeometry(1.60, 0.22), winSignMat, 0, FY + winTopY + 0.32, zf + 0.045, booth, false, false), 'sign');

  // ==========================================
  // 5. ASYMMETRICAL & STAGGERED PARTITION WALLS (สลับซ้าย-ขวา หน้า-หลัง)
  // ==========================================
  // --- Partition Wall 1 (at x = -2.60, separating Room 1 & Room 2): STAGGERED TO BACK (บน/หลัง) ---
  // Solid wall extends from BACK wall (z: 0 to 1.75 m)
  const pwX1 = -2.60;
  registerWall(mesh(B(0.08, H, 1.75), M.plaster, pwX1, FY + H / 2, 0.875), 'wall');
  // Walnut trim jamb and satin brass reveal at opening edge (z = 1.75)
  registerWall(mesh(B(0.12, H, 0.06), M.walnut, pwX1, FY + H / 2, 1.75), 'trim');
  mesh(B(0.02, H - 0.20, 0.005), M.brassSatin, pwX1, FY + H / 2, 1.78);
  // Vertical decorative oak slats on partition face facing Room 2
  const partSlatGeo = new THREE.BoxGeometry(0.025, H - 0.30, 0.045);
  for (let sz = 0.30; sz <= 1.50; sz += 0.25) {
    registerWall(mesh(partSlatGeo, M.oakV, pwX1 + 0.042, FY + H / 2, sz), 'slat');
  }
  // Front Walkway Opening (z: 1.75 to 2.96 m, width 1.21 m) with walnut lintel overhead
  registerWall(mesh(B(0.08, 0.50, 1.21), M.plaster, pwX1, FY + 2.75, 2.355), 'wall');
  registerWall(mesh(B(0.12, 0.06, 1.21), M.walnut, pwX1, FY + 2.47, 2.355), 'trim');

  // --- Partition Wall 2 (at x = +2.40, separating Room 2 & Room 3): STAGGERED TO FRONT (ล่าง/หน้า) ---
  // Solid wall extends from FRONT facade inward (z: 1.20 to 2.96 m)
  const pwX2 = 2.40;
  registerWall(mesh(B(0.08, H, 1.76), M.plaster, pwX2, FY + H / 2, 2.08), 'wall');
  // Walnut trim jamb and satin brass reveal at opening edge (z = 1.20)
  registerWall(mesh(B(0.12, H, 0.06), M.walnut, pwX2, FY + H / 2, 1.20), 'trim');
  mesh(B(0.02, H - 0.20, 0.005), M.brassSatin, pwX2, FY + H / 2, 1.17);
  // Vertical decorative oak slats on partition face facing Room 2
  for (let sz = 1.45; sz <= 2.65; sz += 0.25) {
    registerWall(mesh(partSlatGeo, M.oakV, pwX2 - 0.042, FY + H / 2, sz), 'slat');
  }
  // Back Walkway Opening (z: 0 to 1.20 m, width 1.20 m) with walnut lintel overhead
  registerWall(mesh(B(0.08, 0.50, 1.20), M.plaster, pwX2, FY + 2.75, 0.60), 'wall');
  registerWall(mesh(B(0.12, 0.06, 1.20), M.walnut, pwX2, FY + 2.47, 0.60), 'trim');

  // Ceiling Rafters & Perimeter Fascia
  [-7.44, -5.0, -2.5, 0, 2.5, 5.0, 7.44].forEach((x) => {
    registerWall(mesh(B(0.08, 0.12, D), M.oak, x, FY + H - 0.06, D / 2), 'roof');
  });
  registerWall(mesh(B(W, 0.16, 0.10), M.walnut, 0, FY + H - 0.08, D / 2), 'roof');
}

// ---------------------------------------------------------------------------
// Exhibits badges & annotations
// ---------------------------------------------------------------------------
const exhibitGroup = new THREE.Group();
const exhibitLabels = [];

function addExhibitBadge(text, pos, isPainting = false) {
  const div = document.createElement('div');
  div.className = 'exhibit-label' + (isPainting ? ' art-badge' : '');
  div.textContent = text;
  const lab = new CSS2DObject(div);
  lab.position.copy(pos);
  exhibitGroup.add(lab);
  exhibitLabels.push(lab);
  return lab;
}

// ---------------------------------------------------------------------------
// Room 1 — West Gallery (Earth & Brick Art Chamber: x −7.5 … −2.5)
// ---------------------------------------------------------------------------
function buildKitchen() {
  const cx = -5.0;
  // Stone brick cladding on back wall
  const brick = std(0xffffff, 0.9, 0, { map: texRepeat(TEX.brick, 2, 3), bumpMap: texRepeat(TEX.brickBump, 2, 3), bumpScale: 2 });
  registerWall(mesh(B(4.8, H, 0.03), brick, cx, FY + H / 2, 0.015));

  // --- Painting 1 (P1) on the brick wall ---
  place(makeFramedPicture(0.95, 1.25, M.art1), -5.80, FY + 1.80, 0.04);
  addExhibitBadge('P1 · ภาพวาด 1 (0.95×1.25 m)', new V3(-5.80, FY + 2.65, 0.15), true);

  // --- Sculpture 1 (S1) on Travertine Pedestal in Room 1 ---
  const ped1X = -4.20, ped1Z = 1.15, ped1H = 0.90;
  mesh(B(0.44, ped1H, 0.44, 0.01), M.travertine, ped1X, FY + ped1H / 2, ped1Z);
  mesh(B(0.40, 0.025, 0.40), M.basalt, ped1X, FY + 0.012, ped1Z);
  // Foxy faces towards the entrance walkway to welcome incoming visitors
  place(nextSculpture(), ped1X, FY + ped1H, ped1Z, booth, -0.35);
  addExhibitBadge('S1 · ประติมากรรม 1 — Foxy (50 cm)', new V3(ped1X, FY + ped1H + SCULPT_H + 0.15, ped1Z));

  // High-intensity spotlight from front-top angled onto Foxy S1
  const spot1 = addAccent(new THREE.SpotLight(0xfff2df, 7.5, 5.0, 0.38, 0.5, 2), 7.5);
  spot1.position.set(ped1X - 0.15, FY + H - 0.15, ped1Z + 0.75);
  spot1.target.position.set(ped1X, FY + ped1H + 0.25, ped1Z);
  booth.add(spot1, spot1.target);

  // Soft warm fill light directly illuminating Foxy's face and envelope
  const fill1 = addAccent(new THREE.PointLight(0xffe8ce, 2.5, 2.8, 2), 2.5);
  fill1.position.set(ped1X - 0.25, FY + ped1H + 0.35, ped1Z + 0.65);
  booth.add(fill1);

  // Floating oak shelves on left section (x = -6.4)
  const shelfY = [FY + 1.45, FY + 2.15];
  shelfY.forEach((y) => {
    mesh(B(1.6, 0.04, 0.26), M.oak, -6.40, y, 0.15);
    mesh(B(1.5, 0.008, 0.015), M.led, -6.40, y - 0.025, 0.26, booth, false, false);
  });
  place(makePlant({ potR: 0.07, potH: 0.12, tree: false, crown: [0.12, 0.1, 0.12], leaves: 45, leafSize: 0.04 }), -6.80, shelfY[0] + 0.02, 0.15);
  place(makeBowl(0.10), -6.40, shelfY[0] + 0.02, 0.15);
  place(makeBooks(3), -6.65, shelfY[1] + 0.02, 0.15);
  place(makeBowl(0.08, M.walnut), -6.15, shelfY[1] + 0.02, 0.15);

  // Slim wall base cabinet along the back wall
  const cabW = 1.8, cabX = -4.20;
  mesh(B(cabW, 0.82, 0.40), M.olive, cabX, FY + 0.41, 0.22);
  mesh(B(cabW + 0.04, 0.04, 0.44), M.marble, cabX, FY + 0.84, 0.22);
  place(makeBouquet(), cabX + 0.40, FY + 0.87, 0.22);
  place(makeFruitBowl(), cabX - 0.40, FY + 0.87, 0.22);

  // Overhead beam + brass dome pendants
  mesh(B(4.6, 0.10, 0.10), M.oak, cx, FY + H - 0.14, 1.4);
  [-5.8, -4.2].forEach((x) => makePendant(x, 1.4, FY + 2.05));

  // Corner olive tree against wall
  place(makePlant({ potR: 0.22, potH: 0.48, potMat: M.terracotta, trunkH: 1.3, crown: [0.46, 0.44, 0.46], leaves: 220 }), -7.1, FY, 0.70);
}

function makePendant(x, z, bottomY) {
  const top = FY + H - 0.2;
  mesh(new THREE.CylinderGeometry(0.004, 0.004, top - bottomY - 0.2, 6), M.blackMetal, x, (top + bottomY + 0.2) / 2, z);
  mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 16), M.brass, x, bottomY + 0.22, z);
  mesh(new THREE.SphereGeometry(0.22, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.brass, x, bottomY, z).material.side = THREE.DoubleSide;
  mesh(new THREE.SphereGeometry(0.04, 16, 12), M.bulb, x, bottomY + 0.03, z, booth, false, false);
  const l = addAccent(new THREE.PointLight(0xffc27a, 1.6, 3.5, 2), 1.6);
  l.position.set(x, bottomY - 0.05, z);
  booth.add(l);
}

// ---------------------------------------------------------------------------
// Room 2 — Central Slat Hall & Entrance Foyer (x −2.5 … 2.5)
// ---------------------------------------------------------------------------
function buildLiving() {
  // Dark backing + oak slat feature wall (4.8 m)
  registerWall(mesh(B(4.8, H, 0.02), std(0x24180f, 0.8), 0, FY + H / 2, 0.01));
  const slatGeo = new THREE.BoxGeometry(0.045, H, 0.035);
  const count = 58;
  const slats = new THREE.InstancedMesh(slatGeo, M.oakV, count);
  const d = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    d.position.set(-2.28 + i * 0.08, FY + H / 2, 0.04);
    d.updateMatrix();
    slats.setMatrixAt(i, d.matrix);
  }
  slats.castShadow = slats.receiveShadow = true;
  booth.add(slats);

  // Floor wash + top cove LEDs (crisp, subtle)
  mesh(B(4.8, 0.01, 0.01), M.led, 0, FY + 0.01, 0.07, booth, false, false);
  mesh(B(4.8, 0.01, 0.01), M.led, 0, FY + H - 0.01, 0.07, booth, false, false);

  // --- Painting 2 (P2) on left slat wall ---
  place(makeFramedPicture(0.95, 1.25, M.art2), -1.35, FY + 1.80, 0.06);
  addExhibitBadge('P2 · ภาพวาด 2 (0.95×1.25 m)', new V3(-1.35, FY + 2.65, 0.18), true);

  // --- Painting 3 (P3) on right slat wall ---
  place(makeFramedPicture(0.95, 1.25, M.art3), 0.85, FY + 1.80, 0.06);
  addExhibitBadge('P3 · ภาพวาด 3 (0.95×1.25 m)', new V3(0.85, FY + 2.65, 0.18), true);

  // --- Sculpture 2 (S2) on the Showcase Pedestal behind Peek Window ---
  const foyerPedX = 0, foyerPedZ = 1.65, foyerPedH = 0.95;
  mesh(B(0.46, foyerPedH, 0.46, 0.01), M.travertine, foyerPedX, FY + foyerPedH / 2, foyerPedZ);
  mesh(B(0.42, 0.025, 0.42), M.basalt, foyerPedX, FY + 0.012, foyerPedZ);
  // Foxy faces straight forward directly through the peek window towards outside visitors!
  place(nextSculpture(), foyerPedX, FY + foyerPedH, foyerPedZ, booth, 0.0);
  addExhibitBadge('S2 · ประติมากรรม 2 — Foxy (50 cm)', new V3(foyerPedX, FY + foyerPedH + SCULPT_H + 0.15, foyerPedZ));

  // Front Key Spotlight shining right through window onto Foxy's face
  const spot2 = addAccent(new THREE.SpotLight(0xfff5e6, 8.5, 5.5, 0.38, 0.5, 2), 8.5);
  spot2.position.set(0, FY + H - 0.15, foyerPedZ + 0.85);
  spot2.target.position.set(0, FY + foyerPedH + 0.25, foyerPedZ);
  booth.add(spot2, spot2.target);

  // Dedicated fill light on S2 showcase pedestal
  const fill2 = addAccent(new THREE.PointLight(0xffebd2, 3.0, 3.2, 2), 3.0);
  fill2.position.set(0, FY + foyerPedH + 0.35, foyerPedZ + 0.70);
  booth.add(fill2);

  // Subtle architectural brass inlay border on the floor defining the gallery walkway
  mesh(B(4.8, 0.003, 0.015), M.brassSatin, 0, FY + 0.002, 0.45, booth, false, false);

  // Minimalist brass arc lamp hugging the left wall boundary
  makeArcLamp(-2.15, 0.38, new V3(-1.40, FY + 1.95, 0.55));

  // --- Sculpture S6 on slim wall credenza (between slat wall & partition) ---
  const credX = 1.80, credZ = 0.38, credH = 0.58;
  mesh(B(1.2, credH, 0.36, 0.01), M.walnut, credX, FY + credH / 2, credZ);
  mesh(B(1.24, 0.03, 0.38, 0.005), M.travertine, credX, FY + credH + 0.015, credZ);
  // Foxy faces slightly into the room walkway
  place(nextSculpture(), credX, FY + credH + 0.03, credZ, booth, -0.15);
  addExhibitBadge('S6 · ประติมากรรม 6 — Foxy (50 cm)', new V3(credX, FY + credH + SCULPT_H + 0.15, credZ));

  const spot6 = addAccent(new THREE.SpotLight(0xfff2df, 7.0, 5.0, 0.38, 0.5, 2), 7.0);
  spot6.position.set(credX, FY + H - 0.15, credZ + 0.75);
  spot6.target.position.set(credX, FY + credH + 0.25, credZ);
  booth.add(spot6, spot6.target);

  const fill6 = addAccent(new THREE.PointLight(0xffe2bf, 2.2, 2.5, 2), 2.2);
  fill6.position.set(credX, FY + credH + 0.32, credZ + 0.50);
  booth.add(fill6);
}

function makeArcLamp(x, z, end) {
  mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 40), M.marble, x, FY + 0.02, z);
  const start = new V3(x, FY + 0.04, z);
  const mid = new V3(x + 0.1, FY + 2.35, z + 0.25);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, new V3(end.x, end.y + 0.12, end.z));
  mesh(new THREE.TubeGeometry(curve, 64, 0.012, 10), M.brass, 0, 0, 0);
  const shade = mesh(new THREE.SphereGeometry(0.2, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), M.brass, end.x, end.y, end.z);
  shade.material = M.brass.clone(); shade.material.side = THREE.DoubleSide;
  mesh(new THREE.SphereGeometry(0.04, 16, 12), M.bulb, end.x, end.y + 0.03, end.z, booth, false, false);
  const l = addAccent(new THREE.PointLight(0xffc27a, 1.8, 3.5, 2), 1.8);
  l.position.set(end.x, end.y - 0.05, end.z);
  booth.add(l);
}

// ---------------------------------------------------------------------------
// Room 3 — East Sculpture Sanctuary & Photo Lounge (x 2.4 … 7.5)
// ---------------------------------------------------------------------------
const dimTargets = {};

function makeSofa(x, z, rotY = 0) {
  const grp = new THREE.Group();
  grp.position.set(x, FY, z);
  grp.rotation.y = rotY;

  // 4 angled conical walnut legs with satin brass ferrules
  const legGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.14, 12);
  const ferruleGeo = new THREE.CylinderGeometry(0.020, 0.014, 0.035, 12);
  [[-0.72, -0.26], [0.72, -0.26], [-0.72, 0.26], [0.72, 0.26]].forEach(([lx, lz]) => {
    mesh(legGeo, M.walnut, lx, 0.07, lz, grp);
    mesh(ferruleGeo, M.brass, lx, 0.02, lz, grp);
  });

  // Base platform (Solid Walnut)
  mesh(B(1.68, 0.05, 0.74, 0.02), M.walnut, 0, 0.165, 0, grp);

  // Main Seat cushion (Warm Oat Textured Bouclé / Linen)
  mesh(B(1.64, 0.25, 0.70, 0.07), M.linen, 0, 0.315, 0.01, grp);

  // Curved Backrest cushion
  const back = mesh(B(1.64, 0.44, 0.22, 0.07), M.linen, 0, 0.58, -0.24, grp);
  back.rotation.x = -0.06;

  // Ergonomic soft rounded armrests (Left & Right)
  mesh(B(0.14, 0.28, 0.68, 0.06), M.linen, -0.82, 0.42, 0.01, grp);
  mesh(B(0.14, 0.28, 0.68, 0.06), M.linen, 0.82, 0.42, 0.01, grp);

  // Decorative designer accent cushions
  const p1 = mesh(B(0.34, 0.34, 0.11, 0.04), M.rust, -0.50, 0.48, -0.13, grp);
  p1.rotation.set(-0.15, 0.25, 0.10);
  const p2 = mesh(B(0.32, 0.32, 0.11, 0.04), M.olive, 0.50, 0.48, -0.13, grp);
  p2.rotation.set(-0.15, -0.22, -0.08);

  booth.add(grp);
  return grp;
}

function buildGallery() {
  const cx = 5.0, uw = 4.8, dpt = 0.38;
  // Limewash back panel with warm texture
  registerWall(mesh(B(uw, H - 0.1, 0.02), M.limewash, cx, FY + (H - 0.1) / 2, 0.01), 'wall');
  // Oak perimeter casing
  mesh(B(uw + 0.04, 0.05, dpt + 0.02), M.oak, cx, FY + H - 0.05, dpt / 2);

  // ==========================================
  // 📸 PHOTO SPOT (มุมถ่ายรูป: โซฟาดีไซเนอร์ + ประติมากรรมข้างๆ)
  // ==========================================
  const sofaX = 5.15, sofaZ = 0.70;
  makeSofa(sofaX, sofaZ, 0);

  // Centerpiece Painting P4 (1.40 × 0.90 m) framed on the wall behind the sofa
  place(makeFramedPicture(1.40, 0.90, M.art4), sofaX, FY + 1.95, 0.04);
  addExhibitBadge('P4 · ภาพวาด 4 (1.40×0.90 m)', new V3(sofaX, FY + 2.65, 0.16), true);

  // Companion Sculpture S3 on Travertine Pedestal placed right next to sofa left arm!
  const ped3X = 3.90, ped3Z = 0.70, ped3H = 0.76;
  mesh(B(0.44, ped3H, 0.44, 0.01), M.travertine, ped3X, FY + ped3H / 2, ped3Z);
  mesh(B(0.40, 0.025, 0.40), M.basalt, ped3X, FY + 0.012, ped3Z);
  // Foxy faces forward towards the photo taker and slightly toward the sofa
  place(nextSculpture(), ped3X, FY + ped3H, ped3Z, booth, 0.12);
  addExhibitBadge('S3 · ประติมากรรม 3 — Foxy (50 cm)', new V3(ped3X, FY + ped3H + SCULPT_H + 0.15, ped3Z));
  dimTargets.sculpt = { x: ped3X, z: ped3Z, y: FY + ped3H };

  // Dedicated Photo Spot Badge
  addExhibitBadge('📸 มุมถ่ายรูป · Photo Spot (Sofa & Foxy)', new V3(4.55, FY + 1.45, 0.85));

  // Dedicated key spotlight aimed directly at Foxy S3 next to sofa
  const spot3 = addAccent(new THREE.SpotLight(0xfff5e6, 8.5, 5.5, 0.38, 0.5, 2), 8.5);
  spot3.position.set(ped3X, FY + H - 0.15, ped3Z + 0.85);
  spot3.target.position.set(ped3X, FY + ped3H + 0.25, ped3Z);
  booth.add(spot3, spot3.target);

  // Crisp portrait fill light on Foxy S3
  const fill3 = addAccent(new THREE.PointLight(0xffebd2, 2.8, 2.8, 2), 2.8);
  fill3.position.set(ped3X, FY + ped3H + 0.35, ped3Z + 0.60);
  booth.add(fill3);

  // Flattering portrait studio spotlight aimed directly at sofa & sculpture S3
  const portraitSpot = addAccent(new THREE.SpotLight(0xffeedd, 6.0, 5.5, 0.45, 0.5, 2), 6.0);
  portraitSpot.position.set(4.55, FY + H - 0.15, 2.10);
  portraitSpot.target.position.set(4.55, FY + 0.65, sofaZ);
  booth.add(portraitSpot, portraitSpot.target);

  // Designer round travertine & brass side table next to sofa right arm
  const tableX = 6.35, tableZ = 0.68;
  mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 24), M.travertine, tableX, FY + 0.48, tableZ);
  mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.46, 12), M.brass, tableX, FY + 0.24, tableZ);
  mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 24), M.travertine, tableX, FY + 0.01, tableZ);
  place(makeBowl(0.08, M.walnut), tableX, FY + 0.50, tableZ);

  // --- Wall Niches for S4 and S5 ---
  const nicheW = 0.65, nicheH = 0.95, nicheD = 0.32;
  const nicheY = FY + 1.55;
  const nicheXs = [2.85, 6.90];

  nicheXs.forEach((nx, idx) => {
    // Niche casing
    mesh(B(nicheW, 0.035, nicheD), M.oak, nx, nicheY - nicheH / 2, nicheD / 2);
    mesh(B(nicheW, 0.035, nicheD), M.oak, nx, nicheY + nicheH / 2, nicheD / 2);
    mesh(B(0.035, nicheH, nicheD), M.oak, nx - nicheW / 2, nicheY, nicheD / 2);
    mesh(B(0.035, nicheH, nicheD), M.oak, nx + nicheW / 2, nicheY, nicheD / 2);

    // Cove LED warm backlighting in the niche
    mesh(B(nicheW - 0.04, 0.01, 0.01), M.led, nx, nicheY + nicheH / 2 - 0.02, 0.04, booth, false, false);
    
    // Direct warm showcase downlight onto Foxy inside niche
    const nl = addAccent(new THREE.PointLight(0xffeed8, 3.8, 2.2, 2), 3.8);
    nl.position.set(nx, nicheY + nicheH / 2 - 0.08, 0.22);
    booth.add(nl);

    // Front soft spot illuminating Foxy's face from the front of the niche
    const nicheSpot = addAccent(new THREE.SpotLight(0xfff6e6, 5.5, 3.0, 0.5, 0.5, 2), 5.5);
    nicheSpot.position.set(nx, nicheY + nicheH / 2 + 0.10, 0.65);
    nicheSpot.target.position.set(nx, nicheY - nicheH / 2 + 0.25, 0.16);
    booth.add(nicheSpot, nicheSpot.target);

    // Sculpture inside niche (faces forward out of the niche into the room)
    const angle = idx === 0 ? 0.15 : -0.15;
    place(nextSculpture(), nx, nicheY - nicheH / 2 + 0.035, 0.16, booth, angle);
    const labelCode = idx === 0 ? 'S4' : 'S5';
    const labelNum = idx === 0 ? '4' : '5';
    addExhibitBadge(`${labelCode} · ประติมากรรม ${labelNum} — Foxy (50 cm)`, new V3(nx, nicheY + 0.36, 0.22));
  });

  // Corner olive tree against the wall
  place(makePlant({ potR: 0.22, potH: 0.46, potMat: M.basalt, trunkH: 1.25, crown: [0.48, 0.42, 0.48], leaves: 240 }), 7.15, FY, 0.70);
}

// ---------------------------------------------------------------------------
// Lighting
// ---------------------------------------------------------------------------
let hemi, sun, fill;
function buildLights() {
  hemi = new THREE.HemisphereLight(0xffd9b0, 0x3b2a1c, 0.55);
  scene.add(hemi);

  sun = new THREE.DirectionalLight(0xffb070, 2.6);
  sun.position.set(-9, 8, 11);
  sun.target.position.set(0, 1, 1.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const s = sun.shadow.camera;
  s.left = -10; s.right = 10; s.top = 8; s.bottom = -6; s.near = 1; s.far = 40;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);

  fill = new THREE.DirectionalLight(0xffe6c8, 0.5);
  fill.position.set(10, 6, 8);
  scene.add(fill);
}

const MODES = {
  golden: { exposure: 0.98, sunColor: 0xffb070, sun: 2.3, sunPos: [-9, 8, 11], hemiSky: 0xffd9b0, hemiGround: 0x3b2a1c, hemi: 0.52, fill: 0.42, accent: 0.75, glow: 0.65, env: 0.48, bg: 0x14100c },
  day: { exposure: 1.0, sunColor: 0xfff4e6, sun: 2.7, sunPos: [5, 14, 10], hemiSky: 0xffffff, hemiGround: 0x8a7a68, hemi: 0.92, fill: 0.62, accent: 0.45, glow: 0.48, env: 0.82, bg: 0x221d18 },
  night: { exposure: 0.95, sunColor: 0x8fa6ff, sun: 0.2, sunPos: [6, 12, 9], hemiSky: 0x6b5a4a, hemiGround: 0x120c08, hemi: 0.14, fill: 0.08, accent: 1.2, glow: 0.85, env: 0.14, bg: 0x090705 },
};
function setMode(name) {
  const m = MODES[name];
  renderer.toneMappingExposure = m.exposure;
  sun.color.setHex(m.sunColor); sun.intensity = m.sun; sun.position.set(...m.sunPos);
  hemi.color.setHex(m.hemiSky); hemi.groundColor.setHex(m.hemiGround); hemi.intensity = m.hemi;
  fill.intensity = m.fill;
  accentLights.forEach(({ light, base }) => (light.intensity = base * m.accent));
  glowMats.forEach(({ mat, base }) => (mat.emissiveIntensity = base * m.glow));
  scene.background.setHex(m.bg);
  scene.fog.color.setHex(m.bg);
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((mt) => { if ('envMapIntensity' in mt) mt.envMapIntensity = m.env; });
  });
}

// ---------------------------------------------------------------------------
// Dimensions & zone labels
// ---------------------------------------------------------------------------
const dimGroup = new THREE.Group();
const dimLabels = [];
const zoneLabels = [];
function dimLine(a, b, text, tick) {
  const mat = new THREE.LineBasicMaterial({ color: 0xf3c98b, depthTest: false, transparent: true });
  const pts = [a, b, a.clone().add(tick), a.clone().sub(tick), b.clone().add(tick), b.clone().sub(tick)];
  const line = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat);
  line.renderOrder = 999;
  dimGroup.add(line);
  const div = document.createElement('div');
  div.className = 'dim-label';
  div.textContent = text;
  const lab = new CSS2DObject(div);
  lab.position.copy(a).lerp(b, 0.5);
  dimGroup.add(lab);
  dimLabels.push(lab);
}
function buildAnnotations() {
  scene.add(dimGroup);
  scene.add(exhibitGroup);
  dimLine(new V3(-W / 2, 0.02, D + 0.45), new V3(W / 2, 0.02, D + 0.45), 'กว้าง 15.00 m', new V3(0, 0, 0.12));
  dimLine(new V3(-W / 2 - 0.35, FY, 0.05), new V3(-W / 2 - 0.35, FY + H, 0.05), 'สูง 3.00 m', new V3(0.12, 0, 0));
  dimLine(new V3(W / 2 + 0.4, 0.02, 0), new V3(W / 2 + 0.4, 0.02, D), `ลึก ${D.toFixed(2)} m`, new V3(0.12, 0, 0));
  // Left entrance dimension (1.50 m)
  dimLine(new V3(-5.75, FY + 2.55, D + 0.10), new V3(-4.25, FY + 2.55, D + 0.10), 'ทางเข้า 1.50 m (ซ้าย)', new V3(0, 0.08, 0));
  // Center window dimension (3.20 m)
  dimLine(new V3(-1.60, FY + 2.45, D + 0.10), new V3(1.60, FY + 2.45, D + 0.10), 'หน้าต่างส่องชมงาน 3.20 m', new V3(0, 0.08, 0));
  // Right exit dimension (1.50 m)
  dimLine(new V3(4.25, FY + 2.55, D + 0.10), new V3(5.75, FY + 2.55, D + 0.10), 'ทางออก 1.50 m (ขวา)', new V3(0, 0.08, 0));

  const s = dimTargets.sculpt;
  if (s) dimLine(new V3(s.x + 0.34, s.y, s.z), new V3(s.x + 0.34, s.y + SCULPT_H, s.z), 'ประติมากรรม Foxy 50 cm', new V3(0.05, 0, 0));

  [['1', 'West Gallery · เข้าซ้าย', -5.0], ['2', 'Center Slat Hall · หน้าต่าง', 0], ['3', 'East Sanctuary · 📸 มุมถ่ายรูป & ออกขวา', 5.0]].forEach(([k, name, x]) => {
    const div = document.createElement('div');
    div.className = 'zone-label';
    div.innerHTML = `<b>${k}</b>${name}`;
    const lab = new CSS2DObject(div);
    lab.position.set(x, FY + H + 0.45, 1.2);
    scene.add(lab);
    zoneLabels.push(lab);
  });
}

// ---------------------------------------------------------------------------
// Camera views
// ---------------------------------------------------------------------------
const VIEWS = {
  overview: { pos: [9.5, 4.8, 11.5], target: [0, 1.2, 1.2] },
  front: { pos: [0, 1.7, 8.8], target: [0, 1.4, 2.5] },
  entrance: { pos: [-5.0, 1.65, 5.4], target: [-5.0, 1.35, 2.8] },
  window: { pos: [0, 1.55, 4.5], target: [0, 1.45, 1.65] },
  exit: { pos: [5.0, 1.65, 5.4], target: [5.0, 1.35, 2.8] },
  photospot: { pos: [4.65, 1.35, 2.35], target: [4.65, 0.90, 0.70] },
  walkthrough: { pos: [-5.0, 1.6, 2.7], target: [4.5, 1.4, 1.5] },
  room1: { pos: [-4.2, 1.6, 2.6], target: [-5.5, 1.3, 0.8] },
  room2: { pos: [0, 1.7, 3.2], target: [0, 1.3, 0.6] },
  room3: { pos: [4.65, 1.55, 2.7], target: [5.0, 1.2, 0.8] },
  sculptures: { pos: [3.9, 1.45, 2.0], target: [3.9, 1.15, 0.7] },
  paintings: { pos: [0, 1.9, 6.8], target: [0, 1.65, 0.2] },
  kitchen: { pos: [-4.2, 1.6, 2.6], target: [-5.5, 1.3, 0.8] },
  living: { pos: [0, 1.7, 3.2], target: [0, 1.3, 0.6] },
  gallery: { pos: [4.65, 1.55, 2.7], target: [5.0, 1.2, 0.8] },
  top: { pos: [0, 18, 1.5], target: [0, 0, 1.5] },
};
let tween = null;
function flyTo(name) {
  const v = VIEWS[name];
  tween = {
    t: 0, dur: 1.6,
    p0: camera.position.clone(), t0: controls.target.clone(),
    p1: new V3(...v.pos), t1: new V3(...v.target),
  };
}
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
controls.addEventListener('start', () => { tween = null; });

// ---------------------------------------------------------------------------
// Custom 3D Object Support (.glb, .gltf, .obj, .fbx)
// ---------------------------------------------------------------------------
const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();
const fbxLoader = new FBXLoader();
const customObjects = [];
let selectedCustomObj = null;
let transformControls = null;

function setupCustomObjectSystem() {
  transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.size = 0.75;
  scene.add(transformControls);

  transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value;
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#controlPanel') || e.target.closest('.brand-card') || e.target.closest('#viewBar') || e.target.closest('.legend') || e.target.closest('#dropZone')) {
      return;
    }
    if (transformControls.dragging) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(customObjects, true);
    if (intersects.length > 0) {
      let root = intersects[0].object;
      while (root.parent && !root.userData.isCustom && root.parent !== booth && root.parent !== scene) {
        root = root.parent;
      }
      if (root.userData.isCustom) {
        selectCustomObject(root);
      }
    }
  });
}

function selectCustomObject(wrapper) {
  selectedCustomObj = wrapper;
  const tools = document.getElementById('customModelTools');
  if (!wrapper) {
    transformControls.detach();
    if (tools) tools.style.display = 'none';
    return;
  }
  transformControls.attach(wrapper);
  if (tools) tools.style.display = 'block';
  const curH = wrapper.userData.currentHeight || 0.5;
  const badge = document.getElementById('heightDisplay');
  const slider = document.getElementById('scaleSlider');
  if (badge) badge.textContent = Math.round(curH * 100) + ' cm';
  if (slider) slider.value = Math.round(curH * 100);
}

function setObjectHeight(wrapper, targetH) {
  if (!wrapper) return;
  const origH = wrapper.userData.originalHeight || 1;
  const s = targetH / origH;
  wrapper.scale.set(s, s, s);
  wrapper.userData.currentHeight = targetH;
  const badge = document.getElementById('heightDisplay');
  const slider = document.getElementById('scaleSlider');
  if (badge) badge.textContent = Math.round(targetH * 100) + ' cm';
  if (slider) slider.value = Math.round(targetH * 100);
}

function handle3DFile(file) {
  const name = file.name.toLowerCase();
  const reader = new FileReader();

  const onLoaded = (object3D) => {
    object3D.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.envMapIntensity = 0.6;
          child.material.needsUpdate = true;
        }
      }
    });

    const box = new THREE.Box3().setFromObject(object3D);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const origH = size.y || 1;

    // Center pivot at bottom
    object3D.position.set(-center.x, -box.min.y, -center.z);

    const wrapper = new THREE.Group();
    wrapper.userData.isCustom = true;
    wrapper.userData.originalHeight = origH;
    wrapper.userData.name = file.name;
    wrapper.add(object3D);

    // Initial scale: 50 cm
    setObjectHeight(wrapper, 0.5);

    // Initial position: center pedestal in Zone C
    wrapper.position.set(5.5, FY + 1.10, 1.95);

    booth.add(wrapper);
    customObjects.push(wrapper);
    selectCustomObject(wrapper);
  };

  if (name.endsWith('.glb') || name.endsWith('.gltf')) {
    reader.onload = (e) => {
      gltfLoader.parse(e.target.result, '', (gltf) => {
        onLoaded(gltf.scene || gltf.scenes[0]);
      }, (err) => {
        alert('ไม่สามารถโหลดโมเดล GLTF/GLB ได้: ' + (err.message || err));
      });
    };
    reader.readAsArrayBuffer(file);
  } else if (name.endsWith('.obj')) {
    reader.onload = (e) => {
      try {
        const obj = objLoader.parse(e.target.result);
        onLoaded(obj);
      } catch (err) {
        alert('ไม่สามารถโหลดโมเดล OBJ ได้: ' + (err.message || err));
      }
    };
    reader.readAsText(file);
  } else if (name.endsWith('.fbx')) {
    reader.onload = (e) => {
      try {
        const obj = fbxLoader.parse(e.target.result, '');
        onLoaded(obj);
      } catch (err) {
        alert('ไม่สามารถโหลดโมเดล FBX ได้: ' + (err.message || err));
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert('ระบบรองรับไฟล์ 3D ประเภท .glb, .gltf, .fbx หรือ .obj ครับ');
  }
}

// ---------------------------------------------------------------------------
// UI wiring
// ---------------------------------------------------------------------------
function wireUI() {
  // Mobile drawer controls
  const controlPanel = document.getElementById('controlPanel');
  const panelBackdrop = document.getElementById('panelBackdrop');
  const btnTogglePanel = document.getElementById('btnTogglePanel');
  const btnClosePanel = document.getElementById('btnClosePanel');

  function openPanel() {
    if (controlPanel) controlPanel.classList.add('open');
    if (panelBackdrop) panelBackdrop.classList.add('open');
    if (btnTogglePanel) {
      btnTogglePanel.classList.add('active');
      const lbl = btnTogglePanel.querySelector('.btn-toggle-label');
      if (lbl) lbl.textContent = '✕ ปิดเมนู';
    }
  }

  function closePanel() {
    if (controlPanel) controlPanel.classList.remove('open');
    if (panelBackdrop) panelBackdrop.classList.remove('open');
    if (btnTogglePanel) {
      btnTogglePanel.classList.remove('active');
      const lbl = btnTogglePanel.querySelector('.btn-toggle-label');
      if (lbl) lbl.textContent = 'แผงควบคุม';
    }
  }

  // Ensure closed by default on page load (mobile-first rule)
  closePanel();

  if (btnTogglePanel) {
    btnTogglePanel.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = controlPanel && controlPanel.classList.contains('open');
      if (isOpen) closePanel();
      else openPanel();
    });
  }

  if (btnClosePanel) {
    btnClosePanel.addEventListener('click', closePanel);
  }

  if (panelBackdrop) {
    panelBackdrop.addEventListener('click', closePanel);
  }

  // Legend controls (Closed by default)
  const legendBox = document.getElementById('legendBox');
  const btnToggleLegend = document.getElementById('btnToggleLegend');
  const btnCloseLegend = document.getElementById('btnCloseLegend');
  const toggleLegend = document.getElementById('toggleLegend');

  function setLegendOpen(open) {
    if (legendBox) {
      if (open) legendBox.classList.add('open');
      else legendBox.classList.remove('open');
    }
    if (btnToggleLegend) {
      if (open) btnToggleLegend.classList.add('active');
      else btnToggleLegend.classList.remove('active');
    }
    if (toggleLegend) {
      toggleLegend.checked = open;
    }
  }

  // Ensure closed by default on page load
  setLegendOpen(false);

  if (btnToggleLegend) {
    btnToggleLegend.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = legendBox && legendBox.classList.contains('open');
      setLegendOpen(!isOpen);
    });
  }

  if (btnCloseLegend) {
    btnCloseLegend.addEventListener('click', () => setLegendOpen(false));
  }

  if (toggleLegend) {
    toggleLegend.addEventListener('change', (e) => setLegendOpen(e.target.checked));
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePanel();
      setLegendOpen(false);
    }
  });

  document.querySelectorAll('#lightModes button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#lightModes button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      setMode(btn.dataset.mode);
    });
  });
  document.querySelectorAll('#viewBar button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#viewBar button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      flyTo(btn.dataset.view);
      if (window.innerWidth <= 900) {
        closePanel();
      }
    });
  });
  document.getElementById('toggleDims').addEventListener('change', (e) => {
    dimGroup.visible = e.target.checked;
    dimLabels.forEach((l) => (l.visible = e.target.checked));
  });
  document.getElementById('toggleZones').addEventListener('change', (e) => {
    zoneLabels.forEach((l) => (l.visible = e.target.checked));
  });
  const toggleExhibits = document.getElementById('toggleExhibits');
  if (toggleExhibits) {
    toggleExhibits.addEventListener('change', (e) => {
      exhibitGroup.visible = e.target.checked;
      exhibitLabels.forEach((l) => (l.visible = e.target.checked));
    });
  }
  const toggleTransparent = document.getElementById('toggleTransparent');
  const xRayControls = document.getElementById('xRayControls');
  const xRayOpacitySlider = document.getElementById('xRayOpacitySlider');
  const xRayOpacityDisplay = document.getElementById('xRayOpacityDisplay');

  if (toggleTransparent) {
    toggleTransparent.addEventListener('change', (e) => {
      if (xRayControls) xRayControls.style.display = e.target.checked ? 'block' : 'none';
      const curVal = xRayOpacitySlider ? parseFloat(xRayOpacitySlider.value) / 100 : 0.035;
      setWallsTransparent(e.target.checked, curVal);
    });
  }

  if (xRayOpacitySlider) {
    xRayOpacitySlider.addEventListener('input', (e) => {
      const pct = parseFloat(e.target.value);
      if (xRayOpacityDisplay) {
        xRayOpacityDisplay.textContent = pct <= 2 ? `จางสูงสุด (${pct}%)` : pct <= 5 ? `จางมากพิเศษ (${pct}%)` : `โปร่งแสง (${pct}%)`;
      }
      if (isSeeThrough) {
        setWallsTransparent(true, pct / 100);
      }
    });
  }
  document.getElementById('toggleRotate').addEventListener('change', (e) => {
    controls.autoRotate = e.target.checked;
  });
  document.getElementById('btnShot').addEventListener('click', () => {
    composer.render();
    const a = document.createElement('a');
    a.download = `booth-warm-wood-${Date.now()}.png`;
    a.href = renderer.domElement.toDataURL('image/png');
    a.click();
  });

  // 3D File Upload & Drag-Drop
  const fileUpload = document.getElementById('fileUpload');
  const btnUpload = document.getElementById('btnUpload');
  if (btnUpload && fileUpload) {
    btnUpload.addEventListener('click', () => fileUpload.click());
    fileUpload.addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) handle3DFile(f);
      e.target.value = '';
    });
  }

  const dropZone = document.getElementById('dropZone');
  if (dropZone) {
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('active');
    });
    window.addEventListener('dragleave', (e) => {
      if (e.relatedTarget === null) dropZone.classList.remove('active');
    });
    dropZone.addEventListener('dragover', (e) => e.preventDefault());
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('active');
      const f = e.dataTransfer.files[0];
      if (f) handle3DFile(f);
    });
  }

  // Gizmo mode buttons
  const btnTranslate = document.getElementById('gizmo-translate');
  const btnRotate = document.getElementById('gizmo-rotate');
  if (btnTranslate && btnRotate) {
    btnTranslate.addEventListener('click', () => {
      btnTranslate.classList.add('active');
      btnRotate.classList.remove('active');
      if (transformControls) transformControls.setMode('translate');
    });
    btnRotate.addEventListener('click', () => {
      btnRotate.classList.add('active');
      btnTranslate.classList.remove('active');
      if (transformControls) transformControls.setMode('rotate');
    });
  }

  // Scale slider
  const scaleSlider = document.getElementById('scaleSlider');
  if (scaleSlider) {
    scaleSlider.addEventListener('input', (e) => {
      if (selectedCustomObj) {
        setObjectHeight(selectedCustomObj, parseFloat(e.target.value) / 100);
      }
    });
  }

  // Presets
  const btnSet50cm = document.getElementById('btnSet50cm');
  if (btnSet50cm) {
    btnSet50cm.addEventListener('click', () => {
      if (selectedCustomObj) setObjectHeight(selectedCustomObj, 0.5);
    });
  }

  const btnPlacePedestal = document.getElementById('btnPlacePedestal');
  if (btnPlacePedestal) {
    btnPlacePedestal.addEventListener('click', () => {
      if (selectedCustomObj) {
        selectedCustomObj.position.set(0, FY + 1.00, 1.65);
      }
    });
  }

  const btnDeleteModel = document.getElementById('btnDeleteModel');
  if (btnDeleteModel) {
    btnDeleteModel.addEventListener('click', () => {
      if (selectedCustomObj) {
        booth.remove(selectedCustomObj);
        const idx = customObjects.indexOf(selectedCustomObj);
        if (idx >= 0) customObjects.splice(idx, 1);
        selectCustomObject(null);
      }
    });
  }
}

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  labelRenderer.setSize(w, h);
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
async function init() {
  const loaderSub = document.querySelector('.loader-sub');
  if (loaderSub) loaderSub.textContent = 'กำลังโหลดโมเดลประติมากรรม Foxy.glb...';

  try {
    await Promise.all([
      document.fonts.load('600 64px "Cormorant Garamond"'),
      document.fonts.load('400 32px "Outfit"'),
      loadFoxyModel((pct) => {
        if (loaderSub) loaderSub.textContent = `กำลังโหลดโมเดลประติมากรรม Foxy ${pct}%...`;
      }),
    ]);
  } catch (e) { /* fall back to system fonts */ }

  if (loaderSub) loaderSub.textContent = 'กำลังจัดเตรียมพื้นที่จัดแสดง...';

  buildTextures();
  buildMaterials();
  buildHallAndPlatform();
  buildBackWall();
  buildEnclosureAndPartitions();
  buildKitchen();
  buildLiving();
  buildGallery();
  buildLights();
  buildAnnotations();
  setMode('golden');
  setupCustomObjectSystem();
  wireUI();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (tween) {
      tween.t += dt;
      const k = ease(Math.min(1, tween.t / tween.dur));
      camera.position.lerpVectors(tween.p0, tween.p1, k);
      controls.target.lerpVectors(tween.t0, tween.t1, k);
      if (k >= 1) tween = null;
    }
    controls.update();
    composer.render();
    labelRenderer.render(scene, camera);
  });

  requestAnimationFrame(() => document.getElementById('loader').classList.add('done'));
}

init();
