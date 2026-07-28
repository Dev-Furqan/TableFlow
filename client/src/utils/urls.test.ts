import {describe, expect, it} from 'vitest';
import {resolveApiBaseUrl, resolveSocketUrl} from './urls.js';

describe('resolveApiBaseUrl', () => {
  it('adds /api when the configured URL is a server origin', () => {
    expect(resolveApiBaseUrl('https://table-flow-server.vercel.app', 'https://table-flow-client-1jg9.vercel.app')).toBe('https://table-flow-server.vercel.app/api');
  });

  it('keeps an explicit api path intact', () => {
    expect(resolveApiBaseUrl('https://table-flow-server.vercel.app/api', 'https://table-flow-client-1jg9.vercel.app')).toBe('https://table-flow-server.vercel.app/api');
  });

  it('uses a relative path when no remote URL is configured', () => {
    expect(resolveApiBaseUrl('', 'https://table-flow-client-1jg9.vercel.app')).toBe('/api');
  });
});

describe('resolveSocketUrl', () => {
  it('strips /api from a configured server URL before creating a socket connection', () => {
    expect(resolveSocketUrl('https://table-flow-server.vercel.app/api', 'https://table-flow-client-1jg9.vercel.app')).toBe('https://table-flow-server.vercel.app');
  });

  it('falls back to the current origin when no remote URL is configured', () => {
    expect(resolveSocketUrl('', 'https://table-flow-client-1jg9.vercel.app')).toBe('https://table-flow-client-1jg9.vercel.app');
  });
});
