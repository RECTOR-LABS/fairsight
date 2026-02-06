import type { SecurityData } from '@/types';
import { ShieldAlert, ShieldCheck, AlertTriangle, XCircle, Info } from 'lucide-react';

interface Props {
  security: SecurityData;
}

const severityConfig = {
  critical: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
};

export default function SecurityFlags({ security }: Props) {
  const hasFlags = security.goPlusFlags.length > 0 || security.rugcheckRisks.length > 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        {hasFlags ? (
          <ShieldAlert className="h-5 w-5 text-yellow-400" />
        ) : (
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
        )}
        <h3 className="text-sm font-semibold text-white">Security Analysis</h3>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 mb-4">
        <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
          <span className="text-xs text-zinc-400">RugCheck Score</span>
          <span className="text-sm font-semibold text-white">{security.rugcheckScore}/100</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
          <span className="text-xs text-zinc-400">Top 5 Holders</span>
          <span className="text-sm font-semibold text-white">{security.topHolderPercent.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
          <span className="text-xs text-zinc-400">Mint Authority</span>
          <span className={`text-sm font-semibold ${security.hasMintAuthority ? 'text-red-400' : 'text-emerald-400'}`}>
            {security.hasMintAuthority ? 'Active' : 'Revoked'}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
          <span className="text-xs text-zinc-400">Freeze Authority</span>
          <span className={`text-sm font-semibold ${security.hasFreezeAuthority ? 'text-red-400' : 'text-emerald-400'}`}>
            {security.hasFreezeAuthority ? 'Active' : 'Revoked'}
          </span>
        </div>
      </div>

      {security.goPlusFlags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Flags</h4>
          {security.goPlusFlags.map((flag) => {
            const config = severityConfig[flag.severity];
            const Icon = config.icon;
            return (
              <div key={flag.key} className={`flex items-center gap-2 rounded-lg border ${config.border} ${config.bg} px-3 py-2`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className={`text-sm ${config.color}`}>{flag.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {!hasFlags && (
        <p className="text-sm text-emerald-400">No security flags detected</p>
      )}
    </div>
  );
}
