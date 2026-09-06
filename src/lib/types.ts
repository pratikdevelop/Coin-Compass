export type Coin = {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  price: number;
  change24h: number;
  marketCap: number;
  image?: string;
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
  image?: string;
  description?: string;
  homepage?: string;
  sourceCode?: string;
  twitter?: string;
  telegram?: string;
  historicalPrices: { timestamp: number; price: number }[];
};

export type NewsItem = {
  title: string;
  source: string;
  url: string;
  date: string;
};

export type Alert = {
  id: string;
  coinId: string;
  symbol: string;
  direction: "above" | "below";
  price: number;
  createdAt: number;
};

export type Holding = {
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
};
