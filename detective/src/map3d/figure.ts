// The player's detective as a 3D figure in the street (design/CHARACTERS.md, set 1c): 6.5 heads tall, an overcoat to
// the knee, a satchel strap across the chest, a small brass lantern on the belt, weight on 1 foot. Built in metres and
// scaled to the street (1 unit 0.15 m), so the detective stands as tall as the doors and lamps say a person is.
// 3 looks for the owner to choose from: `trench` (a woman), `overcoat` (a man with a moustache) and `noir`.

import { BoxGeometry, CanvasTexture, CapsuleGeometry, CylinderGeometry, DoubleSide, Group, LatheGeometry, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector2, Vector3, type BufferGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type Look = 'trench' | 'overcoat' | 'noir';
export const LOOKS: readonly Look[] = ['trench', 'overcoat', 'noir'];
/**
 * How the figure stands: at rest, mid-stride, leaning in to look closer, pointing at what they found, a hand on the
 * chin thinking it over, checking the time on a wristwatch, or reading a map held in both hands.
 */
export type Pose = 'stand' | 'walk' | 'look' | 'point' | 'think' | 'watch' | 'map';
export const POSES: readonly Pose[] = ['stand', 'walk', 'look', 'point', 'think', 'watch', 'map'];

/**
 * Each pose as joint turns, in radians: the shoulder swings (x, forward is negative), turns the arm in (y, across the
 * body is positive) and lifts it out or in (z, in is positive); the elbow bends (x).
 */
type Arm = { sx?: number; sy?: number; sz?: number; ex?: number };
const ARMS: Record<Pose, { right: Arm; left: Arm; head?: number; lean?: number }> = {
  stand: { right: {}, left: {} },
  walk: { right: { sx: -0.3 }, left: { sx: 0.3 }, lean: 0.05 },
  look: { right: { sx: -0.55, sz: 0.2, ex: -1.3 }, left: {}, head: 0.2, lean: 0.11 },
  point: { right: { sx: -1.35, sz: -0.15, ex: -0.1 }, left: {} },
  think: { right: { sx: -0.88, sy: 1.0, sz: 0.05, ex: -2.5 }, left: { sx: -0.12, sy: 1.0, ex: -1.55 }, head: 0.12 },
  watch: { right: {}, left: { sx: -0.3, sy: 1.05, sz: 0.1, ex: -1.65 }, head: 0.4 },
  map: { right: { sx: -0.45, sy: 0.4, ex: -1.25 }, left: { sx: -0.45, sy: 0.4, ex: -1.25 }, head: 0.35 },
};

type Kit = {
  coat: string;
  trousers: string;
  shoes: string;
  hat: 'fedora' | 'cap' | 'wide';
  hatColour: string;
  band: string;
  skin: string;
  hair: string;
  /** A belt tied at the waist, as a trench coat has. */
  belt: boolean;
  /** A scarf at the neck. */
  scarf?: string;
  /** The collar turned up. */
  collarUp: boolean;
  /** Gloves, or bare hands. */
  gloves?: string;
  /** A woman: narrower at the shoulder, wider at the hip, her hair in a bob to the jaw. */
  woman?: boolean;
  /** A moustache, in this colour. */
  moustache?: string;
};

/** The 3 looks. Muted colour only (CHARACTERS.md): ink, slate, olive, oxblood, ochre, cream. Brass is never worn. */
const KITS: Record<Look, Kit> = {
  // The classic: a stone trench coat, belted, a brown fedora. A woman, her black hair in a bob.
  trench: { coat: '#a8916b', trousers: '#3b3a37', shoes: '#3a2617', hat: 'fedora', hatColour: '#5a4330', band: '#2b211a', skin: '#c99a76', hair: '#151110', belt: true, collarUp: false, woman: true },
  // The street detective: a charcoal wool overcoat, an oxblood scarf, a flat cap, a moustache.
  overcoat: { coat: '#3d3f42', trousers: '#2c2b29', shoes: '#22201e', hat: 'cap', hatColour: '#5d5446', band: '#5d5446', skin: '#8d5f43', hair: '#1d1712', belt: false, scarf: '#6e2a26', collarUp: false, moustache: '#1d1712' },
  // After dark: a long ink coat with the collar up, a wide brim, leather gloves.
  noir: { coat: '#24272b', trousers: '#1e1f21', shoes: '#141414', hat: 'wide', hatColour: '#1c1d1f', band: '#3a3127', skin: '#e0b896', hair: '#5b3b25', belt: false, collarUp: true, gloves: '#2a211b' },
};

const cloth = (c: string, rough = 0.92) => new MeshStandardMaterial({ color: c, roughness: rough });
const part = (geo: BufferGeometry, m: MeshStandardMaterial, x = 0, y = 0, z = 0): Mesh => {
  const mesh = new Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};
/** A solid of turning: [radius, height] points from the bottom up, in metres. */
const lathe = (pts: Array<[number, number]>, segments = 28) => new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), segments);

/** The detective in a look, standing on the ground at the origin, facing +z (south, toward the street). */
export function detective(look: Look, pose: Pose = 'stand'): Group {
  const k = KITS[look];
  const g = new Group();
  const skin = new MeshStandardMaterial({ color: k.skin, roughness: 0.62 });
  const coat = cloth(k.coat, look === 'noir' ? 0.7 : 0.9);
  const trousers = cloth(k.trousers);
  const shoe = new MeshStandardMaterial({ color: k.shoes, roughness: 0.38, metalness: 0.05 });
  // A woman is narrower at the shoulder and wider at the hip.
  const sh = k.woman ? 0.88 : 1;
  const hp = k.woman ? 1.06 : 1;

  // Each leg hangs from a hip joint, so a pose can swing it. At rest the weight is on the left foot, the right eased
  // forward and out.
  const HIP = 0.8;
  for (const [side, fwd] of [[-1, 0], [1, 0.06]] as const) {
    const leg = new Group();
    leg.position.set(side * 0.095 * hp, HIP, fwd);
    const shin = part(new CapsuleGeometry(0.068, 0.62, 6, 14), trousers, 0, 0.44 - HIP, 0);
    shin.rotation.z = side * 0.03;
    const foot = part(new RoundedBoxGeometry(0.105, 0.075, 0.27, 3, 0.03), shoe, side * 0.005 * hp, 0.04 - HIP, 0.05);
    foot.rotation.y = side * 0.12;
    leg.add(shin, foot);
    // Mid-stride: the right leg forward, the left back.
    // Kept short enough that the coat still covers the leg behind.
    if (pose === 'walk') leg.rotation.x = side * -0.22;
    g.add(leg);
  }

  // The coat: hem at the knee, in at the waist, out over the chest, round the shoulders. Flattened front to back.
  const body = part(
    lathe([
      [0.0, 0.47],
      [0.27 * hp, 0.47],
      [0.235 * hp, 0.7],
      [0.2, 0.94],
      [0.215, 1.12],
      [0.225 * sh, 1.28],
      [0.2 * sh, 1.4],
      [0.12, 1.46],
      [0.07, 1.48],
      [0.0, 1.48],
    ]),
    coat,
  );
  body.scale.z = 0.66;
  g.add(body);
  // The opening down the front, and the buttons on it.
  const edge = cloth(shade(k.coat, -0.25));
  g.add(part(new RoundedBoxGeometry(0.018, 0.92, 0.02, 2, 0.008), edge, 0.02, 0.95, 0.15));
  for (const y of [0.98, 1.1, 1.22]) g.add(part(new SphereGeometry(0.011, 8, 6), cloth('#1c1a17', 0.5), -0.04, y, 0.15));
  if (k.belt) {
    const belt = part(new TorusGeometry(0.2, 0.018, 6, 28), cloth(shade(k.coat, -0.12)), 0, 0.95, 0);
    belt.rotation.x = Math.PI / 2;
    belt.scale.y = 0.66;
    g.add(belt);
    g.add(part(new RoundedBoxGeometry(0.05, 0.045, 0.012, 2, 0.006), cloth('#4a3b28', 0.5), 0.06, 0.95, 0.135));
  }
  // The collar: lying flat, or turned up round the jaw.
  const collar = part(lathe(k.collarUp ? [[0.075, 1.44], [0.11, 1.5], [0.13, 1.62]] : [[0.075, 1.44], [0.17, 1.42], [0.15, 1.38]], 22), coat);
  collar.scale.z = 0.8;
  collar.material = new MeshStandardMaterial({ color: k.coat, roughness: 0.9, side: DoubleSide });
  g.add(collar);
  if (k.scarf) {
    const wrap = part(new TorusGeometry(0.085, 0.035, 8, 20), cloth(k.scarf), 0, 1.47, 0);
    wrap.rotation.x = Math.PI / 2;
    g.add(wrap);
    const end = part(new RoundedBoxGeometry(0.07, 0.3, 0.025, 2, 0.01), cloth(k.scarf), 0.05, 1.3, 0.155);
    end.rotation.z = 0.06;
    g.add(end);
  }

  // Arms down, the sleeves in the coat, a little bent at the elbow; the hands bare or gloved.
  const hand = k.gloves ? new MeshStandardMaterial({ color: k.gloves, roughness: 0.45 }) : skin;
  // Each arm hangs from a shoulder joint with an elbow in it, so a pose can swing, raise or bend it.
  const SHOULDER = 1.37;
  const ELBOW = 1.07;
  const at = ARMS[pose];
  const palms: Mesh[] = [];
  for (const side of [-1, 1] as const) {
    const j = side === -1 ? at.right : at.left;
    const arm = new Group();
    const ax = side * 0.235 * sh;
    arm.position.set(ax, SHOULDER, 0);
    const upper = part(new CapsuleGeometry(0.058, 0.26, 6, 12), coat, side * 0.25 * sh - ax, 1.22 - SHOULDER, 0);
    upper.rotation.z = side * 0.12;
    const elbow = new Group();
    const exx = side * 0.272 * sh - ax;
    elbow.position.set(exx, ELBOW - SHOULDER, 0.01);
    const lower = part(new CapsuleGeometry(0.052, 0.25, 6, 12), coat, side * 0.285 * sh - ax - exx, 0.9 - ELBOW, 0.02);
    lower.rotation.x = -0.12;
    lower.rotation.z = side * 0.06;
    const palm = part(new SphereGeometry(0.048, 12, 10), hand, side * 0.29 * sh - ax - exx, 0.72 - ELBOW, 0.04);
    palm.scale.set(0.8, 1.15, 0.6);
    elbow.add(lower, palm);
    palms.push(palm);
    if (pose === 'watch' && side === 1) {
      // A wristwatch on the left wrist: a brass case and a dark strap.
      const strapW = part(new TorusGeometry(0.05, 0.008, 6, 20), new MeshStandardMaterial({ color: '#2b1d14', roughness: 0.5 }), side * 0.288 * sh - ax - exx, 0.79 - ELBOW, 0.035);
      strapW.rotation.x = Math.PI / 2;
      const face = part(new CylinderGeometry(0.018, 0.018, 0.008, 20), new MeshStandardMaterial({ color: '#c79a48', roughness: 0.3, metalness: 0.8 }), side * 0.288 * sh - ax - exx, 0.79 - ELBOW, 0.085);
      face.rotation.x = Math.PI / 2;
      elbow.add(strapW, face);
    }
    arm.add(upper, elbow);
    arm.rotation.x = j.sx ?? 0;
    arm.rotation.y = (j.sy ?? 0) * -side;
    arm.rotation.z = (j.sz ?? 0) * -side;
    elbow.rotation.x = j.ex ?? 0;
    g.add(arm);
  }
  if (pose === 'map') {
    // A folded street map held open in both hands: found where the hands are, a side resting in each palm, the
    // thumbs over its lower edge, tipped up toward the face.
    g.updateMatrixWorld(true);
    const [r, l] = palms.map((m) => m.getWorldPosition(new Vector3()));
    const width = r!.distanceTo(l!) + 0.05;
    const map = part(new BoxGeometry(width, 0.003, 0.3), new MeshStandardMaterial({ map: mapPaper(), roughness: 0.8 }), (r!.x + l!.x) / 2, (r!.y + l!.y) / 2 + 0.035, (r!.z + l!.z) / 2 + 0.01);
    map.rotation.x = -1.3;
    g.add(map);
  }

  // The satchel, worn over the coat: the bag on the front of the right hip with its flap and clasp, the strap across
  // the chest from the left shoulder, standing clear of the coat, its buttons and its front edge.
  const leather = new MeshStandardMaterial({ color: '#4a2d1b', roughness: 0.5 });
  const flapM = new MeshStandardMaterial({ color: '#3e2616', roughness: 0.45 });
  const bagX = 0.2 * hp;
  g.add(part(new RoundedBoxGeometry(0.2, 0.17, 0.06, 3, 0.018), leather, bagX, 0.84, 0.165));
  g.add(part(new RoundedBoxGeometry(0.205, 0.1, 0.012, 3, 0.006), flapM, bagX, 0.885, 0.2));
  const clasp = new MeshStandardMaterial({ color: '#b98a3c', roughness: 0.3, metalness: 0.8 });
  g.add(part(new RoundedBoxGeometry(0.03, 0.022, 0.01, 2, 0.004), clasp, bagX, 0.85, 0.208));
  // The strap: from the left shoulder down to the bag's top corner, a finger's width off the coat.
  const [sx, sy, ex, ey] = [-0.15 * sh, 1.41, bagX + 0.085, 0.92];
  const len = Math.hypot(ex - sx, ey - sy);
  const strap = part(new RoundedBoxGeometry(0.038, len, 0.014, 2, 0.006), leather, (sx + ex) / 2, (sy + ey) / 2, 0.172);
  strap.rotation.z = Math.atan2(ex - sx, -(ey - sy));
  g.add(strap);
  // A brass buckle on the strap at the chest.
  const t = 0.3;
  g.add(part(new TorusGeometry(0.016, 0.0035, 6, 4), clasp, sx + (ex - sx) * t, sy + (ey - sy) * t, 0.182));
  // A small brass lantern hooked on the left of the belt.
  const brass = new MeshStandardMaterial({ color: '#b98a3c', roughness: 0.3, metalness: 0.8 });
  g.add(part(new CylinderGeometry(0.03, 0.035, 0.08, 10), brass, -0.2, 0.86, 0.11));
  g.add(part(new SphereGeometry(0.022, 10, 8), new MeshStandardMaterial({ color: '#f4d79a', emissive: '#e8b65a', emissiveIntensity: 0.6, roughness: 0.4 }), -0.2, 0.86, 0.11));

  // The neck and the head: a calm face, a nose, ears, the hair under the hat. All of it on a neck joint.
  const headFrom = g.children.length;
  g.add(part(new CylinderGeometry(0.048, 0.055, 0.1, 14), skin, 0, 1.52, 0));
  const head = part(new SphereGeometry(0.1, 28, 22), skin, 0, 1.64, 0.005);
  head.scale.set(0.88, 1.12, 0.98);
  g.add(head);
  const nose = part(new SphereGeometry(0.019, 10, 8), skin, 0, 1.635, 0.098);
  nose.scale.set(0.85, 1.3, 1.1);
  g.add(nose);
  for (const side of [-1, 1] as const) {
    const ear = part(new SphereGeometry(0.02, 10, 8), skin, side * 0.087, 1.645, -0.005);
    ear.scale.set(0.5, 1.2, 0.9);
    const eye = part(new SphereGeometry(0.0105, 10, 8), new MeshStandardMaterial({ color: '#1d1a17', roughness: 0.25 }), side * 0.034, 1.665, 0.088);
    const brow = part(new RoundedBoxGeometry(0.035, 0.008, 0.01, 1, 0.003), cloth(k.hair), side * 0.035, 1.69, 0.09);
    brow.rotation.z = side * -0.12;
    g.add(ear, eye, brow);
  }
  const mouth = part(new RoundedBoxGeometry(0.034, 0.006, 0.008, 1, 0.002), new MeshStandardMaterial({ color: shade(k.skin, -0.35), roughness: 0.6 }), 0, 1.6, 0.09);
  g.add(mouth);
  const hair = part(new SphereGeometry(0.103, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), cloth(k.hair, 0.8), 0, 1.655, -0.012);
  hair.scale.set(0.92, 1.05, 1.02);
  g.add(hair);
  if (k.woman) {
    // The bob: hair falling to the jaw at the sides and back, open at the face (a sphere's angle π/2 faces +z).
    const bob = part(new SphereGeometry(0.108, 28, 18, Math.PI * 0.8, Math.PI * 1.4, Math.PI * 0.2, Math.PI * 0.55), new MeshStandardMaterial({ color: k.hair, roughness: 0.75, side: DoubleSide }), 0, 1.64, -0.008);
    bob.scale.set(0.95, 1.12, 1.02);
    g.add(bob);
  }
  if (k.moustache) {
    // A moustache over the lip: 2 short trimmed sweeps meeting under the nose.
    for (const side of [-1, 1] as const) {
      const m = part(new CapsuleGeometry(0.0075, 0.024, 6, 10), cloth(k.moustache, 0.85), side * 0.015, 1.612, 0.093);
      m.rotation.z = side * (Math.PI / 2 - 0.3);
      m.scale.z = 0.7;
      g.add(m);
    }
  }

  g.add(hat(k));
  const NECK = 1.49;
  const headG = new Group();
  headG.position.set(0, NECK, 0);
  for (const c of g.children.splice(headFrom)) {
    c.position.y -= NECK;
    headG.add(c);
  }
  headG.rotation.x = at.head ?? 0;
  g.add(headG);
  // The figure leans a little forward, as if about to look closer; further when they do.
  g.rotation.x = at.lean ?? 0.03;
  g.scale.setScalar(1 / 0.15);
  return g;
}

function hat(k: Kit): Group {
  const h = new Group();
  const felt = cloth(k.hatColour, 0.85);
  if (k.hat === 'cap') {
    // A flat cap: a soft crown pulled forward, a short peak.
    const crown = part(new SphereGeometry(0.115, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), felt, 0, 1.71, 0.01);
    crown.scale.set(1, 0.42, 1.12);
    const peak = part(new CylinderGeometry(0.1, 0.1, 0.012, 24, 1, false, -Math.PI / 2, Math.PI), felt, 0, 1.712, 0.05);
    peak.scale.z = 0.7;
    h.add(crown, peak);
    return h;
  }
  const brim = k.hat === 'wide' ? 0.2 : 0.165;
  h.add(part(new CylinderGeometry(brim, brim, 0.012, 32), felt, 0, 1.72, 0));
  // The crown, pinched at the front as a fedora's is, with its band.
  const crown = part(lathe([[0.0, 1.72], [0.098, 1.72], [0.094, 1.8], [0.08, 1.84], [0.0, 1.835]], 28), felt);
  crown.scale.z = 0.92;
  h.add(crown);
  h.add(part(new CylinderGeometry(0.099, 0.099, 0.028, 28, 1, true), cloth(k.band, 0.6), 0, 1.74, 0));
  return h;
}

/** A colour a share lighter (+) or darker (-). */
function shade(hex: string, by: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, by >= 0 ? v + (255 - v) * by : v * (1 + by))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
}

/** The street map: cream paper, the roads and blocks inked on it, a fold down the middle. */
function mapPaper(): CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 184;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#efe6d2';
  c.fillRect(0, 0, 256, 184);
  c.strokeStyle = '#8a7b62';
  c.lineWidth = 6;
  for (const [x0, y0, x1, y1] of [[0, 110, 256, 110], [70, 0, 70, 184], [180, 0, 190, 184]] as const) {
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  }
  c.fillStyle = '#c9b996';
  for (const [x, y, w, h] of [[16, 30, 40, 60], [86, 24, 80, 70], [86, 124, 60, 46], [200, 130, 44, 40]] as const) c.fillRect(x, y, w, h);
  c.fillStyle = '#9c3a2c';
  c.beginPath();
  c.arc(120, 60, 7, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.18)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(128, 0);
  c.lineTo(128, 184);
  c.stroke();
  return new CanvasTexture(cv);
}
