import * as THREE from 'three';

/**
 * Blueprint renderer primitives.
 *
 * Every part is drawn twice: once as solid faces in (almost) the background colour
 * so it occludes what sits behind it, and once as edge lines. The result is
 * hidden-line removal — a 2D vector drawing that happens to live in 3D space.
 *
 * Hiding the faces of the outer shells turns the same scene into a cutaway, which
 * is how the interior layout is revealed without moving anything.
 */

export const PALETTE = {
  bg: 0x061726,
  face: 0x0a2942,
  faceDim: 0x081f33,
  faceHot: 0x13456b,
  edge: 0x8fd8ff,
  edgeSoft: 0x4a86ad,
  edgeDim: 0x24506f,
  edgeGhost: 0x1d425c,
  edgeHot: 0xffffff,
  accent: 0xffc247,
};

/** A national palette only shifts the line hue; the drawing sheet stays the same. */
export function makePalette(overrides = {}) {
  return { ...PALETTE, ...overrides };
}

/**
 * Derive a full line palette from one national ink colour, so each vehicle reads
 * as a different drawing without hand-picking five related shades per country.
 */
export function paletteFromEdge(edge, accent) {
  const c = new THREE.Color(edge);
  const hsl = c.getHSL({ h: 0, s: 0, l: 0 });
  const shade = (l, s = hsl.s) => new THREE.Color().setHSL(hsl.h, s, l).getHex();
  return makePalette({
    edge,
    accent,
    edgeSoft: shade(hsl.l * 0.62, hsl.s * 0.8),
    edgeDim: shade(hsl.l * 0.34, hsl.s * 0.7),
    edgeGhost: shade(hsl.l * 0.26, hsl.s * 0.6),
  });
}

const EDGE_THRESHOLD = 22;

// Repeated components (road wheels, sprockets) share one geometry, so the edge
// extraction is cached instead of being recomputed per instance.
const edgeCache = new Map();

function edgesFor(geometry) {
  let edges = edgeCache.get(geometry.uuid);
  if (!edges) {
    edges = new THREE.EdgesGeometry(geometry, EDGE_THRESHOLD);
    edgeCache.set(geometry.uuid, edges);
  }
  return edges;
}

function faceMaterial(color) {
  return new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1.4,
    polygonOffsetUnits: 1.4,
  });
}

export class Part {
  /**
   * @param {object} spec
   * @param {THREE.BufferGeometry} spec.geometry
   * @param {string} spec.id       drawing number, e.g. M1A2-06
   * @param {string} spec.name     English schematic label
   * @param {string} spec.cn       Chinese label
   * @param {string} spec.assembly assembly key used by the system index
   * @param {number[]} [spec.explode] explode direction (metres of travel at 100%)
   * @param {string} [spec.note]   evidence note: confirmed / probable / inferred
   * @param {boolean} [spec.shell] outer armour: hidden in cutaway mode
   * @param {boolean} [spec.internal] interior volume: highlighted in cutaway mode
   * @param {boolean} [spec.soft]  draw with softer edges (secondary detail)
   * @param {object} [spec.palette]
   */
  constructor(spec) {
    this.id = spec.id;
    this.tag = spec.tag || null; // stable handle for callouts, independent of numbering
    this.name = spec.name;
    this.cn = spec.cn || '';
    this.assembly = spec.assembly;
    this.note = spec.note || 'confirmed';
    this.spec = spec.spec || '';
    this.shell = !!spec.shell;
    this.internal = !!spec.internal;
    this.palette = spec.palette || PALETTE;
    this.explode = new THREE.Vector3().fromArray(spec.explode || [0, 0, 0]);

    this.group = new THREE.Group();
    this.group.name = spec.id;

    this.mesh = new THREE.Mesh(spec.geometry, faceMaterial(this.palette.face));
    this.mesh.userData.part = this;
    this.mesh.renderOrder = 1;

    this.lines = new THREE.LineSegments(
      edgesFor(spec.geometry),
      new THREE.LineBasicMaterial({ color: spec.soft ? this.palette.edgeSoft : this.palette.edge }),
    );
    this.lines.renderOrder = 2;

    this.baseEdgeColor = spec.soft ? this.palette.edgeSoft : this.palette.edge;
    this.group.add(this.mesh, this.lines);

    this.anchor = new THREE.Vector3();
    spec.geometry.computeBoundingBox();
    spec.geometry.boundingBox.getCenter(this.anchor);
    this.basePosition = new THREE.Vector3();
  }

  addTo(parent) {
    parent.add(this.group);
    return this;
  }

  setExplodeAmount(t) {
    this.group.position.copy(this.basePosition).addScaledVector(this.explode, t);
  }

  setState({ dim = false, hot = false, cutaway = false }) {
    const p = this.palette;
    // Armour is ghosted both in cutaway mode and whenever another assembly is
    // isolated, so isolating the powerpack or the crew actually shows them.
    const ghosted = this.shell && (cutaway || dim);
    this.mesh.visible = !ghosted;
    this.mesh.material.color.setHex(hot ? p.faceHot : dim ? p.faceDim : p.face);
    const edge = hot
      ? p.edgeHot
      : ghosted
        ? p.edgeGhost
        : dim
          ? p.edgeDim
          : cutaway && this.internal
            ? p.accent
            : this.baseEdgeColor;
    this.lines.material.color.setHex(edge);
  }

  worldAnchor(target) {
    return target.copy(this.anchor).applyMatrix4(this.group.matrixWorld);
  }

  dispose() {
    this.mesh.material.dispose();
    this.lines.material.dispose();
  }
}

/**
 * A closed belt of identical links running along a fixed path.
 *
 * Faces use one InstancedMesh and the edges are one LineSegments buffer rebuilt
 * from a baked template, so an animated 96-link track costs two draw calls
 * instead of two hundred.
 */
export class LinkBelt {
  constructor(linkGeometry, sampler, opts = {}) {
    this.sampler = sampler;
    this.pitch = opts.pitch || 0.16;
    this.count = Math.max(8, Math.round(sampler.total / this.pitch));
    this.x = opts.x || 0;
    this.palette = opts.palette || PALETTE;
    this.offset = 0;

    this.group = new THREE.Group();

    this.mesh = new THREE.InstancedMesh(linkGeometry, faceMaterial(this.palette.face), this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;

    const edgeTemplate = new THREE.EdgesGeometry(linkGeometry, EDGE_THRESHOLD);
    this.template = edgeTemplate.getAttribute('position').array;
    this.vertsPerLink = this.template.length / 3;

    const positions = new Float32Array(this.template.length * this.count);
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.lines = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: this.palette.edge }));
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 2;

    this.group.add(this.mesh, this.lines);
    this.group.position.x = this.x;

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._v = new THREE.Vector3();
    this._s = new THREE.Vector3(1, 1, 1);
    this._axis = new THREE.Vector3(1, 0, 0);
    this.update(0);
  }

  update(offset) {
    this.offset = offset;
    const pitch = this.sampler.total / this.count;
    const out = this.lines.geometry.getAttribute('position');
    const arr = out.array;
    const tpl = this.template;

    for (let i = 0; i < this.count; i++) {
      const pose = this.sampler.at(offset + i * pitch);
      // Links pivot about the belt's X axis; angle is measured in the ZY plane.
      this._q.setFromAxisAngle(this._axis, -pose.angle);
      this._v.set(0, pose.y, pose.z);
      this._m.compose(this._v, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);

      const e = this._m.elements;
      const base = i * tpl.length;
      for (let v = 0; v < this.vertsPerLink; v++) {
        const o = v * 3;
        const x = tpl[o];
        const y = tpl[o + 1];
        const z = tpl[o + 2];
        arr[base + o] = e[0] * x + e[4] * y + e[8] * z + e[12];
        arr[base + o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
        arr[base + o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    out.needsUpdate = true;
    this.lines.geometry.computeBoundingSphere();
  }

  setState({ dim = false, hot = false, cutaway = false }) {
    const p = this.palette;
    this.mesh.material.color.setHex(hot ? p.faceHot : dim ? p.faceDim : p.face);
    this.lines.material.color.setHex(hot ? p.edgeHot : dim || cutaway ? p.edgeDim : p.edge);
  }

  dispose() {
    this.mesh.material.dispose();
    this.mesh.dispose();
    this.lines.geometry.dispose();
    this.lines.material.dispose();
  }
}

/** Ground reference: a fading construction grid drawn only in lines. */
export function buildGrid({ size = 30, divisions = 30 } = {}) {
  const grid = new THREE.GridHelper(size, divisions, PALETTE.edgeDim, 0x11314a);
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  grid.position.y = -0.002;
  return grid;
}
