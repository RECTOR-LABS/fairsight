import jwt from 'jsonwebtoken';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { prisma } from './prisma';
import type { AuthUser } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fairsight-dev-secret-change-me';
const JWT_EXPIRES = '7d';

const challenges = new Map<string, { nonce: string; expiresAt: number }>();

export function generateChallenge(wallet: string): string {
  const nonce = bs58.encode(nacl.randomBytes(32));
  const message = `Sign this message to verify your wallet ownership on FairSight.\n\nWallet: ${wallet}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;

  challenges.set(wallet, {
    nonce,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
  });

  return message;
}

export function verifySignature(
  wallet: string,
  message: string,
  signature: string,
): boolean {
  try {
    const challenge = challenges.get(wallet);
    if (!challenge || challenge.expiresAt < Date.now()) {
      return false;
    }

    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(wallet);

    const verified = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes,
    );

    if (verified) {
      challenges.delete(wallet);
    }

    return verified;
  } catch {
    return false;
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      wallet: user.wallet,
      fairScoreTier: user.fairScoreTier,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES },
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser & { iat: number; exp: number };
    return {
      id: decoded.id,
      wallet: decoded.wallet,
      fairScore: decoded.fairScore,
      fairScoreTier: decoded.fairScoreTier,
    };
  } catch {
    return null;
  }
}

export async function getOrCreateUser(wallet: string): Promise<AuthUser> {
  const user = await prisma.user.upsert({
    where: { wallet },
    update: { lastLogin: new Date() },
    create: { wallet, lastLogin: new Date() },
  });

  return {
    id: user.id,
    wallet: user.wallet,
    fairScore: user.fairScore,
    fairScoreTier: user.fairScoreTier,
  };
}

export function extractUser(req: Request): AuthUser | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.slice(7));
}
