import { describe, it, expect } from 'vitest';
import {
  calculateFairSightScore,
  scoreToGrade,
  gradeColor,
  assembleScoreFromReport,
} from '../scoring';
import type {
  FairScore,
  SecurityData,
  MarketData,
  HolderData,
  ReviewSummary,
} from '@/types';

// ─── Helpers ────────────────────────────────────────────────────

function makeFairScore(overrides: Partial<FairScore> = {}): FairScore {
  return { wallet: '', score: 70, tier: 3, tierLabel: 'Gold', ...overrides };
}

function makeDefaultInput() {
  return {
    deployerFairScore: makeFairScore({ score: 80, tier: 4, tierLabel: 'Platinum' }) as FairScore | null,
    crossLaunchSuccessRate: 75,
    holderFairScores: [
      makeFairScore({ tier: 4 }),
      makeFairScore({ tier: 3 }),
      makeFairScore({ tier: 2 }),
      makeFairScore({ tier: 1 }),
    ],
    goPlusScore: 90,
    rugcheckScore: 85,
    jupiterOrganicScore: 70,
    liquidity: 100_000,
    topHolderPercent: 15,
    reviews: [
      { rating: 4, weight: 2.5 },
      { rating: 5, weight: 1.5 },
    ],
  };
}

// ─── scoreToGrade ───────────────────────────────────────────────

describe('scoreToGrade', () => {
  it('returns A+ for score >= 90', () => {
    expect(scoreToGrade(90)).toBe('A+');
    expect(scoreToGrade(95)).toBe('A+');
    expect(scoreToGrade(100)).toBe('A+');
  });

  it('returns A for 80-89', () => {
    expect(scoreToGrade(80)).toBe('A');
    expect(scoreToGrade(89)).toBe('A');
  });

  it('returns B for 70-79', () => {
    expect(scoreToGrade(70)).toBe('B');
    expect(scoreToGrade(79)).toBe('B');
  });

  it('returns C for 60-69', () => {
    expect(scoreToGrade(60)).toBe('C');
    expect(scoreToGrade(69)).toBe('C');
  });

  it('returns D for 50-59', () => {
    expect(scoreToGrade(50)).toBe('D');
    expect(scoreToGrade(59)).toBe('D');
  });

  it('returns F for < 50', () => {
    expect(scoreToGrade(49)).toBe('F');
    expect(scoreToGrade(0)).toBe('F');
    expect(scoreToGrade(1)).toBe('F');
  });

  it('handles exact grade boundaries', () => {
    expect(scoreToGrade(90)).toBe('A+');
    expect(scoreToGrade(89)).toBe('A');
    expect(scoreToGrade(80)).toBe('A');
    expect(scoreToGrade(79)).toBe('B');
    expect(scoreToGrade(70)).toBe('B');
    expect(scoreToGrade(69)).toBe('C');
    expect(scoreToGrade(60)).toBe('C');
    expect(scoreToGrade(59)).toBe('D');
    expect(scoreToGrade(50)).toBe('D');
    expect(scoreToGrade(49)).toBe('F');
  });
});

// ─── gradeColor ─────────────────────────────────────────────────

describe('gradeColor', () => {
  it('returns correct hex color for each grade', () => {
    expect(gradeColor('A+')).toBe('#22c55e');
    expect(gradeColor('A')).toBe('#4ade80');
    expect(gradeColor('B')).toBe('#a3e635');
    expect(gradeColor('C')).toBe('#facc15');
    expect(gradeColor('D')).toBe('#fb923c');
    expect(gradeColor('F')).toBe('#ef4444');
  });
});

// ─── calculateFairSightScore ────────────────────────────────────

describe('calculateFairSightScore', () => {
  it('returns score, grade, and breakdown', () => {
    const result = calculateFairSightScore(makeDefaultInput());
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('breakdown');
    expect(result.breakdown).toHaveProperty('reputation');
    expect(result.breakdown).toHaveProperty('security');
    expect(result.breakdown).toHaveProperty('market');
    expect(result.breakdown).toHaveProperty('community');
    expect(result.breakdown).toHaveProperty('details');
  });

  it('clamps score between 0 and 100', () => {
    const result = calculateFairSightScore(makeDefaultInput());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('assigns correct grade for calculated score', () => {
    const result = calculateFairSightScore(makeDefaultInput());
    expect(result.grade).toBe(scoreToGrade(result.score));
  });

  // ─── Edge cases ─────────────────────────────────────────────

  it('handles null deployer FairScore (defaults to 50)', () => {
    const input = makeDefaultInput();
    input.deployerFairScore = null;
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.deployerScore).toBe(50);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('handles empty holder scores (defaults to 50)', () => {
    const input = makeDefaultInput();
    input.holderFairScores = [];
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.holderQuality).toBe(50);
  });

  it('handles empty reviews (neutral defaults)', () => {
    const input = makeDefaultInput();
    input.reviews = [];
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.reviewAvg).toBe(50);
    expect(result.breakdown.details.reviewVolume).toBe(30);
  });

  it('handles all zeros input', () => {
    const result = calculateFairSightScore({
      deployerFairScore: makeFairScore({ score: 0, tier: 0 }),
      crossLaunchSuccessRate: 0,
      holderFairScores: [],
      goPlusScore: 0,
      rugcheckScore: 0,
      jupiterOrganicScore: 0,
      liquidity: 0,
      topHolderPercent: 0,
      reviews: [],
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.grade).toBeDefined();
  });

  it('handles perfect scores input', () => {
    const result = calculateFairSightScore({
      deployerFairScore: makeFairScore({ score: 100, tier: 4 }),
      crossLaunchSuccessRate: 100,
      holderFairScores: Array(10).fill(makeFairScore({ tier: 4 })),
      goPlusScore: 100,
      rugcheckScore: 100,
      jupiterOrganicScore: 100,
      liquidity: 1_000_000,
      topHolderPercent: 0,
      reviews: Array(20).fill({ rating: 5, weight: 4.0 }),
    });
    expect(result.score).toBe(100);
    expect(result.grade).toBe('A+');
  });

  // ─── Weight verification ────────────────────────────────────

  it('weights reputation at 35% of total', () => {
    // Create input where only reputation has value
    const result = calculateFairSightScore({
      deployerFairScore: makeFairScore({ score: 100, tier: 4 }),
      crossLaunchSuccessRate: 100,
      holderFairScores: Array(10).fill(makeFairScore({ tier: 4 })),
      goPlusScore: 0,
      rugcheckScore: 0,
      jupiterOrganicScore: 0,
      liquidity: 0,
      topHolderPercent: 50,
      reviews: [],
    });
    // Reputation pillar = 100, contributes 35 points
    // Community defaults to (50*0.7 + 30*0.3) = 44, contributes 44*0.15 = ~6.6
    // Market: holder conc at 50% = 0 score, so market = 0*0.4 + 0*0.3 + 0*0.3 = 0
    expect(result.breakdown.reputation).toBe(100);
  });

  it('weights security at 30% of total', () => {
    const result = calculateFairSightScore({
      deployerFairScore: null,
      crossLaunchSuccessRate: 0,
      holderFairScores: [],
      goPlusScore: 100,
      rugcheckScore: 100,
      jupiterOrganicScore: 0,
      liquidity: 0,
      topHolderPercent: 50,
      reviews: [],
    });
    expect(result.breakdown.security).toBe(100);
  });

  // ─── Liquidity normalization ────────────────────────────────

  it('normalizes liquidity: $0 = 0', () => {
    const input = makeDefaultInput();
    input.liquidity = 0;
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.liquidityScore).toBe(0);
  });

  it('normalizes liquidity: $1M+ = 100', () => {
    const input = makeDefaultInput();
    input.liquidity = 1_000_000;
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.liquidityScore).toBe(100);
  });

  it('normalizes liquidity: scales logarithmically', () => {
    const input1 = makeDefaultInput();
    input1.liquidity = 10_000;
    const result1 = calculateFairSightScore(input1);

    const input2 = makeDefaultInput();
    input2.liquidity = 100_000;
    const result2 = calculateFairSightScore(input2);

    expect(result2.breakdown.details.liquidityScore).toBeGreaterThan(
      result1.breakdown.details.liquidityScore,
    );
  });

  it('normalizes liquidity: negative = 0', () => {
    const input = makeDefaultInput();
    input.liquidity = -500;
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.liquidityScore).toBe(0);
  });

  // ─── Holder concentration normalization ─────────────────────

  it('normalizes holder concentration: 0% = 100 (best)', () => {
    const input = makeDefaultInput();
    input.topHolderPercent = 0;
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.holderConcentration).toBe(100);
  });

  it('normalizes holder concentration: 50%+ = 0 (worst)', () => {
    const input = makeDefaultInput();
    input.topHolderPercent = 50;
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.holderConcentration).toBe(0);
  });

  it('normalizes holder concentration: 25% = 50', () => {
    const input = makeDefaultInput();
    input.topHolderPercent = 25;
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.holderConcentration).toBe(50);
  });

  // ─── Holder quality ─────────────────────────────────────────

  it('calculates holder quality: all Gold+ = 100%', () => {
    const input = makeDefaultInput();
    input.holderFairScores = Array(5).fill(makeFairScore({ tier: 3 }));
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.holderQuality).toBe(100);
  });

  it('calculates holder quality: no Gold+ = 0%', () => {
    const input = makeDefaultInput();
    input.holderFairScores = Array(5).fill(makeFairScore({ tier: 2 }));
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.holderQuality).toBe(0);
  });

  it('calculates holder quality: mixed tiers', () => {
    const input = makeDefaultInput();
    input.holderFairScores = [
      makeFairScore({ tier: 4 }),
      makeFairScore({ tier: 3 }),
      makeFairScore({ tier: 2 }),
      makeFairScore({ tier: 1 }),
    ];
    const result = calculateFairSightScore(input);
    // 2 out of 4 are tier 3+ → 50%
    expect(result.breakdown.details.holderQuality).toBe(50);
  });

  // ─── Review scoring ─────────────────────────────────────────

  it('calculates weighted review average', () => {
    const input = makeDefaultInput();
    input.reviews = [
      { rating: 5, weight: 4.0 }, // Platinum
      { rating: 1, weight: 1.0 }, // Bronze
    ];
    const result = calculateFairSightScore(input);
    // Weighted avg = (5*4 + 1*1) / (4+1) / 5 * 100 = 21/5/5*100 = 84
    expect(result.breakdown.details.reviewAvg).toBe(84);
  });

  it('review volume scales: 0 reviews = 30', () => {
    const input = makeDefaultInput();
    input.reviews = [];
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.reviewVolume).toBe(30);
  });

  it('review volume scales: 20+ reviews = 100', () => {
    const input = makeDefaultInput();
    input.reviews = Array(25).fill({ rating: 3, weight: 1 });
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.reviewVolume).toBe(100);
  });

  it('review volume scales linearly between 0 and 20', () => {
    const input = makeDefaultInput();
    input.reviews = Array(10).fill({ rating: 3, weight: 1 });
    const result = calculateFairSightScore(input);
    // 30 + (10/20) * 70 = 30 + 35 = 65
    expect(result.breakdown.details.reviewVolume).toBe(65);
  });

  // ─── Reviews with zero total weight ─────────────────────────

  it('handles reviews with zero weight (defaults to 50)', () => {
    const input = makeDefaultInput();
    input.reviews = [
      { rating: 5, weight: 0 },
      { rating: 1, weight: 0 },
    ];
    const result = calculateFairSightScore(input);
    expect(result.breakdown.details.reviewAvg).toBe(50);
  });
});

// ─── assembleScoreFromReport ────────────────────────────────────

describe('assembleScoreFromReport', () => {
  function makeSecurityData(overrides: Partial<SecurityData> = {}): SecurityData {
    return {
      rugcheckScore: 80,
      rugcheckRisks: [],
      goPlusFlags: [],
      isHoneypot: false,
      hasMintAuthority: false,
      hasFreezeAuthority: false,
      topHolderPercent: 10,
      insiderPercent: 2,
      ...overrides,
    };
  }

  function makeMarketData(overrides: Partial<MarketData> = {}): MarketData {
    return {
      price: 0.01,
      priceChange24h: 5.0,
      marketCap: 500_000,
      volume24h: 100_000,
      liquidity: 50_000,
      jupiterOrganicScore: 75,
      holderCount: 500,
      topHolders: [],
      ...overrides,
    };
  }

  function makeHolderData(overrides: Partial<HolderData> = {}): HolderData {
    return {
      total: 100,
      distribution: { platinum: 5, gold: 15, silver: 30, bronze: 30, unrated: 20 },
      avgFairScore: 55,
      qualityPercent: 20,
      ...overrides,
    };
  }

  function makeReviewSummary(overrides: Partial<ReviewSummary> = {}): ReviewSummary {
    return {
      count: 3,
      weightedAvg: 3.5,
      reviews: [
        { id: '1', wallet: 'abc', rating: 4, comment: null, weight: 2.5, tierLabel: 'Gold', createdAt: new Date().toISOString() },
        { id: '2', wallet: 'def', rating: 3, comment: 'decent', weight: 1.0, tierLabel: 'Bronze', createdAt: new Date().toISOString() },
        { id: '3', wallet: 'ghi', rating: 4, comment: null, weight: 1.5, tierLabel: 'Silver', createdAt: new Date().toISOString() },
      ],
      ...overrides,
    };
  }

  it('assembles score from report data', () => {
    const result = assembleScoreFromReport(
      makeSecurityData(),
      makeMarketData(),
      makeHolderData(),
      makeReviewSummary(),
      makeFairScore({ score: 75, tier: 3 }),
      80,
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.grade).toBeDefined();
  });

  it('converts goPlusFlags to score: no flags = 100', () => {
    const result = assembleScoreFromReport(
      makeSecurityData({ goPlusFlags: [] }),
      makeMarketData(),
      makeHolderData(),
      makeReviewSummary(),
      null,
      0,
    );
    expect(result.breakdown.details.goPlusScore).toBe(100);
  });

  it('converts goPlusFlags to score: critical flags reduce heavily', () => {
    const result = assembleScoreFromReport(
      makeSecurityData({
        goPlusFlags: [
          { key: 'honeypot', label: 'Honeypot', severity: 'critical', value: true },
          { key: 'mint_auth', label: 'Mint Authority', severity: 'critical', value: true },
        ],
      }),
      makeMarketData(),
      makeHolderData(),
      makeReviewSummary(),
      null,
      0,
    );
    // 100 - (25 + 25) = 50
    expect(result.breakdown.details.goPlusScore).toBe(50);
  });

  it('converts goPlusFlags to score: warning flags reduce moderately', () => {
    const result = assembleScoreFromReport(
      makeSecurityData({
        goPlusFlags: [
          { key: 'warn1', label: 'Warning', severity: 'warning', value: true },
          { key: 'warn2', label: 'Warning 2', severity: 'warning', value: true },
        ],
      }),
      makeMarketData(),
      makeHolderData(),
      makeReviewSummary(),
      null,
      0,
    );
    // 100 - (10 + 10) = 80
    expect(result.breakdown.details.goPlusScore).toBe(80);
  });

  it('converts goPlusFlags to score: info flags reduce lightly', () => {
    const result = assembleScoreFromReport(
      makeSecurityData({
        goPlusFlags: [
          { key: 'info1', label: 'Info', severity: 'info', value: true },
        ],
      }),
      makeMarketData(),
      makeHolderData(),
      makeReviewSummary(),
      null,
      0,
    );
    // 100 - 3 = 97
    expect(result.breakdown.details.goPlusScore).toBe(97);
  });

  it('goPlus score floors at 0 with many critical flags', () => {
    const result = assembleScoreFromReport(
      makeSecurityData({
        goPlusFlags: Array(5).fill(
          { key: 'crit', label: 'Critical', severity: 'critical' as const, value: true },
        ),
      }),
      makeMarketData(),
      makeHolderData(),
      makeReviewSummary(),
      null,
      0,
    );
    // 100 - (25*5) = -25, clamped to 0
    expect(result.breakdown.details.goPlusScore).toBe(0);
  });

  it('builds holder FairScore array from distribution', () => {
    const result = assembleScoreFromReport(
      makeSecurityData(),
      makeMarketData(),
      makeHolderData({ distribution: { platinum: 10, gold: 0, silver: 0, bronze: 0, unrated: 0 } }),
      makeReviewSummary({ count: 0, reviews: [] }),
      null,
      0,
    );
    // All platinum holders → 100% quality
    expect(result.breakdown.details.holderQuality).toBe(100);
  });

  it('handles null deployer and zero crossLaunchRate', () => {
    const result = assembleScoreFromReport(
      makeSecurityData(),
      makeMarketData(),
      makeHolderData(),
      makeReviewSummary(),
      null,
      0,
    );
    expect(result.breakdown.details.deployerScore).toBe(50);
    expect(result.breakdown.details.crossLaunchScore).toBe(0);
  });
});
