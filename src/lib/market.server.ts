/**
 * Market data service (server-only).
 * Uses the public CoinGecko API and falls back to a generated mock dataset
 * when the upstream API is unavailable or rate-limited.
 */

export type Coin = {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  price: number;
  change24h: number;
  marketCap: number;
  image?: string | undefined;
};

export type CoinDetail = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  supplyCirculating: number;
  supplyMax: number | null;
  image?: string | undefined;
  description?: string | undefined;
  homepage?: string | undefined;
  sourceCode?: string | undefined;
  twitter?: string | undefined;
  telegram?: string | undefined;
  historicalPrices: { timestamp: number; price: number }[];
};

export type NewsItem = {
  title: string;
  source: string;
  url: string;
  date: string;
};

const CG = "https://api.coingecko.com/api/v3";

async function cg<T>(path: string): Promise<T> {
  const res = await fetch(`${CG}${path}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  return (await res.json()) as T;
}

/* ---------------- mock fallback ---------------- */

const SEED_COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "btc", base: 64000, cap: 1_250_000_000_000, supply: 19_700_000, max: 21_000_000 },
  { id: "ethereum", name: "Ethereum", symbol: "eth", base: 3100, cap: 372_000_000_000, supply: 120_000_000, max: null },
  { id: "tether", name: "Tether", symbol: "usdt", base: 1, cap: 112_000_000_000, supply: 112_000_000_000, max: null },
  { id: "binancecoin", name: "BNB", symbol: "bnb", base: 580, cap: 85_000_000_000, supply: 147_000_000, max: 200_000_000 },
  { id: "solana", name: "Solana", symbol: "sol", base: 145, cap: 67_000_000_000, supply: 462_000_000, max: null },
  { id: "ripple", name: "XRP", symbol: "xrp", base: 0.52, cap: 29_000_000_000, supply: 55_000_000_000, max: 100_000_000_000 },
  { id: "cardano", name: "Cardano", symbol: "ada", base: 0.41, cap: 14_500_000_000, supply: 35_000_000_000, max: 45_000_000_000 },
  { id: "dogecoin", name: "Dogecoin", symbol: "doge", base: 0.12, cap: 17_000_000_000, supply: 143_000_000_000, max: null },
  { id: "avalanche-2", name: "Avalanche", symbol: "avax", base: 27, cap: 10_800_000_000, supply: 400_000_000, max: 720_000_000 },
  { id: "chainlink", name: "Chainlink", symbol: "link", base: 13.5, cap: 8_400_000_000, supply: 620_000_000, max: 1_000_000_000 },
  { id: "polkadot", name: "Polkadot", symbol: "dot", base: 5.9, cap: 8_100_000_000, supply: 1_400_000_000, max: null },
  { id: "litecoin", name: "Litecoin", symbol: "ltc", base: 72, cap: 5_400_000_000, supply: 74_000_000, max: 84_000_000 },
];

/** deterministic-per-minute pseudo random so mock data "moves" like a market */
function wobble(seed: string, salt = 0) {
  const minute = Math.floor(Date.now() / 60000);
  let h = 2166136261 ^ salt;
  const s = seed + ":" + minute;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000; // 0..1
}

function mockCoins(): Coin[] {
  return SEED_COINS.map((c, i) => {
    const drift = (wobble(c.id) - 0.5) * 0.06;
    const change = (wobble(c.id, 7) - 0.45) * 12;
    return {
      id: c.id,
      name: c.name,
      symbol: c.symbol.toUpperCase(),
      rank: i + 1,
      price: +(c.base * (1 + drift)).toFixed(c.base < 1 ? 4 : 2),
      change24h: +change.toFixed(2),
      marketCap: Math.round(c.cap * (1 + drift)),
    };
  });
}

function mockDetail(id: string): CoinDetail | null {
  const seed = SEED_COINS.find((c) => c.id === id);
  if (!seed) return null;
  const coin = mockCoins().find((c) => c.id === id)!;
  const points = 168;
  const now = Math.floor(Date.now() / 1000);
  const historicalPrices = Array.from({ length: points }, (_, i) => {
    const t = now - (points - 1 - i) * 3600;
    const w = wobble(`${id}:${i}`, 13) - 0.5;
    const trend = Math.sin(i / 14) * 0.04;
    return { timestamp: t, price: +(seed.base * (1 + trend + w * 0.03)).toFixed(seed.base < 1 ? 4 : 2) };
  });
  return {
    ...coin,
    volume24h: Math.round(seed.cap * 0.05 * (0.6 + wobble(id, 3))),
    supplyCirculating: seed.supply,
    supplyMax: seed.max,
    description: `${seed.name} (${seed.symbol.toUpperCase()}) market overview.`,
    homepage: `https://www.coingecko.com/en/coins/${id}`,
    sourceCode: "https://github.com",
    twitter: `https://twitter.com/${seed.symbol}`,
    telegram: "",
    historicalPrices,
  };
}

/* ---------------- public service API ---------------- */

export async function getCoins(): Promise<Coin[]> {
  try {
    const data = await cg<any[]>(
      "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false",
    );
    if (!Array.isArray(data) || data.length === 0) throw new Error("empty");
    return data.map((c) => ({
      id: c.id,
      name: c.name,
      symbol: String(c.symbol).toUpperCase(),
      rank: c.market_cap_rank ?? 0,
      price: c.current_price ?? 0,
      change24h: c.price_change_percentage_24h ?? 0,
      marketCap: c.market_cap ?? 0,
      image: c.image,
    }));
  } catch {
    return mockCoins();
  }
}

const RANGE_DAYS: Record<string, string> = { "1D": "1", "7D": "7", "1M": "30", "1Y": "365" };

export async function getCoin(id: string, range = "7D"): Promise<CoinDetail | null> {
  const days = RANGE_DAYS[range] ?? "7";
  try {
    const [info, chart] = await Promise.all([
      cg<any>(`/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`),
      cg<any>(`/coins/${id}/market_chart?vs_currency=usd&days=${days}`),
    ]);
    const md = info.market_data ?? {};
    return {
      id: info.id,
      name: info.name,
      symbol: String(info.symbol).toUpperCase(),
      price: md.current_price?.usd ?? 0,
      change24h: md.price_change_percentage_24h ?? 0,
      marketCap: md.market_cap?.usd ?? 0,
      volume24h: md.total_volume?.usd ?? 0,
      supplyCirculating: md.circulating_supply ?? 0,
      supplyMax: md.max_supply ?? null,
      image: info.image?.large,
      description: (info.description?.en ?? "").split(". ")[0],
      homepage: info.links?.homepage?.[0] || undefined,
      sourceCode: info.links?.repos_url?.github?.[0] || undefined,
      twitter: info.links?.twitter_screen_name
        ? `https://twitter.com/${info.links.twitter_screen_name}`
        : undefined,
      telegram: info.links?.telegram_channel_identifier
        ? `https://t.me/${info.links.telegram_channel_identifier}`
        : undefined,
      historicalPrices: (chart.prices ?? []).map((p: [number, number]) => ({
        timestamp: Math.floor(p[0] / 1000),
        price: p[1],
      })),
    };
  } catch {
    const m = mockDetail(id);
    if (!m) return null;
    const slice = { "1D": 24, "7D": 168, "1M": 168, "1Y": 168 }[range] ?? 168;
    return { ...m, historicalPrices: m.historicalPrices.slice(-slice) };
  }
}

export async function getNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error("news");
    const json = (await res.json()) as any;
    const items = json?.Data ?? [];
    if (!items.length) throw new Error("empty");
    return items.slice(0, 30).map((n: any) => ({
      title: n.title,
      source: n.source_info?.name ?? n.source ?? "Crypto",
      url: n.url,
      date: new Date(n.published_on * 1000).toISOString(),
    }));
  } catch {
    const now = Date.now();
    return [
      { title: "Bitcoin ETF inflows hit a new weekly record", source: "CoinDesk" },
      { title: "Ethereum developers finalize next upgrade scope", source: "The Block" },
      { title: "Altcoin rally continues as liquidity returns", source: "CoinTelegraph" },
      { title: "Stablecoin supply grows for the sixth straight week", source: "Decrypt" },
      { title: "Layer-2 fees drop to multi-month lows", source: "CoinDesk" },
      { title: "Regulators publish updated digital asset guidance", source: "Reuters" },
    ].map((n, i) => ({
      ...n,
      url: `https://www.coindesk.com/`,
      date: new Date(now - i * 3600_000 * 3).toISOString(),
    }));
  }
}
