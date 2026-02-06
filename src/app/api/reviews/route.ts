export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { extractUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { REVIEW_WEIGHTS } from '@/types';

export async function POST(req: Request) {
  const user = extractUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Minimum Silver tier (2) to write reviews
  if (user.fairScoreTier < 2) {
    return NextResponse.json(
      { error: 'Silver tier or higher required to write reviews' },
      { status: 403 },
    );
  }

  const { tokenMint, rating, comment } = await req.json();

  if (!tokenMint || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid rating (1-5)' }, { status: 400 });
  }

  const weight = REVIEW_WEIGHTS[user.fairScoreTier] || 1.0;

  const review = await prisma.review.upsert({
    where: {
      userId_tokenMint: {
        userId: user.id,
        tokenMint,
      },
    },
    update: { rating, comment: comment || null, weight },
    create: {
      userId: user.id,
      tokenMint,
      rating,
      comment: comment || null,
      weight,
    },
  });

  return NextResponse.json(review);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mint = searchParams.get('mint');

  if (!mint) {
    return NextResponse.json({ error: 'mint required' }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { tokenMint: mint },
    include: { user: { select: { wallet: true, fairScoreTier: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(reviews);
}
