'use client';

import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';

// motion.dev/docs/react-accessibility: follow the OS Reduced Motion setting.
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
