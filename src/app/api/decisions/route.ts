// File: src/app/api/decisions/route.ts
import { NextResponse } from 'next/server';
import { Audit } from '../../../core/audit';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  const audit = new Audit();
  if (id) return NextResponse.json((await audit.get(id)) ?? { error: 'not found' });
  return NextResponse.json(await audit.list());
}
