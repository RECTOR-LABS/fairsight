import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRugCheckReport,
  normalizeRugCheckScore,
  extractInsiderPercent,
  extractLiquidity,
} from '../../apis/rugcheck';
import type { RugCheckReport } from '../../apis/rugcheck';

vi.mock('../../budget', () => ({
  trackApiCall: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeReport(overrides: Partial<RugCheckReport> = {}): RugCheckReport {
  return {
    mint: 'mint1',
    score: 75,
    risks: [],
    topHolders: [],
    markets: [],
    freezeAuthority: null,
    mintAuthority: null,
    ...overrides,
  };
}

describe('getRugCheckReport', () => {
  it('returns report on success', async () => {
    const report = makeReport();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(report),
    });

    const result = await getRugCheckReport('mint1');
    expect(result).toEqual(report);
  });

  it('returns null on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await getRugCheckReport('mint1');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'));

    const result = await getRugCheckReport('mint1');
    expect(result).toBeNull();
  });
});

describe('normalizeRugCheckScore', () => {
  it('returns score clamped to 0-100', () => {
    expect(normalizeRugCheckScore(makeReport({ score: 75 }))).toBe(75);
    expect(normalizeRugCheckScore(makeReport({ score: 150 }))).toBe(100);
    expect(normalizeRugCheckScore(makeReport({ score: -10 }))).toBe(0);
  });

  it('returns 50 for null report', () => {
    expect(normalizeRugCheckScore(null)).toBe(50);
  });
});

describe('extractInsiderPercent', () => {
  it('sums insider holder percentages', () => {
    const report = makeReport({
      topHolders: [
        { address: 'a', pct: 10, amount: 100, insider: true },
        { address: 'b', pct: 5, amount: 50, insider: true },
        { address: 'c', pct: 20, amount: 200, insider: false },
      ],
    });
    expect(extractInsiderPercent(report)).toBe(15);
  });

  it('returns 0 for null report', () => {
    expect(extractInsiderPercent(null)).toBe(0);
  });

  it('returns 0 for no insiders', () => {
    const report = makeReport({
      topHolders: [{ address: 'a', pct: 10, amount: 100, insider: false }],
    });
    expect(extractInsiderPercent(report)).toBe(0);
  });
});

describe('extractLiquidity', () => {
  it('sums all market liquidity', () => {
    const report = makeReport({
      markets: [
        { marketType: 'amm', pubkey: 'p1', liquidityA: 1000, liquidityB: 500, mintA: 'a', mintB: 'b' },
        { marketType: 'clmm', pubkey: 'p2', liquidityA: 200, liquidityB: 300, mintA: 'a', mintB: 'c' },
      ],
    });
    expect(extractLiquidity(report)).toBe(2000);
  });

  it('returns 0 for no markets', () => {
    expect(extractLiquidity(makeReport())).toBe(0);
  });

  it('returns 0 for null report', () => {
    expect(extractLiquidity(null)).toBe(0);
  });
});
