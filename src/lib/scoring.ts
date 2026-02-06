import type {
  FairScore,
  ScoreBreakdown,
  Grade,
  SecurityData,
  MarketData,
  HolderData,
  ReviewSummary,
} from '@/types';

interface ScoringInput {
  deployerFairScore: FairScore | null;
  crossLaunchSuccessRate: number;
  holderFairScores: FairScore[];
  goPlusScore: number;
  rugcheckScore: number;
  jupiterOrganicScore: number;
  liquidity: number;
  topHolderPercent: number;
  reviews: { rating: number; weight: number }[];
}

// Weights
const W_REPUTATION = 0.35;
const W_SECURITY = 0.30;
const W_MARKET = 0.20;
const W_COMMUNITY = 0.15;

// Sub-weights
const W_DEPLOYER_SCORE = 0.50;
const W_CROSS_LAUNCH = 0.30;
const W_HOLDER_QUALITY = 0.20;

const W_GOPLUS = 0.60;
const W_RUGCHECK = 0.40;

const W_JUPITER_ORGANIC = 0.40;
const W_LIQUIDITY = 0.30;
const W_HOLDER_CONC = 0.30;

const W_REVIEW_AVG = 0.70;
const W_REVIEW_VOL = 0.30;

function normalizeLiquidity(liquidity: number): number {
  // $0 = 0, $10k = 50, $100k = 80, $1M+ = 100
  if (liquidity <= 0) return 0;
  if (liquidity >= 1_000_000) return 100;
  return Math.min(100, Math.log10(liquidity) * 20);
}

function normalizeHolderConcentration(topPercent: number): number {
  // Lower concentration = better. 0% = 100, 50%+ = 0
  return Math.max(0, Math.min(100, 100 - topPercent * 2));
}

function calculateHolderQuality(scores: FairScore[]): number {
  if (scores.length === 0) return 50;
  const qualityCount = scores.filter((s) => s.tier >= 3).length;
  return Math.min(100, (qualityCount / scores.length) * 100);
}

function calculateReviewAvg(reviews: { rating: number; weight: number }[]): number {
  if (reviews.length === 0) return 50;
  const totalWeight = reviews.reduce((sum, r) => sum + r.weight, 0);
  if (totalWeight === 0) return 50;
  const weightedSum = reviews.reduce((sum, r) => sum + r.rating * r.weight, 0);
  return (weightedSum / totalWeight / 5) * 100; // normalize 1-5 to 0-100
}

function calculateReviewVolume(count: number): number {
  // 0 reviews = 30 (neutral), 5+ = 80, 20+ = 100
  if (count === 0) return 30;
  if (count >= 20) return 100;
  return 30 + (count / 20) * 70;
}

export function calculateFairSightScore(input: ScoringInput): {
  score: number;
  grade: Grade;
  breakdown: ScoreBreakdown;
} {
  const deployerScore = input.deployerFairScore?.score ?? 50;
  const crossLaunchScore = input.crossLaunchSuccessRate;
  const holderQuality = calculateHolderQuality(input.holderFairScores);

  const reputation =
    deployerScore * W_DEPLOYER_SCORE +
    crossLaunchScore * W_CROSS_LAUNCH +
    holderQuality * W_HOLDER_QUALITY;

  const security =
    input.goPlusScore * W_GOPLUS +
    input.rugcheckScore * W_RUGCHECK;

  const liquidityNorm = normalizeLiquidity(input.liquidity);
  const holderConcNorm = normalizeHolderConcentration(input.topHolderPercent);

  const market =
    input.jupiterOrganicScore * W_JUPITER_ORGANIC +
    liquidityNorm * W_LIQUIDITY +
    holderConcNorm * W_HOLDER_CONC;

  const reviewAvg = calculateReviewAvg(input.reviews);
  const reviewVol = calculateReviewVolume(input.reviews.length);

  const community =
    reviewAvg * W_REVIEW_AVG +
    reviewVol * W_REVIEW_VOL;

  const score = Math.round(
    reputation * W_REPUTATION +
    security * W_SECURITY +
    market * W_MARKET +
    community * W_COMMUNITY,
  );

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    grade: scoreToGrade(finalScore),
    breakdown: {
      reputation: Math.round(reputation),
      security: Math.round(security),
      market: Math.round(market),
      community: Math.round(community),
      details: {
        deployerScore: Math.round(deployerScore),
        crossLaunchScore: Math.round(crossLaunchScore),
        holderQuality: Math.round(holderQuality),
        goPlusScore: Math.round(input.goPlusScore),
        rugcheckScore: Math.round(input.rugcheckScore),
        jupiterOrganic: Math.round(input.jupiterOrganicScore),
        liquidityScore: Math.round(liquidityNorm),
        holderConcentration: Math.round(holderConcNorm),
        reviewAvg: Math.round(reviewAvg),
        reviewVolume: Math.round(reviewVol),
      },
    },
  };
}

export function scoreToGrade(score: number): Grade {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export function gradeColor(grade: Grade): string {
  const colors: Record<Grade, string> = {
    'A+': '#22c55e',
    'A': '#4ade80',
    'B': '#a3e635',
    'C': '#facc15',
    'D': '#fb923c',
    'F': '#ef4444',
  };
  return colors[grade];
}

export function assembleScoreFromReport(
  security: SecurityData,
  market: MarketData,
  holders: HolderData,
  reviews: ReviewSummary,
  deployerFairScore: FairScore | null,
  crossLaunchSuccessRate: number,
): ReturnType<typeof calculateFairSightScore> {
  const holderScores: FairScore[] = [];
  const dist = holders.distribution;
  for (let i = 0; i < dist.platinum; i++) holderScores.push({ wallet: '', score: 90, tier: 4, tierLabel: 'Platinum' });
  for (let i = 0; i < dist.gold; i++) holderScores.push({ wallet: '', score: 70, tier: 3, tierLabel: 'Gold' });
  for (let i = 0; i < dist.silver; i++) holderScores.push({ wallet: '', score: 50, tier: 2, tierLabel: 'Silver' });
  for (let i = 0; i < dist.bronze; i++) holderScores.push({ wallet: '', score: 30, tier: 1, tierLabel: 'Bronze' });
  for (let i = 0; i < dist.unrated; i++) holderScores.push({ wallet: '', score: 0, tier: 0, tierLabel: 'Unrated' });

  return calculateFairSightScore({
    deployerFairScore,
    crossLaunchSuccessRate,
    holderFairScores: holderScores,
    goPlusScore: security.goPlusFlags.length === 0
      ? 100
      : Math.max(0, 100 - security.goPlusFlags.reduce((s, f) =>
        s + (f.severity === 'critical' ? 25 : f.severity === 'warning' ? 10 : 3), 0)),
    rugcheckScore: security.rugcheckScore,
    jupiterOrganicScore: market.jupiterOrganicScore,
    liquidity: market.liquidity,
    topHolderPercent: security.topHolderPercent,
    reviews: reviews.reviews.map((r) => ({ rating: r.rating, weight: r.weight })),
  });
}
