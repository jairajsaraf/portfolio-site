'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { REGIONS, withRent } from '@/lib/rentals-months';
import { Num } from './Num';

// W4-A: the 141 real month columns of bronze_zori, each filled as high as its count of regions with a rent.
// Height is scaled to all 8,340 rows (not the tallest month), so the ink is exactly 469,420 / 1,175,940 of the box.
const N = withRent.length;
const tops = withRent.map((c) => 100 - (100 * c) / REGIONS);
const steps = tops.map((y, i) => `H${i}V${y.toFixed(3)}H${i + 1}`).join('');
const FILLED = `M0,100${steps.replace(/^H0/, '')}V100Z`;
const EMPTY = `M0,0H${N}V${tops[N - 1].toFixed(3)}${tops
  .map((y, i) => `H${i + 1}V${y.toFixed(3)}`)
  .reverse()
  .join('')}H0Z`;

function Plot() {
  return (
    <>
      <svg className="wg-svg" viewBox={`0 0 ${N} 100`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path data-empty className="wg-empty wg-gone" d={EMPTY} />
      </svg>
      <svg className="wg-svg" data-fill viewBox={`0 0 ${N} 100`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path className="wg-filled" d={FILLED} />
      </svg>
    </>
  );
}

/**
 * Wide to long, then parity. Plays once in view: the months fill left to right, the part with no rent drops
 * away, an arrow draws, and the two runtimes' bars grow together to the same length before the bracket joins them.
 * No JS, reduced motion or slow JS ("still", layout.tsx): the end frame, server-rendered (globals.css).
 */
export function RentalsWedge() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!inView || !root || reduce) return;
    if (document.documentElement.classList.contains('still')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const q = <T extends Element>(s: string) => Array.from(root.querySelectorAll<T>(s));
    const undash = (els: SVGElement[]) => els.forEach((el) => (el.style.strokeDasharray = 'none'));
    const arrow = q<SVGElement>('[data-arrow]');
    const bars = q<SVGElement>('[data-twin]');
    const bracket = q<SVGElement>('[data-bracket]');
    const fades = q<HTMLElement>('[data-fade]');

    const runs = [
      animate(q('[data-fill]'), { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }, { duration: 0.9, ease: 'easeInOut' }),
      animate(q('[data-empty]'), { opacity: [1, 0], y: [0, 14] }, { duration: 0.5, ease: 'easeIn', delay: 0.9 }),
      animate(fades.slice(0, 1), { opacity: [0, 1] }, { duration: 0.3, delay: 1.1 }),
      animate(arrow, { strokeDashoffset: [1, 0] }, { duration: 0.3, ease: 'easeOut', delay: 1.4 }),
      animate(bars, { strokeDashoffset: [1, 0] }, { duration: 0.5, ease: 'easeOut', delay: 1.7 }),
      animate(bracket, { strokeDashoffset: [1, 0] }, { duration: 0.2, ease: 'easeOut', delay: 2.2 }),
      animate(fades.slice(1), { opacity: [0, 1] }, { duration: 0.3, delay: 2.2 }),
    ];
    runs[3].then(() => undash(arrow));
    runs[4].then(() => undash(bars));
    runs[5].then(() => undash(bracket));
    // If reduced motion flips on mid-play, stop() alone would freeze the chart part-drawn in inline styles, so
    // write the end frame explicitly (the same frame the CSS gives with no JS).
    return () => {
      runs.forEach((r) => r.stop());
      q<SVGElement>('[data-fill]').forEach((el) => (el.style.clipPath = 'inset(0 0% 0 0)'));
      q<SVGElement>('[data-empty]').forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'none';
      });
      fades.forEach((el) => (el.style.opacity = '1'));
      [...arrow, ...bars, ...bracket].forEach((el) => {
        el.style.strokeDashoffset = '0';
        el.style.strokeDasharray = 'none';
      });
    };
  }, [inView, reduce]);

  return (
    <figure className="wedge" ref={ref}>
      {/* Gate passed (ideas/work/b4-gate.md); approved by the owner, 2026-11-23. */}
      <p className="sr-only">
        Wide to long: 8,340 bronze rows, one per region, become one row per region per month; 706,520 rows with no
        rent are dropped, leaving 469,420 rows on both Local Spark and Databricks.
      </p>
      <div className="wg-shape" aria-hidden="true">
        <span className="wg-tick">
          <Num>8,340</Num> regions
        </span>
        <div className="wg-plot">
          <Plot />
          <span className="wg-gap" data-fade>
            <Num>706,520</Num> rows with no rent
          </span>
        </div>
        <div className="wg-axis">
          <span>2015</span>
          <span>2026</span>
        </div>
        <p className="wg-cap">Regions with a rent, each month (Databricks fingerprint)</p>
      </div>
      <svg className="wg-arrow" viewBox="0 0 52 12" aria-hidden="true" focusable="false">
        <path data-arrow pathLength={1} d="M0,6H50M44,1L50,6L44,11" />
      </svg>
      <div className="twin" aria-hidden="true">
        <span className="lbl l1">Local Spark</span>
        <span className="lbl l2">Databricks</span>
        <svg className="twinsvg" height="44" focusable="false">
          <line data-twin pathLength={1} className="tbar" x1="0" x2="90%" y1="11" y2="11" />
          <line data-twin pathLength={1} className="tbar" x1="0" x2="90%" y1="33" y2="33" />
          <g className="bracket">
            <line data-bracket pathLength={1} x1="91.5%" x2="95%" y1="11" y2="11" />
            <line data-bracket pathLength={1} x1="95%" x2="95%" y1="11" y2="33" />
            <line data-bracket pathLength={1} x1="91.5%" x2="95%" y1="33" y2="33" />
          </g>
        </svg>
        <span className="val v1" data-fade>
          <Num>469,420</Num> rows
        </span>
        <span className="val v2" data-fade>
          <Num>469,420</Num> rows
        </span>
      </div>
    </figure>
  );
}
