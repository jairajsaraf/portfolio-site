'use client';

// PropTalk, SQL mode, drawn as layers the query falls through: question, model, text guard, SQLite engine,
// chart and table, in the site's own tokens (sheet ground, ink strokes, mono labels). From 1140 px up the layers are
// slabs in the RTDP poster's projection (owner's pick, 2026-11-23); below, a flat column of boxes, where lines are
// drawn before boxes (a box hides the part of a line that passes through it).
//
// Two views, one switch (W3-B, prompt 16):
// - Guard on (the server-rendered and no-JS state): the eight attack cases of the first repetition, each ending
//   where PropTalk's results/eval_report.json (0e0a8469; trials[], mode sql, rep 0, `outcome`) says it ended:
//   a07 refused by the model; a01, a02, a05, a06 blocked_validator (the guard); a03, a04, a08 executed, no harm.
//   No case was stopped by the engine. All 24 trials ran through the guard and the engine (evals/run_eval.py
//   run_trial -> run_code), so "0 of 24" sits on this view only.
// - Guard bypassed: the eval lines go, the guard is drawn dashed, and one line stands for the engine tests that
//   skip the guard (tests/test_sqlite_backend.py). Drawn as one line, so it claims no count.
// Motion docs read: motion.dev/docs/react, /react-accessibility, /react-svg-animation, /react-use-reduced-motion.

import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

const TITLE = 'How PropTalk answers a question in SQL mode';
const DESC =
  "The question goes to the model, which returns SQL. The SQL passes a text guard, then runs in an in-memory SQLite engine that enforces its own rules, and the answer comes back as a chart and a table. Dashed lines mark the attack cases from the first repetition: each ends at the model, which refused it, at the guard, which rejected its SQL, or as a plain SELECT that did no harm. With the guard bypassed, the guard is drawn dashed and the test suite's attacks go straight to the engine, whose rules stop them.";

const LIVE = {
  on: 'Guard on: the attack cases end at the model, at the guard, or as plain SELECTs that did no harm.',
  bypassed: "Guard bypassed: the test suite's attacks go straight to the engine, and its rules stop them.",
} as const;

type View = keyof typeof LIVE;
type Row = { y: number; h: number };
type Geo = {
  id: string;
  W: number;
  H: number;
  x0: number; // boxes' left edge
  x1: number; // boxes' right edge
  q: Row;
  m: Row;
  g: Row;
  e: Row;
  c: Row;
  A: number; // the answered question's line
  atk: number[]; // the eight attack lines, left to right: refused, 4 at the guard, 3 executed
  test: { x: number; from: number; label: string[] }; // the bypass line: starts at `from`, beside its label, on the gap row above the guard
  tick: number; // half width of a stop mark
  lx: number; // gap labels' x
  guard: string[];
  engine: string[];
  side: { x: number; engine: [number, number]; chart: [number, number] }; // engine and chart notes: x, two baselines
};

const STOP = 8; // a stopped line ends this far above the box that stopped it

const NARROW: Geo = {
  id: 'ptn',
  W: 320,
  H: 610,
  x0: 8,
  x1: 312,
  q: { y: 8, h: 40 },
  m: { y: 84, h: 40 },
  g: { y: 172, h: 118 },
  e: { y: 326, h: 136 },
  c: { y: 516, h: 40 },
  A: 226,
  atk: [238, 248, 258, 268, 278, 288, 298, 308],
  test: { x: 196, from: 140, label: ['test suite,', 'guard bypassed'] },
  tick: 5, // lines 10 apart: the four guard marks join into one bar
  lx: 8,
  guard: ['SELECT only', 'keyword blocklist', 'table allowlist', 'row cap'],
  engine: ['in-memory', 'authorizer allowlist', 'PRAGMA query_only', '5-second time budget', '10,000-row cap'],
  side: { x: 8, engine: [482, 500], chart: [580, 598] },
};

const bottom = (r: Row) => r.y + r.h;
const gapMid = (a: Row, b: Row) => (bottom(a) + b.y) / 2 + 4; // a label's baseline, centred in the gap

function Box({ g, r, name, lines = [], className }: { g: Geo; r: Row; name: string; lines?: string[]; className?: string }) {
  return (
    <g className={className}>
      <rect className="dg-node" x={g.x0} y={r.y} width={g.x1 - g.x0} height={r.h} />
      <text x={g.x0 + 14} y={r.y + 26}>
        {name}
      </text>
      {lines.map((t, i) => (
        <text key={t} className="m" x={g.x0 + 14} y={r.y + 48 + i * 18}>
          {t}
        </text>
      ))}
    </g>
  );
}

function Diagram({ g }: { g: Geo }) {
  const { q, m, g: gd, e, c } = g;
  const start = bottom(q);
  const ends = [m.y - STOP, gd.y - STOP, gd.y - STOP, gd.y - STOP, gd.y - STOP, c.y, c.y, c.y];
  const testEnd = e.y - STOP;
  const labelY = gapMid(m, gd) - (g.test.label.length - 1) * 8; // first baseline of the bypass label
  const testY = labelY - 4;
  return (
    <svg className="dg narrow" viewBox={`0 0 ${g.W} ${g.H}`} role="img" aria-labelledby={`${g.id}-title ${g.id}-desc`}>
      <title id={`${g.id}-title`}>{TITLE}</title>
      <desc id={`${g.id}-desc`}>{DESC}</desc>
      <defs>
        <marker id={`${g.id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path className="dg-arrow" d="M1 1L9 5L1 9" />
        </marker>
        {/* The draw-in and the bypass line are revealed top to bottom by scaling these rects (JS only). */}
        <clipPath id={`${g.id}-reveal`} clipPathUnits="userSpaceOnUse">
          <rect className="dg-reveal" x="0" y="0" width={g.W} height={g.H} />
        </clipPath>
        <clipPath id={`${g.id}-reveal-test`} clipPathUnits="userSpaceOnUse">
          <rect className="dg-reveal-test" x="0" y={testY - 16} width={g.W} height={testEnd - testY + 24} />
        </clipPath>
      </defs>

      {/* lines first, boxes after */}
      <g className="dg-link" markerEnd={`url(#${g.id}-arrow)`}>
        <path d={`M${g.A} ${bottom(q)}V${m.y}`} />
        <path d={`M${g.A} ${bottom(m)}V${gd.y}`} />
        <path d={`M${g.A} ${bottom(gd)}V${e.y}`} />
        <path d={`M${g.A} ${bottom(e)}V${c.y}`} />
      </g>

      <g className="dg-eval" clipPath={`url(#${g.id}-reveal)`}>
        {g.atk.map((x, i) => (
          <path key={x} className="dg-attack" d={`M${x} ${start}V${ends[i]}`} />
        ))}
        {g.atk.slice(0, 5).map((x, i) => (
          <path key={x} className="dg-stop" d={`M${x - g.tick} ${ends[i]}H${x + g.tick}`} />
        ))}
        <text className="r" x={g.lx} y={gapMid(q, m)}>
          refused by the model
        </text>
        <text className="r" x={g.lx} y={gapMid(m, gd)}>
          rejected by the guard
        </text>
      </g>

      <g className="dg-test" clipPath={`url(#${g.id}-reveal-test)`}>
        <path className="dg-attack heavy" d={`M${g.test.from} ${testY}H${g.test.x}V${testEnd}`} />
        <path className="dg-stop" d={`M${g.test.x - g.tick - 2} ${testEnd}H${g.test.x + g.tick + 2}`} />
        {g.test.label.map((t, i) => (
          <text key={t} className="m" x={g.lx} y={labelY + i * 16}>
            {t}
          </text>
        ))}
      </g>

      <Box g={g} r={q} name="question" />
      <text className="r dg-eval-note" x={Math.min(g.atk[7], g.x1 - 12)} y={q.y + 26} textAnchor="end">
        attack cases
      </text>
      <Box g={g} r={m} name="model" />
      <Box g={g} r={gd} name="text guard" lines={g.guard} className="dg-guard" />
      <Box g={g} r={e} name="SQLite engine" lines={g.engine} />
      <Box g={g} r={c} name="chart and table" />

      <text className="m" x={g.side.x} y={g.side.engine[0]}>
        engine rules hold even
      </text>
      <text className="m" x={g.side.x} y={g.side.engine[1]}>
        with the guard bypassed
      </text>
      <g className="dg-eval-note">
        <text className="m" x={g.side.x} y={g.side.chart[0]}>
          ran as plain SELECTs, no harm
        </text>
        <text className="m" x={g.side.x} y={g.side.chart[1]}>
          0 of 24 attack trials did harm
        </text>
      </g>
    </svg>
  );
}

// ---------- Wide layout: the five layers as slabs in the RTDP poster's projection ----------
// A slab's top face is a rectangle on the ground plane: `a` units along the axis that runs up-right, `b` along the
// one that runs down-right (screen slopes -1/3 and +1/3, the poster's SIN). Painted bottom slab first: each line
// segment rises from a slab's top to the underside of the slab above, which is then painted over its upper end.
const PL = { xL: 450, y0: 128, pitch: 96, a: 300, b: 80, T: 12, V: 40 };
const PL_NAMES: [string, string[]][] = [
  ['question', []],
  ['model', []],
  ['text guard', ['SELECT only, keyword blocklist,', 'table allowlist, row cap']],
  ['SQLite engine', ['in-memory, authorizer allowlist,', 'PRAGMA query_only, 5-second', 'time budget, 10,000-row cap']],
  ['chart and table', []],
];
const PL_ANSWER = 40; // u of the answered question's line
const PL_ATK = [90, 112, 134, 156, 178, 200, 222, 244]; // u of the attack lines: refused, 4 at the guard, 3 executed
const PL_END = [1, 2, 2, 2, 2, 4, 4, 4]; // the slab each attack line ends on
const PL_TEST = 200;

const plY = (k: number) => PL.y0 + k * PL.pitch; // the slab's left corner, top face
const pt = (k: number, u: number): [number, number] => [PL.xL + u + PL.V, plY(k) - u / 3 + PL.V / 3];

function Slab({ k, guard }: { k: number; guard?: boolean }) {
  const { xL, a, b, T } = PL;
  const y = plY(k);
  const L: [number, number] = [xL, y];
  const B: [number, number] = [xL + a, y - a / 3];
  const R: [number, number] = [xL + a + b, y - a / 3 + b / 3];
  const F: [number, number] = [xL + b, y + b / 3];
  const p = (pts: [number, number][]) => `M${pts.map((q) => q.join(' ')).join('L')}Z`;
  const down = (q: [number, number]): [number, number] => [q[0], q[1] + T];
  return (
    <g className={guard ? 'dg-guard' : undefined}>
      <path className="p-edge f-left-plain" d={p([L, F, down(F), down(L)])} />
      <path className="p-edge f-right-plain" d={p([F, R, down(R), down(F)])} />
      <path className="p-edge f-top-plain" d={p([L, B, R, F])} />
    </g>
  );
}

function Plates() {
  const clip = 'url(#ptw-reveal)';
  const seg = (k: number, u: number) => {
    const [x, top] = pt(k, u);
    return `M${x} ${pt(k - 1, u)[1] + PL.T}V${top}`;
  };
  const tick = (k: number, u: number) => {
    const [x, y] = pt(k, u);
    return `M${x - 7} ${y + 2.3}L${x + 7} ${y - 2.3}`;
  };
  const [tx, tTop] = pt(3, PL_TEST);
  const testY = plY(2) - 70;
  const R = 856; // the right-hand notes
  const H = plY(4) + PL.b / 3 + PL.T + 16;
  const slabs = [4, 3, 2, 1, 0];
  return (
    <svg className="dg wide" viewBox={`0 0 1060 ${H}`} role="img" aria-labelledby="ptw-title ptw-desc">
      <title id="ptw-title">{TITLE}</title>
      <desc id="ptw-desc">{DESC}</desc>
      <defs>
        <marker id="ptw-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path className="dg-arrow" d="M1 1L9 5L1 9" />
        </marker>
        <clipPath id="ptw-reveal" clipPathUnits="userSpaceOnUse">
          <rect className="dg-reveal" x="0" y="0" width="1060" height={H} />
        </clipPath>
        <clipPath id="ptw-reveal-test" clipPathUnits="userSpaceOnUse">
          <rect className="dg-reveal-test" x="0" y={testY - 16} width="1060" height={tTop - testY + 24} />
        </clipPath>
      </defs>

      {slabs.map((k) => (
        <g key={k}>
          <Slab k={k} guard={k === 2} />
          {k > 0 && (
            <>
              <path className="dg-link" d={seg(k, PL_ANSWER)} markerEnd="url(#ptw-arrow)" />
              <g className="dg-eval" clipPath={clip}>
                {PL_ATK.map((u, i) => (PL_END[i] >= k ? <path key={u} className="dg-attack" d={seg(k, u)} /> : null))}
                {PL_ATK.map((u, i) => (PL_END[i] === k && k < 4 ? <path key={u} className="dg-stop" d={tick(k, u)} /> : null))}
              </g>
            </>
          )}
        </g>
      ))}

      {PL_NAMES.map(([name, lines], k) => (
        <g key={name}>
          <text x="24" y={plY(k) - 30}>
            {name}
          </text>
          {lines.map((t, i) => (
            <text key={t} className="m" x="24" y={plY(k) - 12 + i * 18}>
              {t}
            </text>
          ))}
        </g>
      ))}

      <g className="dg-eval" clipPath={clip}>
        <text className="r" x={R} y={pt(1, PL_ATK[0])[1] + 4}>
          refused by the model
        </text>
        <text className="r" x={R} y={pt(2, PL_ATK[2])[1] + 4}>
          rejected by the guard
        </text>
      </g>
      <text className="r dg-eval-note" x={R} y={plY(0) - 40}>
        attack cases
      </text>
      <text className="m" x={R} y={plY(3) - 36}>
        engine rules hold even
      </text>
      <text className="m" x={R} y={plY(3) - 18}>
        with the guard bypassed
      </text>
      <g className="dg-eval-note">
        <text className="m" x={R} y={plY(4) - 52}>
          ran as plain SELECTs,
        </text>
        <text className="m" x={R} y={plY(4) - 34}>
          no harm
        </text>
        <text className="m" x={R} y={plY(4) - 6}>
          0 of 24 attack trials
        </text>
        <text className="m" x={R} y={plY(4) + 12}>
          did harm
        </text>
      </g>

      <g className="dg-test" clipPath="url(#ptw-reveal-test)">
        <path className="dg-attack heavy" d={`M${R - 10} ${testY}H${tx}V${tTop}`} />
        <path className="dg-stop" d={tick(3, PL_TEST)} />
        <text className="m" x={R} y={testY + 4}>
          test suite,
        </text>
        <text className="m" x={R} y={testY + 22}>
          guard bypassed
        </text>
      </g>
    </svg>
  );
}

export function PropTalkDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>('on');
  const [said, setSaid] = useState('');

  // First view: the attack lines fall from the question and stop where the report says. Skipped with reduced
  // motion, and when the head script has marked the page "still" (slow JS): the CSS then shows the end state.
  useEffect(() => {
    const root = ref.current;
    if (!inView || !root || reduce || document.documentElement.classList.contains('still')) return;
    const rects = Array.from(root.querySelectorAll<SVGElement>('.dg-reveal'));
    animate(rects, { scaleY: [0, 1] }, { duration: 1.4, ease: 'easeOut' }).then(() =>
      rects.forEach((r) => (r.style.transform = 'none')),
    );
  }, [inView, reduce]);

  const pick = (v: View) => {
    if (v === view) return;
    setView(v);
    setSaid(LIVE[v]);
    const root = ref.current;
    if (v === 'bypassed' && root && !reduce) {
      const rects = Array.from(root.querySelectorAll<SVGElement>('.dg-reveal-test'));
      animate(rects, { scaleY: [0, 1] }, { duration: 0.6, ease: 'easeOut' });
    }
  };

  return (
    <div className="ptd" ref={ref} data-view={view}>
      <div className="controls" role="group" aria-label="Diagram view">
        <button type="button" aria-pressed={view === 'on'} onClick={() => pick('on')}>
          Guard on
        </button>
        <button type="button" aria-pressed={view === 'bypassed'} onClick={() => pick('bypassed')}>
          Guard bypassed
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
      <div className="dg-wrap wide">
        <Plates />
      </div>
      <div className="dg-wrap narrow">
        <Diagram g={NARROW} />
      </div>
    </div>
  );
}
