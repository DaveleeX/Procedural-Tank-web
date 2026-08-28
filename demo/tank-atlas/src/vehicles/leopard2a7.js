import { box, cyl, merge, bothSides, mirrorOutline, prismoid } from '../geo.js';
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
  panoramicSight,
  stowageBasket,
} from '../kit.js';
import {
  dieselEngine,
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
 * Leopard 2A7.
 *
 * Identity: the arrowhead Vorpanzer wedge modules bolted onto a boxy welded
 * turret, the very long Rh-120 L/55, the PERI panoramic commander's sight above
 * the roof, and a squared-off German hull with heavy chain-and-plate skirts.
 */
const P = {
  front: 3.85,
  rear: -3.85,
  floorY: 0.47,
  noseY: 0.76,
  deckY: 1.35,
  engineDeckY: 1.3,
  engineDeckZ: -1.55,
  glacisRun: 2.35,
  width: 3.4,

  turretZ: 0.15,
  turretY: 1.35,
  turretHeight: 0.92,
  gunAxisY: 1.86,
  gunPivotZ: 1.3,
  barrelLength: 5.33, // L/55 — the longest tube in the atlas
};

const RUNNING = {
  wheelCount: 7,
  wheelFirstZ: 2.5,
  wheelPitch: 0.8,
  wheelRadius: 0.35,
  wheelWidth: 0.13,
  wheelX: 1.5,
  returnRollers: [2.1, 0.6, -0.9, -2.3],
  rollerRadius: 0.1,
  rollerY: 1.0,
  sprocket: { z: -3.32, y: 0.76, r: 0.32, width: 0.22, teeth: 11 },
  idler: { z: 3.24, y: 0.5, r: 0.3, width: 0.2 },
  trackCentre: 1.5,
  trackWidth: 0.635,
  linkPitch: 0.19,
  linkThickness: 0.045,
  cleatDepth: 0.022,
};

const TURRET_OUTLINE = mirrorOutline([
  [0, 1.52],
  [0.95, 1.46],
  [1.3, 0.92],
  [1.32, -0.4],
  [1.32, -2.02],
  [0, -2.08],
]);

/**
 * One half of the arrowhead. The rear edge follows the turret face so the module
 * is bolted onto it rather than floating in front of it.
 */
function wedgeHalf(sign, y0, y1) {
  const outline = [
    [sign * 0.3, 2.18],
    [sign * 1.31, 1.1],
    [sign * 1.33, 0.86],
    [sign * 0.3, 1.46],
  ];
  const ordered = sign > 0 ? outline : [...outline].reverse();
  return prismoid(ordered, ordered.map(([x, z]) => [x * 0.97, z]), y0, y1);
}

export function build(meta) {
  const b = new VehicleBuilder(meta, { turretZ: P.turretZ, gunAxisY: P.gunAxisY, gunPivotZ: P.gunPivotZ });

  // ------------------------------------------------------------------ hull
  b.addHull({
    tag: 'hull',
    geometry: hullSolid(P),
    name: 'WELDED HULL & GLACIS',
    cn: '焊接车体与首上装甲',
    spec: 'Spaced multilayer glacis, 470 mm ground clearance',
    explode: [0, 0, 0],
  });

  b.addHull({
    tag: 'skirt',
    geometry: merge([
      sideSkirt({ x: 1.79, front: 3.2, rear: -3.5, top: 1.33, bottom: 0.46, thickness: 0.07 }),
      sideSkirt({ x: -1.79, front: 3.2, rear: -3.5, top: 1.33, bottom: 0.46, thickness: 0.07 }),
      // Heavy AMAP modules over the first three stations.
      bothSides(box(0.12, 0.78, 2.3, [1.82, 0.9, 1.75])),
      bothSides(box(0.06, 0.3, 0.9, [1.82, 0.4, 2.4])),
    ]),
    name: 'AMAP SIDE MODULES & SKIRTS',
    cn: 'AMAP 侧装甲模块与裙板',
    spec: 'Heavy composite modules forward, hinged plates aft',
    explode: [0, 0.2, 0],
  });

  b.addHull({
    assembly: 'power',
    tag: 'grilles',
    geometry: merge([
      grille({ x: 0, y: P.engineDeckY + 0.02, z: -2.3, width: 2.5, depth: 1.15, louvres: 9 }),
      grille({ x: 1.05, y: P.engineDeckY + 0.02, z: -3.35, width: 1.0, depth: 0.7, louvres: 5 }),
      grille({ x: -1.05, y: P.engineDeckY + 0.02, z: -3.35, width: 1.0, depth: 0.7, louvres: 5 }),
      box(3.3, 0.05, 0.1, [0, P.engineDeckY + 0.02, -1.65]),
    ]),
    name: 'POWERPACK COOLING GRILLES',
    cn: '动力舱散热格栅',
    spec: 'Cooling stack above the MTU powerpack, removable as one unit',
    explode: [0, 1.2, 0],
  });

  b.addHull({
    geometry: merge([
      hatch({ x: 0.78, y: P.deckY, z: 2.35, radius: 0.32, periscopes: 3 }),
      bothSides(cyl(0.1, 0.1, 0.24, 14, [1.45, 0.86, 3.6], [Math.PI / 2, 0, 0])),
      box(1.6, 0.14, 0.22, [0, 0.72, 3.83]),
      bothSides(box(0.34, 0.2, 0.5, [1.5, P.deckY + 0.1, -0.4])), // sponson tool bins
      box(0.55, 0.12, 0.3, [-0.9, P.deckY + 0.06, 2.5]),
    ]),
    name: 'DRIVER HATCH & HULL FITTINGS',
    cn: '驾驶员舱口与车体附件',
    spec: 'Driver sits front right with three periscopes',
    explode: [0, 0.9, 0],
    soft: true,
  });

  b.addRunningGear(RUNNING);

  // ---------------------------------------------------------------- turret
  b.addTurret({
    tag: 'turret',
    geometry: turretShell({ outline: TURRET_OUTLINE, y0: P.turretY, height: P.turretHeight, inset: 0.1 }),
    name: 'WELDED TURRET SHELL',
    cn: '焊接炮塔壳体',
    spec: 'Box turret with a long bustle carrying 15 ready rounds',
    explode: [0, 1.7, 0],
  });

  b.addTurret({
    tag: 'wedge',
    geometry: merge([
      wedgeHalf(1, P.turretY + 0.06, P.turretY + 0.86),
      wedgeHalf(-1, P.turretY + 0.06, P.turretY + 0.86),
      // Thin spall liners tying the wedges back to the turret face.
      bothSides(box(0.1, 0.8, 0.3, [1.15, P.turretY + 0.46, 0.8])),
    ]),
    name: 'ARROWHEAD WEDGE ARMOUR (VORPANZER)',
    cn: '箭镞状楔形附加装甲',
    spec: 'Spaced wedge modules deflecting shaped charges away from the turret face',
    explode: [0, 0.9, 2.0],
  });

  b.addTurret({
    tag: 'peri',
    geometry: merge([
      panoramicSight({ x: -0.62, y: P.turretY + P.turretHeight, z: -0.15, width: 0.4, height: 0.5, depth: 0.42 }),
      box(0.3, 0.12, 0.3, [-0.62, P.turretY + P.turretHeight + 0.02, -0.15]),
    ]),
    name: 'PERI R17 PANORAMIC SIGHT',
    cn: 'PERI R17 车长全景瞄准镜',
    spec: 'Stabilised 360° commander sight with independent thermal channel',
    explode: [0, 2.4, 0],
  });

  b.addTurret({
    geometry: merge([
      hatch({ x: -0.62, y: P.turretY + P.turretHeight, z: -0.85, radius: 0.33, periscopes: 4 }),
      hatch({ x: 0.68, y: P.turretY + P.turretHeight, z: -0.7, radius: 0.31, periscopes: 2 }),
      // EMES 15 gunner's sight in the turret roof, right of the gun.
      box(0.46, 0.28, 0.5, [0.6, P.turretY + P.turretHeight + 0.04, 0.75]),
      box(0.3, 0.16, 0.05, [0.6, P.turretY + P.turretHeight + 0.08, 1.02]),
      weaponStation({ x: 0.68, y: P.turretY + P.turretHeight + 0.06, z: -0.42 }),
      cyl(0.028, 0.028, 0.6, 8, [-1.2, P.turretY + P.turretHeight + 0.45, -1.7]),
    ]),
    name: 'ROOF STATIONS & EMES 15 SIGHT',
    cn: '车顶舱口与 EMES 15 主瞄准镜',
    spec: 'Commander and loader hatches, FLW 200 remote station',
    explode: [0, 2.3, 0],
  });

  b.addTurret({
    geometry: merge([
      stowageBasket({ x: 0, y: P.turretY + 0.5, z: -2.28, width: 2.3, height: 0.66, depth: 0.4, bars: 8 }),
      smokeBank({ x: 1.28, y: P.turretY + 0.62, z: 0.6, count: 4, yaw: 0.55 }),
      smokeBank({ x: -1.28, y: P.turretY + 0.62, z: 0.6, count: 4, yaw: -0.55 }),
      bothSides(box(0.06, 0.5, 1.1, [1.34, P.turretY + 0.5, -1.2])), // side armour plates
    ]),
    name: 'BUSTLE BASKET & SMOKE DISCHARGERS',
    cn: '尾舱储物架与烟雾弹发射器',
    spec: '2 × 8 76 mm dischargers, stowage basket across the bustle',
    explode: [0, 1.0, -1.1],
    soft: true,
  });

  // -------------------------------------------------------------- armament
  b.addGun({
    geometry: mantlet({ width: 0.86, height: 0.66, depth: 0.5, boreRadius: 0.2 }),
    name: 'MANTLET & TRUNNIONS',
    cn: '火炮防盾与耳轴',
    spec: 'Narrow mantlet recessed between the wedge modules',
    explode: [0, 0, 1.0],
  });

  b.addGun({
    tag: 'barrel',
    geometry: mainGun({
      length: P.barrelLength,
      radius: 0.073,
      breechRadius: 0.14,
      evacuator: { z: 0.5, radius: 0.165, length: 0.6 },
    }),
    name: 'RHEINMETALL Rh-120 L/55',
    cn: '莱茵金属 Rh-120 L/55 滑膛炮',
    spec: '6.6 m tube — 1.3 m longer than the L/44 it replaced',
    explode: [0, 0, 2.6],
  });

  // -------------------------------------------------------------- interior
  b.addInterior(b.hull, {
    assembly: 'power',
    tag: 'engine',
    geometry: dieselEngine({ y: 0.95, z: -2.6, width: 1.9, height: 0.95, depth: 1.7, banks: 2, fans: 2 }),
    name: 'MTU MB 873 Ka-501 V-12',
    cn: 'MTU MB 873 Ka-501 V12 柴油机',
    spec: '47.6 litre twin-turbo diesel, 1500 PS',
    explode: [0, 0, -2.8],
  });

  b.addInterior(b.hull, {
    assembly: 'power',
    geometry: transmission({ y: 0.82, z: -3.6, width: 1.8, height: 0.7, depth: 0.55, shaftX: 1.0 }),
    name: 'RENK HSWL 354 TRANSMISSION',
    cn: 'RENK HSWL 354 液力机械传动',
    spec: 'Four forward, two reverse; powerpack swaps in 15 minutes',
    explode: [0, 0, -3.5],
  });

  b.addInterior(b.hull, {
    geometry: merge([
      fuelCell({ x: 1.2, y: 0.9, z: -0.3, width: 0.55, height: 0.75, depth: 2.0 }),
      fuelCell({ x: -1.2, y: 0.9, z: -0.3, width: 0.55, height: 0.75, depth: 2.0 }),
      ammoRack({ x: -0.75, y: 0.95, z: 2.2, width: 0.8, height: 0.85, depth: 1.1, cols: 3, rows: 3 }),
      serviceBlock({ x: 0.9, y: 0.8, z: -1.2, width: 0.8, height: 0.5, depth: 0.6 }),
    ]),
    tag: 'ammo',
    name: 'HULL AMMUNITION MAGAZINE & FUEL',
    cn: '车体弹药舱与燃油箱',
    spec: '27 rounds left of the driver behind a bulkhead, 15 more in the bustle',
    explode: [0, 0.6, 0],
  });

  b.addInterior(b.hull, {
    assembly: 'running',
    geometry: torsionBars({ y: 0.58, count: 7, firstZ: RUNNING.wheelFirstZ, pitch: RUNNING.wheelPitch, halfWidth: 1.42 }),
    name: 'TORSION BAR SUSPENSION',
    cn: '扭杆悬挂',
    spec: 'Seven stations per side with friction dampers',
    explode: [0, -0.9, 0],
    soft: true,
  });

  b.addInterior(b.hull, {
    geometry: driverStation({ x: 0.78, y: 0.62, z: 2.35 }),
    name: 'DRIVER (RECLINED, FRONT RIGHT)',
    cn: '驾驶员（右前，半躺姿）',
    spec: 'Reclines under the closed hatch, ammunition bulkhead to the left',
    explode: [0, 0, 2.3],
  });

  b.addInterior(b.turret, {
    geometry: turretBasket({ y: P.turretY, z: -0.15, radius: 1.05, depth: 0.75 }),
    name: 'TURRET BASKET',
    cn: '炮塔吊篮',
    spec: 'Carries commander, gunner and loader',
    explode: [0, -1.0, 0],
    soft: true,
  });

  b.addInterior(b.turret, {
    assembly: 'gun',
    geometry: gunBreech({ y: P.gunAxisY, z: 0.35, width: 0.5, height: 0.58, depth: 0.95 }),
    name: 'GUN BREECH & RECOIL GEAR',
    cn: '炮闩与后座装置',
    spec: 'Semi-automatic wedge breech, 370 mm recoil stroke',
    explode: [0, 0, -1.7],
  });

  b.addInterior(b.turret, {
    assembly: 'gun',
    geometry: ammoRack({ x: 0, y: P.turretY + 0.46, z: -1.55, width: 1.5, height: 0.66, depth: 0.95, cols: 6, rows: 2 }),
    name: 'BUSTLE READY ROUNDS',
    cn: '尾舱待发弹',
    spec: '15 rounds behind a sliding door with roof blow-out panels',
    explode: [0, 0, -2.4],
  });

  b.addInterior(b.turret, {
    tag: 'crew',
    geometry: merge([
      crewSeated({ x: -0.62, y: P.turretY + 0.02, z: -0.75, facing: 0.05 }), // commander
      crewSeated({ x: -0.6, y: P.turretY - 0.06, z: 0.2, facing: 0 }), // gunner
      crewSeated({ x: 0.68, y: P.turretY, z: -0.5, facing: 0.4 }), // loader
    ]),
    name: 'TURRET CREW · COMMANDER / GUNNER / LOADER',
    cn: '炮塔乘员：车长 / 炮长 / 装填手',
    spec: 'Commander and gunner sit left, loader right — mirrored from the Abrams',
    explode: [0, 1.0, 0],
  });

  return b.finish();
}

export const CALLOUTS = [
  { tag: 'wedge', text: 'ARROWHEAD WEDGE ARMOUR', side: 'right', dy: -150 },
  { tag: 'peri', text: 'PERI R17 PANORAMIC SIGHT', side: 'left', dy: -140 },
  { tag: 'barrel', text: 'Rh-120 L/55 SMOOTHBORE', side: 'right', dy: -50 },
  { tag: 'skirt', text: 'AMAP SIDE MODULES', side: 'left', dy: 90 },
  { tag: 'engine', text: 'MTU MB 873 POWERPACK', side: 'left', dy: -20 },
  { tag: 'grilles', text: 'COOLING STACK', side: 'right', dy: 110 },
];
