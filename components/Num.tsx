import type { ReactNode } from 'react';
import type { Src } from '@/lib/links';

/** A printed figure. With `src` it links to the line that states it; the path shows on hover or focus (O1). */
export function Num({ children, miss, src }: { children: ReactNode; miss?: boolean; src?: Src }) {
  const cls = miss ? 'num miss' : 'num';
  if (!src) return <span className={cls}>{children}</span>;
  return (
    <a className={`${cls} src`} href={src.href}>
      {children}
      <span className="sr-only">, source file</span>
      <span className="src-path" aria-hidden="true">
        {src.path}
      </span>
    </a>
  );
}
