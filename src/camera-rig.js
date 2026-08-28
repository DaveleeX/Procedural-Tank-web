import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/**
 * Orbit rig with named view presets.
 *
 * Azimuth 0 looks at the vehicle nose from +Z; polar 0 is straight down.
 * Desired values are eased towards, so the view-preset buttons produce the same
 * smooth interpolated moves as a dragged orbit.
 */
export class OrbitRig {
  constructor(camera, dom, opts = {}) {
    this.camera = camera;
    this.dom = dom;

    this.target = new THREE.Vector3(0, 1.25, 0.1);
    this.desiredTarget = this.target.clone();
    this.azimuth = -0.72;
    this.polar = 1.16;
    this.distance = 16.0;
    this.desired = { azimuth: this.azimuth, polar: this.polar, distance: this.distance };

    /** Multiplier applied on top of the orbit distance, e.g. to frame an exploded view. */
    this.bias = 1;
    this.currentBias = 1;

    this.minDistance = opts.minDistance ?? 4.2;
    this.maxDistance = opts.maxDistance ?? 34;
    this.autoRotateSpeed = opts.autoRotateSpeed ?? 0.11;
    this.autoRotate = true;
    this.idleDelay = opts.idleDelay ?? 2.4;
    this.idle = 0;
    this.dragging = false;
    this.panning = false;
    this.panOffset = 0;

    this._pointer = { x: 0, y: 0 };
    this._bind();
    this.apply(1);
  }

  _bind() {
    const dom = this.dom;
    dom.addEventListener('pointerdown', (e) => {
      if (e.button === 1) e.preventDefault();
      dom.setPointerCapture(e.pointerId);
      this.dragging = true;
      this.panning = e.shiftKey || e.button === 1 || e.button === 2;
      this._pointer.x = e.clientX;
      this._pointer.y = e.clientY;
      this.idle = 0;
      dom.classList.add('grabbing');
    });
    dom.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this._pointer.x;
      const dy = e.clientY - this._pointer.y;
      this._pointer.x = e.clientX;
      this._pointer.y = e.clientY;
      this.idle = 0;
      if (this.panning) {
        const scale = this.distance * 0.0016;
        const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
        this.desiredTarget.addScaledVector(right, -dx * scale).addScaledVector(up, dy * scale);
        this.desiredTarget.y = clamp(this.desiredTarget.y, -1.5, 5);
        this.panOffset = this.desiredTarget.distanceTo(new THREE.Vector3(0, 1.25, 0.1));
      } else {
        this.desired.azimuth -= dx * 0.0062;
        this.desired.polar = clamp(this.desired.polar - dy * 0.005, 0.05, 1.62);
      }
    });
    const release = (e) => {
      this.dragging = false;
      this.panning = false;
      dom.classList.remove('grabbing');
      if (e && e.pointerId !== undefined && dom.hasPointerCapture?.(e.pointerId)) {
        dom.releasePointerCapture(e.pointerId);
      }
    };
    dom.addEventListener('pointerup', release);
    dom.addEventListener('pointercancel', release);
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
    dom.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.idle = 0;
        this.desired.distance = clamp(this.desired.distance * (1 + Math.sign(e.deltaY) * 0.08), this.minDistance, this.maxDistance);
      },
      { passive: false },
    );
  }

  /** Jump or ease to a named view. */
  setView(view, immediate = false) {
    if (view.azimuth !== undefined) this.desired.azimuth = view.azimuth;
    if (view.polar !== undefined) this.desired.polar = clamp(view.polar, 0.05, 1.62);
    if (view.distance !== undefined) this.desired.distance = clamp(view.distance, this.minDistance, this.maxDistance);
    if (view.target) this.desiredTarget.fromArray(view.target);
    this.idle = 0;
    if (immediate) {
      this.azimuth = this.desired.azimuth;
      this.polar = this.desired.polar;
      this.distance = this.desired.distance;
      this.target.copy(this.desiredTarget);
      this.apply(1);
    }
  }

  resetPan() {
    this.desiredTarget.set(0, 1.25, 0.1);
    this.panOffset = 0;
  }

  update(dt) {
    this.idle += dt;
    if (this.autoRotate && this.idle > this.idleDelay && !this.dragging) {
      this.desired.azimuth += this.autoRotateSpeed * dt;
    }
    const k = Math.min(1, dt * 6.5);
    this.azimuth += (this.desired.azimuth - this.azimuth) * k;
    this.polar += (this.desired.polar - this.polar) * k;
    this.distance += (this.desired.distance - this.distance) * k;
    this.currentBias += (this.bias - this.currentBias) * k;
    this.target.lerp(this.desiredTarget, k);
    this.apply(k);
  }

  apply() {
    const sp = Math.sin(this.polar);
    const cp = Math.cos(this.polar);
    const d = this.distance * this.currentBias;
    this.camera.position.set(
      this.target.x + d * sp * Math.sin(this.azimuth),
      this.target.y + d * cp,
      this.target.z + d * sp * Math.cos(this.azimuth),
    );
    this.camera.lookAt(this.target);
  }

  get telemetry() {
    const deg = (r) => ((r * 180) / Math.PI + 360) % 360;
    return {
      azimuth: deg(this.azimuth),
      elevation: 90 - (this.polar * 180) / Math.PI,
      zoom: this.distance * this.currentBias,
      pan: this.panOffset,
      idle: this.idle,
      auto: this.autoRotate && this.idle > this.idleDelay,
    };
  }
}

/**
 * Distance at which a box exactly fits the usable part of the viewport from a
 * given orbit direction. Exact for boxes, so a 10 m tank and a 0.6 m road wheel
 * are both framed correctly without per-vehicle tuning.
 *
 * @param {THREE.Box3} box
 * @param {{azimuth:number, polar:number}} dir
 * @param {{fov:number, aspect:number, band:number, margin:number}} view
 *        `band` is the fraction of the viewport width left free by the panels.
 */
export function fitDistance(box, dir, { fov, aspect, band = 1, margin = 1.12 }) {
  const size = box.getSize(new THREE.Vector3());
  const sp = Math.sin(dir.polar);
  const cp = Math.cos(dir.polar);
  const d = new THREE.Vector3(sp * Math.sin(dir.azimuth), cp, sp * Math.cos(dir.azimuth)).normalize();
  const up = Math.abs(d.y) > 0.98 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(up, d).normalize();
  const screenUp = new THREE.Vector3().crossVectors(d, right).normalize();

  const halfAlong = (axis) =>
    0.5 * (Math.abs(axis.x) * size.x + Math.abs(axis.y) * size.y + Math.abs(axis.z) * size.z);

  const vHalf = THREE.MathUtils.degToRad(fov) / 2;
  const hHalf = Math.atan(Math.tan(vHalf) * aspect * band);
  return Math.max(halfAlong(screenUp) / Math.tan(vHalf), halfAlong(right) / Math.tan(hHalf)) * margin;
}

/** Build the six canonical views for a specific model box. */
export function makeViews(box, view) {
  const c = box.getCenter(new THREE.Vector3());
  const dirs = {
    '3/4 R': { azimuth: -0.72, polar: 1.16 },
    '3/4 L': { azimuth: 0.72, polar: 1.16 },
    SIDE: { azimuth: -Math.PI / 2, polar: Math.PI / 2 },
    FRONT: { azimuth: 0, polar: 1.5 },
    REAR: { azimuth: Math.PI, polar: 1.5 },
    PLAN: { azimuth: 0, polar: 0.06 },
  };
  const out = {};
  for (const [name, dir] of Object.entries(dirs)) {
    out[name] = { ...dir, distance: fitDistance(box, dir, view), target: [c.x, c.y, c.z] };
  }
  return out;
}

export const VIEWS = {
  '3/4 R': { azimuth: -0.72, polar: 1.16, distance: 16.0, target: [0, 1.25, 0.35] },
  '3/4 L': { azimuth: 0.72, polar: 1.16, distance: 16.0, target: [0, 1.25, 0.35] },
  SIDE: { azimuth: -Math.PI / 2, polar: 1.5708, distance: 21.0, target: [0, 1.3, 0.7] },
  FRONT: { azimuth: 0, polar: 1.5, distance: 15.0, target: [0, 1.3, 0.4] },
  REAR: { azimuth: Math.PI, polar: 1.5, distance: 15.0, target: [0, 1.3, -0.4] },
  PLAN: { azimuth: 0, polar: 0.06, distance: 26.0, target: [0, 0.9, 0.9] },
};
