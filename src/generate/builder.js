/**
 * Parametric tank from a generate-spec.
 *
 * Families reuse the same kit as the authored atlas vehicles so a composed
 * drawing still reads as a hidden-line blueprint rather than a generic box.
 */
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
  eraPatch,
  eraAlongOutline,
  slatPanel,
  meshScreen,
  stowageBasket,
  wedgeArmour,
} from '../kit.js';
import {
  dieselEngine,
  gasTurbine,
  transmission,
  ammoRack,
  carouselAutoloader,
  bustleAutoloader,
  gunBreech,
  turretBasket,
  crewSeated,
  driverStation,
  torsionBars,
  hydrogasUnits,
  fuelCell,
  serviceBlock,
} from '../internals.js';
import { VehicleBuilder } from '../vehicle.js';

function angularOutline(front = 1.98, half = 1.42, rear = 1.9) {
  return mirrorOutline([
    [0, front],
    [half * 0.46, front * 0.97],
    [half * 0.96, front * 0.54],
    [half, -rear * 0.17],
    [half, -rear],
    [0, -rear * 1.04],
  ]);
}

function domeOutline(front = 1.4, half = 1.3, rear = 1.58) {
  return mirrorOutline([
    [0, front],
    [half * 0.48, front * 0.94],
    [half * 0.82, front * 0.73],
    [half, front * 0.33],
    [half * 1.01, -rear * 0.32],
    [half, -rear * 0.95],
    [0, -rear],
  ]);
}

function vOutline(front = 1.42, half = 1.34, rear = 1.86) {
  return mirrorOutline([
    [0, front],
    [half * 0.67, front * 0.7],
    [half, front * 0.11],
    [half * 1.01, -rear * 0.51],
    [half * 0.9, -rear],
    [0, -rear * 1.04],
  ]);
}

function castOutline(rx = 1.28, rzF = 1.35, rzR = 1.55) {
  const half = [];
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * Math.PI;
    half.push([Math.sin(a) * rx, Math.cos(a) * (a < Math.PI / 2 ? rzF : rzR)]);
  }
  return mirrorOutline(half);
}

function boxOutline(front = 1.15, half = 1.12, rear = 1.25) {
  return mirrorOutline([
    [0, front],
    [half * 0.72, front * 0.96],
    [half, front * 0.35],
    [half, -rear * 0.55],
    [half * 0.7, -rear],
    [0, -rear],
  ]);
}

function layoutFor(spec) {
  const f = spec.family || 'abrams';
  const wheels = spec.wheelCount || (f === 'slope' || f === 'light' ? 6 : 7);
  const barrel = spec.barrelLength || 4.8;
  const feat = spec.features || {};
  const compact = f === 'soviet' || f === 'light' || f === 'leclerc';
  const wwii = f === 'wwii' || f === 'slope';
  const long = f === 'challenger' || f === 'armata' || f === 'merkava';

  const hullLen = compact ? 6.86 : long ? 8.2 : wwii ? 6.3 : 7.8;
  const front = hullLen / 2;
  const rear = -hullLen / 2;
  const width = f === 'merkava' ? 3.5 : compact ? 3.05 : wwii ? 2.95 : 3.35;
  const deckY = f === 'armata' ? 1.55 : f === 'cast' || feat.tall ? 1.48 : compact ? 1.14 : wwii ? 1.28 : 1.36;
  const turretHeight = f === 'armata' ? 0.62 : f === 'cast' || f === 'challenger' ? 1.0 : compact ? 0.74 : 0.9;
  const turretZ = f === 'merkava' ? -0.15 : f === 'armata' ? 0.45 : 0.15;
  const glacisRun = f === 'slope' ? 2.9 : f === 'wwii' ? 1.35 : 2.4;

  const wheelRadius = f === 'slope' ? 0.42 : wwii ? 0.35 : 0.34;
  const pitch = (front - 0.9 - (rear + 0.9)) / Math.max(1, wheels - 1);
  const wheelFirstZ = rear + 0.9 + (wheels - 1) * pitch;
  const ride = wheelRadius + 0.045 + 0.022;
  const rollers = feat.christie || wheels <= 5
    ? []
    : wheels >= 7
      ? [wheelFirstZ - pitch * 0.6, 0.5, rear + 1.4]
      : [wheelFirstZ - pitch, rear + 1.6];

  const frontDrive = !!(feat.frontDrive || feat.frontEngine);
  const sprocketZ = frontDrive ? front - 0.42 : rear + 0.52;
  const idlerZ = frontDrive ? rear + 0.48 : front - 0.48;

  const outline =
    f === 'chinese' ? vOutline()
      : f === 'soviet' || f === 'slope' ? domeOutline(f === 'slope' ? 1.22 : 1.4, f === 'slope' ? 1.18 : 1.3, 1.5)
        : f === 'cast' ? castOutline()
          : f === 'wwii' ? boxOutline()
            : f === 'armata' ? angularOutline(1.35, 1.15, 1.45)
              : f === 'leclerc' || f === 'light' ? angularOutline(1.55, 1.18, 1.55)
                : f === 'leopard' ? angularOutline(1.52, 1.32, 2.08)
                  : f === 'challenger' ? angularOutline(1.62, 1.4, 1.94)
                    : f === 'merkava' ? angularOutline(1.7, 1.38, 1.7)
                      : angularOutline();

  return {
    family: f,
    feat,
    P: {
      front,
      rear,
      floorY: 0.46,
      noseY: f === 'slope' ? 0.58 : wwii ? 0.82 : 0.72,
      deckY,
      engineDeckY: deckY - 0.06,
      engineDeckZ: rear + hullLen * 0.28,
      glacisRun,
      width,
      turretZ,
      turretY: deckY,
      turretHeight,
      gunAxisY: deckY + turretHeight * 0.52,
      gunPivotZ: f === 'armata' ? 0.85 : 1.2,
      barrelLength: barrel,
    },
    RUNNING: {
      wheelCount: wheels,
      wheelFirstZ,
      wheelPitch: pitch,
      wheelRadius,
      wheelWidth: 0.12,
      wheelX: width / 2 - 0.2,
      returnRollers: rollers,
      rollerRadius: 0.09,
      rollerY: ride + wheelRadius * 0.7,
      sprocket: { z: sprocketZ, y: ride + 0.22, r: 0.3, width: 0.2, teeth: wwii ? 16 : 12 },
      idler: { z: idlerZ, y: ride + 0.02, r: 0.28, width: 0.19 },
      sprocketPosition: frontDrive ? 'front' : 'rear',
      trackCentre: width / 2 - 0.2,
      trackWidth: wwii ? 0.55 : 0.62,
      linkPitch: 0.18,
      linkThickness: 0.042,
      cleatDepth: 0.02,
    },
    outline,
    note: spec.inferred ? 'inferred' : 'probable',
  };
}

function wedgePair(y0, y1) {
  const half = (sign) => {
    const outline = [
      [sign * 0.28, 2.1],
      [sign * 1.28, 1.05],
      [sign * 1.3, 0.82],
      [sign * 0.28, 1.4],
    ];
    const ordered = sign > 0 ? outline : [...outline].reverse();
    return prismoid(ordered, ordered.map(([x, z]) => [x * 0.97, z]), y0, y1);
  };
  return merge([half(1), half(-1)]);
}

function muzzleBrake(length, radius) {
  return merge([
    box(radius * 3.4, radius * 2.3, 0.16, [0, 0, length + 0.1]),
    box(radius * 2.6, radius * 1.7, 0.2, [0, 0, length + 0.28]),
    cyl(radius * 1.15, radius * 1.15, 0.12, 16, [0, 0, length + 0.4], [Math.PI / 2, 0, 0]),
  ]);
}

export function calloutsFor(spec) {
  const f = spec.family || 'abrams';
  const feat = spec.features || {};
  const gun = (spec.armament || 'MAIN GUN').split('·')[0].trim();
  const rows = [
    { tag: 'hull', text: f === 'slope' ? 'SLOPED GLACIS HULL' : f === 'merkava' ? 'FRONT-ENGINE HULL' : 'HULL ENVELOPE', side: 'left', dy: 70 },
    { tag: 'turret', text: feat.unmanned ? 'UNMANNED TURRET' : f === 'chinese' ? 'V-FACE TURRET' : f === 'cast' ? 'CAST TURRET' : 'TURRET SHELL', side: 'left', dy: -130 },
    { tag: 'barrel', text: gun.slice(0, 28).toUpperCase(), side: 'right', dy: -70 },
  ];
  if (feat.era) rows.push({ tag: 'era', text: 'REACTIVE ARMOUR', side: 'left', dy: 150 });
  if (feat.mesh) rows.push({ tag: 'mesh', text: 'ANTI-RPG MESH', side: 'left', dy: 150 });
  if (feat.wedge) rows.push({ tag: 'wedge', text: 'WEDGE ADD-ON ARMOUR', side: 'right', dy: -170 });
  if (feat.rearDoor) rows.push({ tag: 'door', text: 'REAR TROOP DOOR', side: 'right', dy: 110 });
  if (feat.gasTurbine) rows.push({ tag: 'engine', text: 'GAS TURBINE', side: 'right', dy: 110 });
  else rows.push({ tag: 'engine', text: 'POWERPACK', side: 'right', dy: 110 });
  return rows.slice(0, 6);
}

export function buildGenerated(meta) {
  const spec = meta.gen || {};
  const { family: f, feat, P, RUNNING, outline, note } = layoutFor(spec);
  const b = new VehicleBuilder(meta, { turretZ: P.turretZ, gunAxisY: P.gunAxisY, gunPivotZ: P.gunPivotZ });
  const evidence = { note };

  b.addHull({
    tag: 'hull',
    geometry: hullSolid(P),
    name: 'HULL',
    cn: '车体',
    spec: spec.envelope || 'Procedural hull envelope',
    explode: [0, 0, 0],
    ...evidence,
  });

  const skirtX = P.width / 2 + 0.18;
  b.addHull({
    geometry: merge([
      sideSkirt({
        x: skirtX,
        front: P.front - 0.4,
        rear: P.rear + 0.3,
        top: P.deckY - 0.04,
        bottom: 0.5,
        thickness: f === 'challenger' ? 0.1 : 0.06,
        panels: RUNNING.wheelCount,
      }),
      sideSkirt({
        x: -skirtX,
        front: P.front - 0.4,
        rear: P.rear + 0.3,
        top: P.deckY - 0.04,
        bottom: 0.5,
        thickness: f === 'challenger' ? 0.1 : 0.06,
        panels: RUNNING.wheelCount,
      }),
    ]),
    name: 'SIDE SKIRTS',
    cn: '侧裙装甲',
    spec: f === 'challenger' ? 'Heavy ballistic skirts' : 'Segmented side skirts',
    explode: [0, 0.2, 0],
    ...evidence,
  });

  if (feat.era && (f === 'soviet' || f === 'chinese' || f === 'armata')) {
    b.addHull({
      tag: 'era',
      geometry: eraPatch({
        origin: [-P.width * 0.42, P.noseY + 0.02, P.front - 0.04],
        u: [P.width * 0.84, 0, 0],
        v: [0, 0.5, -P.glacisRun * 0.85],
        nu: 8,
        nv: 3,
        brick: 0.11,
        gap: 0.03,
        jitter: 0.01,
      }),
      name: 'GLACIS ERA',
      cn: '首上反应装甲',
      spec: 'Modular reactive bricks across the glacis',
      explode: [0, 0.5, 1.3],
      ...evidence,
    });
  }

  const engineZ = feat.frontEngine ? P.front - 1.4 : (P.rear + P.engineDeckZ) / 2 - 0.2;
  const grilleW = P.width * 0.38;
  b.addHull({
    geometry: merge(
      feat.gasTurbine
        ? [
            grille({ x: grilleW * 0.55, y: P.engineDeckY + 0.02, z: engineZ, width: grilleW, depth: 1.35, louvres: 7 }),
            grille({ x: -grilleW * 0.55, y: P.engineDeckY + 0.02, z: engineZ, width: grilleW, depth: 1.35, louvres: 7 }),
          ]
        : [grille({ x: 0, y: P.engineDeckY + 0.02, z: engineZ, width: P.width * 0.72, depth: feat.frontEngine ? 1.1 : 1.5, louvres: 8 })],
    ),
    assembly: 'power',
    tag: 'grilles',
    name: feat.frontEngine ? 'FORWARD ENGINE DECK' : 'ENGINE DECK GRILLES',
    cn: feat.frontEngine ? '前置动力舱格栅' : '动力舱散热网',
    spec: feat.gasTurbine ? 'Twin turbine intake screens' : 'Louvred diesel deck',
    explode: feat.frontEngine ? [0, 1.0, 1.2] : [0, 1.1, 0],
    ...evidence,
  });

  if (feat.mesh) {
    b.addHull({
      tag: 'mesh',
      geometry: merge([
        meshScreen({ origin: [skirtX + 0.08, 0.5, -1.4], u: [0, 0, -2.0], v: [0, 0.9, 0], nu: 8, nv: 4 }),
        meshScreen({ origin: [-skirtX - 0.08, 0.5, -1.4], u: [0, 0, -2.0], v: [0, 0.9, 0], nu: 8, nv: 4 }),
      ]),
      name: 'ANTI-RPG MESH',
      cn: '防火箭弹铁丝网',
      spec: 'Slat / mesh screens around the engine bay',
      explode: [0, 0, -0.9],
      soft: true,
      ...evidence,
    });
  }

  if (feat.rearDoor) {
    b.addHull({
      tag: 'door',
      geometry: merge([
        box(1.35, 1.05, 0.08, [0, 0.95, P.rear - 0.02]),
        box(0.16, 0.08, 0.18, [0.5, 0.95, P.rear - 0.12]),
        box(0.16, 0.08, 0.18, [-0.5, 0.95, P.rear - 0.12]),
        box(0.9, 0.04, 0.5, [0, 0.48, P.rear + 0.28]),
      ]),
      name: 'REAR TROOP DOOR',
      cn: '尾部步兵舱门',
      spec: 'Clamshell infantry hatch in the hull rear',
      explode: [0, 0, -1.4],
      ...evidence,
    });
  }

  b.addHull({
    geometry: merge([
      hatch({ x: f === 'abrams' || feat.reclinedDriver ? 0 : -0.55, y: P.deckY, z: P.front - 1.15, radius: 0.32, periscopes: 3 }),
      bothSides(cyl(0.08, 0.08, 0.2, 10, [P.width * 0.42, 0.78, P.front - 0.12], [Math.PI / 2, 0, 0])),
      box(1.6, 0.1, 0.22, [0, 0.66, P.front - 0.02]),
    ]),
    name: 'DRIVER HATCH & FITTINGS',
    cn: '驾驶员舱口与车体附件',
    spec: 'Hull fittings generated from the family template',
    explode: [0, 0.8, 0],
    soft: true,
    ...evidence,
  });

  b.addRunningGear(RUNNING);

  b.addTurret({
    tag: 'turret',
    geometry: turretShell({
      outline,
      y0: P.turretY,
      height: P.turretHeight,
      inset: f === 'cast' || f === 'soviet' ? 0.16 : 0.1,
    }),
    name: feat.unmanned ? 'UNMANNED TURRET' : 'TURRET SHELL',
    cn: feat.unmanned ? '无人炮塔' : '炮塔壳体',
    spec: spec.armour || 'Procedural turret shell',
    explode: [0, 1.6, 0],
    ...evidence,
  });

  if (feat.wedge) {
    b.addTurret({
      tag: 'wedge',
      geometry: merge([
        wedgePair(P.turretY + 0.05, P.turretY + P.turretHeight - 0.08),
        wedgeArmour({ x: 0, z: 1.85, y: P.turretY + 0.12, length: 0.55, height: P.turretHeight * 0.7, spread: 0.7, thickness: 0.22 }),
      ]),
      name: 'WEDGE ADD-ON ARMOUR',
      cn: '楔形附加装甲',
      spec: 'Arrowhead modules bolted to the turret face',
      explode: [0, 0.4, 1.2],
      ...evidence,
    });
  }

  if (feat.era) {
    b.addTurret({
      tag: 'era',
      geometry: eraAlongOutline({
        outline,
        indices: [0, 1, 2, outline.length - 3, outline.length - 2],
        y0: P.turretY + 0.08,
        height: P.turretHeight * 0.7,
        rows: 2,
        brick: 0.1,
      }),
      name: 'TURRET ERA',
      cn: '炮塔反应装甲',
      spec: 'Reactive bricks following the turret outline',
      explode: [0, 0.6, 0.4],
      ...evidence,
    });
  }

  if (feat.slat) {
    b.addTurret({
      geometry: merge([
        slatPanel({ origin: [-1.0, P.turretY + 0.1, -1.55], u: [2.0, 0, 0], v: [0, 0.7, 0], bars: 8 }),
        slatPanel({ origin: [1.15, P.turretY + 0.1, -0.4], u: [0, 0, -1.2], v: [0, 0.7, 0], bars: 6 }),
        slatPanel({ origin: [-1.15, P.turretY + 0.1, -0.4], u: [0, 0, -1.2], v: [0, 0.7, 0], bars: 6 }),
      ]),
      name: 'SLAT CAGE',
      cn: '格栅装甲',
      spec: 'Cage armour on the turret bustle',
      explode: [0, 0.3, -0.9],
      soft: true,
      ...evidence,
    });
  }

  if (!feat.unmanned) {
    b.addTurret({
      geometry: merge([
        stowageBasket({ x: 0, y: P.turretY + P.turretHeight * 0.55, z: -1.85, width: 2.2, height: 0.55, depth: 0.38, bars: 8 }),
      ]),
      name: 'BUSTLE RACK',
      cn: '炮塔尾舱储物架',
      spec: 'Stowage basket on the turret rear',
      explode: [0, 1.0, -0.7],
      soft: true,
      ...evidence,
    });
  }

  const roofY = P.turretY + P.turretHeight;
  const roofBits = [];
  if (!feat.unmanned) {
    roofBits.push(hatch({ x: 0.62, y: roofY, z: -0.35, radius: 0.34, periscopes: 4 }));
    if (!feat.carousel && !feat.bustleAuto) roofBits.push(hatch({ x: -0.58, y: roofY, z: -0.2, radius: 0.3, periscopes: 2 }));
    roofBits.push(weaponStation({ x: 0.62, y: roofY + 0.06, z: -0.1, remote: true }));
  } else {
    roofBits.push(weaponStation({ x: 0.15, y: roofY + 0.04, z: 0.15, remote: true }));
    roofBits.push(box(0.9, 0.16, 0.7, [0, roofY + 0.08, 0.1]));
  }
  if (feat.peri) roofBits.push(panoramicSight({ x: -0.45, y: roofY, z: 0.35 }));
  if (feat.citv !== false && (f === 'abrams' || feat.citv)) {
    roofBits.push(box(0.32, 0.38, 0.34, [-0.55, roofY + 0.18, 0.5]));
  }
  if (feat.laser) roofBits.push(box(0.42, 0.38, 0.42, [-0.7, roofY + 0.2, -0.85]));
  if (feat.trophy) {
    roofBits.push(bothSides(box(0.28, 0.22, 0.42, [1.05, P.turretY + 0.55, 0.55])));
  }
  roofBits.push(
    smokeBank({ x: 1.05, y: P.turretY + 0.55, z: 0.85, count: 4, yaw: 0.45 }),
    smokeBank({ x: -1.05, y: P.turretY + 0.55, z: 0.85, count: 4, yaw: -0.45 }),
  );

  b.addTurret({
    geometry: merge(roofBits),
    name: 'ROOF STATIONS',
    cn: '车顶观瞄与舱口',
    spec: feat.unmanned ? 'Remote sensors, no crew hatches' : 'Hatches, sights and grenade dischargers',
    explode: [0, 2.2, 0],
    ...evidence,
  });

  const caliber = /(\d{2,3})\s*mm/i.exec(spec.armament || '')?.[1];
  const radius = caliber === '88' || caliber === '85' ? 0.09 : caliber === '76' || caliber === '75' ? 0.07 : caliber === '105' ? 0.072 : 0.078;
  b.addGun({
    geometry: mantlet({ width: f === 'cast' ? 0.85 : 1.0, height: 0.58, depth: 0.48, boreRadius: radius + 0.11 }),
    name: 'GUN MANTLET',
    cn: '火炮防盾',
    spec: 'Trunnion housing generated with the tube',
    explode: [0, 0, 0.8],
    ...evidence,
  });

  const gunParts = [
    mainGun({
      length: P.barrelLength,
      radius,
      breechRadius: radius + 0.06,
      thermalSleeve: !!feat.thermalSleeve,
      muzzleRing: !feat.muzzleBrake,
      evacuator: { z: 0.46, radius: radius + 0.09, length: 0.6 },
    }),
  ];
  if (feat.muzzleBrake) gunParts.push(muzzleBrake(P.barrelLength, radius));
  b.addGun({
    tag: 'barrel',
    geometry: merge(gunParts),
    name: spec.armament || 'MAIN GUN',
    cn: '主炮',
    spec: spec.armament || 'Procedural main gun',
    explode: [0, 0, 2.3],
    ...evidence,
  });

  const packZ = feat.frontEngine ? P.front - 1.55 : P.rear + 1.15;
  const packExplode = feat.frontEngine ? [0, 0, 2.4] : [0, 0, -2.5];
  if (feat.gasTurbine) {
    b.addInterior(b.hull, {
      geometry: gasTurbine({ y: 0.92, z: packZ, radius: 0.5, length: 2.0 }),
      assembly: 'power',
      tag: 'engine',
      name: spec.powerpack || 'GAS TURBINE',
      cn: '燃气轮机',
      spec: spec.powerpack || 'Turbine powerpack',
      explode: packExplode,
      ...evidence,
    });
  } else {
    b.addInterior(b.hull, {
      geometry: dieselEngine({ y: 0.9, z: packZ, width: 1.5, height: 0.85, depth: 1.7, banks: 2, fans: 2 }),
      assembly: 'power',
      tag: 'engine',
      name: spec.powerpack || 'DIESEL POWERPACK',
      cn: '柴油动力舱',
      spec: spec.powerpack || 'Diesel engine',
      explode: packExplode,
      ...evidence,
    });
  }

  b.addInterior(b.hull, {
    geometry: transmission({
      y: 0.82,
      z: feat.frontDrive || feat.frontEngine ? P.front - 0.55 : P.rear + 0.45,
      width: 1.55,
      height: 0.65,
      depth: 0.55,
      shaftX: RUNNING.trackCentre * 0.65,
    }),
    assembly: 'power',
    name: 'TRANSMISSION',
    cn: '传动装置',
    spec: RUNNING.sprocketPosition === 'front' ? 'Front drive gearbox' : 'Rear cross-drive',
    explode: feat.frontEngine ? [0, 0, 3.0] : [0, 0, -3.2],
    ...evidence,
  });

  b.addInterior(b.hull, {
    geometry: merge([
      fuelCell({ x: P.width * 0.32, y: 0.9, z: 0.1, width: 0.5, height: 0.7, depth: 1.6 }),
      fuelCell({ x: -P.width * 0.32, y: 0.9, z: 0.1, width: 0.5, height: 0.7, depth: 1.6 }),
      serviceBlock({ x: 0, y: 0.78, z: packZ + (feat.frontEngine ? -0.9 : 0.9), width: 0.8, height: 0.45, depth: 0.45 }),
    ]),
    name: 'FUEL & SERVICES',
    cn: '燃油与辅助装置',
    spec: 'Sponson tanks and NBC / APU pack',
    explode: [0, 0.35, 0],
    soft: true,
    ...evidence,
  });

  if (feat.hydrogas) {
    b.addInterior(b.hull, {
      geometry: hydrogasUnits({
        y: 0.62,
        count: RUNNING.wheelCount,
        firstZ: RUNNING.wheelFirstZ,
        pitch: RUNNING.wheelPitch,
        halfWidth: RUNNING.trackCentre,
      }),
      assembly: 'running',
      name: 'HYDROGAS UNITS',
      cn: '油气弹簧悬挂',
      spec: 'External hydro-pneumatic units',
      explode: [0, -0.9, 0],
      soft: true,
      ...evidence,
    });
  } else {
    b.addInterior(b.hull, {
      geometry: torsionBars({
        y: 0.56,
        count: RUNNING.wheelCount,
        firstZ: RUNNING.wheelFirstZ,
        pitch: RUNNING.wheelPitch,
        halfWidth: RUNNING.trackCentre,
      }),
      assembly: 'running',
      name: 'TORSION BAR SUSPENSION',
      cn: '扭杆悬挂',
      spec: `${RUNNING.wheelCount} transverse torsion bars`,
      explode: [0, -0.9, 0],
      soft: true,
      ...evidence,
    });
  }

  b.addInterior(b.hull, {
    geometry: driverStation({
      x: f === 'abrams' || feat.reclinedDriver ? 0 : -0.55,
      y: 0.6,
      z: feat.frontEngine ? 0.35 : P.front - 1.2,
    }),
    name: 'DRIVER',
    cn: '驾驶员',
    spec: feat.unmanned ? 'Crew capsule, hull front' : 'Hull driver station',
    explode: [0, 0, 2.0],
    ...evidence,
  });

  if (feat.unmanned) {
    b.addInterior(b.hull, {
      geometry: merge([
        crewSeated({ x: 0.45, y: 0.62, z: P.front - 1.55, facing: 0 }),
        crewSeated({ x: -0.15, y: 0.62, z: P.front - 1.9, facing: 0.1 }),
        box(2.1, 0.08, 1.8, [0, 1.05, P.front - 1.7]),
      ]),
      name: 'HULL CREW CAPSULE',
      cn: '车体乘员舱',
      spec: 'Commander and gunner sit in the hull, not the turret',
      explode: [0, 1.2, 1.4],
      ...evidence,
    });
  }

  if (feat.carousel) {
    b.addInterior(b.hull, {
      geometry: carouselAutoloader({ y: P.floorY + 0.28, z: P.turretZ, radius: 1.05, rounds: 22 }),
      assembly: 'gun',
      name: 'CAROUSEL AUTOLOADER',
      cn: '转盘式自动装弹机',
      spec: 'Ammunition in a ring under the turret floor',
      explode: [0, -1.1, 0],
      ...evidence,
    });
  } else if (feat.bustleAuto) {
    b.addInterior(b.turret, {
      geometry: bustleAutoloader({ y: P.turretY + 0.4, z: -1.45, width: 2.0, height: 0.7, depth: 0.9, rounds: 22 }),
      assembly: 'gun',
      name: 'BUSTLE AUTOLOADER',
      cn: '尾舱自动装弹机',
      spec: 'Ready rounds stacked in the turret rear',
      explode: [0, 0, -2.0],
      ...evidence,
    });
  } else {
    b.addInterior(b.turret, {
      geometry: merge([
        ammoRack({ x: 0.55, y: P.turretY + 0.45, z: -1.35, width: 0.95, height: 0.68, depth: 0.9, cols: 4, rows: 3 }),
        ammoRack({ x: -0.55, y: P.turretY + 0.45, z: -1.35, width: 0.95, height: 0.68, depth: 0.9, cols: 4, rows: 3 }),
      ]),
      assembly: 'gun',
      tag: 'ammo',
      name: 'BUSTLE AMMUNITION',
      cn: '尾舱弹药架',
      spec: 'Crew-served stowage behind the fighting compartment',
      explode: [0, 0, -2.0],
      ...evidence,
    });
  }

  b.addInterior(b.turret, {
    geometry: gunBreech({ y: P.gunAxisY, z: 0.2, width: 0.48, height: 0.52, depth: 0.82 }),
    assembly: 'gun',
    name: 'GUN BREECH',
    cn: '炮闩',
    spec: 'Breech and recoil gear',
    explode: [0, 0, -1.5],
    ...evidence,
  });

  if (!feat.unmanned) {
    b.addInterior(b.turret, {
      geometry: turretBasket({ y: P.turretY, z: 0, radius: 0.95, depth: 0.65 }),
      name: 'TURRET BASKET',
      cn: '炮塔吊篮',
      spec: 'Rotating floor under the ring',
      explode: [0, -1.0, 0],
      soft: true,
      ...evidence,
    });
    const crew = [crewSeated({ x: 0.7, y: P.turretY + 0.02, z: -0.45, facing: 0.1 })];
    crew.push(crewSeated({ x: 0.55, y: P.turretY - 0.02, z: 0.28, facing: 0 }));
    if (!feat.carousel && !feat.bustleAuto) crew.push(crewSeated({ x: -0.68, y: P.turretY, z: -0.3, facing: -0.3 }));
    b.addInterior(b.turret, {
      geometry: merge(crew),
      name: feat.carousel || feat.bustleAuto ? 'COMMANDER / GUNNER' : 'TURRET CREW',
      cn: feat.carousel || feat.bustleAuto ? '车长 / 炮长' : '炮塔乘员',
      spec: spec.crew || 'Turret crew',
      explode: [0, 1.0, 0],
      ...evidence,
    });
  }

  return b.finish();
}
