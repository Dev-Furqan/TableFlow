import {describe,expect,it} from 'vitest';import {isFreshTimestamp,signPayload,verifySignature} from './webhookSigning.js';

describe('Orange Website webhook signing',()=>{
  const secret='test-shared-secret-that-is-long-enough';const body='{"externalOrderId":"orange-1"}';const timestamp='2026-08-12T12:00:00.000Z';
  it('generates and verifies a deterministic HMAC-SHA256 signature',()=>{const signature=signPayload(timestamp,body,secret);expect(signature).toHaveLength(64);expect(verifySignature(timestamp,body,signature,secret)).toBe(true);});
  it('rejects a modified raw body or secret',()=>{const signature=signPayload(timestamp,body,secret);expect(verifySignature(timestamp,'{}',signature,secret)).toBe(false);expect(verifySignature(timestamp,body,signature,`${secret}x`)).toBe(false);});
  it('enforces the replay window',()=>{expect(isFreshTimestamp(timestamp,300,Date.parse('2026-08-12T12:04:59.000Z'))).toBe(true);expect(isFreshTimestamp(timestamp,300,Date.parse('2026-08-12T12:05:01.000Z'))).toBe(false);});
});
