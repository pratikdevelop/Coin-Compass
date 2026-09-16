export type Coin = {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  image?: string;
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
  image?: string;
  description?: string;
  homepage?: string;
  sourceCode?: string;
  twitter?: string;
  telegram?: string;
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
