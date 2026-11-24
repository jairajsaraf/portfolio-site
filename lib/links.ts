const RTDP = 'https://github.com/jairajsaraf/realtime-agentic-data-platform';
const PROPTALK = 'https://github.com/jairajsaraf/PropTalk';
const RENTALS = 'https://github.com/jairajsaraf/rentals-data-pipeline';

export const links = {
  linkedin: 'https://www.linkedin.com/in/jairajsaraf',
  github: 'https://github.com/jairajsaraf',
  rtdp: {
    code: RTDP,
    demo: 'https://jairajsaraf-rtdp-demo.hf.space/',
    quickStart: `${RTDP}#quick-start`,
    reproduce: `${RTDP}#reproducing-the-results`,
    limitations: `${RTDP}#limitations`,
    commits: `${RTDP}/commits/main/`,
  },
  proptalk: {
    code: PROPTALK,
    demo: 'https://proptalk.streamlit.app/',
    quickStart: `${PROPTALK}#quick-start`,
    reproduce: `${PROPTALK}#reproduce`,
    limitations: `${PROPTALK}#limitations`,
    commits: `${PROPTALK}/commits/master/`,
  },
  rentals: {
    code: RENTALS,
    quickStart: `${RENTALS}#quick-start`,
    results: `${RENTALS}#results`,
    limitations: `${RENTALS}#limitations`,
    commits: `${RENTALS}/commits/master/`,
  },
};

/**
 * O1: each printed figure links to the line that states it, at the commit content.md §5 pins.
 * GitHub docs ("Creating a permanent link to a code snippet"): Markdown lines need `?plain=1`, then `#L<n>`.
 */
function at(repo: string, sha: string) {
  return (file: string, from: number, to?: number) => ({
    href: `${repo}/blob/${sha}/${file}${file.endsWith('.md') ? '?plain=1' : ''}#L${from}${to ? `-L${to}` : ''}`,
    path: `${file}:${from}${to ? `–${to}` : ''}`,
  });
}
const rtdp = at(RTDP, '097f392f976547b0e05c3808855718e8ddecd4f2');
const pt = at(PROPTALK, '0e0a846984f3a6e83ca7b3078308f56a1c3abdb4');
const rn = at(RENTALS, '0dfa663e545cb598002597db3d95565e8dc45b03');

export type Src = { href: string; path: string };

export const src = {
  rtdp: {
    run1: rtdp('README.md', 34),
    run2: rtdp('README.md', 35),
    run3: rtdp('README.md', 36),
    bar: rtdp('README.md', 220),
  },
  proptalk: {
    setup: pt('README.md', 61),
    questions: pt('README.md', 68),
    attacks: pt('README.md', 73),
    harm: pt('README.md', 74),
  },
  rentals: {
    sheet: rn('README.md', 99, 104),
    rows: rn('README.md', 97, 104),
    runtimes: rn('README.md', 95),
    dropped: rn('README.md', 105),
    dq: rn('README.md', 106),
    checksumTest: rn('tests/test_parity.py', 22),
  },
};
