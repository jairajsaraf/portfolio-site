'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { links } from '@/lib/links';
import { Num } from './Num';

// Every axis cell has the same width, so percentage x positions line up
// to the pixel across rows. Gridlines every 0.1.
const GRID = Array.from({ length: 11 }, (_, i) => i * 10);

type AxisProps = {
  ci: [number, number];
  dot: number;
  bar: number;
  first?: boolean;
  /** Anchor "95% CI" at the left end of the line, text running leftwards, when "result" sits too close. */
  ciEnd?: boolean;
};

function Axis({ ci, dot, bar, first, ciEnd }: AxisProps) {
  return (
    <svg className="axis" height="52" aria-hidden="true" focusable="false">
      <g className="grid" shapeRendering="crispEdges">
        {GRID.map((g) => (
          <line key={g} x1={`${g}%`} x2={`${g}%`} y1="0" y2="40" />
        ))}
        <line className="base" x1="0" x2="100%" y1="40" y2="40" />
      </g>
      <line
        className="bar-line"
        x1={`${bar}%`}
        x2={`${bar}%`}
        y1="-6"
        y2="46"
        shapeRendering="crispEdges"
      />
      <line
        data-ci
        pathLength={1}
        className="ci"
        x1={`${ci[0]}%`}
        x2={`${ci[1]}%`}
        y1="20"
        y2="20"
      />
      <circle data-dot className="dot" cx={`${dot}%`} cy="20" r="6.5" />
      {first && (
        <g className="ann">
          <text x={`${bar}%`} y="-12" textAnchor="end" dx="-6">
            bar set before the run
          </text>
          <text x={`${ci[0]}%`} y="56" textAnchor={ciEnd ? 'end' : undefined}>
            95% CI
          </text>
          <text x={`${dot}%`} y="56" textAnchor="middle">
            result
          </text>
        </g>
      )}
    </svg>
  );
}

/** The 0 / 0.5 / 1 labels. Same width as the axis above, so each label sits under its gridline. */
function TickRow({ className = '' }: { className?: string }) {
  return (
    <div className={`tickrow ${className}`.trim()} aria-hidden="true">
      <span style={{ left: '0%' }}>0</span>
      <span style={{ left: '50%' }}>0.5</span>
      <span style={{ left: '100%' }}>1</span>
    </div>
  );
}

function Ticks() {
  return (
    <div className="ticks" aria-hidden="true">
      <span />
      <TickRow />
      <span />
    </div>
  );
}

function Proj({ name, small, href }: { name: string; small: string; href?: string }) {
  return (
    <div className="proj">
      {href ? <a href={href}>{name}</a> : name}
      <small>{small}</small>
    </div>
  );
}

export type RowId = 'rtdp' | 'sql' | 'attack';

type RowProps = {
  id: RowId;
  /** The first row of a sheet carries the direct labels and, when rows stack, its own 0 / 0.5 / 1 scale. */
  first?: boolean;
  /** The project name links to its case study (off on the case study itself). */
  link?: boolean;
};

/** One row of the results sheet. The landing page and the case studies both draw rows from here. */
export function SheetRow({ id, first, link = true }: RowProps) {
  const cls = first ? 'row first' : 'row';
  if (id === 'rtdp') {
    return (
      <div className={cls}>
        <Proj name="Real-time agentic data platform" small="Synthetic data" href={link ? '/rtdp/' : undefined} />
        <Axis ci={[35, 88]} dot={66.7} bar={75} first={first} />
        {first && <TickRow className="first-ticks" />}
        <div className="say">
          <b>Agent eval:</b> <Num miss>6 of 9</Num> tasks passed (95% CI <Num>0.35–0.88</Num>), short of the{' '}
          <Num>0.75</Num> bar I set before the first run.
        </div>
      </div>
    );
  }
  if (id === 'sql') {
    return (
      <div className={cls}>
        <Proj name="PropTalk" small="Synthetic data, two generated tables" href={link ? '/proptalk/' : undefined} />
        <Axis ci={[75, 98]} dot={92} bar={80} first={first} ciEnd />
        {first && <TickRow className="first-ticks" />}
        <div className="say">
          <b>Eval, SQL mode:</b> <Num>23 of 25</Num> questions correct (95% CI <Num>0.75–0.98</Num>), above the{' '}
          <Num>0.8</Num> bar.
        </div>
      </div>
    );
  }
  return (
    <div className={cls}>
      <Proj name="PropTalk" small="Attacks refused or blocked" href={link ? '/proptalk/' : undefined} />
      <Axis ci={[31, 86]} dot={62.5} bar={87.5} first={first} />
      {first && <TickRow className="first-ticks" />}
      <div className="say">
        <b>Attacks, SQL mode:</b> <Num miss>5 of 8</Num> refused or blocked, under the <Num>0.875</Num> bar. pandas mode:{' '}
        <Num>0 of 8</Num>. No attack did any harm.
      </div>
    </div>
  );
}

/**
 * The draw-in: CI lines draw left to right, rows staggered 80 ms, then the result dot settles; the rentals bars
 * grow together and a bracket joins them. Motion docs (react-accessibility): reduced motion shows the end state.
 * Slow JS: the inline script in layout.tsx adds `still` to <html> if this hook has not mounted ~800 ms after
 * first paint. Marks are then already drawn, and the draw-in never replays.
 */
function useDraw(ref: RefObject<HTMLElement | null>) {
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const d = document.documentElement;
    d.classList.add('hy'); // JS is here: the inline timer must not show the end state any more
    if (!('IntersectionObserver' in window)) d.classList.remove('js');
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!inView || !root || reduce) return;
    if (document.documentElement.classList.contains('still')) return;
    const q = <T extends Element>(s: string) => Array.from(root.querySelectorAll<T>(s));
    const done = (el: SVGElement) => {
      el.style.strokeDasharray = 'none';
    };

    q<SVGElement>('[data-ci]').forEach((el, i) => {
      animate(el, { strokeDashoffset: [1, 0] }, { duration: 0.3, ease: 'easeOut', delay: i * 0.08 }).then(() => done(el));
    });
    q<SVGElement>('[data-dot]').forEach((el, i) => {
      animate(el, { opacity: [0, 1], scale: [0.5, 1] }, { duration: 0.2, ease: 'easeOut', delay: i * 0.08 + 0.3 });
    });

    // Rentals parity: both bars grow at the same rate to the same length, then a thin bracket joins their right ends.
    const t0 = 0.25;
    const bars = q<SVGElement>('[data-twin]');
    if (bars.length) {
      animate(bars, { strokeDashoffset: [1, 0] }, { duration: 0.5, ease: 'easeOut', delay: t0 }).then(() =>
        bars.forEach(done),
      );
    }
    const bracket = q<SVGElement>('[data-bracket]');
    if (bracket.length) {
      animate(bracket, { strokeDashoffset: [1, 0] }, { duration: 0.2, ease: 'easeOut', delay: t0 + 0.5 }).then(() =>
        bracket.forEach(done),
      );
    }
  }, [inView, reduce, ref]);
}

/** A slice of the landing sheet for a case study: its own rows, the 0 / 0.5 / 1 scale, the same ground. */
export function CaseSheet({ rows }: { rows: RowId[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useDraw(ref);
  return (
    <div className={`sheet slice${rows.length === 1 ? ' one' : ''}`} ref={ref}>
      {rows.map((id, i) => (
        <SheetRow key={id} id={id} first={i === 0} link={false} />
      ))}
      <Ticks />
    </div>
  );
}

export function Sheet() {
  const ref = useRef<HTMLElement>(null);
  useDraw(ref);

  return (
    <section className="sheet" ref={ref} aria-label="Results sheet">
      <p className="sr-only">
        Results against the bars set before each run. Real-time agentic data platform: 6 of 9 agent tasks, under the 0.75
        bar. PropTalk SQL questions: 23 of 25, above the 0.8 bar. PropTalk attacks refused or blocked: 5 of 8 in SQL
        mode and 0 of 8 in pandas mode, under the 0.875 bar. Rentals: local Spark and Databricks both give 469,420 rows.
      </p>
      <SheetRow id="rtdp" first />
      <SheetRow id="sql" />
      <SheetRow id="attack" />

      <Ticks />

      <div className="row rentals">
        <Proj name="Rentals data pipeline" small="Real public data (Zillow ZORI)" href={links.rentals.code} />
        <div className="twin">
          <span className="lbl l1">Local Spark</span>
          <span className="lbl l2">Databricks</span>
          <svg className="twinsvg" height="44" aria-hidden="true" focusable="false">
            <line data-twin pathLength={1} className="tbar" x1="0" x2="90%" y1="11" y2="11" />
            <line data-twin pathLength={1} className="tbar" x1="0" x2="90%" y1="33" y2="33" />
            <g className="bracket">
              <line data-bracket pathLength={1} x1="91.5%" x2="95%" y1="11" y2="11" />
              <line data-bracket pathLength={1} x1="95%" x2="95%" y1="11" y2="33" />
              <line data-bracket pathLength={1} x1="91.5%" x2="95%" y1="33" y2="33" />
            </g>
          </svg>
          <span className="val v1">
            <Num>469,420</Num> rows
          </span>
          <span className="val v2">
            <Num>469,420</Num> rows
          </span>
        </div>
        <div className="say">
          <b>Parity:</b> both runtimes give the same row counts on all four layers (<Num>8,340</Num> and{' '}
          <Num>469,420</Num>), and every checksum matches.
        </div>
      </div>
    </section>
  );
}
