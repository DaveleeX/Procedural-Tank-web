import * as THREE from 'three';

/**
 * Screen-space callout leaders: an HTML label joined to a projected 3D anchor by
 * an SVG elbow line, the way a printed assembly drawing annotates its parts.
 */
export class Callouts {
  constructor({ svg, layer, camera }) {
    this.svg = svg;
    this.layer = layer;
    this.camera = camera;
    this.items = [];
    this._v = new THREE.Vector3();
  }

  build(defs, lookup) {
    this.layer.innerHTML = '';
    while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
    this.items = defs
      .map((def) => {
        const part = lookup(def);
        if (!part) return null;
        const label = document.createElement('div');
        label.className = `callout callout--${def.side}`;
        label.textContent = def.text;
        this.layer.appendChild(label);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        line.setAttribute('class', 'leader');
        this.svg.appendChild(line);

        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('class', 'leader-dot');
        dot.setAttribute('r', '2.5');
        this.svg.appendChild(dot);

        return { def, part, label, line, dot };
      })
      .filter(Boolean);
  }

  setVisible(visible) {
    this.layer.style.display = visible ? '' : 'none';
    this.svg.style.display = visible ? '' : 'none';
  }

  /**
   * @param {number} width viewport width
   * @param {number} height viewport height
   * @param {{left:number, right:number, top:number, bottom:number}} safe
   *        band the labels must stay inside, so they never slide under the panels
   */
  update(width, height, safe) {
    const reach = Math.min(190, (safe.right - safe.left) * 0.22);
    const live = [];

    for (const item of this.items) {
      const { def, part, label, line, dot } = item;
      part.worldAnchor(this._v).project(this.camera);
      const ax = (this._v.x * 0.5 + 0.5) * width;
      const ay = (-this._v.y * 0.5 + 0.5) * height;
      const hidden = this._v.z > 1 || ax < safe.left - 220 || ax > safe.right + 220;
      label.style.opacity = hidden ? 0 : 1;
      line.style.opacity = hidden ? 0 : 1;
      dot.style.opacity = hidden ? 0 : 1;
      if (hidden) continue;

      const off = def.side === 'left' ? -1 : 1;
      const lw = label.offsetWidth;
      // lx is the label edge that faces its anchor.
      const lx =
        off === 1
          ? Math.min(safe.right - lw, Math.max(safe.left, ax + reach))
          : Math.max(safe.left + lw, Math.min(safe.right, ax - reach));
      live.push({ item, off, ax, ay, lx, lw, ly: Math.min(safe.bottom, Math.max(safe.top, ay + (def.dy || 0))) });
    }

    // Labels whose boxes would overlap are pushed apart vertically, so leaders never
    // stack on each other when the camera swings the parts into line.
    const gap = 24;
    const left = (l) => (l.off === 1 ? l.lx : l.lx - l.lw);
    live.sort((a, b) => a.ly - b.ly);
    for (let i = 1; i < live.length; i++) {
      const a = live[i];
      for (let j = 0; j < i; j++) {
        const b = live[j];
        const overlapX = left(a) < left(b) + b.lw && left(b) < left(a) + a.lw;
        if (overlapX && a.ly - b.ly < gap) a.ly = b.ly + gap;
      }
    }
    const overflow = Math.max(0, Math.max(...live.map((l) => l.ly), safe.top) - safe.bottom);
    if (overflow > 0) for (const l of live) l.ly = Math.max(safe.top, l.ly - overflow);

    for (const l of live) {
      const { item, off, ax, ay, lx, lw, ly } = l;
      const { label, line, dot } = item;
      label.style.transform = `translate(${off === -1 ? lx - lw : lx}px, ${ly - label.offsetHeight / 2}px)`;
      line.setAttribute('points', `${ax},${ay} ${lx - off * 16},${ly} ${lx},${ly}`);
      dot.setAttribute('cx', ax);
      dot.setAttribute('cy', ay);
    }
  }
}
