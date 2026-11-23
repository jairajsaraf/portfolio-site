import type { ReactNode } from 'react';

export function Num({ children, miss }: { children: ReactNode; miss?: boolean }) {
  return <span className={miss ? 'num miss' : 'num'}>{children}</span>;
}
