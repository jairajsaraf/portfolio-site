// PropTalk, SQL mode: question, model, text guard, SQLite engine, chart and table.
// Drawn in the site's own tokens (sheet ground, ink strokes, mono labels), following the
// diagram-design rules: orthogonal connectors only, labels off their strokes, arrows drawn
// before boxes. Every label is copied from content.md.
// Two layouts with the same labels: a line (1060 wide) from 1140 px up, a column (320 wide)
// below. CSS hides the inactive one with display:none, so a screen reader gets one copy.

const TITLE = 'How PropTalk answers a question in SQL mode';
const DESC =
  'The question goes to the model, which returns SQL. The SQL passes a text guard, then runs in an in-memory SQLite engine that enforces its own rules, and the answer comes back as a chart and a table. A dashed line marks the attack cases, which meet the guard first, and a red mark shows where they stop. The engine rules hold even with the guard bypassed.';

type NodeProps = { x: number; y: number; w: number; h: number; name: string; lines?: string[] };

/** A box with its name at the top left and mono sublabels under it. */
function Node({ x, y, w, h, name, lines = [] }: NodeProps) {
  return (
    <g>
      <rect className="dg-node" x={x} y={y} width={w} height={h} />
      <text x={x + 14} y={y + 26}>
        {name}
      </text>
      {lines.map((t, i) => (
        <text key={t} className="m" x={x + 14} y={y + 48 + i * 18}>
          {t}
        </text>
      ))}
    </g>
  );
}

const GUARD = ['SELECT only', 'keyword blocklist', 'table allowlist', 'row cap'];
const ENGINE = ['in-memory', 'authorizer allowlist', 'PRAGMA query_only', '5-second time budget', '10,000-row cap'];

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
        <path className="dg-arrow" d="M1 1L9 5L1 9" />
      </marker>
    </defs>
  );
}

function Wide() {
  const Y = 120; // main flow line
  const H = 150;
  const TOP = Y - H / 2;
  return (
    <svg
      className="dg wide"
      viewBox="0 0 1060 300"
      role="img"
      aria-labelledby="ptw-title ptw-desc"
    >
      <title id="ptw-title">{TITLE}</title>
      <desc id="ptw-desc">{DESC}</desc>
      <Defs id="ptw" />

      {/* connectors first, boxes after */}
      <g className="dg-link" markerEnd="url(#ptw-arrow)">
        <path d={`M144 ${Y}H198`} />
        <path d={`M328 ${Y}H382`} />
        <path d={`M572 ${Y}H626`} />
        <path d={`M816 ${Y}H870`} />
      </g>
      {/* the attack path: out of the model, under the guard, stopped at its underside */}
      <path className="dg-attack" d={`M263 ${Y + 32}V244H477V${TOP + H + 10}`} />
      <path className="dg-stop" d={`M465 ${TOP + H + 10}H489`} />

      <Node x={24} y={Y - 32} w={120} h={64} name="question" />
      <Node x={198} y={Y - 32} w={130} h={64} name="model" />
      <Node x={382} y={TOP} w={190} h={H} name="text guard" lines={GUARD} />
      <Node x={626} y={TOP} w={190} h={H} name="SQLite engine" lines={ENGINE} />
      <Node x={870} y={Y - 32} w={166} h={64} name="chart and table" />

      <text className="r" x={370} y="268" textAnchor="middle">
        attack cases
      </text>
      <text className="m" x={370} y="286" textAnchor="middle">
        0 of 24 attack trials did harm
      </text>
      <text className="m" x={721} y={TOP + H + 26} textAnchor="middle">
        engine rules hold even
      </text>
      <text className="m" x={721} y={TOP + H + 44} textAnchor="middle">
        with the guard bypassed
      </text>
    </svg>
  );
}

function Narrow() {
  const X = 8;
  const A = 48; // the arrows' column
  const q = { y: 8, h: 40 };
  const m = { y: 72, h: 60 };
  const g = { y: 160, h: 118 };
  const e = { y: 302, h: 136 };
  const c = { y: 490, h: 40 };
  const midG = g.y + g.h / 2;
  const runY = m.y + 54; // the attack path leaves the model low, under its label
  return (
    <svg
      className="dg narrow"
      viewBox="0 0 320 538"
      role="img"
      aria-labelledby="ptn-title ptn-desc"
    >
      <title id="ptn-title">{TITLE}</title>
      <desc id="ptn-desc">{DESC}</desc>
      <Defs id="ptn" />

      {/* connectors first, boxes after */}
      <g className="dg-link" markerEnd="url(#ptn-arrow)">
        <path d={`M${A} ${q.y + q.h}V${m.y}`} />
        <path d={`M${A} ${m.y + m.h}V${g.y}`} />
        <path d={`M${A} ${g.y + g.h}V${e.y}`} />
        <path d={`M${A} ${e.y + e.h}V${c.y}`} />
      </g>
      {/* the attack path: out of the model, down beside the guard, stopped at its side */}
      <path className="dg-attack" d={`M${X + 130} ${runY}H236V${midG}H204`} />
      <path className="dg-stop" d={`M204 ${midG - 12}V${midG + 12}`} />

      <Node x={X} y={q.y} w={120} h={q.h} name="question" />
      <Node x={X} y={m.y} w={130} h={m.h} name="model" />
      <Node x={X} y={g.y} w={190} h={g.h} name="text guard" lines={GUARD} />
      <Node x={X} y={e.y} w={214} h={e.h} name="SQLite engine" lines={ENGINE} />
      <Node x={X} y={c.y} w={170} h={c.h} name="chart and table" />

      <text className="r" x="150" y={m.y + 12}>
        attack cases
      </text>
      <text className="m" x="150" y={m.y + 29}>
        0 of 24 attack
      </text>
      <text className="m" x="150" y={m.y + 46}>
        trials did harm
      </text>
      <text className="m" x="64" y={e.y + e.h + 22}>
        engine rules hold even
      </text>
      <text className="m" x="64" y={e.y + e.h + 40}>
        with the guard bypassed
      </text>
    </svg>
  );
}

export function PropTalkDiagram() {
  return (
    <>
      <div className="dg-wrap wide">
        <Wide />
      </div>
      <div className="dg-wrap narrow">
        <Narrow />
      </div>
    </>
  );
}
