import type { Metadata } from 'next';
import { Footer, Top } from '@/components/Chrome';
import { Num } from '@/components/Num';
import { RentalsWedge } from '@/components/RentalsWedge';
import { CaseLinks, Sec } from '@/components/Sec';
import { CaseSheet } from '@/components/Sheet';
import { links, src } from '@/lib/links';

// Copy: ideas/rentals-content.md section 2, approved by the owner at checkpoint 2 (2026-11-23), word for word.
const TITLE = 'Rentals data pipeline · Jairaj Saraf';
const DESCRIPTION =
  'The same PySpark transforms run locally and on Databricks, with a parity check of row counts and checksums on all four Spark layers.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' },
};

// "What I built", pinned to the stage each sentence describes.
const stages: [string, string][] = [
  ['bronze', "Zillow's ZIP-level rent index is one wide CSV, one column per month. It is read with an explicit schema."],
  [
    'silver',
    'The month columns are unpivoted into one row per region and month. Rows with no rent are dropped, then duplicate region-months are removed.',
  ],
  ['gold', "Window functions add each region's month-over-month rent change and its rent rank within its state."],
  [
    'parity',
    "Both runtimes run these same functions with one config file. On each side, a fingerprint step records every layer's row count, a checksum per column and a checksum over whole rows, and a script diffs the two sides.",
  ],
];

export default function Rentals() {
  const l = links.rentals;
  return (
    <div className="wrap">
      <Top home />
      <main className="case">
        <h1>Rentals data pipeline</h1>
        <p className="problem">
          <b>The problem.</b> I wanted the same PySpark transforms to give identical results locally and on Databricks,
          and a check that would show it if they didn&apos;t.
        </p>

        <CaseSheet rows={['rentals']} />

        <div className="panel">
          <RentalsWedge />
          <h2>What I built.</h2>
          <ol className="stages r4">
            {stages.map(([name, text]) => (
              <li key={name}>
                <h3>{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>

        <Sec title="How I measured it.">
          <p>
            I ran one copy of the CSV through local PySpark <Num src={src.rentals.runtimes}>3.5.4</Num> in Docker and through Databricks Free
            Edition serverless Spark <Num src={src.rentals.runtimes}>4.2.0</Num>. The parity script hashes the input on both sides and refuses to
            compare runs of different files. The checksums are sums of hashes, so row order doesn&apos;t change them. The
            whole-row checksum also changes when a value moves to the wrong record. Tests check both cases, plus a single
            rent changed by <Num src={src.rentals.checksumTest}>0.01</Num>. CI runs those tests and never touches Databricks.
          </p>
        </Sec>

        <Sec title="Results (parity report of 2026-11-07):">
          <ul>
            <li>
              Both runtimes give the same row counts on all four layers (<Num src={src.rentals.rows}>8,340</Num> and <Num src={src.rentals.rows}>469,420</Num>), and
              every checksum matches. The Databricks side is one manual run saved in the repo, and re-running it needs a
              Databricks login.
            </li>
            <li>
              The report records which checksums match, not the local checksum values, so the comparison can&apos;t be
              redone from the committed files alone.
            </li>
            <li>
              Both sides dropped <Num src={src.rentals.dropped}>706,520</Num> rows with no rent and found <Num src={src.rentals.dropped}>0</Num> duplicates.
            </li>
            <li>
              Data-quality checks: <Num src={src.rentals.dq}>4 of 4</Num> passed locally. On Databricks, the rent-range check failed{' '}
              <Num src={src.rentals.dq}>0</Num> rows.
            </li>
          </ul>
        </Sec>

        <Sec title="What it doesn't do.">
          <p>
            The download step is a stub: you fetch Zillow&apos;s CSV yourself, and it isn&apos;t in the repo. The
            Databricks half was copied by hand from one manual run. The parity run covers the four Spark layers only. The
            DuckDB load, the dbt models and the Airflow DAG are in the repo, but no result file covers them. Output is
            written as a single file, which wouldn&apos;t scale to a much larger input. On Databricks, a failing
            table-level check doesn&apos;t stop the gold table, while the local DAG stops before the load.
          </p>
        </Sec>

        <Sec title="See it run.">
          <p>
            There&apos;s no live demo. <code className="num">make test</code> runs the transform, data-quality and
            fingerprint tests on small fixtures, with no CSV. A full local run needs Zillow&apos;s CSV and Java 11 or
            newer, plus WSL2 on Windows.
          </p>
          <CaseLinks
            items={[
              ['Quick start', l.quickStart],
              ['Results', l.results],
              ['Limitations', l.limitations],
              ['Commit history', l.commits],
            ]}
          />
        </Sec>

        <p className="next">
          <a href="/rtdp/">Next: Real-time agentic data platform</a>
        </p>
      </main>
      <Footer />
    </div>
  );
}
