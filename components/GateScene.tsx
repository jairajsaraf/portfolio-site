'use client';

// The Iceberg gate assembly, in WebGL. Client-only, code-split (see GateAssembly).
// frameloop="demand": a frame is drawn only when a Motion tween or a React change
// calls invalidate(). Flat tones from basic materials, drei Edges in ink, no lights,
// no shadows, no textures, no post-processing.
// The layout comes from a Geo (gate-geometry.ts), the same one the SVG poster draws.

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Edges, Line } from '@react-three/drei';
import { animate } from 'motion/react';
import { MeshBasicMaterial, type Group, type OrthographicCamera } from 'three';
import { COS, SIN, TOKEN_NAMES, half, toWorld, type Colors, type GateState, type Geo, type P } from './gate-geometry';

const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(Math.max((t - a) / (b - a), 0), 1);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const GeoCtx = createContext<Geo | null>(null);
const useGeo = () => useContext(GeoCtx) as Geo;

// Colours are the site's CSS tokens (globals.css), read from the computed style, so the scene follows the
// light and dark schemes. A scheme change re-reads them and draws a frame. The Canvas is its own React root,
// so the context is provided inside it.
const DARK = '(prefers-color-scheme: dark)';
const subscribeScheme = (cb: () => void) => {
  const mq = window.matchMedia(DARK);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const useScheme = () =>
  useSyncExternalStore(
    subscribeScheme,
    () => (window.matchMedia(DARK).matches ? 'dark' : 'light'),
    () => 'light',
  );
function readColors(): Colors {
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(TOKEN_NAMES.map((n) => [n, cs.getPropertyValue('--' + n).trim()])) as Colors;
}
const ColorCtx = createContext<{ c: Colors; mats: Mats } | null>(null);
const useColors = () => useContext(ColorCtx) as { c: Colors; mats: Mats };

type Mats = Record<'plain' | 'red' | 'ink', MeshBasicMaterial[]>;
function makeMats(top: string, left: string, right: string) {
  const m = (c: string) =>
    new MeshBasicMaterial({ color: c, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const t = m(top);
  const l = m(left);
  const r = m(right);
  const h = m(left);
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z. After the 45 degree turn the
  // camera sees -x (left), +z (right) and +y (top).
  return [h, l, t, h, r, h];
}
const buildMats = (c: Colors): Mats => ({
  plain: makeMats(c['face-top'], c['face-left'], c['face-right']),
  red: makeMats(c['red-top'], c['red-left'], c['red-right']),
  ink: makeMats(c.ink, c.ink, c.ink),
});
const disposeMats = (m: Mats) => Object.values(m).forEach((list) => list.forEach((x) => x.dispose()));

type BlockProps = {
  tone: keyof Mats;
  side: number;
  h: number;
  at?: [number, number, number]; // poster x, ground y, lift
  visible?: boolean;
  edge?: 'ink' | 'red';
  lineWidth?: number;
};

const Block = forwardRef<Group, BlockProps>(function Block(
  { tone, side, h, at, visible = true, edge = 'ink', lineWidth = 1.5 },
  ref,
) {
  const geo = useGeo();
  const { c, mats } = useColors();
  const pos = at ? toWorld(geo, at[0], at[1], at[2]) : undefined;
  return (
    <group ref={ref} position={pos} rotation={[0, Math.PI / 4, 0]} scale={[side, h, side]} visible={visible}>
      <mesh position={[0, 0.5, 0]} material={mats[tone]}>
        <boxGeometry args={[1, 1, 1]} />
        <Edges color={c[edge]} lineWidth={lineWidth} threshold={15} />
      </mesh>
    </group>
  );
});

type LineHandle = { visible: boolean; geometry: { setPositions: (a: number[]) => void } };

type W3 = [number, number, number];
const ground = (g: Geo, x: number, y: number): W3 => toWorld(g, x, y, 0.5);
const flat = (g: Geo, pts: P[]) => pts.flatMap(([x, y]) => ground(g, x, y));

/** Positions of the first `t` (0-1) of a polyline's length. */
function partial(g: Geo, pts: P[], t: number): number[] {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let left = seg.reduce((a, b) => a + b, 0) * t;
  const out: P[] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    const f = seg[i] === 0 ? 1 : Math.min(left / seg[i], 1);
    out.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]);
    left -= seg[i];
    if (left <= 0) break;
  }
  if (out.length < 2) out.push(pts[0]);
  return flat(g, out);
}

function Rig({ geo }: { geo: Geo }) {
  const camera = useThree((s) => s.camera) as OrthographicCamera;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const D = 1500;
    // One zoom for the whole view: the canvas has the geometry's aspect, so the scene is framed in full.
    camera.zoom = width / geo.W;
    camera.position.set(0, D * SIN, D * COS);
    camera.near = 1;
    camera.far = 4000;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, width, height, geo, invalidate]);
  return null;
}

type WorldProps = { state: GateState; cmd: number; onReady: () => void };
type InnerProps = WorldProps & {
  /** Counts the times the canvas came back on screen; each one flushes what was held back and draws a frame. */
  entered: number;
  visRef: { current: boolean };
};

function World({ state, cmd, onReady, entered, visRef }: InnerProps) {
  const geo = useGeo();
  const { c, mats } = useColors();
  const { batch, slab } = geo;
  const invalidateNow = useThree((s) => s.invalidate);
  const invalidate = useCallback(() => {
    if (visRef.current) invalidateNow();
  }, [invalidateNow, visRef]);
  const pendingShown = useRef<number | null>(null);
  const [shown, setShownNow] = useState(state.slabs);
  // A slab count that arrives while off-screen waits, so no React change reaches the scene then.
  const setShown = (n: number) => {
    if (visRef.current) setShownNow(n);
    else pendingShown.current = n;
  };
  useEffect(() => {
    if (pendingShown.current !== null) {
      setShownNow(pendingShown.current);
      pendingShown.current = null;
    }
    invalidateNow();
  }, [entered, invalidateNow]);
  const wait = useRef<Group>(null);
  const trav = useRef<Group>(null);
  const red = useRef<Group>(null);
  const read = useRef<LineHandle>(null);
  const prev = useRef<GateState>(state);
  const live = useRef<{ stop: () => void }[]>([]);
  const first = useRef(true);

  const tracks = useMemo(
    () => Object.fromEntries(Object.entries(geo.tracks).map(([k, v]) => [k, v.map(([x, y]) => ground(geo, x, y))])) as Record<keyof Geo['tracks'], W3[]>,
    [geo],
  );
  const socketPts = useMemo(() => {
    const { x, y, side } = geo.socket;
    const w = half(side);
    return [toWorld(geo, x - w, y, 0.5), toWorld(geo, x, y - w * SIN, 0.5), toWorld(geo, x + w, y, 0.5), toWorld(geo, x, y + w * SIN, 0.5), toWorld(geo, x - w, y, 0.5)];
  }, [geo]);

  const place = (g: Group | null, x: number, y: number, lift: number, side: number, h: number) => {
    if (!g) return;
    const [wx, wy, wz] = toWorld(geo, x, y, lift);
    g.position.set(wx, wy, wz);
    g.scale.set(side, h, side);
    g.visible = true;
  };

  const settle = (s: GateState) => {
    place(wait.current, geo.start[0], geo.start[1], 0, batch.side, batch.h);
    if (trav.current) trav.current.visible = false;
    if (red.current) {
      if (s.last === 'bad') place(red.current, geo.stop[0], geo.stop[1], 0, batch.side, batch.h);
      else red.current.visible = false;
    }
    if (read.current) {
      read.current.visible = s.last === 'ask';
      read.current.geometry.setPositions(flat(geo, geo.read(s.slabs)));
    }
    setShown(s.slabs);
    invalidate();
  };

  const run = (tween: { duration: number; ease: 'linear' | 'easeOut' }, fn: (p: number) => void, done?: () => void) => {
    const c = animate(0 as number, 1, {
      ...tween,
      onUpdate: (p: number) => {
        fn(p);
        invalidate();
      },
      onComplete: () => {
        fn(1);
        invalidate();
        done?.();
      },
    });
    live.current.push(c);
    return c;
  };

  useLayoutEffect(() => {
    settle(state);
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        invalidate();
        onReady();
      }),
    );
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    live.current.forEach((c) => c.stop());
    live.current = [];
    const from = prev.current;
    prev.current = state;
    settle(from);
    // Start over: nothing was pressed, so jump to the stopped frame instead of replaying it.
    if (state.pressed === null) return settle(state);

    if (state.last === 'clean') {
      if (state.slabs === from.slabs) return settle(state);
      const land = from.slabs * slab.pitch;
      const hover = land + geo.hover;
      if (red.current) red.current.visible = false;
      if (read.current) read.current.visible = false;
      if (wait.current) wait.current.visible = false;
      const y = geo.start[1];
      run(
        { duration: 0.5, ease: 'linear' },
        (p) => {
          const x = lerp(geo.start[0], geo.stack[0], smooth(0, 0.6, p));
          const lift = p < 0.6 ? hover * smooth(0.3, 0.6, p) : lerp(hover, land, smooth(0.6, 1, p));
          const m = smooth(0.6, 1, p);
          place(trav.current, x, y, lift, lerp(batch.side, slab.side, m), lerp(batch.h, slab.h, m));
        },
        () => {
          setShown(state.slabs);
          if (trav.current) trav.current.visible = false;
          run({ duration: 0.2, ease: 'easeOut' }, (p) =>
            place(wait.current, geo.start[0], y, (1 - p) * 30, batch.side, batch.h),
          );
        },
      );
    } else if (state.last === 'bad') {
      if (read.current) read.current.visible = false;
      const sx = geo.start[0];
      const [tx, ty] = geo.stop;
      run(
        { duration: 0.4, ease: 'linear' },
        (p) => {
          const e = 1 - Math.pow(1 - p, 3);
          place(red.current, lerp(sx, tx, e), ty, 40 * (1 - smooth(0, 0.3, p)), batch.side, batch.h);
        },
        () => {
          // a short shake against the gate
          run({ duration: 0.18, ease: 'linear' }, (p) =>
            place(red.current, tx + Math.sin(p * Math.PI * 4) * 5 * (1 - p), ty, 0, batch.side, batch.h),
          );
        },
      );
    } else if (state.last === 'ask') {
      if (red.current) red.current.visible = false;
      const pts = geo.read(state.slabs);
      if (read.current) read.current.visible = true;
      run({ duration: 0.45, ease: 'linear' }, (p) => {
        const e = 1 - Math.pow(1 - p, 2);
        read.current?.geometry.setPositions(partial(geo, pts, e));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmd]);

  useEffect(() => () => live.current.forEach((c) => c.stop()), []);

  const readPts = useMemo(() => flat(geo, geo.read(shown)), [geo, shown]);

  return (
    <>
      {/* tracks: geometry is built once, so no Line is re-created on a state change */}
      <Line points={tracks.pre} color={c.ink} lineWidth={1.5} dashed dashSize={5} gapSize={4} />
      <Line points={tracks.mid} color={c.ink} lineWidth={1.5} />
      <Line points={tracks.toApi} color={c.ink} lineWidth={1.5} />
      <Line points={tracks.toAgent} color={c.ink} lineWidth={1.5} />
      {state.last === 'bad' && <Line points={tracks.bad} color={c.red} lineWidth={1.5} />}

      {/* the gate: a rail on the ground between two posts */}
      <Line points={tracks.rail} color={c.ink} lineWidth={3} />
      <Block tone="ink" side={geo.post.side} h={geo.post.h} at={[geo.gate.x, geo.gate.top, 0]} lineWidth={1} />
      <Block tone="ink" side={geo.post.side} h={geo.post.h} at={[geo.gate.x, geo.gate.bot, 0]} lineWidth={1} />

      {/* iceberg snapshots */}
      {Array.from({ length: shown }, (_, i) => (
        <Block key={i} tone="plain" side={slab.side} h={slab.h} at={[geo.stack[0], geo.stack[1], i * slab.pitch]} lineWidth={i === shown - 1 ? 2.4 : 1.5} />
      ))}

      <Block tone="plain" side={geo.box.side} h={geo.box.h} at={[geo.api[0], geo.api[1], 0]} />
      <Block tone="plain" side={geo.box.side} h={geo.box.h} at={[geo.agent[0], geo.agent[1], 0]} />

      {/* the empty socket: nothing plugs in here */}
      <Line points={socketPts} color={c.ink} lineWidth={1.5} dashed dashSize={4} gapSize={3} />
      <Line points={tracks.stem} color={c.ink} lineWidth={1.5} dashed dashSize={4} gapSize={3} />

      {/* batches */}
      <Block ref={wait} tone="plain" side={batch.side} h={batch.h} />
      <Block ref={trav} tone="plain" side={batch.side} h={batch.h} visible={false} />
      <Block ref={red} tone="red" side={batch.side} h={batch.h} edge="red" visible={false} />

      {/* the read line: drawn over everything */}
      <Line
        ref={read as never}
        points={readPts}
        color={c.ink}
        lineWidth={2}
        depthTest={false}
        renderOrder={10}
        frustumCulled={false}
      />
    </>
  );
}

// Canvas options are module constants, so a re-render of the Canvas element never re-applies them (which would
// ask for a frame).
const DPR: [number, number] = [1, 2];
const GL = { antialias: true, alpha: true, powerPreference: 'low-power' as const };
const CAMERA = { position: [0, 500, 1414] as [number, number, number], zoom: 1, near: 1, far: 4000 };

/**
 * No off-screen renders. frameloop stays "demand" (r3f.docs.pmnd.rs/advanced/scaling-performance), but while the
 * canvas is off-screen nothing may ask for a frame: the state and cmd are held at their last on-screen values and
 * the Canvas element is memoised on them, so React does not touch the scene at all; the tweens skip invalidate().
 * On re-entry the latest values pass through, the tween plays, and a frame is drawn.
 */
export default function GateScene({ geo, state, cmd, onReady }: WorldProps & { geo: Geo }) {
  const scheme = useScheme();
  const value = useMemo(() => {
    const c = readColors();
    return { c, mats: buildMats(c) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheme]);
  useEffect(() => () => disposeMats(value.mats), [value]);

  const box = useRef<HTMLDivElement>(null);
  const visRef = useRef(true);
  const [on, setOn] = useState(true);
  const [entered, setEntered] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      const now = es[es.length - 1].isIntersecting;
      visRef.current = now;
      setOn(now);
      if (now) setEntered((n) => n + 1);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const held = useRef({ state, cmd });
  if (on) held.current = { state, cmd };
  const h = held.current;

  const canvas = useMemo(
    () => (
      <Canvas orthographic frameloop="demand" dpr={DPR} flat gl={GL} camera={CAMERA} aria-hidden="true">
        <GeoCtx.Provider value={geo}>
          <ColorCtx.Provider value={value}>
            <Rig geo={geo} />
            <World state={h.state} cmd={h.cmd} onReady={onReady} entered={entered} visRef={visRef} />
          </ColorCtx.Provider>
        </GeoCtx.Provider>
      </Canvas>
    ),
    [geo, value, h.state, h.cmd, onReady, entered],
  );
  return (
    <div ref={box} style={{ width: "100%", height: "100%" }}>
      {canvas}
    </div>
  );
}
