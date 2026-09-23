import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://gotrpqwfcvykcjwpsmsm.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_secret_eI3vpGpvbmBbvRdHWUH7MQ_f2aNgqlk';

// Validador estrito de URL HTTP/HTTPS
function sanitizeUrl(candidate?: string | null): string {
  if (candidate && typeof candidate === 'string') {
    const trimmed = candidate.trim();
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return trimmed;
      }
    } catch {
      // Candidato inválido
    }
  }
  return DEFAULT_SUPABASE_URL;
}

function sanitizeKey(candidate?: string | null): string {
  if (candidate && typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (trimmed.length > 5 && !trimmed.includes('your-supabase-key')) {
      return trimmed;
    }
  }
  return DEFAULT_SUPABASE_KEY;
}

// Acesso a variáveis de ambiente com fallback seguro
const viteEnvUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : undefined;
const viteEnvKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined;

const nodeEnvUrl = typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined;
const nodeEnvKey = typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined;

const rawUrl = viteEnvUrl || nodeEnvUrl;
const rawKey = viteEnvKey || nodeEnvKey;

export const SUPABASE_URL = sanitizeUrl(rawUrl);
const supabaseAnonKey = sanitizeKey(rawKey);

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  supabaseAnonKey && 
  !SUPABASE_URL.includes('your-project')
);

export const SUPABASE_PROJECT_REF = (() => {
  try {
    const parsed = new URL(SUPABASE_URL);
    return parsed.hostname.split('.')[0] || 'supabase';
  } catch {
    return 'supabase';
  }
})();

function initSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(SUPABASE_URL, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.error('[Supabase Client] Falha ao inicializar client:', err);
    return null;
  }
}

export const supabase: SupabaseClient | null = initSupabase();

export async function checkSupabaseConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { connected: false, error: 'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas.' };
  }

  const start = performance.now();
  try {
    const { error } = await supabase.from('escolas').select('id', { count: 'exact', head: true });
    if (error) throw error;
    const latencyMs = Math.round(performance.now() - start);
    return { connected: true, latencyMs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { connected: false, error: message };
  }
}
