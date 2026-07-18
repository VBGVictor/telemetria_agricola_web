import type { MachineSummary } from "../indicators/compute-summary";

type CacheEntry = { value: MachineSummary[]; expiresAt: number };

const TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

export function getCachedSummary(key: string): MachineSummary[] | null {
  try {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }
    return entry.value;
  } catch {
    // qualquer problema no cache: age como se não tivesse cache nenhum
    return null;
  }
}

export function setCachedSummary(key: string, value: MachineSummary[]): void {
  try {
    cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  } catch {
    // falhou ao gravar no cache? ignora — a resposta já foi calculada e devolvida
  }
}
