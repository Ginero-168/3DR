/**
 * Warm Wood Living Room — Exhibition Booth 3D Mockup
 * Booth: 15 m wide × 3 m deep open platform, with 3 m high backdrop wall.
 * 5 Blocks of 3 meters each (15m total width):
 * - Block 1 (x: -7.5 to -4.5): Earth & Stone Brick Lounge (P1 Gold Foxy, S1 Sculpture)
 * - Block 2 (x: -4.5 to -1.5): Oak Slat Lounge (P2 & P3 Abstract Canvases, S2 Sculpture)
 * - Block 3 (x: -1.5 to +1.5): Marble Pavilion Center Showcase Lounge (P4 Master Graffiti, S3 Center Foxy)
 * - Block 4 (x: +1.5 to +4.5): Japandi Timber Lounge (P5 Abstract Green Canvas, Classic Art, S4 Sculpture)
 * - Block 5 (x: +4.5 to +7.5): VIP Photo Lounge (P6 Sun Graffiti, Photo Sofa, S5 Selfie Foxy)
 * Open-plan concept with open front, continuous walkway, and bespoke wall displays.
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
const W = 15;        // total width: 15 m
const H = 3;         // backdrop wall height: 3 m
const D = 3;         // platform depth: 3 m
const FY = 0.1;      // platform top height: 0.1 m
const SCULPT_H = 0.5; // sculpture height (50 cm)

// 5 Blocks of 3 meters: Centers at [-6.0, -3.0, 0.0, 3.0, 6.0]
const BLOCK_CENTERS = [-6.0, -3.0, 0.0, 3.0, 6.0];

const V2 = THREE.Vector2;
const V3 = THREE.Vector3;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);

// Authentic Artwork Sources (New images in pic/ + classic oil paintings)
const ART_SOURCES = {
  p01: 'pic/01.jpeg', // Gold Foxy vertical canvas (738x952)
  p02: 'pic/02.jpeg', // Abstract Yellow & Blue Foxy square (721x705)
  p03: 'pic/03.jpeg', // Abstract Blue & Red Foxy square (692x681)
  p04: 'pic/04.jpeg', // Abstract Green Foxy square (707x698)
  p05: 'pic/05.jpeg', // Wide Blue Foxy Master Graffiti canvas (993x475, ~2:1)
  p06: 'pic/06.jpeg', // Wide Blue Foxy Sun & Lightning Graffiti canvas (993x495, ~2:1)
  classic1: '834201435_1106636995178112_873089852634520844_n.jpeg',
  classic2: '830834694_1786672265795135_3184531431469431023_n.jpeg',
  classic3: '830513828_1410008468011031_6845268736765103662_n.jpeg',
  classic4: '830236695_1092868896720615_696399951761031174_n.jpeg',
};
const artMeshes = [];

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
camera.position.set(10.5, 5.2, 12.0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.3, 1.4);
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
// Procedural textures (with high fidelity)
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
function configureTexture(tex) {
  if (!tex) return tex;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  if (renderer && renderer.capabilities) {
    tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  }
  tex.needsUpdate = true;
  return tex;
}
function loadArtTexture(url) {
  const loader = new THREE.TextureLoader();
  return new Promise((resolve) => {
    loader.load(
      url,
      (tex) => {
        configureTexture(tex);
        resolve(tex);
      },
      undefined,
      (err) => {
        console.warn('Could not load artwork texture:', url, err);
        resolve(null);
      }
    );
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

  // Cream stone brick (colour + bump) for Block 1
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

  // Calacatta Gold Marble for Block 3
  TEX.marble = canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#f6f1e8'; g.fillRect(0, 0, w, h);
    const vein = (lw, alpha, blur, col = 'rgba(140,118,92,') => {
      g.filter = `blur(${blur}px)`;
      g.strokeStyle = `${col}${alpha})`;
      g.lineWidth = lw;
      g.beginPath();
      let x = Math.random() * w, y = 0;
      g.moveTo(x, y);
      while (y < h) { x += rand(-40, 40); y += rand(20, 60); g.lineTo(x, y); }
      g.stroke();
    };
    for (let i = 0; i < 7; i++) vein(rand(4, 9), 0.22, 5, 'rgba(170,140,95,');
    for (let i = 0; i < 16; i++) vein(rand(0.8, 1.8), 0.38, 0.6, 'rgba(120,105,88,');
    g.filter = 'none';
  });

  // Woven jute & wool rugs
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
  });

  TEX.fabric = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#efe6d7'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(150,130,100,${rand(0.02, 0.07)})`; g.fillRect(0, y, w, 1); }
    for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(255,255,255,${rand(0.02, 0.06)})`; g.fillRect(x, 0, 1, h); }
    noise(g, w, h, 4000, ['#b8a587', '#ffffff'], [1, 2]);
  }, [3, 3]);

  TEX.boucle = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#f4ede0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2200; i++) {
      g.fillStyle = Math.random() < 0.5 ? 'rgba(210,195,175,0.22)' : 'rgba(255,255,255,0.3)';
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, rand(1.5, 4.5), 0, Math.PI * 2);
      g.fill();
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

  TEX.hall = canvasTex(1024, 1024, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, '#3a3029'); grd.addColorStop(0.35, '#2a221c'); grd.addColorStop(1, '#17110c');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    noise(g, w, h, 20000, ['#000000', '#5a4a3e'], [1, 2], [0.05, 0.15]);
  });

  // Fallback procedural art canvases if image loading is delayed or offline
  if (!TEX.p01) TEX.p01 = canvasTex(512, 680, (g, w, h) => {
    g.fillStyle = '#f4e6c8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#db9c38'; g.beginPath(); g.arc(w / 2, h * 0.45, w * 0.35, 0, Math.PI * 2); g.fill();
    noise(g, w, h, 6000, ['#a87020', '#ffffff'], [1, 2]);
  });
  if (!TEX.p02) TEX.p02 = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#e8dcc4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2b6cb0'; g.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
    noise(g, w, h, 5000, ['#e0a820', '#103060'], [1, 2]);
  });
  if (!TEX.p03) TEX.p03 = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#e8dcc4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a4b88'; g.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
    noise(g, w, h, 5000, ['#c83020', '#ffffff'], [1, 2]);
  });
  if (!TEX.p04) TEX.p04 = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#e8dcc4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3d7a48'; g.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
    noise(g, w, h, 5000, ['#104020', '#e0e890'], [1, 2]);
  });
  if (!TEX.p05) TEX.p05 = canvasTex(800, 400, (g, w, h) => {
    g.fillStyle = '#e6edf4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2d84c6'; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.38, h * 0.36, 0, 0, Math.PI * 2); g.fill();
    noise(g, w, h, 7000, ['#f09020', '#1a4060'], [1, 2]);
  });
  if (!TEX.p06) TEX.p06 = canvasTex(800, 400, (g, w, h) => {
    g.fillStyle = '#fff4e4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#247bb8'; g.beginPath(); g.ellipse(w * 0.6, h / 2, w * 0.3, h * 0.35, 0, 0, Math.PI * 2); g.fill();
    noise(g, w, h, 7000, ['#f5aa30', '#ffffff'], [1, 2]);
  });
  if (!TEX.classic1) TEX.classic1 = TEX.p01;
  if (!TEX.classic2) TEX.classic2 = TEX.p02;
  if (!TEX.classic3) TEX.classic3 = TEX.p03;
  if (!TEX.classic4) TEX.classic4 = TEX.p04;
}

function logoTexture(main, sub, color = '#f4dcae') {
  return canvasTex(2048, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const mainFontSize = main.length > 14 ? 160 : 210;
    const spacing = main.length > 14 ? '14px' : '24px';
    g.letterSpacing = spacing;
    g.font = `600 ${mainFontSize}px "Cormorant Garamond", serif`;
    g.fillText(main, w / 2, h * 0.42);
    g.letterSpacing = '16px';
    g.font = '400 54px "Outfit", sans-serif';
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
  M.olivePlaster = std(0xa6ad92, 0.92, 0, { map: texRepeat(TEX.plaster, 2, 2) });
  M.olive = std(0x56603f, 0.55);
  M.marble = std(0xffffff, 0.25, 0, { map: TEX.marble });
  M.brass = std(0xc9a25a, 0.28, 1);
  M.brassSatin = std(0xb8904c, 0.45, 1);
  M.blackMetal = std(0x1c1a18, 0.45, 0.6);
  M.leather = std(0x9e623b, 0.48);
  M.leatherDark = std(0x6b3c22, 0.5);
  M.linen = std(0xffffff, 0.95, 0, { map: TEX.fabric });
  M.boucle = std(0xffffff, 0.98, 0, { map: TEX.boucle });
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

  // Artwork Materials for the 6 new pictures + classic art
  M.p01 = std(0xffffff, 0.85, 0, { map: TEX.p01 });
  M.p02 = std(0xffffff, 0.85, 0, { map: TEX.p02 });
  M.p03 = std(0xffffff, 0.85, 0, { map: TEX.p03 });
  M.p04 = std(0xffffff, 0.85, 0, { map: TEX.p04 });
  M.p05 = std(0xffffff, 0.85, 0, { map: TEX.p05 });
  M.p06 = std(0xffffff, 0.85, 0, { map: TEX.p06 });
  M.classic1 = std(0xffffff, 0.85, 0, { map: TEX.classic1 });
  M.classic2 = std(0xffffff, 0.85, 0, { map: TEX.classic2 });
  M.classic3 = std(0xffffff, 0.85, 0, { map: TEX.classic3 });
  M.classic4 = std(0xffffff, 0.85, 0, { map: TEX.classic4 });

  M.pillow = {
    rust: std(0xa4532d, 0.95, 0, { map: TEX.fabric }),
    olive: std(0x6a7248, 0.95, 0, { map: TEX.fabric }),
    beige: std(0xd7c4a3, 0.95, 0, { map: TEX.fabric }),
    cream: std(0xf3ece0, 0.95, 0, { map: TEX.fabric }),
    terra: std(0xc0805a, 0.95, 0, { map: TEX.fabric }),
  };
}

// ---------------------------------------------------------------------------
// Props & Props Makers
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
  const leaves = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), M.leaf, 80);
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std(0xf6f1e6, 0.8), 24);
  const d = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < 80; i++) {
    const a = rand(0, Math.PI * 2), r = rand(0.02, 0.22), y = 0.3 + rand(0, 0.30) - r * 0.3;
    d.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    d.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    const s = rand(0.03, 0.05); d.scale.set(s, s * 0.18, s * 0.45); d.updateMatrix();
    leaves.setMatrixAt(i, d.matrix);
    c.setHSL(rand(0.22, 0.28), rand(0.25, 0.4), rand(0.25, 0.38)); leaves.setColorAt(i, c);
  }
  for (let i = 0; i < 24; i++) {
    const a = rand(0, Math.PI * 2), r = rand(0.03, 0.18);
    d.position.set(Math.cos(a) * r, 0.42 + rand(0, 0.20), Math.sin(a) * r);
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

function makeBowl(r = 0.14, mat = M.walnut) {
  const g = new THREE.Group();
  const bowl = lathe([[0, 0], [r * 0.5, 0], [r * 0.85, r * 0.25], [r, r * 0.45]], mat, 40);
  bowl.material = mat.clone(); bowl.material.side = THREE.DoubleSide;
  bowl.castShadow = true; g.add(bowl);
  return g;
}

function makeFruitBowl() {
  const g = makeBowl(0.16, M.ceramic);
  const lemon = std(0xe8c24a, 0.55);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const l = mesh(new THREE.SphereGeometry(0.036, 16, 12), lemon, Math.cos(a) * 0.07, 0.05 + (i % 2) * 0.02, Math.sin(a) * 0.07, g);
    l.scale.set(1, 0.85, 1.25);
  }
  return g;
}

function makeFramedPicture(w, h, mat, artKey = '', viewPos = null, title = '') {
  const g = new THREE.Group();
  const frameD = 0.04, frameBorder = 0.045;
  // Outer walnut frame
  mesh(B(w + frameBorder * 2, h + frameBorder * 2, frameD), M.walnut, 0, 0, 0, g);
  // Satin brass inner reveal
  mesh(B(w + 0.015, h + 0.015, frameD + 0.005), M.brassSatin, 0, 0, 0, g);
  // Canvas plane
  const canvasMesh = mesh(new THREE.PlaneGeometry(w, h), mat, 0, 0, frameD / 2 + 0.004, g, false, true);
  if (artKey) {
    canvasMesh.userData.isArt = true;
    canvasMesh.userData.artKey = artKey;
    canvasMesh.userData.viewPos = viewPos;
    canvasMesh.userData.title = title;
    artMeshes.push(canvasMesh);
  }

  // Museum Picture Light Fixture
  const lightBar = new THREE.Group();
  lightBar.position.set(0, h / 2 + frameBorder + 0.09, frameD + 0.08);
  mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.11, 8), M.brass, -w * 0.25, -0.04, -0.04, lightBar).rotation.x = Math.PI / 3;
  mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.11, 8), M.brass, w * 0.25, -0.04, -0.04, lightBar).rotation.x = Math.PI / 3;
  mesh(new THREE.CylinderGeometry(0.009, 0.009, Math.min(w * 0.75, 0.65), 16), M.brass, 0, 0, 0, lightBar).rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.005, 0.005, Math.min(w * 0.70, 0.60), 16), M.led, 0, -0.007, 0, lightBar, false, false).rotation.z = Math.PI / 2;
  g.add(lightBar);

  const pl = addAccent(new THREE.PointLight(0xffe8cc, 0.95, 2.2, 2), 0.95);
  pl.position.set(0, h / 2 + 0.08, frameD + 0.12);
  g.add(pl);

  return g;
}

// ---------------------------------------------------------------------------
// Sculptures — Foxy 50 cm
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

const SCULPTURES = [
  // Fallbacks if GLB fails
  (mat = M.ceramic) => {
    const g = new THREE.Group();
    g.add(lathe([[0, 0], [0.07, 0], [0.09, 0.03], [0.125, 0.12], [0.135, 0.2], [0.1, 0.3], [0.05, 0.38], [0.044, 0.44], [0.062, 0.5]], mat, 64));
    return g;
  },
  () => {
    const g = new THREE.Group();
    mesh(new THREE.TorusKnotGeometry(0.11, 0.032, 200, 24, 2, 3), M.bronze, 0, 0.25, 0, g);
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
          root.rotation.y = 0;
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.envMapIntensity = 1.35;
                child.material.roughness = Math.min(child.material.roughness, 0.60);
                if (child.material.metalness > 0.35) {
                  child.material.metalness = 0.22;
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
        console.warn('Could not load Foxy.glb, falling back to procedural', err);
        resolve(null);
      }
    );
  });
}

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
  const s = normalize(SCULPTURES[sculptIdx % SCULPTURES.length]());
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
// Wall Registry & See-Through / X-Ray Mode
// ---------------------------------------------------------------------------
const wallRegistry = [];
const xRayMaterial = new THREE.MeshStandardMaterial({
  color: 0x90b2cc,
  roughness: 0.05,
  metalness: 0.0,
  transparent: true,
  opacity: 0.035,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const xRayTrimMaterial = new THREE.MeshStandardMaterial({
  color: 0x768f9f,
  roughness: 0.1,
  metalness: 0.05,
  transparent: true,
  opacity: 0.065,
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

// ---------------------------------------------------------------------------
// Booth Structure (Platform & Hall)
// ---------------------------------------------------------------------------
function buildHallAndPlatform() {
  const hall = mesh(new THREE.CircleGeometry(48, 64).rotateX(-Math.PI / 2), M.hall, 0, 0, 2, scene, false, true);
  hall.position.y = 0;

  // 15 m × 3 m floor platform
  const plat = mesh(B(W, FY, D), M.floor, 0, FY / 2, D / 2);
  plat.castShadow = false;

  // Front & side trims in walnut + LED kick line
  mesh(B(W + 0.04, FY, 0.03), M.walnut, 0, FY / 2, D + 0.015);
  mesh(B(0.03, FY, D), M.walnut, -W / 2 - 0.015, FY / 2, D / 2);
  mesh(B(0.03, FY, D), M.walnut, W / 2 + 0.015, FY / 2, D / 2);
  mesh(B(W, 0.012, 0.012), M.led, 0, 0.02, D + 0.035, booth, false, false);

  // Subtle satin brass inlays on floor separating the 5 blocks (at x = -4.5, -1.5, 1.5, 4.5)
  [-4.5, -1.5, 1.5, 4.5].forEach((bx) => {
    mesh(B(0.012, 0.002, D), M.brassSatin, bx, FY + 0.001, D / 2, booth, false, false);
  });
}

// ---------------------------------------------------------------------------
// Open-Plan Architecture & Ceiling Rafters ("ทำแบบเปิดโล่ง")
// ---------------------------------------------------------------------------
function buildOpenCeilingAndPortals() {
  // 1. Open Front Portals (Slender architectural oak posts defining the 5 open 3m bays)
  [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5].forEach((px) => {
    const post = registerWall(mesh(B(0.07, H, 0.07), M.walnut, px, FY + H / 2, D - 0.035), 'trim');
    mesh(B(0.08, 0.06, 0.08), M.brassSatin, px, FY + 0.03, D - 0.035);
  });

  // Continuous walnut front header lintel beam spanning the 15m open facade at ceiling
  registerWall(mesh(B(W + 0.10, 0.14, 0.12), M.walnut, 0, FY + H - 0.07, D - 0.035), 'trim');

  // Downlights under front lintel pointing onto each of the 5 entrance bays
  BLOCK_CENTERS.forEach((cx) => {
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.015, 16), M.brass, cx, FY + H - 0.145, D - 0.035);
    mesh(new THREE.CircleGeometry(0.02, 16).rotateX(Math.PI / 2), M.bulb, cx, FY + H - 0.155, D - 0.035, booth, false, false);
    const sp = addAccent(new THREE.SpotLight(0xffecd4, 2.8, 4.8, 0.5, 0.5, 2), 2.8);
    sp.position.set(cx, FY + H - 0.16, D - 0.035);
    sp.target.position.set(cx, FY, D - 0.5);
    booth.add(sp, sp.target);
  });

  // 2. Open Ceiling Louvers / Timber Rafters (Front-to-back across 15m)
  const rafterCount = 21;
  const startX = -7.2;
  const dx = (7.2 - startX) / (rafterCount - 1);
  for (let i = 0; i < rafterCount; i++) {
    const rx = startX + i * dx;
    registerWall(mesh(B(0.045, 0.10, D), M.oak, rx, FY + H - 0.05, D / 2), 'roof');
  }

  // 3. Side Walls (Left & Right 3m end walls)
  registerWall(mesh(B(0.10, H, D), M.plaster, -W / 2 - 0.05, FY + H / 2, D / 2), 'wall');
  registerWall(mesh(B(0.10, H, D), M.plaster, W / 2 + 0.05, FY + H / 2, D / 2), 'wall');
  registerWall(mesh(B(0.12, 0.04, D + 0.04), M.walnut, -W / 2 - 0.05, FY + H + 0.02, D / 2), 'trim');
  registerWall(mesh(B(0.12, 0.04, D + 0.04), M.walnut, W / 2 + 0.05, FY + H + 0.02, D / 2), 'trim');

  // 4. Open-Air Dividers Between Blocks (z: 0 to 1.1m only, leaving 1.9m open walkway along front!)
  [-4.5, -1.5, 1.5, 4.5].forEach((dx) => {
    // Slender open wood slat screen fin from back wall to z = 1.1m
    const finW = 0.06, finD = 1.10;
    registerWall(mesh(B(finW, H, 0.06), M.walnut, dx, FY + H / 2, finD - 0.03), 'trim'); // end jamb
    mesh(B(0.015, H - 0.2, 0.005), M.brassSatin, dx, FY + H / 2, finD + 0.005);

    // Decorative vertical slats within the 1.1m divider
    for (let sz = 0.18; sz <= finD - 0.12; sz += 0.22) {
      registerWall(mesh(B(0.025, H - 0.20, 0.045), M.oakV, dx, FY + H / 2, sz), 'slat');
    }
    // Vertical warm LED strip along divider fin end
    mesh(B(0.008, H - 0.40, 0.008), M.led, dx, FY + H / 2, finD + 0.008, booth, false, false);
  });
}

// ---------------------------------------------------------------------------
// Badges & Annotations
// ---------------------------------------------------------------------------
const exhibitGroup = new THREE.Group();
const exhibitLabels = [];

function addExhibitBadge(text, pos, type = 'sculpture') {
  const div = document.createElement('div');
  div.className = 'exhibit-label' + (type === 'art' ? ' art-badge' : type === 'photo' ? ' photo-badge' : '');
  div.textContent = text;
  const lab = new CSS2DObject(div);
  lab.position.copy(pos);
  exhibitGroup.add(lab);
  exhibitLabels.push(lab);
  return lab;
}

// ---------------------------------------------------------------------------
// BLOCK 1 (x: -7.5 … -4.5, Center -6.0)
// Theme: Earth & Stone Brick Lounge
// Art: P1 (pic/01.jpeg Gold Foxy), S1 Foxy Sculpture (50cm)
// Seating: Pair of Cream Bouclé Armchairs, Round Travertine Coffee Table
// ---------------------------------------------------------------------------
function buildBlock1() {
  const cx = -6.0;

  // 1. Distinct Wall Display: Stone Brick Feature Wall
  const brick = std(0xffffff, 0.9, 0, { map: texRepeat(TEX.brick, 1.5, 3), bumpMap: texRepeat(TEX.brickBump, 1.5, 3), bumpScale: 2 });
  registerWall(mesh(B(3.0, H, 0.04), brick, cx, FY + H / 2, 0.02), 'wall');
  registerWall(mesh(B(3.02, 0.04, 0.08), M.walnut, cx, FY + H + 0.02, 0.04), 'trim');

  // Top & bottom warm wall washer lights
  mesh(B(2.9, 0.01, 0.01), M.led, cx, FY + 0.01, 0.06, booth, false, false);
  mesh(B(2.9, 0.01, 0.01), M.led, cx, FY + H - 0.02, 0.06, booth, false, false);

  // 2. Art Display: P1 (pic/01.jpeg Gold Foxy, 0.98 × 1.28 m)
  const art1X = -5.70, art1Y = FY + 1.82;
  place(
    makeFramedPicture(0.98, 1.28, M.p01, 'p01', { pos: [art1X, art1Y, 2.2], target: [art1X, art1Y, 0.05] }, 'P1 · Gold Foxy (01.jpeg)'),
    art1X, art1Y, 0.05
  );
  addExhibitBadge('P1 · ภาพวาด 1 (01.jpeg Gold Foxy)', new V3(art1X, art1Y + 0.85, 0.16), 'art');

  // Floating oak shelves on left section (x = -6.85)
  [FY + 1.40, FY + 2.10].forEach((y) => {
    mesh(B(0.95, 0.035, 0.24), M.oak, -6.85, y, 0.14);
    mesh(B(0.90, 0.006, 0.012), M.led, -6.85, y - 0.02, 0.24, booth, false, false);
  });
  place(makePlant({ potR: 0.06, potH: 0.11, tree: false, crown: [0.11, 0.09, 0.11], leaves: 40, leafSize: 0.04 }), -7.10, FY + 1.40 + 0.02, 0.14);
  place(makeBooks(3), -6.65, FY + 1.40 + 0.02, 0.14);
  place(makeBowl(0.08, M.walnut), -6.85, FY + 2.10 + 0.02, 0.14);

  // 3. Sculpture S1 on Travertine Pedestal
  const ped1X = -6.80, ped1Z = 1.10, ped1H = 0.90;
  mesh(B(0.44, ped1H, 0.44, 0.01), M.travertine, ped1X, FY + ped1H / 2, ped1Z);
  mesh(B(0.40, 0.025, 0.40), M.basalt, ped1X, FY + 0.012, ped1Z);
  place(nextSculpture(), ped1X, FY + ped1H, ped1Z, booth, -0.25);
  addExhibitBadge('S1 · ประติมากรรม Foxy (50 cm)', new V3(ped1X, FY + ped1H + SCULPT_H + 0.15, ped1Z));

  const spot1 = addAccent(new THREE.SpotLight(0xfff2df, 7.5, 5.0, 0.38, 0.5, 2), 7.5);
  spot1.position.set(ped1X, FY + H - 0.15, ped1Z + 0.75);
  spot1.target.position.set(ped1X, FY + ped1H + 0.25, ped1Z);
  booth.add(spot1, spot1.target);

  // 4. Seating Vignette: Pair of Cream Bouclé Armchairs & Travertine Table
  // Area Rug (Woven Wool, 2.3 × 1.8 m)
  mesh(B(2.30, 0.005, 1.80, 0.04), M.boucle, cx, FY + 0.003, 1.75, booth, false, true);

  // Left Armchair (angled right)
  makeArmchair(-6.60, 1.70, 0.35, M.boucle);
  // Right Armchair (angled left)
  makeArmchair(-5.40, 1.70, -0.35, M.boucle);

  // Round Travertine Low Coffee Table (diameter 0.70m, height 0.38m)
  const tabX = cx, tabZ = 1.70;
  mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.035, 32), M.travertine, tabX, FY + 0.36, tabZ);
  mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.34, 24), M.walnut, tabX, FY + 0.17, tabZ);
  mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.01, 24), M.brassSatin, tabX, FY + 0.01, tabZ);
  place(makeBowl(0.09, M.brassSatin), tabX, FY + 0.38, tabZ);

  // Slim Brass Floor Lamp
  makeFloorLamp(-7.15, 2.15);
}

// ---------------------------------------------------------------------------
// BLOCK 2 (x: -4.5 … -1.5, Center -3.0)
// Theme: Oak Slat Acoustic Lounge
// Art: P2 (pic/02.jpeg Abstract Yellow/Blue) & P3 (pic/03.jpeg Abstract Blue/Red)
// Seating: Modern Walnut Low Sofa in Oatmeal Linen, Circular Jute Rug
// ---------------------------------------------------------------------------
function buildBlock2() {
  const cx = -3.0;

  // 1. Distinct Wall Display: Vertical Oak Slat Feature Wall
  registerWall(mesh(B(3.0, H, 0.02), std(0x22170f, 0.8), cx, FY + H / 2, 0.01), 'wall');
  const slatGeo = new THREE.BoxGeometry(0.042, H, 0.032);
  const slatCount = 35;
  const startX = cx - 1.40;
  const slatStep = 2.80 / (slatCount - 1);
  for (let i = 0; i < slatCount; i++) {
    registerWall(mesh(slatGeo, M.oakV, startX + i * slatStep, FY + H / 2, 0.038), 'slat');
  }
  registerWall(mesh(B(3.02, 0.04, 0.08), M.walnut, cx, FY + H + 0.02, 0.04), 'trim');
  mesh(B(2.9, 0.01, 0.01), M.led, cx, FY + 0.01, 0.065, booth, false, false);
  mesh(B(2.9, 0.01, 0.01), M.led, cx, FY + H - 0.02, 0.065, booth, false, false);

  // 2. Art Display: P2 (pic/02.jpeg, 0.90 × 0.90 m) and P3 (pic/03.jpeg, 0.90 × 0.90 m)
  const p2X = -3.70, p2Y = FY + 1.82;
  place(
    makeFramedPicture(0.90, 0.90, M.p02, 'p02', { pos: [p2X, p2Y, 2.1], target: [p2X, p2Y, 0.06] }, 'P2 · Abstract Yellow/Blue (02.jpeg)'),
    p2X, p2Y, 0.06
  );
  addExhibitBadge('P2 · ภาพวาด 2 (02.jpeg)', new V3(p2X, p2Y + 0.65, 0.16), 'art');

  const p3X = -2.30, p3Y = FY + 1.82;
  place(
    makeFramedPicture(0.90, 0.90, M.p03, 'p03', { pos: [p3X, p3Y, 2.1], target: [p3X, p3Y, 0.06] }, 'P3 · Abstract Blue/Red (03.jpeg)'),
    p3X, p3Y, 0.06
  );
  addExhibitBadge('P3 · ภาพวาด 3 (03.jpeg)', new V3(p3X, p3Y + 0.65, 0.16), 'art');

  // 3. Seating Vignette: Modern Walnut Low Sofa & Organic Coffee Table
  // Circular Jute Rug (diameter 2.10 m)
  mesh(new THREE.CircleGeometry(1.05, 40).rotateX(-Math.PI / 2), M.jute, cx, FY + 0.003, 1.65, booth, false, true);

  // 2-Seater Walnut Lounge Sofa
  makeLoungeSofa(cx, 1.15, 0, 1.90, M.linen);

  // Low Dark Walnut Organic Coffee Table
  const ctX = cx, ctZ = 1.85;
  mesh(B(0.95, 0.04, 0.48, 0.03), M.walnut, ctX, FY + 0.28, ctZ);
  mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.26, 12), M.blackMetal, ctX - 0.38, FY + 0.13, ctZ - 0.16);
  mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.26, 12), M.blackMetal, ctX + 0.38, FY + 0.13, ctZ - 0.16);
  mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.26, 12), M.blackMetal, ctX, FY + 0.13, ctZ + 0.16);
  place(makeFruitBowl(), ctX, FY + 0.30, ctZ);

  // Low Divider Credenza between Block 2 & 1 (holding Sculpture S2)
  const credX = -4.40, credZ = 0.85, credH = 0.58;
  mesh(B(0.36, credH, 0.90, 0.01), M.walnut, credX, FY + credH / 2, credZ);
  mesh(B(0.38, 0.025, 0.92, 0.005), M.travertine, credX, FY + credH + 0.012, credZ);
  place(nextSculpture(), credX, FY + credH + 0.025, credZ, booth, 0.30);
  addExhibitBadge('S2 · ประติมากรรม Foxy (50 cm)', new V3(credX, FY + credH + SCULPT_H + 0.15, credZ));
}

// ---------------------------------------------------------------------------
// BLOCK 3 (x: -1.5 … +1.5, Center 0.0 - Central Showcase Lounge)
// Theme: Calacatta Gold Marble Pavilion & Centerpiece Foxy Sculpture
// Art: P4 (pic/05.jpeg Wide Blue Foxy Master Graffiti, 1.80 × 0.86 m)
// Sculpture: S3 (Master Foxy 50 cm on Grand Travertine Plinth)
// Seating: Curved Modular Daybed / Bench in Saddle Camel Leather
// ---------------------------------------------------------------------------
function buildBlock3() {
  const cx = 0.0;

  // 1. Distinct Wall Display: Calacatta Gold Marble Slab with Fluted Walnut Frame
  registerWall(mesh(B(3.0, H, 0.02), M.plaster, cx, FY + H / 2, 0.01), 'wall');
  // Marble central feature slab (2.5m × 2.6m)
  registerWall(mesh(B(2.50, 2.60, 0.035), M.marble, cx, FY + 1.40, 0.028), 'wall');
  // Fluted walnut side pilasters
  registerWall(mesh(B(0.20, 2.60, 0.05), M.walnut, -1.35, FY + 1.40, 0.035), 'trim');
  registerWall(mesh(B(0.20, 2.60, 0.05), M.walnut, 1.35, FY + 1.40, 0.035), 'trim');
  // Backlit halo cove around marble slab
  mesh(B(2.56, 0.01, 0.01), M.led, cx, FY + 2.70, 0.04, booth, false, false);
  mesh(B(2.56, 0.01, 0.01), M.led, cx, FY + 0.10, 0.04, booth, false, false);

  // Exhibition Title Badge overhead: "MARKETING NAIIN · FOXY EXHIBITION"
  const signMat = new THREE.MeshStandardMaterial({
    map: logoTexture('MARKETING NAIIN', 'FOXY EXHIBITION · ART PAVILION'),
    transparent: true,
    color: 0xffffff,
    emissive: 0xffd9a0,
    roughness: 0.5,
  });
  signMat.emissiveMap = signMat.map;
  signMat.emissiveIntensity = 0.95;
  glowMats.push({ mat: signMat, base: 0.95 });
  registerWall(mesh(new THREE.PlaneGeometry(2.10, 0.26), signMat, cx, FY + 2.82, 0.045, booth, false, false), 'sign');

  // 2. Art Display: P4 (pic/05.jpeg Wide Blue Foxy Master Graffiti, 1.80 × 0.86 m)
  const p4Y = FY + 1.95;
  place(
    makeFramedPicture(1.80, 0.86, M.p05, 'p05', { pos: [0, p4Y, 2.3], target: [0, p4Y, 0.06] }, 'P4 · Wide Master Graffiti (05.jpeg)'),
    0, p4Y, 0.06
  );
  addExhibitBadge('P4 · ผลงานมาสเตอร์กราฟฟิตี้ (05.jpeg)', new V3(0, p4Y + 0.65, 0.16), 'art');

  // 3. Centerpiece Sculpture S3 on Grand Travertine & Basalt Plinth
  const ped3Z = 1.45, ped3H = 0.95;
  mesh(B(0.50, ped3H, 0.50, 0.015), M.travertine, cx, FY + ped3H / 2, ped3Z);
  mesh(B(0.44, 0.03, 0.44), M.basalt, cx, FY + 0.015, ped3Z);
  mesh(B(0.48, 0.015, 0.48), M.brassSatin, cx, FY + ped3H + 0.008, ped3Z);
  place(nextSculpture(), cx, FY + ped3H + 0.016, ped3Z, booth, 0.0);
  addExhibitBadge('S3 · ประติมากรรมมาสเตอร์ Foxy (50 cm)', new V3(cx, FY + ped3H + SCULPT_H + 0.18, ped3Z));

  // Front Key Spotlight directly illuminating Master Foxy S3
  const spot3 = addAccent(new THREE.SpotLight(0xfff6e8, 9.0, 5.5, 0.36, 0.5, 2), 9.0);
  spot3.position.set(0, FY + H - 0.15, ped3Z + 0.95);
  spot3.target.position.set(0, FY + ped3H + 0.25, ped3Z);
  booth.add(spot3, spot3.target);

  const fill3 = addAccent(new THREE.PointLight(0xffecd2, 3.2, 3.0, 2), 3.2);
  fill3.position.set(0, FY + ped3H + 0.35, ped3Z + 0.70);
  booth.add(fill3);

  // 4. Seating Vignette: Curved Modular Daybed / Bench in Saddle Leather
  // Oval Designer Rug (2.40 × 1.60 m)
  mesh(B(2.40, 0.005, 1.60, 0.06), M.linen, cx, FY + 0.003, 2.05, booth, false, true);

  // Curved Low-Profile Leather Bench (framing the pedestal)
  makeLeatherDaybed(cx, 2.30, 0);

  // Round Fluted Walnut Side Table
  mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 32), M.walnut, -0.95, FY + 0.18, 1.95);
  mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 32), M.marble, -0.95, FY + 0.37, 1.95);
  place(makeBowl(0.08, M.brassSatin), -0.95, FY + 0.38, 1.95);
}

// ---------------------------------------------------------------------------
// BLOCK 4 (x: +1.5 … +4.5, Center +3.0)
// Theme: Japandi Olive Limewash & Recessed Walnut Niche Lounge
// Art: P5 (pic/04.jpeg Abstract Green Canvas) + Classic Metallic Foxy Oil Painting
// Sculpture: S4 Foxy (50 cm) on Travertine Plinth
// Seating: Pair of Scandinavian Oak Armchairs & Travertine Disc Table
// ---------------------------------------------------------------------------
function buildBlock4() {
  const cx = 3.0;

  // 1. Distinct Wall Display: Olive-Cream Limewash with Recessed Display Niche
  registerWall(mesh(B(3.0, H, 0.02), M.olivePlaster, cx, FY + H / 2, 0.01), 'wall');
  registerWall(mesh(B(3.02, 0.04, 0.08), M.walnut, cx, FY + H + 0.02, 0.04), 'trim');

  // Recessed illuminated display niche in solid walnut
  const nicheW = 1.10, nicheH = 1.50, nicheD = 0.24;
  const nicheX = 2.35, nicheY = FY + 1.70;
  mesh(B(nicheW, 0.03, nicheD), M.oak, nicheX, nicheY - nicheH / 2, nicheD / 2);
  mesh(B(nicheW, 0.03, nicheD), M.oak, nicheX, nicheY + nicheH / 2, nicheD / 2);
  mesh(B(0.03, nicheH, nicheD), M.oak, nicheX - nicheW / 2, nicheY, nicheD / 2);
  mesh(B(0.03, nicheH, nicheD), M.oak, nicheX + nicheW / 2, nicheY, nicheD / 2);
  mesh(B(nicheW - 0.04, 0.01, 0.01), M.led, nicheX, nicheY + nicheH / 2 - 0.02, 0.04, booth, false, false);

  // 2. Art Display: P5 (pic/04.jpeg Green Canvas, 0.90 × 0.90 m)
  place(
    makeFramedPicture(0.85, 0.85, M.p04, 'p04', { pos: [nicheX, nicheY, 2.1], target: [nicheX, nicheY, 0.06] }, 'P5 · Abstract Green (04.jpeg)'),
    nicheX, nicheY + 0.10, 0.06
  );
  addExhibitBadge('P5 · ภาพวาด 5 (04.jpeg Green)', new V3(nicheX, nicheY + 0.70, 0.16), 'art');

  // Classic Oil Painting (Burning Steel Foxy) mounted at x = +3.65
  const classicX = 3.65, classicY = FY + 1.82;
  place(
    makeFramedPicture(0.82, 1.15, M.classic1, 'classic1', { pos: [classicX, classicY, 2.1], target: [classicX, classicY, 0.05] }, 'Classic Oil · Burning Foxy'),
    classicX, classicY, 0.05
  );
  addExhibitBadge('ภาพสีน้ำมันคลาสสิก (Foxy Steel)', new V3(classicX, classicY + 0.78, 0.16), 'art');

  // 3. Sculpture S4 on Niche Plinth
  const ped4X = nicheX, ped4Z = 0.55, ped4H = 0.65;
  mesh(B(0.38, ped4H, 0.38, 0.01), M.travertine, ped4X, FY + ped4H / 2, ped4Z);
  place(nextSculpture(), ped4X, FY + ped4H, ped4Z, booth, 0.15);
  addExhibitBadge('S4 · ประติมากรรม Foxy (50 cm)', new V3(ped4X, FY + ped4H + SCULPT_H + 0.15, ped4Z));

  // 4. Seating Vignette: Scandinavian Oak Armchairs & Travertine Disc Table
  // Textured Neutral Rug (2.3 × 1.8 m)
  mesh(B(2.30, 0.005, 1.80, 0.04), M.fabric, cx, FY + 0.003, 1.75, booth, false, true);

  // Left Oak Armchair
  makeOakArmchair(cx - 0.60, 1.70, 0.35);
  // Right Oak Armchair
  makeOakArmchair(cx + 0.60, 1.70, -0.35);

  // Travertine Disc Coffee Table with Brass Tripod Legs
  const t4X = cx, t4Z = 1.70;
  mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 32), M.travertine, t4X, FY + 0.38, t4Z);
  mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 12), M.brass, t4X - 0.18, FY + 0.18, t4Z - 0.10);
  mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 12), M.brass, t4X + 0.18, FY + 0.18, t4Z - 0.10);
  mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 12), M.brass, t4X, FY + 0.18, t4Z + 0.20);
  place(makeBouquet(), t4X, FY + 0.40, t4Z);

  // Designer Arc Floor Lamp
  makeArcLamp(4.25, 0.45, new V3(3.40, FY + 2.05, 1.55));
}

// ---------------------------------------------------------------------------
// BLOCK 5 (x: +4.5 … +7.5, Center +6.0 - VIP Photo Lounge)
// Theme: Warm Walnut Wainscoting & Limewash Photo Studio Wall
// Art: P6 (pic/06.jpeg Sun & Lightning Master Graffiti, 1.80 × 0.90 m)
// Sculpture: S5 Selfie Foxy (50 cm on Travertine Pedestal beside Sofa)
// Seating: Iconic Curved Designer Sofa in Warm Bouclé with Velvet Cushions
// ---------------------------------------------------------------------------
function buildBlock5() {
  const cx = 6.0;

  // 1. Distinct Wall Display: Lower Walnut Wainscoting + Upper Warm Limewash
  // Upper Limewash Wall
  registerWall(mesh(B(3.0, H - 1.10, 0.02), M.limewash, cx, FY + 1.10 + (H - 1.10) / 2, 0.01), 'wall');
  // Lower Walnut Fluted Wainscoting (height 1.10 m)
  registerWall(mesh(B(3.0, 1.10, 0.04), M.walnut, cx, FY + 0.55, 0.02), 'wall');
  registerWall(mesh(B(3.02, 0.04, 0.08), M.walnut, cx, FY + 1.10 + 0.02, 0.04), 'trim'); // dado rail
  registerWall(mesh(B(3.02, 0.04, 0.08), M.walnut, cx, FY + H + 0.02, 0.04), 'trim');     // top cornice
  mesh(B(2.9, 0.01, 0.01), M.led, cx, FY + 1.12, 0.045, booth, false, false);

  // Photo Spot Badge on the wall
  const photoBadgeMat = new THREE.MeshStandardMaterial({
    map: logoTexture('MARKETING NAIIN', '📸 SIGNATURE PHOTO LOUNGE'),
    transparent: true,
    color: 0xffffff,
    emissive: 0xffd9a0,
    roughness: 0.5,
  });
  photoBadgeMat.emissiveMap = photoBadgeMat.map;
  photoBadgeMat.emissiveIntensity = 0.9;
  glowMats.push({ mat: photoBadgeMat, base: 0.9 });
  registerWall(mesh(new THREE.PlaneGeometry(1.60, 0.22), photoBadgeMat, cx, FY + H - 0.20, 0.045, booth, false, false), 'sign');

  // 2. Art Display: P6 (pic/06.jpeg Wide Graffiti Masterpiece, 1.80 × 0.90 m)
  const p6Y = FY + 2.05;
  place(
    makeFramedPicture(1.80, 0.90, M.p06, 'p06', { pos: [cx, p6Y, 2.3], target: [cx, p6Y, 0.05] }, 'P6 · Wide Sun Graffiti (06.jpeg)'),
    cx, p6Y, 0.05
  );
  addExhibitBadge('P6 · ผลงานกราฟฟิตี้ (06.jpeg Sun/Lightning)', new V3(cx, p6Y + 0.65, 0.16), 'art');

  // Classic Oil Painting (Flame Foxy) on the right
  place(
    makeFramedPicture(0.78, 1.10, M.classic2, 'classic2', { pos: [7.10, FY + 1.80, 2.0], target: [7.10, FY + 1.80, 0.05] }, 'Classic Oil · Flame Foxy'),
    7.10, FY + 1.80, 0.05
  );

  // 3. 📸 PHOTO SPOT: Iconic Curved Bouclé Designer Sofa
  const sofaX = 6.00, sofaZ = 1.15;
  makeCurvedSofa(sofaX, sofaZ, 0);

  // Companion Sculpture S5 (Selfie Foxy) placed right next to sofa left arm!
  const ped5X = 4.85, ped5Z = 1.05, ped5H = 0.76;
  mesh(B(0.44, ped5H, 0.44, 0.01), M.travertine, ped5X, FY + ped5H / 2, ped5Z);
  mesh(B(0.40, 0.025, 0.40), M.basalt, ped5X, FY + 0.012, ped5Z);
  place(nextSculpture(), ped5X, FY + ped5H, ped5Z, booth, 0.18);
  addExhibitBadge('S5 · ประติมากรรม Foxy (50 cm)', new V3(ped5X, FY + ped5H + SCULPT_H + 0.15, ped5Z));

  // Dedicated Photo Spot Badge
  addExhibitBadge('📸 มุมถ่ายรูป · Photo Spot (Sofa & Foxy)', new V3(5.50, FY + 1.55, 1.15), 'photo');

  // Studio Key Spotlight aimed directly at Foxy S5 & Sofa
  const spot5 = addAccent(new THREE.SpotLight(0xfff5e6, 8.5, 5.5, 0.40, 0.5, 2), 8.5);
  spot5.position.set(ped5X, FY + H - 0.15, ped5Z + 0.95);
  spot5.target.position.set(ped5X, FY + ped5H + 0.25, ped5Z);
  booth.add(spot5, spot5.target);

  const fill5 = addAccent(new THREE.PointLight(0xffebd2, 2.8, 2.8, 2), 2.8);
  fill5.position.set(ped5X, FY + ped5H + 0.35, ped5Z + 0.65);
  booth.add(fill5);

  // Flattering studio portrait spotlight directly lighting visitors on the sofa
  const portraitSpot = addAccent(new THREE.SpotLight(0xffeedd, 6.5, 5.5, 0.48, 0.5, 2), 6.5);
  portraitSpot.position.set(5.50, FY + H - 0.15, 2.25);
  portraitSpot.target.position.set(5.50, FY + 0.65, sofaZ);
  booth.add(portraitSpot, portraitSpot.target);

  // Designer Round Travertine & Brass Side Table next to sofa right arm
  const tab5X = 7.15, tab5Z = 1.15;
  mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.03, 24), M.travertine, tab5X, FY + 0.48, tab5Z);
  mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.46, 12), M.brass, tab5X, FY + 0.24, tab5Z);
  mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 24), M.travertine, tab5X, FY + 0.01, tab5Z);
  place(makeBowl(0.08, M.walnut), tab5X, FY + 0.50, tab5Z);

  // Sculpture S6 on right plinth
  const ped6X = 7.15, ped6Z = 0.55, ped6H = 0.90;
  mesh(B(0.38, ped6H, 0.38, 0.01), M.basalt, ped6X, FY + ped6H / 2, ped6Z);
  place(nextSculpture(), ped6X, FY + ped6H, ped6Z, booth, -0.25);
  addExhibitBadge('S6 · ประติมากรรม Foxy (50 cm)', new V3(ped6X, FY + ped6H + SCULPT_H + 0.15, ped6Z));

  // Corner Lush Olive Tree in Terracotta Pot
  place(makePlant({ potR: 0.22, potH: 0.46, potMat: M.terracotta, trunkH: 1.25, crown: [0.48, 0.42, 0.48], leaves: 240 }), 7.20, FY, 2.20);
}

// ---------------------------------------------------------------------------
// Furniture Builders for the 5 Lounge Vignettes
// ---------------------------------------------------------------------------
function makeArmchair(x, z, rotY = 0, seatMat = M.boucle) {
  const grp = new THREE.Group();
  grp.position.set(x, FY, z);
  grp.rotation.y = rotY;

  // 4 angled tapered walnut legs with brass tips
  const legGeo = new THREE.CylinderGeometry(0.016, 0.011, 0.16, 12);
  const ferruleGeo = new THREE.CylinderGeometry(0.018, 0.013, 0.035, 12);
  [[-0.26, -0.24], [0.26, -0.24], [-0.26, 0.24], [0.26, 0.24]].forEach(([lx, lz]) => {
    mesh(legGeo, M.walnut, lx, 0.08, lz, grp);
    mesh(ferruleGeo, M.brass, lx, 0.02, lz, grp);
  });

  // Seat Base Cushion
  mesh(B(0.68, 0.18, 0.66, 0.06), seatMat, 0, 0.25, 0.02, grp);
  // Curved Wraparound Backrest
  const back = mesh(B(0.68, 0.46, 0.16, 0.06), seatMat, 0, 0.48, -0.24, grp);
  back.rotation.x = -0.06;
  // Side Armrests
  mesh(B(0.12, 0.28, 0.58, 0.05), seatMat, -0.34, 0.38, 0.02, grp);
  mesh(B(0.12, 0.28, 0.58, 0.05), seatMat, 0.34, 0.38, 0.02, grp);
  // Accent Pillow
  const p = mesh(B(0.28, 0.28, 0.09, 0.03), M.pillow.rust, 0, 0.38, -0.16, grp);
  p.rotation.set(-0.1, rand(-0.15, 0.15), 0);

  booth.add(grp);
  return grp;
}

function makeOakArmchair(x, z, rotY = 0) {
  const grp = new THREE.Group();
  grp.position.set(x, FY, z);
  grp.rotation.y = rotY;

  // Scandinavian solid oak exposed frame
  mesh(B(0.04, 0.55, 0.68), M.oak, -0.32, 0.27, 0, grp);
  mesh(B(0.04, 0.55, 0.68), M.oak, 0.32, 0.27, 0, grp);
  mesh(B(0.64, 0.03, 0.05), M.oak, 0, 0.54, -0.32, grp); // top rail

  // Textured cushions
  mesh(B(0.58, 0.16, 0.60, 0.05), M.linen, 0, 0.22, 0.02, grp);
  const back = mesh(B(0.58, 0.42, 0.14, 0.05), M.linen, 0, 0.44, -0.22, grp);
  back.rotation.x = -0.10;

  const p = mesh(B(0.28, 0.28, 0.08, 0.03), M.pillow.olive, 0, 0.36, -0.15, grp);
  p.rotation.set(-0.12, 0.10, 0);

  booth.add(grp);
  return grp;
}

function makeLoungeSofa(x, z, rotY = 0, w = 1.90, seatMat = M.linen) {
  const grp = new THREE.Group();
  grp.position.set(x, FY, z);
  grp.rotation.y = rotY;

  // Walnut legs
  const legGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.14, 12);
  const ferruleGeo = new THREE.CylinderGeometry(0.020, 0.014, 0.035, 12);
  const hw = w / 2 - 0.12;
  [[-hw, -0.26], [hw, -0.26], [-hw, 0.26], [hw, 0.26]].forEach(([lx, lz]) => {
    mesh(legGeo, M.walnut, lx, 0.07, lz, grp);
    mesh(ferruleGeo, M.brass, lx, 0.02, lz, grp);
  });

  // Solid Walnut Base Platform
  mesh(B(w, 0.05, 0.74, 0.02), M.walnut, 0, 0.165, 0, grp);
  // Main Seat Cushion
  mesh(B(w - 0.04, 0.24, 0.70, 0.06), seatMat, 0, 0.31, 0.01, grp);
  // Backrest Cushion
  const back = mesh(B(w - 0.04, 0.42, 0.20, 0.06), seatMat, 0, 0.56, -0.24, grp);
  back.rotation.x = -0.06;
  // Armrests
  mesh(B(0.14, 0.26, 0.68, 0.05), seatMat, -w / 2 + 0.07, 0.41, 0.01, grp);
  mesh(B(0.14, 0.26, 0.68, 0.05), seatMat, w / 2 - 0.07, 0.41, 0.01, grp);

  // Cushions
  const p1 = mesh(B(0.34, 0.34, 0.11, 0.04), M.pillow.rust, -w * 0.28, 0.46, -0.14, grp);
  p1.rotation.set(-0.15, 0.25, 0.10);
  const p2 = mesh(B(0.32, 0.32, 0.11, 0.04), M.pillow.olive, w * 0.28, 0.46, -0.14, grp);
  p2.rotation.set(-0.15, -0.22, -0.08);

  booth.add(grp);
  return grp;
}

function makeCurvedSofa(x, z, rotY = 0) {
  const grp = new THREE.Group();
  grp.position.set(x, FY, z);
  grp.rotation.y = rotY;

  const w = 2.15;
  const legGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.14, 12);
  const ferruleGeo = new THREE.CylinderGeometry(0.020, 0.014, 0.035, 12);
  [[-0.95, -0.26], [0.95, -0.26], [-0.95, 0.26], [0.95, 0.26]].forEach(([lx, lz]) => {
    mesh(legGeo, M.walnut, lx, 0.07, lz, grp);
    mesh(ferruleGeo, M.brass, lx, 0.02, lz, grp);
  });

  // Base platform
  mesh(B(w, 0.05, 0.74, 0.02), M.walnut, 0, 0.165, 0, grp);
  // Seat cushion (Warm Bouclé)
  mesh(B(w - 0.04, 0.25, 0.70, 0.07), M.boucle, 0, 0.315, 0.01, grp);
  // Curved Backrest cushion
  const back = mesh(B(w - 0.04, 0.44, 0.22, 0.07), M.boucle, 0, 0.58, -0.24, grp);
  back.rotation.x = -0.06;
  // Armrests
  mesh(B(0.14, 0.28, 0.68, 0.06), M.boucle, -w / 2 + 0.07, 0.42, 0.01, grp);
  mesh(B(0.14, 0.28, 0.68, 0.06), M.boucle, w / 2 - 0.07, 0.42, 0.01, grp);

  // Accent cushions
  const p1 = mesh(B(0.34, 0.34, 0.11, 0.04), M.pillow.rust, -0.55, 0.48, -0.13, grp);
  p1.rotation.set(-0.15, 0.25, 0.10);
  const p2 = mesh(B(0.32, 0.32, 0.11, 0.04), M.pillow.olive, 0.55, 0.48, -0.13, grp);
  p2.rotation.set(-0.15, -0.22, -0.08);

  booth.add(grp);
  return grp;
}

function makeLeatherDaybed(x, z, rotY = 0) {
  const grp = new THREE.Group();
  grp.position.set(x, FY, z);
  grp.rotation.y = rotY;

  const w = 1.90, d = 0.78;
  // Tapered walnut legs
  [[-0.82, -0.30], [0.82, -0.30], [-0.82, 0.30], [0.82, 0.30]].forEach(([lx, lz]) => {
    mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.16, 12), M.walnut, lx, 0.08, lz, grp);
    mesh(new THREE.CylinderGeometry(0.020, 0.014, 0.035, 12), M.brass, lx, 0.02, lz, grp);
  });

  // Walnut subframe
  mesh(B(w, 0.04, d, 0.015), M.walnut, 0, 0.18, 0, grp);
  // Tufted Saddle Leather mattress cushion
  mesh(B(w - 0.04, 0.18, d - 0.04, 0.05), M.leather, 0, 0.29, 0, grp);
  // Cylindrical Leather Bolster Pillows (Left & Right)
  const b1 = mesh(new THREE.CylinderGeometry(0.09, 0.09, d - 0.08, 24).rotateX(Math.PI / 2), M.leatherDark, -w / 2 + 0.18, 0.44, 0, grp);
  const b2 = mesh(new THREE.CylinderGeometry(0.09, 0.09, d - 0.08, 24).rotateX(Math.PI / 2), M.leatherDark, w / 2 - 0.18, 0.44, 0, grp);

  booth.add(grp);
  return grp;
}

function makeFloorLamp(x, z) {
  const grp = new THREE.Group();
  grp.position.set(x, FY, z);

  // Weighted Travertine Base
  mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 24), M.travertine, 0, 0.02, 0, grp);
  // Slender Brass Rod
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.45, 12), M.brass, 0, 0.76, 0, grp);
  // Fabric Cone Shade
  mesh(new THREE.ConeGeometry(0.18, 0.24, 24, 1, true), M.shade, 0, 1.45, 0, grp);
  mesh(new THREE.SphereGeometry(0.03, 12, 10), M.bulb, 0, 1.40, 0, grp, false, false);

  const l = addAccent(new THREE.PointLight(0xffdfb8, 1.5, 3.2, 2), 1.5);
  l.position.set(0, 1.35, 0);
  grp.add(l);

  booth.add(grp);
  return grp;
}

function makeArcLamp(x, z, end) {
  mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 40), M.marble, x, FY + 0.02, z);
  const start = new V3(x, FY + 0.04, z);
  const mid = new V3(x - 0.2, FY + 2.35, z + 0.35);
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
// Lighting & Environments
// ---------------------------------------------------------------------------
let hemi, sun, fill;
function buildLights() {
  hemi = new THREE.HemisphereLight(0xffd9b0, 0x3b2a1c, 0.55);
  scene.add(hemi);

  sun = new THREE.DirectionalLight(0xffb070, 2.5);
  sun.position.set(-8, 9, 11);
  sun.target.position.set(0, 1, 1.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const s = sun.shadow.camera;
  s.left = -11; s.right = 11; s.top = 8; s.bottom = -6; s.near = 1; s.far = 40;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);

  fill = new THREE.DirectionalLight(0xffe6c8, 0.55);
  fill.position.set(10, 6, 8);
  scene.add(fill);
}

const MODES = {
  golden: { exposure: 0.98, sunColor: 0xffb070, sun: 2.3, sunPos: [-8, 9, 11], hemiSky: 0xffd9b0, hemiGround: 0x3b2a1c, hemi: 0.52, fill: 0.42, accent: 0.75, glow: 0.65, env: 0.48, bg: 0x14100c },
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
// Dimension Lines & Zone Labels (5 Blocks × 3 m)
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

  // Overall Dimensions
  dimLine(new V3(-W / 2, 0.02, D + 0.45), new V3(W / 2, 0.02, D + 0.45), 'กว้าง 15.00 m (5 บล็อก × 3.00 m)', new V3(0, 0, 0.12));
  dimLine(new V3(-W / 2 - 0.35, FY, 0.05), new V3(-W / 2 - 0.35, FY + H, 0.05), 'สูง 3.00 m', new V3(0.12, 0, 0));
  dimLine(new V3(W / 2 + 0.4, 0.02, 0), new V3(W / 2 + 0.4, 0.02, D), `ลึก ${D.toFixed(2)} m`, new V3(0.12, 0, 0));

  // 5 Individual 3-meter Block Dimension Lines along the front
  const blockDefs = [
    { name: 'บล็อก 1 (3.00 m)', x0: -7.5, x1: -4.5 },
    { name: 'บล็อก 2 (3.00 m)', x0: -4.5, x1: -1.5 },
    { name: 'บล็อก 3 (3.00 m)', x0: -1.5, x1: 1.5 },
    { name: 'บล็อก 4 (3.00 m)', x0: 1.5, x1: 4.5 },
    { name: 'บล็อก 5 (3.00 m)', x0: 4.5, x1: 7.5 },
  ];
  blockDefs.forEach(({ name, x0, x1 }) => {
    dimLine(new V3(x0, FY + 2.85, D + 0.10), new V3(x1, FY + 2.85, D + 0.10), name, new V3(0, 0.08, 0));
  });

  // Zone Labels over each of the 5 blocks
  const zoneInfo = [
    ['1', 'บล็อก 1 · Earth & Brick Lounge', -6.0],
    ['2', 'บล็อก 2 · Oak Slat Lounge', -3.0],
    ['3', 'บล็อก 3 · Center Showcase Lounge', 0.0],
    ['4', 'บล็อก 4 · Japandi Timber Lounge', 3.0],
    ['5', 'บล็อก 5 · VIP Photo Lounge 📸', 6.0],
  ];
  zoneInfo.forEach(([k, name, x]) => {
    const div = document.createElement('div');
    div.className = 'zone-label';
    div.innerHTML = `<b>${k}</b>${name}`;
    const lab = new CSS2DObject(div);
    lab.position.set(x, FY + H + 0.45, 1.5);
    scene.add(lab);
    zoneLabels.push(lab);
  });
}

// ---------------------------------------------------------------------------
// Camera Views & Tween
// ---------------------------------------------------------------------------
const VIEWS = {
  overview: { pos: [10.5, 5.2, 12.0], target: [0, 1.3, 1.4] },
  front: { pos: [0, 1.6, 9.2], target: [0, 1.4, 1.5] },
  block1: { pos: [-6.0, 1.55, 4.0], target: [-6.0, 1.3, 1.2] },
  block2: { pos: [-3.0, 1.55, 4.0], target: [-3.0, 1.3, 1.2] },
  block3: { pos: [0.0, 1.55, 4.0], target: [0.0, 1.3, 1.2] },
  block4: { pos: [3.0, 1.55, 4.0], target: [3.0, 1.3, 1.2] },
  block5: { pos: [6.0, 1.55, 4.0], target: [6.0, 1.3, 1.2] },
  photospot: { pos: [5.6, 1.35, 2.5], target: [5.6, 1.05, 1.1] },
  walkthrough: { pos: [-6.2, 1.55, 2.4], target: [5.8, 1.4, 1.5] },
  sculptures: { pos: [0.0, 1.55, 2.8], target: [0.0, 1.35, 1.45] },
  top: { pos: [0, 17, 1.5], target: [0, 0, 1.5] },
};

let tween = null;
function flyTo(name) {
  const v = VIEWS[name];
  if (!v) return;
  tween = {
    t: 0, dur: 1.6,
    p0: camera.position.clone(), t0: controls.target.clone(),
    p1: new V3(...v.pos), t1: new V3(...v.target),
  };
}
function flyToCustom(pos, target, dur = 1.6) {
  tween = {
    t: 0, dur,
    p0: camera.position.clone(), t0: controls.target.clone(),
    p1: new V3(...pos), t1: new V3(...target),
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
    if (e.target.closest('#controlPanel') || e.target.closest('#btnTogglePanel') || e.target.closest('#panelBackdrop') || e.target.closest('#viewBar') || e.target.closest('#dropZone')) {
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
        return;
      }
    }

    // Interactive art click: zoom directly in front of the artwork
    const artHits = raycaster.intersectObjects(artMeshes, false);
    if (artHits.length > 0 && artHits[0].object.userData.viewPos) {
      const vp = artHits[0].object.userData.viewPos;
      flyToCustom(vp.pos, vp.target);
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

    object3D.position.set(-center.x, -box.min.y, -center.z);

    const wrapper = new THREE.Group();
    wrapper.userData.isCustom = true;
    wrapper.userData.originalHeight = origH;
    wrapper.userData.name = file.name;
    wrapper.add(object3D);

    setObjectHeight(wrapper, 0.5);
    wrapper.position.set(0, FY + 1.00, 1.45);

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
// UI Wiring
// ---------------------------------------------------------------------------
function wireUI() {
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
      if (lbl) lbl.textContent = '✕ ปิดแผง';
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

  let lastActionTime = 0;
  function handleToggleTrigger(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const now = Date.now();
    if (now - lastActionTime < 250) return;
    lastActionTime = now;
    const isOpen = controlPanel && controlPanel.classList.contains('open');
    if (isOpen) closePanel(); else openPanel();
  }

  function handleCloseTrigger(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const now = Date.now();
    if (now - lastActionTime < 250) return;
    lastActionTime = now;
    closePanel();
  }

  closePanel();

  if (btnTogglePanel) {
    btnTogglePanel.addEventListener('click', handleToggleTrigger);
    btnTogglePanel.addEventListener('touchend', handleToggleTrigger, { passive: false });
  }
  if (btnClosePanel) {
    btnClosePanel.addEventListener('click', handleCloseTrigger);
    btnClosePanel.addEventListener('touchend', handleCloseTrigger, { passive: false });
  }
  if (panelBackdrop) {
    panelBackdrop.addEventListener('click', handleCloseTrigger);
    panelBackdrop.addEventListener('touchend', handleCloseTrigger, { passive: false });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  document.querySelectorAll('#lightModes button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#lightModes button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      setMode(btn.dataset.mode);
    });
  });

  // Tour of All Artworks (Cycles through P1..P6 + classics)
  let paintingViewIdx = 0;
  const paintingTourViews = [
    { pos: [0, 1.8, 7.5], target: [0, 1.6, 0.2] },                               // Center Gallery View
    { pos: [-5.70, FY + 1.82, 2.1], target: [-5.70, FY + 1.82, 0.05] },         // P1 Gold Foxy (01.jpeg)
    { pos: [-3.70, FY + 1.82, 2.0], target: [-3.70, FY + 1.82, 0.06] },         // P2 Yellow/Blue (02.jpeg)
    { pos: [-2.30, FY + 1.82, 2.0], target: [-2.30, FY + 1.82, 0.06] },         // P3 Blue/Red (03.jpeg)
    { pos: [0.0, FY + 1.95, 2.2], target: [0.0, FY + 1.95, 0.06] },             // P4 Master Graffiti (05.jpeg)
    { pos: [2.35, FY + 1.80, 2.0], target: [2.35, FY + 1.80, 0.06] },           // P5 Abstract Green (04.jpeg)
    { pos: [6.00, FY + 2.05, 2.2], target: [6.00, FY + 2.05, 0.05] },           // P6 Sun Graffiti (06.jpeg)
  ];

  document.querySelectorAll('#viewBar button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#viewBar button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.view === 'paintings') {
        const pv = paintingTourViews[paintingViewIdx % paintingTourViews.length];
        paintingViewIdx++;
        flyToCustom(pv.pos, pv.target);
      } else {
        paintingViewIdx = 0;
        flyTo(btn.dataset.view);
      }
      if (window.innerWidth <= 900) {
        closePanel();
      }
    });
  });

  const toggleDims = document.getElementById('toggleDims');
  if (toggleDims) {
    dimGroup.visible = toggleDims.checked;
    dimLabels.forEach((l) => (l.visible = toggleDims.checked));
    toggleDims.addEventListener('change', (e) => {
      dimGroup.visible = e.target.checked;
      dimLabels.forEach((l) => (l.visible = e.target.checked));
    });
  }

  const toggleZones = document.getElementById('toggleZones');
  if (toggleZones) {
    toggleZones.checked = false;
    zoneLabels.forEach((l) => (l.visible = false));
    toggleZones.addEventListener('change', (e) => {
      zoneLabels.forEach((l) => (l.visible = e.target.checked));
    });
  }

  const toggleExhibits = document.getElementById('toggleExhibits');
  if (toggleExhibits) {
    toggleExhibits.checked = false;
    exhibitGroup.visible = false;
    exhibitLabels.forEach((l) => (l.visible = false));
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
    a.download = `booth-warm-wood-open-5blocks-${Date.now()}.png`;
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

  const scaleSlider = document.getElementById('scaleSlider');
  if (scaleSlider) {
    scaleSlider.addEventListener('input', (e) => {
      if (selectedCustomObj) {
        setObjectHeight(selectedCustomObj, parseFloat(e.target.value) / 100);
      }
    });
  }

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
        selectedCustomObj.position.set(0, FY + 1.00, 1.45);
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
// Initialization
// ---------------------------------------------------------------------------
async function init() {
  const loaderSub = document.querySelector('.loader-sub');
  if (loaderSub) loaderSub.textContent = 'กำลังโหลดโมเดลและรูปภาพศิลปะ Foxy ทั้งหมด...';

  try {
    const [
      loadedP01, loadedP02, loadedP03, loadedP04, loadedP05, loadedP06,
      loadedC1, loadedC2, loadedC3, loadedC4
    ] = await Promise.all([
      loadArtTexture(ART_SOURCES.p01),
      loadArtTexture(ART_SOURCES.p02),
      loadArtTexture(ART_SOURCES.p03),
      loadArtTexture(ART_SOURCES.p04),
      loadArtTexture(ART_SOURCES.p05),
      loadArtTexture(ART_SOURCES.p06),
      loadArtTexture(ART_SOURCES.classic1),
      loadArtTexture(ART_SOURCES.classic2),
      loadArtTexture(ART_SOURCES.classic3),
      loadArtTexture(ART_SOURCES.classic4),
      document.fonts.load('600 64px "Cormorant Garamond"'),
      document.fonts.load('400 32px "Outfit"'),
      loadFoxyModel((pct) => {
        if (loaderSub) loaderSub.textContent = `กำลังโหลดโมเดลประติมากรรม Foxy ${pct}%...`;
      }),
    ]);

    if (loadedP01) TEX.p01 = loadedP01;
    if (loadedP02) TEX.p02 = loadedP02;
    if (loadedP03) TEX.p03 = loadedP03;
    if (loadedP04) TEX.p04 = loadedP04;
    if (loadedP05) TEX.p05 = loadedP05;
    if (loadedP06) TEX.p06 = loadedP06;
    if (loadedC1) TEX.classic1 = loadedC1;
    if (loadedC2) TEX.classic2 = loadedC2;
    if (loadedC3) TEX.classic3 = loadedC3;
    if (loadedC4) TEX.classic4 = loadedC4;
  } catch (e) {
    console.warn('Artwork texture loading notice:', e);
  }

  if (loaderSub) loaderSub.textContent = 'กำลังจัดเตรียม 5 บล็อกและมุมนั่งเล่นแบบเปิดโล่ง...';

  const safetyTimer = setTimeout(() => {
    const ldr = document.getElementById('loader');
    if (ldr && !ldr.classList.contains('done')) ldr.classList.add('done');
  }, 3500);

  try {
    buildTextures();
    buildMaterials();
    buildHallAndPlatform();
    buildOpenCeilingAndPortals();

    // 5 Blocks × 3 m with Dedicated Wall Displays & Seating Lounges
    buildBlock1();
    buildBlock2();
    buildBlock3();
    buildBlock4();
    buildBlock5();

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
  } catch (err) {
    console.error('Initialization error:', err);
  } finally {
    clearTimeout(safetyTimer);
    requestAnimationFrame(() => {
      const ldr = document.getElementById('loader');
      if (ldr) ldr.classList.add('done');
    });
  }
}

init();
