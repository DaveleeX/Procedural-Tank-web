import * as THREE from 'three';
import { mergeGeometries } from '../vendor/BufferGeometryUtils.js';

/**
 * Geometry helpers for procedural construction.
 *
 * Everything is authored in metres in a right-handed frame:
 *   +Z = vehicle forward (gun points at +Z)
 *   +Y = up (y = 0 is the ground plane)
 *   +X = across the hull
 */

export function box(w, h, d, at = [0, 0, 0], rot = null) {
  const g = new THREE.BoxGeometry(w, h, d);
  return place(g, at, rot);
}

export function cyl(rTop, rBottom, h, seg = 28, at = [0, 0, 0], rot = null, open = false) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1, open);
  return place(g, at, rot);
}

/** Cylinder whose axis runs along X (wheels, axles, road wheel bogies). */
export function wheel(r, w, seg = 24, at = [0, 0, 0]) {
  return cyl(r, r, w, seg, at, [0, 0, Math.PI / 2]);
}

export function sphere(r, seg = 16, at = [0, 0, 0]) {
  return place(new THREE.SphereGeometry(r, seg, Math.max(6, seg / 2)), at);
}

export function place(geometry, at = [0, 0, 0], rot = null) {
  if (rot) {
    geometry.rotateX(rot[0] || 0);
    geometry.rotateY(rot[1] || 0);
    geometry.rotateZ(rot[2] || 0);
  }
  if (at[0] || at[1] || at[2]) geometry.translate(at[0] || 0, at[1] || 0, at[2] || 0);
  return geometry;
}

/**
 * Extrude a side-view profile across the hull width.
 * `profile` is a list of [z, y] points describing a closed loop in the ZY plane.
 * The result is centred on x = 0 and spans `width`.
 */
export function extrudeProfile(profile, width, opts = {}) {
  const shape = new THREE.Shape();
  profile.forEach(([z, y], i) => (i === 0 ? shape.moveTo(z, y) : shape.lineTo(z, y)));
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: !!opts.bevel,
    bevelSize: opts.bevelSize || 0.01,
    bevelThickness: opts.bevelThickness || 0.01,
    bevelSegments: 1,
    curveSegments: opts.curveSegments || 8,
  });
  // Shape plane XY -> ZY, extrusion depth Z -> X.
  g.rotateY(-Math.PI / 2);
  g.translate(width / 2, 0, 0);
  return g;
}

/**
 * Extrude a plan-view (XZ) outline vertically. Used for the horseshoe turret.
 * `shape` is a THREE.Shape authored in (x, z).
 */
export function extrudePlan(shape, height, opts = {}) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: opts.curveSegments || 20,
  });
  // Shape plane XY -> XZ, extrusion depth Z -> Y (upwards).
  g.rotateX(Math.PI / 2);
  g.scale(1, -1, 1);
  return g;
}

/**
 * Solid between two horizontal polygons with matching vertex counts.
 *
 * Modern turrets and hull superstructures are prismoids, not extrusions: the roof
 * plate is smaller than the ring and the walls slope inwards. Authoring a bottom
 * outline plus a top outline gives that directly.
 *
 * @param {Array<[number,number]>} bottom outline in (x, z)
 * @param {Array<[number,number]>} top outline in (x, z), same length as bottom
 */
export function prismoid(bottom, top, y0, y1) {
  const n = bottom.length;
  const pos = [];
  const push = (x, y, z) => pos.push(x, y, z);
  const quad = (a, b, c, d) => {
    push(...a); push(...b); push(...c);
    push(...a); push(...c); push(...d);
  };

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    quad(
      [bottom[i][0], y0, bottom[i][1]],
      [bottom[j][0], y0, bottom[j][1]],
      [top[j][0], y1, top[j][1]],
      [top[i][0], y1, top[i][1]],
    );
  }
  // Convex caps as triangle fans.
  for (let i = 1; i < n - 1; i++) {
    push(bottom[0][0], y0, bottom[0][1]);
    push(bottom[i + 1][0], y0, bottom[i + 1][1]);
    push(bottom[i][0], y0, bottom[i][1]);
    push(top[0][0], y1, top[0][1]);
    push(top[i][0], y1, top[i][1]);
    push(top[i + 1][0], y1, top[i + 1][1]);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Inset a convex outline towards its centroid, for prismoid roof plates. */
export function insetOutline(outline, amount) {
  const cx = outline.reduce((s, p) => s + p[0], 0) / outline.length;
  const cz = outline.reduce((s, p) => s + p[1], 0) / outline.length;
  return outline.map(([x, z]) => {
    const dx = x - cx;
    const dz = z - cz;
    const len = Math.hypot(dx, dz) || 1;
    const k = Math.max(0, len - amount) / len;
    return [cx + dx * k, cz + dz * k];
  });
}

/** Mirror an (x, z) outline so only the right half has to be authored. */
export function mirrorOutline(half) {
  return [...half, ...half.slice(1, -1).reverse().map(([x, z]) => [-x, z])];
}

/** Symmetric copy of a geometry mirrored across the ZY plane. */
export function mirrorX(geometry) {
  const g = geometry.clone();
  g.scale(-1, 1, 1);
  const idx = g.getIndex();
  if (idx) {
    const a = idx.array;
    for (let i = 0; i < a.length; i += 3) {
      const t = a[i];
      a[i] = a[i + 2];
      a[i + 2] = t;
    }
    idx.needsUpdate = true;
  }
  g.computeVertexNormals();
  return g;
}

export function bothSides(geometry) {
  return merge([geometry, mirrorX(geometry)]);
}

export function merge(geometries) {
  const list = geometries.filter(Boolean).map((g) => {
    const c = g.index ? g.toNonIndexed() : g;
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', c.getAttribute('position').clone());
    if (c.getAttribute('normal')) out.setAttribute('normal', c.getAttribute('normal').clone());
    return out;
  });
  if (list.length === 1) return list[0];
  return mergeGeometries(list, false);
}

/**
 * Rubber-band belt path: the convex hull of a set of circles in the ZY plane.
 * This is how a real track wraps a sprocket, an idler and the road wheels, so the
 * top run rests on the wheel tops and the bottom run rides flat on the ground.
 * Returns a closed polyline of {z, y} points in counter-clockwise order.
 */
export function beltHull(circles, samples = 96) {
  const pts = [];
  for (const c of circles) {
    for (let i = 0; i < samples; i++) {
      const a = (i / samples) * Math.PI * 2;
      pts.push([c.z + Math.cos(a) * c.r, c.y + Math.sin(a) * c.r]);
    }
  }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper).map(([z, y]) => ({ z, y }));
}

/** Arc-length parameterisation of a closed polyline, for placing track links. */
export function polylineSampler(points) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const dz = b.z - a.z;
    const dy = b.y - a.y;
    const len = Math.hypot(dz, dy);
    segs.push({ a, dz, dy, len, start: total });
    total += len;
  }
  return {
    total,
    /** @returns {{z:number,y:number,angle:number}} pose at arc length s */
    at(s) {
      let t = s % total;
      if (t < 0) t += total;
      let lo = 0;
      let hi = segs.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (segs[mid].start <= t) lo = mid;
        else hi = mid - 1;
      }
      const seg = segs[lo];
      const k = seg.len === 0 ? 0 : (t - seg.start) / seg.len;
      return {
        z: seg.a.z + seg.dz * k,
        y: seg.a.y + seg.dy * k,
        angle: Math.atan2(seg.dy, seg.dz),
      };
    },
  };
}
