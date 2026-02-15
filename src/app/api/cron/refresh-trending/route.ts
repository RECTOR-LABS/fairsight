export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setCached, CacheKeys, CacheTTL } from '@/lib/cache';

const CRON_SECRET = process.env.CRON_SECRET || '';

function authorize(req: Request): boolean {
  if (!CRON_SECRET) return false;
  const url = new URL(req.url);
  const headerSecret = req.headers.get('x-cron-secret');
  const querySecret = url.searchParams.get('secret');
  return headerSecret === CRON_SECRET || querySecret === CRON_SECRET;
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const results = await prisma.searchLog.groupBy({
    by: ['tokenMint'],
    where: { createdAt: { gte: since } },
    _count: { tokenMint: true },
    orderBy: { _count: { tokenMint: 'desc' } },
    take: 20,
  });

  const trending = await Promise.all(
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

  return NextResponse.json({
    refreshed: trending.length,
    trending,
  });
}
