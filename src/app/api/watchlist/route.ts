export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { extractUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const user = extractUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await prisma.watchlistItem.findMany({
    where: { userId: user.id },
    orderBy: { addedAt: 'desc' },
  });

  // Enrich with cached report data
  const enriched = await Promise.all(
    items.map(async (item) => {
      const cached = await prisma.cachedTokenReport.findUnique({
        where: { mint: item.tokenMint },
        select: { fairsightScore: true, grade: true, report: true },
      });
      const report = cached?.report as Record<string, unknown> | null;
      return {
        id: item.id,
        tokenMint: item.tokenMint,
        addedAt: item.addedAt.toISOString(),
        tokenName: (report?.name as string) || undefined,
        tokenSymbol: (report?.symbol as string) || undefined,
        fairsightScore: cached?.fairsightScore,
        grade: cached?.grade,
      };
    }),
  );

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  const user = extractUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tokenMint } = await req.json();
  if (!tokenMint) {
    return NextResponse.json({ error: 'tokenMint required' }, { status: 400 });
  }

  const item = await prisma.watchlistItem.upsert({
    where: {
      userId_tokenMint: {
        userId: user.id,
        tokenMint,
      },
    },
    update: {},
    create: {
      userId: user.id,
      tokenMint,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const user = extractUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tokenMint } = await req.json();
  if (!tokenMint) {
    return NextResponse.json({ error: 'tokenMint required' }, { status: 400 });
  }

  await prisma.watchlistItem.deleteMany({
    where: { userId: user.id, tokenMint },
  });

  return NextResponse.json({ success: true });
}
