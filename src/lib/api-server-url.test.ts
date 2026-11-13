import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function memoryStorage(seed: Record<string, string>): Storage {
  const store = new Map(Object.entries(seed));
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => store.get(k) ?? null,
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => void store.delete(k),
    setItem: (k, v) => void store.set(k, String(v)),
  };
}

describe('server address in production builds', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('ignores and clears a stored override, and cannot be changed', async () => {
    vi.stubEnv('DEV', false);
    const storage = memoryStorage({ lp_backend_url: 'https://evil.example' });
    vi.stubGlobal('localStorage', storage);
    const api = await import('./api');
    expect(api.CAN_CONFIGURE_SERVER).toBe(false);
    expect(api.getApiBaseUrl()).not.toBe('https://evil.example');
    expect(storage.getItem('lp_backend_url')).toBeNull();
    api.setApiBaseUrl('https://other.example');
    expect(api.getApiBaseUrl()).not.toBe('https://other.example');
  });

  it('lets development builds point at another server', async () => {
    vi.stubEnv('DEV', true);
    vi.stubGlobal('localStorage', memoryStorage({ lp_backend_url: 'http://127.0.0.1:4000' }));
    const api = await import('./api');
    expect(api.getApiBaseUrl()).toBe('http://127.0.0.1:4000');
  });
});
