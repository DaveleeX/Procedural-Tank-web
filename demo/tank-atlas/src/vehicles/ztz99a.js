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
  stowageBasket,
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
 * ZTZ-99A (Type 99A).
 *
 * Identity: a turret whose frontal armour is two large plates meeting in a
 * forward-pointing V, tiled with wedge-shaped modular reactive blocks; the
 * boxy JD-3 laser countermeasure unit on the left rear of the roof; a low, sharp
 * hull; and a T-72 style carousel autoloader that removes the fourth crewman.
 */
const P = {
  front: 3.8,
  rear: -3.8,
  floorY: 0.45,
  noseY: 0.68,
  deckY: 1.26,
  engineDeckY: 1.2,
  engineDeckZ: -1.45,
  glacisRun: 2.6,
  width: 3.2,

  turretZ: 0.1,
  turretY: 1.26,
  turretHeight: 0.8,
  gunAxisY: 1.7,
  gunPivotZ: 1.1,
  barrelLength: 5.9,
};

const RUNNING = {
  wheelCount: 6,
  wheelFirstZ: 2.3,
  wheelPitch: 0.92,
  wheelRadius: 0.375,
  wheelWidth: 0.12,
  wheelX: 1.42,
  returnRollers: [1.85, 0.3, -1.4],
  rollerRadius: 0.09,
  rollerY: 0.92,
  sprocket: { z: -3.22, y: 0.7, r: 0.3, width: 0.2, teeth: 14 },
  idler: { z: 3.12, y: 0.46, r: 0.28, width: 0.19 },
  trackCentre: 1.42,
  trackWidth: 0.58,
  linkPitch: 0.185,
  linkThickness: 0.042,
  cleatDepth: 0.02,
};

// The V: the turret face comes to a point on the centre line and rakes back.
const TURRET_OUTLINE = mirrorOutline([
  [0, 1.42],
  [0.9, 1.0],
  [1.32, 0.15],
  [1.34, -0.95],
  [1.2, -1.86],
  [0, -1.95],
]);

export function build(meta) {
  const b = new VehicleBuilder(meta, { turretZ: P.turretZ, gunAxisY: P.gunAxisY, gunPivotZ: P.gunPivotZ });

  // ------------------------------------------------------------------ hull
  b.addHull({
    tag: 'hull',
    geometry: hullSolid(P),
    name: 'WELDED HULL & GLACIS',
    cn: '焊接车体与首上装甲',
    spec: 'Steeply raked glacis carrying a full face of reactive blocks',
    explode: [0, 0, 0],
  });

  b.addHull({
    tag: 'glacis-era',
    geometry: eraPatch({
      origin: [-1.42, P.noseY + 0.02, P.front - 0.06],
      u: [2.84, 0, 0],
      v: [0, 0.62, -2.36], // follows the glacis slope
      nu: 7,
      nv: 3,
      brick: 0.11,
      gap: 0.035,
    }),
    name: 'GLACIS REACTIVE ARMOUR ARRAY',
    cn: '首上反应装甲阵列',
    spec: 'Modular ERA cassettes across the full glacis',
    explode: [0, 0.5, 1.5],
  });

  b.addHull({
    tag: 'skirt',
    geometry: merge([
      sideSkirt({ x: 1.70, front: 3.0, rear: -3.4, top: 1.24, bottom: 0.5, thickness: 0.06 }),
      sideSkirt({ x: -1.70, front: 3.0, rear: -3.4, top: 1.24, bottom: 0.5, thickness: 0.06 }),
      bothSides(box(0.12, 0.66, 2.4, [1.73, 0.88, 1.6])), // heavy forward ERA skirt
      bothSides(box(0.04, 0.5, 0.7, [1.73, 0.8, -2.9])),
    ]),
    name: 'SIDE SKIRTS & FORWARD ERA PANELS',
    cn: '侧裙板与前段反应装甲',
    spec: 'Heavy composite panels over the first three stations',
    explode: [0, 0.2, 0],
  });

  b.addHull({
    assembly: 'power',
    tag: 'grilles',
    geometry: merge([
      grille({ x: 0, y: P.engineDeckY + 0.02, z: -2.2, width: 2.2, depth: 1.0, louvres: 8 }),
      grille({ x: 0.95, y: P.engineDeckY + 0.02, z: -3.2, width: 1.1, depth: 0.75, louvres: 5 }),
      grille({ x: -0.95, y: P.engineDeckY + 0.02, z: -3.2, width: 1.1, depth: 0.75, louvres: 5 }),
      cyl(0.26, 0.26, 0.5, 16, [1.35, 1.45, -1.1]), // unditching / snorkel stowage
      cyl(0.26, 0.26, 0.5, 16, [-1.35, 1.45, -1.1]),
    ]),
    name: 'ENGINE DECK & SNORKEL DRUMS',
    cn: '发动机甲板与潜渡通气管',
    spec: 'Transverse 1500 hp powerpack with deep-fording drums stowed alongside',
    explode: [0, 1.1, 0],
  });

  b.addHull({
    geometry: merge([
      hatch({ x: 0, y: P.deckY, z: 2.15, radius: 0.3, periscopes: 3 }),
      bothSides(cyl(0.09, 0.09, 0.2, 12, [1.3, 0.82, 3.55], [Math.PI / 2, 0, 0])),
      bothSides(box(0.3, 0.18, 0.44, [1.42, P.deckY + 0.09, -0.3])),
      box(1.4, 0.12, 0.2, [0, 0.62, 3.78]),
    ]),
    name: 'DRIVER HATCH & HULL FITTINGS',
    cn: '驾驶员舱口与车体附件',
    spec: 'Driver on the centre line, unusual for a three-man crew',
    explode: [0, 0.9, 0],
    soft: true,
  });

  b.addRunningGear(RUNNING);

  // ---------------------------------------------------------------- turret
  b.addTurret({
    tag: 'turret',
    geometry: turretShell({ outline: TURRET_OUTLINE, y0: P.turretY, height: P.turretHeight, inset: 0.09 }),
    name: 'V-FRONT WELDED TURRET',
    cn: 'V 型正面焊接炮塔',
    spec: 'Two large frontal plates meeting on the centre line at a sharp angle',
    explode: [0, 1.5, 0],
  });

  // Wedge-shaped ERA cassettes tiled over both faces of the V.
  const eraFace = (sign) =>
    eraPatch({
      origin: sign > 0 ? [0.04, P.turretY + 0.08, 1.4] : [-0.92, P.turretY + 0.08, 0.98],
      u: sign > 0 ? [0.9, 0, -0.44] : [0.88, 0, 0.44],
      v: [0, 0.64, 0],
      nu: 3,
      nv: 3,
      brick: 0.15,
      gap: 0.04,
    });
  b.addTurret({
    tag: 'era',
    geometry: merge([
      eraFace(1),
      eraFace(-1),
      // Cheek cassettes wrapping onto the turret sides.
      bothSides(box(0.16, 0.6, 1.0, [1.34, P.turretY + 0.4, -0.3])),
    ]),
    name: 'V-SHAPED MODULAR REACTIVE ARMOUR',
    cn: 'V 型正面模块化反应装甲',
    spec: 'Wedge cassettes angled to defeat tandem shaped charges',
    explode: [0, 0.8, 1.8],
  });

  b.addTurret({
    tag: 'laser',
    geometry: merge([
      box(0.52, 0.34, 0.44, [-0.62, P.turretY + P.turretHeight + 0.19, -1.1]),
      cyl(0.16, 0.16, 0.26, 18, [-0.62, P.turretY + P.turretHeight + 0.5, -1.1]),
      cyl(0.13, 0.13, 0.1, 18, [-0.62, P.turretY + P.turretHeight + 0.5, -0.95], [Math.PI / 2, 0, 0]),
      box(0.24, 0.16, 0.06, [-0.62, P.turretY + P.turretHeight + 0.5, -0.9]),
    ]),
    name: 'JD-3 LASER COUNTERMEASURE UNIT',
    cn: 'JD-3 激光压制观瞄装置',
    spec: 'Roof-mounted laser dazzler, unique to the Type 99 family',
    explode: [0, 2.4, -0.6],
  });

  b.addTurret({
    geometry: merge([
      hatch({ x: 0.6, y: P.turretY + P.turretHeight, z: -0.55, radius: 0.32, periscopes: 4 }),
      hatch({ x: -0.6, y: P.turretY + P.turretHeight, z: -0.35, radius: 0.3, periscopes: 2 }),
      weaponStation({ x: 0.6, y: P.turretY + P.turretHeight + 0.06, z: -0.28 }),
      box(0.44, 0.3, 0.42, [-0.5, P.turretY + P.turretHeight + 0.12, 0.5]), // commander sight
      box(0.5, 0.26, 0.44, [0.55, P.turretY + P.turretHeight + 0.02, 0.62]), // gunner sight
      box(0.3, 0.14, 0.05, [0.55, P.turretY + P.turretHeight + 0.06, 0.85]),
      cyl(0.026, 0.026, 0.6, 8, [1.15, P.turretY + P.turretHeight + 0.45, -1.5]),
    ]),
    name: 'ROOF SIGHTS & HATCHES',
    cn: '车顶观瞄与舱口',
    spec: 'Commander panoramic sight, gunner thermal sight, 12.7 mm station',
    explode: [0, 2.2, 0],
  });

  b.addTurret({
    geometry: merge([
      stowageBasket({ x: 0, y: P.turretY + 0.42, z: -2.12, width: 2.0, height: 0.58, depth: 0.38, bars: 7 }),
      smokeBank({ x: 1.2, y: P.turretY + 0.6, z: 0.15, count: 4, yaw: 0.7 }),
      smokeBank({ x: -1.2, y: P.turretY + 0.6, z: 0.15, count: 4, yaw: -0.7 }),
    ]),
    name: 'BUSTLE BASKET & SMOKE DISCHARGERS',
    cn: '尾舱储物架与烟雾弹发射器',
    spec: 'Two banks of dischargers on the turret sides',
    explode: [0, 0.9, -1.0],
    soft: true,
  });

  // -------------------------------------------------------------- armament
  b.addGun({
    geometry: mantlet({ width: 0.8, height: 0.6, depth: 0.46, boreRadius: 0.19 }),
    name: 'MANTLET & TRUNNIONS',
    cn: '火炮防盾与耳轴',
    spec: 'Compact mantlet inside the V, protected by cassettes',
    explode: [0, 0, 1.0],
  });

  b.addGun({
    tag: 'barrel',
    geometry: mainGun({
      length: P.barrelLength,
      radius: 0.078,
      breechRadius: 0.15,
      evacuator: { z: 0.42, radius: 0.175, length: 0.62 },
    }),
    name: '125 MM SMOOTHBORE GUN',
    cn: '125 毫米滑膛炮',
    spec: 'Autoloaded two-piece ammunition, gun-launched ATGM capable',
    explode: [0, 0, 2.7],
  });

  // -------------------------------------------------------------- interior
  b.addInterior(b.hull, {
    assembly: 'power',
    tag: 'engine',
    geometry: dieselEngine({ y: 0.9, z: -2.5, width: 1.85, height: 0.9, depth: 1.6, banks: 2, fans: 2 }),
    name: '150HB DIESEL V-12',
    cn: '150HB 系列 V12 柴油机',
    spec: '1500 hp turbocharged diesel in a transverse powerpack',
    explode: [0, 0, -2.7],
  });

  b.addInterior(b.hull, {
    assembly: 'power',
    geometry: transmission({ y: 0.78, z: -3.5, width: 1.7, height: 0.66, depth: 0.5, shaftX: 0.95 }),
    name: 'HYDROMECHANICAL TRANSMISSION',
    cn: '液力机械综合传动',
    spec: 'Rear powerpack driving the rear sprockets directly',
    explode: [0, 0, -3.4],
  });

  b.addInterior(b.hull, {
    tag: 'autoloader',
    geometry: carouselAutoloader({ y: 0.72, z: P.turretZ, radius: 1.0, rounds: 22, length: 0.66 }),
    assembly: 'gun',
    name: 'CAROUSEL AUTOLOADER (22 ROUNDS)',
    cn: '转盘式自动装弹机（22 发）',
    spec: 'Projectiles and charges lie flat in the hull floor under the turret',
    explode: [0, -1.3, 0],
  });

  b.addInterior(b.hull, {
    geometry: merge([
      fuelCell({ x: 1.15, y: 0.85, z: 1.4, width: 0.5, height: 0.7, depth: 1.6 }),
      fuelCell({ x: -1.15, y: 0.85, z: 1.4, width: 0.5, height: 0.7, depth: 1.6 }),
      serviceBlock({ x: 0, y: 0.8, z: -1.25, width: 1.0, height: 0.5, depth: 0.5 }),
    ]),
    name: 'FUEL CELLS & AUXILIARY SYSTEMS',
    cn: '燃油箱与辅助系统',
    spec: 'Fuel flanks the driver ahead of the fighting compartment',
    explode: [0, 0.5, 0],
    soft: true,
  });

  b.addInterior(b.hull, {
    assembly: 'running',
    geometry: torsionBars({ y: 0.56, count: 6, firstZ: RUNNING.wheelFirstZ, pitch: RUNNING.wheelPitch, halfWidth: 1.35 }),
    name: 'TORSION BAR SUSPENSION',
    cn: '扭杆悬挂',
    spec: 'Six stations per side with hydraulic dampers at the ends',
    explode: [0, -0.9, 0],
    soft: true,
  });

  b.addInterior(b.hull, {
    geometry: driverStation({ x: 0, y: 0.6, z: 2.15 }),
    name: 'DRIVER (CENTRE, RECLINED)',
    cn: '驾驶员（居中，半躺姿）',
    spec: 'Centre-line driver between the forward fuel cells',
    explode: [0, 0, 2.2],
  });

  b.addInterior(b.turret, {
    assembly: 'gun',
    geometry: gunBreech({ y: P.gunAxisY, z: 0.2, width: 0.52, height: 0.6, depth: 0.9 }),
    name: 'GUN BREECH & LOADING TRAY',
    cn: '炮闩与输弹机',
    spec: 'Breech drops to load; the autoloader rams projectile then charge',
    explode: [0, 0, -1.6],
  });

  b.addInterior(b.turret, {
    tag: 'crew',
    geometry: merge([
      crewSeated({ x: 0.62, y: P.turretY - 0.35, z: -0.5, facing: 0 }), // commander
      crewSeated({ x: -0.62, y: P.turretY - 0.35, z: -0.3, facing: 0 }), // gunner
    ]),
    name: 'TURRET CREW · COMMANDER / GUNNER',
    cn: '炮塔乘员：车长 / 炮长',
    spec: 'Only two in the turret — the autoloader replaces the loader',
    explode: [0, 1.0, 0],
  });

  return b.finish();
}

export const CALLOUTS = [
  { tag: 'era', text: 'V-SHAPED MODULAR ERA', side: 'right', dy: -140 },
  { tag: 'laser', text: 'JD-3 LASER DAZZLER', side: 'left', dy: -150 },
  { tag: 'barrel', text: '125 MM SMOOTHBORE', side: 'right', dy: -40 },
  { tag: 'autoloader', text: 'CAROUSEL AUTOLOADER', side: 'left', dy: 60 },
  { tag: 'glacis-era', text: 'GLACIS ERA ARRAY', side: 'right', dy: 90 },
  { tag: 'engine', text: '1500 HP POWERPACK', side: 'left', dy: -30 },
];
