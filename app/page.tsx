import { Footer, Top } from '@/components/Chrome';
import { Sheet } from '@/components/Sheet';
import { links } from '@/lib/links';

export default function Home() {
  return (
    <div className="wrap">
      <Top />

      <main>
      <header className="intro">
        <h1>Jairaj Saraf</h1>
        <p className="lede">
          AI engineer. I build LLM features that work on top of data, and I publish the evaluations, including the
          runs that missed the bar.
        </p>
      </header>

      <Sheet />

      <section className="projects" aria-label="Projects">
        <article className="tile">
          <h2>
            <a href="/rtdp/">Real-time agentic data platform</a>
          </h2>
          <p className="src">Synthetic data. The one real run, an OpenSky ingest, is kept as counts only.</p>
          <p className="what">
            Flight data lands in an Apache Iceberg table behind a data-quality gate, a read-only FastAPI and DuckDB API
            serves it, and an LLM agent answers questions by calling that API. The agent has no tool that can write.
          </p>
          <p className="lim">Micro-batch ingestion, no Kafka or Flink.</p>
          <div className="links">
            <a className="primary" href="/rtdp/">
              Case study
            </a>
            <a href={links.rtdp.code}>Code</a>
            <a href={links.rtdp.demo} target="_blank" rel="noopener noreferrer">Live demo (read API only)<span className="sr-only"> (opens in a new tab)</span></a>
          </div>
        </article>

        <article className="tile">
          <h2>
            <a href="/proptalk/">PropTalk</a>
          </h2>
          <p className="src">Synthetic data, two generated tables.</p>
          <p className="what">
            Ask a question about property data in plain English. An LLM writes SQL or pandas code, PropTalk checks it,
            runs it on a locked-down engine, and shows a chart and a table.
          </p>
          <p className="lim">The pandas path is not a sandbox.</p>
          <div className="links">
            <a className="primary" href="/proptalk/">
              Case study
            </a>
            <a href={links.proptalk.code}>Code</a>
            <a href={links.proptalk.demo} target="_blank" rel="noopener noreferrer">Live demo<span className="sr-only"> (opens in a new tab)</span></a>
          </div>
        </article>

        <article className="tile">
          <h2>
            <a href={links.rentals.code}>Rentals data pipeline</a>
          </h2>
          <p className="src">Real public data (Zillow ZORI). The CSV isn&apos;t in the repo.</p>
          <p className="what">
            I wanted the same PySpark transforms to give identical results locally and on Databricks. This ETL runs
            Zillow&apos;s ZIP-level rent index through config-driven data-quality checks on both.
          </p>
          <p className="lim">
            The Databricks side is one manual run saved in the repo, and re-running it needs a Databricks login. The
            download step is a stub.
          </p>
          <div className="links">
            <a className="primary" href={links.rentals.code}>
              Code
            </a>
          </div>
        </article>
      </section>
      </main>

      <Footer />
    </div>
  );
}
