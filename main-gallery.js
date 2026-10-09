/**
 * Warm Wood Living Room — 3D Exhibition Booth & Pavilion (15 × 3 m)
 * VERSION: 1 Door Entrance · 6 Sculptures in a Row · Double-Sided Front Art Wall
 * 
 * Layout based directly on architectural floor plan:
 * - 1 Entrance Portal on Front-Left (X = -6.3 to -3.3, width 3.0m)
 * - 6 Sculptures on Travertine Pedestals lined up in a row at Z = -0.82:
 *   S1 (X = -3.80), S2 (X = -1.85), S3 (X = +0.20), S4 (X = +2.25), S5 (X = +4.27), S6 (X = +6.31)
 * - Solid Front Exhibition Wall (X = -3.3 to +7.5, width 10.8m) displaying:
 *   - 5 Artworks OUTSIDE (facing corridor/visitors): X = -1.85, +0.20, +2.25, +4.27, +6.31
 *   - 5 Artworks INSIDE (facing the 6 sculptures): X = -1.85, +0.20, +2.25, +4.27, +6.31
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

window.addEventListener('error', e => console.error('GLOBAL ERROR:', e.message, 'at', e.filename, 'line', e.lineno));
window.addEventListener('unhandledrejection', e => console.error('UNHANDLED REJECTION:', e.reason));
console.log('*** MAIN-GALLERY.JS LOADED ***');

// ---------------------------------------------------------------------------
// Booth Dimensions (metres)
// ---------------------------------------------------------------------------
const W = 15.0;       // Total width: 15 m
const H = 3.0;        // Structure height: 3 m
const D = 3.0;        // Depth: 3 m
const FY = 0.1;       // Platform top height: 0.1 m
const SCULPT_H = 0.5; // Sculpture height: 50 cm

// Floor Plan Coordinates (Calculated directly from diagram)
const DOOR_CENTER_X = -4.80; // Door portal center
const DOOR_WIDTH = 3.0;     // Door portal width (-6.3 to -3.3)

// 6 Pedestal Centers in a row (Z = -0.82)
// 6 Sculptures in a row inside Room 2 (10m Grand Pavilion) like Version 1
const SCULPTURE_POSITIONS = [
  { id: 's1', name: 'S1 · Golden Amber Foxy',   x: -1.25, z: -0.82, rotY: 0, pedestalH: 0.65, type: 'plinth', finish: 'bronze' },
  { id: 's2', name: 'S2 · Carrara Marble Foxy',  x:  0.25, z: -0.82, rotY: 0, pedestalH: 0.65, type: 'plinth', finish: 'marble' },
  { id: 's3', name: 'S3 · Royal Obsidian Foxy',  x:  1.75, z: -0.82, rotY: 0, pedestalH: 0.65, type: 'plinth', finish: 'obsidian' },
  { id: 's4', name: 'S4 · Ochre Amber Foxy',     x:  3.25, z: -0.82, rotY: 0, pedestalH: 0.65, type: 'plinth', finish: 'terracotta' },
  { id: 's5', name: 'S5 · Patina Bronze Foxy',   x:  4.75, z: -0.82, rotY: 0, pedestalH: 0.65, type: 'plinth', finish: 'verdite' },
  { id: 's6', name: 'S6 · Platinum Chrome Foxy', x:  6.25, z: -0.82, rotY: 0, pedestalH: 0.65, type: 'plinth', finish: 'platinum' },
];

// 20 Curated Mini Artworks (25 × 25 cm) surrounding Room 1 (ทางเข้า 5m)
const MINI_ART_SPOTS = [
  // Wall 1: West Wall (X = -7.42, หันหน้าไปทางทิศตะวันออก เข้ากลางห้อง) — 6 ภาพ (2 แถว × 3)
  { id: 1,  x: -7.42, y: FY + 1.80, z: -0.80, rotY: Math.PI / 2,  title: 'Mini 01 · Golden Dawn' },
  { id: 2,  x: -7.42, y: FY + 1.80, z:  0.00, rotY: Math.PI / 2,  title: 'Mini 02 · Azure Flow' },
  { id: 3,  x: -7.42, y: FY + 1.80, z: +0.80, rotY: Math.PI / 2,  title: 'Mini 03 · Terracotta Ochre' },
  { id: 4,  x: -7.42, y: FY + 1.35, z: -0.80, rotY: Math.PI / 2,  title: 'Mini 04 · Obsidian Wave' },
  { id: 5,  x: -7.42, y: FY + 1.35, z:  0.00, rotY: Math.PI / 2,  title: 'Mini 05 · Emerald Patina' },
  { id: 6,  x: -7.42, y: FY + 1.35, z: +0.80, rotY: Math.PI / 2,  title: 'Mini 06 · Cobalt Crest' },

  // Wall 2: North Back Wall (Z = -1.42, หันหน้าไปทางด้านหน้าบูธ) — 8 ภาพ (2 แถว × 4)
  { id: 7,  x: -6.20, y: FY + 1.85, z: -1.42, rotY: 0, title: 'Mini 07 · Sunset Ember' },
  { id: 8,  x: -5.20, y: FY + 1.85, z: -1.42, rotY: 0, title: 'Mini 08 · Platinum Arch' },
  { id: 9,  x: -4.20, y: FY + 1.85, z: -1.42, rotY: 0, title: 'Mini 09 · Foxy Horizon' },
  { id: 10, x: -3.20, y: FY + 1.85, z: -1.42, rotY: 0, title: 'Mini 10 · Golden Grain' },
  { id: 11, x: -6.20, y: FY + 1.40, z: -1.42, rotY: 0, title: 'Mini 11 · Bronze Symphony I' },
  { id: 12, x: -5.20, y: FY + 1.40, z: -1.42, rotY: 0, title: 'Mini 12 · Bronze Symphony II' },
  { id: 13, x: -4.20, y: FY + 1.40, z: -1.42, rotY: 0, title: 'Mini 13 · Bronze Symphony III' },
  { id: 14, x: -3.20, y: FY + 1.40, z: -1.42, rotY: 0, title: 'Mini 14 · Verdant Echo' },

  // Wall 3: Partition Wall West Face (X = -2.58, หันหน้าเข้าหาห้อง 1) — 4 ภาพ (2 แถว × 2)
  { id: 15, x: -2.58, y: FY + 1.80, z: -0.85, rotY: -Math.PI / 2, title: 'Mini 15 · Amber Spark' },
  { id: 16, x: -2.58, y: FY + 1.80, z: -0.25, rotY: -Math.PI / 2, title: 'Mini 16 · Royal Indigo' },
  { id: 17, x: -2.58, y: FY + 1.35, z: -0.85, rotY: -Math.PI / 2, title: 'Mini 17 · Crimson Bloom' },
  { id: 18, x: -2.58, y: FY + 1.35, z: -0.25, rotY: -Math.PI / 2, title: 'Mini 18 · Calacatta Muse' },

  // Wall 4: Front Return Walls inside Room 1 (Z = +1.42, หันหน้าเข้าห้อง) — 2 ภาพ
  { id: 19, x: -6.85, y: FY + 1.60, z: +1.42, rotY: Math.PI, title: 'Mini 19 · Solar Whisper' },
  { id: 20, x: -2.90, y: FY + 1.60, z: +1.42, rotY: Math.PI, title: 'Mini 20 · Apex Twilight' },
];

// 5 Outside Paintings on Exterior Facade (Cleanly distributed across 10.8m solid front wall)
const ART_OUT_X = [-1.90, 0.20, 2.30, 4.40, 6.30];

// 5 Inside Paintings on Interior Front Wall in Room 2 (10m uninterrupted wall)
// Centered harmoniously opposite the 6 sculptures in a row
const ART_IN_X = [-1.25, 0.60, 2.50, 4.40, 6.25];

const ART_SOURCES = {
  out1: { src: 'pic/01.jpeg', title: 'P1 · Gold Foxy Master', w: 1.05, h: 1.35 },
  out2: { src: 'pic/02.jpeg', title: 'P2 · Abstract Gold & Blue', w: 1.15, h: 1.15 },
  out3: { src: 'pic/03.jpeg', title: 'P3 · Abstract Cobalt & Rust', w: 1.15, h: 1.15 },
  out4: { src: 'pic/04.jpeg', title: 'P4 · Emerald Forest Foxy', w: 1.15, h: 1.15 },
  out5: { src: 'pic/05.jpeg', title: 'P5 · Master Graffiti Canvas', w: 1.65, h: 0.85 },

  in1:  { src: 'pic/06.jpeg', title: 'P6 · Sun & Lightning Graffiti', w: 1.65, h: 0.85 },
  in2:  { src: '834201435_1106636995178112_873089852634520844_n.jpeg', title: 'C1 · Forest & Foxy Classical Oil', w: 1.20, h: 1.20 },
  in3:  { src: '830834694_1786672265795135_3184531431469431023_n.jpeg', title: 'C2 · Royal Portrait Oil', w: 1.15, h: 1.25 },
  in4:  { src: '830513828_1410008468011031_6845268736765103662_n.jpeg', title: 'C3 · Dark Flame Foxy Oil', w: 1.20, h: 1.20 },
  in5:  { src: '830236695_1092868896720615_696399951761031174_n.jpeg', title: 'C4 · Sunset Horizon Oil', w: 1.25, h: 1.15 },
};

const V2 = THREE.Vector2;
const V3 = THREE.Vector3;
const artMeshes = [];

// ---------------------------------------------------------------------------
// Renderer, Scene, Camera
// ---------------------------------------------------------------------------
const container = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14100c);
scene.fog = new THREE.Fog(0x14100c, 36, 85);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.15, 120);
camera.position.set(9.8, 5.0, 11.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.3, 0);
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
const bloom = new UnrealBloomPass(
  new V2(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2)),
  0.10,
  0.22,
  0.94
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const booth = new THREE.Group();
scene.add(booth);

// ---------------------------------------------------------------------------
// Materials & Procedural Textures
// ---------------------------------------------------------------------------
function makeWoodTexture(base = '#5c3a21', line = '#382012') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 400; i++) {
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.05 + Math.random() * 0.12;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    const y = Math.random() * 512;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + (Math.random() - 0.5) * 20, 340, y + (Math.random() - 0.5) * 20, 512, y);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makePlasterTexture(base = '#ece5d8', noise = '#d8cfbe') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = noise;
    ctx.globalAlpha = 0.04 + Math.random() * 0.06;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makeTravertineTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#dfd5c3';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 180; i++) {
    ctx.strokeStyle = '#c2b399';
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 3 + Math.random() * 6;
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y + (Math.random() - 0.5) * 10);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const woodTex = makeWoodTexture('#5a3a22', '#352012');
woodTex.repeat.set(2, 6);
const plasterTex = makePlasterTexture('#e8dfce', '#cfc4af');
plasterTex.repeat.set(4, 4);
const travertineTex = makeTravertineTexture();
travertineTex.repeat.set(1.5, 1.5);

const std = (c, r = 0.5, m = 0, opt = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...opt });

const M = {
  walnut: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.42, metalness: 0.05 }),
  oak: new THREE.MeshStandardMaterial({ map: makeWoodTexture('#9c7a52', '#6b5032'), roughness: 0.55 }),
  travertine: new THREE.MeshStandardMaterial({ map: travertineTex, roughness: 0.35, metalness: 0.02 }),
  limewash: new THREE.MeshStandardMaterial({ map: plasterTex, roughness: 0.88, metalness: 0.0 }),
  brass: std(0xd4af37, 0.28, 0.90),
  brassSatin: std(0xcda658, 0.38, 0.82),
  blackMetal: std(0x1a1816, 0.45, 0.6),
  led: new THREE.MeshBasicMaterial({ color: 0xffe2b8 }),
  bulb: new THREE.MeshBasicMaterial({ color: 0xfffaed }),
  hall: std(0x0e0b09, 0.95),
  floor: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.38 }),
  // Sculptures special materials
  sculptBronze: std(0xd49b4d, 0.22, 0.85),
  sculptMarble: std(0xf7f5f0, 0.15, 0.05),
  sculptObsidian: std(0x1b1b1f, 0.10, 0.65),
  sculptTerracotta: std(0xc46841, 0.58, 0.05),
  sculptVerdite: std(0x3e7a68, 0.28, 0.70),
  sculptPlatinum: std(0xe0e4e8, 0.10, 0.96),
  // Furniture materials from 5m
  linen: std(0xefeae2, 0.88, 0.0),
  leather: std(0x8a4b24, 0.55, 0.05),
  marble: std(0xfaf8f2, 0.22, 0.05),
  olive: std(0x525c48, 0.85, 0.0),
  rust: std(0xa45228, 0.85, 0.0),
  basalt: std(0x1e1e20, 0.65, 0.1),
  ceramic: std(0xfaf8f5, 0.15, 0.0),
  candle: std(0xf4ede2, 0.3),
  flame: new THREE.MeshBasicMaterial({ color: 0xffaa33 }),
  soil: std(0x2a1e16, 0.95),
  bark: std(0x3e281b, 0.85),
  leaf: std(0x3d5a38, 0.72),
};

const B = (w, h, d) => new RoundedBoxGeometry(w, h, d, 2, 0.008);
const mesh = (geom, mat, x = 0, y = 0, z = 0, parent = booth, shadow = false, receive = true) => {
  const m = new THREE.Mesh(geom, mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
};

const rand = (min, max) => min + Math.random() * (max - min);
function lathe(points, mat, seg = 48) {
  return new THREE.Mesh(new THREE.LatheGeometry(points.map(([x, y]) => new V2(x, y)), seg), mat);
}
const place = (obj, x, y, z, parent = booth, ry = 0) => {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  parent.add(obj);
  return obj;
};

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
  const leaves = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), M.leaf, 70);
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std(0xf6f1e6, 0.8), 24);
  const d = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < 70; i++) {
    const a = rand(0, Math.PI * 2), r = rand(0.02, 0.22), y = 0.3 + rand(0, 0.30) - r * 0.3;
    d.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    d.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    const s = rand(0.03, 0.05); d.scale.set(s, s * 0.18, s * 0.45); d.updateMatrix();
    leaves.setMatrixAt(i, d.matrix);
    c.setHSL(rand(0.22, 0.28), rand(0.25, 0.4), rand(0.25, 0.38)); leaves.setColorAt(i, c);
  }
  for (let i = 0; i < 24; i++) {
    const a = rand(0, Math.PI * 2), r = rand(0.03, 0.18);
    d.position.set(Math.cos(a) * r, 0.40 + rand(0, 0.20), Math.sin(a) * r);
    d.rotation.set(0, 0, 0); d.scale.setScalar(rand(0.016, 0.026)); d.updateMatrix();
    flowers.setMatrixAt(i, d.matrix);
  }
  leaves.castShadow = flowers.castShadow = true;
  g.add(leaves, flowers);
  return g;
}

function makeFruitBowl() {
  const g = new THREE.Group();
  const bowl = lathe([[0, 0], [0.08, 0], [0.15, 0.06], [0.18, 0.10]], M.ceramic, 32);
  bowl.castShadow = true;
  g.add(bowl);
  const lemonMat = std(0xe8c24a, 0.55);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const l = mesh(new THREE.SphereGeometry(0.035, 16, 12), lemonMat, Math.cos(a) * 0.07, 0.08 + (i % 2) * 0.02, Math.sin(a) * 0.07, g);
    l.scale.set(1, 0.85, 1.25);
  }
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
  const bowl = lathe([[0, 0], [r * 0.5, 0], [r * 0.85, r * 0.25], [r, r * 0.45]], mat, 32);
  bowl.material = mat.clone(); bowl.material.side = THREE.DoubleSide;
  bowl.castShadow = true; g.add(bowl);
  return g;
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

function makeMuseumBench(x, z) {
  const grp = new THREE.Group();
  grp.position.set(x, FY, z);
  const w = 1.70, d = 0.60;
  [[-w / 2 + 0.12, -d / 2 + 0.10], [w / 2 - 0.12, -d / 2 + 0.10], [-w / 2 + 0.12, d / 2 - 0.10], [w / 2 - 0.12, d / 2 - 0.10]].forEach(([lx, lz]) => {
    mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.24, 12), M.walnut, lx, 0.12, lz, grp);
    mesh(new THREE.CylinderGeometry(0.020, 0.014, 0.035, 12), M.brass, lx, 0.02, lz, grp);
  });
  mesh(B(w, 0.04, d, 0.01), M.walnut, 0, 0.26, 0, grp);
  mesh(B(w - 0.04, 0.15, d - 0.04, 0.04), M.leather, 0, 0.355, 0, grp);
  booth.add(grp);
  return grp;
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

function makeSofa(x, z, rotY = 0) {
  const grp = new THREE.Group();
  grp.position.set(x, FY, z);
  grp.rotation.y = rotY;
  const legGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.14, 12);
  const ferruleGeo = new THREE.CylinderGeometry(0.020, 0.014, 0.035, 12);
  [[-0.72, -0.26], [0.72, -0.26], [-0.72, 0.26], [0.72, 0.26]].forEach(([lx, lz]) => {
    mesh(legGeo, M.walnut, lx, 0.07, lz, grp);
    mesh(ferruleGeo, M.brass, lx, 0.02, lz, grp);
  });
  mesh(B(1.68, 0.05, 0.74, 0.02), M.walnut, 0, 0.165, 0, grp);
  mesh(B(1.64, 0.25, 0.70, 0.07), M.linen, 0, 0.315, 0.01, grp);
  const back = mesh(B(1.64, 0.44, 0.22, 0.07), M.linen, 0, 0.58, -0.24, grp);
  back.rotation.x = -0.06;
  mesh(B(0.14, 0.28, 0.68, 0.06), M.linen, -0.82, 0.42, 0.01, grp);
  mesh(B(0.14, 0.28, 0.68, 0.06), M.linen, 0.82, 0.42, 0.01, grp);
  const p1 = mesh(B(0.34, 0.34, 0.11, 0.04), M.rust, -0.50, 0.48, -0.13, grp);
  p1.rotation.set(-0.15, 0.25, 0.10);
  const p2 = mesh(B(0.32, 0.32, 0.11, 0.04), M.olive, 0.50, 0.48, -0.13, grp);
  p2.rotation.set(-0.15, -0.22, -0.08);
  booth.add(grp);
  return grp;
}

// ---------------------------------------------------------------------------
// X-Ray / See-Through Wall Registry
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
    type: type,
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
      if (type === 'slat' || type === 'sign') {
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
// Lighting Setup & Modes
// ---------------------------------------------------------------------------
const lights = {};
const accents = [];

function setupLighting() {
  lights.ambient = new THREE.AmbientLight(0xffeedd, 0.42);
  scene.add(lights.ambient);

  lights.hemi = new THREE.HemisphereLight(0xfff5e6, 0x1f1812, 0.65);
  scene.add(lights.hemi);

  lights.sun = new THREE.DirectionalLight(0xffdfb3, 1.45);
  lights.sun.position.set(12, 14, 16);
  lights.sun.castShadow = true;
  lights.sun.shadow.mapSize.set(2048, 2048);
  lights.sun.shadow.camera.near = 1;
  lights.sun.shadow.camera.far = 45;
  lights.sun.shadow.camera.left = -11;
  lights.sun.shadow.camera.right = 11;
  lights.sun.shadow.camera.top = 9;
  lights.sun.shadow.camera.bottom = -9;
  lights.sun.shadow.bias = -0.0004;
  scene.add(lights.sun);

  lights.frontFill = new THREE.DirectionalLight(0xffefe0, 0.55);
  lights.frontFill.position.set(0, 6, 12);
  scene.add(lights.frontFill);

  // Gallery Cove Overhead Light
  const cove = new THREE.RectAreaLight(0xffe2b8, 2.5, W - 1, 0.15);
  cove.position.set(0, FY + H - 0.05, -D / 2 + 0.3);
  cove.rotation.x = Math.PI / 2;
  booth.add(cove);
  lights.cove = cove;
}

function addAccent(light, baseIntensity = 1.0) {
  accents.push({ light, baseIntensity });
  return light;
}

function setLightMode(mode) {
  document.querySelectorAll('#lightModes button').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`mode-${mode}`);
  if (btn) btn.classList.add('active');

  if (mode === 'golden') {
    scene.background.set(0x14100c);
    scene.fog.color.set(0x14100c);
    lights.ambient.color.set(0xffeedd); lights.ambient.intensity = 0.42;
    lights.hemi.color.set(0xfff5e6); lights.hemi.groundColor.set(0x1f1812); lights.hemi.intensity = 0.65;
    lights.sun.color.set(0xffdfb3); lights.sun.intensity = 1.45;
    lights.frontFill.color.set(0xffefe0); lights.frontFill.intensity = 0.55;
    renderer.toneMappingExposure = 1.0;
    accents.forEach(a => a.light.intensity = a.baseIntensity);
  } else if (mode === 'day') {
    scene.background.set(0x1a1a20);
    scene.fog.color.set(0x1a1a20);
    lights.ambient.color.set(0xffffff); lights.ambient.intensity = 0.60;
    lights.hemi.color.set(0xffffff); lights.hemi.groundColor.set(0x2a2a30); lights.hemi.intensity = 0.85;
    lights.sun.color.set(0xfffaf0); lights.sun.intensity = 1.65;
    lights.frontFill.color.set(0xffffff); lights.frontFill.intensity = 0.70;
    renderer.toneMappingExposure = 1.05;
    accents.forEach(a => a.light.intensity = a.baseIntensity * 0.75);
  } else if (mode === 'night') {
    scene.background.set(0x070608);
    scene.fog.color.set(0x070608);
    lights.ambient.color.set(0xd8c8b0); lights.ambient.intensity = 0.16;
    lights.hemi.color.set(0xc8b090); lights.hemi.groundColor.set(0x0c0806); lights.hemi.intensity = 0.25;
    lights.sun.color.set(0xff9944); lights.sun.intensity = 0.35;
    lights.frontFill.color.set(0xffaa55); lights.frontFill.intensity = 0.22;
    renderer.toneMappingExposure = 0.92;
    accents.forEach(a => a.light.intensity = a.baseIntensity * 1.55);
  }
  renderer.shadowMap.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// 3D Architecture (Floor, Walls, Portal, Ceiling)
// ---------------------------------------------------------------------------
function buildArchitecture() {
  // 1. Hall base circle and platform
  const hall = mesh(new THREE.CircleGeometry(48, 64).rotateX(-Math.PI / 2), M.hall, 0, 0, 2, scene, false, true);
  hall.position.y = 0;

  // Platform (15m x 3m, FY = 0.1m)
  const plat = mesh(B(W, FY, D), M.floor, 0, FY / 2, 0);
  plat.castShadow = false;

  // Walnut perimeter border
  mesh(B(W + 0.04, FY, 0.03), M.walnut, 0, FY / 2, D / 2 + 0.015);
  mesh(B(W + 0.04, FY, 0.03), M.walnut, 0, FY / 2, -D / 2 - 0.015);
  mesh(B(0.03, FY, D), M.walnut, -W / 2 - 0.015, FY / 2, 0);
  mesh(B(0.03, FY, D), M.walnut, W / 2 + 0.015, FY / 2, 0);

  // Warm LED toe-kick glow along front edge
  mesh(B(W, 0.014, 0.014), M.led, 0, 0.02, D / 2 + 0.035, booth, false, false);

  // Core architectural heights to prevent any coplanar surface Z-fighting:
  // Limewash wall core stops 8cm below the top, while the walnut trim cap securely covers the top face
  const wallCoreH = H - 0.08; // 2.92m core height
  const baseboardH = 0.12;
  const baseboardY = FY + baseboardH / 2; // FY + 0.06
  const trimCapH = 0.14;
  const trimCapY = FY + H - trimCapH / 2; // FY + H - 0.07 (Top is at FY + H = 3.10m, wall core stops at 3.02m)

  // 2. Back Wall (Z = -1.5)
  const backWall = registerWall(mesh(B(W, wallCoreH, 0.12), M.limewash, 0, FY + wallCoreH / 2, -D / 2 - 0.06), 'wall');
  // Back wall baseboard & top cap trim
  registerWall(mesh(B(W + 0.02, baseboardH, 0.14), M.walnut, 0, baseboardY, -D / 2 - 0.06), 'trim');
  registerWall(mesh(B(W + 0.02, trimCapH, 0.14), M.walnut, 0, trimCapY, -D / 2 - 0.06), 'trim');

  // Decorative walnut vertical slats on back wall (Room 2)
  for (let x = -2.20; x <= W / 2 - 0.4; x += 0.35) {
    const slat = mesh(B(0.045, H - 0.3, 0.025), M.oak, x, FY + H / 2, -D / 2 + 0.015, booth, false, true);
    registerWall(slat, 'slat');
  }

  // Backlit Gallery Signage on Back Wall (Centered in Room 2 at X = +2.50, width 4.8m)
  const signBacking = mesh(B(4.80, 0.45, 0.03), M.walnut, 2.50, FY + 2.45, -D / 2 + 0.03);
  registerWall(signBacking, 'sign');
  mesh(B(4.84, 0.47, 0.01), M.brassSatin, 2.50, FY + 2.45, -D / 2 + 0.015);
  // Canvas text for sign
  const sc = document.createElement('canvas');
  sc.width = 1024; sc.height = 128;
  const sctx = sc.getContext('2d');
  sctx.fillStyle = '#1c140d';
  sctx.fillRect(0, 0, 1024, 128);
  sctx.fillStyle = '#f5cf92';
  sctx.font = '600 36px Outfit, sans-serif';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.letterSpacing = '5px';
  sctx.fillText('MARKETING NAIIN · SCULPTURE & ART PAVILION', 512, 64);
  const stex = new THREE.CanvasTexture(sc);
  mesh(new THREE.PlaneGeometry(4.70, 0.40), new THREE.MeshBasicMaterial({ map: stex }), 2.50, FY + 2.45, -D / 2 + 0.048, booth, false, false);

  // 3. Left Wall (X = -7.5) & Right Wall (X = +7.5)
  registerWall(mesh(B(0.12, wallCoreH, D), M.limewash, -W / 2 - 0.06, FY + wallCoreH / 2, 0), 'wall');
  registerWall(mesh(B(0.14, baseboardH, D), M.walnut, -W / 2 - 0.06, baseboardY, 0), 'trim');
  registerWall(mesh(B(0.14, trimCapH, D), M.walnut, -W / 2 - 0.06, trimCapY, 0), 'trim');

  registerWall(mesh(B(0.12, wallCoreH, D), M.limewash, W / 2 + 0.06, FY + wallCoreH / 2, 0), 'wall');
  registerWall(mesh(B(0.14, baseboardH, D), M.walnut, W / 2 + 0.06, baseboardY, 0), 'trim');
  registerWall(mesh(B(0.14, trimCapH, D), M.walnut, W / 2 + 0.06, trimCapY, 0), 'trim');

  // 4. FRONT WALL (Z = +1.5)
  // Part A: Left Return Wall (X = -7.5 to -6.3, width 1.2m)
  const leftReturnW = 1.20;
  const leftReturnX = -W / 2 + leftReturnW / 2; // -6.90
  registerWall(mesh(B(leftReturnW, wallCoreH, 0.15), M.limewash, leftReturnX, FY + wallCoreH / 2, D / 2), 'wall');
  registerWall(mesh(B(leftReturnW, baseboardH, 0.18), M.walnut, leftReturnX, baseboardY, D / 2), 'trim');
  registerWall(mesh(B(leftReturnW, trimCapH, 0.18), M.walnut, leftReturnX, trimCapY, D / 2), 'trim');

  // Part B: Grand Entrance Portal Header (X = -6.3 to -3.3, width 3.0m)
  const headerH = 0.65;
  const headerY = FY + H - headerH / 2;
  registerWall(mesh(B(DOOR_WIDTH, headerH, 0.18), M.walnut, DOOR_CENTER_X, headerY, D / 2), 'trim');
  
  // Portal jamb pillars
  registerWall(mesh(B(0.10, H, 0.22), M.walnut, -6.30 - 0.05, FY + H / 2, D / 2), 'trim');
  registerWall(mesh(B(0.10, H, 0.22), M.walnut, -3.30 + 0.05, FY + H / 2, D / 2), 'trim');

  // Portal brass threshold on floor
  mesh(B(DOOR_WIDTH, 0.008, 0.20), M.brassSatin, DOOR_CENTER_X, FY + 0.004, D / 2);

  // Entrance Header Sign
  const ec = document.createElement('canvas');
  ec.width = 512; ec.height = 96;
  const ectx = ec.getContext('2d');
  ectx.fillStyle = '#241a12';
  ectx.fillRect(0, 0, 512, 96);
  ectx.fillStyle = '#f5cf92';
  ectx.font = '600 32px Outfit, sans-serif';
  ectx.textAlign = 'center';
  ectx.textBaseline = 'middle';
  ectx.fillText('GALLERY ENTRANCE ➔', 256, 48);
  const etex = new THREE.CanvasTexture(ec);
  mesh(new THREE.PlaneGeometry(2.4, 0.38), new THREE.MeshBasicMaterial({ map: etex }), DOOR_CENTER_X, headerY, D / 2 + 0.095, booth, false, false);

  // 3 warm spot lights under door lintel
  [-0.9, 0, 0.9].forEach(dx => {
    const lx = DOOR_CENTER_X + dx;
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16), M.brass, lx, FY + H - headerH - 0.01, D / 2);
    mesh(new THREE.CircleGeometry(0.024, 16).rotateX(Math.PI / 2), M.bulb, lx, FY + H - headerH - 0.02, D / 2, booth, false, false);
    const pl = addAccent(new THREE.PointLight(0xffdfb0, 1.2, 3.2, 2), 1.2);
    pl.position.set(lx, FY + H - headerH - 0.08, D / 2);
    booth.add(pl);
  });

  // Part C: Solid Front Exhibition Wall (X = -3.3 to +7.5, width 10.8m)
  // Wall core height is 2.92m, completely capped by walnut coping at 3.00m (ZERO Z-fighting)
  const frontWallW = 10.80;
  const frontWallX = -3.30 + frontWallW / 2; // +2.10
  registerWall(mesh(B(frontWallW, wallCoreH, 0.15), M.limewash, frontWallX, FY + wallCoreH / 2, D / 2), 'wall');
  registerWall(mesh(B(frontWallW + 0.04, baseboardH, 0.18), M.walnut, frontWallX, baseboardY, D / 2), 'trim');
  registerWall(mesh(B(frontWallW + 0.04, trimCapH, 0.18), M.walnut, frontWallX, trimCapY, D / 2), 'trim');

  // Brass divide line between outside walking path
  mesh(B(frontWallW, 0.01, 0.01), M.brassSatin, frontWallX, FY + 0.005, D / 2 + 0.12);

  // 5. Open Ceiling Rafters & Lighting Tracks (cleanly seated between front and back wall copings)
  [-6.0, -3.0, 0, 3.0, 6.0].forEach(rx => {
    registerWall(mesh(B(0.08, 0.10, D - 0.28), M.walnut, rx, FY + H - 0.09, 0), 'trim');
  });

  // Dedicated track lighting rails (Room 1 [5m] and Room 2 [10m])
  const trackZ = -0.82;
  const trackY = FY + H - 0.15;
  // Room 1 Track Rail (5m Foyer: X = -7.15 to -2.85, length 4.30, center -5.00)
  mesh(B(4.30, 0.03, 0.04), M.blackMetal, -5.00, trackY, trackZ);
  mesh(B(4.30, 0.01, 0.01), M.led, -5.00, trackY - 0.02, trackZ, booth, false, false);
  // Room 2 Track Rail (10m Grand Pavilion: X = -2.15 to +7.15, length 9.30, center +2.50)
  mesh(B(9.30, 0.03, 0.04), M.blackMetal, 2.50, trackY, trackZ);
  mesh(B(9.30, 0.01, 0.01), M.led, 2.50, trackY - 0.02, trackZ, booth, false, false);

  // 6. Architectural Dividing Partition Wall (at X = -2.50 dividing Room 1 [5m] & Room 2 [10m])
  const pw1X = -2.50;
  // Solid wall section from Z = -1.50 to +0.30 (length 1.80m, center Z = -0.60)
  registerWall(mesh(B(0.10, wallCoreH, 1.80), M.limewash, pw1X, FY + wallCoreH / 2, -0.60), 'wall');
  registerWall(mesh(B(0.14, trimCapH, 1.80), M.walnut, pw1X, trimCapY, -0.60), 'trim');
  registerWall(mesh(B(0.14, baseboardH, 1.80), M.walnut, pw1X, baseboardY, -0.60), 'trim');

  // Doorway portal jamb pillar at Z = +0.30
  registerWall(mesh(B(0.14, H, 0.10), M.walnut, pw1X, FY + H / 2, 0.30), 'trim');
  mesh(B(0.02, H - 0.20, 0.005), M.brassSatin, pw1X, FY + H / 2, 0.355);

  // Doorway lintel header spanning Z = +0.30 to +1.50 (width 1.20m, height 0.60m)
  registerWall(mesh(B(0.10, 0.54, 1.20), M.limewash, pw1X, FY + 2.65, 0.90), 'wall');
  registerWall(mesh(B(0.14, 0.08, 1.20), M.walnut, pw1X, FY + 2.34, 0.90), 'trim');
  registerWall(mesh(B(0.14, trimCapH, 1.20), M.walnut, pw1X, trimCapY, 0.90), 'trim');

  // Brass transition threshold on floor across doorway
  mesh(B(0.16, 0.008, 1.20), M.brassSatin, pw1X, FY + 0.004, 0.90);

  // Warm welcome downlight in doorway portal
  const doorwayPl = addAccent(new THREE.PointLight(0xffe6c8, 1.4, 2.8, 2), 1.4);
  doorwayPl.position.set(pw1X, FY + 2.25, 0.90);
  booth.add(doorwayPl);

  // Vertical acoustic oak slats on Partition 1 West face (facing Room 1)
  for (let sz = -1.35; sz <= 0.15; sz += 0.25) {
    const slat = mesh(B(0.025, H - 0.30, 0.045), M.oak, pw1X - 0.055, FY + H / 2, sz, booth, false, true);
    registerWall(slat, 'slat');
  }
}

// ---------------------------------------------------------------------------
// Framed Paintings Helper
// ---------------------------------------------------------------------------
function makeFramedArt(w, h, tex, title = '', artKey = '', isFacingOutside = true) {
  const g = new THREE.Group();
  const frameBorder = 0.045;
  const frameD = 0.04;

  // Walnut outer frame
  mesh(B(w + frameBorder * 2, h + frameBorder * 2, frameD), M.walnut, 0, 0, 0, g);
  // Satin brass inner fillet
  mesh(B(w + 0.016, h + 0.016, frameD + 0.006), M.brassSatin, 0, 0, 0, g);

  // Canvas
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.35,
    metalness: 0.02,
  });
  const canvasMesh = mesh(new THREE.PlaneGeometry(w, h), mat, 0, 0, frameD / 2 + 0.004, g, false, true);

  if (artKey) {
    canvasMesh.userData.isArt = true;
    canvasMesh.userData.artKey = artKey;
    canvasMesh.userData.title = title;
    artMeshes.push(canvasMesh);
  }

  // Museum Brass Picture Light overhead
  const lightBar = new THREE.Group();
  lightBar.position.set(0, h / 2 + frameBorder + 0.085, frameD + 0.075);
  mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.10, 8), M.brass, -w * 0.25, -0.04, -0.035, lightBar).rotation.x = Math.PI / 3;
  mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.10, 8), M.brass,  w * 0.25, -0.04, -0.035, lightBar).rotation.x = Math.PI / 3;
  mesh(new THREE.CylinderGeometry(0.008, 0.008, Math.min(w * 0.75, 0.70), 16), M.brass, 0, 0, 0, lightBar).rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.005, 0.005, Math.min(w * 0.70, 0.65), 16), M.led, 0, -0.006, 0, lightBar, false, false).rotation.z = Math.PI / 2;
  g.add(lightBar);

  // Brass Plaque under frame
  const plaqueW = 0.28, plaqueH = 0.07;
  mesh(B(plaqueW, plaqueH, 0.008), M.brassSatin, 0, -h / 2 - frameBorder - 0.06, frameD / 2, g);

  return g;
}

function loadArtTexture(url) {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        resolve(t);
      },
      undefined,
      () => {
        console.warn('Failed loading art:', url);
        resolve(makePlasterTexture());
      }
    );
  });
}

// ---------------------------------------------------------------------------
// Build Double-Sided Art Wall (5 Outside + 5 Inside)
// ---------------------------------------------------------------------------
async function buildArtworks() {
  const texPromises = {
    out1: loadArtTexture(ART_SOURCES.out1.src),
    out2: loadArtTexture(ART_SOURCES.out2.src),
    out3: loadArtTexture(ART_SOURCES.out3.src),
    out4: loadArtTexture(ART_SOURCES.out4.src),
    out5: loadArtTexture(ART_SOURCES.out5.src),
    in1:  loadArtTexture(ART_SOURCES.in1.src),
    in2:  loadArtTexture(ART_SOURCES.in2.src),
    in3:  loadArtTexture(ART_SOURCES.in3.src),
    in4:  loadArtTexture(ART_SOURCES.in4.src),
    in5:  loadArtTexture(ART_SOURCES.in5.src),
  };

  const textures = {};
  for (const k of Object.keys(texPromises)) {
    textures[k] = await texPromises[k];
  }

  const artY = FY + 1.55; // Eye-level gallery height (1.65m from ground)
  const wallFrontZ = D / 2; // +1.5m

  // 1. Five Outside Paintings (Facing exterior +Z)
  ART_OUT_X.forEach((x, idx) => {
    const key = `out${idx + 1}`;
    const info = ART_SOURCES[key];
    const frame = makeFramedArt(info.w, info.h, textures[key], info.title, key, true);
    frame.position.set(x, artY, wallFrontZ + 0.08); // Placed on exterior face
    booth.add(frame);
  });

  // 2. Five Inside Paintings (Facing interior -Z, rotated Math.PI)
  ART_IN_X.forEach((x, idx) => {
    const key = `in${idx + 1}`;
    const info = ART_SOURCES[key];
    const frame = makeFramedArt(info.w, info.h, textures[key], info.title, key, false);
    frame.position.set(x, artY, wallFrontZ - 0.08); // Placed on interior face
    frame.rotation.y = Math.PI; // Look towards interior
    booth.add(frame);
  });

  // Ambient gallery wash lights for exterior and interior front wall exhibitions
  const outWash = addAccent(new THREE.PointLight(0xffecd4, 2.2, 7.5, 1.8), 2.2);
  outWash.position.set(2.10, FY + 2.7, wallFrontZ + 1.20);
  booth.add(outWash);

  const inWash = addAccent(new THREE.PointLight(0xffecd4, 2.2, 7.5, 1.8), 2.2);
  inWash.position.set(2.50, FY + 2.7, wallFrontZ - 1.20);
  booth.add(inWash);
}

// ---------------------------------------------------------------------------
// 6 Sculptures & Pedestals in a Row
// ---------------------------------------------------------------------------
let foxyTemplate = null;

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
  wrap.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return wrap;
}
const normalizeModel = normalize;

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
              child.receiveShadow = false;
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
        if (onProgress) {
          if (xhr.lengthComputable && xhr.total > 0) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            onProgress(pct);
          } else if (xhr.loaded > 0) {
            const estPct = Math.min(95, Math.round((xhr.loaded / (30 * 1024 * 1024)) * 100));
            onProgress(estPct);
          }
        }
      },
      (err) => {
        console.warn('Could not load Foxy.glb, falling back to procedural', err);
        resolve(null);
      }
    );
  });
}

function cloneSculpture(template) {
  const clone = template.clone(true);
  clone.traverse((child) => {
    if (child.isMesh) {
      if (Array.isArray(child.material)) {
        child.material = child.material.map(m => m.clone());
      } else if (child.material) {
        child.material = child.material.clone();
      }
      child.castShadow = true;
      child.receiveShadow = false;
    }
  });
  return clone;
}

function createProceduralSculpture(idx = 0) {
  const g = new THREE.Group();
  mesh(new THREE.TorusKnotGeometry(0.12, 0.035, 128, 32, 2, 3), M.sculptBronze, 0, 0.25, 0, g);
  mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.08, 32), M.brassSatin, 0, 0.04, 0, g);
  return g;
}

// ---------------------------------------------------------------------------
// 20 Miniature Framed Artworks (25 × 25 cm)
// ---------------------------------------------------------------------------
function makeProceduralMiniArt(index) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const palettes = [
    { bg: '#f2e8d9', c1: '#c46b38', c2: '#db9e68', c3: '#4a5b43', style: 'geo_circles' },
    { bg: '#e8edf2', c1: '#2b4c7e', c2: '#688db5', c3: '#d4af37', style: 'abstract_wave' },
    { bg: '#f7f2e7', c1: '#a65836', c2: '#d89b58', c3: '#3c322b', style: 'terracotta_arch' },
    { bg: '#1c1b20', c1: '#444b58', c2: '#c9a463', c3: '#e0d8c3', style: 'obsidian_minimal' },
    { bg: '#eaf0ea', c1: '#2e5a44', c2: '#639376', c3: '#c8a858', style: 'botanical_shapes' },
    { bg: '#1d2638', c1: '#3e5c94', c2: '#d4af37', c3: '#f0ece1', style: 'cobalt_crest' },
    { bg: '#f9eee5', c1: '#d35400', c2: '#e67e22', c3: '#f39c12', style: 'sunset_horizon' },
    { bg: '#eceef0', c1: '#7f8c8d', c2: '#bdc3c7', c3: '#d4af37', style: 'platinum_geo' },
    { bg: '#fcf3cf', c1: '#d68910', c2: '#b9770e', c3: '#7d6608', style: 'golden_foxy' },
    { bg: '#f5eef8', c1: '#8e44ad', c2: '#bb8fce', c3: '#f1c40f', style: 'royal_indigo' },
    { bg: '#e8f8f5', c1: '#16a085', c2: '#48c9b0', c3: '#a3e4d7', style: 'mint_harmony' },
    { bg: '#fdfefe', c1: '#2c3e50', c2: '#e74c3c', c3: '#f39c12', style: 'bauhaus_primary' },
    { bg: '#fbeee6', c1: '#ba4a00', c2: '#e59866', c3: '#edbb99', style: 'warm_desert' },
    { bg: '#eaf2f8', c1: '#2980b9', c2: '#5499c7', c3: '#aed6f1', style: 'azure_minimal' },
    { bg: '#eaeded', c1: '#515a5a', c2: '#7b7d7d', c3: '#d4af37', style: 'monochrome_gold' },
    { bg: '#f4ecf7', c1: '#6c3483', c2: '#9b59b6', c3: '#f4d03f', style: 'amethyst_gem' },
    { bg: '#ebf5fb', c1: '#1b4f72', c2: '#2e86c1', c3: '#85c1e9', style: 'ocean_depth' },
    { bg: '#fef9e7', c1: '#7d6608', c2: '#b7950b', c3: '#d4ac0d', style: 'solar_flare' },
    { bg: '#f4f6f7', c1: '#34495e', c2: '#415b76', c3: '#cda658', style: 'calacatta_vein' },
    { bg: '#17202a', c1: '#1f618d', c2: '#2874a6', c3: '#f39c12', style: 'twilight_nebula' },
  ];

  const p = palettes[index % palettes.length];
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.035)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  ctx.save();
  if (p.style === 'geo_circles') {
    ctx.fillStyle = p.c1;
    ctx.beginPath();
    ctx.arc(256, 280, 150, Math.PI, 0);
    ctx.lineTo(406, 450);
    ctx.lineTo(106, 450);
    ctx.fill();
    ctx.fillStyle = p.c2;
    ctx.beginPath();
    ctx.arc(340, 180, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.c3;
    ctx.beginPath();
    ctx.arc(180, 350, 70, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.style === 'abstract_wave') {
    ctx.fillStyle = p.c1;
    ctx.beginPath();
    ctx.moveTo(60, 100);
    ctx.bezierCurveTo(450, 120, 100, 380, 450, 420);
    ctx.bezierCurveTo(250, 480, 40, 280, 60, 100);
    ctx.fill();
    ctx.fillStyle = p.c2;
    ctx.beginPath();
    ctx.arc(330, 240, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.c3;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(256, 256, 180, 0.4, 2.8);
    ctx.stroke();
  } else if (p.style === 'terracotta_arch') {
    ctx.fillStyle = p.c1;
    ctx.beginPath();
    ctx.arc(256, 220, 140, Math.PI, 0);
    ctx.lineTo(396, 460);
    ctx.lineTo(116, 460);
    ctx.fill();
    ctx.fillStyle = p.c2;
    ctx.beginPath();
    ctx.arc(256, 220, 90, Math.PI, 0);
    ctx.lineTo(346, 460);
    ctx.lineTo(166, 460);
    ctx.fill();
    ctx.fillStyle = p.c3;
    ctx.beginPath();
    ctx.arc(256, 360, 50, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = p.c1;
    ctx.beginPath();
    ctx.ellipse(256, 220, 130, 110, index * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.c2;
    ctx.fillRect(120, 320, 272, 80);
    ctx.fillStyle = p.c3;
    ctx.beginPath();
    ctx.arc(340, 150, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.c2;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(80, 256);
    ctx.lineTo(432, 256);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(180,150,110,0.35)';
  ctx.lineWidth = 12;
  ctx.strokeRect(16, 16, 480, 480);

  ctx.fillStyle = 'rgba(80,60,40,0.6)';
  ctx.font = 'italic 16px Outfit, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Naiin ' + (index + 1), 470, 480);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeMiniFramedArt(tex, title = '', spotId = 1) {
  const g = new THREE.Group();
  const w = 0.25; // Exact 25 cm width
  const h = 0.25; // Exact 25 cm height
  const frameBorder = 0.025; // 2.5 cm walnut border
  const frameD = 0.028;      // 2.8 cm depth

  // Walnut outer frame (outer size 0.30 x 0.30 m)
  mesh(B(w + frameBorder * 2, h + frameBorder * 2, frameD), M.walnut, 0, 0, 0, g);
  // Satin brass inner fillet
  mesh(B(w + 0.010, h + 0.010, frameD + 0.004), M.brassSatin, 0, 0, 0, g);

  // 25x25 cm Fine Art Canvas
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.38,
    metalness: 0.02,
  });
  mesh(new THREE.PlaneGeometry(w, h), mat, 0, 0, frameD / 2 + 0.003, g, false, true);

  // Miniature brass picture light overhead
  const lightBar = new THREE.Group();
  lightBar.position.set(0, h / 2 + frameBorder + 0.045, frameD + 0.035);
  mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.05, 8), M.brass, -w * 0.25, -0.02, -0.015, lightBar).rotation.x = Math.PI / 3;
  mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.05, 8), M.brass,  w * 0.25, -0.02, -0.015, lightBar).rotation.x = Math.PI / 3;
  mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 16), M.brass, 0, 0, 0, lightBar).rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 16), M.led, 0, -0.004, 0, lightBar, false, false).rotation.z = Math.PI / 2;
  g.add(lightBar);

  // Brass Plaque under frame: 25x25 cm label
  const plaqueW = 0.16, plaqueH = 0.032;
  mesh(B(plaqueW, plaqueH, 0.005), M.brassSatin, 0, -h / 2 - frameBorder - 0.026, frameD / 2, g);

  return g;
}

function buildMiniArtworks() {
  MINI_ART_SPOTS.forEach((spot, idx) => {
    const tex = makeProceduralMiniArt(idx);
    const frame = makeMiniFramedArt(tex, spot.title, spot.id);
    frame.position.set(spot.x, spot.y, spot.z);
    frame.rotation.y = spot.rotY || 0;
    booth.add(frame);
  });

  // Central warm museum gallery ceiling light for Room 1 (illuminates all 4 walls and 20 mini pictures smoothly)
  const room1Light = addAccent(new THREE.PointLight(0xffeed8, 2.6, 6.0, 1.8), 2.6);
  room1Light.position.set(-5.0, FY + 2.7, 0);
  booth.add(room1Light);
}

// ---------------------------------------------------------------------------
// Furniture Adapted to 2 Rooms (5m Foyer + 10m Grand Pavilion)
// ---------------------------------------------------------------------------
function buildFurniture() {
  // -------------------------------------------------------------------------
  // Room 1 (West: X = -7.5 to -2.5) — Welcome Foyer with 20 Mini Artworks
  // -------------------------------------------------------------------------
  const cabW = 1.60, cabX = -5.00, cabZ = -1.25;
  // Olive wall console cabinet along back wall
  mesh(B(cabW, 0.82, 0.40), M.olive, cabX, FY + 0.41, cabZ);
  // Calacatta marble countertop
  mesh(B(cabW + 0.04, 0.04, 0.44), M.marble, cabX, FY + 0.84, cabZ);
  // Brass handles
  [-0.35, 0.35].forEach((hx) => {
    mesh(B(0.015, 0.12, 0.02), M.brass, cabX + hx, FY + 0.55, cabZ + 0.21);
  });
  // Bouquet in ceramic vase and fruit bowl on console
  place(makeBouquet(), cabX + 0.35, FY + 0.86, cabZ);
  place(makeFruitBowl(), cabX - 0.35, FY + 0.86, cabZ);

  // Floating oak shelves on left section (x = -6.85, width 1.0)
  const shelfY = [FY + 1.45, FY + 2.10];
  shelfY.forEach((y) => {
    mesh(B(1.0, 0.035, 0.24), M.oak, -6.85, y, -1.28);
    mesh(B(0.95, 0.008, 0.012), M.led, -6.85, y - 0.022, -1.17, booth, false, false);
  });
  place(makePlant({ potR: 0.07, potH: 0.12, tree: false, crown: [0.12, 0.1, 0.12], leaves: 45, leafSize: 0.04 }), -7.10, shelfY[0] + 0.02, -1.28);
  place(makeBowl(0.09, M.walnut), -6.60, shelfY[0] + 0.02, -1.28);
  place(makeBooks(3), -7.05, shelfY[1] + 0.02, -1.28);
  place(makeCandle(0.12), -6.65, shelfY[1] + 0.02, -1.28);

  // Overhead oak beam + brass dome pendants over foyer
  mesh(B(4.6, 0.08, 0.08), M.oak, -5.0, FY + H - 0.14, 0.0);
  [-5.8, -4.2].forEach((px) => makePendant(px, 0.0, FY + 2.05));

  // Corner potted olive tree
  place(makePlant({ potR: 0.22, potH: 0.48, potMat: M.ceramic, trunkH: 1.3, crown: [0.46, 0.44, 0.46], leaves: 220 }), -7.10, FY, -0.95);

  // -------------------------------------------------------------------------
  // Room 2 (Center & East: X = -2.5 to +7.5) — 10m Grand Sculpture Pavilion
  // -------------------------------------------------------------------------
  // Museum leather daybed / bench in center lounge area (viewing 6 sculptures & artworks)
  makeMuseumBench(2.50, 0.45);

  // Arched brass floor lamp near partition 1 transition
  makeArcLamp(-2.05, 0.75, new V3(-1.40, FY + 1.95, 0.55));

  // Potted ficus tree in the right corner
  place(makePlant({ potR: 0.22, potH: 0.48, potMat: M.ceramic, trunkH: 1.35, crown: [0.48, 0.45, 0.48], leaves: 240 }), 7.15, FY, -1.05);
}

// ---------------------------------------------------------------------------
// 6 Sculptures in a Row inside Room 2 (เหมือนเวอร์ชั่นแรก)
// ---------------------------------------------------------------------------
const sculptureRegistry = [];

function buildSculptures() {
  sculptureRegistry.length = 0;
  const pedestalW = 1.15;
  const pedestalD = 0.75;
  const pedestalH = 0.65;

  SCULPTURE_POSITIONS.forEach((pos, idx) => {
    let sculptObj = null;
    if (foxyTemplate) {
      sculptObj = cloneSculpture(foxyTemplate);
    } else {
      sculptObj = createProceduralSculpture(idx);
    }

    const group = new THREE.Group();
    group.position.set(pos.x, FY, pos.z);

    // Walnut fluted plinth body
    mesh(B(pedestalW, pedestalH - 0.08, pedestalD), M.walnut, 0, (pedestalH - 0.08) / 2, 0, group);
    // Travertine luxurious top slab
    mesh(B(pedestalW + 0.06, 0.08, pedestalD + 0.06), M.travertine, 0, pedestalH - 0.04, 0, group);
    // Satin brass reveal inlay strip
    mesh(B(pedestalW + 0.04, 0.012, pedestalD + 0.04), M.brassSatin, 0, pedestalH - 0.085, 0, group);
    // Recessed LED halo under the plinth
    mesh(B(pedestalW - 0.08, 0.015, pedestalD - 0.08), M.led, 0, 0.015, 0, group, false, false);
    // Basalt base plate
    mesh(B(pedestalW - 0.04, 0.02, pedestalD - 0.04), M.basalt, 0, 0.01, 0, group);

    // Museum Brass Plaque on front face of the plinth
    const plaqueCanvas = document.createElement('canvas');
    plaqueCanvas.width = 512;
    plaqueCanvas.height = 128;
    const pctx = plaqueCanvas.getContext('2d');
    pctx.fillStyle = '#1e1610';
    pctx.fillRect(0, 0, 512, 128);
    pctx.strokeStyle = '#cda658';
    pctx.lineWidth = 6;
    pctx.strokeRect(6, 6, 500, 116);
    pctx.fillStyle = '#f5cf92';
    pctx.font = 'bold 34px Outfit, sans-serif';
    pctx.textAlign = 'center';
    pctx.textBaseline = 'middle';
    pctx.fillText(`SCULPTURE S${idx + 1} · FOXY`, 256, 46);
    pctx.font = '22px Outfit, sans-serif';
    pctx.fillStyle = '#d8c4a8';
    pctx.fillText('Marketing Naiin 50cm Exhibition Edition', 256, 88);
    const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
    mesh(
      new THREE.PlaneGeometry(0.50, 0.125),
      new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.35, metalness: 0.5 }),
      0,
      pedestalH * 0.50,
      pedestalD / 2 + 0.005,
      group
    );

    // Sculpture on top of pedestal (faces forward)
    sculptObj.position.set(0, pedestalH, 0);
    sculptObj.rotation.y = 0;
    group.add(sculptObj);
    booth.add(group);

    // Dedicated overhead track spotlight for sculpture museum focus
    const spot = new THREE.SpotLight(0xfff1dc, 3.8, 5.5, Math.PI / 5, 0.40, 1.6);
    spot.position.set(pos.x, FY + H - 0.20, pos.z + 0.35);
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(pos.x, FY + pedestalH + SCULPT_H / 2, pos.z);
    scene.add(spotTarget);
    spot.target = spotTarget;
    spot.castShadow = false; // Turn off expensive shadow map passes (Sun already casts realistic directional shadows)
    scene.add(spot);
    addAccent(spot, 3.8);

    sculptureRegistry.push({ id: pos.id, group, sculptObj, pos });
  });
}

// ---------------------------------------------------------------------------
// Camera Quick Views
// ---------------------------------------------------------------------------
const VIEWS = {
  overview: {
    pos: [9.8, 5.0, 11.5],
    target: [0, 1.3, 0],
  },
  facade: {
    pos: [1.8, 2.0, 7.8],
    target: [1.8, 1.5, D / 2],
  },
  entrance: {
    pos: [-4.8, 1.7, 5.2],
    target: [-4.8, 1.6, 0],
  },
  room1: {
    pos: [-5.0, 1.8, 1.8],
    target: [-5.0, 1.5, -0.6],
  },
  room2: {
    pos: [2.5, 2.2, 4.0],
    target: [2.5, 1.2, -0.82],
  },
  inside_art: {
    pos: [2.5, 1.6, -0.3],
    target: [2.5, 1.55, D / 2],
  },
  top: {
    pos: [0, 14.5, 0.001],
    target: [0, 0, 0],
  },
  s1_entry: {
    pos: [-4.2, 1.7, 0.8],
    target: [-4.2, 1.2, -0.25],
  },
  sculptures: {
    pos: [-2.5, 1.8, 0.8],
    target: [2.5, 1.0, -0.82],
  },
};

let camAnim = null;

function setCameraView(viewKey) {
  const v = VIEWS[viewKey];
  if (!v) return;

  document.querySelectorAll('#viewBar button').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`view-${viewKey}`);
  if (btn) btn.classList.add('active');

  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = new V3(...v.pos);
  const endTarget = new V3(...v.target);

  const startTime = performance.now();
  const duration = 900; // ms

  camAnim = (now) => {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    camera.position.lerpVectors(startPos, endPos, ease);
    controls.target.lerpVectors(startTarget, endTarget, ease);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(camAnim);
    } else {
      camAnim = null;
    }
  };
  requestAnimationFrame(camAnim);
}

// ---------------------------------------------------------------------------
// Custom 3D Model Importer & Gizmo Support
// ---------------------------------------------------------------------------
let customModel = null;
const transformControl = new TransformControls(camera, renderer.domElement);
transformControl.size = 0.75;
scene.add(transformControl);

transformControl.addEventListener('dragging-changed', (e) => {
  controls.enabled = !e.value;
});

function handleModelFile(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  const url = URL.createObjectURL(file);

  const onLoaded = (obj) => {
    if (customModel) scene.remove(customModel);
    customModel = normalizeModel(obj, 0.50);
    // Place by default on Pedestal 1 or near entrance
    customModel.position.set(-3.80, FY + 0.65, -0.82);
    scene.add(customModel);
    transformControl.attach(customModel);

    document.getElementById('customModelTools').style.display = 'block';
    setCameraView('s1_entry');
  };

  if (ext === 'glb' || ext === 'gltf') {
    new GLTFLoader().load(url, gltf => onLoaded(gltf.scene || gltf.scenes[0]));
  } else if (ext === 'obj') {
    new OBJLoader().load(url, onLoaded);
  } else if (ext === 'fbx') {
    new FBXLoader().load(url, onLoaded);
  }
}

// ---------------------------------------------------------------------------
// UI Events & Interactivity
// ---------------------------------------------------------------------------
function initUI() {
  // Mobile drawer controls
  const panel = document.getElementById('controlPanel');
  const btnToggle = document.getElementById('btnTogglePanel');
  const btnClose = document.getElementById('btnClosePanel');
  const backdrop = document.getElementById('panelBackdrop');

  const togglePanel = (show) => {
    panel.classList.toggle('open', show);
    backdrop.classList.toggle('open', show);
    btnToggle.classList.toggle('active', show);
  };

  btnToggle.addEventListener('click', () => togglePanel(!panel.classList.contains('open')));
  btnClose.addEventListener('click', () => togglePanel(false));
  backdrop.addEventListener('click', () => togglePanel(false));

  // Lighting modes
  ['golden', 'day', 'night'].forEach(mode => {
    const b = document.getElementById(`mode-${mode}`);
    if (b) b.addEventListener('click', () => setLightMode(mode));
  });

  // Visibility Toggles
  const toggleRotate = document.getElementById('toggleRotate');
  if (toggleRotate) toggleRotate.addEventListener('change', e => controls.autoRotate = e.target.checked);

  // X-Ray / Transparent
  const toggleTrans = document.getElementById('toggleTransparent');
  const xRayBox = document.getElementById('xRayControls');
  const xRaySlider = document.getElementById('xRayOpacitySlider');
  const xRayDisplay = document.getElementById('xRayOpacityDisplay');

  if (toggleTrans) {
    toggleTrans.addEventListener('change', e => {
      setWallsTransparent(e.target.checked);
      if (xRayBox) xRayBox.style.display = e.target.checked ? 'block' : 'none';
    });
  }
  if (xRaySlider) {
    xRaySlider.addEventListener('input', e => {
      const val = parseFloat(e.target.value) / 100;
      setWallsTransparent(true, val);
      if (xRayDisplay) xRayDisplay.textContent = `${e.target.value}%`;
    });
  }

  // Camera views
  Object.keys(VIEWS).forEach(k => {
    const btn = document.getElementById(`view-${k}`);
    if (btn) btn.addEventListener('click', () => setCameraView(k));
  });

  // Custom Model file upload & Drag & Drop
  const fileInput = document.getElementById('fileUpload');
  const btnUpload = document.getElementById('btnUpload');
  if (btnUpload && fileInput) {
    btnUpload.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      if (e.target.files.length) handleModelFile(e.target.files[0]);
    });
  }

  const dropZone = document.getElementById('dropZone');
  window.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('active'); });
  window.addEventListener('dragleave', e => { if (e.relatedTarget === null) dropZone.classList.remove('active'); });
  window.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('active');
    if (e.dataTransfer.files.length) handleModelFile(e.dataTransfer.files[0]);
  });

  // Gizmo & custom tools
  const btnTrans = document.getElementById('gizmo-translate');
  const btnRot = document.getElementById('gizmo-rotate');
  if (btnTrans && btnRot) {
    btnTrans.addEventListener('click', () => {
      transformControl.setMode('translate');
      btnTrans.classList.add('active'); btnRot.classList.remove('active');
    });
    btnRot.addEventListener('click', () => {
      transformControl.setMode('rotate');
      btnRot.classList.add('active'); btnTrans.classList.remove('active');
    });
  }

  const btnDel = document.getElementById('btnDeleteModel');
  if (btnDel) {
    btnDel.addEventListener('click', () => {
      if (customModel) {
        scene.remove(customModel);
        transformControl.detach();
        customModel = null;
        document.getElementById('customModelTools').style.display = 'none';
      }
    });
  }

  // Screenshot Capture
  const btnShot = document.getElementById('btnShot');
  if (btnShot) {
    btnShot.addEventListener('click', () => {
      transformControl.visible = false;
      renderer.render(scene, camera);
      const dataUrl = renderer.domElement.toDataURL('image/png');
      transformControl.visible = true;

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `booth-gallery-1door-6sculptures-${Date.now()}.png`;
      a.click();
    });
  }

  // Window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloom.setSize(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2));
    renderer.shadowMap.needsUpdate = true;
  });
}

function updateSculpturesWithFoxy(template) {
  sculptureRegistry.forEach((item) => {
    const { pos } = item;
    const foxy = cloneSculpture(template);
    foxy.rotation.y = pos.rotY || 0;

    if (pos.type === 'plinth') {
      foxy.position.set(0, pos.pedestalH, 0);
      if (item.sculptObj && item.group) {
        item.group.remove(item.sculptObj);
        item.group.add(foxy);
        item.sculptObj = foxy;
      }
    } else if (pos.type === 'credenza') {
      const sculptY = FY + pos.pedestalH;
      foxy.position.set(pos.x, sculptY, pos.z);
      if (item.sculptObj) {
        booth.remove(item.sculptObj);
      }
      booth.add(foxy);
      item.sculptObj = foxy;
    } else if (pos.type === 'niche') {
      const shelfY = FY + 1.60 - 0.95 / 2 + 0.04;
      foxy.position.set(pos.x, shelfY, pos.z);
      if (item.sculptObj) {
        booth.remove(item.sculptObj);
      }
      booth.add(foxy);
      item.sculptObj = foxy;
    }
  });
  renderer.shadowMap.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Initialization & Render Loop
// ---------------------------------------------------------------------------
async function init() {
  console.log('INIT: Starting initialization...');
  try {
    setupLighting(); console.log('INIT: 1. setupLighting done');
    buildArchitecture(); console.log('INIT: 2. buildArchitecture done');
    buildFurniture(); console.log('INIT: 3. buildFurniture done');
    buildSculptures(); console.log('INIT: 4. buildSculptures done');
    buildMiniArtworks(); console.log('INIT: 5. buildMiniArtworks done');
    initUI(); console.log('INIT: 6. initUI done');
    setLightMode('golden'); console.log('INIT: 7. setLightMode done');
  } catch (err) {
    console.error('INIT ERROR:', err);
  }

  // Start animation loop immediately
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
  }
  animate();

  // Dismiss loader immediately so user sees the gallery instantly
  const ldr = document.getElementById('loader');
  if (ldr) {
    ldr.classList.add('done');
    ldr.style.opacity = '0';
    ldr.style.pointerEvents = 'none';
    setTimeout(() => { if (ldr.parentNode) ldr.remove(); }, 350);
  }

  // Load artworks and 3D Foxy model in background without blocking
  buildArtworks().catch(e => console.warn('buildArtworks error:', e));

  // Background Model Loading HUD tracking
  function updateModelLoadingProgress(pct) {
    const hud = document.getElementById('model-loader-hud');
    const bar = document.getElementById('hud-fill');
    const text = document.getElementById('hud-pct');
    const status = document.getElementById('hud-status');
    if (bar) bar.style.width = `${Math.max(5, pct)}%`;
    if (text) text.textContent = `${pct}%`;
    if (status && pct < 100) status.textContent = `กำลังโหลดโมเดล 3D ประติมากรรม Foxy (${pct}%)…`;
  }

  function setModelLoadingComplete() {
    const hud = document.getElementById('model-loader-hud');
    if (!hud) return;
    hud.classList.add('complete');
    const status = document.getElementById('hud-status');
    if (status) status.textContent = '✓ โมเดล 3D Foxy โหลดสมบูรณ์แล้ว (6 ชิ้น)';
    const text = document.getElementById('hud-pct');
    if (text) text.textContent = '100%';
    const bar = document.getElementById('hud-fill');
    if (bar) bar.style.width = '100%';
    const spinner = document.getElementById('hud-spinner');
    if (spinner) spinner.style.display = 'none';

    setTimeout(() => {
      hud.style.opacity = '0';
      hud.style.transform = 'translate(-50%, 15px)';
      setTimeout(() => { if (hud.parentNode) hud.remove(); }, 500);
    }, 3000);
  }

  function setModelLoadingError() {
    const hud = document.getElementById('model-loader-hud');
    if (!hud) return;
    hud.classList.add('error');
    const status = document.getElementById('hud-status');
    if (status) status.textContent = '⚠️ ใช้โมเดลสำรอง (Procedural Sculptures)';
    const text = document.getElementById('hud-pct');
    if (text) text.textContent = 'พร้อมชม';
    const spinner = document.getElementById('hud-spinner');
    if (spinner) spinner.style.display = 'none';
    setTimeout(() => {
      hud.style.opacity = '0';
      setTimeout(() => { if (hud.parentNode) hud.remove(); }, 500);
    }, 4000);
  }

  loadFoxyModel((pct) => {
    updateModelLoadingProgress(pct);
  }).then((template) => {
    if (template) {
      updateSculpturesWithFoxy(template);
      setModelLoadingComplete();
    } else {
      setModelLoadingError();
    }
  }).catch((e) => {
    console.warn('loadFoxyModel error:', e);
    setModelLoadingError();
  });
}

init();
