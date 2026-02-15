import type { Metadata } from 'next';
import { getCached, CacheKeys } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import type { DeployerProfile } from '@/types';
import { TIER_LABELS } from '@/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  const short = `${address.slice(0, 8)}...${address.slice(-4)}`;

  // Try Redis cache first
  const cached = await getCached<DeployerProfile>(CacheKeys.deployerProfile(address));
  if (cached) {
    const tier = cached.fairScore ? TIER_LABELS[cached.fairScore.tier] || 'Unrated' : 'Unrated';
    const title = `Deployer ${short} — ${tier} (${cached.totalTokensLaunched} tokens)`;
    const description = `FairSight Deployer Profile: ${tier} tier, ${cached.totalTokensLaunched} tokens launched, ${cached.successRate}% success rate.`;

    return {
      title,
      description,
      openGraph: { title, description, type: 'profile' },
      twitter: { card: 'summary_large_image', title, description },
    };
  }

  // Fallback: check Prisma for cached FairScore
  const fairScore = await prisma.cachedFairScore.findUnique({
    where: { wallet: address },
    select: { score: true, tier: true },
  });

  const tokenCount = await prisma.deployerHistory.count({ where: { deployerWallet: address } });

  if (fairScore) {
    const tier = TIER_LABELS[fairScore.tier] || 'Unrated';
    const title = `Deployer ${short} — ${tier} (${tokenCount} tokens)`;
    const description = `FairSight Deployer Profile: ${tier} tier with ${tokenCount} tokens launched.`;
    return {
      title,
      description,
      openGraph: { title, description, type: 'profile' },
      twitter: { card: 'summary_large_image', title, description },
    };
  }

  return {
    title: `Deployer ${short}`,
    description: `View deployer reputation and launch history for ${short} on FairSight.`,
  };
}

export default function DeployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
