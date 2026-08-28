import * as THREE from 'three';
import { box, cyl, wheel, place, extrudeProfile, prismoid, insetOutline, merge, beltHull } from './geo.js';

/**
 * Shared construction kit for main battle tanks.
 *
 * Every vehicle in the atlas is assembled from these parametric builders, so the
 * differences between an Abrams and a T-90M live in numbers and outlines rather
 * than in duplicated geometry code.
 */

// ---------------------------------------------------------------------- hull

/**
 * Side profile of a modern MBT hull: flat belly, short lower nose plate, one long
 * shallow glacis, flat fighting-compartment deck and a lower engine deck aft.
 */
export function hullProfile(P) {
  const engineDeckY = P.engineDeckY ?? P.deckY;
  return [
    [P.rear, P.floorY],
    [P.front - 0.18, P.floorY],
    [P.front, P.noseY],
    [P.front - P.glacisRun, P.deckY],
    [P.engineDeckZ, P.deckY],
    [P.engineDeckZ - 0.14, engineDeckY],
    [P.rear, engineDeckY],
  ];
}

export function hullSolid(P) {
  return extrudeProfile(hullProfile(P), P.width);
}

/**
 * Side skirt hanging outboard of the tracks, split into bolted panels.
 * Real skirts are segmented so a damaged plate can be swapped, and the seams are
 * what make the flank read as armour rather than as a blank slab.
 */
export function sideSkirt({ x, front, rear, top, bottom, thickness = 0.05, panels = 6, gap = 0.03 }) {
  const parts = [box(thickness + 0.03, 0.06, front - rear, [x, top, (front + rear) / 2])];
  const step = (front - rear) / panels;
  for (let i = 0; i < panels; i++) {
    const a = front - i * step;
    parts.push(box(thickness, top - bottom, step - gap, [x, (top + bottom) / 2, a - step / 2]));
    parts.push(box(thickness + 0.025, top - bottom - 0.12, 0.04, [x, (top + bottom) / 2, a - step + gap / 2]));
  }
  return merge(parts);
}

// -------------------------------------------------------------------- turret

/**
 * Turret shell as a prismoid: a bottom outline at the ring and an inset top
 * outline at the roof, which is how sloped modern turret walls actually read.
 *
 * @param {object} spec
 * @param {Array<[number,number]>} spec.outline bottom outline in (x, z), turret-local
 * @param {number} spec.y0 ring height
 * @param {number} spec.height wall height
 * @param {number} [spec.inset] how far the roof plate is pulled in
 * @param {Array<[number,number]>} [spec.roof] explicit roof outline, overrides inset
 */
export function turretShell({ outline, y0, height, inset = 0.08, roof = null }) {
  return prismoid(outline, roof || insetOutline(outline, inset), y0, y0 + height);
}

/** Wedge (Vorpanzer) armour block: the Leopard 2A7's arrowhead cheeks. */
export function wedgeArmour({ x, z, y, length, height, spread, thickness }) {
  const half = spread / 2;
  const bottom = [
    [x - half, z],
    [x + half, z],
    [x + half - thickness, z - length],
    [x - half + thickness, z - length],
  ];
  const top = bottom.map(([bx, bz]) => [bx * 0.98, bz]);
  return prismoid(bottom, top, y, y + height);
}

/** Bolt-on ERA bricks tiled across a plane. */
export function eraPatch({ origin, u, v, nu, nv, brick, gap = 0.02, jitter = 0 }) {
  const parts = [];
  const U = new THREE.Vector3().fromArray(u);
  const V = new THREE.Vector3().fromArray(v);
  const O = new THREE.Vector3().fromArray(origin);
  const stepU = U.length() / nu;
  const stepV = V.length() / nv;
  const un = U.clone().normalize();
  const vn = V.clone().normalize();
  const normal = new THREE.Vector3().crossVectors(un, vn).normalize();
  const m = new THREE.Matrix4().makeBasis(un, vn, normal);

  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const g = box(stepU - gap, stepV - gap, brick);
      g.applyMatrix4(m);
      const p = O.clone()
        .addScaledVector(un, (i + 0.5) * stepU)
        .addScaledVector(vn, (j + 0.5) * stepV)
        .addScaledVector(normal, brick / 2 + (jitter ? (i % 2) * jitter : 0));
      g.translate(p.x, p.y, p.z);
      parts.push(g);
    }
  }
  return merge(parts);
}

/**
 * Tile ERA bricks along chosen edges of a turret outline, wrapping the armour
 * around the shape the way the Relikt "fish scale" blocks follow a T-90 turret.
 *
 * @param {object} spec
 * @param {Array<[number,number]>} spec.outline turret plan outline in (x, z)
 * @param {number[]} spec.indices which edges to cover
 */
export function eraAlongOutline({ outline, indices, y0, height, rows = 2, brick = 0.1, gap = 0.03, colWidth = 0.34 }) {
  const cx = outline.reduce((s, p) => s + p[0], 0) / outline.length;
  const cz = outline.reduce((s, p) => s + p[1], 0) / outline.length;
  const parts = [];
  for (const i of indices) {
    let [x0, z0] = outline[i];
    let [x1, z1] = outline[(i + 1) % outline.length];
    let dx = x1 - x0;
    let dz = z1 - z0;
    // eraPatch's normal is u × v = (-dz, 0, dx); flip the edge if that points inward.
    const mx = (x0 + x1) / 2 - cx;
    const mz = (z0 + z1) / 2 - cz;
    if (-dz * mx + dx * mz < 0) {
      [x0, x1] = [x1, x0];
      [z0, z1] = [z1, z0];
      dx = -dx;
      dz = -dz;
    }
    const len = Math.hypot(dx, dz);
    if (len < 0.12) continue;
    parts.push(
      eraPatch({
        origin: [x0, y0, z0],
        u: [dx, 0, dz],
        v: [0, height, 0],
        nu: Math.max(1, Math.round(len / colWidth)),
        nv: rows,
        brick,
        gap,
      }),
    );
  }
  return merge(parts);
}

/** Slat / cage armour panel: frame plus vertical bars. */
export function slatPanel({ origin, u, v, bars = 10, barThickness = 0.03 }) {
  const parts = [];
  const U = new THREE.Vector3().fromArray(u);
  const V = new THREE.Vector3().fromArray(v);
  const O = new THREE.Vector3().fromArray(origin);
  const un = U.clone().normalize();
  const vn = V.clone().normalize();
  const normal = new THREE.Vector3().crossVectors(un, vn).normalize();
  const m = new THREE.Matrix4().makeBasis(un, vn, normal);

  for (let i = 0; i <= bars; i++) {
    const g = box(barThickness, V.length(), barThickness);
    g.applyMatrix4(m);
    const p = O.clone().addScaledVector(un, (i / bars) * U.length()).addScaledVector(vn, V.length() / 2);
    g.translate(p.x, p.y, p.z);
    parts.push(g);
  }
  for (const t of [0.02, 0.98]) {
    const g = box(U.length(), barThickness * 1.4, barThickness * 1.4);
    g.applyMatrix4(m);
    const p = O.clone().addScaledVector(un, U.length() / 2).addScaledVector(vn, t * V.length());
    g.translate(p.x, p.y, p.z);
    parts.push(g);
  }
  return merge(parts);
}

/** Woven anti-RPG mesh screen, drawn as a coarse grid so it reads at blueprint scale. */
export function meshScreen({ origin, u, v, nu = 8, nv = 4, wire = 0.018 }) {
  return merge([
    slatPanel({ origin, u, v, bars: nu, barThickness: wire }),
    slatPanel({ origin, u: v, v: u, bars: nv, barThickness: wire }),
  ]);
}

// ------------------------------------------------------------------ armament

/**
 * Main gun. Smoothbore guns get a bore evacuator bulge; the Challenger's rifled
 * L30A1 gets a full-length thermal sleeve with muzzle reference mirror instead.
 */
export function mainGun({
  length,
  radius = 0.075,
  breechRadius = 0.13,
  evacuator = { z: 0.45, radius: 0.16, length: 0.62 },
  thermalSleeve = false,
  muzzleRing = true,
}) {
  const parts = [];
  const axial = (r0, r1, len, z, seg = 20) => cyl(r0, r1, len, seg, [0, 0, z], [Math.PI / 2, 0, 0]);

  parts.push(axial(breechRadius, breechRadius, 0.34, 0.17));
  if (thermalSleeve) {
    parts.push(axial(radius * 1.5, radius * 1.55, length * 0.82, 0.34 + (length * 0.82) / 2));
    parts.push(axial(radius, radius, length * 0.2, length * 0.92));
    // Muzzle reference mirror box near the tip.
    parts.push(box(0.12, 0.1, 0.1, [0, radius * 1.8, length * 0.86]));
  } else {
    parts.push(axial(radius * 1.12, breechRadius, length * 0.4, 0.34 + length * 0.2));
    parts.push(axial(radius, radius * 1.12, length * 0.6, 0.34 + length * 0.7));
    const e = evacuator;
    parts.push(axial(e.radius, e.radius, e.length, length * e.z, 22));
    parts.push(axial(e.radius * 0.86, e.radius * 0.86, 0.05, length * e.z - e.length / 2, 22));
    parts.push(axial(e.radius * 0.86, e.radius * 0.86, 0.05, length * e.z + e.length / 2, 22));
  }
  if (muzzleRing) {
    parts.push(axial(radius * 1.22, radius * 1.22, 0.09, length + 0.04, 22));
  }
  return merge(parts);
}

/** Gun mantlet / trunnion housing. */
export function mantlet({ width, height, depth, boreRadius = 0.2 }) {
  return merge([
    box(width, height, depth, [0, 0, depth / 2 - 0.02]),
    cyl(boreRadius, boreRadius, depth * 0.7, 22, [0, 0, depth * 0.8], [Math.PI / 2, 0, 0]),
    box(width * 0.9, height * 0.22, depth * 0.4, [0, -height / 2, depth / 2]),
  ]);
}

/** Bank of smoke grenade dischargers. */
export function smokeBank({ x, y, z, count = 4, tube = 0.055, length = 0.3, spread = 0.11, tilt = -0.5, yaw = 0 }) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const g = cyl(tube, tube, length, 10, [0, 0, 0], [Math.PI / 2 + tilt, 0, 0]);
    g.rotateY(yaw);
    g.translate(x + Math.cos(yaw) * (i - (count - 1) / 2) * spread, y, z - Math.sin(yaw) * (i - (count - 1) / 2) * spread);
    parts.push(g);
  }
  parts.push(box(count * spread + 0.04, 0.06, 0.1, [x, y - length * 0.42, z - 0.08]));
  return merge(parts);
}

// --------------------------------------------------------------- running gear

/**
 * Wheels, rollers, sprocket and idler for one side, plus the circles the track
 * belt must wrap. Returns plain data so each vehicle can name and group the parts.
 */
export function runningGear(S, side) {
  const items = [];
  const circles = [];
  const ride = S.wheelRadius + S.linkThickness + S.cleatDepth;

  const roadWheel = merge([
    wheel(S.wheelRadius, S.wheelWidth, 24, [-S.wheelWidth * 0.62, 0, 0]),
    wheel(S.wheelRadius, S.wheelWidth, 24, [S.wheelWidth * 0.62, 0, 0]),
    wheel(S.wheelRadius * 0.55, S.wheelWidth * 2.4, 18),
    wheel(S.wheelRadius * 0.2, S.wheelWidth * 3.4, 10),
    wheel(0.075, 0.3, 8, [-side * 0.2, 0, 0]),
  ]);

  for (let i = 0; i < S.wheelCount; i++) {
    const z = S.wheelFirstZ - i * S.wheelPitch;
    items.push({ kind: 'wheel', index: i + 1, geometry: roadWheel, at: [side * S.wheelX, ride, z], radius: S.wheelRadius });
    circles.push({ z, y: ride, r: S.wheelRadius + S.linkThickness / 2 });
  }

  const roller = merge([
    wheel(S.rollerRadius, S.wheelWidth * 0.8, 16, [-S.wheelWidth * 0.5, 0, 0]),
    wheel(S.rollerRadius, S.wheelWidth * 0.8, 16, [S.wheelWidth * 0.5, 0, 0]),
    wheel(0.05, 0.26, 8, [-side * 0.16, 0, 0]),
  ]);
  for (const z of S.returnRollers || []) {
    items.push({ kind: 'roller', geometry: roller, at: [side * (S.rollerX ?? S.wheelX), S.rollerY, z], radius: S.rollerRadius });
    circles.push({ z, y: S.rollerY, r: S.rollerRadius + S.linkThickness / 2 });
  }

  const sp = S.sprocket;
  const teeth = [];
  for (let i = 0; i < sp.teeth; i++) {
    const a = (i / sp.teeth) * Math.PI * 2;
    const t = box(sp.width * 0.9, 0.12, 0.06);
    t.rotateX(-a);
    t.translate(0, Math.sin(a) * (sp.r - 0.04), Math.cos(a) * (sp.r - 0.04));
    teeth.push(t);
  }
  items.push({
    kind: 'sprocket',
    geometry: merge([
      wheel(sp.r * 0.8, sp.width, 26),
      wheel(sp.r * 0.45, sp.width + 0.05, 18),
      wheel(0.1, 0.3, 10, [-side * 0.18, 0, 0]),
      ...teeth,
    ]),
    at: [side * S.trackCentre, sp.y, sp.z],
    radius: sp.r,
  });
  circles.push({ z: sp.z, y: sp.y, r: sp.r + S.linkThickness / 2 });

  const id = S.idler;
  const spokes = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const s = box(id.width * 0.7, id.r * 0.9, 0.05);
    s.rotateX(-a);
    s.translate(0, Math.sin(a) * id.r * 0.5, Math.cos(a) * id.r * 0.5);
    spokes.push(s);
  }
  items.push({
    kind: 'idler',
    geometry: merge([
      wheel(id.r, id.width, 24, [-id.width * 0.6, 0, 0]),
      wheel(id.r, id.width, 24, [id.width * 0.6, 0, 0]),
      wheel(id.r * 0.4, id.width * 2.2, 14),
      wheel(0.09, 0.28, 8, [-side * 0.16, 0, 0]),
      ...spokes,
    ]),
    at: [side * S.trackCentre, id.y, id.z],
    radius: id.r,
  });
  circles.push({ z: id.z, y: id.y, r: id.r + S.linkThickness / 2 });

  return { items, circles: beltHull(circles, 128), ride };
}

/** One track link: pad, rubber block, centre guide horn and connectors. */
export function trackLink(S) {
  const w = S.trackWidth;
  const t = S.linkThickness;
  const pitch = S.linkPitch * 0.92;
  return merge([
    box(w, t, pitch),
    box(0.09, 0.1, 0.085, [0, t * 0.95, 0]),
    box(w * 0.86, S.cleatDepth, pitch * 0.62, [0, -(t + S.cleatDepth) / 2, 0]),
    box(0.06, t * 1.5, pitch * 0.5, [w * 0.45, 0, pitch * 0.32]),
    box(0.06, t * 1.5, pitch * 0.5, [-w * 0.45, 0, pitch * 0.32]),
  ]);
}

// --------------------------------------------------------------- deck fittings

/** Louvred engine deck grille. */
export function grille({ x, y, z, width, depth, louvres = 6, frame = 0.05 }) {
  const parts = [
    box(width, 0.04, frame, [x, y, z + depth / 2]),
    box(width, 0.04, frame, [x, y, z - depth / 2]),
    box(frame, 0.04, depth, [x + width / 2, y, z]),
    box(frame, 0.04, depth, [x - width / 2, y, z]),
  ];
  for (let i = 0; i < louvres; i++) {
    const zz = z - depth / 2 + ((i + 0.5) * depth) / louvres;
    parts.push(box(width - frame, 0.035, depth / louvres / 2.6, [x, y + 0.02, zz]));
  }
  return merge(parts);
}

/** Round crew hatch with periscope blocks around the rim. */
export function hatch({ x, y, z, radius, periscopes = 3, hinge = true }) {
  const parts = [cyl(radius, radius, 0.07, 22, [x, y + 0.02, z]), cyl(radius * 1.14, radius * 1.14, 0.035, 22, [x, y, z])];
  for (let i = 0; i < periscopes; i++) {
    const a = -0.9 + (i / Math.max(1, periscopes - 1)) * 1.8;
    parts.push(
      place(box(0.14, 0.07, 0.08), [x + Math.sin(a) * radius * 1.3, y + 0.05, z + Math.cos(a) * radius * 1.3], [0, a, 0]),
    );
  }
  if (hinge) parts.push(box(0.1, 0.05, 0.16, [x, y + 0.06, z - radius * 1.1]));
  return merge(parts);
}

/** Commander's panoramic sight head. */
export function panoramicSight({ x, y, z, width = 0.34, height = 0.36, depth = 0.34 }) {
  return merge([
    cyl(width / 2, width / 2, height * 0.55, 18, [x, y + height * 0.28, z]),
    box(width * 0.96, height * 0.42, depth, [x, y + height * 0.72, z]),
    box(width * 0.5, height * 0.24, 0.05, [x, y + height * 0.72, z + depth / 2]),
    cyl(0.05, 0.05, 0.12, 10, [x, y + height * 0.95, z]),
  ]);
}

/** Remote weapon station or pintle machine gun. */
export function weaponStation({ x, y, z, remote = true }) {
  const parts = [
    cyl(0.17, 0.2, 0.16, 16, [x, y + 0.08, z]),
    box(0.34, 0.2, 0.42, [x, y + 0.26, z]),
    cyl(0.03, 0.03, 0.62, 8, [x, y + 0.26, z + 0.42], [Math.PI / 2, 0, 0]),
    box(0.16, 0.14, 0.26, [x - 0.2, y + 0.28, z - 0.02]),
  ];
  if (remote) parts.push(box(0.2, 0.16, 0.1, [x + 0.22, y + 0.3, z + 0.04]));
  return merge(parts);
}

/** Stowage basket built from a frame and mesh, used on turret bustles. */
export function stowageBasket({ x, y, z, width, height, depth, bars = 6 }) {
  const parts = [
    box(width, 0.04, depth, [x, y - height / 2, z]),
    box(width, height, 0.04, [x, y, z - depth / 2]),
  ];
  for (let i = 0; i <= bars; i++) {
    const xx = x - width / 2 + (i / bars) * width;
    parts.push(box(0.03, height, 0.03, [xx, y, z - depth / 2]));
  }
  for (const s of [-1, 1]) {
    parts.push(box(0.03, height, depth, [x + (s * width) / 2, y, z]));
  }
  parts.push(box(width, 0.04, 0.04, [x, y + height / 2, z]));
  return merge(parts);
}
