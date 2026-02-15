import { getFairScore, getBatchFairScores } from './apis/fairscale';
import { getAsset, getTokenAccounts, getTokenDeployer } from './apis/helius';
import { getTokenInfo, getTokenPrice, deriveOrganicScore } from './apis/jupiter';
import {
  getRugCheckReport,
  normalizeRugCheckScore,
  extractInsiderPercent,
  extractLiquidity,
} from './apis/rugcheck';
import { getTokenSecurity, extractGoPlusFlags, deriveGoPlusScore } from './apis/goplus';
import { calculateFairSightScore } from './scoring';
import { prisma } from './prisma';
import type {
  TokenReport,
  SecurityData,
  MarketData,
  HolderData,
  FairScoreDistribution,
  ReviewSummary,
  TopHolder,
} from '@/types';

export function tierLabelFromWeight(weight: number): string {
  if (weight >= 4.0) return 'Platinum';
  if (weight >= 2.5) return 'Gold';
  if (weight >= 1.5) return 'Silver';
  if (weight >= 1.0) return 'Bronze';
  return 'Unrated';
}

export async function getCrossLaunchSuccessRate(deployer: string): Promise<number> {
  const history = await prisma.deployerHistory.findMany({
    where: { deployerWallet: deployer },
  });

  if (history.length === 0) return 50; // neutral

  const active = history.filter((h) => h.currentStatus === 'active').length;
  return Math.round((active / history.length) * 100);
}

export async function buildReport(mint: string): Promise<TokenReport | null> {
  // Parallel fetch from all sources
  const [heliusAsset, jupToken, jupPrice, rugcheck, goplus] = await Promise.all([
    getAsset(mint),
    getTokenInfo(mint),
    getTokenPrice(mint),
    getRugCheckReport(mint),
    getTokenSecurity(mint),
  ]);

  // Need at least basic token info
  if (!heliusAsset && !jupToken) return null;

  const name = heliusAsset?.content?.metadata?.name || jupToken?.name || 'Unknown';
  const symbol = heliusAsset?.content?.metadata?.symbol || jupToken?.symbol || '???';
  const image = heliusAsset?.content?.links?.image || jupToken?.logoURI;
  const description = heliusAsset?.content?.metadata?.description;

  // Get deployer
  const deployer = await getTokenDeployer(mint);

  // Get deployer FairScore
  const deployerFairScore = deployer ? await getFairScore(deployer) : null;

  // Get holder data
  const holderAccounts = await getTokenAccounts(mint, 50);
  const totalSupply = heliusAsset?.token_info?.supply || 0;

  // Top holders
  const topHolders: TopHolder[] = holderAccounts
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((h) => ({
      address: h.owner,
      balance: h.amount,
      percentage: totalSupply > 0 ? (h.amount / totalSupply) * 100 : 0,
    }));

  const topHolderPercent = topHolders
    .slice(0, 5)
    .reduce((sum, h) => sum + h.percentage, 0);

  // Holder FairScore distribution (sample top 20)
  const holderWallets = holderAccounts.slice(0, 20).map((h) => h.owner);
  const holderScores = await getBatchFairScores(holderWallets);

  const distribution: FairScoreDistribution = { platinum: 0, gold: 0, silver: 0, bronze: 0, unrated: 0 };
  let fairScoreSum = 0;
  let fairScoreCount = 0;

  for (const wallet of holderWallets) {
    const score = holderScores.get(wallet);
    if (score) {
      fairScoreSum += score.score;
      fairScoreCount++;
      if (score.tier === 4) distribution.platinum++;
      else if (score.tier === 3) distribution.gold++;
      else if (score.tier === 2) distribution.silver++;
      else if (score.tier === 1) distribution.bronze++;
      else distribution.unrated++;
    } else {
      distribution.unrated++;
    }
  }

  const qualityCount = distribution.platinum + distribution.gold;
  const totalDistributed = Object.values(distribution).reduce((a, b) => a + b, 0);

  // Security data
  const goPlusFlags = extractGoPlusFlags(goplus, mint);
  const security: SecurityData = {
    rugcheckScore: normalizeRugCheckScore(rugcheck),
    rugcheckRisks: rugcheck?.risks?.map((r) => `${r.level}: ${r.name} - ${r.description}`) ?? [],
    goPlusFlags,
    isHoneypot: goPlusFlags.some((f) => f.key === 'is_honeypot'),
    hasMintAuthority: !!(jupToken?.mint_authority ?? rugcheck?.mintAuthority),
    hasFreezeAuthority: !!(jupToken?.freeze_authority ?? rugcheck?.freezeAuthority),
    topHolderPercent,
    insiderPercent: extractInsiderPercent(rugcheck),
  };

  // Market data — Jupiter price with Helius fallback
  const jupPriceValue = jupPrice ? (parseFloat(jupPrice.price) || 0) : 0;
  const heliusPriceValue = heliusAsset?.token_info?.price_info?.price_per_token ?? 0;
  const price = jupPriceValue || heliusPriceValue;
  const decimals = heliusAsset?.token_info?.decimals ?? jupToken?.decimals ?? 9;
  const organicScore = deriveOrganicScore(jupPrice);
  const liquidity = extractLiquidity(rugcheck);
  const market: MarketData = {
    price,
    priceChange24h: 0,
    marketCap: totalSupply > 0 ? price * (totalSupply / Math.pow(10, decimals)) : 0,
    volume24h: jupToken?.daily_volume || 0,
    liquidity,
    jupiterOrganicScore: organicScore,
    holderCount: holderAccounts.length,
    topHolders,
  };

  // Holder data
  const holders: HolderData = {
    total: holderAccounts.length,
    distribution,
    avgFairScore: fairScoreCount > 0 ? fairScoreSum / fairScoreCount : 0,
    qualityPercent: totalDistributed > 0 ? (qualityCount / totalDistributed) * 100 : 0,
  };

  // Reviews
  const dbReviews = await prisma.review.findMany({
    where: { tokenMint: mint },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const reviews: ReviewSummary = {
    count: dbReviews.length,
    weightedAvg: 0,
    reviews: dbReviews.map((r) => ({
      id: r.id,
      wallet: r.user.wallet,
      rating: r.rating,
      comment: r.comment,
      weight: r.weight,
      tierLabel: tierLabelFromWeight(r.weight),
      createdAt: r.createdAt.toISOString(),
    })),
  };

  if (dbReviews.length > 0) {
    const totalWeight = dbReviews.reduce((s, r) => s + r.weight, 0);
    reviews.weightedAvg = totalWeight > 0
      ? dbReviews.reduce((s, r) => s + r.rating * r.weight, 0) / totalWeight
      : 0;
  }

  // Cross-launch history
  const crossLaunchRate = deployer
    ? await getCrossLaunchSuccessRate(deployer)
    : 50;

  // Calculate composite score
  const scoring = calculateFairSightScore({
    deployerFairScore,
    crossLaunchSuccessRate: crossLaunchRate,
    holderFairScores: Array.from(holderScores.values()),
    goPlusScore: deriveGoPlusScore(goPlusFlags),
    rugcheckScore: normalizeRugCheckScore(rugcheck),
    jupiterOrganicScore: organicScore,
    liquidity,
    topHolderPercent,
    reviews: dbReviews.map((r) => ({ rating: r.rating, weight: r.weight })),
  });

  const finalScore = Number.isFinite(scoring.score) ? scoring.score : 0;

  return {
    mint,
    name,
    symbol,
    image,
    description,
    deployer: deployer || 'Unknown',
    deployerFairScore,
    fairsightScore: finalScore,
    grade: scoring.grade,
    breakdown: scoring.breakdown,
    security,
    market,
    holders,
    reviews,
    fetchedAt: new Date().toISOString(),
  };
}
