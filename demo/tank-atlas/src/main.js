import * as THREE from 'three';
import { STLExporter } from '../vendor/STLExporter.js';
import { buildGrid, paletteFromEdge } from './blueprint.js';
import { OrbitRig, makeViews, fitDistance } from './camera-rig.js';
import { Callouts } from './callouts.js';
import { VEHICLES } from './registry.js';
import { ASSEMBLIES } from './vehicle.js';
import { resolvePrompt } from './generate/parse.js';

const $ = (sel) => document.querySelector(sel);
const canvas = $('#view');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (err) {
  $('#boot').textContent = 'WEBGL UNAVAILABLE — 无法初始化 3D 上下文';
  throw err;
}
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setClearAlpha(0);

const FOV = 26;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 600);
const rig = new OrbitRig(camera, canvas);
const grid = buildGrid({ size: 34, divisions: 34 });
scene.add(grid);
const callouts = new Callouts({ svg: $('#leaders'), layer: $('#labels'), camera });

const state = {
  vehicle: null, // built vehicle currently in the scene
  meta: null,
  views: {},
  viewName: '3/4 R',
  explode: 0,
  explodeTarget: 0,
  animate: false,
  cutaway: false,
  animMix: 0,
  phase: 0,
  speed: 0,
  drive: 0,
  isolate: null,
  selected: null,
  hover: null,
  leaders: true,
  frames: 0,
  loading: false,
};

const TRACK_SPEED = 3.2; // m/s, a brisk cross-country pace
const cache = new Map();

// --------------------------------------------------------------- vehicle index
const vehicleList = $('#vehicle-list');
VEHICLES.forEach((meta) => appendVehicleRow(meta));
mountComposeSlot();

function vehicleRowHTML(meta) {
  return `<span class="flag">${meta.flag}</span><span class="name">${meta.name}</span><span class="state">STANDBY</span><span class="country">${meta.countryCn} · ${meta.country}</span>`;
}

function appendVehicleRow(meta, before = null) {
  const li = document.createElement('li');
  bindVehicleRow(li, meta);
  if (before) vehicleList.insertBefore(li, before);
  else vehicleList.appendChild(li);
  return li;
}

function bindVehicleRow(li, meta) {
  li.className = '';
  li.innerHTML = vehicleRowHTML(meta);
  li.onclick = () => selectVehicle(meta);
  meta.el = li;
}

function mountComposeSlot() {
  const li = document.createElement('li');
  vehicleList.appendChild(li);
  renderComposeIdle(li);
}

function renderComposeIdle(li) {
  delete li.dataset.busy;
  li.className = 'compose-slot';
  li.innerHTML = `<span class="flag plus">+</span><span class="name">COMPOSE FROM TEXT</span><span class="state">NEW</span><span class="country">文字生成坦克 · 输入车名</span>`;
  li.onclick = () => enterCompose(li);
}

function enterCompose(li) {
  li.className = 'compose-slot is-editing';
  li.onclick = null;
  li.innerHTML = `
    <span class="flag plus">+</span>
    <label class="compose-field">
      <input type="text" maxlength="64" placeholder="M60 · 梅卡瓦 · T-14 Armata" autocomplete="off" spellcheck="false" />
    </label>
    <button type="button" class="compose-ok">OK</button>
    <span class="country compose-hint">Enter 确认 · Esc 取消</span>`;
  const input = li.querySelector('input');
  const ok = li.querySelector('.compose-ok');
  input.focus();
  const cancel = () => renderComposeIdle(li);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmCompose(li, input.value);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  });
  ok.addEventListener('click', (e) => {
    e.stopPropagation();
    confirmCompose(li, input.value);
  });
}

async function confirmCompose(li, raw) {
  if (li.dataset.busy === '1') return;
  const input = li.querySelector('input');
  const hint = li.querySelector('.compose-hint');
  const result = resolvePrompt(raw, VEHICLES);
  if (!result.ok) {
    if (hint) hint.textContent = result.error;
    if (input) {
      input.classList.add('is-bad');
      input.focus();
    }
    return;
  }
  if (result.kind === 'existing') {
    renderComposeIdle(li);
    await selectVehicle(result.meta);
    return;
  }

  li.dataset.busy = '1';
  const meta = result.meta;
  VEHICLES.push(meta);
  bindVehicleRow(li, meta);
  li.classList.add('is-loading');
  const stateEl = li.querySelector('.state');
  if (stateEl) stateEl.textContent = 'BUILDING';
  mountComposeSlot();
  try {
    while (state.loading) await new Promise((r) => setTimeout(r, 40));
    await selectVehicle(meta);
  } catch (err) {
    if (stateEl) stateEl.textContent = 'FAILED';
    console.error(err);
  }
}

function markVehicleList(active, loadingId) {
  for (const meta of VEHICLES) {
    if (!meta.el) continue;
    const on = meta === active;
    meta.el.classList.toggle('is-active', on);
    meta.el.classList.toggle('is-loading', meta.id === loadingId);
    const stateEl = meta.el.querySelector('.state');
    if (stateEl) stateEl.textContent = meta.id === loadingId ? 'BUILDING' : on ? 'ACTIVE' : 'STANDBY';
  }
}

/** National ink colour drives both the 3D lines and the sheet chrome. */
function applyChrome(meta) {
  const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
  const root = document.documentElement.style;
  root.setProperty('--line', hex(meta.ink));
  root.setProperty('--accent', hex(meta.accent));
  root.setProperty('--sheet', meta.sheet);
  const c = new THREE.Color(meta.ink);
  root.setProperty('--line-soft', `rgba(${c.r * 255 | 0}, ${c.g * 255 | 0}, ${c.b * 255 | 0}, 0.34)`);
  root.setProperty('--line-faint', `rgba(${c.r * 255 | 0}, ${c.g * 255 | 0}, ${c.b * 255 | 0}, 0.13)`);

  $('#mh-flag').textContent = meta.flag;
  $('#mh-country').textContent = meta.country;
  $('#mh-desig').textContent = meta.designation;
  $('#mh-name').textContent = meta.name;
  $('#mh-name-cn').textContent = meta.nameCn;
  $('#mh-structure').innerHTML = meta.structure
    .map(([en, cn]) => `<li>${en}<br><em>${cn}</em></li>`)
    .join('');
  $('#mh-texture').textContent = `FINISH & ENVIRONMENT 质感与环境 — ${meta.texture.map(([en, cn]) => `${en}（${cn}）`).join(' · ')}`;
  $('#spec-list').innerHTML = meta.specs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
}

async function selectVehicle(meta) {
  if (state.loading || meta === state.meta) return;
  state.loading = true;
  markVehicleList(state.meta, meta.id);

  let built = cache.get(meta.id);
  if (!built) {
    const mod = await meta.load();
    // Let the browser paint the BUILDING state before the geometry pass blocks it.
    await new Promise((r) => requestAnimationFrame(r));
    built = mod.build({ ...meta, palette: paletteFromEdge(meta.ink, meta.accent) });
    built.callouts = mod.CALLOUTS || [];
    cache.set(meta.id, built);
  }

  if (state.vehicle) scene.remove(state.vehicle.root);
  state.vehicle = built;
  state.meta = meta;
  scene.add(built.root);

  applyChrome(meta);
  buildSystemIndex(built);
  state.isolate = null;
  setSelected(null);
  state.drive = 0;
  refreshViews();
  rig.setView(state.views['3/4 R']);
  setActive($('#view-buttons'), $('#view-buttons').firstChild);
  state.viewName = '3/4 R';
  callouts.build(built.callouts, (def) =>
    built.selectables.find((p) => (def.tag && p.tag === def.tag) || (def.id && p.id === def.id)),
  );
  callouts.setVisible(state.leaders);
  applyExplode(true);
  refreshPartStates();
  $('#tm-parts').textContent = `${built.parts.length + built.belts.length} / ${built.belts.reduce((n, b) => n + b.count, 0)}`;

  markVehicleList(meta, null);
  state.loading = false;
}

// ---------------------------------------------------------------- system index
function buildSystemIndex(vehicle) {
  const list = $('#system-list');
  list.innerHTML = '';
  const present = new Set(vehicle.selectables.map((p) => p.assembly));
  const rows = [{ key: null, code: 'A0', name: 'ALL SYSTEMS', cn: '全车' }, ...ASSEMBLIES.filter((a) => present.has(a.key))];
  for (const row of rows) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${row.code} ${row.name}</span><span class="cn">${row.cn}</span>`;
    li.classList.toggle('is-active', row.key === null);
    li.addEventListener('click', () => {
      state.isolate = row.key;
      [...list.children].forEach((c) => c.classList.toggle('is-active', c === li));
      if (row.key) {
        const box = vehicle.assemblyBounds[row.key];
        const dir = ASSEMBLIES.find((a) => a.key === row.key).dir;
        if (box) {
          const c = box.getCenter(new THREE.Vector3());
          rig.setView({ ...dir, distance: fitDistance(box, dir, viewport()), target: [c.x, c.y, c.z] });
        }
      } else {
        rig.setView(state.views[state.viewName]);
      }
      refreshPartStates();
    });
    list.appendChild(li);
  }
}

// ------------------------------------------------------------------- framing
function viewport() {
  const hidden = document.body.classList.contains('hud-hidden');
  const free = hidden ? window.innerWidth : $('#right-col').getBoundingClientRect().left - $('#left-col').getBoundingClientRect().right - 48;
  return {
    fov: FOV,
    aspect: window.innerWidth / window.innerHeight,
    band: Math.max(0.35, free / window.innerWidth),
    margin: 1.1,
  };
}

function refreshViews() {
  if (!state.vehicle) return;
  state.views = makeViews(state.vehicle.bounds, viewport());
}

/** Region the callout labels may occupy, i.e. the viewport minus the panels. */
function safeBand() {
  const hudHidden = document.body.classList.contains('hud-hidden');
  const left = hudHidden ? 40 : $('#left-col').getBoundingClientRect().right + 22;
  const right = hudHidden ? window.innerWidth - 40 : $('#right-col').getBoundingClientRect().left - 22;
  return { left, right: Math.max(left + 140, right), top: 56, bottom: window.innerHeight - 86 };
}

// ------------------------------------------------------------------- view keys
const viewButtons = $('#view-buttons');
const viewNames = ['3/4 R', '3/4 L', 'SIDE', 'FRONT', 'REAR', 'PLAN'];
viewNames.forEach((name) => {
  const b = document.createElement('button');
  b.className = 'btn';
  b.textContent = name;
  b.addEventListener('click', () => applyView(name, b));
  viewButtons.appendChild(b);
});

function applyView(name, button) {
  state.viewName = name;
  rig.setView(state.views[name]);
  rig.resetPan();
  setActive(viewButtons, button || viewButtons.children[viewNames.indexOf(name)]);
}

function setActive(container, el) {
  [...container.children].forEach((c) => c.classList.toggle('is-on', c === el));
}

// ---------------------------------------------------------------- layer action
const actionButtons = [...document.querySelectorAll('[data-action]')];
const actionBtn = (name) => actionButtons.find((b) => b.dataset.action === name);
const explodeRange = $('#explode-range');

actionBtn('explode').addEventListener('click', () => setExplode(state.explodeTarget > 0.5 ? 0 : 1));
actionBtn('cutaway').addEventListener('click', () => setCutaway(!state.cutaway));
actionBtn('animate').addEventListener('click', () => setAnimate(true));
actionBtn('static').addEventListener('click', () => setAnimate(false));
actionBtn('labels').addEventListener('click', () => setLeaders(!state.leaders));
actionBtn('grid').addEventListener('click', () => {
  grid.visible = !grid.visible;
  actionBtn('grid').classList.toggle('is-on', grid.visible);
});
actionBtn('export').addEventListener('click', exportSTL);
explodeRange.addEventListener('input', () => setExplode(Number(explodeRange.value) / 100));

function setExplode(v) {
  state.explodeTarget = v;
  explodeRange.value = Math.round(v * 100);
  actionBtn('explode').classList.toggle('is-on', v > 0.5);
}

function setCutaway(on) {
  state.cutaway = on;
  actionBtn('cutaway').classList.toggle('is-on', on);
  refreshPartStates();
}

function setAnimate(on) {
  state.animate = on;
  actionBtn('animate').classList.toggle('is-on', on);
  actionBtn('static').classList.toggle('is-on', !on);
}

function setLeaders(on) {
  state.leaders = on;
  callouts.setVisible(on);
  actionBtn('labels').classList.toggle('is-on', on);
}

// ------------------------------------------------------------------- picking
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pickDirty = false;
let pressInfo = null;

const pickTargets = () =>
  state.vehicle ? [...state.vehicle.parts.filter((p) => p.mesh.visible).map((p) => p.mesh), ...state.vehicle.belts.map((b) => b.mesh)] : [];

canvas.addEventListener('pointermove', (e) => {
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  pickDirty = true;
});
canvas.addEventListener('pointerdown', (e) => {
  pressInfo = { x: e.clientX, y: e.clientY, t: performance.now() };
});
canvas.addEventListener('pointerup', (e) => {
  if (!pressInfo) return;
  const moved = Math.hypot(e.clientX - pressInfo.x, e.clientY - pressInfo.y);
  const quick = performance.now() - pressInfo.t < 500;
  pressInfo = null;
  if (moved > 5 || !quick) return;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(pickTargets(), false)[0];
  setSelected(hit ? hit.object.userData.part : null);
});

function resolveHover() {
  if (!pickDirty || !state.vehicle) return;
  pickDirty = false;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(pickTargets(), false)[0];
  const part = hit ? hit.object.userData.part : null;
  if (part !== state.hover) {
    state.hover = part;
    refreshPartStates();
  }
}

function setSelected(part) {
  state.selected = part;
  const panel = $('#selected-panel');
  panel.classList.toggle('is-empty', !part);
  $('#sel-code').textContent = part ? part.id : '—';
  $('#sel-name').textContent = part ? part.name : 'CLICK ANY COMPONENT';
  $('#sel-cn').textContent = part ? part.cn : '点击模型上的任意构件';
  $('#sel-spec').textContent = part ? part.spec || '' : '';
  $('#sel-note').textContent = part ? `EVIDENCE · ${String(part.note).toUpperCase()}` : '';
  refreshPartStates();
}

function refreshPartStates() {
  if (!state.vehicle) return;
  for (const item of state.vehicle.selectables) {
    item.setState({
      dim: state.isolate !== null && item.assembly !== state.isolate,
      hot: item === state.selected || item === state.hover,
      cutaway: state.cutaway,
    });
  }
}

function applyExplode(force = false) {
  if (!state.vehicle) return;
  for (const item of state.vehicle.selectables) item.setExplodeAmount(force ? state.explodeTarget : state.explode);
  rig.bias = 1 + state.explode * 0.5;
}

// ------------------------------------------------------------------ STL export
function exportSTL() {
  if (!state.vehicle) return;
  const btn = actionBtn('export');
  btn.textContent = 'BAKING…';
  state.vehicle.root.updateMatrixWorld(true);

  const bake = new THREE.Scene();
  for (const part of state.vehicle.parts) {
    const g = part.mesh.geometry.clone();
    g.applyMatrix4(part.mesh.matrixWorld);
    bake.add(new THREE.Mesh(g));
  }
  // InstancedMesh is invisible to the exporter, so every track link is baked out.
  const m = new THREE.Matrix4();
  for (const belt of state.vehicle.belts) {
    for (let i = 0; i < belt.count; i++) {
      belt.mesh.getMatrixAt(i, m);
      const g = belt.mesh.geometry.clone();
      g.applyMatrix4(m.premultiply(belt.mesh.matrixWorld));
      bake.add(new THREE.Mesh(g));
    }
  }

  const data = new STLExporter().parse(bake, { binary: true });
  const url = URL.createObjectURL(new Blob([data], { type: 'model/stl' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.meta.id}.stl`;
  a.click();
  URL.revokeObjectURL(url);
  bake.traverse((o) => o.geometry && o.geometry.dispose());
  btn.textContent = 'EXPORT STL';
}

// -------------------------------------------------------------------- keyboard
window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  const key = e.key.toLowerCase();
  const viewIndex = '123456'.indexOf(key);
  if (viewIndex >= 0) return applyView(viewNames[viewIndex]);
  if (key === 'e') setExplode(state.explodeTarget > 0.5 ? 0 : 1);
  if (key === 'c') setCutaway(!state.cutaway);
  if (key === 'a') setAnimate(true);
  if (key === 's') setAnimate(false);
  if (key === 'l') setLeaders(!state.leaders);
  if (key === 'g') actionBtn('grid').click();
  if (key === 'h') document.body.classList.toggle('hud-hidden');
  if (key === 'arrowdown' || key === 'arrowup') {
    e.preventDefault();
    const i = VEHICLES.indexOf(state.meta);
    selectVehicle(VEHICLES[(i + (key === 'arrowdown' ? 1 : VEHICLES.length - 1)) % VEHICLES.length]);
  }
  if (key === 'escape') {
    setSelected(null);
    state.isolate = null;
    [...$('#system-list').children].forEach((c, i) => c.classList.toggle('is-active', i === 0));
    refreshPartStates();
  }
});

// ---------------------------------------------------------------------- resize
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  $('#leaders').setAttribute('viewBox', `0 0 ${w} ${h}`);
  refreshViews();
}
window.addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------- main loop
const tm = {
  az: $('#tm-az'),
  el: $('#tm-el'),
  zoom: $('#tm-zoom'),
  explode: $('#tm-explode'),
  track: $('#tm-track'),
  frames: $('#tm-frames'),
  mode: $('#status-mode'),
  hint: $('#viewport-hint'),
  read: $('#explode-read'),
};

let last = performance.now();
let fps = 60;
let telemetryClock = 0;
let lastExplode = -1;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.frames++;
  if (dt > 0.002) fps += (1 / dt - fps) * 0.08;

  state.explode += (state.explodeTarget - state.explode) * Math.min(1, dt * 4.5);
  if (Math.abs(state.explode - lastExplode) > 0.0004) {
    lastExplode = state.explode;
    applyExplode();
  }

  const v = state.vehicle;
  if (v) {
    const mixTarget = state.animate ? 1 : 0;
    state.animMix += (mixTarget - state.animMix) * Math.min(1, dt * 2.2);
    state.speed += (TRACK_SPEED * mixTarget - state.speed) * Math.min(1, dt * 1.6);
    if (state.animate || state.animMix > 0.002) state.phase += dt;

    if (state.speed > 0.002) {
      state.drive += state.speed * dt;
      for (const belt of v.belts) belt.update(-state.drive);
      for (const s of v.spinners) s.part.group.rotation.x = (state.drive / s.radius) % (Math.PI * 2);
    }

    const mix = state.animMix;
    v.turret.rotation.y = Math.sin(state.phase * 0.36) * 0.6 * mix;
    v.gun.rotation.x = -(0.02 + Math.sin(state.phase * 0.52) * 0.075) * mix;
    v.hull.position.y = Math.sin(state.phase * 7.1) * 0.012 * mix;
    v.hull.rotation.x = Math.sin(state.phase * 5.3) * 0.005 * mix;
  }

  resolveHover();
  rig.update(dt);
  renderer.render(scene, camera);
  if (state.leaders) callouts.update(window.innerWidth, window.innerHeight, safeBand());

  telemetryClock += dt;
  if (telemetryClock > 0.1) {
    telemetryClock = 0;
    const t = rig.telemetry;
    tm.az.textContent = `${t.azimuth.toFixed(1)}°`;
    tm.el.textContent = `${t.elevation.toFixed(1)}°`;
    tm.zoom.textContent = `${t.zoom.toFixed(2)} m`;
    tm.explode.textContent = `${Math.round(state.explode * 100)}%`;
    tm.read.textContent = `${Math.round(state.explode * 100)}%`;
    tm.track.textContent = `${state.drive.toFixed(1)} m`;
    tm.frames.textContent = `${state.frames} · ${Math.round(fps)} FPS`;
    tm.mode.textContent = state.cutaway
      ? 'MODE CUTAWAY'
      : state.animate
        ? 'MODE ANIMATE'
        : state.explode > 0.02
          ? `MODE EXPLODE ${Math.round(state.explode * 100)}%`
          : 'MODE STATIC';
    tm.hint.textContent = t.auto ? 'AUTO-ORBIT / DRAG TO TAKE OVER' : 'FREE / DRAG TO ORBIT';
  }

  requestAnimationFrame(frame);
}

// Debug handle for measuring the drawing from the console or a test harness.
window.__ATLAS__ = {
  state,
  scene,
  camera,
  rig,
  select: (id) => selectVehicle(VEHICLES.find((v) => v.id === id)),
  bounds(id) {
    const target = id ? state.vehicle.selectables.find((p) => p.id === id).group : state.vehicle.root;
    target.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(target);
    return { min: b.min.toArray(), max: b.max.toArray(), size: b.getSize(new THREE.Vector3()).toArray() };
  },
  ids: () => state.vehicle.selectables.map((p) => p.id),
};

selectVehicle(VEHICLES[0]).then(() => {
  requestAnimationFrame((t) => {
    last = t;
    frame(t);
    const boot = $('#boot');
    boot.classList.add('is-done');
    setTimeout(() => boot.remove(), 600);
  });
});
