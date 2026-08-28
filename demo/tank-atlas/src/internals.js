import { box, cyl, wheel, merge } from './geo.js';

/**
 * Internal layout kit.
 *
 * These are the volumes that make an exploded or cutaway drawing informative:
 * where the powerpack sits, how the rounds are stowed, and where the crew are.
 * They are schematic solids at the right size and place, not engine drawings.
 */

/** Reciprocating diesel powerpack: block, heads, turbos and the cooling fans. */
export function dieselEngine({ x = 0, y, z, width, height, depth, banks = 2, fans = 2 }) {
  const parts = [box(width, height * 0.62, depth, [x, y, z])];
  for (let i = 0; i < banks; i++) {
    const off = ((i - (banks - 1) / 2) * width) / (banks * 1.15);
    parts.push(box(width / banks - 0.06, height * 0.3, depth * 0.86, [x + off, y + height * 0.44, z]));
    parts.push(cyl(0.11, 0.11, depth * 0.8, 12, [x + off, y + height * 0.66, z], [Math.PI / 2, 0, 0]));
  }
  for (let i = 0; i < fans; i++) {
    const off = ((i - (fans - 1) / 2) * width) / fans;
    parts.push(wheel(height * 0.34, 0.1, 16, [x + off, y + height * 0.2, z - depth / 2 - 0.1]));
    parts.push(wheel(height * 0.12, 0.16, 8, [x + off, y + height * 0.2, z - depth / 2 - 0.1]));
  }
  return merge(parts);
}

/** Gas turbine powerpack — the Abrams AGT-1500 reads as a big axial cylinder. */
export function gasTurbine({ x = 0, y, z, radius, length }) {
  return merge([
    cyl(radius, radius, length * 0.52, 22, [x, y, z], [Math.PI / 2, 0, 0]),
    cyl(radius * 0.78, radius, length * 0.22, 22, [x, y, z + length * 0.37], [Math.PI / 2, 0, 0]),
    cyl(radius * 0.62, radius * 0.78, length * 0.26, 22, [x, y, z - length * 0.39], [Math.PI / 2, 0, 0]),
    wheel(radius * 0.92, 0.06, 20, [x, y, z + length * 0.48]),
    box(radius * 1.4, radius * 0.5, length * 0.3, [x, y + radius, z]),
    cyl(radius * 0.3, radius * 0.3, length * 0.9, 12, [x + radius * 0.9, y + radius * 0.4, z], [Math.PI / 2, 0, 0]),
  ]);
}

/** Cross-drive transmission with final drive output shafts. */
export function transmission({ x = 0, y, z, width, height, depth, shaftX }) {
  return merge([
    box(width, height, depth, [x, y, z]),
    box(width * 0.7, height * 0.45, depth * 0.5, [x, y + height * 0.6, z]),
    cyl(0.12, 0.12, 0.5, 12, [x + shaftX, y, z], [0, 0, Math.PI / 2]),
    cyl(0.12, 0.12, 0.5, 12, [x - shaftX, y, z], [0, 0, Math.PI / 2]),
  ]);
}

/** Fuel cell / self-sealing tank. */
export function fuelCell({ x, y, z, width, height, depth }) {
  return merge([
    box(width, height, depth, [x, y, z]),
    cyl(0.07, 0.07, 0.1, 10, [x, y + height / 2, z + depth * 0.3]),
  ]);
}

/**
 * Carousel autoloader: rounds lying flat in a ring under the turret floor,
 * the layout the T-72 family and the ZTZ-99A share.
 */
export function carouselAutoloader({ x = 0, y, z, radius, rounds = 22, shell = 0.09, length = 0.68 }) {
  const parts = [cyl(radius, radius, 0.05, 30), cyl(radius * 0.22, radius * 0.22, 0.42, 14, [0, 0.2, 0])];
  for (let i = 0; i < rounds; i++) {
    const a = (i / rounds) * Math.PI * 2;
    const g = cyl(shell, shell, length, 8, [0, 0, 0], [0, 0, Math.PI / 2]);
    g.rotateY(a);
    g.translate(Math.cos(a) * radius * 0.62, 0.14, Math.sin(a) * radius * 0.62);
    parts.push(g);
    const c = cyl(shell * 1.1, shell * 1.1, length * 0.55, 8, [0, 0, 0], [0, 0, Math.PI / 2]);
    c.rotateY(a);
    c.translate(Math.cos(a) * radius * 0.62, -0.06, Math.sin(a) * radius * 0.62);
    parts.push(c);
  }
  const g = merge(parts);
  g.translate(x, y, z);
  return g;
}

/**
 * Bustle autoloader: rounds stacked across the turret rear with a feed arm,
 * as used on the Leclerc.
 */
export function bustleAutoloader({ x = 0, y, z, width, height, depth, rounds = 22, shell = 0.085 }) {
  const parts = [
    box(width, 0.04, depth, [x, y - height / 2, z]),
    box(width, 0.04, depth, [x, y + height / 2, z]),
    box(0.05, height, depth, [x - width / 2, y, z]),
    box(0.05, height, depth, [x + width / 2, y, z]),
    box(width * 0.3, height * 0.5, 0.12, [x, y, z + depth / 2]),
  ];
  const rows = 2;
  const per = Math.ceil(rounds / rows);
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < per; i++) {
      const xx = x - width / 2 + ((i + 0.5) * width) / per;
      const yy = y - height / 4 + r * height * 0.5;
      parts.push(cyl(shell, shell, depth * 0.86, 8, [xx, yy, z], [Math.PI / 2, 0, 0]));
    }
  }
  return merge(parts);
}

/** Bustle ammunition rack behind blow-out panels: the western four-crew layout. */
export function ammoRack({ x, y, z, width, height, depth, cols = 6, rows = 3, shell = 0.085 }) {
  const parts = [
    box(width, height, 0.05, [x, y, z - depth / 2]),
    box(0.05, height, depth, [x - width / 2, y, z]),
    box(0.05, height, depth, [x + width / 2, y, z]),
    box(width, 0.04, depth, [x, y - height / 2, z]),
  ];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const xx = x - width / 2 + ((c + 0.5) * width) / cols;
      const yy = y - height / 2 + ((r + 0.5) * height) / rows;
      parts.push(cyl(shell, shell, depth * 0.9, 8, [xx, yy, z], [Math.PI / 2, 0, 0]));
    }
  }
  return merge(parts);
}

/** Gun breech, recoil cylinders and the empty-case guard inside the turret. */
export function gunBreech({ x = 0, y, z, width = 0.46, height = 0.5, depth = 0.75 }) {
  return merge([
    box(width, height, depth, [x, y, z]),
    box(width * 0.7, height * 0.75, 0.12, [x, y, z - depth / 2 - 0.05]),
    cyl(0.09, 0.09, depth * 1.5, 12, [x + width * 0.75, y + height * 0.3, z + depth * 0.3], [Math.PI / 2, 0, 0]),
    cyl(0.09, 0.09, depth * 1.5, 12, [x - width * 0.75, y + height * 0.3, z + depth * 0.3], [Math.PI / 2, 0, 0]),
    box(width * 1.6, 0.06, depth * 0.9, [x, y - height * 0.6, z]),
  ]);
}

/** Turret basket floor hanging under the ring. */
export function turretBasket({ x = 0, y, z, radius, depth }) {
  const parts = [cyl(radius, radius, 0.05, 26, [x, y - depth, z])];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    parts.push(box(0.06, depth, 0.06, [x + Math.cos(a) * radius * 0.94, y - depth / 2, z + Math.sin(a) * radius * 0.94]));
  }
  return merge(parts);
}

/**
 * Seated crew member, facing +Z by default. Schematic, but scaled to a 1.75 m
 * person so the interior volumes read at the right size.
 */
export function crewSeated({ x, y, z, facing = 0, recline = 0 }) {
  const torso = box(0.42, 0.62, 0.26, [0, 0.31, 0]);
  torso.rotateX(recline);
  // The head is an octagonal helmet rather than a sphere: a faceted ball turns
  // into a wireframe globe once every crease is drawn as a line.
  const hy = 0.72 - Math.sin(recline) * 0.5;
  const hz = Math.sin(recline) * 0.62;
  const parts = [
    torso,
    cyl(0.108, 0.108, 0.2, 8, [0, hy, hz]),
    cyl(0.108, 0.075, 0.06, 8, [0, hy + 0.13, hz]),
    box(0.13, 0.08, 0.05, [0, hy + 0.02, hz + 0.1]),
    box(0.16, 0.14, 0.5, [0.13, 0.02, 0.24]),
    box(0.16, 0.14, 0.5, [-0.13, 0.02, 0.24]),
    box(0.14, 0.44, 0.14, [0.13, -0.2, 0.44]),
    box(0.14, 0.44, 0.14, [-0.13, -0.2, 0.44]),
    box(0.12, 0.1, 0.42, [0.26, 0.34, 0.16]),
    box(0.12, 0.1, 0.42, [-0.26, 0.34, 0.16]),
  ];
  const g = merge(parts);
  g.rotateY(facing);
  g.translate(x, y, z);
  return g;
}

/** Driver reclined in the hull nose, with the yoke and instrument panel. */
export function driverStation({ x, y, z }) {
  return merge([
    crewSeated({ x, y, z, recline: 0.75 }),
    box(0.5, 0.08, 0.34, [x, y + 0.42, z + 0.5]),
    cyl(0.04, 0.04, 0.42, 8, [x, y + 0.34, z + 0.36], [0, 0, Math.PI / 2]),
    box(0.62, 0.3, 0.06, [x, y + 0.66, z + 0.66]),
  ]);
}

/** Transverse torsion bars across the hull floor. */
export function torsionBars({ y, count, firstZ, pitch, halfWidth, radius = 0.045 }) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const z = firstZ - i * pitch;
    parts.push(cyl(radius, radius, halfWidth * 2 * 0.92, 8, [0, y, z], [0, 0, Math.PI / 2]));
    for (const s of [1, -1]) parts.push(box(0.09, 0.2, 0.34, [s * halfWidth * 0.9, y, z - 0.1]));
  }
  return merge(parts);
}

/** Hydrogas suspension units — the Challenger's alternative to torsion bars. */
export function hydrogasUnits({ y, count, firstZ, pitch, halfWidth }) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const z = firstZ - i * pitch;
    for (const s of [1, -1]) {
      parts.push(cyl(0.14, 0.14, 0.34, 12, [s * halfWidth * 0.82, y, z], [0, 0, Math.PI / 2]));
      parts.push(box(0.1, 0.18, 0.4, [s * halfWidth * 0.82, y - 0.05, z - 0.16]));
    }
  }
  return merge(parts);
}

/** NBC pack, batteries and the auxiliary power unit as one service block. */
export function serviceBlock({ x, y, z, width, height, depth }) {
  return merge([
    box(width, height, depth, [x, y, z]),
    cyl(height * 0.4, height * 0.4, width * 0.5, 14, [x, y + height * 0.3, z], [0, 0, Math.PI / 2]),
    box(width * 0.4, height * 0.5, depth * 0.4, [x, y - height * 0.2, z + depth * 0.4]),
  ]);
}
