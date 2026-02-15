'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Search, Shield, Users, BarChart3, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const mint = query.trim();
    if (mint.length < 32) {
      setError('Enter a valid Solana token mint address');
      return;
    }
    setError('');
    router.push(`/token/${mint}`);
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
            <Eye className="h-4 w-4" />
            Powered by FairScale Reputation Data
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            The <span className="text-emerald-400">Carfax</span> for
            <br />Solana Tokens
          </h1>

          <p className="mb-8 text-lg text-zinc-400">
            Every tool analyzes the token. FairSight analyzes the{' '}
            <span className="font-medium text-white">people behind it</span> —
            deployer reputation, holder quality, and reputation-weighted reviews.
          </p>

          <form onSubmit={handleSearch} className="mx-auto max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setError(''); }}
                placeholder="Paste any Solana token mint address..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-4 pl-12 pr-4 text-white placeholder-zinc-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:pr-32"
              />
              <button
                type="submit"
                className="mt-3 w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 sm:absolute sm:right-2 sm:top-1/2 sm:mt-0 sm:w-auto sm:-translate-y-1/2"
              >
                Analyze
                <ArrowRight className="ml-1.5 inline h-4 w-4" />
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-800/50 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-white">
            Trust Intelligence, Not Just Token Metrics
          </h2>

          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={Users}
              title="Deployer Reputation"
              description="FairScore of the deployer, cross-launch history, and success rate. Know who you're trusting."
            />
            <FeatureCard
              icon={Shield}
              title="Multi-Source Security"
              description="RugCheck + GoPlus flags combined with reputation scoring for a complete security picture."
            />
            <FeatureCard
              icon={BarChart3}
              title="Holder Quality"
              description="FairScore distribution of token holders. Are they gold-tier veterans or unrated wallets?"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-800/50 px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">
            FairSight Score (0-100)
          </h2>
          <p className="mb-8 text-zinc-400">
            A composite score weighing four pillars of token trust.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <ScorePillar label="Reputation" weight="35%" color="bg-emerald-500" description="Deployer FairScore + cross-launch history + holder quality" />
            <ScorePillar label="Security" weight="30%" color="bg-blue-500" description="GoPlus flags + RugCheck analysis" />
            <ScorePillar label="Market" weight="20%" color="bg-purple-500" description="Jupiter organic score + liquidity + holder concentration" />
            <ScorePillar label="Community" weight="15%" color="bg-amber-500" description="Reputation-weighted reviews" />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700">
      <Icon className="mb-4 h-8 w-8 text-emerald-400" />
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}

function ScorePillar({
  label,
  weight,
  color,
  description,
}: {
  label: string;
  weight: string;
  color: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 text-left">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-white">{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${color} text-white`}>
          {weight}
        </span>
      </div>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  );
}
