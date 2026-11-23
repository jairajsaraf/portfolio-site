'use client';

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useInView, useReducedMotion } from 'motion/react';
import { Poster } from './Poster';
import { GEOS, INITIAL, MAX_SLABS, forLive, next, type GateState, type Scene } from './gate-geometry';

// Code-split and client-only: three, R3F and drei load only when the piece
// scrolls into view, and never on the server or without WebGL.
const GateScene = dynamic(() => import('./GateScene'), { ssr: false });

class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function hasWebGL() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl');
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

const BUTTONS: { action: Scene; label: string }[] = [
  { action: 'clean', label: 'Send a clean batch' },
  { action: 'bad', label: 'Send a bad batch' },
  { action: 'ask', label: 'Ask the agent' },
];

// The ordered text alternative. `slabs` is the table's snapshot count after the action. `live` is true once the
// 3D scene is up: it starts neutral, so its start and reset lines do not mention a stopped batch.
const COUNT = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];
type Kind = Scene | 'start' | 'reset';
function describe(kind: Kind, slabs: number, live: boolean): string {
  const n = COUNT[slabs];
  switch (kind) {
    case 'start':
      return live
        ? 'The Iceberg table holds four snapshots.'
        : 'A bad batch was stopped at the gate. Nothing was written, and the Iceberg table holds four snapshots.';
    case 'clean':
      return slabs >= MAX_SLABS
        ? `The clean batch passed the data-quality gate. The table now holds ${n} snapshots, the most this scene shows.`
        : `The clean batch passed the data-quality gate. The table now holds ${n} snapshots.`;
    case 'bad':
      return `The bad batch was stopped at the gate. Nothing was written, and the table still holds ${n} snapshots.`;
    case 'ask':
      return 'The agent read the newest snapshot through the read API. It has no tool that can write.';
    case 'reset':
      return live
        ? 'The scene was reset. The table holds four snapshots.'
        : 'The scene was reset. A bad batch is stopped at the gate, and the table holds four snapshots.';
  }
}

// Every line the scene can show. They sit stacked in one grid cell, invisible but for the current one, so the
// line is always as tall as the longest and nothing below the scene moves when the text changes (F4).
const ALL_LINES = Array.from(
  new Set<string>([
    describe('start', 4, false),
    describe('start', 4, true),
    describe('reset', 4, false),
    describe('reset', 4, true),
    describe('clean', 5, true),
    describe('clean', 6, true),
    describe('bad', 4, true),
    describe('bad', 5, true),
    describe('bad', 6, true),
    describe('ask', 4, true),
  ]),
);

type Mode = 'wide' | 'narrow';
// Below this width the column layout is used: the wide poster's labels would drop under 11 px.
const WIDE_QUERY = '(min-width: 1140px)';

type Entry = { k: number; kind: Kind; slabs: number };

export function GateAssembly({ children }: { children?: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { once: true });
  const reduce = useReducedMotion();
  const [gl, setGl] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  // Sticky: once the 3D scene has shown, the piece is "live" (neutral start, live wording) even if the canvas remounts.
  const [live, setLive] = useState(false);
  const startOver = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<GateState>(INITIAL);
  const [cmd, setCmd] = useState(0);
  const [log, setLog] = useState<Entry[]>([{ k: 0, kind: 'start', slabs: INITIAL.slabs }]);

  useEffect(() => {
    setGl(hasWebGL());
    const mq = window.matchMedia(WIDE_QUERY);
    const apply = () => {
      setMode(mq.matches ? 'wide' : 'narrow');
      setReady(false); // the canvas is rebuilt for the other geometry
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const mount3d = inView && gl && !reduce && !failed && mode !== null;

  const push = (s: GateState, kind: Kind) => {
    setState(s);
    setCmd((c) => c + 1);
    setLog((l) => [...l, { k: cmd + 1, kind, slabs: s.slabs }].slice(-6));
  };
  const send = (a: Scene) => {
    if (a === 'clean' && state.slabs >= MAX_SLABS) return;
    const s = next(state, a);
    push(s, a);
    // The clean button disables itself at the last slab: move focus to Start over so a keyboard user is not dropped.
    if (a === 'clean' && s.slabs >= MAX_SLABS) startOver.current?.focus();
  };
  const reset = () => push(INITIAL, 'reset');

  const onReady = useCallback(() => {
    setReady(true);
    setLive(true);
  }, []);
  const onError = useCallback(() => setFailed(true), []);

  // The poster keeps the stopped frame until the live scene is up; the scene itself always starts neutral.
  const posterState = live ? forLive(state) : state;
  const sceneState = forLive(state);
  const lines = log.map((e) => describe(e.kind, e.slabs, live));
  const now = lines[lines.length - 1];

  return (
    <div className="gate" ref={box}>
      {(['wide', 'narrow'] as const).map((id) => {
        const geo = GEOS[id];
        const here = mount3d && mode === id;
        return (
          <div className={`stage ${id}`} key={id}>
            <Poster geo={geo} state={posterState} />
            {here && (
              <div className={`canvas${ready ? ' on' : ''}`}>
                <Boundary onError={onError}>
                  <GateScene geo={geo} state={sceneState} cmd={cmd} onReady={onReady} />
                </Boundary>
              </div>
            )}
            {here && ready && (
              <div className="overlay">
                <Poster geo={geo} state={posterState} labelsOnly />
              </div>
            )}
          </div>
        );
      })}

      <div className="controls" role="group" aria-label="Scene controls">
        {BUTTONS.map(({ action, label }) => (
          <button
            key={action}
            type="button"
            aria-pressed={state.pressed === action}
            disabled={action === 'clean' && state.slabs >= MAX_SLABS}
            onClick={() => send(action)}
          >
            {label}
          </button>
        ))}
        <button type="button" ref={startOver} onClick={reset}>
          Start over
        </button>
      </div>

      {/* With JS: the newest line is shown, and the whole ordered list is kept for screen readers.
          Without JS: the list is shown as it is. */}
      <p className="now" aria-hidden="true">
        {ALL_LINES.map((t) => (
          <span key={t} className={t === now ? 'on' : undefined}>
            {t}
          </span>
        ))}
      </p>
      <ol className="alt" aria-live="polite">
        {log.map(({ k }, i) => (
          <li key={k}>{lines[i]}</li>
        ))}
      </ol>

      {children}
    </div>
  );
}
