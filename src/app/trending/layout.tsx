import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trending Tokens',
  description: 'Most searched Solana tokens on FairSight. See which tokens the community is analyzing.',
};

export default function TrendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
