import type { MarketData } from '@/types';
import { DollarSign, BarChart3, Droplets, Users } from 'lucide-react';

interface Props {
  market: MarketData;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(6)}`;
  return '$0';
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-4 py-3">
      <Icon className="h-5 w-5 text-zinc-500 shrink-0" />
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function MarketDataCard({ market }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Market Data</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Price" value={formatNumber(market.price)} icon={DollarSign} />
        <Stat label="Market Cap" value={formatNumber(market.marketCap)} icon={BarChart3} />
        <Stat label="Liquidity" value={formatNumber(market.liquidity)} icon={Droplets} />
        <Stat label="Holders" value={market.holderCount.toLocaleString()} icon={Users} />
        <Stat label="24h Volume" value={formatNumber(market.volume24h)} icon={BarChart3} />
        <Stat
          label="Jupiter Organic Score"
          value={`${market.jupiterOrganicScore}/100`}
          icon={BarChart3}
        />
      </div>
    </div>
  );
}
