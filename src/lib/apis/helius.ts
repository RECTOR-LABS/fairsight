import { trackApiCall } from '../budget';

const HELIUS_URL = process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com';
const API_KEY = process.env.HELIUS_API_KEY || '';

function rpcUrl(): string {
  return `${HELIUS_URL}/?api-key=${API_KEY}`;
}

async function heliusRpc<T>(method: string, params: unknown[]): Promise<T | null> {
  const start = Date.now();
  try {
    const res = await fetch(rpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    });

    const latency = Date.now() - start;
    if (!res.ok) {
      await trackApiCall('helius', method, false, latency);
      return null;
    }

    const json = await res.json();
    await trackApiCall('helius', method, true, latency);

    if (json.error) {
      console.error(`[Helius] RPC error (${method}):`, json.error);
      return null;
    }

    return json.result as T;
  } catch (err) {
    await trackApiCall('helius', method, false, Date.now() - start);
    console.error(`[Helius] Request failed (${method}):`, err);
    return null;
  }
}

export interface HeliusAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      symbol: string;
      description?: string;
    };
    links?: {
      image?: string;
    };
    files?: { uri: string; mime: string }[];
  };
  authorities: { address: string; scopes: string[] }[];
  ownership: { owner: string };
  token_info?: {
    supply: number;
    decimals: number;
    price_info?: {
      price_per_token: number;
      currency: string;
    };
  };
  creators?: { address: string; share: number; verified: boolean }[];
}

export async function getAsset(mint: string): Promise<HeliusAsset | null> {
  return heliusRpc<HeliusAsset>('getAsset', [mint]);
}

export interface HeliusTokenAccount {
  address: string;
  mint: string;
  owner: string;
  amount: number;
  delegated_amount: number;
  frozen: boolean;
}

interface TokenAccountsResponse {
  total: number;
  limit: number;
  token_accounts: HeliusTokenAccount[];
}

export async function getTokenAccounts(
  mint: string,
  limit: number = 100,
): Promise<HeliusTokenAccount[]> {
  const result = await heliusRpc<TokenAccountsResponse>(
    'getTokenAccounts',
    [{ mint, limit, options: { showZeroBalance: false } }],
  );
  return result?.token_accounts ?? [];
}

interface AssetsByAuthorityResponse {
  total: number;
  items: HeliusAsset[];
}

export async function getAssetsByAuthority(
  authority: string,
  limit: number = 100,
): Promise<HeliusAsset[]> {
  const result = await heliusRpc<AssetsByAuthorityResponse>(
    'getAssetsByAuthority',
    [{ authorityAddress: authority, limit }],
  );
  return result?.items ?? [];
}

interface SignatureInfo {
  signature: string;
  slot: number;
  timestamp: number;
  type: string;
  description?: string;
}

export async function getSignaturesForAsset(
  mint: string,
  limit: number = 100,
): Promise<SignatureInfo[]> {
  const result = await heliusRpc<SignatureInfo[]>(
    'getSignaturesForAsset',
    [{ id: mint, limit }],
  );
  return result ?? [];
}

export async function getTokenDeployer(mint: string): Promise<string | null> {
  const asset = await getAsset(mint);
  if (!asset) return null;

  // Check authorities for the update authority (typically deployer)
  const authority = asset.authorities?.find(
    (a) => a.scopes?.includes('full') || a.scopes?.includes('metadata'),
  );
  if (authority) return authority.address;

  // Fallback: check creators
  const creator = asset.creators?.find((c) => c.verified);
  return creator?.address ?? null;
}
