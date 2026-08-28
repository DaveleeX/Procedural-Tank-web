/**
 * Turn a free-text prompt into either an existing atlas vehicle or a generated spec.
 */
import { CATALOG, CATALOG_BY_ID, COUNTRY_ALIASES, COUNTRY_QUEUE, NATIONS } from './catalog.js';

const FAMILY_BY_NATION = {
  us: 'abrams',
  de: 'leopard',
  cn: 'chinese',
  ru: 'soviet',
  su: 'slope',
  uk: 'challenger',
  fr: 'leclerc',
  il: 'merkava',
  kr: 'leopard',
  jp: 'leclerc',
  it: 'leopard',
  in: 'challenger',
  se: 'leopard',
  ua: 'soviet',
  pl: 'soviet',
  tr: 'leopard',
};

export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[「」『』“”‘’"'.,，。、/／()（）[\]【】]/g, '')
    .replace(/式主战坦克|主战坦克|轻型坦克|重型坦克|中型坦克|坦克|tank|mbt/gi, '')
    .replace(/[\s\-_.·•第号的款台辆]/g, '')
    .trim();
}

function aliasIndex() {
  const map = new Map();
  for (const item of CATALOG) {
    const keys = [item.id, item.name, item.nameCn, ...(item.aliases || [])]
      .filter(Boolean)
      .map(normalize)
      .filter(Boolean);
    for (const key of keys) {
      if (!map.has(key)) map.set(key, item);
    }
  }
  return map;
}

const ALIASES = aliasIndex();

function detectNation(raw, compact) {
  const lower = raw.toLowerCase();
  for (const row of COUNTRY_ALIASES) {
    if (row.keys.some((k) => compact.includes(normalize(k)) || lower.includes(k))) return row.nation;
  }
  return null;
}

function matchExisting(compact, existing) {
  for (const meta of existing) {
    const keys = [meta.id, meta.name, meta.nameCn, meta.prefix]
      .filter(Boolean)
      .map(normalize);
    if (keys.includes(compact)) return meta;
    if (compact && keys.some((k) => k && (k.includes(compact) || compact.includes(k)) && Math.min(k.length, compact.length) >= 3)) {
      return meta;
    }
  }
  return null;
}

function matchCatalog(compact) {
  if (ALIASES.has(compact)) return ALIASES.get(compact);
  let best = null;
  let bestLen = 0;
  for (const [key, item] of ALIASES) {
    if (!key || key.length < 3) continue;
    if (compact.includes(key) || key.includes(compact)) {
      if (key.length > bestLen) {
        best = item;
        bestLen = key.length;
      }
    }
  }
  return best;
}

function usedIds(existing) {
  const ids = new Set(existing.map((v) => v.gen?.id || v.id));
  for (const v of existing) {
    if (v.id) ids.add(v.id);
  }
  return ids;
}

function pickCountryTank(nation, existing) {
  const used = usedIds(existing);
  const queue = COUNTRY_QUEUE[nation] || [];
  for (const id of queue) {
    const item = CATALOG_BY_ID.get(id);
    if (!item) continue;
    if (item.atlasId && existing.some((v) => v.id === item.atlasId)) continue;
    if (used.has(item.id) || existing.some((v) => v.gen?.id === item.id)) continue;
    return item;
  }
  return null;
}

function slug(text) {
  const compact = normalize(text).replace(/[^\w\u4e00-\u9fff]/g, '');
  return (compact || 'custom').slice(0, 24);
}

function hasCJK(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

function detectFamily(raw, nation) {
  const t = raw.toLowerCase();
  if (/阿玛塔|armata|无人炮塔/.test(t)) return 'armata';
  if (/梅卡瓦|merkava/.test(t)) return 'merkava';
  if (/虎|tiger|sherman|谢尔曼|panzer|二战|ww2|wwii/.test(t)) return 'wwii';
  if (/t-?3[4-5]|t-?5[45]|59式|chris/.test(t)) return 'slope';
  if (/t-?7[24]|t-?80|t-?90|soviet|俄|苏/.test(t)) return 'soviet';
  if (/99|96|ztz|type9/.test(t)) return 'chinese';
  if (/豹2|leopard/.test(t)) return 'leopard';
  if (/艾布拉姆|abrams|m1/.test(t)) return 'abrams';
  if (/轻型|light tank/.test(t)) return 'light';
  return FAMILY_BY_NATION[nation] || 'abrams';
}

function synthesize(raw, nation) {
  const fam = detectFamily(raw, nation || 'us');
  const n = nation || 'us';
  const label = raw.trim();
  const wwii = fam === 'wwii' || fam === 'slope';
  return {
    id: `custom-${slug(label)}`,
    nation: n,
    family: fam,
    prefix: slug(label).slice(0, 6).toUpperCase() || 'GEN',
    name: hasCJK(label) ? label.toUpperCase() : label.toUpperCase(),
    nameCn: hasCJK(label) ? label : label,
    designation: 'PROCEDURAL · INFERRED FROM TEXT',
    mass: wwii ? '40 t' : '55 t',
    crew: fam === 'soviet' || fam === 'chinese' || fam === 'leclerc' || fam === 'armata' || fam === 'light' ? '3' : '4',
    powerpack: fam === 'abrams' ? 'GAS TURBINE · 1500 hp' : 'DIESEL · 1200 hp',
    armament: wwii ? 'MAIN GUN (INFERRED)' : '120 mm CLASS MAIN GUN',
    armour: 'COMPOSITE / RHA — SCHEMATIC',
    envelope: '9.50 × 3.60 × 2.50 m',
    barrelLength: wwii ? 4.2 : 4.8,
    wheelCount: fam === 'slope' ? 5 : fam === 'light' ? 6 : 7,
    features: {
      diesel: fam !== 'abrams',
      gasTurbine: fam === 'abrams',
      carousel: fam === 'soviet' || fam === 'chinese',
      bustleAuto: fam === 'leclerc' || fam === 'armata' || fam === 'light',
      era: fam === 'soviet' || fam === 'chinese',
      peri: fam === 'leopard' || fam === 'leclerc',
      inferred: true,
    },
    inferred: true,
    structure: [
      ['Procedural reconstruction from a text prompt', '由文字描述程序化生成'],
      ['Family template infers silhouette and internals', '族谱模板推断轮廓与内部布置'],
      ['Not a measured drawing — treat as schematic', '不是实测图纸，仅作示意'],
    ],
    texture: [
      ['Blueprint ink, no camouflage', '蓝图墨线，无迷彩'],
      ['Inferred from national school', '按国别设计学派推断'],
    ],
  };
}

function uniqueId(base, existing) {
  const used = usedIds(existing);
  if (!used.has(base) && !existing.some((v) => v.id === base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`) || existing.some((v) => v.id === `${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function specToMeta(spec, existing) {
  const nation = NATIONS[spec.nation] || NATIONS.us;
  const id = uniqueId(spec.atlasId ? spec.id : `gen-${spec.id}`, existing);
  const inferred = !!(spec.inferred || spec.features?.inferred);
  const texture = spec.texture || [
    ['National blueprint ink', '国别蓝图配色'],
    ['Schematic hidden-line drawing', '示意性隐藏线图纸'],
  ];
  return {
    id,
    prefix: spec.prefix || spec.id.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase() || 'GEN',
    flag: nation.flag,
    country: nation.country,
    countryCn: nation.countryCn,
    name: spec.name,
    nameCn: spec.nameCn,
    designation: spec.designation,
    ink: nation.ink,
    accent: nation.accent,
    sheet: nation.sheet,
    specs: [
      ['CLASSIFICATION', spec.mass ? `MAIN BATTLE TANK · ${spec.mass}` : 'MAIN BATTLE TANK'],
      ['CREW', spec.crew || '—'],
      ['POWERPACK', spec.powerpack || '—'],
      ['ARMAMENT', spec.armament || '—'],
      ['ARMOUR', spec.armour || '—'],
      ['ENVELOPE', spec.envelope || '—'],
    ],
    structure: spec.structure || [['Procedural geometry', '程序化几何']],
    texture,
    generated: true,
    inferred,
    gen: spec,
    load: async () => {
      const { buildGenerated, calloutsFor } = await import('./builder.js');
      return { build: buildGenerated, CALLOUTS: calloutsFor(spec) };
    },
  };
}

/**
 * @param {string} raw
 * @param {object[]} existing registry list
 * @returns {{ ok: false, error: string } | { ok: true, kind: 'existing', meta: object } | { ok: true, kind: 'generated', meta: object }}
 */
export function resolvePrompt(raw, existing) {
  const text = String(raw || '').trim();
  if (!text) return { ok: false, error: '请输入坦克名称，例如 M60、梅卡瓦、T-14' };

  const compact = normalize(text);
  const existingHit = matchExisting(compact, existing);
  if (existingHit) return { ok: true, kind: 'existing', meta: existingHit };

  const catalogHit = matchCatalog(compact);
  if (catalogHit) {
    if (catalogHit.atlasId) {
      const meta = existing.find((v) => v.id === catalogHit.atlasId);
      if (meta) return { ok: true, kind: 'existing', meta };
    }
    const already = existing.find((v) => v.gen?.id === catalogHit.id);
    if (already) return { ok: true, kind: 'existing', meta: already };
    return { ok: true, kind: 'generated', meta: specToMeta(catalogHit, existing) };
  }

  const nation = detectNation(text, compact);
  const vague = !compact || compact.length < 4 || /某|some|任意|随便|一辆|一台/.test(text);
  if (nation && (vague || compact === normalize(COUNTRY_ALIASES.find((r) => r.nation === nation)?.keys[0] || ''))) {
    const pick = pickCountryTank(nation, existing);
    if (pick) {
      if (pick.atlasId) {
        const meta = existing.find((v) => v.id === pick.atlasId);
        if (meta) return { ok: true, kind: 'existing', meta };
      }
      return { ok: true, kind: 'generated', meta: specToMeta(pick, existing) };
    }
  }

  if (nation) {
    const pick = pickCountryTank(nation, existing);
    if (pick && vague) return { ok: true, kind: 'generated', meta: specToMeta(pick, existing) };
  }

  return { ok: true, kind: 'generated', meta: specToMeta(synthesize(text, nation), existing) };
}
