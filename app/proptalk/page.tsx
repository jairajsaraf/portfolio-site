import type { Metadata } from 'next';
import { Footer, Top } from '@/components/Chrome';
import { Num } from '@/components/Num';
import { PropTalkDiagram } from '@/components/PropTalkDiagram';
import { CaseLinks, Sec } from '@/components/Sec';
import { CaseSheet } from '@/components/Sheet';
import { links, src } from '@/lib/links';

const TITLE = 'PropTalk · Jairaj Saraf';
const DESCRIPTION =
  'Plain-English questions over property data, answered by LLM-written SQL that runs on a locked-down engine, with the eval published.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' },
};

export default function PropTalk() {
  const l = links.proptalk;
  return (
    <div className="wrap">
      <Top home />
      <main className="case">
        <h1>PropTalk</h1>
        <p className="problem">
          <b>The problem.</b> PropTalk measures how far you can trust code an LLM writes against your data.
        </p>

        <CaseSheet rows={['sql', 'attack']} />

        <div className="panel pt">
          <PropTalkDiagram />
          <div className="built">
            <h2>What I built.</h2>
            <p>
              A Streamlit app where you pick SQL or pandas and ask a question. The question and the table schema go to
              any OpenAI-compatible model, which returns code. pandas code runs in a separate process on a copy of the
              data, with a timeout.
            </p>
          </div>
        </div>

        <Sec title="How I measured it.">
          <p>
            I committed <Num src={src.proptalk.setup}>25</Num> questions, <Num src={src.proptalk.setup}>8</Num> attack cases, the scoring rules and the pass bars before
            any live call. Each attack is checked for harm by hashing the tables before and after, snapshotting files,
            and watching for a planted secret. CI re-scores the saved reports offline on every push.
          </p>
        </Sec>

        <Sec title="Results.">
          <p className="intro-line">Model: gemini-3.5-flash-lite, temperature 0.</p>
          <ul>
            <li>
              SQL mode, first repetition: <Num src={src.proptalk.questions}>23 of 25</Num> correct (<Num src={src.proptalk.questions}>0.92</Num>, 95% CI <Num src={src.proptalk.questions}>0.75–0.98</Num>),
              above the <Num src={src.proptalk.questions}>0.8</Num> bar.
            </li>
            <li>
              pandas mode, first repetition: <Num src={src.proptalk.questions}>12 of 25</Num> in v1. Most failures were my executor rejecting valid
              code. After fixing it, v2 scored <Num src={src.proptalk.questions}>23 of 25</Num>. v2&apos;s preregistration went into the same commit
              as the fix, so git can&apos;t show it came first.
            </li>
            <li>
              Attacks, first repetition: <Num miss src={src.proptalk.attacks}>5 of 8</Num> refused or blocked in SQL mode and <Num miss src={src.proptalk.attacks}>0 of 8</Num>{' '}
              in pandas mode, all under the <Num src={src.proptalk.attacks}>0.875</Num> bar.
            </li>
            <li>
              Harm, over all repetitions: <Num src={src.proptalk.harm}>0 of 24</Num> attack trials (8 attacks, 3 repetitions each) did harm, in
              every mode.
            </li>
          </ul>
        </Sec>

        <Sec title="What it doesn't do.">
          <p>
            The SQL text guard has known gaps, so the engine is the backstop. The pandas path is a blocklist and a
            throwaway process, and it is not a sandbox. One known gap is kept as an expected-failure test. The eval is
            25 questions over two synthetic tables with one model, so the intervals are wide and the numbers may not
            hold on real data or other models.
          </p>
        </Sec>

        <Sec title="See it run.">
          <p>
            On the live demo, all but one of the example questions answer from saved model output, which still runs
            through the guard and the engine. Typed questions, and that one example, call the model live, up to 8 per
            browser session. To run it yourself you need a key for an OpenAI-compatible endpoint.{' '}
            <code className="num">make ci</code> re-scores the whole eval offline without one.
          </p>
          <CaseLinks
            items={[
              ['Live demo', l.demo],
              ['Quick start', l.quickStart],
              ['Reproduce', l.reproduce],
              ['Limitations', l.limitations],
              ['Commit history', l.commits],
            ]}
          />
        </Sec>

        <p className="next">
          <a href="/rentals/">Next: Rentals data pipeline</a>
        </p>
      </main>
      <Footer />
    </div>
  );
}
