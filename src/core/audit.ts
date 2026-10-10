// File: src/core/audit.ts
// Append-only JSONL audit store with a content hash tying each row to its inputs (§27).
// seed-decisions.jsonl (committed cold-start) is read BEFORE live-decisions.jsonl so the
// landing money-shot is stable. Append-only: appendFile only; no update/delete surface exists.

import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import type {
  DebateTranscript,
  DecisionRecord,
  EvidencePacket,
  JudgeVerdict,
  OrderResult,
} from './types';

const EVIDENCE_DIR = path.join(process.cwd(), 'evidence');
const LIVE_LOG = path.join(EVIDENCE_DIR, 'live-decisions.jsonl');
const SEED_LOG = path.join(EVIDENCE_DIR, 'seed-decisions.jsonl');

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
  ): Promise<DecisionRecord> {
    const record: DecisionRecord = {
      id: randomUUID(),
      ts: new Date().toISOString(),
      packet,
      transcript,
      verdict,
      orderResult,
      evidenceHash: hashPacket(packet),
    };
    await mkdir(EVIDENCE_DIR, { recursive: true });
    await appendFile(LIVE_LOG, JSON.stringify(record) + '\n', 'utf8');
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
