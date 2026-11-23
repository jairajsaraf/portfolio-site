// Shared layout for the Iceberg gate assembly. The SVG poster and the WebGL scene
// both read a Geo, so the poster is a true frame of the 3D piece.
// Two geometries share one set of shapes: `wide` (1060 x 276, a left-to-right line) and
// `narrow` (320 wide, a column), so the labels stay legible below 1140 px.
// Units are poster pixels. The camera is orthographic at elevation asin(1/3) looking at
// the origin; boxes are turned 45 degrees about y, so every box shows as the same
// diamond-topped block in both renderers.

export const SIN = 1 / 3;
export const COS = Math.sqrt(8) / 3;

export const MAX_SLABS = 6;
export const START_SLABS = 4;

/** What the scene shows. */
/** `ask` is the recorded read question; `refuse` is the recorded delete request, which stops at the empty socket. */
export type Scene = 'clean' | 'bad' | 'ask' | 'refuse';
/**
 * `last` is what the scene shows; `pressed` is which button the user last pressed (nothing on load and
 * after Start over). They are separate on purpose.
 * INITIAL is the poster frame (no JS, reduced motion, no WebGL, before mount): a bad batch stopped at the gate.
 * NEUTRAL is where the live 3D scene starts and resets to: four slabs, no red batch.
 */
export type GateState = { slabs: number; last: Scene | 'idle'; pressed: Scene | null };
export const INITIAL: GateState = { slabs: START_SLABS, last: 'bad', pressed: null };
export const NEUTRAL: GateState = { slabs: START_SLABS, last: 'idle', pressed: null };
/** The state to show when the live scene is up: nothing pressed means neutral, else what was pressed. */
export const forLive = (s: GateState): GateState => (s.pressed === null ? NEUTRAL : s);

export function next(s: GateState, action: Scene): GateState {
  if (action === 'clean') return { slabs: Math.min(s.slabs + 1, MAX_SLABS), last: 'clean', pressed: 'clean' };
  return { slabs: s.slabs, last: action, pressed: action };
}

export type P = [number, number];
export type Label = {
  lines: string[];
  x: number;
  y: number;
  anchor?: 'middle' | 'end';
  cls?: 'm' | 'r';
  /** Only while the bad batch sits stopped at the gate. */
  stoppedOnly?: boolean;
  /** The socket's "no write tool" label: full ink while a question plays. */
  socket?: boolean;
};

export type Geo = {
  id: 'wide' | 'narrow';
  W: number;
  H: number;
  batch: { side: number; h: number };
  /** The small ink block that carries a question from the agent. */
  pulse: { side: number; h: number };
  slab: { side: number; h: number; pitch: number };
  box: { side: number; h: number };
  post: { side: number; h: number };
  socket: { x: number; y: number; side: number };
  start: P; // waiting batch: x, ground y
  stop: P; // stopped red batch
  gate: { x: number; top: number; bot: number };
  stack: P;
  api: P;
  agent: P;
  /** Lift of the travelling batch above the slab it will land on, in world units. */
  hover: number;
  tracks: { pre: P[]; mid: P[]; toApi: P[]; toAgent: P[]; bad: P[]; rail: P[]; stem: P[] };
  read: (n: number) => P[];
  /** The delete request's path: down the stem from the agent to the middle of the empty socket. */
  refuse: P[];
  labels: Label[];
};

export const half = (side: number) => side * Math.SQRT1_2;
const slabTop = (main: number, n: number, pitch: number, h: number) => main - ((n - 1) * pitch + h) * COS;

function wideGeo(): Geo {
  const MAIN = 150;
  const BAD = 222;
  const batch = { side: 56, h: 24 };
  const slab = { side: 113, h: 14, pitch: 22 };
  const box = { side: 70, h: 70 };
  const post = { side: 10, h: 56 };
  const socket = { x: 970, y: 216, side: 40 };
  const [START_X, STOP_X, GATE_X, STACK_X, API_X, AGENT_X] = [84, 236, 320, 550, 770, 970];
  const GATE_TOP = 64;
  const GATE_BOT = 236;
  const READ_Y = 112;
  const nameY = MAIN - box.h * COS - 44; // 8 units higher than before: "GET only" and "LangChain" touched the cube edge
  return {
    id: 'wide',
    W: 1060,
    H: 276,
    batch,
    pulse: { side: 24, h: 10 },
    slab,
    box,
    post,
    socket,
    start: [START_X, MAIN],
    stop: [STOP_X, BAD],
    gate: { x: GATE_X, top: GATE_TOP, bot: GATE_BOT },
    stack: [STACK_X, MAIN],
    api: [API_X, MAIN],
    agent: [AGENT_X, MAIN],
    hover: 6, // 30 clipped the travelling batch at the canvas top on the 5 to 6 step
    tracks: {
      pre: [[START_X + half(batch.side) + 6, MAIN], [GATE_X, MAIN]],
      mid: [[GATE_X, MAIN], [STACK_X - half(slab.side), MAIN]],
      toApi: [[STACK_X + half(slab.side), MAIN], [API_X - half(box.side), MAIN]],
      toAgent: [[API_X + half(box.side), MAIN], [AGENT_X - half(box.side), MAIN]],
      bad: [[START_X + half(batch.side) + 6, BAD], [GATE_X, BAD]],
      rail: [[GATE_X, GATE_TOP], [GATE_X, GATE_BOT]],
      stem: [[AGENT_X, MAIN + half(box.side) * SIN + 6], [AGENT_X, socket.y - half(socket.side) * SIN]],
    },
    // agent, through the read API, into the top slab
    read: (n) => [[AGENT_X, READ_Y], [STACK_X, READ_Y], [STACK_X, slabTop(MAIN, n, slab.pitch, slab.h)]],
    refuse: [[AGENT_X, MAIN + half(box.side) * SIN + 6], [socket.x, socket.y]],
    labels: [
      { lines: ['batches'], x: START_X, y: MAIN - batch.h * COS - 28, anchor: 'middle' },
      { lines: ['DQ gate'], x: GATE_X + 14, y: MAIN - 12 },
      { lines: ['Iceberg snapshots'], x: STACK_X, y: MAIN + half(slab.side) * SIN + 26, anchor: 'middle' },
      { lines: ['read API'], x: API_X, y: nameY, anchor: 'middle' },
      { lines: ['GET only'], x: API_X, y: nameY + 16, anchor: 'middle', cls: 'm' },
      { lines: ['agent'], x: AGENT_X, y: nameY, anchor: 'middle' },
      { lines: ['LangChain'], x: AGENT_X, y: nameY + 16, anchor: 'middle', cls: 'm' },
      { lines: ['read only: no write tool'], x: socket.x + 30, y: socket.y + 34, anchor: 'end', cls: 'm', socket: true },
      { lines: ['Stopped at the gate ·', 'nothing written'], x: GATE_X - 14, y: BAD + 32, anchor: 'end', cls: 'r', stoppedOnly: true },
    ],
  };
}

function narrowGeo(): Geo {
  const MAIN = 176;
  const BAD = 232;
  const batch = { side: 48, h: 20 };
  const slab = { side: 84, h: 14, pitch: 22 };
  const box = { side: 56, h: 40 };
  const post = { side: 8, h: 48 };
  const COL = 258; // stack, read API and agent share one column
  const API_Y = 322;
  const AGENT_Y = 424;
  const socket = { x: COL, y: 478, side: 36 };
  const [START_X, STOP_X, GATE_X] = [40, 76, 128];
  const GATE_TOP = MAIN - 78;
  const GATE_BOT = BAD + 14;
  const silTop = box.h * COS + half(box.side) * SIN; // box silhouette above its ground point
  const boxBot = half(box.side) * SIN;
  const readX = COL + 28;
  const side = COL - half(box.side) - 10;
  return {
    id: 'narrow',
    W: 320,
    H: 504,
    batch,
    pulse: { side: 20, h: 9 },
    slab,
    box,
    post,
    socket,
    start: [START_X, MAIN],
    stop: [STOP_X, BAD],
    gate: { x: GATE_X, top: GATE_TOP, bot: GATE_BOT },
    stack: [COL, MAIN],
    api: [COL, API_Y],
    agent: [COL, AGENT_Y],
    hover: 6,
    tracks: {
      pre: [[START_X + half(batch.side) + 6, MAIN], [GATE_X, MAIN]],
      mid: [[GATE_X, MAIN], [COL - half(slab.side), MAIN]],
      toApi: [[COL, MAIN + half(slab.side) * SIN + 6], [COL, API_Y - silTop - 6]],
      toAgent: [[COL, API_Y + boxBot + 6], [COL, AGENT_Y - silTop - 6]],
      bad: [[START_X + half(batch.side) + 6, BAD], [GATE_X, BAD]],
      rail: [[GATE_X, GATE_TOP], [GATE_X, GATE_BOT]],
      stem: [[COL, AGENT_Y + boxBot + 6], [COL, socket.y - half(socket.side) * SIN]],
    },
    // agent, up through the read API, into the top slab
    read: (n) => [[readX, AGENT_Y - 20], [readX, slabTop(MAIN, n, slab.pitch, slab.h)]],
    refuse: [[COL, AGENT_Y + boxBot + 6], [socket.x, socket.y]],
    labels: [
      { lines: ['batches'], x: START_X, y: MAIN - batch.h * COS - 28, anchor: 'middle' },
      { lines: ['DQ gate'], x: GATE_X, y: GATE_TOP - post.h * COS - 12, anchor: 'middle' },
      { lines: ['Iceberg snapshots'], x: 316, y: 20, anchor: 'end' },
      { lines: ['read API'], x: side, y: API_Y - 22, anchor: 'end' },
      { lines: ['GET only'], x: side, y: API_Y - 5, anchor: 'end', cls: 'm' },
      { lines: ['agent'], x: side, y: AGENT_Y - 22, anchor: 'end' },
      { lines: ['LangChain'], x: side, y: AGENT_Y - 5, anchor: 'end', cls: 'm' },
      { lines: ['read only:', 'no write tool'], x: socket.x - half(socket.side) - 10, y: socket.y - 2, anchor: 'end', cls: 'm', socket: true },
      { lines: ['Stopped at the gate ·', 'nothing written'], x: 4, y: BAD + 32, cls: 'r', stoppedOnly: true },
    ],
  };
}

export const GEOS = { wide: wideGeo(), narrow: narrowGeo() } as const;

/** The CSS custom properties the WebGL scene reads (app/globals.css); the SVG poster uses them directly. */
export const TOKEN_NAMES = [
  'ink',
  'sheet',
  'grid',
  'red',
  'face-top',
  'face-left',
  'face-right',
  'red-top',
  'red-left',
  'red-right',
] as const;
export type Colors = Record<(typeof TOKEN_NAMES)[number], string>;

/** poster px (screen x, ground y, lift) -> world coordinates of the ortho camera */
export const toWorld = (g: Geo, sx: number, sy: number, lift = 0): [number, number, number] => [
  sx - g.W / 2,
  lift,
  (sy - g.H / 2) / SIN,
];
