import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTokenInfo,
  getTokenPrice,
  deriveOrganicScore,
} from '../../apis/jupiter';
import type { JupiterPrice } from '../../apis/jupiter';

vi.mock('../../budget', () => ({
  trackApiCall: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getTokenInfo', () => {
  it('returns token info on success', async () => {
    const token = { address: 'mint1', name: 'Test', symbol: 'TST', decimals: 9 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(token),
    });

    const result = await getTokenInfo('mint1');
    expect(result).toEqual(token);
  });

  it('returns null on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await getTokenInfo('mint1');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'));

    const result = await getTokenInfo('mint1');
    expect(result).toBeNull();
  });
});

describe('getTokenPrice', () => {
  it('returns price data for mint', async () => {
    const priceData = { id: 'mint1', type: 'derivedPrice', price: '1.23' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { mint1: priceData } }),
    });

    const result = await getTokenPrice('mint1');
    expect(result).toEqual(priceData);
  });

  it('returns null when mint not in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    });

    const result = await getTokenPrice('mint1');
    expect(result).toBeNull();
  });

  it('returns null on failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await getTokenPrice('mint1');
    expect(result).toBeNull();
  });
});

describe('deriveOrganicScore', () => {
  it('returns 50 for null price', () => {
    expect(deriveOrganicScore(null)).toBe(50);
  });

  it('returns 50 for price without extraInfo', () => {
    const price: JupiterPrice = { id: 'mint1', type: 'derived', price: '1.0' };
    expect(deriveOrganicScore(price)).toBe(50);
  });

  it('adds 20 for high confidence', () => {
    const price: JupiterPrice = {
      id: 'mint1',
      type: 'derived',
      price: '1.0',
      extraInfo: { confidenceLevel: 'high' },
    };
    expect(deriveOrganicScore(price)).toBe(70);
  });

  it('subtracts 10 for low confidence', () => {
    const price: JupiterPrice = {
      id: 'mint1',
      type: 'derived',
      price: '1.0',
      extraInfo: { confidenceLevel: 'low' },
    };
    expect(deriveOrganicScore(price)).toBe(40);
  });

  it('adds for good depth', () => {
    const price: JupiterPrice = {
      id: 'mint1',
      type: 'derived',
      price: '1.0',
      extraInfo: {
        confidenceLevel: 'medium',
        depth: { buyPriceImpactRatio: { '10000': 0.005 } },
      },
    };
    const score = deriveOrganicScore(price);
    expect(score).toBe(75); // 50 + 10 (medium) + 15 (low impact)
  });

  it('adds for tight spread', () => {
    const price: JupiterPrice = {
      id: 'mint1',
      type: 'derived',
      price: '1.0',
      extraInfo: {
        confidenceLevel: 'medium',
        quotedPrice: {
          buyPrice: '1.0',
          buyAt: 0,
          sellPrice: '0.995',
          sellAt: 0,
        },
      },
    };
    const score = deriveOrganicScore(price);
    expect(score).toBe(75); // 50 + 10 (medium) + 15 (< 1% spread)
  });

  it('clamps to 0-100 range', () => {
    const price: JupiterPrice = {
      id: 'mint1',
      type: 'derived',
      price: '1.0',
      extraInfo: {
        confidenceLevel: 'high',
        depth: { buyPriceImpactRatio: { '10000': 0.001 } },
        quotedPrice: {
          buyPrice: '1.0',
          buyAt: 0,
          sellPrice: '0.999',
          sellAt: 0,
        },
      },
    };
    const score = deriveOrganicScore(price);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
