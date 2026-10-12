// File: src/core/audit.ts
// Append-only JSONL audit store with a content hash tying each row to its inputs (§27).
// seed-decisions.jsonl (committed cold-start) is read BEFORE live-decisions.jsonl so the
// landing money-shot is stable. Append-only: appendFile only; no update/delete surface exists.

import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import type {
  DebateTranscript,
  DecisionRecord,
  EvidencePacket,
  JudgeVerdict,
  OrderResult,
} from './types';

const EVIDENCE_DIR = path.join(process.cwd(), 'evidence');
const SEED_LOG = path.join(EVIDENCE_DIR, 'seed-decisions.jsonl');
// Live log is written at runtime. On a read-only serverless FS (Vercel: only /tmp is
// writable) the app dir cannot be appended to, so route live writes to the OS temp dir
// there. Seed decisions (committed) carry the demo either way, so live persistence is
// best-effort — a write failure must never 502 the hero flow.
const SERVERLESS_RO = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const LIVE_DIR = SERVERLESS_RO ? os.tmpdir() : EVIDENCE_DIR;
const LIVE_LOG = path.join(LIVE_DIR, 'live-decisions.jsonl');

/** evidenceHash = sha256(JSON.stringify(packet)) — re-hashing a stored packet must reproduce it. */
export function hashPacket(p: EvidencePacket): string {
  return createHash('sha256').update(JSON.stringify(p)).digest('hex');
}

export class Audit {
  async append(
    packet: EvidencePacket,
    transcript: DebateTranscript,
    verdict: JudgeVerdict,
    orderResult: OrderResult,
    signalsSuppressed = false,
  ): Promise<DecisionRecord> {
    const record: DecisionRecord = {
      id: randomUUID(),
      ts: new Date().toISOString(),
      packet,
      transcript,
      verdict,
      orderResult,
      evidenceHash: hashPacket(packet),
      signalsSuppressed,
    };
    // Best-effort durable append. A read-only/again-ephemeral FS must not break the
    // decision: the verdict + dissent are already computed and returned to the caller.
    try {
      await mkdir(LIVE_DIR, { recursive: true });
      await appendFile(LIVE_LOG, JSON.stringify(record) + '\n', 'utf8');
    } catch (err) {
      console.warn(`[audit] live append skipped (non-durable FS): ${String(err)}`);
    }
    return record;
  }

  async list(): Promise<DecisionRecord[]> {
    const out: DecisionRecord[] = [];
    for (const file of [SEED_LOG, LIVE_LOG]) {
      try {
        const txt = await readFile(file, 'utf8');
        for (const line of txt.split('\n').filter(Boolean)) {
          out.push(JSON.parse(line) as DecisionRecord);
        }
      } catch { /* file may not exist yet */ }
    }
    return out;
  }

  async get(id: string): Promise<DecisionRecord | undefined> {
    return (await this.list()).find((r) => r.id === id);
  }
}
