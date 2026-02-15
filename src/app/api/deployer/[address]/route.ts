export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getCached, setCached, CacheKeys, CacheTTL } from '@/lib/cache';
import { getFairScore } from '@/lib/apis/fairscale';
import { getAssetsByAuthority } from '@/lib/apis/helius';
import { enrichDeployerTokens } from '@/lib/deployer-scanner';
import type { DeployerProfile } from '@/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;

  if (!address || address.length < 32 || address.length > 44) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

  // Check cache
  const cached = await getCached<DeployerProfile>(CacheKeys.deployerProfile(address));
  if (cached) return NextResponse.json(cached);

  try {
    // Fetch FairScore and token history in parallel
    const [fairScore, assets] = await Promise.all([
      getFairScore(address),
      getAssetsByAuthority(address, 100),
    ]);

    // Enrich tokens with real launch dates + statuses (budget-free APIs)
    const tokens = await enrichDeployerTokens(address, assets);

    const activeTokens = tokens.filter((t) => t.status === 'active').length;
    const deadTokens = tokens.filter((t) => t.status === 'dead').length;
    const ruggedTokens = tokens.filter((t) => t.status === 'rugged').length;

    const profile: DeployerProfile = {
      wallet: address,
      fairScore,
      totalTokensLaunched: tokens.length,
      activeTokens,
      deadTokens,
      ruggedTokens,
      successRate: tokens.length > 0
        ? Math.round((activeTokens / tokens.length) * 100)
        : 0,
      tokens,
    };

    await setCached(CacheKeys.deployerProfile(address), profile, CacheTTL.DEPLOYER_PROFILE);

    return NextResponse.json(profile);
  } catch (err) {
    console.error('[Deployer] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch deployer profile' }, { status: 500 });
  }
}
