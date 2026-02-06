'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '@/types';

interface UseAuthResult {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (wallet: string, signMessage: (message: Uint8Array) => Promise<Uint8Array>) => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('fairsight_token');
    const storedUser = localStorage.getItem('fairsight_user');
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (
    wallet: string,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  ) => {
    // Get challenge
    const challengeRes = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'challenge', wallet }),
    });
    const { message } = await challengeRes.json();

    // Sign
    const encoded = new TextEncoder().encode(message);
    const signatureBytes = await signMessage(encoded);

    // bs58 encode the signature
    const bs58 = await import('bs58');
    const signature = bs58.default.encode(signatureBytes);

    // Verify
    const verifyRes = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', wallet, message, signature }),
    });

    if (!verifyRes.ok) {
      throw new Error('Authentication failed');
    }

    const data = await verifyRes.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('fairsight_token', data.token);
    localStorage.setItem('fairsight_user', JSON.stringify(data.user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fairsight_token');
    localStorage.removeItem('fairsight_user');
  }, []);

  return { user, token, loading, login, logout };
}
