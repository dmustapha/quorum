import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Audit } from '../core/audit';
import { sealFromRecord, type SealProps } from './_components/seal-data';
import { SiteNav, SiteFooter, ScrollIndicator, Reveals } from './_components/site-chrome';

export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Quorum — four AIs argue each trade; a Judge rules and keeps the dissent',
  description:
    'Adversarial Bull/Bear/Risk LLM debate -> Judge verdict with preserved dissent -> paper order on Bitget Demo.',
};

// Anti-FOUC: restore the saved theme + mark the document js-enabled before paint.
const BOOT = `try{var t=localStorage.getItem('quorum-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}document.documentElement.classList.add("js");`;

// Nav + footer mini-seals reflect the latest REAL decision (no fabricated hero).
async function navSeal(): Promise<SealProps> {
  const records = await new Audit().list();
  const latest = records[records.length - 1];
  return latest
    ? sealFromRecord(latest)
    : { conv: 0, bar: 60, verdict: 'NO_TRADE', dissent: 'BEAR' };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const seal = await navSeal();
  return (
    <html lang="en" data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ScrollIndicator />
        <Reveals />
        <SiteNav seal={seal} />
        {children}
        <SiteFooter seal={seal} />
      </body>
    </html>
  );
}
