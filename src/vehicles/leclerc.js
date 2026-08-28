import { box, cyl, merge, bothSides, mirrorOutline } from '../geo.js';
import {
  hullSolid,
  sideSkirt,
  turretShell,
  mainGun,
  mantlet,
  grille,
  hatch,
  weaponStation,
  panoramicSight,
} from '../kit.js';
import {
  dieselEngine,
  transmission,
  bustleAutoloader,
  gunBreech,
  crewSeated,
  driverStation,
  torsionBars,
  fuelCell,
  serviceBlock,
} from '../internals.js';
import { VehicleBuilder } from '../vehicle.js';

/**
 * Leclerc (XLR standard).
 *
 * Identity: the compact one. No loader means the turret can be small and smooth,
 * with flush modular panels instead of bolted lumps, and the magazine moves into
 * a bustle autoloader — a completely different internal answer to the same
 * problem the T-90M solves with a floor carousel.
 */
const P = {
  front: 3.44,
  rear: -3.44,
  floorY: 0.47,
  noseY: 0.7,
  deckY: 1.28,
  engineDeckY: 1.22,
  engineDeckZ: -1.45,
  glacisRun: 2.15,
  width: 3.2,

  turretZ: 0.25,
  turretY: 1.28,
  turretHeight: 0.8,
  gunAxisY: 1.7,
  gunPivotZ: 1.15,
  barrelLength: 4.7,
};

const RUNNING = {
  wheelCount: 6,
  wheelFirstZ: 2.1,
  wheelPitch: 0.85,
  wheelRadius: 0.35,
  wheelWidth: 0.12,
  wheelX: 1.42,
  returnRollers: [1.75, 0.4, -0.9, -2.1],
  rollerRadius: 0.09,
  rollerY: 0.92,
  sprocket: { z: -3.02, y: 0.7, r: 0.3, width: 0.2, teeth: 12 },
  idler: { z: 2.92, y: 0.46, r: 0.28, width: 0.19 },
  trackCentre: 1.42,
  trackWidth: 0.57,
  linkPitch: 0.175,
  linkThickness: 0.042,
  cleatDepth: 0.02,
};

// Small crew compartment, then a full-width squared bustle for the autoloader.
const TURRET_OUTLINE = mirrorOutline([
  [0, 1.34],
  [0.72, 1.24],
  [1.16, 0.66],
  [1.18, -0.28],
  [1.2, -1.72],
  [0, -1.78],
]);

export function build(meta) {
  const b = new VehicleBuilder(meta, { turretZ: P.turretZ, gunAxisY: P.gunAxisY, gunPivotZ: P.gunPivotZ });

  // ------------------------------------------------------------------ hull
  b.addHull({
    tag: 'hull',
    geometry: hullSolid(P),
    name: 'HULL & GLACIS',
    cn: '车体与首上装甲',
    spec: 'Short 6.88 m hull — the whole vehicle is 3 m shorter than a Challenger',
    explode: [0, 0, 0],
  });

  // Flush modular panels instead of bolted-on lumps: the clean French look.
  const panelRow = (x, z0, count, len) => {
    const parts = [];
    for (let i = 0; i < count; i++) {
      parts.push(box(0.09, 0.62, len - 0.04, [x, 0.92, z0 - i * len]));
      parts.push(box(0.12, 0.5, 0.03, [x, 0.92, z0 - i * len - len / 2]));
    }
    return merge(parts);
  };
  b.addHull({
    tag: 'panels',
    geometry: merge([
      sideSkirt({ x: 1.7, front: 2.9, rear: -3.2, top: 1.26, bottom: 0.54, thickness: 0.05, panels: 6, gap: 0.02 }),
      sideSkirt({ x: -1.7, front: 2.9, rear: -3.2, top: 1.26, bottom: 0.54, thickness: 0.05, panels: 6, gap: 0.02 }),
      panelRow(1.76, 2.7, 3, 1.0),
      panelRow(-1.76, 2.7, 3, 1.0),
    ]),
    name: 'SMOOTH MODULAR ARMOUR PANELS',
    cn: '光滑模块化装甲板',
    spec: 'Flush replaceable modules, no protruding bolt heads',
    explode: [0, 0.2, 0],
  });

  b.addHull({
    assembly: 'power',
    tag: 'grilles',
    geometry: merge([
      grille({ x: 0, y: P.engineDeckY + 0.02, z: -2.15, width: 2.3, depth: 1.0, louvres: 8 }),
      grille({ x: 0, y: P.engineDeckY + 0.02, z: -3.05, width: 2.2, depth: 0.65, louvres: 5 }),
      box(2.9, 0.05, 0.1, [0, P.engineDeckY + 0.02, -1.55]),
      bothSides(box(0.24, 0.3, 0.42, [1.3, 1.1, -3.4])),
    ]),
    name: 'HYPERBAR POWERPACK DECK',
    cn: '超高压增压动力舱甲板',
    spec: 'Compact powerpack: engine, gearbox and cooling in one 8-tonne module',
    explode: [0, 1.1, 0],
  });

  b.addHull({
    geometry: merge([
      hatch({ x: -0.62, y: P.deckY, z: 2.15, radius: 0.3, periscopes: 3 }),
      bothSides(cyl(0.085, 0.085, 0.2, 12, [1.28, 0.8, 3.2], [Math.PI / 2, 0, 0])),
      box(1.4, 0.1, 0.2, [0, 0.62, 3.42]),
      bothSides(box(0.28, 0.18, 0.5, [1.4, P.deckY + 0.09, -0.4])),
    ]),
    name: 'DRIVER HATCH & HULL FITTINGS',
    cn: '驾驶员舱口与车体附件',
    spec: 'Driver front left, ammunition bulkhead to the right',
    explode: [0, 0.85, 0],
    soft: true,
  });

  b.addRunningGear(RUNNING);

  // ---------------------------------------------------------------- turret
  b.addTurret({
    tag: 'turret',
    geometry: turretShell({ outline: TURRET_OUTLINE, y0: P.turretY, height: P.turretHeight, inset: 0.07 }),
    name: 'ULTRA-COMPACT TURRET',
    cn: '超紧凑炮塔',
    spec: 'No loader station: the crew volume is roughly half an Abrams turret',
    explode: [0, 1.5, 0],
  });

  b.addTurret({
    tag: 'bustle',
    geometry: merge([
      box(2.3, 0.72, 1.35, [0, P.turretY + 0.4, -1.05]),
      box(2.36, 0.08, 1.3, [0, P.turretY + 0.78, -1.05]), // blow-out roof panels
      box(0.5, 0.5, 0.06, [0, P.turretY + 0.4, -1.74]), // magazine resupply door
      bothSides(box(0.05, 0.5, 1.2, [1.18, P.turretY + 0.4, -1.05])),
    ]),
    name: 'BUSTLE MAGAZINE HOUSING',
    cn: '尾舱弹仓外壳',
    spec: 'Armoured magazine box with blow-out panels above and a resupply hatch aft',
    explode: [0, 1.0, -1.6],
  });

  b.addTurret({
    tag: 'galix',
    geometry: merge([
      ...[0, 1, 2, 3].flatMap((i) => [
        cyl(0.05, 0.05, 0.26, 10, [1.2, P.turretY + 0.62, 0.35 - i * 0.22], [Math.PI / 2, 0, Math.PI / 2 - 0.25]),
        cyl(0.05, 0.05, 0.26, 10, [-1.2, P.turretY + 0.62, 0.35 - i * 0.22], [Math.PI / 2, 0, -Math.PI / 2 + 0.25]),
      ]),
      bothSides(box(0.1, 0.16, 0.95, [1.22, P.turretY + 0.62, -0.02])),
    ]),
    name: 'GALIX COUNTERMEASURE LAUNCHERS',
    cn: 'GALIX 自卫发射器',
    spec: 'Nine-tube system firing smoke, IR decoys and anti-personnel rounds',
    explode: [0, 0.7, 0.9],
    soft: true,
  });

  b.addTurret({
    geometry: merge([
      panoramicSight({ x: -0.5, y: P.turretY + P.turretHeight, z: 0.1, width: 0.34, height: 0.42, depth: 0.34 }),
      hatch({ x: 0.52, y: P.turretY + P.turretHeight, z: -0.35, radius: 0.3, periscopes: 4 }),
      hatch({ x: -0.52, y: P.turretY + P.turretHeight, z: -0.35, radius: 0.28, periscopes: 2 }),
      weaponStation({ x: 0.52, y: P.turretY + P.turretHeight + 0.05, z: -0.08 }),
      box(0.44, 0.24, 0.42, [0.5, P.turretY + P.turretHeight + 0.02, 0.62]), // HL-70 gunner sight
      box(0.28, 0.14, 0.05, [0.5, P.turretY + P.turretHeight + 0.06, 0.86]),
      cyl(0.024, 0.024, 0.6, 8, [-1.05, P.turretY + P.turretHeight + 0.45, -1.5]),
    ]),
    name: 'HL-70 SIGHT & ROOF STATIONS',
    cn: 'HL-70 瞄准镜与车顶舱口',
    spec: 'Commander panoramic sight, gunner thermal sight, remote 12.7 mm',
    explode: [0, 2.1, 0],
  });

  // -------------------------------------------------------------- armament
  b.addGun({
    geometry: mantlet({ width: 0.8, height: 0.58, depth: 0.46, boreRadius: 0.19 }),
    name: 'MANTLET & TRUNNIONS',
    cn: '火炮防盾与耳轴',
    spec: 'Compact mantlet flush with the turret face',
    explode: [0, 0, 0.9],
  });

  b.addGun({
    tag: 'barrel',
    geometry: mainGun({
      length: P.barrelLength,
      radius: 0.075,
      breechRadius: 0.14,
      evacuator: { z: 0.46, radius: 0.165, length: 0.6 },
    }),
    name: 'GIAT CN120-26 L/52',
    cn: 'GIAT CN120-26 L/52 滑膛炮',
    spec: 'Autoloaded at up to 12 rounds per minute, on the move',
    explode: [0, 0, 2.5],
  });

  // -------------------------------------------------------------- interior
  b.addInterior(b.hull, {
    assembly: 'power',
    tag: 'engine',
    geometry: dieselEngine({ y: 0.9, z: -2.3, width: 1.7, height: 0.88, depth: 1.4, banks: 2, fans: 2 }),
    name: 'SACM V8X-1500 HYPERBAR V-8',
    cn: 'SACM V8X-1500 超高压增压 V8',
    spec: '1500 hp from eight cylinders using a gas-turbine supercharger',
    explode: [0, 0, -2.5],
  });

  b.addInterior(b.hull, {
    assembly: 'power',
    geometry: transmission({ y: 0.78, z: -3.15, width: 1.6, height: 0.64, depth: 0.48, shaftX: 0.92 }),
    name: 'SESM ESM 500 AUTOMATIC GEARBOX',
    cn: 'SESM ESM 500 自动变速箱',
    spec: 'Five forward gears with automatic shifting and hydrostatic steering',
    explode: [0, 0, -3.1],
  });

  b.addInterior(b.turret, {
    tag: 'autoloader',
    assembly: 'gun',
    geometry: bustleAutoloader({ y: P.turretY + 0.4, z: -1.05, width: 2.0, height: 0.6, depth: 1.15, rounds: 22 }),
    name: 'BUSTLE AUTOLOADER (22 ROUNDS)',
    cn: '尾舱式自动装弹机（22 发）',
    spec: 'Rounds sit behind an armoured bulkhead with blow-out panels above',
    explode: [0, 0, -2.6],
  });

  b.addInterior(b.hull, {
    tag: 'magazine',
    assembly: 'gun',
    geometry: bustleAutoloader({ x: 0.7, y: 0.92, z: 2.0, width: 0.7, height: 0.7, depth: 1.1, rounds: 12, shell: 0.08 }),
    name: 'HULL RESERVE MAGAZINE',
    cn: '车体备用弹舱',
    spec: '18 reserve rounds right of the driver, reloaded into the bustle by hand',
    explode: [0, 0.6, 1.6],
  });

  b.addInterior(b.hull, {
    geometry: merge([
      fuelCell({ x: 1.12, y: 0.85, z: -0.4, width: 0.5, height: 0.7, depth: 1.6 }),
      fuelCell({ x: -1.12, y: 0.85, z: -0.4, width: 0.5, height: 0.7, depth: 1.6 }),
      serviceBlock({ x: 0, y: 0.8, z: -1.2, width: 0.9, height: 0.44, depth: 0.44 }),
    ]),
    name: 'FUEL CELLS & AUXILIARY POWER',
    cn: '燃油箱与辅助动力',
    spec: 'Sponson tanks plus a small APU for silent watch',
    explode: [0, 0.5, 0],
    soft: true,
  });

  b.addInterior(b.hull, {
    assembly: 'running',
    geometry: torsionBars({ y: 0.56, count: 6, firstZ: RUNNING.wheelFirstZ, pitch: RUNNING.wheelPitch, halfWidth: 1.34 }),
    name: 'TORSION BAR SUSPENSION',
    cn: '扭杆悬挂',
    spec: 'Six stations per side with rotary dampers',
    explode: [0, -0.9, 0],
    soft: true,
  });

  b.addInterior(b.hull, {
    geometry: driverStation({ x: -0.62, y: 0.6, z: 2.1 }),
    name: 'DRIVER (FRONT LEFT, RECLINED)',
    cn: '驾驶员（左前，半躺姿）',
    spec: 'Sits left of the hull magazine bulkhead',
    explode: [0, 0, 2.1],
  });

  b.addInterior(b.turret, {
    assembly: 'gun',
    geometry: gunBreech({ y: P.gunAxisY, z: 0.2, width: 0.48, height: 0.54, depth: 0.85 }),
    name: 'BREECH & FEED ARM',
    cn: '炮闩与输弹臂',
    spec: 'The feed arm swings a round out of the bustle straight into the breech',
    explode: [0, 0, -1.5],
  });

  b.addInterior(b.turret, {
    tag: 'crew',
    geometry: merge([
      crewSeated({ x: -0.55, y: P.turretY - 0.3, z: -0.3, facing: 0 }), // commander
      crewSeated({ x: 0.55, y: P.turretY - 0.34, z: -0.2, facing: 0 }), // gunner
    ]),
    name: 'TURRET CREW · COMMANDER / GUNNER',
    cn: '炮塔乘员：车长 / 炮长',
    spec: 'Two crew forward of the magazine bulkhead, no loader',
    explode: [0, 0.9, 0],
  });

  return b.finish();
}

export const CALLOUTS = [
  { tag: 'turret', text: 'ULTRA-COMPACT TURRET', side: 'left', dy: -130 },
  { tag: 'bustle', text: 'BUSTLE MAGAZINE', side: 'left', dy: -40 },
  { tag: 'autoloader', text: 'BUSTLE AUTOLOADER 22 RDS', side: 'right', dy: -150 },
  { tag: 'panels', text: 'SMOOTH MODULAR PANELS', side: 'left', dy: 100 },
  { tag: 'galix', text: 'GALIX LAUNCHERS', side: 'right', dy: -60 },
  { tag: 'barrel', text: 'CN120-26 L/52', side: 'right', dy: 70 },
];
