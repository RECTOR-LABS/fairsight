import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTokenSecurity,
  extractGoPlusFlags,
  deriveGoPlusScore,
} from '../../apis/goplus';

vi.mock('../../budget', () => ({
  trackApiCall: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getTokenSecurity', () => {
  it('returns security data on success', async () => {
    const securityData = { mint1: { is_honeypot: '0', is_mintable: '1' } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ code: 1, result: securityData }),
    });

    const result = await getTokenSecurity('mint1');
    expect(result).toEqual(securityData);
  });

  it('returns null when code is not 1', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ code: 0, result: null }),
    });

    const result = await getTokenSecurity('mint1');
    expect(result).toBeNull();
  });

  it('returns null on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await getTokenSecurity('mint1');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'));

    const result = await getTokenSecurity('mint1');
    expect(result).toBeNull();
  });
});

describe('extractGoPlusFlags', () => {
  it('extracts honeypot flag', () => {
    const data = { mint1: { is_honeypot: '1' } };
    const flags = extractGoPlusFlags(data, 'mint1');
    expect(flags).toContainEqual(expect.objectContaining({ key: 'is_honeypot', severity: 'critical' }));
  });

  it('extracts mintable as warning', () => {
    const data = { mint1: { is_mintable: '1' } };
    const flags = extractGoPlusFlags(data, 'mint1');
    expect(flags).toContainEqual(expect.objectContaining({ key: 'is_mintable', severity: 'warning' }));
  });

  it('extracts buy tax flag when > 5%', () => {
    const data = { mint1: { buy_tax: '0.08' } };
    const flags = extractGoPlusFlags(data, 'mint1');
    expect(flags.some((f) => f.key === 'buy_tax')).toBe(true);
  });

  it('does not flag low buy tax', () => {
    const data = { mint1: { buy_tax: '0.02' } };
    const flags = extractGoPlusFlags(data, 'mint1');
    expect(flags.some((f) => f.key === 'buy_tax')).toBe(false);
  });

  it('returns empty array for null data', () => {
    expect(extractGoPlusFlags(null, 'mint1')).toEqual([]);
  });

  it('returns empty array when mint not in data', () => {
    const data = { other: { is_honeypot: '1' } };
    expect(extractGoPlusFlags(data, 'mint1')).toEqual([]);
  });
});

describe('deriveGoPlusScore', () => {
  it('returns 100 for no flags', () => {
    expect(deriveGoPlusScore([])).toBe(100);
  });

  it('deducts 25 per critical flag', () => {
    const flags = [
      { key: 'is_honeypot', label: 'Honeypot', severity: 'critical' as const, value: true },
    ];
    expect(deriveGoPlusScore(flags)).toBe(75);
  });

  it('deducts 10 per warning flag', () => {
    const flags = [
      { key: 'is_mintable', label: 'Mintable', severity: 'warning' as const, value: true },
    ];
    expect(deriveGoPlusScore(flags)).toBe(90);
  });

  it('never goes below 0', () => {
    const flags = Array.from({ length: 5 }).map((_, i) => ({
      key: `crit${i}`,
      label: `Critical ${i}`,
      severity: 'critical' as const,
      value: true,
    }));
    expect(deriveGoPlusScore(flags)).toBe(0);
  });
});
