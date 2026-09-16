/**
 * Centralised CoinGecko market-data service (server-only).
 *
 * Rules:
 *  - No mock / random / hardcoded prices. Ever.
 *  - On upstream failure we serve the last known-good value and flag it stale.
 *  - If nothing is known yet, callers get null/empty and the UI shows
 *    "Data unavailable" instead of a fake zero.
 */

export type Coin = {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  image?: string | undefined;
};

export type CoinsPayload = {
  coins: Coin[];
  updatedAt: number;
  stale: boolean;
};

export type CoinDetail = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  marketCapRank: number | null;
  volume24h: number;
  supplyCirculating: number | null;
  supplyTotal: number | null;
  supplyMax: number | null;
  ath: number | null;
  athDate: string | null;
  atl: number | null;
  atlDate: string | null;
  image?: string | undefined;
  description?: string | undefined;
  homepage?: string | undefined;
  sourceCode?: string | undefined;
  twitter?: string | undefined;
  telegram?: string | undefined;
  historicalPrices: { timestamp: number; price: number }[];
  updatedAt: number;
  stale: boolean;
  chartUnavailable: boolean;
};

export type NewsItem = {
  title: string;
  source: string;
  url: string;
  date: string;
};

const CG_PUBLIC = "https://api.coingecko.com/api/v3";
const CG_PRO = "https://pro-api.coingecko.com/api/v3";

function cgConfig() {
  const key = process.env["COINGECKO_API_KEY"];
  const pro = process.env["COINGECKO_API_PLAN"] === "pro";
  const headers: Record<string, string> = { accept: "application/json" };
  if (key) headers[pro ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = key;
  return { base: pro ? CG_PRO : CG_PUBLIC, headers };
}

async function cg<T>(path: string): Promise<T> {
  const { base, headers } = cgConfig();
  const res = await fetch(`${base}${path}`, {
    headers,
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 429) throw new Error("CoinGecko rate limit");
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  return (await res.json()) as T;
}

/* ---------------- cache with stale fallback ---------------- */

type Entry<T> = { at: number; value: T };
const cache = new Map<string, Entry<unknown>>();

/**
 * Fresh within `ttlMs` → cached value. Otherwise refetch; on failure return the
 * last good value marked stale. No value + failure → throws.
 */
async function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<{ value: T; updatedAt: number; stale: boolean }> {
  const hit = cache.get(key) as Entry<T> | undefined;
  if (hit && Date.now() - hit.at < ttlMs) {
    return { value: hit.value, updatedAt: hit.at, stale: false };
  }
  try {
    const value = await load();
    const at = Date.now();
    cache.set(key, { at, value });
    return { value, updatedAt: at, stale: false };
  } catch (err) {
    if (hit) {
      console.warn(`market: serving stale "${key}"`, (err as Error).message);
      return { value: hit.value, updatedAt: hit.at, stale: true };
    }
    throw err;
  }
}

/* ---------------- markets ---------------- */

const PRICE_TTL = 30_000; // prices move fast, but respect rate limits
const META_TTL = 10 * 60_000; // coin metadata is near-static
const CHART_TTL: Record<string, number> = {
  "1D": 5 * 60_000,
  "7D": 15 * 60_000,
  "30D": 30 * 60_000,
  "90D": 60 * 60_000,
  "1Y": 6 * 60 * 60_000,
  MAX: 12 * 60 * 60_000,
};

export async function getCoins(): Promise<CoinsPayload> {
  const { value, updatedAt, stale } = await cached<Coin[]>("coins", PRICE_TTL, async () => {
    const data = await cg<any[]>(
      "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h",
    );
    if (!Array.isArray(data) || data.length === 0) throw new Error("empty market response");
    return data
      .filter((c) => typeof c.current_price === "number" && c.current_price > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        symbol: String(c.symbol).toUpperCase(),
        rank: c.market_cap_rank ?? 0,
        price: c.current_price,
        change24h: c.price_change_percentage_24h ?? 0,
        marketCap: c.market_cap ?? 0,
        volume24h: c.total_volume ?? 0,
        image: c.image,
      }));
  });
  return { coins: value, updatedAt, stale };
}

const RANGE_DAYS: Record<string, string> = {
  "1D": "1",
  "7D": "7",
  "30D": "30",
  "90D": "90",
  "1Y": "365",
  MAX: "max",
};

export const CHART_RANGES = Object.keys(RANGE_DAYS);

export async function getCoin(id: string, range = "7D"): Promise<CoinDetail | null> {
  const days = RANGE_DAYS[range] ?? "7";

  let info: { value: any; updatedAt: number; stale: boolean };
  try {
    info = await cached<any>(`coin:${id}`, PRICE_TTL, () =>
      cg<any>(
        `/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      ),
    );
  } catch {
    return null;
  }

  let prices: { timestamp: number; price: number }[] = [];
  let chartUnavailable = false;
  try {
    const chart = await cached<any>(
      `chart:${id}:${range}`,
      CHART_TTL[range] ?? 15 * 60_000,
      () => cg<any>(`/coins/${id}/market_chart?vs_currency=usd&days=${days}`),
    );
    prices = (chart.value?.prices ?? []).map((p: [number, number]) => ({
      timestamp: Math.floor(p[0] / 1000),
      price: p[1],
    }));
    chartUnavailable = prices.length === 0;
  } catch {
    chartUnavailable = true;
  }

  const i = info.value;
  const md = i.market_data ?? {};
  const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

  return {
    id: i.id,
    name: i.name,
    symbol: String(i.symbol).toUpperCase(),
    price: md.current_price?.usd ?? 0,
    change24h: md.price_change_percentage_24h ?? 0,
    marketCap: md.market_cap?.usd ?? 0,
    marketCapRank: num(i.market_cap_rank),
    volume24h: md.total_volume?.usd ?? 0,
    supplyCirculating: num(md.circulating_supply),
    supplyTotal: num(md.total_supply),
    supplyMax: num(md.max_supply),
    ath: num(md.ath?.usd),
    athDate: md.ath_date?.usd ?? null,
    atl: num(md.atl?.usd),
    atlDate: md.atl_date?.usd ?? null,
    image: i.image?.large,
    description: (i.description?.en ?? "").split(". ")[0] || undefined,
    homepage: i.links?.homepage?.[0] || undefined,
    sourceCode: i.links?.repos_url?.github?.[0] || undefined,
    twitter: i.links?.twitter_screen_name
      ? `https://twitter.com/${i.links.twitter_screen_name}`
      : undefined,
    telegram: i.links?.telegram_channel_identifier
      ? `https://t.me/${i.links.telegram_channel_identifier}`
      : undefined,
    historicalPrices: prices,
    updatedAt: info.updatedAt,
    stale: info.stale,
    chartUnavailable,
  };
}

/** Coin metadata search (long cache — static data). */
export async function searchCoins(query: string) {
  const key = `search:${query.toLowerCase()}`;
  const { value } = await cached<any>(key, META_TTL, () =>
    cg<any>(`/search?query=${encodeURIComponent(query)}`),
  );
  return (value?.coins ?? []).slice(0, 15).map((c: any) => ({
    id: c.id,
    name: c.name,
    symbol: String(c.symbol).toUpperCase(),
    rank: c.market_cap_rank ?? 0,
    image: c.thumb,
  }));
}

export async function getNews(): Promise<NewsItem[]> {
  const { value } = await cached<NewsItem[]>("news", 5 * 60_000, async () => {
    const res = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN", {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`news ${res.status}`);
    const json = (await res.json()) as any;
    const items = json?.Data ?? [];
    if (!items.length) throw new Error("empty news response");
    return items.slice(0, 30).map((n: any) => ({
      title: n.title,
      source: n.source_info?.name ?? n.source ?? "Crypto",
      url: n.url,
      date: new Date(n.published_on * 1000).toISOString(),
    }));
  });
  return value;
}

/**
 * Current USD price for a set of coin ids (alert engine, portfolio, wallet).
 * Missing ids are simply absent from the result — never zero.
 */
export async function getPrices(ids: string[]): Promise<Record<string, number>> {
  if (!ids.length) return {};
  const result: Record<string, number> = {};
  try {
    const { value } = await cached<Record<string, { usd?: number }>>(
      `prices:${[...ids].sort().join(",")}`,
      PRICE_TTL,
      () =>
        cg<Record<string, { usd?: number }>>(
          `/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd`,
        ),
    );
    for (const id of ids) {
      const price = value?.[id]?.usd;
      if (typeof price === "number" && price > 0) result[id] = price;
    }
  } catch {
    /* fall through to the cached market list */
  }
  const missing = ids.filter((id) => !result[id]);
  if (missing.length) {
    try {
      const { coins } = await getCoins();
      for (const id of missing) {
        const hit = coins.find((c) => c.id === id);
        if (hit && hit.price > 0) result[id] = hit.price;
      }
    } catch {
      /* leave missing ids out entirely */
    }
  }
  return result;
}
