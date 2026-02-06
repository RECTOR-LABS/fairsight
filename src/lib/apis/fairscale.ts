import { getCached, setCached, CacheKeys, CacheTTL } from '../cache';
import { canCallFairScale, trackApiCall } from '../budget';
import { prisma } from '../prisma';
import type { FairScore } from '@/types';

const BASE_URL = process.env.FAIRSCALE_API_URL || 'https://api.fairscale.xyz';
const API_KEY = process.env.FAIRSCALE_API_KEY || '';

function tierFromScore(score: number): { tier: number; label: string } {
  if (score >= 80) return { tier: 4, label: 'Platinum' };
  if (score >= 60) return { tier: 3, label: 'Gold' };
  if (score >= 40) return { tier: 2, label: 'Silver' };
  if (score >= 20) return { tier: 1, label: 'Bronze' };
  return { tier: 0, label: 'Unrated' };
}

function dbRowToFairScore(row: {
  wallet: string;
  score: number;
  tier: number;
  tierLabel: string;
  details: unknown;
}): FairScore {
  return {
    wallet: row.wallet,
    score: row.score,
    tier: row.tier,
    tierLabel: row.tierLabel,
    details: row.details as Record<string, unknown> | undefined,
  };
}

export async function getFairScore(wallet: string): Promise<FairScore | null> {
  // Layer 1: Redis cache
  const cached = await getCached<FairScore>(CacheKeys.fairScore(wallet));
  if (cached) return cached;

  // Layer 2: Postgres cache (30-day TTL)
  const dbCached = await prisma.cachedFairScore.findUnique({
    where: { wallet },
  });

  if (dbCached && dbCached.expiresAt > new Date()) {
    const score = dbRowToFairScore(dbCached);
    // Re-populate Redis
    await setCached(CacheKeys.fairScore(wallet), score, CacheTTL.FAIRSCORE);
    return score;
  }

  // Layer 3: API call (budget-gated)
  const canCall = await canCallFairScale();
  if (!canCall) {
    // Stale-while-revalidate: return expired DB data if available
    if (dbCached) return dbRowToFairScore(dbCached);
    return null;
  }

  const start = Date.now();

  try {
    const res = await fetch(`${BASE_URL}/api/v1/score/${wallet}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const latency = Date.now() - start;

    if (!res.ok) {
      await trackApiCall('fairscale', `/score/${wallet}`, false, latency);
      // Fallback to stale data
      if (dbCached) return dbRowToFairScore(dbCached);
      return null;
    }

    const data = await res.json();
    await trackApiCall('fairscale', `/score/${wallet}`, true, latency);

    const rawScore = data.score ?? data.fairScore ?? 0;
    const { tier, label } = tierFromScore(rawScore);

    const fairScore: FairScore = {
      wallet,
      score: rawScore,
      tier,
      tierLabel: label,
      details: data,
    };

    // Cache in both layers concurrently
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    await Promise.all([
      setCached(CacheKeys.fairScore(wallet), fairScore, CacheTTL.FAIRSCORE),
      prisma.cachedFairScore.upsert({
        where: { wallet },
        update: {
          score: rawScore,
          tier,
          tierLabel: label,
          details: data,
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + thirtyDaysMs),
        },
        create: {
          wallet,
          score: rawScore,
          tier,
          tierLabel: label,
          details: data,
          expiresAt: new Date(Date.now() + thirtyDaysMs),
        },
      }),
    ]);

    return fairScore;
  } catch (err) {
    await trackApiCall('fairscale', `/score/${wallet}`, false, Date.now() - start);
    console.error('[FairScale] API error:', err);
    // Fallback to stale data on network/parse errors
    if (dbCached) return dbRowToFairScore(dbCached);
    return null;
  }
}

export async function getBatchFairScores(
  wallets: string[],
): Promise<Map<string, FairScore>> {
  const results = new Map<string, FairScore>();

  // Sequential to respect budget limits
  for (const wallet of wallets) {
    const score = await getFairScore(wallet);
    if (score) results.set(wallet, score);
  }

  return results;
}
