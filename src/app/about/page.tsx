import type { Metadata } from 'next';
import { Eye, Shield, Users, BarChart3, MessageSquare, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About — Methodology',
  description: 'How FairSight calculates trust scores for Solana tokens. Learn about the 4-pillar scoring algorithm powered by FairScale reputation data.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Eye className="h-6 w-6 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">About FairSight</h1>
      </div>

      <div className="space-y-8 text-zinc-300">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">What is FairSight?</h2>
          <p className="leading-relaxed">
            FairSight is a token trust intelligence platform for Solana. While other tools analyze
            the token contract, FairSight analyzes the <span className="text-white font-medium">people behind it</span> —
            deployer reputation, holder quality, and reputation-weighted community reviews.
          </p>
          <p className="mt-2 leading-relaxed">
            Think of it as the Carfax for Solana tokens: a comprehensive trust report that goes beyond
            smart contract analysis.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">FairSight Score (0-100)</h2>
          <p className="mb-4 leading-relaxed">
            Every token gets a composite FairSight Score from 0-100, graded A+ through F.
            The score combines four weighted pillars:
          </p>

          <div className="space-y-4">
            <Pillar
              icon={Users}
              title="Reputation (35%)"
              color="text-emerald-400"
              items={[
                'Deployer FairScore (50%) — via FairScale reputation data',
                'Cross-launch history (30%) — success rate across all tokens launched',
                'Holder quality (20%) — FairScore distribution of current holders',
              ]}
            />
            <Pillar
              icon={Shield}
              title="Security (30%)"
              color="text-blue-400"
              items={[
                'GoPlus security flags (60%) — honeypot, taxes, mint authority, etc.',
                'RugCheck score (40%) — risk analysis and insider detection',
              ]}
            />
            <Pillar
              icon={BarChart3}
              title="Market (20%)"
              color="text-purple-400"
              items={[
                'Jupiter organic score (40%) — price confidence and depth',
                'Liquidity (30%) — total available liquidity',
                'Holder concentration (30%) — top holder dominance',
              ]}
            />
            <Pillar
              icon={MessageSquare}
              title="Community (15%)"
              color="text-amber-400"
              items={[
                'Weighted review average (70%) — reviews weighted by reviewer FairScore tier',
                'Review volume (30%) — more reviews = more signal',
              ]}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">FairScore Tiers & Review Weights</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                  <th className="pb-2 pr-4">Tier</th>
                  <th className="pb-2 pr-4">Score Range</th>
                  <th className="pb-2 pr-4">Review Weight</th>
                  <th className="pb-2">Can Review?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                <TierRow tier="Platinum" range="80-100" weight="4x" canReview />
                <TierRow tier="Gold" range="60-79" weight="2.5x" canReview />
                <TierRow tier="Silver" range="40-59" weight="1.5x" canReview />
                <TierRow tier="Bronze" range="20-39" weight="1x" canReview={false} />
                <TierRow tier="Unrated" range="0-19" weight="—" canReview={false} />
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">Data Sources</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-400 shrink-0" />
              <span><strong className="text-white">FairScale</strong> — Wallet reputation scores and tiers</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 shrink-0 text-center text-emerald-400">H</span>
              <span><strong className="text-white">Helius</strong> — On-chain data, token metadata, holder lists</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 shrink-0 text-center text-emerald-400">J</span>
              <span><strong className="text-white">Jupiter</strong> — Price data, organic score, market depth</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 shrink-0 text-center text-emerald-400">R</span>
              <span><strong className="text-white">RugCheck</strong> — Risk scoring, insider detection, liquidity</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 shrink-0 text-center text-emerald-400">G</span>
              <span><strong className="text-white">GoPlus</strong> — Honeypot detection, taxes, security flags</span>
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <p className="text-sm text-zinc-400">
            <strong className="text-zinc-300">Disclaimer:</strong> FairSight provides reputation-based token analysis
            for informational purposes only. This is not financial advice. Always do your own research before
            making investment decisions. Past reputation does not guarantee future behavior.
          </p>
        </section>
      </div>
    </div>
  );
}

function Pillar({
  icon: Icon,
  title,
  color,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  color: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <h3 className="font-medium text-white">{title}</h3>
      </div>
      <ul className="space-y-1 pl-7 text-sm text-zinc-400">
        {items.map((item, i) => (
          <li key={i} className="list-disc">{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TierRow({
  tier,
  range,
  weight,
  canReview,
}: {
  tier: string;
  range: string;
  weight: string;
  canReview: boolean;
}) {
  return (
    <tr className="text-zinc-300">
      <td className="py-2 pr-4 font-medium">{tier}</td>
      <td className="py-2 pr-4">{range}</td>
      <td className="py-2 pr-4">{weight}</td>
      <td className="py-2">
        <span className={canReview ? 'text-emerald-400' : 'text-zinc-600'}>
          {canReview ? 'Yes' : 'No'}
        </span>
      </td>
    </tr>
  );
}
