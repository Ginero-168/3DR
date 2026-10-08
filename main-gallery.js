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
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

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
const SCULPTURE_POSITIONS = [
  { id: 's1', name: 'S1 · Entrance Gatekeeper', x: -3.80, z: -0.82, finish: 'bronze', label: 'S1 · Golden Amber Foxy' },
  { id: 's2', name: 'S2 · Acoustic Chamber',   x: -1.85, z: -0.82, finish: 'marble', label: 'S2 · Carrara Marble Foxy' },
  { id: 's3', name: 'S3 · Central Masterpiece', x:  0.20, z: -0.82, finish: 'obsidian', label: 'S3 · Royal Obsidian Foxy' },
  { id: 's4', name: 'S4 · Terracotta Pavilion', x:  2.25, z: -0.82, finish: 'terracotta', label: 'S4 · Ochre Amber Foxy' },
  { id: 's5', name: 'S5 · Heritage Verdite',    x:  4.27, z: -0.82, finish: 'verdite', label: 'S5 · Patina Bronze Foxy' },
  { id: 's6', name: 'S6 · Platinum Apex',       x:  6.31, z: -0.82, finish: 'platinum', label: 'S6 · Platinum Chrome Foxy' },
];

// 5 Pairs of Artworks on Front Wall (Outside & Inside)
const ART_PAIR_X = [-1.85, 0.20, 2.25, 4.27, 6.31];

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
const bloom = new UnrealBloomPass(new V2(window.innerWidth, window.innerHeight), 0.12, 0.22, 0.94);
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
};

const B = (w, h, d) => new RoundedBoxGeometry(w, h, d, 2, 0.008);
const mesh = (geom, mat, x = 0, y = 0, z = 0, parent = booth, shadow = true, receive = true) => {
  const m = new THREE.Mesh(geom, mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
};

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

  // 2. Back Wall (Z = -1.5)
  const backWall = registerWall(mesh(B(W, H, 0.12), M.limewash, 0, FY + H / 2, -D / 2 - 0.06), 'wall');
  // Back wall baseboard & top trim
  registerWall(mesh(B(W + 0.02, 0.12, 0.14), M.walnut, 0, FY + 0.06, -D / 2 - 0.06), 'trim');
  registerWall(mesh(B(W + 0.02, 0.14, 0.14), M.walnut, 0, FY + H - 0.07, -D / 2 - 0.06), 'trim');

  // Decorative walnut vertical slats on back wall
  for (let x = -W / 2 + 0.4; x <= W / 2 - 0.4; x += 0.35) {
    const slat = mesh(B(0.045, H - 0.3, 0.025), M.oak, x, FY + H / 2, -D / 2 + 0.015, booth, false, true);
    registerWall(slat, 'slat');
  }

  // Backlit Gallery Signage on Back Wall
  const signBacking = mesh(B(4.8, 0.45, 0.03), M.walnut, 0, FY + 2.45, -D / 2 + 0.03);
  registerWall(signBacking, 'sign');
  mesh(B(4.84, 0.47, 0.01), M.brassSatin, 0, FY + 2.45, -D / 2 + 0.015);
  // Canvas text for sign
  const sc = document.createElement('canvas');
  sc.width = 1024; sc.height = 128;
  const sctx = sc.getContext('2d');
  sctx.fillStyle = '#1c140d';
  sctx.fillRect(0, 0, 1024, 128);
  sctx.fillStyle = '#f5cf92';
  sctx.font = '600 38px Outfit, sans-serif';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.letterSpacing = '5px';
  sctx.fillText('MARKETING NAIIN · SCULPTURE & ART PAVILION', 512, 64);
  const stex = new THREE.CanvasTexture(sc);
  mesh(new THREE.PlaneGeometry(4.7, 0.40), new THREE.MeshBasicMaterial({ map: stex }), 0, FY + 2.45, -D / 2 + 0.048, booth, false, false);

  // 3. Left Wall (X = -7.5) & Right Wall (X = +7.5)
  registerWall(mesh(B(0.12, H, D), M.limewash, -W / 2 - 0.06, FY + H / 2, 0), 'wall');
  registerWall(mesh(B(0.14, 0.12, D), M.walnut, -W / 2 - 0.06, FY + 0.06, 0), 'trim');
  registerWall(mesh(B(0.14, 0.14, D), M.walnut, -W / 2 - 0.06, FY + H - 0.07, 0), 'trim');

  registerWall(mesh(B(0.12, H, D), M.limewash, W / 2 + 0.06, FY + H / 2, 0), 'wall');
  registerWall(mesh(B(0.14, 0.12, D), M.walnut, W / 2 + 0.06, FY + 0.06, 0), 'trim');
  registerWall(mesh(B(0.14, 0.14, D), M.walnut, W / 2 + 0.06, FY + H - 0.07, 0), 'trim');

  // 4. FRONT WALL (Z = +1.5)
  // Part A: Left Return Wall (X = -7.5 to -6.3, width 1.2m, height 3.0m)
  const leftReturnW = 1.20;
  const leftReturnX = -W / 2 + leftReturnW / 2; // -6.90
  registerWall(mesh(B(leftReturnW, H, 0.15), M.limewash, leftReturnX, FY + H / 2, D / 2), 'wall');
  registerWall(mesh(B(leftReturnW, 0.12, 0.18), M.walnut, leftReturnX, FY + 0.06, D / 2), 'trim');
  registerWall(mesh(B(leftReturnW, 0.14, 0.18), M.walnut, leftReturnX, FY + H - 0.07, D / 2), 'trim');

  // Part B: Grand Entrance Portal Header (X = -6.3 to -3.3, width 3.0m)
  // Clear door opening height: 2.35m, header above from 2.35m to 3.0m (height 0.65m)
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

  // Part C: Solid Front Exhibition Wall (X = -3.3 to +7.5, width 10.8m, height 3.0m)
  const frontWallW = 10.80;
  const frontWallX = -3.30 + frontWallW / 2; // +2.10
  registerWall(mesh(B(frontWallW, H, 0.15), M.limewash, frontWallX, FY + H / 2, D / 2), 'wall');
  registerWall(mesh(B(frontWallW + 0.04, 0.12, 0.18), M.walnut, frontWallX, FY + 0.06, D / 2), 'trim');
  registerWall(mesh(B(frontWallW + 0.04, 0.14, 0.18), M.walnut, frontWallX, FY + H - 0.07, D / 2), 'trim');

  // Brass divide line between outside walking path
  mesh(B(frontWallW, 0.01, 0.01), M.brassSatin, frontWallX, FY + 0.005, D / 2 + 0.12);

  // 5. Open Ceiling Rafters & Lighting Tracks
  [-6.0, -3.0, 0, 3.0, 6.0].forEach(rx => {
    registerWall(mesh(B(0.08, 0.14, D), M.walnut, rx, FY + H - 0.07, 0), 'trim');
  });

  // Longitudinal track lighting rail over sculptures at Z = -0.82
  const trackZ = -0.82;
  mesh(B(W - 0.5, 0.03, 0.04), M.blackMetal, 0, FY + H - 0.15, trackZ);
  mesh(B(W - 0.5, 0.01, 0.01), M.led, 0, FY + H - 0.17, trackZ, booth, false, false);
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

  // Soft spotlight on painting
  const pl = addAccent(new THREE.PointLight(0xffe2b8, 1.1, 2.4, 2), 1.1);
  pl.position.set(0, h / 2 + 0.08, frameD + 0.10);
  g.add(pl);

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
  ART_PAIR_X.forEach((x, idx) => {
    const key = `out${idx + 1}`;
    const info = ART_SOURCES[key];
    const frame = makeFramedArt(info.w, info.h, textures[key], info.title, key, true);
    frame.position.set(x, artY, wallFrontZ + 0.08); // Placed on exterior face
    booth.add(frame);
  });

  // 2. Five Inside Paintings (Facing interior -Z, rotated Math.PI)
  ART_PAIR_X.forEach((x, idx) => {
    const key = `in${idx + 1}`;
    const info = ART_SOURCES[key];
    const frame = makeFramedArt(info.w, info.h, textures[key], info.title, key, false);
    frame.position.set(x, artY, wallFrontZ - 0.08); // Placed on interior face
    frame.rotation.y = Math.PI; // Look towards interior
    booth.add(frame);
  });
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
      child.receiveShadow = true;
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

const sculptureRegistry = [];

function build6SculpturesInRow() {
  const pedestalW = 1.30;
  const pedestalD = 0.85;
  const pedestalH = 0.65;

  SCULPTURE_POSITIONS.forEach((pos, idx) => {
    const group = new THREE.Group();
    group.position.set(pos.x, FY, pos.z);

    // 1. Pedestal Plinth Base
    // Walnut fluted body
    mesh(B(pedestalW, pedestalH - 0.08, pedestalD), M.walnut, 0, (pedestalH - 0.08) / 2, 0, group);
    // Travertine luxurious top slab
    mesh(B(pedestalW + 0.06, 0.08, pedestalD + 0.06), M.travertine, 0, pedestalH - 0.04, 0, group);
    // Satin brass reveal inlay strip
    mesh(B(pedestalW + 0.04, 0.012, pedestalD + 0.04), M.brassSatin, 0, pedestalH - 0.085, 0, group);
    // Recessed LED halo under the plinth
    mesh(B(pedestalW - 0.08, 0.015, pedestalD - 0.08), M.led, 0, 0.015, 0, group, false, false);

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
      new THREE.PlaneGeometry(0.55, 0.138),
      new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.35, metalness: 0.5 }),
      0,
      pedestalH * 0.52,
      pedestalD / 2 + 0.005,
      group
    );

    // 2. Sculpture on top of pedestal (all 6 pedestals have 1 Foxy sculpture 50 cm)
    let sculptObj = null;
    if (foxyTemplate) {
      sculptObj = cloneSculpture(foxyTemplate);
    } else {
      sculptObj = createProceduralSculpture(idx);
    }

    sculptObj.position.set(0, pedestalH, 0);
    // Face directly forward towards the front walkway and viewers
    sculptObj.rotation.y = 0;
    group.add(sculptObj);

    // Add pedestal group to booth
    booth.add(group);

    // 3. Dedicated Overhead Track Spotlight pointing down directly onto sculpture
    const spot = new THREE.SpotLight(0xfff1dc, 3.2, 5.5, Math.PI / 5, 0.35, 1.6);
    spot.position.set(pos.x, FY + H - 0.20, pos.z + 0.35);

    // Separate spotlight target in scene space so sculptObj is NEVER detached from group
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(pos.x, FY + pedestalH + SCULPT_H / 2, pos.z);
    scene.add(spotTarget);
    spot.target = spotTarget;

    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0005;
    scene.add(spot);
    addAccent(spot, 3.2);

    // Track luminaire cylinder head on ceiling
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 16), M.blackMetal, pos.x, FY + H - 0.22, pos.z + 0.35).rotation.x = Math.PI / 6;

    sculptureRegistry.push({ id: pos.id, group, sculptObj, pos });
  });
}

// ---------------------------------------------------------------------------
// 3D Measurement Labels & Annotations
// ---------------------------------------------------------------------------
const dimGroup = new THREE.Group();
const zoneGroup = new THREE.Group();
dimGroup.visible = false;
zoneGroup.visible = false;
scene.add(dimGroup);
scene.add(zoneGroup);

function createPillLabel(text, cls = 'dim-label') {
  const d = document.createElement('div');
  d.className = cls;
  d.textContent = text;
  return new CSS2DObject(d);
}

function buildDimensionsAndLabels() {
  dimGroup.clear();
  zoneGroup.clear();
  dimGroup.visible = false;
  zoneGroup.visible = false;

  // 1. Overall Width 15 m Label (Along front edge)
  const lblWidth = createPillLabel('หน้ากว้าง 15.00 เมตร');
  lblWidth.position.set(0, FY + 0.08, D / 2 + 0.35);
  dimGroup.add(lblWidth);

  // 2. Depth 3.0 m Label (Right edge)
  const lblDepth = createPillLabel('ความลึก 3.00 ม.');
  lblDepth.position.set(W / 2 + 0.35, FY + 0.08, 0);
  dimGroup.add(lblDepth);

  // 3. Entrance Door Width (3.0 m)
  const lblDoor = createPillLabel('ประตูทางเข้า 3.00 ม.');
  lblDoor.position.set(DOOR_CENTER_X, FY + 2.50, D / 2 + 0.25);
  dimGroup.add(lblDoor);

  // 4. Front Exhibition Wall (10.8 m)
  const lblWall = createPillLabel('ผนังจัดแสดง 10.80 ม. (แขวนรูป 2 ด้าน)');
  lblWall.position.set(2.10, FY + 2.65, D / 2 + 0.25);
  dimGroup.add(lblWall);

  // 5. Labels for 6 Sculptures in a Row
  SCULPTURE_POSITIONS.forEach((pos, idx) => {
    const lbl = createPillLabel(`ประติมากรรม ${idx + 1} (Foxy 50 ซม.)`, 'zone-label');
    lbl.position.set(pos.x, FY + 0.65 + SCULPT_H + 0.18, pos.z);
    zoneGroup.add(lbl);
  });

  // 6. Labels for 5 Outside Artworks
  ART_PAIR_X.forEach((x, idx) => {
    const lbl = createPillLabel(`ภาพนอก ${idx + 1}`, 'exhibit-label');
    lbl.position.set(x, FY + 0.85, D / 2 + 0.22);
    zoneGroup.add(lbl);
  });

  // 7. Labels for 5 Inside Artworks
  ART_PAIR_X.forEach((x, idx) => {
    const lbl = createPillLabel(`ภาพใน ${idx + 1}`, 'exhibit-label');
    lbl.position.set(x, FY + 0.85, D / 2 - 0.22);
    zoneGroup.add(lbl);
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
  sculptures: {
    pos: [-6.2, 1.8, -0.82],
    target: [5.0, 1.2, -0.82],
  },
  promenade: {
    pos: [-3.8, 1.6, 0.45],
    target: [6.0, 1.5, 0.45],
  },
  inside_art: {
    pos: [2.1, 1.6, -0.3],
    target: [2.1, 1.55, D / 2],
  },
  s1_entry: {
    pos: [-3.8, 1.7, 0.6],
    target: [-3.8, 1.3, -0.82],
  },
  s3_center: {
    pos: [0.20, 1.7, 0.6],
    target: [0.20, 1.3, -0.82],
  },
  top: {
    pos: [0, 14.5, 0.001],
    target: [0, 0, 0],
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
  const toggleDims = document.getElementById('toggleDims');
  if (toggleDims) {
    toggleDims.checked = false;
    dimGroup.visible = false;
    toggleDims.addEventListener('change', e => dimGroup.visible = e.target.checked);
  }

  const toggleZones = document.getElementById('toggleZones');
  if (toggleZones) {
    toggleZones.checked = false;
    zoneGroup.visible = false;
    toggleZones.addEventListener('change', e => zoneGroup.visible = e.target.checked);
  }

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
      dimGroup.visible = false;
      zoneGroup.visible = false;
      transformControl.visible = false;
      renderer.render(scene, camera);
      const dataUrl = renderer.domElement.toDataURL('image/png');
      dimGroup.visible = toggleDims ? toggleDims.checked : false;
      zoneGroup.visible = toggleZones ? toggleZones.checked : false;
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
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ---------------------------------------------------------------------------
// Initialization & Render Loop
// ---------------------------------------------------------------------------
async function init() {
  setupLighting();
  buildArchitecture();

  // Load 3D model template and textures
  await loadFoxyModel();
  build6SculpturesInRow();
  await buildArtworks();
  buildDimensionsAndLabels();

  // Hide loader
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 400);
  }

  initUI();
  setLightMode('golden');

  // Start animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
    labelRenderer.render(scene, camera);
  }
  animate();
}

init();
