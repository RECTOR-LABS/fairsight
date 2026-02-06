export interface FairScore {
  wallet: string;
  score: number;
  tier: number;
  tierLabel: string;
  details?: Record<string, unknown>;
}

export interface TokenReport {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  description?: string;
  deployer: string;
  deployerFairScore: FairScore | null;
  fairsightScore: number;
  grade: string;
  breakdown: ScoreBreakdown;
  security: SecurityData;
  market: MarketData;
  holders: HolderData;
  reviews: ReviewSummary;
  fetchedAt: string;
}

export interface ScoreBreakdown {
  reputation: number;
  security: number;
  market: number;
  community: number;
  details: {
    deployerScore: number;
    crossLaunchScore: number;
    holderQuality: number;
    goPlusScore: number;
    rugcheckScore: number;
    jupiterOrganic: number;
    liquidityScore: number;
    holderConcentration: number;
    reviewAvg: number;
    reviewVolume: number;
  };
}

export interface SecurityData {
  rugcheckScore: number;
  rugcheckRisks: string[];
  goPlusFlags: GoPlusFlag[];
  isHoneypot: boolean;
  hasMintAuthority: boolean;
  hasFreezeAuthority: boolean;
  topHolderPercent: number;
  insiderPercent: number;
}

export interface GoPlusFlag {
  key: string;
  label: string;
  severity: 'critical' | 'warning' | 'info';
  value: boolean | string;
}

export interface MarketData {
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
  jupiterOrganicScore: number;
  holderCount: number;
  topHolders: TopHolder[];
}

export interface TopHolder {
  address: string;
  balance: number;
  percentage: number;
  fairScore?: FairScore | null;
  isInsider?: boolean;
}

export interface HolderData {
  total: number;
  distribution: FairScoreDistribution;
  avgFairScore: number;
  qualityPercent: number;
}

export interface FairScoreDistribution {
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
  unrated: number;
}

export interface ReviewSummary {
  count: number;
  weightedAvg: number;
  reviews: ReviewItem[];
}

export interface ReviewItem {
  id: string;
  wallet: string;
  rating: number;
  comment: string | null;
  weight: number;
  tierLabel: string;
  createdAt: string;
}

export interface DeployerProfile {
  wallet: string;
  fairScore: FairScore | null;
  totalTokensLaunched: number;
  activeTokens: number;
  deadTokens: number;
  ruggedTokens: number;
  successRate: number;
  tokens: DeployerToken[];
}

export interface DeployerToken {
  mint: string;
  name: string | null;
  symbol: string | null;
  launchDate: string | null;
  status: string;
  peakMcap: number | null;
  currentMcap: number | null;
}

export interface AuthUser {
  id: string;
  wallet: string;
  fairScore: number | null;
  fairScoreTier: number;
}

export interface WatchlistEntry {
  id: string;
  tokenMint: string;
  addedAt: string;
  tokenName?: string;
  tokenSymbol?: string;
  fairsightScore?: number;
  grade?: string;
}

export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export const TIER_LABELS: Record<number, string> = {
  0: 'Unrated',
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Platinum',
};

export const TIER_COLORS: Record<number, string> = {
  0: '#6B7280',
  1: '#CD7F32',
  2: '#C0C0C0',
  3: '#FFD700',
  4: '#E5E4E2',
};

export const REVIEW_WEIGHTS: Record<number, number> = {
  0: 0,
  1: 1.0,
  2: 1.5,
  3: 2.5,
  4: 4.0,
};
