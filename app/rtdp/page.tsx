import type { Metadata } from 'next';
import { Footer, Top } from '@/components/Chrome';
import { GateAssembly } from '@/components/GateAssembly';
import { Num } from '@/components/Num';
import { CaseLinks, Sec } from '@/components/Sec';
import { CaseSheet } from '@/components/Sheet';
import { links } from '@/lib/links';

const TITLE = 'Real-time agentic data platform · Jairaj Saraf';
const DESCRIPTION =
  "An LLM agent that reads an Apache Iceberg table through a read-only API, and a preregistered eval of how often it's right.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' },
};

// "What I built", pinned to the stage each sentence describes. Word for word from content.md.
const stages: [string, string][] = [
  ['ingest', 'Micro-batches of flight state vectors are written with pyiceberg into an Apache Iceberg table on a SQLite catalog.'],
  ['DQ gate', 'A batch that fails a data-quality rule is rejected before anything is written.'],
  ['read API', 'A read-only FastAPI and DuckDB API serves the table, including reads at an earlier snapshot.'],
  [
    'agent',
    "The agent, built on LangChain, gets its tools from the API's OpenAPI schema, filtered to an allowlist of GET endpoints plus one data-quality diagnosis tool. It has no write tool. Each answer ends with a sources line built from the tool calls, not from the model's text.",
  ],
];

export default function Rtdp() {
  const l = links.rtdp;
  return (
    <div className="wrap">
      <Top home />
      <main className="case">
        <h1>Real-time agentic data platform</h1>
        <p className="problem">
          <b>The problem.</b> I wanted an LLM agent that answers questions about a table that keeps getting new data,
          with no way to change it, and a way to measure how often its answers are right.
        </p>

        <CaseSheet rows={['rtdp']} />

        <div className="panel">
          <GateAssembly>
            <h2>What I built.</h2>
            <ol className="stages">
              {stages.map(([name, text]) => (
                <li key={name}>
                  <h3>{name}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </GateAssembly>
        </div>

        <Sec title="How I measured it.">
          <p>
            I committed the eval cases, pass rules and bars before the first live call. Each run is scored by fixed
            rules from stored transcripts, so it can be re-scored offline. Changes after a run are dated addenda.
          </p>
        </Sec>

        <Sec title="Results.">
          <ul>
            <li>
              Run 3 (gemini-3.5-flash-lite, one attempt per case): <Num miss>6 of 9</Num> tasks (95% CI{' '}
              <Num>0.35–0.88</Num>), short of the <Num>0.75</Num> bar. All 3 trap requests passed: a write request, a
              prompt injection and an off-topic question.
            </li>
            <li>
              Runs 1 and 2 didn&apos;t measure the agent. In run 1, <Num>10 of 12</Num> attempts ended in endpoint
              errors, because replayed tool calls lacked a field the model requires. Run 3 measured the fix. Run 2
              aborted after <Num>3 of 3</Num> attempts hit a 404, because the model was no longer offered. All three
              runs are published.
            </li>
            <li>
              The data-quality gate: a batch with injected failures exits with code 1 and writes 0 rows.
            </li>
            <li>
              The three run-3 failures were one wrong endpoint, one model miss, and one integration bug: a 19-digit
              snapshot id was rounded as a float. The executor now rejects such ids, but no run has measured that yet.
            </li>
          </ul>
        </Sec>

        <Sec title="What it doesn't do.">
          <p>
            Ingestion is micro-batch, with no Kafka or Flink. The agent can suggest a fix but has no way to apply one,
            and there is no RAG or fine-tuning. Everything in CI runs on synthetic data. The API has no auth or rate
            limiting. With one attempt per case, the intervals are wide.
          </p>
        </Sec>

        <Sec title="See it run.">
          <p>
            The live demo serves the read API on synthetic data, without the agent. <code className="num">make reproduce</code>{' '}
            runs the tests, the ingest, the data-quality demo and a real API probe in a fresh clone, and re-scores the
            recorded eval runs from their saved files.
          </p>
          <CaseLinks
            items={[
              ['Live demo', l.demo],
              ['Quick start', l.quickStart],
              ['Reproduce the results', l.reproduce],
              ['Limitations', l.limitations],
              ['Commit history', l.commits],
            ]}
          />
        </Sec>

        <p className="next">
          <a href="/proptalk/">Next: PropTalk</a>
        </p>
      </main>
      <Footer />
    </div>
  );
}
