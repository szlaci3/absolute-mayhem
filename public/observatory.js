import * as THREE from 'three';
import {ground} from './engine.js';

const tau = Math.PI * 2;
const box = new THREE.BoxGeometry();
const cylinder = new THREE.CylinderGeometry(.5, .5, 1, 16);
const column = new THREE.CylinderGeometry(.43, .5, 1, 10);
const cone = new THREE.ConeGeometry(.5, 1, 12);
const globe = new THREE.SphereGeometry(.5, 20, 14);
const rubble = new THREE.DodecahedronGeometry(.5);
const gem = new THREE.OctahedronGeometry(.5);
const hoop = new THREE.TorusGeometry(.5, .024, 7, 48);
const engraving = new THREE.TorusGeometry(.5, .005, 4, 64);
const dome = new THREE.SphereGeometry(1, 32, 12, 0, tau, 0, Math.PI / 2);
const rib = new THREE.TorusGeometry(1, .016, 6, 24, Math.PI / 2);
const materials = new Map();
const pickOnly = new THREE.MeshBasicMaterial({visible:false});

function surface(color, metal = false, glow = false) {
  const key = color + (metal ? '-metal' : '') + (glow ? '-lit' : '');
  if (!materials.has(key)) {
    materials.set(key, new THREE.MeshStandardMaterial({
      color, roughness: metal ? .4 : .83, metalness: metal ? .38 : .04,
      emissive: glow ? color : 0, emissiveIntensity: glow ? .75 : 0, flatShading: true
    }));
  }
  return materials.get(key);
}
const limestone = surface('#cabfa3'), basalt = surface('#495f60'), slate = surface('#758a83');
const brass = surface('#d3a85a', true), bronze = surface('#86643e', true);
const copper = surface('#529a92', true), darkMetal = surface('#365358', true);
const amber = surface('#ffc86b', false, true), aqua = surface('#96efe0', false, true);
const ivory = surface('#eee1b2'), leather = surface('#513e38'), coat = surface('#e6703d');
const paving = ['#b4b399','#a1a88d','#b2ac92','#c1b79b','#a7af9c'].map(c => surface(c));

function piece(parent, geometry, material, x, y, z, width, height = width, depth = width) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(width, height, depth);
  parent.add(mesh);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
function group(parent, x, y, z) {
  const node = new THREE.Group();
  node.position.set(x, y, z);
  parent.add(node);
  return node;
}
function band(parent, material, x, y, z, diameter) {
  const mesh = piece(parent, hoop, material, x, y, z, diameter);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
function pillar(parent, x, z, height, width) {
  piece(parent, box, basalt, x, .09, z, width * 1.55, .18, width * 1.55);
  piece(parent, cylinder, limestone, x, .24, z, width * 1.35, .16, width * 1.35);
  piece(parent, column, slate, x, height / 2 + .13, z, width, height - .26, width);
  piece(parent, cylinder, brass, x, height - .1, z, width * 1.13, .09, width * 1.13);
  piece(parent, box, limestone, x, height, z, width * 1.44, .15, width * 1.44);
}
function arch(parent, x, z, scale, angle = 0) {
  const node = group(parent, x, -.75, z);
  node.rotation.y = angle;
  node.scale.setScalar(scale);
  for (const side of [-1, 1]) pillar(node, side, 0, 1.9, .46);
  for (let i = 0; i < 13; i++) {
    const a = (i + .5) * Math.PI / 13;
    const stone = piece(node, box, i % 4 === 2 ? slate : limestone,
      Math.cos(a), 1.97 + Math.sin(a), 0, .35, .29, .55);
    stone.rotation.z = a;
  }
}
function pavilion(parent) {
  const hall = group(parent, 2.5, -.65, .1);
  piece(hall, cylinder, basalt, 0, .17, 0, 4.25, .74, 4.25);
  piece(hall, cylinder, limestone, 0, .62, 0, 3.95, .18, 3.95);
  for (let i = 0; i < 8; i++) {
    const a = i * tau / 8;
    pillar(hall, 1.4 * Math.cos(a), 1.4 * Math.sin(a), 2.35, .38);
  }
  piece(hall, cylinder, basalt, 0, 2.47, 0, 3.8, .22, 3.8);
  piece(hall, cylinder, brass, 0, 2.62, 0, 3.94, .11, 3.94);
  piece(hall, dome, copper, 0, 2.69, 0, 1.89, 1.56, 1.89);
  for (let i = 0; i < 12; i++) {
    const seam = group(hall, 0, 2.7, 0);
    seam.rotation.y = i * tau / 12;
    piece(seam, rib, brass, 0, 0, 0, 1.9, 1.57, 1.9);
  }
  piece(hall, cone, bronze, 0, 4.44, 0, .27, .65, .27);
  piece(hall, hoop, brass, 0, 4.89, 0, .46);
  piece(hall, globe, amber, 0, 4.9, 0, .12);
}
function noise(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// A repeating cut-stone surface, drawn once and lit by the same sun as the models.
function stoneTexture() {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 128;
  const ctx = tile.getContext('2d');
  ctx.fillStyle = '#ebe8da';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2500; i++) {
    ctx.fillStyle = i % 3 ? '#524e4115' : '#fff9ed9a';
    ctx.fillRect(noise(i,1)*128, noise(i,2)*128, 1+noise(i,3)*3, 1);
  }
  ctx.strokeStyle = '#766d5757';
  ctx.lineWidth = 1.2;
  for (const [x,y] of [[0,31],[128,96]]) {
    const sign = x === 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x,y);
    for (const [dx,dy] of [[9,-4],[14,-1],[19,-8],[28,-11]]) ctx.lineTo(x+sign*dx,y+dy);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(tile);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function compass(parent, x, z, radius) {
  const dial = group(parent,x,.012,z);
  for (const diameter of [radius*2, radius*1.82, radius*.6]) {
    const ring = piece(dial,engraving,bronze,0,0,0,diameter,diameter,.1);
    ring.rotation.x = -Math.PI / 2;
  }
  for (let i=0; i<32; i++) {
    const spoke = group(dial,0,0,0);
    spoke.rotation.y = i*tau/32;
    piece(spoke,box,bronze,0,0,-radius*.96,.025,.012,i%4 ? .06 : .14);
    if (i%4 === 0) {
      piece(spoke,gem,i%8 ? slate : brass,0,0,-radius*.47,
        radius*.16,.012,radius*(i%8 ? .44 : .78));
    }
  }
}

// Fixed masonry shares geometry and materials across the entire archipelago.
function batchArchitecture(source, scene) {
  const batches = new Map();
  source.updateMatrixWorld(true);
  source.traverse(mesh => {
    if (!mesh.isMesh) return;
    const key = mesh.geometry.id + '/' + mesh.material.id;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(mesh);
  });
  for (const meshes of batches.values()) {
    const batch = new THREE.InstancedMesh(meshes[0].geometry, meshes[0].material, meshes.length);
    meshes.forEach((mesh, index) => batch.setMatrixAt(index, mesh.matrixWorld));
    batch.castShadow = batch.receiveShadow = true;
    scene.add(batch);
  }
}

export function buildRuins(scene) {
  const ruins = new THREE.Group();
  const patina = stoneTexture();
  for (const material of paving) material.map = patina;
  for (let x = 1; x <= 13; x++) for (let z = 2; z <= 8; z++) {
    if (!ground(x, z)) continue;
    const variation = noise(x, z);
    piece(ruins, box, basalt, x, -.52, z, 1, .84, 1);
    piece(ruins, box, paving[Math.floor(variation * paving.length)], x, -.075, z, .985, .15, .985);
    // Edge stones have a bronze survey line along the water.
    for (const [dx, dz] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      if (ground(x + dx, z + dz)) continue;
      piece(ruins, box, bronze, x + dx * .43, .005, z + dz * .43,
        dx ? .025 : .97, .012, dz ? .025 : .97);
    }
    if (variation > .63) {
      const inlay = piece(ruins, box, slate, x + .25, .002, z - .28, .13, .008, .13);
      inlay.rotation.y = Math.PI / 4;
    }
  }
  compass(ruins, 4, 5, 1.32);
  compass(ruins, 12, 4, .83);
  pavilion(ruins);
  arch(ruins, 11.5, .7, 1.16, -.12);
  arch(ruins, 14.7, -1.3, .84, -.12);
  arch(ruins, -2.4, 6.4, .72, Math.PI / 2);
  for (const [x,z,h] of [[-.4,2.1,1.8],[-.4,4,.9],[.2,8.7,1.25],[10.2,7.3,.9],[13.8,6.5,1.5]]) {
    pillar(group(ruins, x, -.75, z), 0, 0, h, .48);
  }
  // Submerged stepping stones, reeds and distant fragments break up the waterline.
  const reeds = surface('#859b71');
  for (let i = 0; i < 82; i++) {
    const x = noise(i, 17) * 36 - 11, z = noise(i, 29) * 27 - 9;
    if (ground(Math.round(x), Math.round(z)) || (x > 6 && x < 11 && z > 3 && z < 7)) continue;
    const stone = piece(ruins, rubble, basalt, x, -.72, z, .43 + noise(i, 3), .46, .42 + noise(i, 8));
    stone.rotation.y = i;
    if (i % 3 === 0) for (let j = 0; j < 5; j++) {
      const stem = piece(ruins, cone, reeds, x + noise(i,j) * .32, -.48, z + noise(j,i) * .3,
        .05, .32 + noise(i,j) * .36, .05);
      stem.rotation.z = noise(j,i) * .5 - .25;
    }
  }
  batchArchitecture(ruins, scene);
}

function plinth(parent, diameter) {
  piece(parent, cylinder, basalt, 0, .07, 0, diameter, .14, diameter);
  piece(parent, cylinder, limestone, 0, .17, 0, diameter * .85, .1, diameter * .85);
}
export function buildObject(kind) {
  const node = new THREE.Group();
  const active = new THREE.Group();
  node.add(active);
  let moving;
  if (kind === 'bridge') {
    for (const side of [-1, 1]) piece(node, box, bronze, 0, -.51, side * .39, .97, .085, .065);
    piece(active, box, copper, 0, -.06, 0, .99, .12, .96);
    for (const side of [-1,1]) piece(active, box, aqua, 0, .012, side * .42, .99, .024, .035);
    band(active, brass, 0, .016, 0, .33);
  } else if (kind === 'gate') {
    for (const side of [-1,1]) pillar(node, side * .38, 0, 1.16, .17);
    moving = group(node, 0, 0, 0);
    for (let i = -2; i <= 2; i++) piece(moving, column, brass, i * .14, .49, 0, .045, .98, .045);
    piece(moving, box, bronze, 0, .75, 0, .71, .07, .09);
  } else if (kind === 'plate') {
    piece(node, box, basalt, 0, .035, 0, .83, .07, .83);
    piece(node, cylinder, brass, 0, .09, 0, .72, .07, .72);
    band(node, ivory, 0, .13, 0, .46);
  } else if (kind === 'bell') {
    plinth(node, .75);
    for (const side of [-1,1]) piece(node, box, bronze, side * .3, .57, 0, .075, .75, .1);
    piece(node, box, brass, 0, .96, 0, .74, .085, .13);
    piece(node, column, brass, 0, .65, 0, .36, .44, .36);
    piece(node, cylinder, brass, 0, .44, 0, .46, .08, .46);
    piece(node, globe, bronze, 0, .37, 0, .12);
  } else if (kind === 'lamp') {
    plinth(node, .74);
    piece(node, column, bronze, 0, .57, 0, .15, .78, .15);
    piece(node, cylinder, brass, 0, .94, 0, .47, .1, .47);
    piece(node, gem, amber, 0, 1.17, 0, .34, .52, .34);
    for (const side of [-1,1]) piece(node, box, bronze, side * .19, 1.19, 0, .032, .45, .032);
    piece(node, cone, darkMetal, 0, 1.53, 0, .56, .25, .56);
  } else if (kind === 'relic' || kind === 'prism' || kind === 'portal') {
    const relic = kind === 'relic', portal = kind === 'portal';
    plinth(node, relic ? 1.14 : .78);
    piece(node, column, bronze, 0, .38, 0, .31, .37, .31);
    moving = group(node, 0, portal ? .94 : .89, 0);
    const outer = piece(moving, hoop, brass, 0, 0, 0, relic || portal ? 1.18 : .85);
    outer.rotation.set(.22, .22, .24);
    const inner = piece(moving, hoop, copper, 0, 0, 0, portal ? 1.05 : .86);
    inner.rotation.set(1.08, -.25, -.29);
    if (relic) {
      piece(moving, hoop, brass, 0, 0, 0, 1.02).rotation.y = 1.05;
      piece(moving, globe, amber, 0, 0, 0, .34);
      piece(moving, globe, ivory, .51, .18, 0, .13);
    } else if (!portal) piece(moving, gem, aqua, 0, 0, 0, .45, .97, .45);
  } else if (kind === 'console') {
    plinth(node, .85);
    piece(node, box, darkMetal, 0, .43, 0, .55, .49, .41);
    piece(node, box, copper, 0, .72, 0, .75, .15, .5).rotation.x = .25;
    piece(node, gem, aqua, 0, .84, 0, .17);
  } else {
    plinth(node, .72);
    piece(node, gem, aqua, 0, .63, 0, .53, .91, .46);
  }
  if (kind !== 'bridge') band(active, amber, 0, .024, 0, kind === 'relic' ? 1.2 : .87);
  // Select the interior of an armillary ring or the space under a bell's yoke, too.
  if (['relic','prism','portal','bell'].includes(kind)) {
    const envelope = new THREE.Mesh(globe, pickOnly);
    const size = kind === 'bell' ? .52 : .88;
    envelope.scale.set(size, size, size);
    envelope.position.y = kind === 'bell' ? .65 : .89;
    node.add(envelope);
  }
  return {node, active, moving, kind};
}
export function buildExplorer() {
  const node = new THREE.Group();
  band(node, ivory, 0, .025, 0, .63);
  for (const side of [-1,1]) piece(node, box, leather, side * .09, .12, .025, .13, .23, .2);
  piece(node, column, coat, 0, .47, 0, .46, .56, .35);
  piece(node, box, leather, 0, .48, -.18, .25, .26, .14);
  piece(node, globe, surface('#edbc8e'), 0, .85, 0, .3, .35, .3);
  piece(node, cylinder, bronze, 0, .98, 0, .48, .055, .48);
  piece(node, column, leather, 0, 1.055, 0, .33, .15, .33);
  piece(node, box, ivory, .13, .61, .13, .095, .3, .065).rotation.z = -.22;
  piece(node, cylinder, brass, .27, .32, .08, .036, .64, .036);
  return node;
}
