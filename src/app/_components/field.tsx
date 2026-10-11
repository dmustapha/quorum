// File: src/app/_components/field.tsx
// The .field atmosphere — pure CSS layers (glow-a/glow-b/engrave/grain) ported from the
// reference. The optional animated filament SVG is a client child (Filaments). Server-safe:
// the CSS layers render statically; only Filaments (its own 'use client') animates.
import type { ReactNode } from 'react';
import { Filaments } from './site-chrome';

export function Field({
  filaments = false,
  glowA,
  glowB = false,
  engrave = false,
  grain = false,
}: {
  filaments?: boolean;
  glowA?: boolean | number;
  glowB?: boolean | number;
  engrave?: boolean;
  grain?: boolean;
}): ReactNode {
  return (
    <div className="field">
      {filaments && <Filaments />}
      {glowA !== false && glowA !== undefined && (
        <div
          className="glow-a"
          style={typeof glowA === 'number' ? { opacity: glowA } : undefined}
        />
      )}
      {glowB !== false && (
        <div
          className="glow-b"
          style={typeof glowB === 'number' ? { opacity: glowB } : undefined}
        />
      )}
      {engrave && <div className="engrave" />}
      {grain && <div className="grain" />}
    </div>
  );
}
