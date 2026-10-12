import { describe, it, expect } from 'vitest';
import { classifyResponse, isParseableJson } from '../scripts/spike/classify';

describe('classifyResponse', () => {
  it('non-200 / transport failure is error, never empty (429 must not inflate empty-rate)', () => {
    expect(classifyResponse({ kind: 'error', status: 429 })).toBe('error');
    expect(classifyResponse({ kind: 'error' })).toBe('error');
  });
  it('empty string content is empty', () => {
    expect(classifyResponse({ kind: 'ok', content: '' })).toBe('empty');
  });
  it('whitespace-only content is empty', () => {
    expect(classifyResponse({ kind: 'ok', content: '   \n\t' })).toBe('empty');
  });
  it('non-empty content is valid even if it is not JSON', () => {
    expect(classifyResponse({ kind: 'ok', content: 'the stock likely rose' })).toBe('valid');
  });
  it('isParseableJson distinguishes a valid-but-unparseable generation', () => {
    expect(isParseableJson('{"thesis":"x","confidence":0.6}')).toBe(true);
    expect(isParseableJson('the stock likely rose')).toBe(false);
    expect(isParseableJson('{"thesis": truncat')).toBe(false);
  });
});
