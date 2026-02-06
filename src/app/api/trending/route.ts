export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getCached, setCached, CacheKeys, CacheTTL } from '@/lib/cache';
import { prisma } from '@/lib/prisma';

interface TrendingToken {
  mint: string;
  searchCount: number;
  name?: string;
  symbol?: string;
  fairsightScore?: number;
  grade?: string;
}

export async function GET() {
  const cached = await getCached<TrendingToken[]>(CacheKeys.trending());
  if (cached) return NextResponse.json(cached);

  // Get most-searched tokens in last 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const results = await prisma.searchLog.groupBy({
    by: ['tokenMint'],
    where: { createdAt: { gte: since } },
    _count: { tokenMint: true },
    orderBy: { _count: { tokenMint: 'desc' } },
    take: 20,
  });

  const trending: TrendingToken[] = await Promise.all(
    results.map(async (r) => {
      const cached = await prisma.cachedTokenReport.findUnique({
        where: { mint: r.tokenMint },
        select: { fairsightScore: true, grade: true, report: true },
      });
      const report = cached?.report as Record<string, unknown> | null;
      return {
        mint: r.tokenMint,
        searchCount: r._count.tokenMint,
        name: (report?.name as string) || undefined,
        symbol: (report?.symbol as string) || undefined,
        fairsightScore: cached?.fairsightScore,
        grade: cached?.grade,
      };
    }),
  );

  await setCached(CacheKeys.trending(), trending, CacheTTL.TRENDING);

  return NextResponse.json(trending);
}
