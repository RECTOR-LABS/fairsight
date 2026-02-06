export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { generateChallenge, verifySignature, generateToken, getOrCreateUser } from '@/lib/auth';
import { getFairScore } from '@/lib/apis/fairscale';

export async function POST(req: Request) {
  const body = await req.json();
  const { action } = body;

  if (action === 'challenge') {
    const { wallet } = body;
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet required' }, { status: 400 });
    }
    const message = generateChallenge(wallet);
    return NextResponse.json({ message });
  }

  if (action === 'verify') {
    const { wallet, message, signature } = body;
    if (!wallet || !message || !signature) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const valid = verifySignature(wallet, message, signature);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const user = await getOrCreateUser(wallet);

    // Fetch FairScore in background
    getFairScore(wallet).then(async (score) => {
      if (score) {
        const { prisma } = await import('@/lib/prisma');
        await prisma.user.update({
          where: { id: user.id },
          data: { fairScore: score.score, fairScoreTier: score.tier },
        });
      }
    }).catch(() => {});

    const token = generateToken(user);
    return NextResponse.json({ token, user });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
