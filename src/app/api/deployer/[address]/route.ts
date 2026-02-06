export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getCached, setCached, CacheKeys, CacheTTL } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import { getFairScore } from '@/lib/apis/fairscale';
import { getAssetsByAuthority } from '@/lib/apis/helius';
import type { DeployerProfile, DeployerToken } from '@/types';

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

    // Get stored history
    const storedHistory = await prisma.deployerHistory.findMany({
      where: { deployerWallet: address },
    });

    // Build token list from Helius assets
    const tokens: DeployerToken[] = assets.map((asset) => {
      const stored = storedHistory.find((h) => h.tokenMint === asset.id);
      return {
        mint: asset.id,
        name: asset.content?.metadata?.name || null,
        symbol: asset.content?.metadata?.symbol || null,
        launchDate: stored?.launchDate?.toISOString() || null,
        status: stored?.currentStatus || 'unknown',
        peakMcap: stored?.peakMcap || null,
        currentMcap: stored?.currentMcap || null,
      };
    });

    // Store/update history in DB
    for (const token of tokens) {
      await prisma.deployerHistory.upsert({
        where: {
          deployerWallet_tokenMint: {
            deployerWallet: address,
            tokenMint: token.mint,
          },
        },
        update: {
          tokenName: token.name,
          tokenSymbol: token.symbol,
        },
        create: {
          deployerWallet: address,
          tokenMint: token.mint,
          tokenName: token.name,
          tokenSymbol: token.symbol,
          currentStatus: 'unknown',
        },
      }).catch(() => {});
    }

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
