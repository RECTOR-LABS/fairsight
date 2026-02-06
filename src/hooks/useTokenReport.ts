'use client';

import { useState, useEffect } from 'react';
import type { TokenReport } from '@/types';

interface UseTokenReportResult {
  report: TokenReport | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTokenReport(mint: string | null): UseTokenReportResult {
  const [report, setReport] = useState<TokenReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!mint) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/token/${mint}/report`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [mint]);

  return { report, loading, error, refetch: fetchReport };
}
