import { links } from '@/lib/links';

export function Top({ home }: { home?: boolean }) {
  return (
    <nav className="top" aria-label="Main">
      {home && (
        <a className="home" href="/">
          Jairaj Saraf
        </a>
      )}
      <a href={links.linkedin}>LinkedIn</a>
      <a href={links.github}>GitHub</a>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="site">
      <a href={links.linkedin}>LinkedIn</a>
      <a href={links.github}>GitHub</a>
    </footer>
  );
}
