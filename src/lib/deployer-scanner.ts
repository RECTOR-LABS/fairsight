import { getSignaturesForAsset } from './apis/helius';
import { getTokenPrice } from './apis/jupiter';
import { getRugCheckReport } from './apis/rugcheck';
import { extractLiquidity } from './apis/rugcheck';
import { prisma } from './prisma';
import type { HeliusAsset } from './apis/helius';
import type { DeployerToken } from '@/types';

/**
 * Get the earliest known transaction timestamp for a token (proxy for launch date).
 */
export async function getTokenLaunchDate(mint: string): Promise<Date | null> {
  const sigs = await getSignaturesForAsset(mint, 100);
  if (!sigs.length) return null;

  // Last entry = earliest transaction (signatures returned newest-first)
  const earliest = sigs[sigs.length - 1];
  if (!earliest?.timestamp) return null;

  return new Date(earliest.timestamp * 1000);
}

/**
 * Determine a token's current status using multi-signal analysis.
 * - 'active': has price + volume on Jupiter
 * - 'rugged': RugCheck flags critical "rug pull" risk
 * - 'dead': no price, no liquidity
 */
export async function determineTokenStatus(
  mint: string,
): Promise<'active' | 'dead' | 'rugged'> {
  const [price, rugcheck] = await Promise.all([
    getTokenPrice(mint),
    getRugCheckReport(mint),
  ]);

  // Check for rug pull signals first
  if (rugcheck?.risks?.some((r) => r.level === 'critical' && r.name.toLowerCase().includes('rug'))) {
    return 'rugged';
  }

  // Active: has a real price on Jupiter
  const priceValue = price ? parseFloat(price.price) : 0;
  if (priceValue > 0) {
    return 'active';
  }

  // Check liquidity as secondary signal
  const liquidity = extractLiquidity(rugcheck);
  if (liquidity > 0) {
    return 'active';
  }

  return 'dead';
}

/**
 * Enrich deployer's token history with real launch dates, statuses, and market caps.
 * Skips tokens enriched within the last 24 hours to avoid redundant API calls.
 */
export async function enrichDeployerTokens(
  deployerWallet: string,
  assets: HeliusAsset[],
): Promise<DeployerToken[]> {
  // Load existing DB records
  const storedHistory = await prisma.deployerHistory.findMany({
    where: { deployerWallet },
  });
  const storedMap = new Map(storedHistory.map((h) => [h.tokenMint, h]));

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Separate tokens into "needs enrichment" vs "recently enriched"
  const toEnrich: HeliusAsset[] = [];
  const results: DeployerToken[] = [];

  for (const asset of assets) {
    const stored = storedMap.get(asset.id);
    const recentlyEnriched = stored?.updatedAt && (now - stored.updatedAt.getTime() < ONE_DAY) && stored.currentStatus !== 'unknown';

    if (recentlyEnriched && stored) {
      results.push({
        mint: asset.id,
        name: asset.content?.metadata?.name || stored.tokenName || null,
        symbol: asset.content?.metadata?.symbol || stored.tokenSymbol || null,
        launchDate: stored.launchDate?.toISOString() || null,
        status: stored.currentStatus || 'unknown',
        peakMcap: stored.peakMcap,
        currentMcap: stored.currentMcap,
      });
    } else {
      toEnrich.push(asset);
    }
  }

  // Enrich in chunks of 3 to avoid overwhelming APIs
  const CHUNK_SIZE = 3;
  for (let i = 0; i < toEnrich.length; i += CHUNK_SIZE) {
    const chunk = toEnrich.slice(i, i + CHUNK_SIZE);
    const enriched = await Promise.all(
      chunk.map(async (asset) => {
        const stored = storedMap.get(asset.id);

        const [launchDate, status, price] = await Promise.all([
          stored?.launchDate ? Promise.resolve(stored.launchDate) : getTokenLaunchDate(asset.id),
          determineTokenStatus(asset.id),
          getTokenPrice(asset.id),
        ]);

        const priceValue = price ? parseFloat(price.price) : 0;
        // Rough mcap estimate (supply info may not be available here)
        const currentMcap = priceValue > 0 ? priceValue : null;

        const token: DeployerToken = {
          mint: asset.id,
          name: asset.content?.metadata?.name || null,
          symbol: asset.content?.metadata?.symbol || null,
          launchDate: launchDate?.toISOString() || null,
          status,
          peakMcap: stored?.peakMcap || null,
          currentMcap: currentMcap !== null ? currentMcap : (stored?.currentMcap || null),
        };

        // Upsert to DB
        await prisma.deployerHistory.upsert({
          where: {
            deployerWallet_tokenMint: {
              deployerWallet,
              tokenMint: asset.id,
            },
          },
          update: {
            tokenName: token.name,
            tokenSymbol: token.symbol,
            launchDate: launchDate || undefined,
            currentStatus: status,
            currentMcap: token.currentMcap,
            peakMcap: stored?.peakMcap && token.currentMcap
              ? Math.max(stored.peakMcap, token.currentMcap)
              : (token.currentMcap || stored?.peakMcap || undefined),
          },
          create: {
            deployerWallet,
            tokenMint: asset.id,
            tokenName: token.name,
            tokenSymbol: token.symbol,
            launchDate: launchDate || undefined,
            currentStatus: status,
            currentMcap: token.currentMcap,
            peakMcap: token.currentMcap,
          },
        }).catch((err) => {
          console.error(`[DeployerScanner] Upsert failed for ${asset.id}:`, err);
        });

        return token;
      }),
    );

    results.push(...enriched);
  }

  return results;
}
