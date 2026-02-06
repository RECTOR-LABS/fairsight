import { trackApiCall } from '../budget';

const BASE_URL = 'https://tokens.jup.ag';
const PRICE_URL = 'https://api.jup.ag/price/v2';

export interface JupiterToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  daily_volume?: number;
  freeze_authority?: string | null;
  mint_authority?: string | null;
  permanent_delegate?: string | null;
  extensions?: {
    coingeckoId?: string;
  };
}

export interface JupiterPrice {
  id: string;
  type: string;
  price: string;
  extraInfo?: {
    lastSwappedPrice?: {
      lastJupiterSellAt: number;
      lastJupiterSellPrice: string;
      lastJupiterBuyAt: number;
      lastJupiterBuyPrice: string;
    };
    quotedPrice?: {
      buyPrice: string;
      buyAt: number;
      sellPrice: string;
      sellAt: number;
    };
    confidenceLevel: string;
    depth?: {
      buyPriceImpactRatio?: Record<string, number>;
      sellPriceImpactRatio?: Record<string, number>;
    };
  };
}

export async function getTokenInfo(mint: string): Promise<JupiterToken | null> {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/token/${mint}`);
    const latency = Date.now() - start;

    if (!res.ok) {
      await trackApiCall('jupiter', '/token', false, latency);
      return null;
    }

    const data = await res.json();
    await trackApiCall('jupiter', '/token', true, latency);
    return data;
  } catch (err) {
    await trackApiCall('jupiter', '/token', false, Date.now() - start);
    console.error('[Jupiter] Token info error:', err);
    return null;
  }
}

export async function getTokenPrice(mint: string): Promise<JupiterPrice | null> {
  const start = Date.now();
  try {
    const res = await fetch(
      `${PRICE_URL}?ids=${mint}&showExtraInfo=true`,
    );
    const latency = Date.now() - start;

    if (!res.ok) {
      await trackApiCall('jupiter', '/price', false, latency);
      return null;
    }

    const data = await res.json();
    await trackApiCall('jupiter', '/price', true, latency);
    return data.data?.[mint] ?? null;
  } catch (err) {
    await trackApiCall('jupiter', '/price', false, Date.now() - start);
    console.error('[Jupiter] Price error:', err);
    return null;
  }
}

export function deriveOrganicScore(price: JupiterPrice | null): number {
  if (!price?.extraInfo) return 50;

  let score = 50;
  const { confidenceLevel, depth } = price.extraInfo;

  // Confidence level scoring
  if (confidenceLevel === 'high') score += 20;
  else if (confidenceLevel === 'medium') score += 10;
  else score -= 10;

  // Depth scoring — good liquidity depth = organic
  if (depth?.buyPriceImpactRatio) {
    const impact10k = depth.buyPriceImpactRatio['10000'] ?? 1;
    if (impact10k < 0.01) score += 15;
    else if (impact10k < 0.05) score += 10;
    else if (impact10k < 0.1) score += 5;
    else score -= 5;
  }

  // Buy/sell spread scoring
  const quoted = price.extraInfo.quotedPrice;
  if (quoted) {
    const buy = parseFloat(quoted.buyPrice);
    const sell = parseFloat(quoted.sellPrice);
    if (buy > 0 && sell > 0) {
      const spread = Math.abs(buy - sell) / buy;
      if (spread < 0.01) score += 15;
      else if (spread < 0.03) score += 10;
      else if (spread < 0.05) score += 5;
      else score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}
