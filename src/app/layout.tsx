import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Geist, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from './_components/app-shell';
import universe from '../../data/universe.json';

const grot = Geist({ subsets: ['latin'], variable: '--font-grot', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Quorum — argue before you trade',
  description: 'Adversarial Bull/Bear/Risk LLM debate → Judge verdict → paper order on Bitget Agent Hub.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${grot.variable} ${mono.variable}`}>
      <body>
        <AppShell universe={universe as string[]}>{children}</AppShell>
      </body>
    </html>
  );
}
