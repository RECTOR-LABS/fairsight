import { prisma } from './prisma';

const DAILY_LIMIT = 33; // ~1000/month free tier
const MONTHLY_LIMIT = 1000;

interface BudgetStatus {
  dailyUsed: number;
  dailyRemaining: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  canMakeRequest: boolean;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function thisMonth(): string {
  return today().slice(0, 7);
}

export async function checkBudget(provider: string = 'fairscale'): Promise<BudgetStatus> {
  const date = today();
  const month = thisMonth();

  const [dailyCount, monthlyCount] = await Promise.all([
    prisma.apiUsageLog.count({
      where: { provider, date },
    }),
    prisma.apiUsageLog.count({
      where: { provider, date: { startsWith: month } },
    }),
  ]);

  return {
    dailyUsed: dailyCount,
    dailyRemaining: Math.max(0, DAILY_LIMIT - dailyCount),
    monthlyUsed: monthlyCount,
    monthlyRemaining: Math.max(0, MONTHLY_LIMIT - monthlyCount),
    canMakeRequest: dailyCount < DAILY_LIMIT && monthlyCount < MONTHLY_LIMIT,
  };
}

export async function trackApiCall(
  provider: string,
  endpoint: string,
  success: boolean,
  latencyMs?: number,
): Promise<void> {
  await prisma.apiUsageLog.create({
    data: {
      provider,
      endpoint,
      success,
      latencyMs,
      date: today(),
    },
  });
}

export async function canCallFairScale(): Promise<boolean> {
  const budget = await checkBudget('fairscale');
  return budget.canMakeRequest;
}
