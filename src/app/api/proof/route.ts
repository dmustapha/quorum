// File: src/app/api/proof/route.ts
import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Audit } from '../../../core/audit';

export const runtime = 'nodejs';

export async function GET() {
  const audit = new Audit();
  const records = await audit.list();
  const orderIds = records.map((r) => ({ id: r.id, orderResult: r.orderResult, evidenceHash: r.evidenceHash }));
  let claims = '';
  try { claims = await readFile(path.join(process.cwd(), 'CLAIMS.md'), 'utf8'); } catch { /* */ }
  return NextResponse.json({ orderIds, claims });
}
