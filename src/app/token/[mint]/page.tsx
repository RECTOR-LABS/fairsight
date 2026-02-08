'use client';

import { use } from 'react';
import { useTokenReport } from '@/hooks/useTokenReport';
import FairSightScoreCard from '@/components/token/FairSightScoreCard';
import DeployerCard from '@/components/token/DeployerCard';
import SecurityFlags from '@/components/token/SecurityFlags';
import MarketDataCard from '@/components/token/MarketDataCard';
import HolderDistribution from '@/components/token/HolderDistribution';
import ReviewForm from '@/components/token/ReviewForm';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function TokenReportPage({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const { mint } = use(params);
  const { report, loading, error, refetch } = useTokenReport(mint);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-zinc-400">Analyzing token reputation...</p>
          <p className="text-xs text-zinc-600">Fetching data from 5+ sources</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-lg font-medium text-white">Report Unavailable</p>
          <p className="text-sm text-zinc-400">{error || 'Token not found'}</p>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Try another token
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Token header */}
      <div className="mb-8 flex items-center gap-4">
        {report.image && (
          <Image
            src={report.image}
            alt={report.name}
            width={48}
            height={48}
            className="rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">
            {report.name}{' '}
            <span className="text-zinc-500">({report.symbol})</span>
          </h1>
          <p className="font-mono text-sm text-zinc-500">
            {report.mint.slice(0, 8)}...{report.mint.slice(-8)}
          </p>
        </div>
      </div>

      {/* Score */}
      <div className="mb-6">
        <FairSightScoreCard
          score={report.fairsightScore}
          grade={report.grade}
          breakdown={report.breakdown}
        />
      </div>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DeployerCard
          address={report.deployer}
          fairScore={report.deployerFairScore}
          crossLaunchRate={report.breakdown.details.crossLaunchScore}
        />
        <SecurityFlags security={report.security} />
      </div>

      {/* Market + Holders */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MarketDataCard market={report.market} />
        <HolderDistribution holders={report.holders} />
      </div>

      {/* Reviews section */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">
          Community Reviews ({report.reviews.count})
        </h3>

        <div className="mb-4">
          <ReviewForm tokenMint={mint} onSubmitted={refetch} />
        </div>

        {report.reviews.count > 0 ? (
          <div className="space-y-3">
            {report.reviews.reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-zinc-400">
                      {review.wallet.slice(0, 4)}...{review.wallet.slice(-4)}
                    </span>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      {review.tierLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < review.rating ? 'text-amber-400' : 'text-zinc-700'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-zinc-300">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            No reviews yet. Connect your wallet (Silver+ tier) to be the first.
          </p>
        )}
      </div>

      {/* Metadata */}
      <p className="mt-6 text-center text-xs text-zinc-600">
        Report generated at {new Date(report.fetchedAt).toLocaleString()}
      </p>
    </div>
  );
}
