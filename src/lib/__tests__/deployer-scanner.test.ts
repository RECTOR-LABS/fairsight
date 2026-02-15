import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTokenLaunchDate,
  determineTokenStatus,
  enrichDeployerTokens,
} from '../deployer-scanner';

vi.mock('../apis/helius', () => ({
  getSignaturesForAsset: vi.fn(),
}));

vi.mock('../apis/jupiter', () => ({
  getTokenPrice: vi.fn(),
}));

vi.mock('../apis/rugcheck', () => ({
  getRugCheckReport: vi.fn(),
  extractLiquidity: vi.fn(),
}));

vi.mock('../prisma', () => ({
  prisma: {
    deployerHistory: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

const { getSignaturesForAsset } = await import('../apis/helius');
const { getTokenPrice } = await import('../apis/jupiter');
const { getRugCheckReport, extractLiquidity } = await import('../apis/rugcheck');
const { prisma } = await import('../prisma');

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.deployerHistory.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.deployerHistory.upsert).mockResolvedValue({} as never);
});

describe('getTokenLaunchDate', () => {
  it('returns earliest signature timestamp as Date', async () => {
    vi.mocked(getSignaturesForAsset).mockResolvedValueOnce([
      { signature: 's1', slot: 200, timestamp: 1700000200, type: 'tx' },
      { signature: 's2', slot: 100, timestamp: 1700000100, type: 'tx' },
    ]);

    const result = await getTokenLaunchDate('mint1');
    expect(result).toEqual(new Date(1700000100 * 1000));
  });

  it('returns null when no signatures', async () => {
    vi.mocked(getSignaturesForAsset).mockResolvedValueOnce([]);

    const result = await getTokenLaunchDate('mint1');
    expect(result).toBeNull();
  });
});

describe('determineTokenStatus', () => {
  it('returns active when Jupiter price > 0', async () => {
    vi.mocked(getTokenPrice).mockResolvedValueOnce({
      id: 'mint1',
      type: 'derived',
      price: '0.5',
    });
    vi.mocked(getRugCheckReport).mockResolvedValueOnce(null);
    vi.mocked(extractLiquidity).mockReturnValueOnce(0);

    const status = await determineTokenStatus('mint1');
    expect(status).toBe('active');
  });

  it('returns rugged when RugCheck has critical rug risk', async () => {
    vi.mocked(getTokenPrice).mockResolvedValueOnce(null);
    vi.mocked(getRugCheckReport).mockResolvedValueOnce({
      mint: 'mint1',
      score: 10,
      risks: [{ name: 'Rug Pull detected', description: 'LP removed', level: 'critical', score: 0 }],
      topHolders: [],
      markets: [],
      freezeAuthority: null,
      mintAuthority: null,
    });
    vi.mocked(extractLiquidity).mockReturnValueOnce(0);

    const status = await determineTokenStatus('mint1');
    expect(status).toBe('rugged');
  });

  it('returns active when liquidity exists but no price', async () => {
    vi.mocked(getTokenPrice).mockResolvedValueOnce(null);
    vi.mocked(getRugCheckReport).mockResolvedValueOnce(null);
    vi.mocked(extractLiquidity).mockReturnValueOnce(50000);

    const status = await determineTokenStatus('mint1');
    expect(status).toBe('active');
  });

  it('returns dead when no price and no liquidity', async () => {
    vi.mocked(getTokenPrice).mockResolvedValueOnce(null);
    vi.mocked(getRugCheckReport).mockResolvedValueOnce(null);
    vi.mocked(extractLiquidity).mockReturnValueOnce(0);

    const status = await determineTokenStatus('mint1');
    expect(status).toBe('dead');
  });
});

describe('enrichDeployerTokens', () => {
  it('skips recently enriched tokens', async () => {
    const recentlyEnriched = {
      id: '1',
      deployerWallet: 'deployer1',
      tokenMint: 'mint1',
      tokenName: 'Token1',
      tokenSymbol: 'T1',
      launchDate: new Date(),
      currentStatus: 'active',
      peakMcap: 100000,
      currentMcap: 50000,
      createdAt: new Date(),
      updatedAt: new Date(), // just updated
    };

    vi.mocked(prisma.deployerHistory.findMany).mockResolvedValueOnce([recentlyEnriched] as never);

    const assets = [{
      id: 'mint1',
      content: { metadata: { name: 'Token1', symbol: 'T1' }, links: {} },
      authorities: [],
      ownership: { owner: 'o1' },
    }];

    const results = await enrichDeployerTokens('deployer1', assets as never);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('active');
    // Should NOT have called any external APIs
    expect(getTokenPrice).not.toHaveBeenCalled();
    expect(getRugCheckReport).not.toHaveBeenCalled();
  });

  it('enriches unknown tokens', async () => {
    vi.mocked(prisma.deployerHistory.findMany).mockResolvedValueOnce([]);
    vi.mocked(getSignaturesForAsset).mockResolvedValue([
      { signature: 's1', slot: 100, timestamp: 1700000000, type: 'tx' },
    ]);
    vi.mocked(getTokenPrice).mockResolvedValue({
      id: 'mint1',
      type: 'derived',
      price: '1.5',
    });
    vi.mocked(getRugCheckReport).mockResolvedValue(null);
    vi.mocked(extractLiquidity).mockReturnValue(0);

    const assets = [{
      id: 'mint1',
      content: { metadata: { name: 'Token1', symbol: 'T1' }, links: {} },
      authorities: [],
      ownership: { owner: 'o1' },
    }];

    const results = await enrichDeployerTokens('deployer1', assets as never);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('active');
    expect(results[0].launchDate).toBeDefined();
    expect(prisma.deployerHistory.upsert).toHaveBeenCalled();
  });
});
