import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAsset,
  getTokenAccounts,
  getAssetsByAuthority,
  getSignaturesForAsset,
  getTokenDeployer,
} from '../../apis/helius';

vi.mock('../../budget', () => ({
  trackApiCall: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

function rpcSuccess(result: unknown) {
  return {
    ok: true,
    json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result }),
  };
}

function rpcError() {
  return {
    ok: true,
    json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, error: { code: -32600, message: 'Bad request' } }),
  };
}

describe('getAsset', () => {
  it('returns asset data on success', async () => {
    const asset = {
      id: 'mint123',
      content: { metadata: { name: 'Test', symbol: 'TST' } },
      authorities: [],
      ownership: { owner: 'owner1' },
    };
    mockFetch.mockResolvedValueOnce(rpcSuccess(asset));

    const result = await getAsset('mint123');
    expect(result).toEqual(asset);
  });

  it('returns null on RPC error', async () => {
    mockFetch.mockResolvedValueOnce(rpcError());

    const result = await getAsset('mint123');
    expect(result).toBeNull();
  });

  it('returns null on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await getAsset('mint123');
    expect(result).toBeNull();
  });

  it('returns null on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await getAsset('mint123');
    expect(result).toBeNull();
  });
});

describe('getTokenAccounts', () => {
  it('returns token accounts', async () => {
    const accounts = [
      { address: 'a1', mint: 'm1', owner: 'o1', amount: 1000, delegated_amount: 0, frozen: false },
    ];
    mockFetch.mockResolvedValueOnce(rpcSuccess({ total: 1, limit: 100, token_accounts: accounts }));

    const result = await getTokenAccounts('m1');
    expect(result).toEqual(accounts);
  });

  it('returns empty array when result is null', async () => {
    mockFetch.mockResolvedValueOnce(rpcSuccess(null));

    const result = await getTokenAccounts('m1');
    expect(result).toEqual([]);
  });
});

describe('getAssetsByAuthority', () => {
  it('returns items from response', async () => {
    const items = [{ id: 'asset1' }];
    mockFetch.mockResolvedValueOnce(rpcSuccess({ total: 1, items }));

    const result = await getAssetsByAuthority('authority1');
    expect(result).toEqual(items);
  });

  it('returns empty array on null result', async () => {
    mockFetch.mockResolvedValueOnce(rpcSuccess(null));

    const result = await getAssetsByAuthority('authority1');
    expect(result).toEqual([]);
  });
});

describe('getSignaturesForAsset', () => {
  it('returns signatures', async () => {
    const sigs = [
      { signature: 'sig1', slot: 100, timestamp: 1700000000, type: 'transfer' },
    ];
    mockFetch.mockResolvedValueOnce(rpcSuccess(sigs));

    const result = await getSignaturesForAsset('mint1');
    expect(result).toEqual(sigs);
  });

  it('returns empty array on failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await getSignaturesForAsset('mint1');
    expect(result).toEqual([]);
  });
});

describe('getTokenDeployer', () => {
  it('returns authority with full scope', async () => {
    mockFetch.mockResolvedValueOnce(rpcSuccess({
      id: 'mint1',
      content: { metadata: { name: 'T', symbol: 'T' } },
      authorities: [{ address: 'deployer1', scopes: ['full'] }],
      ownership: { owner: 'owner1' },
    }));

    const result = await getTokenDeployer('mint1');
    expect(result).toBe('deployer1');
  });

  it('falls back to verified creator', async () => {
    mockFetch.mockResolvedValueOnce(rpcSuccess({
      id: 'mint1',
      content: { metadata: { name: 'T', symbol: 'T' } },
      authorities: [],
      ownership: { owner: 'owner1' },
      creators: [{ address: 'creator1', share: 100, verified: true }],
    }));

    const result = await getTokenDeployer('mint1');
    expect(result).toBe('creator1');
  });

  it('returns null when asset not found', async () => {
    mockFetch.mockResolvedValueOnce(rpcSuccess(null));

    const result = await getTokenDeployer('mint1');
    expect(result).toBeNull();
  });
});
