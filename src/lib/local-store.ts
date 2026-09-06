import { useCallback, useEffect, useState } from "react";
import type { Alert, Holding } from "./types";

const KEYS = {
  watchlist: "cmca:watchlist",
  alerts: "cmca:alerts",
  holdings: "cmca:holdings",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function usePersisted<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(read<T>(key, fallback));
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(read<T>(key, fallback));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* ignore quota errors */
        }
        return resolved;
      });
    },
    [key],
  );

  return { value, update, hydrated };
}

export function useWatchlist() {
  const { value, update, hydrated } = usePersisted<string[]>(KEYS.watchlist, []);
  const toggle = useCallback(
    (id: string) => update((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [update],
  );
  const remove = useCallback((id: string) => update((prev) => prev.filter((x) => x !== id)), [update]);
  return { watchlist: value, toggle, remove, has: (id: string) => value.includes(id), hydrated };
}

export function useAlerts() {
  const { value, update, hydrated } = usePersisted<Alert[]>(KEYS.alerts, []);
  const add = useCallback(
    (alert: Omit<Alert, "id" | "createdAt">) =>
      update((prev) => [{ ...alert, id: crypto.randomUUID(), createdAt: Date.now() }, ...prev]),
    [update],
  );
  const remove = useCallback((id: string) => update((prev) => prev.filter((a) => a.id !== id)), [update]);
  return { alerts: value, add, remove, hydrated };
}

export function useHoldings() {
  const { value, update, hydrated } = usePersisted<Holding[]>(KEYS.holdings, []);
  const add = useCallback((holding: Holding) => update((prev) => [...prev, holding]), [update]);
  const remove = useCallback(
    (index: number) => update((prev) => prev.filter((_, i) => i !== index)),
    [update],
  );
  return { holdings: value, add, remove, hydrated };
}
