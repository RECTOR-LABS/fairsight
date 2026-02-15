export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setCached, CacheKeys, CacheTTL } from '@/lib/cache';
import { checkBudget } from '@/lib/budget';
import { buildReport } from '@/lib/report-builder';

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

  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

  // Find reports expiring within the next hour
  const expiring = await prisma.cachedTokenReport.findMany({
    where: { expiresAt: { lt: oneHourFromNow } },
    select: { mint: true },
    take: 5,
    orderBy: { expiresAt: 'asc' },
  });

  if (!expiring.length) {
    return NextResponse.json({ refreshed: 0, message: 'No reports need refresh' });
  }

  // Check FairScale budget before proceeding
  const budget = await checkBudget('fairscale');
  if (budget.dailyRemaining < 5) {
    return NextResponse.json({
      refreshed: 0,
      message: 'Skipped — FairScale budget too low',
      dailyRemaining: budget.dailyRemaining,
    });
  }

  const results: { mint: string; success: boolean; error?: string }[] = [];

  for (const { mint } of expiring) {
    try {
      const report = await buildReport(mint);
      if (report) {
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
        results.push({ mint, success: true });
      } else {
        results.push({ mint, success: false, error: 'Report returned null' });
      }
    } catch (err) {
      results.push({ mint, success: false, error: String(err) });
    }
  }

  const refreshed = results.filter((r) => r.success).length;

  return NextResponse.json({
    refreshed,
    total: expiring.length,
    results,
  });
}
