export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getCached, setCached, CacheKeys, CacheTTL } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import { buildReport } from '@/lib/report-builder';
import type { TokenReport } from '@/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;

  if (!mint || mint.length < 32 || mint.length > 44) {
    return NextResponse.json({ error: 'Invalid mint address' }, { status: 400 });
  }

  // Layer 1: Redis cache
  const cached = await getCached<TokenReport>(CacheKeys.tokenReport(mint));
  if (cached) return NextResponse.json(cached);

  // Layer 2: Postgres cache
  const dbCached = await prisma.cachedTokenReport.findUnique({ where: { mint } });
  if (dbCached && dbCached.expiresAt > new Date()) {
    const report = dbCached.report as unknown as TokenReport;
    await setCached(CacheKeys.tokenReport(mint), report, CacheTTL.TOKEN_REPORT);
    return NextResponse.json(report);
  }

  try {
    // Layer 3: Build fresh report
    const report = await buildReport(mint);
    if (!report) {
      return NextResponse.json({ error: 'Token not found or data unavailable' }, { status: 404 });
    }

    // Cache in both layers
    await Promise.all([
      setCached(CacheKeys.tokenReport(mint), report, CacheTTL.TOKEN_REPORT),
      prisma.cachedTokenReport.upsert({
        where: { mint },
        update: {
          report: JSON.parse(JSON.stringify(report)),
          fairsightScore: report.fairsightScore,
          grade: report.grade,
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        create: {
          mint,
          report: JSON.parse(JSON.stringify(report)),
          fairsightScore: report.fairsightScore,
          grade: report.grade,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // Log search for trending
    prisma.searchLog.create({
      data: { tokenMint: mint },
    }).catch(() => {}); // non-critical, fire-and-forget

    return NextResponse.json(report);
  } catch (err) {
    console.error('[Report] Error building report:', err);

    // Return stale if available
    if (dbCached) {
      return NextResponse.json(dbCached.report);
    }

    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
