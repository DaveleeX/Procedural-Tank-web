import { box, cyl, merge, bothSides, mirrorOutline } from '../geo.js';
import {
  hullSolid,
  sideSkirt,
  turretShell,
  mainGun,
  mantlet,
  smokeBank,
  grille,
  hatch,
  weaponStation,
  eraPatch,
  eraAlongOutline,
  slatPanel,
} from '../kit.js';
import {
  dieselEngine,
  transmission,
  carouselAutoloader,
  gunBreech,
  crewSeated,
  driverStation,
  torsionBars,
  fuelCell,
  serviceBlock,
} from '../internals.js';
import { VehicleBuilder } from '../vehicle.js';

/**
 * T-90M "Proryv".
 *
 * Identity: the smallest vehicle in the atlas by a wide margin — a very low,
 * short hull with a rounded turret almost completely covered in Relikt reactive
 * blocks, slat cages hung off the bustle, and a carousel autoloader that keeps
 * the crew down to three at the cost of ammunition sitting in the crew space.
 */
const P = {
  front: 3.43,
  rear: -3.43,
  floorY: 0.44,
  noseY: 0.6,
  deckY: 1.14,
  engineDeckY: 1.08,
  engineDeckZ: -1.25,
  glacisRun: 2.35,
  width: 3.05,

  turretZ: 0.05,
  turretY: 1.14,
  turretHeight: 0.74,
  gunAxisY: 1.53,
  gunPivotZ: 1.0,
  barrelLength: 4.8,
};

const RUNNING = {
  wheelCount: 6,
  wheelFirstZ: 2.08,
  wheelPitch: 0.83,
  wheelRadius: 0.375,
  wheelWidth: 0.115,
  wheelX: 1.4,
  returnRollers: [1.6, 0.1, -1.5],
  rollerRadius: 0.085,
  rollerY: 0.86,
  sprocket: { z: -2.98, y: 0.66, r: 0.29, width: 0.2, teeth: 14 },
  idler: { z: 2.86, y: 0.44, r: 0.27, width: 0.19 },
  trackCentre: 1.4,
  trackWidth: 0.58,
  linkPitch: 0.165,
  linkThickness: 0.04,
  cleatDepth: 0.02,
};

// Rounded front, straight flanks and a squared bustle.
const TURRET_OUTLINE = mirrorOutline([
  [0, 1.4],
  [0.62, 1.32],
  [1.06, 1.02],
  [1.28, 0.46],
  [1.3, -0.5],
  [1.28, -1.5],
  [0, -1.58],
]);

export function build(meta) {
  const b = new VehicleBuilder(meta, { turretZ: P.turretZ, gunAxisY: P.gunAxisY, gunPivotZ: P.gunPivotZ });

  // ------------------------------------------------------------------ hull
  b.addHull({
    tag: 'hull',
    geometry: hullSolid(P),
    name: 'LOW WELDED HULL',
    cn: '低矮焊接车体',
    spec: 'Only 2.2 m tall overall — the lowest silhouette of any tank here',
    explode: [0, 0, 0],
  });

  b.addHull({
    tag: 'glacis-era',
    geometry: eraPatch({
      origin: [-1.36, P.noseY + 0.02, P.front - 0.05],
      u: [2.72, 0, 0],
      v: [0, 0.56, -2.2],
      nu: 8,
      nv: 3,
      brick: 0.12,
      gap: 0.03,
      jitter: 0.01,
    }),
    name: 'GLACIS RELIKT BLOCKS',
    cn: '首上「化石」爆炸反应装甲',
    spec: 'Full-face ERA across the glacis in overlapping rows',
    explode: [0, 0.5, 1.4],
  });

  b.addHull({
    tag: 'skirt',
    geometry: merge([
      sideSkirt({ x: 1.72, front: 2.85, rear: -3.1, top: 1.12, bottom: 0.52, thickness: 0.06, panels: 6 }),
      sideSkirt({ x: -1.72, front: 2.85, rear: -3.1, top: 1.12, bottom: 0.52, thickness: 0.06, panels: 6 }),
      // Hinged ERA boxes over the forward stations.
      bothSides(
        eraPatch({
          origin: [1.78, 0.56, 2.8],
          u: [0, 0, -2.5],
          v: [0, 0.52, 0],
          nu: 5,
          nv: 2,
          brick: 0.1,
          gap: 0.035,
        }),
      ),
    ]),
    name: 'SIDE SKIRTS WITH ERA BOXES',
    cn: '侧裙板与反应装甲盒',
    spec: 'Rubber-backed skirts carrying ERA over the crew compartment',
    explode: [0, 0.2, 0],
  });

  b.addHull({
    assembly: 'power',
    tag: 'grilles',
    geometry: merge([
      grille({ x: 0, y: P.engineDeckY + 0.02, z: -2.0, width: 2.0, depth: 0.9, louvres: 7 }),
      grille({ x: 0, y: P.engineDeckY + 0.02, z: -3.0, width: 2.3, depth: 0.8, louvres: 6 }),
      cyl(0.24, 0.24, 0.55, 16, [1.25, 1.34, -1.6], [0, 0, Math.PI / 2]), // external fuel drums
      cyl(0.24, 0.24, 0.55, 16, [-1.25, 1.34, -1.6], [0, 0, Math.PI / 2]),
      box(0.4, 0.3, 0.9, [0, 1.3, -3.35]), // unditching beam
    ]),
    name: 'ENGINE DECK & EXTERNAL FUEL DRUMS',
    cn: '发动机甲板与外挂油桶',
    spec: 'Longitudinal V-92S2F powerpack with drums on the rear plate',
    explode: [0, 1.0, 0],
  });

  b.addHull({
    geometry: merge([
      hatch({ x: 0, y: P.deckY, z: 2.0, radius: 0.28, periscopes: 3 }),
      bothSides(cyl(0.085, 0.085, 0.2, 12, [1.2, 0.74, 3.2], [Math.PI / 2, 0, 0])),
      box(1.3, 0.1, 0.18, [0, 0.56, 3.4]),
      bothSides(box(0.26, 0.16, 0.4, [1.35, P.deckY + 0.08, -0.5])),
    ]),
    name: 'DRIVER HATCH & HULL FITTINGS',
    cn: '驾驶员舱口与车体附件',
    spec: 'Centre-line driver with a very shallow hatch opening',
    explode: [0, 0.85, 0],
    soft: true,
  });

  b.addRunningGear(RUNNING);

  // ---------------------------------------------------------------- turret
  b.addTurret({
    tag: 'turret',
    geometry: turretShell({ outline: TURRET_OUTLINE, y0: P.turretY, height: P.turretHeight, inset: 0.11 }),
    name: 'DOME-PROFILE TURRET',
    cn: '穹顶状炮塔',
    spec: 'Rounded frontal casting profile with a welded bustle',
    explode: [0, 1.4, 0],
  });

  b.addTurret({
    tag: 'era',
    geometry: eraAlongOutline({
      outline: TURRET_OUTLINE,
      indices: [0, 1, 2, 3, 4, 8, 9, 10, 11],
      y0: P.turretY + 0.08,
      height: 0.56,
      rows: 2,
      brick: 0.13,
      gap: 0.035,
      colWidth: 0.3,
    }),
    name: 'RELIKT FISH-SCALE ERA',
    cn: '「化石」鱼鳞状爆炸反应装甲',
    spec: 'Overlapping cassettes wrapping the turret front and cheeks',
    explode: [0, 0.9, 1.2],
  });

  b.addTurret({
    tag: 'cage',
    geometry: merge([
      slatPanel({ origin: [-1.05, P.turretY + 0.12, -1.75], u: [2.1, 0, 0], v: [0, 0.72, 0], bars: 12 }),
      slatPanel({ origin: [1.4, P.turretY + 0.12, -0.6], u: [0, 0, -1.2], v: [0, 0.72, 0], bars: 7 }),
      slatPanel({ origin: [-1.4, P.turretY + 0.12, -0.6], u: [0, 0, -1.2], v: [0, 0.72, 0], bars: 7 }),
      box(2.2, 0.05, 0.05, [0, P.turretY + 0.86, -1.75]),
    ]),
    name: 'SLAT CAGE ARMOUR',
    cn: '炮塔后部格栅装甲',
    spec: 'Bar armour standing off the bustle and rear cheeks',
    explode: [0, 0.6, -1.6],
    soft: true,
  });

  b.addTurret({
    geometry: merge([
      hatch({ x: 0.6, y: P.turretY + P.turretHeight, z: -0.35, radius: 0.31, periscopes: 4 }),
      hatch({ x: -0.6, y: P.turretY + P.turretHeight, z: -0.25, radius: 0.29, periscopes: 2 }),
      weaponStation({ x: 0.6, y: P.turretY + P.turretHeight + 0.06, z: -0.1 }),
      box(0.46, 0.34, 0.4, [-0.5, P.turretY + P.turretHeight + 0.16, 0.35]), // commander panoramic sight
      cyl(0.14, 0.14, 0.12, 14, [-0.5, P.turretY + P.turretHeight + 0.36, 0.35]),
      box(0.42, 0.26, 0.4, [0.52, P.turretY + P.turretHeight + 0.02, 0.55]), // Sosna-U gunner sight
      bothSides(box(0.26, 0.26, 0.26, [1.15, P.turretY + 0.5, 0.75])), // IR jammer boxes
      cyl(0.024, 0.024, 0.6, 8, [1.05, P.turretY + P.turretHeight + 0.45, -1.2]),
    ]),
    name: 'ROOF SIGHTS & HATCHES',
    cn: '车顶观瞄与舱口',
    spec: 'Commander panoramic sight, Sosna-U gunner sight, 12.7 mm station',
    explode: [0, 2.0, 0],
  });

  b.addTurret({
    geometry: merge([
      smokeBank({ x: 1.16, y: P.turretY + 0.56, z: -0.95, count: 3, yaw: 0.9 }),
      smokeBank({ x: -1.16, y: P.turretY + 0.56, z: -0.95, count: 3, yaw: -0.9 }),
    ]),
    name: '902B SMOKE DISCHARGERS',
    cn: '902B 烟雾弹发射器',
    spec: 'Two banks of 81 mm dischargers',
    explode: [0, 0.8, -0.8],
    soft: true,
  });

  // -------------------------------------------------------------- armament
  b.addGun({
    geometry: mantlet({ width: 0.74, height: 0.56, depth: 0.44, boreRadius: 0.18 }),
    name: 'MANTLET & TRUNNIONS',
    cn: '火炮防盾与耳轴',
    spec: 'Narrow embrasure protected by ERA cassettes on both cheeks',
    explode: [0, 0, 0.9],
  });

  b.addGun({
    tag: 'barrel',
    geometry: mainGun({
      length: P.barrelLength,
      radius: 0.078,
      breechRadius: 0.15,
      evacuator: { z: 0.5, radius: 0.175, length: 0.6 },
    }),
    name: '2A46M-5 125 MM SMOOTHBORE',
    cn: '2A46M-5 型 125 毫米滑膛炮',
    spec: 'Two-piece ammunition, fires the Refleks guided missile',
    explode: [0, 0, 2.5],
  });

  // -------------------------------------------------------------- interior
  b.addInterior(b.hull, {
    assembly: 'power',
    tag: 'engine',
    geometry: dieselEngine({ y: 0.84, z: -2.35, width: 1.6, height: 0.84, depth: 1.5, banks: 2, fans: 1 }),
    name: 'V-92S2F DIESEL V-12',
    cn: 'V-92S2F V12 柴油机',
    spec: '1130 hp — the least powerful engine here, in the lightest hull',
    explode: [0, 0, -2.5],
  });

  b.addInterior(b.hull, {
    assembly: 'power',
    geometry: transmission({ y: 0.74, z: -3.15, width: 1.5, height: 0.6, depth: 0.45, shaftX: 0.9 }),
    name: 'MECHANICAL TRANSMISSION',
    cn: '机械式传动装置',
    spec: 'Two planetary final drives at the rear',
    explode: [0, 0, -3.0],
  });

  b.addInterior(b.hull, {
    tag: 'autoloader',
    assembly: 'gun',
    geometry: carouselAutoloader({ y: 0.68, z: P.turretZ, radius: 0.98, rounds: 22, length: 0.64 }),
    name: 'CAROUSEL AUTOLOADER (22 ROUNDS)',
    cn: '转盘式自动装弹机（22 发）',
    spec: 'Rounds lie in the floor inside the crew compartment — the family trait',
    explode: [0, -1.2, 0],
  });

  b.addInterior(b.hull, {
    geometry: merge([
      fuelCell({ x: 1.05, y: 0.8, z: 1.3, width: 0.5, height: 0.66, depth: 1.5 }),
      fuelCell({ x: -1.05, y: 0.8, z: 1.3, width: 0.5, height: 0.66, depth: 1.5 }),
      serviceBlock({ x: 0, y: 0.74, z: -1.05, width: 0.9, height: 0.44, depth: 0.44 }),
    ]),
    name: 'FUEL CELLS & AUXILIARY SYSTEMS',
    cn: '燃油箱与辅助系统',
    spec: 'Internal fuel forward, more in the drums outside',
    explode: [0, 0.5, 0],
    soft: true,
  });

  b.addInterior(b.hull, {
    assembly: 'running',
    geometry: torsionBars({ y: 0.54, count: 6, firstZ: RUNNING.wheelFirstZ, pitch: RUNNING.wheelPitch, halfWidth: 1.3 }),
    name: 'TORSION BAR SUSPENSION',
    cn: '扭杆悬挂',
    spec: 'Six stations per side, dampers on stations 1, 2 and 6',
    explode: [0, -0.9, 0],
    soft: true,
  });

  b.addInterior(b.hull, {
    geometry: driverStation({ x: 0, y: 0.58, z: 2.05 }),
    name: 'DRIVER (CENTRE, RECLINED)',
    cn: '驾驶员（居中，半躺姿）',
    spec: 'Very low seating position under a shallow hatch',
    explode: [0, 0, 2.1],
  });

  b.addInterior(b.turret, {
    assembly: 'gun',
    geometry: gunBreech({ y: P.gunAxisY, z: 0.15, width: 0.5, height: 0.56, depth: 0.85 }),
    name: 'GUN BREECH & RAMMER',
    cn: '炮闩与输弹机',
    spec: 'Breech elevates to a fixed loading angle for each shot',
    explode: [0, 0, -1.5],
  });

  b.addInterior(b.turret, {
    tag: 'crew',
    geometry: merge([
      crewSeated({ x: 0.58, y: P.turretY - 0.42, z: -0.3, facing: 0 }),
      crewSeated({ x: -0.58, y: P.turretY - 0.42, z: -0.15, facing: 0 }),
    ]),
    name: 'TURRET CREW · COMMANDER / GUNNER',
    cn: '炮塔乘员：车长 / 炮长',
    spec: 'Two crew sit low, knees beside the ammunition carousel',
    explode: [0, 0.9, 0],
  });

  return b.finish();
}

export const CALLOUTS = [
  { tag: 'era', text: 'FISH-SCALE RELIKT ERA', side: 'right', dy: -130 },
  { tag: 'cage', text: 'SLAT CAGE ARMOUR', side: 'left', dy: -140 },
  { tag: 'turret', text: 'LOW DOME TURRET', side: 'left', dy: -60 },
  { tag: 'barrel', text: '2A46M-5 125 MM', side: 'right', dy: -40 },
  { tag: 'autoloader', text: 'CAROUSEL AUTOLOADER', side: 'left', dy: 90 },
  { tag: 'glacis-era', text: 'GLACIS ERA', side: 'right', dy: 110 },
];
