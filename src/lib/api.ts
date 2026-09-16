import { queryOptions } from "@tanstack/react-query";
import type { Coin, CoinDetail, CoinsPayload, NewsItem } from "./types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

/**
 * Single shared market feed. Every surface (markets table, ticker, watchlist,
 * portfolio, search) reads from this one cache entry so we never hammer
 * CoinGecko with duplicate requests.
 */
export const marketQuery = queryOptions({
  queryKey: ["coins"],
  queryFn: () => getJson<CoinsPayload>("/api/coins"),
  refetchInterval: 30_000,
  staleTime: 15_000,
  // keep the last good payload on screen if a refresh fails
  retry: 2,
});

export const coinsQuery = queryOptions({
  ...marketQuery,
  select: (p: CoinsPayload): Coin[] => p.coins,
});

/** Ticker shares the same cache entry, just observes it more eagerly. */
export const tickerQuery = queryOptions({
  ...marketQuery,
  refetchInterval: 15_000,
  select: (p: CoinsPayload): Coin[] => p.coins,
});

export const coinQuery = (id: string, range: string) =>
  queryOptions({
    queryKey: ["coin", id, range],
    queryFn: () => getJson<CoinDetail>(`/api/coin/${id}?range=${range}`),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

export const newsQuery = queryOptions({
  queryKey: ["news"],
  queryFn: () => getJson<NewsItem[]>("/api/news"),
  refetchInterval: 300_000,
  staleTime: 120_000,
});
