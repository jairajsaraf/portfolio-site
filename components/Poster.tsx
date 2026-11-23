import type { ReactNode } from 'react';
import { COS, SIN, half, type Geo, type GateState, type P } from './gate-geometry';

type BoxProps = {
  cx: number;
  cy: number;
  side: number;
  h: number;
  lift?: number;
  tone?: 'plain' | 'red' | 'ink';
  heavy?: boolean;
};

/** A block drawn the way the camera sees it: diamond top, two side faces. */
function IsoBox({ cx, cy, side, h, lift = 0, tone = 'plain', heavy }: BoxProps) {
  const w = half(side);
  const d = w * SIN;
  const H = h * COS;
  const yt = cy - lift * COS - H;
  const yb = yt + H;
  const cls = `p-edge${tone === 'red' ? ' red' : ''}${heavy ? ' heavy' : ''}`;
  return (
    <g>
      <path className={`${cls} f-left-${tone}`} d={`M${cx - w} ${yt}L${cx} ${yt + d}V${yb + d}L${cx - w} ${yb}Z`} />
      <path className={`${cls} f-right-${tone}`} d={`M${cx} ${yt + d}L${cx + w} ${yt}V${yb}L${cx} ${yb + d}Z`} />
      <path className={`${cls} f-top-${tone}`} d={`M${cx - w} ${yt}L${cx} ${yt - d}L${cx + w} ${yt}L${cx} ${yt + d}Z`} />
    </g>
  );
}

const line = (pts: P[]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');

const POSTER_ALT =
  'Batches pass a data-quality gate into a stack of Iceberg snapshots. A read API that allows only GET requests sits between the table and the agent, and the agent has no write tool.';

type Props = {
  geo: Geo;
  state: GateState;
  /** Labels only: drawn over the WebGL canvas. */
  labelsOnly?: boolean;
};

export function Poster({ geo, state, labelsOnly }: Props) {
  const { slabs, last } = state;
  const stopped = last === 'bad';
  const asking = last === 'ask';
  const { tracks: t, batch, slab, box, post, socket, gate } = geo;
  const sh = half(socket.side) * SIN;
  const sockPts: P[] = [
    [socket.x - half(socket.side), socket.y],
    [socket.x, socket.y - sh],
    [socket.x + half(socket.side), socket.y],
    [socket.x, socket.y + sh],
  ];

  const shapes: ReactNode = (
    <>
      <g className="p-track">
        <path d={line(t.pre)} strokeDasharray="5 4" />
        <path d={line(t.mid)} />
        <path d={line(t.toApi)} />
        <path d={line(t.toAgent)} />
        {stopped && <path className="red" d={line(t.bad)} />}
      </g>

      {/* the gate: a rail on the ground between two posts */}
      <path className="p-rail" d={line(t.rail)} />
      <IsoBox cx={gate.x} cy={gate.top} {...post} tone="ink" />

      {Array.from({ length: slabs }, (_, i) => (
        <IsoBox key={i} cx={geo.stack[0]} cy={geo.stack[1]} side={slab.side} h={slab.h} lift={i * slab.pitch} heavy={i === slabs - 1} />
      ))}

      <IsoBox cx={geo.api[0]} cy={geo.api[1]} {...box} />
      <IsoBox cx={geo.agent[0]} cy={geo.agent[1]} {...box} />

      {/* the empty socket: nothing plugs in here */}
      <g className="p-socket">
        <path d={line(t.stem)} />
        <path d={`${line(sockPts)}Z`} />
      </g>

      <IsoBox cx={geo.start[0]} cy={geo.start[1]} {...batch} />
      <IsoBox cx={gate.x} cy={gate.bot} {...post} tone="ink" />
      {stopped && <IsoBox cx={geo.stop[0]} cy={geo.stop[1]} {...batch} tone="red" />}

      {asking && <polyline className="p-read" points={geo.read(slabs).map((p) => p.join(' ')).join(' ')} />}
    </>
  );

  return (
    <svg
      className={`poster${labelsOnly ? ' labels-only' : ''}`}
      viewBox={`0 0 ${geo.W} ${geo.H}`}
      width="100%"
      {...(labelsOnly ? { 'aria-hidden': true } : { role: 'img', 'aria-label': POSTER_ALT })}
      focusable="false"
    >
      {!labelsOnly && shapes}
      <g className="p-labels">
        {geo.labels
          .filter((l) => !l.stoppedOnly || stopped)
          .map((l) => (
            <text key={l.lines.join(' ')} className={l.cls} x={l.x} y={l.y} textAnchor={l.anchor}>
              {l.lines.length === 1
                ? l.lines[0]
                : l.lines.map((t, i) => (
                    <tspan key={t} x={l.x} dy={i ? 17 : undefined}>
                      {t}
                    </tspan>
                  ))}
            </text>
          ))}
      </g>
    </svg>
  );
}
