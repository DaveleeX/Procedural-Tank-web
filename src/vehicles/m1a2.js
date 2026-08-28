import { box, cyl, place, merge, bothSides, mirrorOutline } from '../geo.js';
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
  meshScreen,
  stowageBasket,
} from '../kit.js';
import {
  gasTurbine,
  transmission,
  ammoRack,
  gunBreech,
  turretBasket,
  crewSeated,
  driverStation,
  torsionBars,
  fuelCell,
  serviceBlock,
} from '../internals.js';
import { VehicleBuilder } from '../vehicle.js';

/**
 * M1A2 Abrams (SEPv3 configuration).
 *
 * Identity: a very long, low glacis, a huge flat-sided angular turret with a
 * squared bustle, the 120 mm M256 reaching far past the nose, twin square engine
 * deck grilles over the gas turbine, and TUSK anti-RPG screens around the rear.
 */
const P = {
  front: 3.9,
  rear: -4.0,
  floorY: 0.45,
  noseY: 0.72,
  deckY: 1.36,
  engineDeckY: 1.3,
  engineDeckZ: -1.7,
  glacisRun: 2.55,
  width: 3.4,

  turretZ: 0.3,
  turretY: 1.36,
  turretHeight: 0.96,
  gunAxisY: 1.86,
  gunPivotZ: 1.4,
  barrelLength: 4.05,
};

const RUNNING = {
  wheelCount: 7,
  wheelFirstZ: 2.62,
  wheelPitch: 0.87,
  wheelRadius: 0.32,
  wheelWidth: 0.13,
  wheelX: 1.5,
  returnRollers: [2.2, 0.7, -0.8, -2.2],
  rollerRadius: 0.1,
  rollerY: 0.96,
  sprocket: { z: -3.48, y: 0.72, r: 0.3, width: 0.22, teeth: 12 },
  idler: { z: 3.32, y: 0.46, r: 0.28, width: 0.2 },
  sprocketPosition: 'rear',
  trackCentre: 1.5,
  trackWidth: 0.635,
  linkPitch: 0.2,
  linkThickness: 0.045,
  cleatDepth: 0.022,
};

const TURRET_OUTLINE = mirrorOutline([
  [0, 1.98],
  [0.66, 1.92],
  [1.36, 1.06],
  [1.42, -0.32],
  [1.42, -1.9],
  [0, -1.98],
]);

export function build(meta) {
  const b = new VehicleBuilder(meta, { turretZ: P.turretZ, gunAxisY: P.gunAxisY, gunPivotZ: P.gunPivotZ });

  // ------------------------------------------------------------------ hull
  b.addHull({
    geometry: hullSolid(P),
    tag: 'hull',
    name: 'HULL & GLACIS',
    cn: '车体与首上装甲',
    spec: 'Long shallow glacis, 480 mm ground clearance',
    explode: [0, 0, 0],
  });

  b.addHull({
    geometry: merge([
      sideSkirt({ x: 1.78, front: 3.3, rear: -3.5, top: 1.34, bottom: 0.5, thickness: 0.07 }),
      sideSkirt({ x: -1.78, front: 3.3, rear: -3.5, top: 1.34, bottom: 0.5, thickness: 0.07 }),
      bothSides(box(0.09, 0.62, 1.5, [1.79, 0.94, 2.35])), // heavy forward ballistic skirt
    ]),
    name: 'BALLISTIC SIDE SKIRTS',
    cn: '侧裙装甲板',
    spec: 'Heavy forward skirts, light rear plates',
    explode: [0, 0.2, 0],
  });

  // Twin square engine deck grilles over the turbine — the Abrams' rear signature.
  b.addHull({
    geometry: merge([
      grille({ x: 0.82, y: P.engineDeckY + 0.02, z: -2.55, width: 1.35, depth: 1.4, louvres: 7 }),
      grille({ x: -0.82, y: P.engineDeckY + 0.02, z: -2.55, width: 1.35, depth: 1.4, louvres: 7 }),
      box(3.3, 0.06, 0.12, [0, P.engineDeckY + 0.02, -1.78]),
      box(0.1, 0.06, 1.5, [0, P.engineDeckY + 0.03, -2.55]),
    ]),
    assembly: 'power',
    tag: 'grilles',
    name: 'ENGINE DECK GRILLES',
    cn: '动力舱散热网（双方形）',
    spec: 'Twin square intake screens over the AGT-1500',
    explode: [0, 1.1, 0],
  });

  b.addHull({
    geometry: merge([
      box(3.2, 0.9, 0.12, [0, 0.95, -3.97]),
      grille({ x: 0, y: 0.95, z: -3.94, width: 2.3, depth: 0.5, louvres: 5 }),
      bothSides(box(0.16, 0.2, 0.24, [1.3, 0.62, -4.02])),
    ]),
    assembly: 'power',
    name: 'REAR EXHAUST PLATE',
    cn: '尾部排气格栅',
    spec: 'Turbine exhaust across the full rear plate',
    explode: [0, 0, -1.3],
    soft: true,
  });

  // TUSK anti-RPG screens.
  b.addHull({
    geometry: merge([
      meshScreen({ origin: [1.86, 0.5, -1.7], u: [0, 0, -2.2], v: [0, 0.95, 0], nu: 9, nv: 4 }),
      meshScreen({ origin: [-1.86, 0.5, -1.7], u: [0, 0, -2.2], v: [0, 0.95, 0], nu: 9, nv: 4 }),
      meshScreen({ origin: [-1.5, 0.55, -4.08], u: [3.0, 0, 0], v: [0, 0.9, 0], nu: 10, nv: 4 }),
    ]),
    tag: 'mesh',
    name: 'ANTI-RPG MESH SCREENS',
    cn: '防火箭弹铁丝网（TUSK）',
    spec: 'TUSK slat screens around the engine bay',
    explode: [0, 0, -0.9],
    soft: true,
    note: 'probable — fitted only on TUSK-equipped vehicles',
  });

  b.addHull({
    geometry: merge([
      hatch({ x: 0, y: P.deckY, z: 2.5, radius: 0.34, periscopes: 3 }),
      box(0.5, 0.1, 0.3, [0, P.deckY + 0.06, 2.86]),
      bothSides(box(0.3, 0.16, 0.22, [1.3, P.deckY + 0.06, 1.9])), // stowage
      bothSides(cyl(0.09, 0.09, 0.22, 12, [1.55, 0.78, 3.62], [Math.PI / 2, 0, 0])), // headlight cluster
      box(1.9, 0.12, 0.3, [0, 0.66, 3.86]), // tow / dozer lugs
    ]),
    name: 'DRIVER STATION & FITTINGS',
    cn: '驾驶员舱口与车体附件',
    spec: 'Centre-line reclining driver hatch with three periscopes',
    explode: [0, 0.8, 0],
    soft: true,
  });

  b.addRunningGear(RUNNING);

  // ---------------------------------------------------------------- turret
  b.addTurret({
    geometry: turretShell({ outline: TURRET_OUTLINE, y0: P.turretY, height: P.turretHeight, inset: 0.12 }),
    tag: 'turret',
    name: 'ANGULAR TURRET SHELL',
    cn: '棱角炮塔壳体',
    spec: 'Flat-faced special armour turret, squared bustle',
    explode: [0, 1.6, 0],
  });

  b.addTurret({
    geometry: merge([
      // Bustle rack and blow-out panel seams.
      stowageBasket({ x: 0, y: P.turretY + 0.55, z: -2.16, width: 2.5, height: 0.62, depth: 0.42, bars: 9 }),
      box(1.15, 0.05, 1.2, [0.62, P.turretY + P.turretHeight, -1.3]),
      box(1.15, 0.05, 1.2, [-0.62, P.turretY + P.turretHeight, -1.3]),
    ]),
    name: 'BUSTLE RACK & BLOW-OUT PANELS',
    cn: '尾舱储物架与泄压板',
    spec: 'Ammunition compartment vents upward through roof panels',
    explode: [0, 1.1, -0.8],
    soft: true,
  });

  b.addTurret({
    geometry: merge([
      hatch({ x: 0.72, y: P.turretY + P.turretHeight, z: -0.5, radius: 0.36, periscopes: 5 }),
      hatch({ x: -0.68, y: P.turretY + P.turretHeight, z: -0.35, radius: 0.32, periscopes: 2 }),
      weaponStation({ x: 0.72, y: P.turretY + P.turretHeight + 0.08, z: -0.2 }),
      // CITV independent thermal viewer, left front of the roof.
      box(0.34, 0.42, 0.36, [-0.62, P.turretY + P.turretHeight + 0.2, 0.55]),
      box(0.36, 0.16, 0.06, [-0.62, P.turretY + P.turretHeight + 0.3, 0.74]),
      // Gunner's primary sight housing, right front.
      box(0.52, 0.3, 0.5, [0.52, P.turretY + P.turretHeight + 0.06, 0.95]),
      box(0.3, 0.18, 0.05, [0.52, P.turretY + P.turretHeight + 0.1, 1.21]),
      cyl(0.028, 0.028, 0.6, 8, [-1.25, P.turretY + P.turretHeight + 0.45, -1.6]),
    ]),
    name: 'ROOF STATIONS & SIGHTS',
    cn: '车顶舱口与观瞄装置',
    spec: 'CITV, gunner primary sight, CROWS remote weapon station',
    explode: [0, 2.3, 0],
  });

  b.addTurret({
    geometry: merge([
      smokeBank({ x: 1.2, y: P.turretY + 0.6, z: 1.0, count: 3, yaw: 0.5 }),
      smokeBank({ x: -1.2, y: P.turretY + 0.6, z: 1.0, count: 3, yaw: -0.5 }),
    ]),
    name: 'SMOKE GRENADE DISCHARGERS',
    cn: '烟雾弹发射器',
    spec: '2 × 6 L8A1 dischargers on the turret cheeks',
    explode: [0, 0.9, 0.6],
    soft: true,
  });

  // -------------------------------------------------------------- armament
  b.addGun({
    geometry: mantlet({ width: 1.05, height: 0.62, depth: 0.52, boreRadius: 0.19 }),
    name: 'GUN MOUNT & MANTLET',
    cn: '火炮防盾',
    spec: 'Narrow mantlet behind the turret front plate',
    explode: [0, 0, 0.9],
  });

  b.addGun({
    geometry: mainGun({
      length: P.barrelLength,
      radius: 0.077,
      breechRadius: 0.14,
      evacuator: { z: 0.46, radius: 0.17, length: 0.66 },
    }),
    tag: 'barrel',
    name: '120 MM M256 SMOOTHBORE L/44',
    cn: '120 毫米 M256 滑膛炮',
    spec: 'L/44 tube with mid-barrel bore evacuator',
    explode: [0, 0, 2.4],
  });

  // -------------------------------------------------------------- interior
  b.addInterior(b.hull, {
    geometry: gasTurbine({ y: 0.95, z: -2.75, radius: 0.52, length: 2.2 }),
    assembly: 'power',
    tag: 'engine',
    name: 'AGT-1500 GAS TURBINE',
    cn: 'AGT-1500 燃气轮机',
    spec: '1500 hp turbine, transverse-mounted powerpack',
    explode: [0, 0, -2.6],
  });

  b.addInterior(b.hull, {
    geometry: transmission({ y: 0.85, z: -3.62, width: 1.7, height: 0.72, depth: 0.6, shaftX: 0.95 }),
    assembly: 'power',
    name: 'X-1100 CROSS-DRIVE TRANSMISSION',
    cn: 'X-1100 综合传动装置',
    spec: 'Four-speed cross-drive with final drives to the rear sprockets',
    explode: [0, 0, -3.4],
  });

  b.addInterior(b.hull, {
    geometry: merge([
      fuelCell({ x: 1.15, y: 0.95, z: -0.5, width: 0.6, height: 0.8, depth: 1.9 }),
      fuelCell({ x: -1.15, y: 0.95, z: -0.5, width: 0.6, height: 0.8, depth: 1.9 }),
      serviceBlock({ x: 0, y: 0.8, z: -1.35, width: 0.9, height: 0.5, depth: 0.5 }),
    ]),
    name: 'SPONSON FUEL CELLS & NBC PACK',
    cn: '侧舱燃油箱与三防装置',
    spec: 'Fuel is carried outboard of the crew compartment',
    explode: [0, 0.4, 0],
    soft: true,
  });

  b.addInterior(b.hull, {
    geometry: torsionBars({ y: 0.56, count: 7, firstZ: RUNNING.wheelFirstZ, pitch: RUNNING.wheelPitch, halfWidth: 1.42 }),
    assembly: 'running',
    name: 'TORSION BAR SUSPENSION',
    cn: '扭杆悬挂',
    spec: 'Seven transverse torsion bars per side with rotary dampers',
    explode: [0, -0.9, 0],
    soft: true,
  });

  b.addInterior(b.hull, {
    geometry: driverStation({ x: 0, y: 0.62, z: 2.5 }),
    name: 'DRIVER (RECLINED)',
    cn: '驾驶员（半躺姿）',
    spec: 'Centre hull, reclined between the fuel cells',
    explode: [0, 0, 2.2],
  });

  b.addInterior(b.turret, {
    geometry: turretBasket({ y: P.turretY, z: -0.1, radius: 1.05, depth: 0.72 }),
    name: 'TURRET BASKET',
    cn: '炮塔吊篮',
    spec: 'Rotating floor carrying the three turret crew',
    explode: [0, -1.0, 0],
    soft: true,
  });

  b.addInterior(b.turret, {
    geometry: gunBreech({ y: P.gunAxisY, z: 0.42, width: 0.5, height: 0.56, depth: 0.9 }),
    assembly: 'gun',
    name: 'GUN BREECH & RECOIL GEAR',
    cn: '炮闩与后座装置',
    spec: 'Vertical sliding breech, hydro-pneumatic recoil cylinders',
    explode: [0, 0, -1.6],
  });

  b.addInterior(b.turret, {
    geometry: merge([
      ammoRack({ x: 0.62, y: P.turretY + 0.5, z: -1.5, width: 1.0, height: 0.72, depth: 0.95, cols: 4, rows: 3 }),
      ammoRack({ x: -0.62, y: P.turretY + 0.5, z: -1.5, width: 1.0, height: 0.72, depth: 0.95, cols: 4, rows: 3 }),
      box(0.12, 0.8, 1.0, [0, P.turretY + 0.5, -1.5]), // armoured sliding door
    ]),
    assembly: 'gun',
    tag: 'ammo',
    name: 'BUSTLE AMMUNITION RACKS',
    cn: '尾舱弹药架（隔舱化）',
    spec: '34 rounds behind a sliding armoured door with roof blow-out panels',
    explode: [0, 0, -2.2],
  });

  b.addInterior(b.turret, {
    geometry: merge([
      crewSeated({ x: 0.75, y: P.turretY + 0.05, z: -0.55, facing: 0.1 }), // commander
      crewSeated({ x: 0.66, y: P.turretY - 0.05, z: 0.32, facing: 0 }), // gunner
      crewSeated({ x: -0.72, y: P.turretY, z: -0.35, facing: -0.35 }), // loader
    ]),
    name: 'TURRET CREW · COMMANDER / GUNNER / LOADER',
    cn: '炮塔乘员：车长 / 炮长 / 装填手',
    spec: 'Four-man crew: the loader is what the autoloader tanks replace',
    explode: [0, 1.0, 0],
  });

  return b.finish();
}

export const CALLOUTS = [
  { tag: 'hull', text: 'LOW-PROFILE SLEEK CHASSIS', side: 'left', dy: 70 },
  { tag: 'turret', text: 'MASSIVE ANGULAR TURRET', side: 'left', dy: -130 },
  { tag: 'barrel', text: '120 MM M256 SMOOTHBORE', side: 'right', dy: -70 },
  { tag: 'mesh', text: 'ANTI-RPG MESH SCREENS', side: 'left', dy: 150 },
  { tag: 'grilles', text: 'TWIN SQUARE DECK GRILLES', side: 'right', dy: -170 },
  { tag: 'engine', text: 'AGT-1500 GAS TURBINE', side: 'right', dy: 110 },
];
