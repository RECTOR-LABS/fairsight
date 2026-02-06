import { trackApiCall } from '../budget';
import type { GoPlusFlag } from '@/types';

const BASE_URL = 'https://api.gopluslabs.io/api/v1';

interface GoPlusTokenSecurity {
  [mint: string]: {
    is_open_source?: string;
    is_proxy?: string;
    is_mintable?: string;
    can_take_back_ownership?: string;
    owner_change_balance?: string;
    hidden_owner?: string;
    selfdestruct?: string;
    external_call?: string;
    is_honeypot?: string;
    transfer_pausable?: string;
    is_blacklisted?: string;
    is_whitelisted?: string;
    is_anti_whale?: string;
    trading_cooldown?: string;
    personal_slippage_modifiable?: string;
    cannot_sell_all?: string;
    buy_tax?: string;
    sell_tax?: string;
    holder_count?: string;
    total_supply?: string;
    creator_address?: string;
    creator_percent?: string;
    lp_holder_count?: string;
    lp_total_supply?: string;
    is_true_token?: string;
    is_airdrop_scam?: string;
    note?: string;
  };
}

export async function getTokenSecurity(mint: string): Promise<GoPlusTokenSecurity | null> {
  const start = Date.now();
  try {
    // GoPlus uses chain_id for Solana: "solana"
    const res = await fetch(
      `${BASE_URL}/solana/token_security/${mint}`,
    );
    const latency = Date.now() - start;

    if (!res.ok) {
      await trackApiCall('goplus', '/token_security', false, latency);
      return null;
    }

    const data = await res.json();
    await trackApiCall('goplus', '/token_security', true, latency);

    if (data.code !== 1 || !data.result) return null;
    return data.result;
  } catch (err) {
    await trackApiCall('goplus', '/token_security', false, Date.now() - start);
    console.error('[GoPlus] Security check error:', err);
    return null;
  }
}

export function extractGoPlusFlags(
  data: GoPlusTokenSecurity | null,
  mint: string,
): GoPlusFlag[] {
  if (!data?.[mint]) return [];
  const token = data[mint];
  const flags: GoPlusFlag[] = [];

  const checks: {
    key: string;
    label: string;
    severity: GoPlusFlag['severity'];
    flagWhen: string;
  }[] = [
    { key: 'is_honeypot', label: 'Honeypot', severity: 'critical', flagWhen: '1' },
    { key: 'is_mintable', label: 'Mintable', severity: 'warning', flagWhen: '1' },
    { key: 'transfer_pausable', label: 'Transfers Pausable', severity: 'warning', flagWhen: '1' },
    { key: 'is_blacklisted', label: 'Has Blacklist', severity: 'warning', flagWhen: '1' },
    { key: 'cannot_sell_all', label: 'Cannot Sell All', severity: 'critical', flagWhen: '1' },
    { key: 'hidden_owner', label: 'Hidden Owner', severity: 'critical', flagWhen: '1' },
    { key: 'is_airdrop_scam', label: 'Airdrop Scam', severity: 'critical', flagWhen: '1' },
    { key: 'personal_slippage_modifiable', label: 'Slippage Modifiable', severity: 'warning', flagWhen: '1' },
    { key: 'trading_cooldown', label: 'Trading Cooldown', severity: 'info', flagWhen: '1' },
    { key: 'is_anti_whale', label: 'Anti-Whale', severity: 'info', flagWhen: '1' },
  ];

  for (const check of checks) {
    const val = token[check.key as keyof typeof token];
    if (val === check.flagWhen) {
      flags.push({
        key: check.key,
        label: check.label,
        severity: check.severity,
        value: true,
      });
    }
  }

  // Tax flags
  const buyTax = parseFloat(token.buy_tax || '0');
  const sellTax = parseFloat(token.sell_tax || '0');
  if (buyTax > 0.05) {
    flags.push({
      key: 'buy_tax',
      label: `Buy Tax: ${(buyTax * 100).toFixed(1)}%`,
      severity: buyTax > 0.1 ? 'critical' : 'warning',
      value: `${(buyTax * 100).toFixed(1)}%`,
    });
  }
  if (sellTax > 0.05) {
    flags.push({
      key: 'sell_tax',
      label: `Sell Tax: ${(sellTax * 100).toFixed(1)}%`,
      severity: sellTax > 0.1 ? 'critical' : 'warning',
      value: `${(sellTax * 100).toFixed(1)}%`,
    });
  }

  return flags;
}

export function deriveGoPlusScore(flags: GoPlusFlag[]): number {
  let score = 100;
  for (const flag of flags) {
    if (flag.severity === 'critical') score -= 25;
    else if (flag.severity === 'warning') score -= 10;
    else score -= 3;
  }
  return Math.max(0, score);
}
