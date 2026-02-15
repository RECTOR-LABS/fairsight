import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import type { Grade } from '@/types';

interface ReportData {
  name?: string;
  symbol?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mint: string }>;
}): Promise<Metadata> {
  const { mint } = await params;

  const cached = await prisma.cachedTokenReport.findUnique({
    where: { mint },
    select: { fairsightScore: true, grade: true, report: true },
  });

  if (!cached) {
    return {
      title: `Token Report — ${mint.slice(0, 8)}...`,
      description: `Analyze the trust profile for token ${mint} on FairSight.`,
    };
  }

  const report = cached.report as unknown as ReportData | null;
  const name = report?.name || 'Unknown Token';
  const symbol = report?.symbol || '???';
  const score = cached.fairsightScore ?? 0;
  const grade = (cached.grade ?? 'F') as Grade;

  const title = `${name} ($${symbol}) — Grade ${grade} (${score}/100)`;
  const description = `FairSight Trust Report for ${name} ($${symbol}): Score ${score}/100, Grade ${grade}. Deployer reputation, security analysis, and community reviews.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function TokenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
