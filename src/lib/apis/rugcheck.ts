import { trackApiCall } from '../budget';

const BASE_URL = 'https://api.rugcheck.xyz/v1';

export interface RugCheckReport {
  mint: string;
  score: number;
  risks: RugCheckRisk[];
  topHolders: RugCheckHolder[];
  markets: RugCheckMarket[];
  tokenMeta?: {
    name: string;
    symbol: string;
    uri: string;
  };
  fileMeta?: {
    description?: string;
    image?: string;
  };
  freezeAuthority: string | null;
  mintAuthority: string | null;
}

export interface RugCheckRisk {
  name: string;
  description: string;
  level: 'critical' | 'warn' | 'info';
  score: number;
}

export interface RugCheckHolder {
  address: string;
  pct: number;
  amount: number;
  insider: boolean;
}

export interface RugCheckMarket {
  marketType: string;
  pubkey: string;
  liquidityA: number;
  liquidityB: number;
  mintA: string;
  mintB: string;
}

export async function getRugCheckReport(mint: string): Promise<RugCheckReport | null> {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/tokens/${mint}/report`);
    const latency = Date.now() - start;

    if (!res.ok) {
      await trackApiCall('rugcheck', '/report', false, latency);
      return null;
    }

    const data = await res.json();
    await trackApiCall('rugcheck', '/report', true, latency);
    return data;
  } catch (err) {
    await trackApiCall('rugcheck', '/report', false, Date.now() - start);
    console.error('[RugCheck] Report error:', err);
    return null;
  }
}

export function normalizeRugCheckScore(report: RugCheckReport | null): number {
  if (!report) return 50;
  // RugCheck score: lower = riskier, we normalize to 0-100 where 100 = safe
  return Math.max(0, Math.min(100, report.score));
}

export function extractInsiderPercent(report: RugCheckReport | null): number {
  if (!report?.topHolders || !Array.isArray(report.topHolders)) return 0;
  return report.topHolders
    .filter((h) => h.insider)
    .reduce((sum, h) => sum + (Number(h.pct) || 0), 0);
}

export function extractLiquidity(report: RugCheckReport | null): number {
  if (!report?.markets?.length) return 0;
  return report.markets.reduce(
    (sum, m) => sum + (Number(m.liquidityA) || 0) + (Number(m.liquidityB) || 0),
    0,
  );
}
