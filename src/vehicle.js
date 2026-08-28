import * as THREE from 'three';
import { Part, LinkBelt, makePalette } from './blueprint.js';
import { polylineSampler } from './geo.js';
import { runningGear, trackLink } from './kit.js';

/**
 * Shared scaffolding for every vehicle in the atlas: the animated group hierarchy,
 * part registration with automatic drawing numbers, and the running gear / track
 * plumbing. A vehicle module only has to describe geometry.
 */

export const ASSEMBLIES = [
  { key: 'hull', code: 'A1', name: 'HULL & ARMOUR', cn: '车体与装甲', dir: { azimuth: -0.7, polar: 1.15 } },
  { key: 'turret', code: 'A2', name: 'TURRET', cn: '炮塔', dir: { azimuth: -1.0, polar: 1.02 } },
  { key: 'gun', code: 'A3', name: 'MAIN ARMAMENT', cn: '主武器系统', dir: { azimuth: -1.32, polar: 1.4 } },
  { key: 'running', code: 'A4', name: 'RUNNING GEAR', cn: '行走装置', dir: { azimuth: -1.5, polar: 1.42 } },
  { key: 'track', code: 'A5', name: 'TRACKS', cn: '履带', dir: { azimuth: -1.15, polar: 1.5 } },
  { key: 'power', code: 'A6', name: 'POWERPACK', cn: '动力舱', dir: { azimuth: 2.3, polar: 1.18 } },
  { key: 'crew', code: 'A7', name: 'CREW & INTERIOR', cn: '乘员与内部布置', dir: { azimuth: -0.85, polar: 1.1 } },
];

export class VehicleBuilder {
  /**
   * @param {object} meta vehicle metadata from the registry
   * @param {object} layout turret ring position and gun pivot
   */
  constructor(meta, layout) {
    this.meta = meta;
    this.palette = makePalette(meta.palette);
    this.prefix = meta.prefix;
    this.seq = 0;

    this.parts = [];
    this.belts = [];
    this.spinners = [];

    this.root = new THREE.Group();
    this.chassis = new THREE.Group(); // wheels and tracks stay level with the ground
    this.hull = new THREE.Group(); // hull, turret and interior pitch together
    this.turret = new THREE.Group();
    this.gun = new THREE.Group();
    this.root.add(this.chassis, this.hull);
    this.hull.add(this.turret);
    this.turret.add(this.gun);

    this.layout = layout;
    this.turret.position.set(0, 0, layout.turretZ);
    this.gun.position.set(0, layout.gunAxisY, layout.gunPivotZ);
  }

  /** Register a part. `at` positions the group; geometry is authored in parent space. */
  add(parent, spec) {
    const part = new Part({
      ...spec,
      palette: this.palette,
      id: spec.id || `${this.prefix}-${String(++this.seq).padStart(2, '0')}`,
    });
    if (spec.at) part.basePosition.fromArray(spec.at);
    part.group.position.copy(part.basePosition);
    part.addTo(parent);
    this.parts.push(part);
    return part;
  }

  addHull(spec) {
    return this.add(this.hull, { assembly: 'hull', shell: true, ...spec });
  }

  addTurret(spec) {
    return this.add(this.turret, { assembly: 'turret', shell: true, ...spec });
  }

  addGun(spec) {
    return this.add(this.gun, { assembly: 'gun', ...spec });
  }

  /** Interior volumes: highlighted in cutaway, hidden behind the shells otherwise. */
  addInterior(parent, spec) {
    return this.add(parent, { assembly: 'crew', internal: true, explode: [0, 0, 0], ...spec });
  }

  /** Register a rotating running-gear part so the drive animation spins it. */
  addSpinner(spec, radius) {
    const part = this.add(this.chassis, { assembly: 'running', ...spec });
    this.spinners.push({ part, radius });
    return part;
  }

  /**
   * Wheels, rollers, sprocket, idler and both track belts from one spec.
   * @returns {{ride:number}} axle height, so the caller can align suspension parts
   */
  addRunningGear(S) {
    let hull = null;
    for (const side of [1, -1]) {
      const label = side > 0 ? 'L' : 'R';
      const gear = runningGear(S, side);
      hull = gear.circles;
      for (const item of gear.items) {
        const naming = {
          wheel: { name: `ROAD WHEEL ${item.index}`, cn: '负重轮', spec: `${Math.round(S.wheelRadius * 2000)} mm dual-tyre road wheel` },
          roller: { name: 'RETURN ROLLER', cn: '托带轮', spec: 'Track return roller' },
          sprocket: { name: 'DRIVE SPROCKET', cn: '主动轮', spec: `${S.sprocket.teeth} teeth, ${S.sprocketPosition || 'rear'} drive` },
          idler: { name: 'IDLER WHEEL', cn: '诱导轮', spec: 'Adjustable idler for track tension' },
        }[item.kind];
        const part = this.add(this.chassis, {
          id: `${this.prefix}-${item.kind === 'wheel' ? `RW${item.index}` : item.kind === 'roller' ? 'RR' : item.kind === 'sprocket' ? 'SP' : 'ID'}${label}`,
          assembly: 'running',
          geometry: item.geometry,
          at: item.at,
          explode: [side * 1.0, 0, 0],
          soft: item.kind === 'roller',
          ...naming,
        });
        this.spinners.push({ part, radius: item.radius });
      }
    }
    this.addBelts(S, hull);
    return { ride: S.wheelRadius + S.linkThickness + S.cleatDepth };
  }

  /**
   * Both track belts running along a shared rubber-band path.
   * @param {object} S track spec
   * @param {Array<{z:number,y:number}>} circlesHull belt path from `runningGear`
   */
  addBelts(S, circlesHull, opts = {}) {
    const sampler = polylineSampler(circlesHull);
    const link = opts.link || trackLink(S);
    for (const side of [1, -1]) {
      const label = side > 0 ? 'L' : 'R';
      const belt = new LinkBelt(link, sampler, {
        pitch: S.linkPitch,
        x: side * S.trackCentre,
        palette: this.palette,
      });
      Object.assign(belt, {
        id: `${this.prefix}-TR${label}`,
        tag: 'track',
        name: 'TRACK BELT',
        cn: '履带',
        assembly: 'track',
        note: 'confirmed',
        spec: opts.spec || `${Math.round(S.trackWidth * 1000)} mm track · ${belt.count} links`,
      });
      belt.mesh.userData.part = belt;
      belt.explode = new THREE.Vector3(side * 1.45, 0, 0);
      belt.basePosition = new THREE.Vector3(side * S.trackCentre, 0, 0);
      belt.group.position.copy(belt.basePosition);
      belt.setExplodeAmount = (t) => belt.group.position.copy(belt.basePosition).addScaledVector(belt.explode, t);
      belt.worldAnchor = (target) => target.set(belt.basePosition.x, S.wheelRadius, 0);
      this.chassis.add(belt.group);
      this.belts.push(belt);
    }
    this.beltLength = sampler.total;
  }

  finish() {
    const selectables = [...this.parts, ...this.belts];
    this.root.updateMatrixWorld(true);
    return {
      meta: this.meta,
      palette: this.palette,
      root: this.root,
      chassis: this.chassis,
      hull: this.hull,
      turret: this.turret,
      gun: this.gun,
      parts: this.parts,
      belts: this.belts,
      spinners: this.spinners,
      selectables,
      layout: this.layout,
      bounds: new THREE.Box3().setFromObject(this.root),
      assemblyBounds: assemblyBounds(selectables),
      dispose() {
        for (const p of this.parts) p.dispose();
        for (const b of this.belts) b.dispose();
      },
    };
  }
}

function assemblyBounds(selectables) {
  const out = {};
  const b = new THREE.Box3();
  for (const item of selectables) {
    const target = item.group;
    b.setFromObject(target);
    if (b.isEmpty()) continue;
    out[item.assembly] = out[item.assembly] ? out[item.assembly].union(b.clone()) : b.clone();
  }
  return out;
}
