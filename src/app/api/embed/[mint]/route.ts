export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gradeColor } from '@/lib/scoring';
import type { Grade } from '@/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;

  const cached = await prisma.cachedTokenReport.findUnique({
    where: { mint },
    select: { fairsightScore: true, grade: true, report: true },
  });

  const score = cached?.fairsightScore ?? 0;
  const grade = (cached?.grade ?? 'F') as Grade;
  const report = cached?.report as Record<string, unknown> | null;
  const name = (report?.name as string) || 'Unknown';
  const symbol = (report?.symbol as string) || '???';
  const color = gradeColor(grade);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="60" viewBox="0 0 240 60">
  <rect width="240" height="60" rx="8" fill="#18181b"/>
  <rect x="0.5" y="0.5" width="239" height="59" rx="7.5" stroke="#3f3f46" fill="none"/>

  <!-- Score circle -->
  <circle cx="30" cy="30" r="18" fill="none" stroke="#27272a" stroke-width="3"/>
  <circle cx="30" cy="30" r="18" fill="none" stroke="${color}" stroke-width="3"
    stroke-dasharray="${(score / 100) * 113.1} 113.1" stroke-linecap="round"
    transform="rotate(-90 30 30)"/>
  <text x="30" y="34" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="system-ui">${score}</text>

  <!-- Token info -->
  <text x="58" y="22" fill="white" font-size="12" font-weight="600" font-family="system-ui">${name}</text>
  <text x="58" y="38" fill="#a1a1aa" font-size="10" font-family="system-ui">${symbol} · Grade ${grade}</text>
  <text x="58" y="52" fill="#52525b" font-size="9" font-family="system-ui">FairSight Trust Score</text>

  <!-- Grade badge -->
  <rect x="195" y="10" width="35" height="22" rx="4" fill="${color}33"/>
  <text x="212.5" y="25" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold" font-family="system-ui">${grade}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
