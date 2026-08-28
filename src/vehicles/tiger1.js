import {
  box,
  cyl,
  wheel,
  place,
  extrudeProfile,
  extrudePlan,
  bothSides,
  mirrorX,
  merge,
  beltHull,
} from '../geo.js';
import { VehicleBuilder } from '../vehicle.js';
import {
  dieselEngine,
  transmission,
  ammoRack,
  gunBreech,
  crewSeated,
  torsionBars,
  fuelCell,
} from '../internals.js';
import * as THREE from 'three';

/**
 * Panzerkampfwagen VI Ausf. E — "Tiger I", mid production (approx. Fgst. Nr. 250400,
 * summer 1943): steel road wheels, no Feifel air cleaners, single commander's cupola
 * with vision slits, 725 mm Gefechtsketten combat tracks.
 *
 * The odd one out in the atlas: front drive sprockets, a front-mounted gearbox with
 * a driveshaft running through the fighting compartment, and interleaved road wheels.
 */
export const PARAMS = {
  // --- Hull envelope (spec: 6.316 m long, 3.705 m wide, 3.0 m tall, 470 mm clearance)
  hullFront: 3.16,
  hullRear: -3.16,
  tubWidth: 2.26, // hull tub, i.e. the span between the two tracks
  superWidth: 3.42, // sponsons overhang the tracks — the Tiger's signature
  floorY: 0.47,
  sponsonY: 1.03,
  roofY: 1.62,

  // --- Turret (spec: 1830 mm turret ring)
  turretZ: 0.3,
  turretHeight: 0.86,
  turretHalfWidth: 1.15,
  turretFront: 1.05,
  turretRearArc: -0.35,

  // --- 8.8 cm KwK 36 L/56
  gunAxisY: 2.05,
  gunPivotZ: 0.95,
  barrelLength: 3.03,
  barrelRadius: 0.099,
  muzzleBrakeLength: 0.44,
  muzzleBrakeRadius: 0.152,

  // --- Running gear (Schachtellaufwerk: 8 torsion-bar axles, triple interleaved wheels)
  roadWheelRadius: 0.4,
  roadWheelWidth: 0.088,
  axleCount: 8,
  axleFrontZ: 2.05,
  axlePitch: 0.6,
  wheelRows: { inboard: 1.26, outerNear: 1.74, outerFar: 1.6 },
  sprocket: { z: 2.66, y: 0.62, r: 0.42, width: 0.17, teeth: 18 },
  idler: { z: -2.72, y: 0.5, r: 0.32, width: 0.15 },

  // --- Tracks (spec: 725 mm wide, 130 mm link pitch, 96 links per side)
  trackCentre: 1.4925,
  trackWidth: 0.725,
  linkPitch: 0.138,
  linkThickness: 0.04,
  cleatDepth: 0.022,
};

const rideHeight = (P) => P.roadWheelRadius + P.linkThickness + P.cleatDepth;
const axleZ = (P, i) => P.axleFrontZ - i * P.axlePitch;

function roadWheelGeometry(P, inwards) {
  const r = P.roadWheelRadius;
  const w = P.roadWheelWidth;
  return merge([
    wheel(r, w, 24),
    wheel(r * 0.72, w + 0.02, 20),
    wheel(r * 0.28, w + 0.05, 12),
    wheel(r * 0.1, 0.22, 8, [-inwards * 0.13, 0, 0]),
  ]);
}

function sprocketGeometry(P, inwards) {
  const s = P.sprocket;
  const parts = [
    wheel(s.r * 0.78, s.width, 26),
    wheel(s.r * 0.42, s.width + 0.04, 18),
    wheel(0.1, 0.24, 10, [-inwards * 0.16, 0, 0]),
  ];
  for (let i = 0; i < s.teeth; i++) {
    const a = (i / s.teeth) * Math.PI * 2;
    const g = box(s.width * 0.42, 0.14, 0.07);
    g.rotateX(-a);
    g.translate(0, Math.sin(a) * (s.r - 0.05), Math.cos(a) * (s.r - 0.05));
    parts.push(g, place(g.clone(), [s.width * 0.42, 0, 0]), place(g.clone(), [-s.width * 0.42, 0, 0]));
  }
  return merge(parts);
}

function idlerGeometry(P, inwards) {
  const s = P.idler;
  const parts = [
    wheel(s.r, s.width, 24),
    wheel(s.r * 0.55, s.width + 0.03, 16),
    wheel(0.09, 0.22, 10, [-inwards * 0.15, 0, 0]),
  ];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const g = box(s.width * 0.5, s.r * 0.9, 0.06);
    g.rotateX(-a);
    g.translate(0, Math.sin(a) * s.r * 0.5, Math.cos(a) * s.r * 0.5);
    parts.push(g);
  }
  return merge(parts);
}

function linkGeometry(P) {
  const w = P.trackWidth;
  const t = P.linkThickness;
  const pitch = 0.13;
  return merge([
    box(w, t, pitch),
    box(0.075, 0.085, 0.07, [0, t * 0.9, 0]),
    box(w * 0.9, P.cleatDepth, pitch * 0.45, [0, -(t + P.cleatDepth) / 2, 0]),
    box(0.05, t * 1.4, pitch * 0.55, [w * 0.44, 0, pitch * 0.3]),
    box(0.05, t * 1.4, pitch * 0.55, [-w * 0.44, 0, pitch * 0.3]),
  ]);
}

export function build(meta, P = PARAMS) {
  const b = new VehicleBuilder(meta, { turretZ: P.turretZ, gunAxisY: P.gunAxisY, gunPivotZ: P.gunPivotZ });
  const ride = rideHeight(P);

  // ------------------------------------------------------------------ hull tub
  b.addHull({
    tag: 'hull',
    geometry: extrudeProfile(
      [
        [-2.95, P.floorY],
        [2.72, P.floorY],
        [P.hullFront, 0.78],
        [P.hullFront, P.sponsonY],
        [P.hullRear, P.sponsonY],
        [P.hullRear, 0.86],
      ],
      P.tubWidth,
    ),
    name: 'LOWER HULL TUB',
    cn: '下部车体 / 装甲浴缸',
    spec: '100 mm nose · 60 mm side · 26 mm floor',
    explode: [0, 0, 0],
  });

  b.addHull({
    tag: 'sponson',
    geometry: extrudeProfile(
      [
        [P.hullRear, P.sponsonY],
        [2.52, P.sponsonY],
        [2.42, P.roofY],
        [P.hullRear, P.roofY],
      ],
      P.superWidth,
    ),
    name: 'SUPERSTRUCTURE / SPONSON BOX',
    cn: '上部车体 / 悬垂侧裙',
    spec: '100 mm driver plate at 9° · sponsons overhang both tracks',
    explode: [0, 0.95, 0],
  });

  b.addHull({
    geometry: merge([
      box(0.42, 0.2, 0.07, [0.62, 1.4, 2.56]),
      box(0.3, 0.05, 0.03, [0.62, 1.4, 2.61]),
      cyl(0.17, 0.17, 0.08, 20, [-0.62, 1.28, 2.56], [Math.PI / 2, 0, 0]),
      cyl(0.1, 0.14, 0.1, 18, [-0.62, 1.28, 2.64], [Math.PI / 2, 0, 0]),
      cyl(0.035, 0.035, 0.3, 10, [-0.62, 1.28, 2.8], [Math.PI / 2, 0, 0]),
      cyl(0.085, 0.085, 0.12, 14, [0, 1.16, 2.9], [Math.PI / 2, 0, 0]),
      box(0.06, 0.1, 0.06, [0, 1.08, 2.9]),
      bothSides(merge([box(0.1, 0.24, 0.3, [0.82, 0.66, 3.16]), box(0.26, 0.1, 0.12, [0.82, 0.72, 3.28])])),
    ]),
    name: 'DRIVER VISOR · MG 34 BALL MOUNT · NOTEK',
    cn: '驾驶员观察窗 / 车体机枪球形座 / 夜行灯',
    spec: 'Fahrersehklappe 50 mm · Kugelblende 100 mm',
    explode: [0, 0, 1.5],
    soft: true,
  });

  const hatchAt = (x, z, r) =>
    merge([cyl(r, r, 0.07, 20, [x, P.roofY + 0.02, z]), cyl(r * 1.15, r * 1.15, 0.03, 20, [x, P.roofY - 0.01, z])]);
  b.addHull({
    geometry: merge([
      hatchAt(0.72, 1.95, 0.3),
      hatchAt(-0.72, 1.95, 0.3),
      box(0.16, 0.09, 0.12, [0.95, P.roofY + 0.04, 2.2]),
      box(0.16, 0.09, 0.12, [-0.95, P.roofY + 0.04, 2.2]),
    ]),
    name: 'DRIVER & RADIO OPERATOR HATCHES',
    cn: '驾驶员 / 无线电员舱盖',
    spec: 'Two hinged circular hatches with rotating periscopes',
    explode: [0, 1.55, 0],
    soft: true,
  });

  const guard = (z, dir) =>
    merge([
      box(0.74, 0.04, 0.34, [P.trackCentre, P.sponsonY + 0.02, z]),
      box(0.74, 0.16, 0.05, [P.trackCentre, P.sponsonY - 0.05, z + dir * 0.16]),
    ]);
  b.addHull({
    geometry: merge([guard(3.16, 1), mirrorX(guard(3.16, 1)), guard(-3.2, -1), mirrorX(guard(-3.2, -1))]),
    name: 'HINGED TRACK GUARDS',
    cn: '前后履带挡泥板',
    spec: 'Folding mudguards, front and rear',
    explode: [0, 0.4, 0],
    soft: true,
  });

  const sponsonTop = P.roofY + 0.02;
  b.addHull({
    geometry: merge([
      cyl(0.026, 0.026, 2.3, 8, [1.55, sponsonTop, 0.1], [Math.PI / 2, 0, 0]),
      cyl(0.026, 0.026, 2.3, 8, [-1.55, sponsonTop, -0.3], [Math.PI / 2, 0, 0]),
      box(0.2, 0.14, 0.52, [1.5, sponsonTop + 0.06, -1.7]),
      box(0.2, 0.14, 0.52, [-1.5, sponsonTop + 0.06, -1.9]),
      box(0.16, 0.16, 0.3, [1.5, sponsonTop + 0.07, 1.6]),
      cyl(0.07, 0.07, 0.42, 12, [-1.52, sponsonTop + 0.09, 1.5], [Math.PI / 2, 0, 0]),
    ]),
    name: 'SPONSON STOWAGE & TOW CABLES',
    cn: '侧裙工具箱与拖曳钢缆',
    spec: 'Tow cables, tool bins and the fire extinguisher',
    explode: [0, 1.7, 0],
    soft: true,
    note: 'probable — exact stowage varied between vehicles',
  });

  // ------------------------------------------------------------- turret shell
  const hw = P.turretHalfWidth;
  const t = new THREE.Shape();
  t.moveTo(-0.62, P.turretFront);
  t.lineTo(0.62, P.turretFront);
  t.lineTo(hw, P.turretFront - 0.4);
  t.lineTo(hw, P.turretRearArc);
  t.absarc(0, P.turretRearArc, hw, 0, -Math.PI, true);
  t.lineTo(-hw, P.turretFront - 0.4);
  t.closePath();
  const shell = extrudePlan(t, P.turretHeight, { curveSegments: 24 });
  shell.translate(0, P.roofY, 0);
  b.addTurret({
    tag: 'turret',
    geometry: shell,
    name: 'TURRET SHELL (HORSESHOE)',
    cn: '马蹄形炮塔壳体',
    spec: '100 mm front · 80 mm sides and rear · 1830 mm ring',
    explode: [0, 1.5, 0],
  });

  const cupolaTop = P.roofY + P.turretHeight;
  const cupolaParts = [
    cyl(0.29, 0.29, 0.34, 22, [0.5, cupolaTop + 0.15, -0.5]),
    cyl(0.33, 0.33, 0.05, 22, [0.5, cupolaTop + 0.34, -0.5]),
    cyl(0.27, 0.27, 0.06, 22, [0.5, cupolaTop + 0.4, -0.5]),
    box(0.1, 0.05, 0.24, [0.5, cupolaTop + 0.44, -0.62]),
  ];
  for (let i = 0; i < 5; i++) {
    const a = -1.1 + (i / 4) * 2.2;
    cupolaParts.push(
      place(box(0.11, 0.08, 0.05), [0.5 + Math.sin(a) * 0.29, cupolaTop + 0.17, -0.5 + Math.cos(a) * 0.29], [0, a, 0]),
    );
  }
  b.addTurret({
    tag: 'cupola',
    geometry: merge(cupolaParts),
    name: "COMMANDER'S CUPOLA",
    cn: '车长指挥塔',
    spec: 'Five armoured vision slits · single-piece hinged hatch',
    explode: [0, 2.2, 0],
  });

  const linkRack = [];
  for (let i = 0; i < 3; i++) {
    const z = 0.35 - i * 0.34;
    linkRack.push(box(0.06, 0.16, 0.28, [hw + 0.03, P.roofY + 0.24, z]));
    linkRack.push(box(0.06, 0.16, 0.28, [-hw - 0.03, P.roofY + 0.24, z]));
  }
  b.addTurret({
    geometry: merge([
      cyl(0.27, 0.27, 0.06, 20, [-0.46, cupolaTop + 0.02, -0.4]),
      cyl(0.14, 0.14, 0.08, 16, [0, cupolaTop + 0.03, -0.05]),
      cyl(0.26, 0.26, 0.07, 20, [-0.3, P.roofY + 0.42, -1.35], [Math.PI / 2, 0, 0]),
      cyl(0.05, 0.05, 0.06, 10, [hw, P.roofY + 0.42, -0.8], [0, 0, Math.PI / 2]),
      ...linkRack,
    ]),
    name: 'ROOF FITTINGS & SPARE LINK RACKS',
    cn: '炮塔顶部装置 / 备用履带板',
    spec: 'Loader hatch · ventilator · escape hatch · three spare links per side',
    explode: [0, 1.9, 0],
    soft: true,
  });

  // ---------------------------------------------------------------- armament
  b.addGun({
    geometry: merge([
      box(1.12, 0.58, 0.3, [0, 0, 0.24]),
      cyl(0.24, 0.24, 0.34, 22, [0, 0, 0.42], [Math.PI / 2, 0, 0]),
      box(1.12, 0.14, 0.12, [0, -0.29, 0.24]),
      cyl(0.05, 0.05, 0.24, 10, [-0.36, -0.03, 0.5], [Math.PI / 2, 0, 0]),
    ]),
    name: 'GUN MANTLET (TURMBLENDE)',
    cn: '火炮防盾',
    spec: '100–120 mm cast mantlet with coaxial MG 34',
    explode: [0, 0, 0.9],
  });

  const bz = 0.55;
  b.addGun({
    tag: 'barrel',
    geometry: merge([
      cyl(0.115, 0.115, 0.3, 20, [0, 0, bz + 0.15], [Math.PI / 2, 0, 0]),
      cyl(P.barrelRadius, P.barrelRadius, 1.5, 20, [0, 0, bz + 1.05], [Math.PI / 2, 0, 0]),
      cyl(0.084, P.barrelRadius, 0.12, 20, [0, 0, bz + 1.86], [Math.PI / 2, 0, 0]),
      cyl(0.084, 0.084, P.barrelLength - 1.92, 20, [0, 0, bz + 1.92 + (P.barrelLength - 1.92) / 2], [Math.PI / 2, 0, 0]),
    ]),
    name: '8.8 CM KWK 36 L/56 BARREL',
    cn: '88 毫米 KwK 36 L/56 炮管',
    spec: 'L/56 · 4930 mm tube',
    explode: [0, 0, 1.9],
  });

  const mz = bz + P.barrelLength + P.muzzleBrakeLength / 2;
  b.addGun({
    geometry: merge([
      cyl(P.muzzleBrakeRadius, P.muzzleBrakeRadius, P.muzzleBrakeLength, 22, [0, 0, mz], [Math.PI / 2, 0, 0]),
      cyl(0.17, 0.17, 0.05, 22, [0, 0, mz - P.muzzleBrakeLength / 2], [Math.PI / 2, 0, 0]),
      cyl(0.16, 0.16, 0.04, 22, [0, 0, mz + P.muzzleBrakeLength / 2], [Math.PI / 2, 0, 0]),
      box(0.34, 0.14, 0.13, [0, 0, mz - 0.05]),
      box(0.34, 0.14, 0.13, [0, 0, mz + 0.12]),
    ]),
    name: 'DOUBLE-BAFFLE MUZZLE BRAKE',
    cn: '双室炮口制退器',
    spec: 'Two-chamber brake, ~70% recoil reduction',
    explode: [0, 0, 2.6],
  });

  // -------------------------------------------------------------- engine deck
  b.addHull({
    assembly: 'power',
    tag: 'deck',
    geometry: merge([
      cyl(0.34, 0.34, 0.06, 22, [0, P.roofY + 0.01, -2.0]),
      cyl(0.3, 0.3, 0.05, 20, [1.12, P.roofY + 0.01, -1.45]),
      cyl(0.3, 0.3, 0.05, 20, [-1.12, P.roofY + 0.01, -1.45]),
      cyl(0.3, 0.3, 0.05, 20, [1.12, P.roofY + 0.01, -2.55]),
      cyl(0.3, 0.3, 0.05, 20, [-1.12, P.roofY + 0.01, -2.55]),
      box(0.5, 0.05, 0.34, [0, P.roofY + 0.02, -1.2]),
    ]),
    name: 'ENGINE DECK & RADIATOR COVERS',
    cn: '发动机甲板 / 散热器盖板',
    spec: 'Maybach HL 230 P45 · 700 PS · four radiator fans',
    explode: [0, 1.4, 0],
  });

  const muffler = (x) =>
    merge([
      cyl(0.12, 0.12, 0.72, 18, [x, 1.3, -3.26]),
      cyl(0.17, 0.17, 0.26, 18, [x, 1.02, -3.26]),
      cyl(0.06, 0.06, 0.2, 12, [x, 1.72, -3.26]),
      box(0.3, 0.08, 0.16, [x, 0.9, -3.26]),
    ]);
  b.addHull({
    assembly: 'power',
    geometry: merge([muffler(0.74), muffler(-0.74)]),
    name: 'EXHAUST MUFFLERS & ARMOURED COWLS',
    cn: '排气消音器 / 装甲护罩',
    spec: 'Twin vertical mufflers on the rear plate',
    explode: [0, 0.3, -1.4],
  });

  b.addHull({
    assembly: 'power',
    geometry: merge([
      box(0.34, 0.24, 0.12, [0, 1.34, -3.26]),
      box(0.36, 0.18, 0.14, [1.16, 1.3, -3.27]),
      box(0.36, 0.18, 0.14, [-1.16, 1.3, -3.27]),
      bothSides(box(0.12, 0.2, 0.22, [1.0, 0.7, -3.28])),
      cyl(0.022, 0.022, 0.6, 8, [1.42, 2.2, -1.15], [0.06, 0, 0.04]),
      box(0.1, 0.12, 0.12, [1.42, P.roofY + 0.06, -1.15]),
    ]),
    name: 'REAR STOWAGE · TOW HOOKS · AERIAL',
    cn: '尾部工具箱 / 拖曳钩 / 天线',
    spec: 'Jack, tow hooks and the Fu 5 aerial base',
    explode: [0, 0, -1.0],
    soft: true,
  });

  // -------------------------------------------------------------- running gear
  const geoCache = new Map();
  const sideGeo = (kind, side) => {
    const key = `${kind}${side}`;
    if (!geoCache.has(key)) {
      const make = { wheel: roadWheelGeometry, sprocket: sprocketGeometry, idler: idlerGeometry }[kind];
      geoCache.set(key, make(P, side));
    }
    return geoCache.get(key);
  };

  for (const side of [1, -1]) {
    const label = side > 0 ? 'L' : 'R';
    b.addSpinner(
      {
        id: `${b.prefix}-SP${label}`,
        tag: 'sprocket',
        geometry: sideGeo('sprocket', side),
        name: 'DRIVE SPROCKET (FRONT)',
        cn: '主动轮（前置）',
        spec: `${P.sprocket.teeth} teeth · front drive through a Maybach-Olvar gearbox`,
        at: [side * P.trackCentre, P.sprocket.y, P.sprocket.z],
        explode: [side * 1.05, 0, 0],
      },
      P.sprocket.r,
    );
    b.addSpinner(
      {
        id: `${b.prefix}-ID${label}`,
        geometry: sideGeo('idler', side),
        name: 'REAR IDLER',
        cn: '诱导轮（后置）',
        spec: 'Adjustable idler for track tension',
        at: [side * P.trackCentre, P.idler.y, P.idler.z],
        explode: [side * 1.05, 0, 0],
      },
      P.idler.r,
    );

    for (let i = 0; i < P.axleCount; i++) {
      // Every axle carries an inboard wheel; the outer wheel alternates between two
      // planes so neighbours overlap by 200 mm — the Schachtellaufwerk pattern.
      const rows = [
        { x: P.wheelRows.inboard, tag: 'INBOARD' },
        i % 2 === 0 ? { x: P.wheelRows.outerNear, tag: 'OUTBOARD' } : { x: P.wheelRows.outerFar, tag: 'CENTRE' },
      ];
      for (const row of rows) {
        b.addSpinner(
          {
            id: `${b.prefix}-RW${label}${i + 1}${row.tag[0]}`,
            tag: i === 2 && row.tag === 'OUTBOARD' && side > 0 ? 'wheels' : undefined,
            geometry: sideGeo('wheel', side),
            name: `ROAD WHEEL ${i + 1} (${row.tag})`,
            cn: '负重轮（交错式）',
            spec: '800 mm steel-rimmed wheel on an independent torsion bar',
            at: [side * row.x, ride, axleZ(P, i)],
            explode: [side * 0.95, 0, 0],
            soft: row.tag === 'INBOARD',
          },
          P.roadWheelRadius,
        );
      }
    }
  }

  const circles = [
    { z: P.sprocket.z, y: P.sprocket.y, r: P.sprocket.r + P.linkThickness / 2 },
    { z: P.idler.z, y: P.idler.y, r: P.idler.r + P.linkThickness / 2 },
  ];
  for (let i = 0; i < P.axleCount; i++) {
    circles.push({ z: axleZ(P, i), y: ride, r: P.roadWheelRadius + P.linkThickness / 2 });
  }
  b.addBelts(P, beltHull(circles, 128), {
    link: linkGeometry(P),
    spec: '725 mm combat track · 96 links · 138 mm spacing',
  });

  // ------------------------------------------------------------------ interior
  b.addInterior(b.hull, {
    assembly: 'power',
    tag: 'engine',
    geometry: dieselEngine({ y: 1.0, z: -2.1, width: 1.5, height: 0.95, depth: 1.5, banks: 2, fans: 2 }),
    name: 'MAYBACH HL 230 P45 V-12',
    cn: '迈巴赫 HL 230 P45 V12 发动机',
    spec: '23 litre petrol V-12, 700 PS at 3000 rpm',
    explode: [0, 0, -2.4],
  });

  b.addInterior(b.hull, {
    assembly: 'power',
    geometry: merge([
      transmission({ y: 0.85, z: 2.35, width: 1.5, height: 0.7, depth: 0.8, shaftX: 0.9 }),
      // Driveshaft running forward under the turret floor to the front gearbox.
      cyl(0.09, 0.09, 3.6, 10, [0, 0.72, 0.45], [Math.PI / 2, 0, 0]),
    ]),
    name: 'FRONT GEARBOX & DRIVESHAFT',
    cn: '前置变速箱与传动轴',
    spec: 'Maybach-Olvar 8-speed; the shaft crosses the fighting compartment floor',
    explode: [0, 0, 2.6],
  });

  b.addInterior(b.hull, {
    geometry: merge([
      ammoRack({ x: 1.42, y: 1.2, z: 0.4, width: 0.34, height: 0.62, depth: 2.4, cols: 2, rows: 3, shell: 0.05 }),
      ammoRack({ x: -1.42, y: 1.2, z: 0.4, width: 0.34, height: 0.62, depth: 2.4, cols: 2, rows: 3, shell: 0.05 }),
      fuelCell({ x: 0, y: 0.85, z: -1.15, width: 1.3, height: 0.6, depth: 0.7 }),
    ]),
    tag: 'ammo',
    name: 'SPONSON AMMUNITION BINS & FUEL',
    cn: '侧舱弹药架与燃油箱',
    spec: '92 rounds of 8.8 cm stowed in the sponsons — no blow-out panels',
    explode: [0, 0.9, 0],
  });

  b.addInterior(b.hull, {
    assembly: 'running',
    geometry: torsionBars({ y: 0.56, count: 8, firstZ: P.axleFrontZ, pitch: P.axlePitch, halfWidth: 1.1 }),
    name: 'TORSION BAR SUSPENSION',
    cn: '扭杆悬挂',
    spec: 'Eight transverse bars per side, staggered for the interleaved wheels',
    explode: [0, -0.9, 0],
    soft: true,
  });

  b.addInterior(b.hull, {
    tag: 'crew',
    geometry: merge([
      crewSeated({ x: 0.62, y: 0.95, z: 2.15 }), // driver
      crewSeated({ x: -0.62, y: 0.95, z: 2.15 }), // radio operator
    ]),
    name: 'DRIVER & RADIO OPERATOR',
    cn: '驾驶员与无线电员',
    spec: 'Seated upright either side of the gearbox',
    explode: [0, 0, 2.0],
  });

  b.addInterior(b.turret, {
    assembly: 'gun',
    geometry: gunBreech({ y: P.gunAxisY - 0.02, z: -0.15, width: 0.5, height: 0.6, depth: 0.95 }),
    name: 'GUN BREECH & RECOIL GUARD',
    cn: '炮闩与后座护板',
    spec: 'Semi-automatic vertical breech with a large spent-case guard',
    explode: [0, 0, -1.6],
  });

  b.addInterior(b.turret, {
    geometry: merge([
      crewSeated({ x: 0.5, y: P.roofY - 0.15, z: -0.5, facing: 0 }), // commander
      crewSeated({ x: 0.55, y: P.roofY - 0.2, z: 0.25, facing: 0 }), // gunner
      crewSeated({ x: -0.6, y: P.roofY - 0.25, z: -0.2, facing: -0.4 }), // loader
    ]),
    name: 'TURRET CREW · COMMANDER / GUNNER / LOADER',
    cn: '炮塔乘员：车长 / 炮手 / 装填手',
    spec: 'Five-man crew — two more than a modern autoloader tank',
    explode: [0, 1.0, 0],
  });

  return b.finish();
}

export const CALLOUTS = [
  { tag: 'sponson', text: 'SPONSONS OVER THE TRACKS', side: 'left', dy: -120 },
  { tag: 'barrel', text: '8.8 CM KWK 36 L/56', side: 'right', dy: -60 },
  { tag: 'cupola', text: 'COMMANDER CUPOLA', side: 'right', dy: -150 },
  { tag: 'sprocket', text: 'FRONT DRIVE SPROCKET', side: 'right', dy: 110 },
  { tag: 'wheels', text: 'INTERLEAVED ROAD WHEELS', side: 'left', dy: 140 },
  { tag: 'engine', text: 'MAYBACH HL 230 V-12', side: 'left', dy: 30 },
];
