import { queryOptions } from "@tanstack/react-query";
import type { Coin, CoinDetail, NewsItem } from "./types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

export const coinsQuery = queryOptions({
  queryKey: ["coins"],
  queryFn: () => getJson<Coin[]>("/api/coins"),
  refetchInterval: 60_000,
  staleTime: 30_000,
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
