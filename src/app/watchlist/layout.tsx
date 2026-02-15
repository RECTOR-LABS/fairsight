import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watchlist',
  description: 'Your saved Solana tokens on FairSight.',
  robots: { index: false, follow: false },
};

export default function WatchlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
