import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  _prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma._prisma) {
    globalForPrisma._prisma = new PrismaClient();
  }
  return globalForPrisma._prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getPrismaClient(), prop);
  },
});
