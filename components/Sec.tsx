import type { ReactNode } from 'react';

/** A case-study section: the bold label from content.md in the left column, the copy on the right. */
export function Sec({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="sec">
      <h2>{title}</h2>
      <div className="body">{children}</div>
    </section>
  );
}

export function CaseLinks({ items }: { items: [string, string][] }) {
  return (
    <div className="links">
      {items.map(([label, href]) => (
        <a
          key={label}
          href={href}
          {...(label === 'Live demo' && { target: '_blank', rel: 'noopener noreferrer' })}
        >
          {label}
          {label === 'Live demo' && <span className="sr-only"> (opens in a new tab)</span>}
        </a>
      ))}
    </div>
  );
}
