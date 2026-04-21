import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type ProviderId = 'lovable' | 'openai' | 'anthropic' | 'gemini' | 'groq';

export interface ProviderStatus {
  id: ProviderId;
  label: string;
  available: boolean;
  defaultModel: string;
}

interface AIProviderCtx {
  providers: ProviderStatus[];
  preferred: ProviderId;
  setPreferred: (p: ProviderId) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const STORAGE_KEY = 'codeforge_ai_provider';
const DEFAULT: ProviderId = 'lovable';

const Ctx = createContext<AIProviderCtx | null>(null);

export function AIProviderProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [preferred, setPreferredState] = useState<ProviderId>(
    () => (localStorage.getItem(STORAGE_KEY) as ProviderId) || DEFAULT,
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-code-gen', {
        body: { action: 'status' },
      });
      if (error) throw error;
      if (Array.isArray(data?.providers)) setProviders(data.providers);
    } catch (e) {
      console.error('[useAIProvider] status failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const setPreferred = useCallback((p: ProviderId) => {
    setPreferredState(p);
    localStorage.setItem(STORAGE_KEY, p);
  }, []);

  const value = useMemo(
    () => ({ providers, preferred, setPreferred, refresh, loading }),
    [providers, preferred, setPreferred, refresh, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAIProvider() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAIProvider must be used inside AIProviderProvider');
  return ctx;
}