/**
 * Flat demo illustrations, drawn as 320×320 SVG. One small template per kind of thing
 * (curry bowl, bottle, phone…); `artFor` picks a template from the item's name/category.
 * These stand in for product photos — drop a real photo with the same file name to replace one.
 */

export interface ArtInput {
  name: string;
  category: string;
  /** Category colour (hex), used for the backdrop tint. */
  color: string;
  /** Fashion variant colour name, if any. */
  variant?: string;
}

type Art = () => string;

// ───────── helpers ─────────
const P = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const E = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const C = (cx: number, cy: number, r: number, fill: string, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const R = (x: number, y: number, w: number, h: number, rx: number, fill: string, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const T = (x: number, y: number, text: string, size: number, fill: string, extra = '') =>
  `<text x="${x}" y="${y}" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="${size}" font-weight="800" fill="${fill}" text-anchor="middle" ${extra}>${esc(text)}</text>`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let gid = 0;
const defs: string[] = [];
/** Vertical linear gradient; returns url(#id). */
function lg(a: string, b: string, horizontal = false): string {
  const id = `g${gid++}`;
  defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${horizontal ? 1 : 0}" y2="${horizontal ? 0 : 1}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`);
  return `url(#${id})`;
}
function rg(a: string, b: string, cx = 0.4, cy = 0.35): string {
  const id = `g${gid++}`;
  defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="0.75"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`);
  return `url(#${id})`;
}

/** Deterministic pseudo-random from a string, for scatter (grains, garnish). */
function seeded(s: string) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
const lighten = (c: string, t: number) => mix(c, '#ffffff', t);
const darken = (c: string, t: number) => mix(c, '#000000', t);

const shadow = (cx = 160, cy = 272, rx = 104, ry = 14) => E(cx, cy, rx, ry, '#000', 'opacity=".12"');

const VARIANT: Record<string, string> = {
  Blue: '#4c7bd9', White: '#f1f1ee', Khaki: '#c3a878', Navy: '#26345a', Black: '#2b2b2e', Olive: '#6b7139', Grey: '#8d9096',
  Indigo: '#3a5683', Maroon: '#7b2032', Mustard: '#d2a12a', Peach: '#f3a98c', Teal: '#1f8a8a', Beige: '#dccaa8', Brown: '#7a4b2a',
  Red: '#c0262d', Green: '#2e7d4f',
};

// ───────── food ─────────
function plate(cy = 236, rx = 124, ry = 34) {
  return E(160, cy + 6, rx, ry, '#d9dce1') + E(160, cy, rx, ry, lg('#ffffff', '#eef0f3')) + E(160, cy - 2, rx * 0.74, ry * 0.7, '#f6f7f9');
}

function bowl(top: string, opts: { rim?: string; body?: string; cy?: number; rx?: number } = {}) {
  const cy = opts.cy ?? 150;
  const rx = opts.rx ?? 112;
  const body = opts.body ?? '#f5f1ea';
  return (
    shadow(160, 262, rx * 0.9, 14) +
    P(`M${160 - rx} ${cy} Q ${160 - rx + 6} ${cy + 108} 160 ${cy + 112} Q ${160 + rx - 6} ${cy + 108} ${160 + rx} ${cy} Z`, lg(body, darken(body, 0.14))) +
    E(160, cy, rx, rx * 0.34, opts.rim ?? lighten(body, 0.4)) +
    E(160, cy + 2, rx - 9, rx * 0.34 - 7, top)
  );
}

function scatter(seed: string, n: number, cx: number, cy: number, rx: number, ry: number, draw: (x: number, y: number, r: () => number, i: number) => string) {
  const r = seeded(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    out += draw(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, r, i);
  }
  return out;
}

const leaf = (x: number, y: number, r: () => number) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.6" fill="#3f8f3a" transform="rotate(${Math.round(r() * 180)} ${x} ${y})"/>`;

function curry(seed: string, gravy: string, garnish: 'cream' | 'leaf' | 'cubes' | 'veg' | 'meat' | 'butter') {
  let top = bowl(rg(lighten(gravy, 0.25), darken(gravy, 0.12)));
  if (garnish === 'cubes') top += scatter(seed, 9, 160, 152, 66, 18, (x, y) => R(x - 9, y - 7, 18, 14, 3, '#fbf3df', 'stroke="#e8d3a6" stroke-width="1.5"'));
  if (garnish === 'meat') top += scatter(seed, 8, 160, 152, 66, 18, (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="${11 + r() * 4}" ry="7" fill="${darken(gravy, 0.28)}" opacity=".85"/>`);
  if (garnish === 'veg') top += scatter(seed, 14, 160, 152, 70, 18, (x, y, r, i) => R(x - 6, y - 4, 12, 8, 2, ['#3d9a3d', '#e8a521', '#e8ecd8', '#d64532'][i % 4]!, `transform="rotate(${Math.round(r() * 90)} ${x} ${y})"`));
  if (garnish === 'cream' || garnish === 'butter') top += `<path d="M118 150 q20 -16 42 0 t42 0" fill="none" stroke="#fff8ea" stroke-width="7" stroke-linecap="round" opacity=".9"/>`;
  if (garnish === 'butter') top += R(150, 140, 20, 14, 3, '#ffe27a');
  top += scatter(seed + 'l', 7, 160, 150, 70, 18, leaf);
  return top;
}

function riceBowl(seed: string, base: string, accents: string[], density = 120) {
  let s = bowl('#efe7d6', { cy: 168 });
  s += P('M62 168 Q 70 96 160 90 Q 250 96 258 168 Z', lighten(base, 0.2));
  s += scatter(seed, density, 160, 136, 88, 34, (x, y, r, i) => {
    const c = accents.length && i % 4 === 0 ? accents[i % accents.length]! : i % 3 ? '#fffdf6' : base;
    return y < 168 && Math.abs(x - 160) < 96 - Math.max(0, 128 - y) * 0.2 ? `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="1.8" fill="${c}" transform="rotate(${Math.round(r() * 180)} ${x} ${y})"/>` : '';
  });
  s += scatter(seed + 'l', 5, 160, 122, 60, 16, leaf);
  return s;
}

function bread(kind: 'naan' | 'roti' | 'parotta', seed: string, garlic = false) {
  let s = shadow(160, 262, 112, 12) + plate(232);
  if (kind === 'parotta') {
    s += E(160, 196, 104, 52, '#e3b56a') + E(160, 192, 100, 48, rg('#f6d9a0', '#dca456'));
    for (let i = 0; i < 5; i++) s += E(160, 192, 92 - i * 18, 44 - i * 9, 'none', 'stroke="#c88f40" stroke-width="2.5" opacity=".7"');
    return s;
  }
  const [a, b] = kind === 'roti' ? ['#dcb27a', '#b9844a'] : ['#f6dfae', '#e1b06a'];
  s += kind === 'roti' ? E(160, 194, 100, 48, rg(a, b)) : P('M62 196 Q 70 150 150 146 Q 250 140 262 190 Q 252 238 160 240 Q 66 240 62 196 Z', rg(a, b));
  s += scatter(seed, 22, 160, 192, 80, 34, (x, y, r) => E(x, y, 4 + r() * 7, 3 + r() * 4, darken(b, 0.25), 'opacity=".55"'));
  if (kind === 'naan') s += P('M90 186 q30 -20 70 -10 t70 6', 'none', 'stroke="#fff3c8" stroke-width="8" stroke-linecap="round" opacity=".7"');
  if (garlic) s += scatter(seed + 'g', 16, 160, 192, 76, 30, (x, y, r, i) => (i % 2 ? leaf(x, y, r) : E(x, y, 3, 2.4, '#fff7e6')));
  return s;
}

function skewer(seed: string, piece: string, kind: 'cubes' | 'patties' | 'drumsticks') {
  let s = shadow() + plate(232);
  if (kind === 'patties') {
    for (const [x, y] of [[112, 196], [162, 186], [210, 200], [138, 220], [188, 222]] as const) s += E(x, y + 6, 30, 14, darken(piece, 0.35)) + E(x, y, 30, 14, rg(lighten(piece, 0.2), darken(piece, 0.15)));
    s += scatter(seed, 6, 160, 200, 90, 24, leaf) + P('M232 228 l26 -14 l6 12 z', '#f2e14a');
    return s;
  }
  if (kind === 'drumsticks') {
    for (const [x, y, rot] of [[120, 194, -18], [196, 190, 22], [160, 214, 0]] as const)
      s += `<g transform="rotate(${rot} ${x} ${y})">${R(x + 30, y - 4, 34, 8, 4, '#f6ecd8')}${C(x + 66, y - 4, 7, '#f6ecd8')}${C(x + 66, y + 4, 7, '#f6ecd8')}${E(x, y, 42, 24, rg(lighten(piece, 0.15), darken(piece, 0.3)))}</g>`;
    s += P('M78 226 q20 -10 40 0', 'none', 'stroke="#c9d6a6" stroke-width="5"') + C(240, 226, 12, '#f2e14a') + C(240, 226, 7, '#f8ef9e');
    return s;
  }
  s += `<line x1="40" y1="210" x2="282" y2="168" stroke="#9a7650" stroke-width="5" stroke-linecap="round"/>`;
  const pieces = [piece, '#3c9a3c', piece, '#d84a2e', piece, '#f4e6c8', piece];
  pieces.forEach((c, i) => {
    const x = 74 + i * 30;
    const y = 204 - i * 5.2;
    s += R(x - 14, y - 16, 28, 30, 5, darken(c, 0.25)) + R(x - 14, y - 18, 28, 28, 5, rg(lighten(c, 0.2), c));
    if (c === piece) s += P(`M${x - 10} ${y - 14} l6 0 M${x + 2} ${y + 4} l7 0`, 'none', `stroke="${darken(piece, 0.5)}" stroke-width="3" stroke-linecap="round"`);
  });
  return s + scatter(seed, 5, 160, 226, 80, 10, leaf);
}

function friedPile(seed: string, color: string, shape: 'chunks' | 'balls' | 'fillet') {
  let s = shadow() + plate(232);
  const r = seeded(seed);
  const spots = shape === 'balls' ? [[124, 196], [190, 196], [158, 176], [156, 214]] : [[110, 204], [150, 210], [196, 206], [128, 182], [176, 180], [216, 188], [156, 160], [102, 186]];
  for (const [x, y] of spots) {
    if (shape === 'balls') s += C(x!, y!, 30, rg(lighten(color, 0.3), darken(color, 0.2))) + scatter(seed + x, 8, x!, y!, 22, 22, (a, b) => C(a, b, 2, darken(color, 0.35), 'opacity=".6"'));
    else {
      const w = shape === 'fillet' ? 34 : 24 + r() * 8;
      s += `<path d="M${x! - w} ${y} q${w * 0.3} -${w * 0.9} ${w} -${w * 0.6} q${w * 0.9} 0 ${w} ${w * 0.5} q-${w * 0.2} ${w * 0.7} -${w} ${w * 0.6} q-${w * 0.8} 0 -${w} -${w * 0.5} z" fill="${rg(lighten(color, 0.25), darken(color, 0.2))}"/>`;
    }
  }
  s += scatter(seed + 'c', 9, 160, 186, 80, 30, (x, y, rr) => (rr() > 0.5 ? leaf(x, y, rr) : `<rect x="${x}" y="${y}" width="6" height="2.4" fill="#e8483a" transform="rotate(${Math.round(rr() * 180)} ${x} ${y})"/>`));
  s += `<g>${E(244, 228, 18, 10, '#c8d94a')}${E(244, 226, 14, 7, '#eef59a')}</g>` + E(84, 230, 16, 8, 'none', 'stroke="#d8a8d2" stroke-width="4"');
  return s;
}

function steak() {
  return (
    shadow() + plate(232) +
    P('M76 206 Q 72 156 130 150 Q 200 140 214 176 Q 226 222 156 234 Q 86 240 76 206 Z', rg('#9a4a2c', '#5a2414')) +
    P('M96 168 l100 28 M92 190 l100 28 M110 156 l100 28', 'none', 'stroke="#2e120a" stroke-width="5" opacity=".55"') +
    E(232, 200, 38, 26, rg('#fff7da', '#efd893')) + C(236, 192, 8, '#ffe27a') +
    P('M110 156 Q 150 140 196 158', 'none', 'stroke="#d27a52" stroke-width="3" opacity=".7"') +
    `<g>${[0, 1, 2].map((i) => `<path d="M${220 + i * 10} 232 q6 -16 2 -26" stroke="#3f8f3a" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('')}</g>`
  );
}

function thali(seed: string, nonveg: boolean) {
  let s = shadow(160, 270, 128, 14) + E(160, 196, 140, 66, '#b9bcc2') + E(160, 192, 138, 64, lg('#eef0f3', '#c9ccd2')) + E(160, 192, 124, 56, lg('#dfe2e6', '#f4f5f7'));
  const k = (x: number, y: number, c: string, extra = '') => E(x, y + 4, 26, 13, '#a9adb4') + E(x, y, 26, 13, '#e9ebee') + E(x, y + 1, 21, 10, c) + extra;
  s += k(98, 166, nonveg ? '#d9622b' : '#e88b2a') + k(150, 152, '#e2b13a') + k(204, 158, '#5d9b3a') + k(234, 196, '#7a3b1e');
  s += P('M84 202 Q 120 180 172 206 Q 140 236 92 226 Z', '#fffaf0') + scatter(seed, 30, 128, 210, 34, 12, (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="1.4" fill="#f1e8d2" transform="rotate(${Math.round(r() * 180)} ${x} ${y})"/>`);
  s += E(190, 222, 30, 14, rg('#f2d79c', '#d4a35a')) + C(160, 236, 9, '#7a2c14');
  return s;
}

function cup(kind: 'tumbler' | 'chai') {
  if (kind === 'tumbler')
    return (
      shadow(160, 270, 96, 12) +
      E(160, 248, 92, 22, lg('#c7ccd3', '#8f96a0')) + P('M76 210 L 244 210 L 236 250 Q 160 268 84 250 Z', lg('#e6e9ed', '#9aa1ab', true)) + E(160, 210, 84, 18, '#d4d8de') +
      P('M110 92 L 210 92 L 200 216 Q 160 226 120 216 Z', lg('#f1f3f6', '#a2a9b3', true)) + E(160, 92, 50, 12, '#cfd3d9') + E(160, 93, 44, 9, rg('#d7a777', '#8a5a33')) +
      P('M150 70 q-10 -14 2 -26 M170 70 q10 -14 -2 -26', 'none', 'stroke="#fff" stroke-width="4" opacity=".7" stroke-linecap="round"')
    );
  return (
    shadow(160, 266, 70, 10) +
    P('M106 110 L 214 110 L 200 256 Q 160 266 120 256 Z', 'rgba(255,255,255,.45)', 'stroke="#d8dde3" stroke-width="3"') +
    P('M112 128 L 208 128 L 200 252 Q 160 262 120 252 Z', lg('#d9a974', '#a8693a')) + E(160, 128, 48, 9, '#e4bf92') + E(160, 110, 54, 10, 'none', 'stroke="#e1e5ea" stroke-width="3"') +
    P('M136 92 q-10 -14 2 -26 M160 88 q10 -14 -2 -26 M184 92 q-10 -14 2 -26', 'none', 'stroke="#fff" stroke-width="4" opacity=".7" stroke-linecap="round"')
  );
}

function tallGlass(liquid: string, topping: 'lime' | 'cream' | 'mint' | 'none', ice: boolean) {
  let s = shadow(160, 270, 70, 10);
  s += P('M104 70 L 216 70 L 204 258 Q 160 268 116 258 Z', 'rgba(255,255,255,.5)', 'stroke="#d8dde3" stroke-width="3"');
  s += P('M110 104 L 210 104 L 203 254 Q 160 263 117 254 Z', lg(lighten(liquid, 0.15), darken(liquid, 0.1)));
  s += E(160, 104, 50, 8, lighten(liquid, 0.3));
  if (ice) s += [[136, 140], [176, 128], [158, 178]].map(([x, y]) => R(x!, y!, 24, 22, 5, 'rgba(255,255,255,.55)', `transform="rotate(14 ${x} ${y})"`)).join('');
  if (topping === 'cream') s += C(148, 96, 22, '#fffaf0') + C(174, 92, 20, '#fff6e2') + C(160, 80, 16, '#fffdf8');
  if (topping === 'lime') s += C(212, 78, 28, '#7fb83a') + C(212, 78, 23, '#d9ef9e') + P('M212 56 v44 M190 78 h44 M196 62 l32 32 M228 62 l-32 32', 'none', 'stroke="#a6cf5c" stroke-width="2"');
  if (topping === 'mint') s += scatter('m', 6, 160, 98, 30, 6, leaf);
  s += `<line x1="186" y1="40" x2="172" y2="240" stroke="${topping === 'lime' ? '#2c9e58' : '#e14b5a'}" stroke-width="7" stroke-linecap="round"/>`;
  s += P('M116 84 L 122 240', 'none', 'stroke="#fff" stroke-width="6" opacity=".45" stroke-linecap="round"');
  return s;
}

function dessertBowl(seed: string, kind: 'jamun' | 'rasmalai' | 'payasam') {
  if (kind === 'jamun') {
    let s = bowl(rg('#e9b25a', '#b8742a'), { body: '#f4ede4' });
    for (const [x, y] of [[132, 146], [188, 146]] as const) s += C(x, y, 30, rg('#9c4a24', '#4a1a0a', 0.35, 0.3)) + E(x - 9, y - 12, 8, 5, '#fff', 'opacity=".35"');
    return s + scatter(seed, 6, 160, 156, 70, 14, (x, y) => R(x, y, 6, 3, 1, '#7dbb4f'));
  }
  if (kind === 'rasmalai') {
    let s = bowl(rg('#fbe3a3', '#efc56a'), { body: '#f4ede4' });
    for (const [x, y] of [[124, 150], [196, 150], [160, 140]] as const) s += E(x, y + 3, 28, 13, '#e3d4b6') + E(x, y, 28, 12, rg('#fffdf6', '#efe4cd'));
    return s + scatter(seed, 14, 160, 150, 74, 16, (x, y, r, i) => R(x, y, 6, 3, 1, i % 2 ? '#7dbb4f' : '#e9892a', `transform="rotate(${Math.round(r() * 180)} ${x} ${y})"`));
  }
  let s = bowl(rg('#f6ead0', '#e5cf9e'), { body: '#c79a62', rim: '#b98a52' });
  s += scatter(seed, 18, 160, 152, 72, 18, (x, y, r) => R(x, y, 10, 4, 2, '#fffef8', `transform="rotate(${Math.round(r() * 180)} ${x} ${y})"`));
  return s + scatter(seed + 'n', 8, 160, 150, 60, 14, (x, y) => E(x, y, 4, 3, '#c98b3a'));
}

function brownie() {
  return (
    shadow() + plate(232) +
    P('M78 186 L 150 160 L 236 178 L 236 222 L 162 246 L 78 228 Z', '#3c1d10') + P('M78 186 L 150 160 L 236 178 L 162 204 Z', rg('#6e3a20', '#4a2210')) +
    P('M162 204 L 162 246', 'none', 'stroke="#2a1208" stroke-width="2"') +
    C(196, 150, 34, rg('#fffdf4', '#efe3c4')) + P('M168 168 q28 18 58 0', 'none', 'stroke="#e9dcb9" stroke-width="4"') +
    P('M160 128 q20 20 30 40 q10 -24 34 -30', 'none', 'stroke="#5a2a14" stroke-width="6" stroke-linecap="round" opacity=".85"') + E(226, 126, 6, 9, '#3f8f3a', 'transform="rotate(30 226 126)"')
  );
}

function waterBottle(label: string) {
  return bottle({ liquid: '#cfe9f7', cap: '#2a6fd6', label: '#2a6fd6', text: label, shape: 'pet', glassy: true });
}

// ───────── packaged goods ─────────
interface BottleOpts { liquid: string; cap: string; label: string; text: string; shape: 'oil' | 'pet' | 'shampoo' | 'cleaner' | 'pump' | 'syrup' | 'jar' | 'spray' | 'small'; glassy?: boolean }
function bottle(o: BottleOpts) {
  let s = shadow(160, 270, 70, 10);
  const labelText = (y: number, w = 100) => R(160 - w / 2, y, w, 52, 6, o.label) + T(160, y + 34, o.text, o.text.length > 7 ? 15 : 19, '#fff');
  switch (o.shape) {
    case 'oil':
      s += P('M112 120 Q 112 96 140 86 L 140 60 L 180 60 L 180 86 Q 208 96 208 120 L 208 254 Q 160 266 112 254 Z', lg(lighten(o.liquid, 0.2), o.liquid, true), 'opacity=".95"');
      s += R(136, 40, 48, 24, 6, o.cap) + labelText(150);
      break;
    case 'pet':
      s += P('M118 112 Q 118 86 144 80 L 144 58 L 176 58 L 176 80 Q 202 86 202 112 L 202 150 Q 194 160 202 170 L 202 254 Q 160 264 118 254 L 118 170 Q 126 160 118 150 Z', lg(lighten(o.liquid, 0.25), o.liquid, true), o.glassy ? 'opacity=".9"' : '');
      s += R(140, 40, 40, 22, 5, o.cap) + labelText(176, 84);
      break;
    case 'shampoo':
    case 'pump':
      s += R(110, 104, 100, 156, 28, lg(lighten(o.liquid, 0.25), o.liquid, true));
      s += o.shape === 'pump' ? R(146, 70, 28, 36, 4, o.cap) + R(150, 54, 50, 14, 5, o.cap) : R(130, 82, 60, 26, 10, o.cap);
      s += labelText(150, 84);
      break;
    case 'cleaner':
      s += P('M108 110 Q 108 84 150 80 L 150 54 L 182 54 L 182 80 Q 214 90 212 120 L 212 256 Q 160 266 108 256 Z', lg(lighten(o.liquid, 0.2), o.liquid, true));
      s += R(146, 34, 40, 24, 5, o.cap) + P('M182 40 l26 -8 l0 12 z', o.cap) + labelText(146);
      break;
    case 'syrup':
      s += R(118, 96, 84, 164, 14, lg('#9a5a2a', '#5a2e10', true)) + R(140, 62, 40, 36, 5, o.cap) + labelText(150, 76);
      break;
    case 'spray':
      s += R(124, 92, 72, 170, 14, lg(lighten(o.liquid, 0.25), o.liquid, true)) + R(140, 60, 40, 34, 6, o.cap) + R(170, 66, 26, 8, 3, '#e6e8eb') + labelText(150, 72);
      break;
    case 'small':
      s += R(130, 130, 60, 132, 12, lg(lighten(o.liquid, 0.25), o.liquid, true)) + R(140, 100, 40, 32, 5, o.cap) + R(130, 170, 60, 50, 4, o.label) + T(160, 202, o.text, 13, '#fff');
      break;
    case 'jar':
      s += R(100, 112, 120, 150, 26, lg(lighten(o.liquid, 0.15), o.liquid, true)) + R(96, 82, 128, 36, 8, o.cap) + labelText(164, 110);
      break;
  }
  return s + P('M126 130 L 126 236', 'none', 'stroke="#fff" stroke-width="6" opacity=".3" stroke-linecap="round"');
}

function box3d(front: string, text: string, opts: { w?: number; h?: number; sub?: string; band?: string } = {}) {
  const w = opts.w ?? 140;
  const h = opts.h ?? 160;
  const x = 160 - w / 2 - 12;
  const y = 262 - h;
  return (
    shadow(166, 268, w * 0.7, 12) +
    P(`M${x + w} ${y} l24 -18 l0 ${h} l-24 18 z`, darken(front, 0.25)) +
    P(`M${x} ${y} l24 -18 l${w} 0 l-24 18 z`, lighten(front, 0.2)) +
    R(x, y, w, h, 2, lg(lighten(front, 0.08), darken(front, 0.06))) +
    (opts.band ? R(x, y + h * 0.58, w, h * 0.2, 0, opts.band) : '') +
    T(x + w / 2, y + h * 0.42, text, text.length > 8 ? 17 : 22, '#fff') +
    (opts.sub ? T(x + w / 2, y + h * 0.72, opts.sub, 12, '#fff', 'opacity=".85"') : '')
  );
}

function pouch(color: string, text: string, fill = '#ffffff') {
  return (
    shadow(160, 268, 90, 12) +
    P('M88 84 L 232 84 L 236 96 Q 250 170 236 254 L 84 254 Q 70 170 84 96 Z', lg(fill, darken(fill, 0.1), true)) +
    R(88, 70, 144, 20, 3, darken(fill, 0.05)) + P('M84 150 Q 160 132 236 150 L 238 210 Q 160 226 82 210 Z', color) +
    T(160, 188, text, 22, '#fff') + P('M96 104 Q 92 180 98 240', 'none', 'stroke="#fff" stroke-width="7" opacity=".5" stroke-linecap="round"')
  );
}

function chipPacket(color: string, text: string, accent = '#ffd23f') {
  return (
    shadow(160, 270, 84, 12) +
    P('M92 70 L 228 70 L 226 82 Q 244 170 226 258 L 228 268 L 92 268 L 94 258 Q 76 170 94 82 Z', lg(lighten(color, 0.15), darken(color, 0.1), true)) +
    P('M92 70 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 z', darken(color, 0.15)) +
    C(160, 200, 40, accent) + E(146, 196, 16, 10, '#f3c86a', 'transform="rotate(-20 146 196)"') + E(172, 206, 15, 9, '#e9b450', 'transform="rotate(24 172 206)"') +
    T(160, 134, text, text.length > 7 ? 18 : 24, '#fff')
  );
}

function sack(color: string, text: string, grain: string) {
  return (
    shadow(160, 270, 100, 12) +
    P('M86 92 Q 78 80 96 74 L 224 74 Q 242 80 234 92 Q 254 180 236 256 Q 160 272 84 256 Q 66 180 86 92 Z', lg('#f8f3e6', '#e4dac2', true)) +
    P('M94 74 q8 -14 16 0 q8 -14 16 0 q8 -14 16 0 q8 -14 16 0 q8 -14 16 0 q8 -14 16 0 q8 -14 16 0 q8 -14 16 0', 'none', 'stroke="#d8ccae" stroke-width="3"') +
    R(92, 126, 136, 66, 8, color) + T(160, 168, text, text.length > 8 ? 17 : 22, '#fff') +
    scatter(text, 30, 160, 226, 50, 14, (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2" fill="${grain}" transform="rotate(${Math.round(r() * 180)} ${x} ${y})"/>`)
  );
}

function tub(color: string, text: string) {
  return (
    shadow(160, 268, 86, 12) +
    P('M88 112 L 232 112 L 218 256 Q 160 266 102 256 Z', lg('#ffffff', '#e4e7eb', true)) +
    E(160, 112, 72, 18, color) + E(160, 108, 72, 18, lighten(color, 0.2)) +
    P('M96 156 L 224 156 L 219 206 L 101 206 Z', color) + T(160, 188, text, 20, '#fff')
  );
}

function block(wrap: string, text: string, inside?: string) {
  let s = shadow(160, 262, 104, 14);
  s += P('M60 168 L 188 140 L 262 168 L 134 198 Z', lighten(wrap, 0.25)) + P('M60 168 L 134 198 L 134 250 L 60 220 Z', darken(wrap, 0.1)) + P('M134 198 L 262 168 L 262 218 L 134 250 Z', wrap);
  s += `<text x="198" y="214" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800" fill="#fff" text-anchor="middle" transform="rotate(-13 198 214)">${esc(text)}</text>`;
  if (inside) s += P('M60 168 L 120 155 L 140 172 L 80 186 Z', inside);
  return s;
}

function eggTray() {
  let s = shadow(160, 262, 120, 14) + P('M40 178 L 160 140 L 280 178 L 160 226 Z', '#d6c6a4') + P('M40 178 L 160 226 L 160 246 L 40 196 Z', '#c4b28c') + P('M160 226 L 280 178 L 280 196 L 160 246 Z', '#b8a580');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const x = 160 + (c - r) * 28;
    const y = 150 + (c + r) * 11;
    s += E(x, y, 13, 17, rg('#fff4e4', '#e8c9a0', 0.35, 0.3));
  }
  return s;
}

function jarOf(content: string, lid: string, text: string) {
  return bottle({ liquid: content, cap: lid, label: '#ffffff', text: '', shape: 'jar' }) + R(116, 162, 88, 56, 6, '#fff') + T(160, 198, text, 17, lid);
}

function bar(wrap: string, text: string) {
  return (
    shadow(160, 248, 120, 12) +
    `<g transform="rotate(-12 160 180)">${R(44, 130, 232, 92, 8, lg(lighten(wrap, 0.1), darken(wrap, 0.15)))}${R(220, 130, 56, 92, 0, '#c6c9cf')}${R(222, 134, 50, 84, 4, '#6b3a1e')}${P('M222 158 h50 M222 182 h50 M246 134 v84', 'none', 'stroke="#4a2410" stroke-width="2"')}${T(130, 186, text, 24, '#fff', 'font-style="italic"')}</g>`
  );
}

function tube(color: string, text: string, cap = '#ffffff') {
  return (
    shadow(160, 248, 120, 10) +
    `<g transform="rotate(-18 160 180)">${P('M58 150 L 214 140 L 214 220 L 58 210 Q 50 180 58 150 Z', lg(lighten(color, 0.2), darken(color, 0.1)))}${R(50, 146, 12, 68, 3, darken(color, 0.2))}${R(214, 156, 30, 48, 6, cap)}${R(244, 166, 14, 28, 4, cap)}${T(136, 190, text, 22, '#fff')}</g>`
  );
}

function soap(color: string, text: string) {
  return (
    shadow(160, 248, 110, 12) + R(66, 140, 188, 100, 46, darken(color, 0.12)) + R(66, 132, 188, 100, 46, rg(lighten(color, 0.35), color)) +
    R(96, 152, 128, 60, 30, 'none', `stroke="${darken(color, 0.15)}" stroke-width="3"`) + T(160, 190, text, 22, darken(color, 0.45))
  );
}

function loaf(brown: boolean) {
  const [a, b] = brown ? ['#b9783e', '#7a4a20'] : ['#f0c27a', '#c98a3c'];
  return (
    shadow(160, 260, 120, 14) +
    P('M52 236 L 52 160 Q 52 112 100 112 Q 120 86 160 92 Q 200 86 220 112 Q 268 112 268 160 L 268 236 Z', lg(a, b)) +
    P('M52 236 L 52 182 L 268 182 L 268 236 Z', 'rgba(255,255,255,.75)') + R(52, 182, 216, 54, 0, brown ? '#d8b98c' : '#fff3d8', 'opacity=".9"') +
    T(160, 220, brown ? 'WHOLE WHEAT' : 'WHITE BREAD', 15, brown ? '#7a4a20' : '#c98a3c') +
    P('M92 130 q14 -12 28 0 M146 120 q14 -12 28 0 M200 130 q14 -12 28 0', 'none', `stroke="${lighten(a, 0.3)}" stroke-width="4" stroke-linecap="round"`)
  );
}

function rusk() {
  let s = shadow(160, 262, 110, 12);
  for (let i = 0; i < 4; i++) s += `<g transform="rotate(${-20 + i * 12} 160 230)">${R(96 + i * 6, 120 + i * 12, 128, 52, 10, lg('#e7b36a', '#b8762e'))}${scatter('r' + i, 10, 160 + i * 6, 146 + i * 12, 54, 16, (x, y) => C(x, y, 2, '#8a5420', 'opacity=".6"'))}</g>`;
  return s;
}

// ───────── produce ─────────
function produce(kind: string, seed: string) {
  const r = seeded(seed);
  let s = shadow(160, 262, 116, 14);
  const pile = (n: number, draw: (x: number, y: number, i: number) => string) => {
    const spots = [[108, 208], [164, 214], [218, 206], [134, 168], [192, 168], [162, 128]].slice(0, n);
    return spots.map(([x, y], i) => draw(x!, y!, i)).join('');
  };
  switch (kind) {
    case 'tomato':
      return s + pile(6, (x, y) => C(x, y, 34, rg('#ff7a5c', '#c4221a')) + `<path d="M${x - 12} ${y - 30} l12 8 l12 -8 l-6 10 l8 6 l-14 -2 l-6 10 l-4 -10 l-12 2 l8 -6z" fill="#3f8f3a"/>` + E(x - 12, y - 10, 8, 5, '#fff', 'opacity=".35"'));
    case 'onion':
      return s + pile(5, (x, y) => P(`M${x} ${y - 46} Q ${x + 6} ${y - 30} ${x + 30} ${y - 16} Q ${x + 44} ${y + 8} ${x + 22} ${y + 30} Q ${x} ${y + 40} ${x - 22} ${y + 30} Q ${x - 44} ${y + 8} ${x - 30} ${y - 16} Q ${x - 6} ${y - 30} ${x} ${y - 46} Z`, rg('#c9629a', '#7a2a5a')) + P(`M${x - 14} ${y - 20} Q ${x - 18} ${y + 10} ${x - 6} ${y + 30}`, 'none', 'stroke="#e8a8cc" stroke-width="2.5"'));
    case 'potato':
      return s + pile(6, (x, y, i) => E(x, y, 38, 27, rg('#e7c48a', '#a87a3e'), `transform="rotate(${(i * 37) % 60 - 30} ${x} ${y})"`) + C(x - 10, y - 4, 2.5, '#8a5f2a') + C(x + 12, y + 6, 2.5, '#8a5f2a'));
    case 'banana':
      for (let i = 0; i < 5; i++) s += `<path d="M78 ${120 + i * 6} Q 120 ${236 - i * 4} 248 ${168 + i * 8}" fill="none" stroke="${['#e9c22e', '#f2d240', '#f7dc52', '#eccb3a', '#e3bd2a'][i]}" stroke-width="30" stroke-linecap="round"/>`;
      return s + R(64, 102, 22, 40, 6, '#6e8a2a', 'transform="rotate(-30 75 122)"') + P('M240 168 l16 4', 'none', 'stroke="#4a3a12" stroke-width="10" stroke-linecap="round"');
    case 'apple':
      return s + pile(5, (x, y) => P(`M${x} ${y - 26} Q ${x + 40} ${y - 46} ${x + 38} ${y} Q ${x + 34} ${y + 38} ${x} ${y + 34} Q ${x - 34} ${y + 38} ${x - 38} ${y} Q ${x - 40} ${y - 46} ${x} ${y - 26} Z`, rg('#ff6a6a', '#b0141e')) + P(`M${x} ${y - 26} l4 -16`, 'none', 'stroke="#5a3a1a" stroke-width="4"') + E(x + 12, y - 38, 10, 5, '#4f9a3a', `transform="rotate(-24 ${x + 12} ${y - 38})"`) + E(x - 14, y - 6, 7, 10, '#fff', 'opacity=".3"'));
    case 'carrot':
      for (let i = 0; i < 4; i++) {
        const y = 128 + i * 30;
        s += `<g transform="rotate(${-10 + r() * 20} 160 ${y})">${P(`M80 ${y - 14} Q 200 ${y - 12} 262 ${y} Q 200 ${y + 12} 80 ${y + 14} Q 68 ${y} 80 ${y - 14} Z`, lg('#ffa04a', '#e0631a'))}${P(`M100 ${y - 6} h10 M140 ${y + 4} h12 M190 ${y - 4} h10`, 'none', 'stroke="#c6541a" stroke-width="2"')}${P(`M78 ${y} l-26 -18 M78 ${y} l-30 0 M78 ${y} l-26 16`, 'none', 'stroke="#4f9a3a" stroke-width="6" stroke-linecap="round"')}</g>`;
      }
      return s;
    case 'coriander':
      s += P('M160 262 L 160 180', 'none', 'stroke="#8bbf5a" stroke-width="8"');
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.28;
        const x = 160 + Math.cos(a) * 100;
        const y = 196 + Math.sin(a) * 110;
        s += P(`M160 236 Q ${(160 + x) / 2} ${y + 40} ${x} ${y}`, 'none', 'stroke="#6aa83a" stroke-width="4"') + scatter(seed + i, 4, x, y, 18, 14, (a2, b) => C(a2, b, 11, '#3f8f3a') + C(a2, b, 7, '#58aa45'));
      }
      return s + R(140, 220, 40, 16, 4, '#d9b38c');
  }
  return s;
}

// ───────── fashion ─────────
function shirt(color: string, kind: 'oxford' | 'tee' | 'kurta' | 'jacket') {
  const d = darken(color, 0.18);
  const len = kind === 'kurta' ? 262 : 250;
  let s = shadow(160, 272, 100, 10);
  s += P(`M112 62 L 72 78 L 30 140 L 64 164 L 92 130 L 92 ${len} L 228 ${len} L 228 130 L 256 164 L 290 140 L 248 78 L 208 62 Q 160 92 112 62 Z`, lg(lighten(color, 0.08), d));
  if (kind === 'oxford') s += P('M112 62 L 160 96 L 208 62 L 196 54 L 160 80 L 124 54 Z', lighten(color, 0.2)) + P('M160 96 L 160 248', 'none', `stroke="${d}" stroke-width="3"`) + [120, 150, 180, 210].map((y) => C(166, y, 3.5, '#f4f4f4')).join('') + R(106, 128, 30, 26, 3, 'none', `stroke="${d}" stroke-width="2.5"`);
  if (kind === 'tee') s += P('M124 64 Q 160 96 196 64', 'none', `stroke="${d}" stroke-width="7"`);
  if (kind === 'kurta') s += P('M160 70 L 160 140', 'none', 'stroke="#e7c35a" stroke-width="5"') + [88, 104, 120].map((y) => C(160, y, 3.5, '#f3d77a')).join('') + P(`M92 ${len - 14} h136`, 'none', 'stroke="#e7c35a" stroke-width="5"');
  if (kind === 'jacket') s += P('M112 62 L 140 110 L 160 96 L 180 110 L 208 62 Z', d) + P('M160 96 L 160 250', 'none', 'stroke="#c9a56a" stroke-width="3" stroke-dasharray="5 6"') + R(104, 140, 40, 34, 4, 'none', `stroke="${lighten(color, 0.25)}" stroke-width="3"`) + R(176, 140, 40, 34, 4, 'none', `stroke="${lighten(color, 0.25)}" stroke-width="3"`) + [118, 150, 190, 226].map((y) => C(170, y, 4, '#c9a56a')).join('');
  return s;
}

function trousers(color: string, wide: boolean) {
  const d = darken(color, 0.18);
  const flare = wide ? 26 : 0;
  return (
    shadow(160, 272, 90, 10) +
    P(`M98 50 L 222 50 L ${230 + flare} 262 L ${172 + flare / 3} 262 L 160 110 L ${148 - flare / 3} 262 L ${90 - flare} 262 Z`, lg(lighten(color, 0.08), d)) +
    R(98, 50, 124, 20, 2, d) + P('M160 70 L 160 108', 'none', `stroke="${darken(color, 0.35)}" stroke-width="2.5"`) +
    (wide ? '' : P('M108 76 Q 124 92 136 76 M184 76 Q 196 92 212 76', 'none', `stroke="${darken(color, 0.3)}" stroke-width="2.5"`))
  );
}

function dress(color: string, seed: string) {
  let s = shadow(160, 274, 110, 10);
  s += P('M128 48 L 140 48 L 146 76 L 174 76 L 180 48 L 192 48 L 206 112 L 196 132 L 262 266 L 58 266 L 124 132 L 114 112 Z', lg(lighten(color, 0.1), darken(color, 0.12)));
  s += P('M124 132 Q 160 142 196 132', 'none', `stroke="${darken(color, 0.25)}" stroke-width="5"`);
  s += scatter(seed, 18, 160, 200, 80, 56, (x, y, r, i) => (y > 140 ? C(x, y, 6, i % 2 ? '#ffffff' : '#ffd25a', 'opacity=".85"') + C(x, y, 2.5, '#e1566e') : ''));
  return s;
}

function saree(color: string) {
  const d = darken(color, 0.2);
  return (
    shadow(160, 270, 110, 12) +
    P('M64 100 L 256 100 L 256 250 L 64 250 Z', lg(lighten(color, 0.06), d)) +
    P('M64 100 L 256 100 L 256 122 L 64 122 Z M64 228 L 256 228 L 256 250 L 64 250 Z', '#e2b53a') +
    P('M64 112 h192 M64 238 h192', 'none', 'stroke="#fff1b8" stroke-width="2" stroke-dasharray="6 6"') +
    scatter('saree', 16, 160, 176, 80, 40, (x, y) => C(x, y, 4, '#f3cf5a')) +
    P('M220 100 Q 268 150 236 250 L 256 250 L 256 100 Z', d, 'opacity=".6"')
  );
}

function sneaker(color: string) {
  const sole = color === VARIANT.Black ? '#f2f2f2' : '#ffffff';
  return (
    shadow(160, 256, 130, 12) +
    P('M38 222 Q 40 190 70 176 L 120 120 Q 140 104 160 120 L 196 150 Q 270 160 286 200 L 290 222 Z', lg(lighten(color, 0.1), darken(color, 0.12))) +
    R(32, 218, 262, 26, 12, sole, 'stroke="#d5d8dd" stroke-width="2"') +
    P('M124 132 L 176 168 M114 146 L 166 182 M104 160 L 154 194', 'none', `stroke="${color === VARIANT.White ? '#9aa3ae' : '#ffffff'}" stroke-width="4" stroke-linecap="round"`) +
    P('M64 210 Q 150 196 270 206', 'none', 'stroke="#2a6fd6" stroke-width="7" stroke-linecap="round"')
  );
}

function belt(color: string) {
  return (
    shadow(160, 256, 120, 12) +
    `<path d="M70 200 C 40 120, 280 90, 262 170 C 250 230, 90 240, 90 180" fill="none" stroke="${darken(color, 0.15)}" stroke-width="34" stroke-linecap="round"/>` +
    `<path d="M70 200 C 40 120, 280 90, 262 170 C 250 230, 90 240, 90 180" fill="none" stroke="${color}" stroke-width="26" stroke-linecap="round"/>` +
    R(56, 172, 54, 50, 8, 'none', 'stroke="#c9b27a" stroke-width="8"') + R(70, 194, 34, 6, 3, '#c9b27a')
  );
}

// ───────── pharmacy ─────────
function blister(pill: string, capsule: boolean, box: string, text: string) {
  let s = shadow(160, 266, 120, 12) + box3d(box, text, { w: 140, h: 110, band: lighten(box, 0.3) }).replace(shadow(166, 268, 98, 12), '');
  s += `<g transform="rotate(-10 140 210)">${R(40, 170, 170, 84, 8, lg('#eef1f4', '#c9cfd6'))}`;
  for (let r2 = 0; r2 < 2; r2++) for (let c = 0; c < 4; c++) {
    const x = 64 + c * 40;
    const y = 192 + r2 * 40;
    s += capsule ? R(x - 16, y - 8, 32, 16, 8, pill) + R(x, y - 8, 16, 16, 0, lighten(pill, 0.6)) + R(x - 16, y - 8, 32, 16, 8, 'none', 'stroke="#fff" stroke-width="2" opacity=".6"') : C(x, y, 14, '#dfe3e8') + C(x, y, 11, rg('#ffffff', pill));
  }
  return s + '</g>';
}

function sachet(color: string, text: string) {
  return (
    shadow(160, 266, 90, 12) +
    `<g transform="rotate(-6 160 170)">${R(84, 70, 152, 196, 6, lg(lighten(color, 0.1), darken(color, 0.08)))}${P('M84 70 h152 v14 h-152 z M84 252 h152 v14 h-152 z', darken(color, 0.15))}${C(160, 150, 38, '#fff')}${T(160, 160, 'ORS', 26, color)}${T(160, 218, text, 15, '#fff')}</g>`
  );
}

function mask() {
  return (
    shadow(160, 256, 120, 12) +
    P('M54 150 Q 60 110 160 100 Q 260 110 266 150 L 256 210 Q 160 260 64 210 Z', lg('#ffffff', '#dfe3e8')) +
    P('M64 150 Q 160 136 256 150 M70 178 Q 160 166 250 178 M80 204 Q 160 196 240 204', 'none', 'stroke="#cdd3da" stroke-width="2.5"') +
    `<path d="M54 150 Q 20 150 30 120 Q 40 96 70 112" fill="none" stroke="#9ab3d6" stroke-width="5"/><path d="M266 150 Q 300 150 290 120 Q 280 96 250 112" fill="none" stroke="#9ab3d6" stroke-width="5"/>` +
    C(234, 176, 12, '#e7eaee', 'stroke="#c4cad1" stroke-width="2"')
  );
}

// ───────── electronics ─────────
function screenGlow(x: number, y: number, w: number, h: number, rx: number, hue: string) {
  return R(x, y, w, h, rx, lg(lighten(hue, 0.25), darken(hue, 0.35))) + P(`M${x + w * 0.1} ${y + h} L ${x + w * 0.9} ${y} L ${x + w} ${y} L ${x + w} ${y + h * 0.22} L ${x + w * 0.32} ${y + h} Z`, '#fff', 'opacity=".08"');
}

function phone(body: string, hue: string, seed: string) {
  const r = seeded(seed);
  return (
    shadow(160, 274, 80, 10) +
    `<g transform="rotate(${-8 + r() * 6} 160 160)">${R(98, 34, 124, 244, 22, darken(body, 0.2))}${R(102, 38, 116, 236, 19, body)}${screenGlow(108, 46, 104, 220, 14, hue)}${R(144, 54, 32, 8, 4, '#111')}` +
    `${[0, 1, 2, 3].map((i) => R(120 + i * 22, 200, 16, 16, 5, '#ffffff', 'opacity=".3"')).join('')}${R(118, 238, 84, 6, 3, '#fff', 'opacity=".5"')}</g>`
  );
}

function laptop(body: string, hue: string) {
  return (
    shadow(160, 260, 140, 12) +
    R(58, 64, 204, 136, 10, darken(body, 0.4)) + screenGlow(66, 72, 188, 120, 4, hue) +
    P('M30 206 L 290 206 L 276 236 L 44 236 Z', lg(lighten(body, 0.2), darken(body, 0.1))) + R(132, 206, 56, 8, 3, darken(body, 0.2)) +
    R(48, 200, 224, 8, 3, body)
  );
}

function headphones(color: string) {
  return (
    shadow(160, 266, 104, 12) +
    `<path d="M84 190 Q 72 64 160 60 Q 248 64 236 190" fill="none" stroke="${darken(color, 0.1)}" stroke-width="18" stroke-linecap="round"/>` +
    R(56, 160, 60, 96, 26, lg(lighten(color, 0.15), darken(color, 0.25))) + R(204, 160, 60, 96, 26, lg(lighten(color, 0.15), darken(color, 0.25))) +
    R(98, 172, 20, 72, 8, darken(color, 0.4)) + R(202, 172, 20, 72, 8, darken(color, 0.4))
  );
}

function earbuds() {
  return (
    shadow(160, 260, 96, 12) + R(82, 128, 156, 120, 54, lg('#3a3d44', '#15171b')) + P('M82 176 h156', 'none', 'stroke="#000" stroke-width="3"') + C(160, 214, 4, '#3ad46a') +
    E(118, 104, 22, 26, '#2a2c31') + R(110, 112, 14, 40, 7, '#2a2c31') + E(202, 104, 22, 26, '#2a2c31') + R(196, 112, 14, 40, 7, '#2a2c31')
  );
}

function speaker(color: string) {
  return (
    shadow(160, 256, 130, 12) + R(44, 136, 232, 104, 52, lg(lighten(color, 0.1), darken(color, 0.25))) +
    E(276, 188, 16, 52, darken(color, 0.4)) + E(44, 188, 16, 52, darken(color, 0.3)) +
    scatter('sp', 60, 160, 188, 100, 40, (x, y) => C(x, y, 2, darken(color, 0.4), 'opacity=".5"')) +
    R(126, 172, 68, 32, 8, '#fff', 'opacity=".12"') + T(160, 196, 'JBL', 18, '#fff')
  );
}

function tv(hue: string) {
  return (
    shadow(160, 272, 110, 10) + R(28, 56, 264, 168, 8, '#16181c') + screenGlow(34, 62, 252, 156, 4, hue) +
    `<path d="M48 210 Q 120 120 190 150 T 286 90 L 286 218 L 34 218 Z" fill="${lighten(hue, 0.15)}" opacity=".35"/>` +
    P('M126 226 L 194 226 L 214 262 L 106 262 Z', '#2a2c31')
  );
}

function watch(band: string) {
  return (
    shadow(160, 274, 70, 10) + R(118, 26, 84, 268, 30, lg(lighten(band, 0.1), darken(band, 0.15))) +
    R(98, 88, 124, 148, 34, '#1d1f24') + R(106, 96, 108, 132, 28, lg('#2c3e70', '#0b1022')) + R(222, 128, 10, 30, 4, '#8f949c') +
    C(160, 162, 34, 'none', 'stroke="#3ad46a" stroke-width="7" stroke-dasharray="150 220" stroke-linecap="round"') + C(160, 162, 22, 'none', 'stroke="#f2a03a" stroke-width="7" stroke-dasharray="80 220" stroke-linecap="round"')
  );
}

function charger() {
  return (
    shadow(160, 262, 90, 12) + R(98, 112, 124, 140, 22, lg('#ffffff', '#dfe3e8', true)) + R(130, 70, 14, 44, 3, '#a9afb7') + R(176, 70, 14, 44, 3, '#a9afb7') +
    R(146, 196, 28, 12, 6, '#2b2e33') + T(160, 172, '20W', 22, '#8f949c') +
    '<path d="M174 202 C 240 200, 260 240, 296 230" fill="none" stroke="#f1f2f4" stroke-width="10" stroke-linecap="round"/>'
  );
}

function pendrive() {
  return (
    shadow(160, 248, 100, 10) + `<g transform="rotate(-24 160 170)">${R(70, 140, 150, 60, 14, lg('#e2373d', '#9e1b20'))}${R(214, 148, 52, 44, 4, '#c9ced5')}${R(232, 160, 10, 8, 1, '#7a8089')}${R(232, 174, 10, 8, 1, '#7a8089')}${C(92, 170, 8, '#fff', 'opacity=".5"')}${T(150, 178, '128GB', 18, '#fff')}</g>`
  );
}

function mouse() {
  return (
    shadow(160, 264, 80, 12) + P('M100 140 Q 100 50 168 50 Q 230 56 224 150 Q 222 250 160 262 Q 98 252 100 140 Z', lg('#4a4e56', '#1d1f24', true)) +
    P('M164 52 L 164 120', 'none', 'stroke="#111" stroke-width="3"') + R(156, 76, 16, 30, 8, '#8f949c') + P('M100 150 Q 70 170 100 200', 'none', 'stroke="#6b7079" stroke-width="10" stroke-linecap="round"')
  );
}

// ───────── repair ─────────
function service(icon: 'screen' | 'battery' | 'port' | 'software' | 'water' | 'keyboard' | 'thermal' | 'diagnosis') {
  let s = shadow(160, 272, 90, 10);
  const device = icon === 'keyboard' || icon === 'thermal' ? laptop('#6b7079', '#3d6fd8') : phone('#2b2e33', '#3d6fd8', icon);
  s += `<g opacity=".9">${device.replace(/<ellipse[^>]*opacity="\.12"\/>/, '')}</g>`;
  const badge = (inner: string) => C(232, 222, 46, '#ffffff') + C(232, 222, 40, '#1f8a5a') + inner;
  const glyph: Record<typeof icon, string> = {
    screen: P('M214 206 L 250 238 M220 236 L 246 206', 'none', 'stroke="#fff" stroke-width="7" stroke-linecap="round"'),
    battery: R(212, 208, 36, 26, 4, 'none', 'stroke="#fff" stroke-width="5"') + R(248, 215, 5, 12, 2, '#fff') + R(217, 213, 16, 16, 2, '#fff'),
    port: R(212, 214, 40, 16, 8, 'none', 'stroke="#fff" stroke-width="5"'),
    software: P('M216 222 a16 16 0 1 0 6 -12 M216 204 v12 h12', 'none', 'stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"'),
    water: P('M232 200 Q 252 226 244 236 Q 232 250 220 236 Q 212 226 232 200 Z', '#fff'),
    keyboard: R(208, 208, 48, 28, 4, 'none', 'stroke="#fff" stroke-width="4"') + P('M216 218 h4 M228 218 h4 M240 218 h4 M220 228 h24', 'none', 'stroke="#fff" stroke-width="4" stroke-linecap="round"'),
    thermal: P('M222 240 v-30 a10 10 0 1 1 20 0 v30 a14 14 0 1 1 -20 0 z', 'none', 'stroke="#fff" stroke-width="5"'),
    diagnosis: C(226, 216, 14, 'none', 'stroke="#fff" stroke-width="6"') + P('M236 226 l14 14', 'none', 'stroke="#fff" stroke-width="7" stroke-linecap="round"'),
  };
  return s + badge(glyph[icon]);
}

function displayPanel(hue: string) {
  return (
    shadow(160, 270, 90, 10) + `<g transform="rotate(-12 160 160)">${R(100, 36, 120, 236, 18, '#1d1f24')}${R(106, 42, 108, 224, 14, lg(lighten(hue, 0.2), darken(hue, 0.4)))}${P('M106 120 L 214 90 L 214 100 L 106 130 Z', '#fff', 'opacity=".12"')}` +
    `${R(212, 120, 40, 18, 3, '#d29a2a')}${R(244, 116, 26, 26, 3, '#3b3e44')}</g>`
  );
}

function batteryCell(text: string) {
  return (
    shadow(160, 266, 80, 10) + `<g transform="rotate(-8 160 160)">${R(100, 40, 120, 220, 12, lg('#3d4148', '#1f2125', true))}${R(100, 40, 120, 220, 12, 'none', 'stroke="#575c64" stroke-width="2"')}` +
    `${R(118, 70, 84, 84, 8, '#f2c12e')}${P('M166 82 L 142 118 L 160 118 L 152 144 L 180 104 L 162 104 Z', '#1f2125')}${T(160, 196, text, 18, '#ffffff')}${R(130, 36, 60, 10, 3, '#d29a2a')}</g>`
  );
}

function flex() {
  return (
    shadow(160, 256, 110, 10) +
    `<path d="M60 220 C 100 120, 200 240, 250 110" fill="none" stroke="#d29a2a" stroke-width="22"/><path d="M60 220 C 100 120, 200 240, 250 110" fill="none" stroke="#e8b84a" stroke-width="14"/>` +
    R(36, 204, 52, 36, 5, '#2b2e33') + R(46, 214, 32, 14, 7, '#9aa1ab') + R(228, 86, 44, 40, 5, '#2b2e33')
  );
}

function keyboard() {
  let s = shadow(160, 262, 140, 12) + `<g transform="skewX(-14) translate(36 0)">${R(30, 120, 252, 120, 12, '#2b2e33')}`;
  for (let r2 = 0; r2 < 4; r2++) for (let c = 0; c < 10; c++) s += R(42 + c * 23.6, 132 + r2 * 24, 19, 19, 3, '#4a4e56');
  return s + R(100, 228, 110, 4, 2, '#4a4e56') + '</g>';
}

function syringe() {
  return (
    shadow(160, 252, 120, 10) +
    `<g transform="rotate(-24 160 170)">${R(70, 150, 170, 40, 8, lg('#f0f2f5', '#c4cad1'))}${R(78, 156, 120, 28, 4, '#9aa1ab')}${R(240, 160, 30, 20, 4, '#c4cad1')}${R(268, 166, 22, 8, 3, '#9aa1ab')}${R(44, 140, 26, 60, 4, '#2b2e33')}${T(138, 176, 'MX-6', 16, '#2b2e33')}</g>`
  );
}

// ───────── picking ─────────
type Rule = [RegExp, (i: ArtInput, seed: string) => string];
const RULES: Rule[] = [
  // restaurant
  [/paneer tikka/i, (_, s) => skewer(s, '#f2b86a', 'cubes')],
  [/hara bhara/i, (_, s) => skewer(s, '#5b9a3a', 'patties')],
  [/tandoori chicken/i, (_, s) => skewer(s, '#d4532a', 'drumsticks')],
  [/chicken 65/i, (_, s) => friedPile(s, '#cf3a22', 'chunks')],
  [/gobi manchurian/i, (_, s) => friedPile(s, '#a8401e', 'chunks')],
  [/apollo fish/i, (_, s) => friedPile(s, '#d9622b', 'fillet')],
  [/bonda/i, (_, s) => friedPile(s, '#d99a3a', 'balls')],
  [/butter chicken/i, (_, s) => curry(s, '#e2742e', 'butter')],
  [/paneer butter/i, (_, s) => curry(s, '#e8862e', 'cubes')],
  [/chettinad/i, (_, s) => curry(s, '#9a3a1a', 'meat')],
  [/dal makhani/i, (_, s) => curry(s, '#6a3418', 'cream')],
  [/kadai/i, (_, s) => curry(s, '#c46a2a', 'veg')],
  [/rogan josh/i, (_, s) => curry(s, '#b0281e', 'meat')],
  [/steak/i, () => steak()],
  [/garlic naan/i, (_, s) => bread('naan', s, true)],
  [/naan/i, (_, s) => bread('naan', s)],
  [/roti/i, (_, s) => bread('roti', s)],
  [/parotta/i, (_, s) => bread('parotta', s)],
  [/chicken dum biryani|mutton biryani/i, (_, s) => riceBowl(s, '#e8a33a', ['#e8a33a', '#9a4a24', '#f7d26a'])],
  [/pulao/i, (_, s) => riceBowl(s, '#f1e6c8', ['#3d9a3d', '#e8a521', '#d64532'])],
  [/jeera rice/i, (_, s) => riceBowl(s, '#f5edd8', ['#7a5a2a'])],
  [/curd rice/i, (_, s) => riceBowl(s, '#fbf8ef', ['#c0263a', '#3f8f3a'], 90)],
  [/filter coffee$/i, () => cup('tumbler')],
  [/masala chai/i, () => cup('chai')],
  [/lime soda/i, () => tallGlass('#dff2c0', 'lime', true)],
  [/\blassi\b/i, () => tallGlass('#f6c03a', 'mint', false)],
  [/cold coffee/i, () => tallGlass('#a8724a', 'cream', true)],
  [/mineral water/i, () => waterBottle('WATER')],
  [/gulab jamun/i, (_, s) => dessertBowl(s, 'jamun')],
  [/rasmalai/i, (_, s) => dessertBowl(s, 'rasmalai')],
  [/payasam/i, (_, s) => dessertBowl(s, 'payasam')],
  [/brownie/i, () => brownie()],
  [/thali/i, (_, s) => thali(s, false)],
  [/meal combo/i, (_, s) => thali(s, true)],
  // grocery
  [/dairy milk|chocolate/i, () => bar('#5a2a86', 'Silk')],
  [/paneer/i, () => block('#2b8a3e', 'PANEER', '#fbf3df')],
  [/milk/i, () => pouch('#2a6fd6', 'MILK')],
  [/butter/i, () => block('#f2c12e', 'BUTTER', '#ffe27a')],
  [/curd/i, () => tub('#2a6fd6', 'CURD')],
  [/cheese/i, () => block('#e8492e', 'CHEESE', '#ffd65a')],
  [/eggs/i, () => eggTray()],
  [/basmati/i, () => sack('#c2255c', 'BASMATI', '#f6f0e0')],
  [/boiled rice/i, () => sack('#2b8a3e', 'PONNI', '#efe2c2')],
  [/atta/i, () => sack('#e67700', 'ATTA', '#d8b98c')],
  [/toor dal/i, () => sack('#d9a21a', 'TOOR DAL', '#f0c33a')],
  [/idli mix/i, () => box3d('#c92a2a', 'IDLI MIX', { sub: '500 g', band: '#ffd43b' })],
  [/salt/i, () => box3d('#1971c2', 'SALT', { w: 110, h: 150, sub: '1 kg', band: '#e03131' })],
  [/^sugar/i, () => sack('#5f3dc4', 'SUGAR', '#ffffff')],
  [/gingelly|coconut oil/i, (i) => bottle({ liquid: /coconut/i.test(i.name) ? '#e9f4ff' : '#c98a2a', cap: '#2b8a3e', label: '#2b8a3e', text: 'OIL', shape: 'oil' })],
  [/oil/i, () => bottle({ liquid: '#f2c12e', cap: '#e8590c', label: '#e8590c', text: 'OIL', shape: 'oil' })],
  [/\btea\b/i, () => box3d('#c92a2a', 'TEA', { sub: '500 g', band: '#e8b84a' })],
  [/instant coffee|filter coffee/i, () => jarOf('#4a2410', '#7a3e1a', 'COFFEE')],
  [/coca|cola/i, () => bottle({ liquid: '#3a1a10', cap: '#d6221e', label: '#d6221e', text: 'COLA', shape: 'pet' })],
  [/orange|tropicana/i, () => bottle({ liquid: '#f6a21a', cap: '#2b8a3e', label: '#f76707', text: 'ORANGE', shape: 'pet' })],
  [/water/i, () => waterBottle('WATER')],
  [/lays|kurkure|bhujia/i, (i) => chipPacket(/kurkure/i.test(i.name) ? '#f08c00' : /bhujia/i.test(i.name) ? '#c92a2a' : '#fab005', i.name.split(' ')[0]!.toUpperCase())],
  [/good day|parle|biscuit/i, (i) => box3d(/parle/i.test(i.name) ? '#f2c12e' : '#c92a2a', /parle/i.test(i.name) ? 'GLUCO' : 'COOKIES', { w: 150, h: 110, band: '#7a3e1a' })],
  [/maggi|noodles/i, () => chipPacket('#f2c12e', 'NOODLES', '#d6221e')],
  [/\bjam\b/i, () => jarOf('#a8182a', '#c92a2a', 'JAM')],
  [/colgate|toothpaste/i, () => tube('#d6221e', 'PASTE')],
  [/dove|soap|beauty bar/i, () => soap('#f4f6f9', 'DOVE')],
  [/shampoo|shoulders/i, () => bottle({ liquid: '#2a6fd6', cap: '#1c3f7a', label: '#ffffff', text: '', shape: 'shampoo' }) + R(118, 150, 84, 52, 6, '#fff') + T(160, 184, 'SHAMPOO', 13, '#1c3f7a')],
  [/handwash/i, () => bottle({ liquid: '#2b8a3e', cap: '#ffffff', label: '#ffffff', text: '', shape: 'pump' }) + R(118, 150, 84, 52, 6, '#fff') + T(160, 184, 'HANDWASH', 12, '#2b8a3e')],
  [/surf|detergent/i, () => box3d('#1971c2', 'DETERGENT', { sub: '1 kg', band: '#e03131' })],
  [/vim|dishwash/i, () => soap('#a3d15a', 'DISH BAR')],
  [/harpic/i, () => bottle({ liquid: '#2a3f9a', cap: '#d6221e', label: '#ffffff', text: '', shape: 'cleaner' }) + R(118, 146, 84, 52, 6, '#fff') + T(160, 180, 'CLEANER', 13, '#2a3f9a')],
  [/lizol|floor cleaner/i, () => bottle({ liquid: '#7a3fc4', cap: '#2b8a3e', label: '#ffffff', text: '', shape: 'cleaner' }) + R(118, 146, 84, 52, 6, '#fff') + T(160, 180, 'FLOOR', 15, '#7a3fc4')],
  [/refill|good knight/i, () => bottle({ liquid: '#e6f0ff', cap: '#2b2e33', label: '#e8590c', text: 'REFILL', shape: 'small' })],
  [/tomato/i, (_, s) => produce('tomato', s)],
  [/onion/i, (_, s) => produce('onion', s)],
  [/potato/i, (_, s) => produce('potato', s)],
  [/banana/i, (_, s) => produce('banana', s)],
  [/apple shimla/i, (_, s) => produce('apple', s)],
  [/carrot/i, (_, s) => produce('carrot', s)],
  [/coriander/i, (_, s) => produce('coriander', s)],
  [/brown bread/i, () => loaf(true)],
  [/bread/i, () => loaf(false)],
  [/rusk/i, () => rusk()],
  // fashion
  [/oxford shirt/i, (i) => shirt(VARIANT[i.variant ?? ''] ?? '#4c7bd9', 'oxford')],
  [/\btee\b/i, (i) => shirt(VARIANT[i.variant ?? ''] ?? '#2b2b2e', 'tee')],
  [/denim jacket/i, (i) => shirt(VARIANT[i.variant ?? ''] ?? '#3a5683', 'jacket')],
  [/kurta/i, (i) => shirt(VARIANT[i.variant ?? ''] ?? '#7b2032', 'kurta')],
  [/chinos/i, (i) => trousers(VARIANT[i.variant ?? ''] ?? '#c3a878', false)],
  [/palazzo/i, (i) => trousers(VARIANT[i.variant ?? ''] ?? '#dccaa8', true)],
  [/dress/i, (i, s) => dress(VARIANT[i.variant ?? ''] ?? '#f3a98c', s)],
  [/saree/i, (i) => saree(VARIANT[i.variant ?? ''] ?? '#c0262d')],
  [/sneakers/i, (i) => sneaker(VARIANT[i.variant ?? ''] ?? '#ffffff')],
  [/belt/i, (i) => belt(VARIANT[i.variant ?? ''] ?? '#7a4b2a')],
  // electronics + repair (before pharmacy so "Battery"/"Display" don't fall through)
  [/display/i, (i) => displayPanel(/iphone/i.test(i.name) ? '#7a3fc4' : '#2a6fd6')],
  [/battery replacement/i, () => service('battery')],
  [/battery/i, (i) => batteryCell(/iphone/i.test(i.name) ? '3,600 mAh' : '4,000 mAh')],
  [/back glass/i, () => displayPanel('#9aa7b8')],
  [/charging port flex/i, () => flex()],
  [/keyboard replacement/i, () => service('keyboard')],
  [/laptop keyboard/i, () => keyboard()],
  [/thermal paste mx/i, () => syringe()],
  [/thermal paste/i, () => service('thermal')],
  [/screen replacement/i, () => service('screen')],
  [/charging port/i, () => service('port')],
  [/software|os reinstall/i, () => service('software')],
  [/water damage/i, () => service('water')],
  [/diagnosis/i, () => service('diagnosis')],
  [/iphone/i, (_, s) => phone('#e8e4dc', '#7a3fc4', s)],
  [/galaxy|redmi|oneplus/i, (i, s) => phone(/galaxy/i.test(i.name) ? '#2b2e33' : '#4a4e56', /redmi/i.test(i.name) ? '#e8590c' : /oneplus/i.test(i.name) ? '#c92a2a' : '#1971c2', s)],
  [/macbook/i, () => laptop('#c9ced5', '#5f3dc4')],
  [/inspiron|pavilion|laptop/i, (i) => laptop('#8f949c', /hp/i.test(i.name) ? '#0c8599' : '#1971c2')],
  [/wh-1000|headphone/i, () => headphones('#3a3d44')],
  [/airdopes|earbuds/i, () => earbuds()],
  [/speaker|flip/i, () => speaker('#1f6fd1')],
  [/oled|tv|crystal/i, (i) => tv(/oled/i.test(i.name) ? '#c2255c' : '#1971c2')],
  [/watch/i, () => watch('#e8590c')],
  [/charger/i, () => charger()],
  [/pendrive/i, () => pendrive()],
  [/mx master|mouse/i, () => mouse()],
  // pharmacy
  [/syrup/i, () => bottle({ liquid: '#7a3e1a', cap: '#ffffff', label: '#c92a2a', text: 'SYRUP', shape: 'syrup' })],
  [/digene|gel/i, () => bottle({ liquid: '#a3d9c9', cap: '#2b8a3e', label: '#2b8a3e', text: 'ANTACID', shape: 'syrup' })],
  [/antiseptic/i, () => bottle({ liquid: '#f6f0dc', cap: '#2b8a3e', label: '#2b8a3e', text: 'ANTISEPTIC', shape: 'oil' })],
  [/spray/i, () => bottle({ liquid: '#2a6fd6', cap: '#ffffff', label: '#ffffff', text: '', shape: 'spray' }) + R(124, 150, 72, 48, 0, '#fff') + T(160, 180, 'SPRAY', 14, '#2a6fd6')],
  [/ointment|cream/i, (i) => tube(/betadine/i.test(i.name) ? '#7a3e1a' : '#e8590c', /betadine/i.test(i.name) ? 'OINTMENT' : 'CREAM')],
  [/mask/i, () => mask()],
  [/strips/i, () => box3d('#1971c2', 'STRIPS', { sub: '50 tests', band: '#ffffff' })],
  [/ors|electral/i, () => sachet('#f08c00', 'Electrolytes')],
  [/capsule|revital|becosules/i, (i) => blister(/revital/i.test(i.name) ? '#c92a2a' : '#e8590c', true, /revital/i.test(i.name) ? '#c92a2a' : '#e8590c', 'CAPSULES')],
  [/tablet|mg|dolo|crocin|azithral|augmentin|glycomet|telma|ecosprin|atorva|cetzine|allegra|alprax|shelcal|montair|thyronorm|\d/i, (i) => {
    const h = seeded(i.name)();
    const box = ['#1971c2', '#2b8a3e', '#c2255c', '#5f3dc4', '#0c8599', '#e8590c'][Math.floor(h * 6)]!;
    return blister(['#ffffff', '#f6e7b0', '#ffd0d8', '#d0e4ff'][Math.floor(h * 4)]!, false, box, i.name.split(' ')[0]!.toUpperCase().slice(0, 9));
  }],
];

export function artFor(input: ArtInput, seed: string): { svg: string; matched: boolean } {
  gid = 0;
  defs.length = 0;
  const rule = RULES.find(([re]) => re.test(input.name));
  const body = rule ? rule[1](input, seed) : box3d(input.color, input.name.split(' ')[0]!.toUpperCase().slice(0, 10));
  const bg = rg(lighten(input.color, 0.9), lighten(input.color, 0.72), 0.5, 0.4);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320"><defs>${defs.join('')}</defs>` +
    `<rect width="320" height="320" fill="${bg}"/>${C(160, 168, 132, lighten(input.color, 0.94), 'opacity=".7"')}${body}</svg>`;
  return { svg, matched: !!rule };
}
