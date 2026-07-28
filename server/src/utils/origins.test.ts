import {describe, expect, it} from 'vitest';
import {isOriginAllowed} from './origins.js';

describe('isOriginAllowed', () => {
  it('allows a configured client origin', () => {
    expect(isOriginAllowed('https://table-flow-client-1jg9.vercel.app', ['https://table-flow-client-1jg9.vercel.app'], 'production')).toBe(true);
  });

  it('allows origins from a comma-separated allow-list', () => {
    expect(isOriginAllowed('https://demo.vercel.app', ['https://table-flow-client-1jg9.vercel.app', 'https://demo.vercel.app'], 'production')).toBe(true);
  });

  it('allows localhost in development mode', () => {
    expect(isOriginAllowed('http://localhost:5173', [], 'development')).toBe(true);
  });

  it('rejects unknown origins', () => {
    expect(isOriginAllowed('https://evil.example', ['https://table-flow-client-1jg9.vercel.app'], 'production')).toBe(false);
  });
});
