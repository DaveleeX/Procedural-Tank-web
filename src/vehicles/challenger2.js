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
  hydrogasUnits,
  fuelCell,
  serviceBlock,
} from '../internals.js';
import { VehicleBuilder } from '../vehicle.js';

/**
 * Challenger 2.
 *
 * Identity: the heavy-set one. A tall slab-sided turret, Dorchester side skirts
 * thick enough to change the vehicle's width by half a metre, and the only rifled
 * 120 mm in service — recognisable by the full-length thermal sleeve and the
 * separate bagged charges stowed in armoured bins below the turret ring.
 */
const P = {
  front: 4.15,
  rear: -4.15,
  floorY: 0.5,
  noseY: 0.82,
  deckY: 1.42,
  engineDeckY: 1.36,
  engineDeckZ: -1.85,
  glacisRun: 2.25,
  width: 3.3,

  turretZ: 0.2,
  turretY: 1.42,
  turretHeight: 1.03,
  gunAxisY: 1.98,
  gunPivotZ: 1.35,
  barrelLength: 5.85,
};

const RUNNING = {
  wheelCount: 6,
  wheelFirstZ: 2.45,
  wheelPitch: 0.95,
  wheelRadius: 0.4,
  wheelWidth: 0.14,
  wheelX: 1.45,
  returnRollers: [2.0, 0.3, -1.6],
  rollerRadius: 0.1,
  rollerY: 1.02,
  sprocket: { z: -3.5, y: 0.8, r: 0.32, width: 0.23, teeth: 12 },
  idler: { z: 3.5, y: 0.52, r: 0.3, width: 0.21 },
  trackCentre: 1.45,
  trackWidth: 0.65,
  linkPitch: 0.2,
  linkThickness: 0.048,
  cleatDepth: 0.024,
};

const TURRET_OUTLINE = mirrorOutline([
  [0, 1.62],
  [0.86, 1.54],
  [1.36, 0.92],
  [1.4, -0.42],
  [1.4, -1.86],
  [0, -1.94],
]);

export function build(meta) {
  const b = new VehicleBuilder(meta, { turretZ: P.turretZ, gunAxisY: P.gunAxisY, gunPivotZ: P.gunPivotZ });

  // ------------------------------------------------------------------ hull
  b.addHull({
    tag: 'hull',
    geometry: hullSolid(P),
    name: 'HULL & DORCHESTER GLACIS',
    cn: '车体与乔巴姆首上装甲',
    spec: 'Deep, heavy hull — 62.5 t bare, 75 t with the theatre entry package',
    explode: [0, 0, 0],
  });

  // The signature: side skirts thick enough to widen the vehicle to 4.2 m.
  b.addHull({
    tag: 'skirt',
    geometry: merge([
      sideSkirt({ x: 1.94, front: 3.3, rear: -3.7, top: 1.4, bottom: 0.56, thickness: 0.22, panels: 5, gap: 0.045 }),
      sideSkirt({ x: -1.94, front: 3.3, rear: -3.7, top: 1.4, bottom: 0.56, thickness: 0.22, panels: 5, gap: 0.045 }),
      bothSides(box(0.26, 0.9, 2.4, [2.0, 0.98, 2.0])), // heaviest modules forward
      bothSides(box(0.12, 0.36, 1.0, [1.98, 0.44, 2.6])),
    ]),
    name: 'CHOBHAM / DORCHESTER SIDE SKIRTS',
    cn: '乔巴姆（多切斯特）厚重侧裙板',
    spec: '220 mm thick modules — they alone take the vehicle to 4.2 m wide',
    explode: [0, 0.25, 0],
  });

  b.addHull({
    assembly: 'power',
    tag: 'grilles',
    geometry: merge([
      grille({ x: 0, y: P.engineDeckY + 0.02, z: -2.6, width: 2.6, depth: 1.3, louvres: 9 }),
      grille({ x: 1.1, y: P.engineDeckY + 0.02, z: -3.7, width: 0.95, depth: 0.7, louvres: 5 }),
      grille({ x: -1.1, y: P.engineDeckY + 0.02, z: -3.7, width: 0.95, depth: 0.7, louvres: 5 }),
      box(3.2, 0.06, 0.12, [0, P.engineDeckY + 0.02, -1.92]),
      bothSides(box(0.3, 0.34, 0.5, [1.4, 1.2, -4.05])), // exhaust outlets
    ]),
    name: 'POWERPACK DECK & EXHAUSTS',
    cn: '动力舱甲板与排气口',
    spec: 'CV12 diesel with side-mounted exhaust outlets',
    explode: [0, 1.2, 0],
  });

  b.addHull({
    geometry: merge([
      hatch({ x: 0, y: P.deckY, z: 2.62, radius: 0.32, periscopes: 3 }),
      bothSides(cyl(0.1, 0.1, 0.24, 14, [1.5, 0.94, 3.9], [Math.PI / 2, 0, 0])),
      box(1.8, 0.14, 0.26, [0, 0.78, 4.1]),
      bothSides(box(0.34, 0.24, 0.7, [1.5, P.deckY + 0.12, -0.6])), // bins on the track guards
      bothSides(box(0.34, 0.24, 0.7, [1.5, P.deckY + 0.12, 0.55])),
    ]),
    name: 'DRIVER HATCH & STOWAGE BINS',
    cn: '驾驶员舱口与车体储物箱',
    spec: 'Driver reclines on the centre line; bins line both track guards',
    explode: [0, 0.9, 0],
    soft: true,
  });

  b.addRunningGear(RUNNING);

  // ---------------------------------------------------------------- turret
  b.addTurret({
    tag: 'turret',
    geometry: turretShell({ outline: TURRET_OUTLINE, y0: P.turretY, height: P.turretHeight, inset: 0.09 }),
    name: 'SLAB-SIDED TURRET',
    cn: '厚重平直炮塔',
    spec: 'Tall vertical flanks — the bulkiest turret in the atlas',
    explode: [0, 1.9, 0],
  });

  b.addTurret({
    geometry: merge([
      stowageBasket({ x: 0, y: P.turretY + 0.6, z: -2.18, width: 2.4, height: 0.76, depth: 0.44, bars: 9 }),
      bothSides(box(0.1, 0.62, 1.7, [1.42, P.turretY + 0.5, -0.9])), // applique side plates
      bothSides(box(0.16, 0.44, 0.6, [1.4, P.turretY + 0.62, 0.72])),
    ]),
    tag: 'applique',
    name: 'TURRET APPLIQUE & BUSTLE BASKET',
    cn: '炮塔附加装甲与尾舱储物架',
    spec: 'Bolt-on side plates plus a deep stowage basket',
    explode: [0, 1.1, -1.0],
    soft: true,
  });

  b.addTurret({
    geometry: merge([
      hatch({ x: 0.7, y: P.turretY + P.turretHeight, z: -0.55, radius: 0.35, periscopes: 5 }),
      hatch({ x: -0.66, y: P.turretY + P.turretHeight, z: -0.4, radius: 0.32, periscopes: 2 }),
      weaponStation({ x: -0.66, y: P.turretY + P.turretHeight + 0.06, z: -0.12, remote: false }),
      box(0.5, 0.34, 0.46, [-0.58, P.turretY + P.turretHeight + 0.18, 0.62]), // commander sight
      box(0.56, 0.3, 0.52, [0.58, P.turretY + P.turretHeight + 0.04, 0.8]), // gunner primary sight
      box(0.32, 0.18, 0.05, [0.58, P.turretY + P.turretHeight + 0.08, 1.08]),
      cyl(0.03, 0.03, 0.6, 8, [-1.25, P.turretY + P.turretHeight + 0.5, -1.4]),
      cyl(0.03, 0.03, 0.6, 8, [1.25, P.turretY + P.turretHeight + 0.5, -1.4]),
    ]),
    name: 'ROOF STATIONS & SIGHTS',
    cn: '车顶舱口与观瞄装置',
    spec: 'Commander and loader hatches, pintle-mounted L37A2',
    explode: [0, 2.5, 0],
  });

  b.addTurret({
    geometry: merge([
      smokeBank({ x: 1.24, y: P.turretY + 0.68, z: 0.55, count: 5, yaw: 0.45, spread: 0.13 }),
      smokeBank({ x: -1.24, y: P.turretY + 0.68, z: 0.55, count: 5, yaw: -0.45, spread: 0.13 }),
    ]),
    name: 'SMOKE GRENADE DISCHARGERS',
    cn: '烟雾弹发射器',
    spec: 'Two banks of five L8 dischargers',
    explode: [0, 0.9, 0.7],
    soft: true,
  });

  // -------------------------------------------------------------- armament
  b.addGun({
    geometry: mantlet({ width: 1.0, height: 0.7, depth: 0.5, boreRadius: 0.22 }),
    name: 'MANTLET & TRUNNIONS',
    cn: '火炮防盾与耳轴',
    spec: 'Wide cast mantlet carrying the rifled barrel',
    explode: [0, 0, 1.0],
  });

  b.addGun({
    tag: 'barrel',
    geometry: mainGun({ length: P.barrelLength, radius: 0.08, breechRadius: 0.15, thermalSleeve: true }),
    name: 'L30A1 120 MM RIFLED GUN',
    cn: 'L30A1 型 120 毫米线膛炮',
    spec: 'Full-length thermal sleeve, muzzle reference mirror, bagged charges',
    explode: [0, 0, 2.7],
  });

  // -------------------------------------------------------------- interior
  b.addInterior(b.hull, {
    assembly: 'power',
    tag: 'engine',
    geometry: dieselEngine({ y: 1.0, z: -2.8, width: 1.9, height: 1.0, depth: 1.8, banks: 2, fans: 2 }),
    name: 'PERKINS CV12-6A V-12 DIESEL',
    cn: '珀金斯 CV12-6A V12 柴油机',
    spec: '26.1 litre, 1200 hp — deliberately understressed for reliability',
    explode: [0, 0, -3.0],
  });

  b.addInterior(b.hull, {
    assembly: 'power',
    geometry: transmission({ y: 0.86, z: -3.85, width: 1.8, height: 0.72, depth: 0.55, shaftX: 1.0 }),
    name: 'DAVID BROWN TN54 TRANSMISSION',
    cn: 'David Brown TN54 传动装置',
    spec: 'Six forward, two reverse epicyclic gearbox',
    explode: [0, 0, -3.7],
  });

  // Separate-loading ammunition: charges live in armoured bins under the ring.
  b.addInterior(b.hull, {
    tag: 'charges',
    assembly: 'gun',
    geometry: merge([
      ammoRack({ x: 0.75, y: 0.82, z: 0.4, width: 0.8, height: 0.5, depth: 1.5, cols: 4, rows: 2, shell: 0.075 }),
      ammoRack({ x: -0.75, y: 0.82, z: 0.4, width: 0.8, height: 0.5, depth: 1.5, cols: 4, rows: 2, shell: 0.075 }),
      box(2.0, 0.06, 1.6, [0, 0.55, 0.4]),
    ]),
    name: 'ARMOURED CHARGE BINS',
    cn: '装甲发射药舱',
    spec: 'Bagged charges stowed in water-jacketed bins below the turret ring',
    explode: [0, -1.1, 0],
  });

  b.addInterior(b.hull, {
    geometry: merge([
      fuelCell({ x: 1.2, y: 0.95, z: -0.7, width: 0.55, height: 0.8, depth: 1.7 }),
      fuelCell({ x: -1.2, y: 0.95, z: -0.7, width: 0.55, height: 0.8, depth: 1.7 }),
      serviceBlock({ x: 0, y: 0.85, z: -1.5, width: 1.0, height: 0.5, depth: 0.5 }),
    ]),
    name: 'FUEL CELLS & NBC PACK',
    cn: '燃油箱与三防装置',
    spec: 'Sponson fuel outboard of the fighting compartment',
    explode: [0, 0.5, 0],
    soft: true,
  });

  b.addInterior(b.hull, {
    tag: 'hydrogas',
    assembly: 'running',
    geometry: hydrogasUnits({ y: 0.62, count: 6, firstZ: RUNNING.wheelFirstZ, pitch: RUNNING.wheelPitch, halfWidth: 1.4 }),
    name: 'HYDROGAS SUSPENSION UNITS',
    cn: '油气弹簧悬挂单元',
    spec: 'Second-generation hydrogas instead of torsion bars — no bars cross the floor',
    explode: [0, -0.9, 0],
  });

  b.addInterior(b.hull, {
    geometry: driverStation({ x: 0, y: 0.66, z: 2.6 }),
    name: 'DRIVER (RECLINED, CENTRE)',
    cn: '驾驶员（居中，半躺姿）',
    spec: 'Reclines almost flat to keep the hull roof low',
    explode: [0, 0, 2.4],
  });

  b.addInterior(b.turret, {
    geometry: turretBasket({ y: P.turretY, z: -0.15, radius: 1.08, depth: 0.8 }),
    name: 'TURRET BASKET',
    cn: '炮塔吊篮',
    spec: 'Three turret crew rotate with the gun',
    explode: [0, -1.1, 0],
    soft: true,
  });

  b.addInterior(b.turret, {
    assembly: 'gun',
    geometry: gunBreech({ y: P.gunAxisY, z: 0.35, width: 0.54, height: 0.62, depth: 1.0 }),
    name: 'BREECH & OBTURATION GEAR',
    cn: '炮闩与闭气装置',
    spec: 'Bagged charges need a sealing obturator rather than a cartridge case',
    explode: [0, 0, -1.8],
  });

  b.addInterior(b.turret, {
    tag: 'ammo',
    assembly: 'gun',
    geometry: ammoRack({ x: 0, y: P.turretY + 0.52, z: -1.6, width: 1.7, height: 0.74, depth: 0.95, cols: 6, rows: 2 }),
    name: 'BUSTLE PROJECTILE RACK',
    cn: '尾舱弹丸架',
    spec: 'Projectiles in the bustle, charges below — stowed separately by design',
    explode: [0, 0, -2.5],
  });

  b.addInterior(b.turret, {
    tag: 'crew',
    geometry: merge([
      crewSeated({ x: 0.7, y: P.turretY + 0.06, z: -0.6, facing: 0.1 }), // commander
      crewSeated({ x: 0.66, y: P.turretY - 0.04, z: 0.3, facing: 0 }), // gunner
      crewSeated({ x: -0.7, y: P.turretY, z: -0.4, facing: -0.3 }), // loader
    ]),
    name: 'TURRET CREW · COMMANDER / GUNNER / LOADER',
    cn: '炮塔乘员：车长 / 炮长 / 装填手',
    spec: 'The loader also works the radios in the bustle',
    explode: [0, 1.1, 0],
  });

  return b.finish();
}

export const CALLOUTS = [
  { tag: 'skirt', text: 'THICK CHOBHAM SKIRTS', side: 'left', dy: 100 },
  { tag: 'turret', text: 'BULKY HEAVY-SET TURRET', side: 'left', dy: -140 },
  { tag: 'barrel', text: 'RIFLED L30A1 + THERMAL SLEEVE', side: 'right', dy: -60 },
  { tag: 'charges', text: 'ARMOURED CHARGE BINS', side: 'left', dy: 20 },
  { tag: 'hydrogas', text: 'HYDROGAS SUSPENSION', side: 'right', dy: 130 },
  { tag: 'engine', text: 'PERKINS CV12 DIESEL', side: 'right', dy: -170 },
];
