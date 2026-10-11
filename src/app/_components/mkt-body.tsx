// File: src/app/_components/mkt-body.tsx
// Adds the `mkt` class to <body> while the landing is mounted — it drives the ambient animations
// (.mkt .grain / .engrave / .seal-ring / .glow-a / .glow-b) exactly as the reference body.mkt.
'use client';

import { useEffect } from 'react';

export function MktBody() {
  useEffect(() => {
    document.body.classList.add('mkt');
    return () => document.body.classList.remove('mkt');
  }, []);
  return null;
}
