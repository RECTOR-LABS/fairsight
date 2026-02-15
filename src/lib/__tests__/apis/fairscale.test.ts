import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFairScore, getBatchFairScores } from '../../apis/fairscale';

vi.mock('../../budget', () => ({
  canCallFairScale: vi.fn().mockResolvedValue(true),
  trackApiCall: vi.fn(),
}));

vi.mock('../../cache', () => ({
  getCached: vi.fn().mockResolvedValue(null),
  setCached: vi.fn().mockResolvedValue(undefined),
  CacheKeys: {
    fairScore: (w: string) => `fs:fairscore:${w}`,
  },
  CacheTTL: { FAIRSCORE: 604800 },
}));

vi.mock('../../prisma', () => ({
  prisma: {
    cachedFairScore: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { getCached } = await import('../../cache');
const { canCallFairScale } = await import('../../budget');
const { prisma } = await import('../../prisma');

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCached).mockResolvedValue(null);
  vi.mocked(canCallFairScale).mockResolvedValue(true);
  vi.mocked(prisma.cachedFairScore.findUnique).mockResolvedValue(null);
});

describe('getFairScore', () => {
  it('returns score from Redis cache', async () => {
    const cached = { wallet: 'w1', score: 75, tier: 3, tierLabel: 'Gold' };
    vi.mocked(getCached).mockResolvedValueOnce(cached);

    const result = await getFairScore('w1');
    expect(result).toEqual(cached);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns score from Postgres cache', async () => {
    vi.mocked(prisma.cachedFairScore.findUnique).mockResolvedValueOnce({
      id: '1',
      wallet: 'w1',
      score: 60,
      tier: 3,
      tierLabel: 'Gold',
      details: {},
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    } as never);

    const result = await getFairScore('w1');
    expect(result?.score).toBe(60);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches from API when cache empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ score: 85 }),
    });

    const result = await getFairScore('w1');
    expect(result?.score).toBe(85);
    expect(result?.tierLabel).toBe('Platinum');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns null when API fails and no cache', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await getFairScore('w1');
    expect(result).toBeNull();
  });

  it('returns stale data when budget exhausted', async () => {
    vi.mocked(canCallFairScale).mockResolvedValueOnce(false);
    vi.mocked(prisma.cachedFairScore.findUnique).mockResolvedValueOnce({
      id: '1',
      wallet: 'w1',
      score: 50,
      tier: 2,
      tierLabel: 'Silver',
      details: {},
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() - 86400000), // expired
    } as never);

    const result = await getFairScore('w1');
    expect(result?.score).toBe(50);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null when budget exhausted and no stale data', async () => {
    vi.mocked(canCallFairScale).mockResolvedValueOnce(false);

    const result = await getFairScore('w1');
    expect(result).toBeNull();
  });
});

describe('getBatchFairScores', () => {
  it('returns empty map for empty wallets', async () => {
    const result = await getBatchFairScores([]);
    expect(result.size).toBe(0);
  });

  it('returns cached scores without API calls', async () => {
    const cached = { wallet: 'w1', score: 70, tier: 3, tierLabel: 'Gold' };
    vi.mocked(getCached)
      .mockResolvedValueOnce(cached)  // getFairScoreCached for w1
      .mockResolvedValueOnce(null);   // getFairScoreCached for w2

    // w2 will need API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ score: 40 }),
    });

    const result = await getBatchFairScores(['w1', 'w2']);
    expect(result.get('w1')?.score).toBe(70);
  });

  it('respects budget limit and stops fetching', async () => {
    vi.mocked(canCallFairScale).mockResolvedValueOnce(false);

    const result = await getBatchFairScores(['w1', 'w2', 'w3']);
    // All are cache misses, budget says no → should return empty for all
    expect(result.size).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
