import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type WatchRow = { id: string; coin_id: string; symbol: string; name: string };
export type AlertRow = {
  id: string;
  coin_id: string;
  symbol: string;
  name: string;
  direction: "above" | "below";
  target_price: number;
  active: boolean;
  triggered_at: string | null;
  created_at: string;
};
export type HoldingRow = {
  id: string;
  coin_id: string;
  symbol: string;
  name: string;
  quantity: number;
  buy_price: number;
};
export type TradeRow = {
  id: string;
  coin_id: string;
  symbol: string;
  name: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  traded_at: string;
  note: string | null;
};

function useOwnedQuery<T>(table: string, orderBy: string, ascending = false) {
  const { userId, ready } = useAuth();
  return useQuery({
    queryKey: [table, userId],
    enabled: ready && !!userId,
    queryFn: async () => {
      const { data, error } = await (
        supabase as unknown as {
          from: (t: string) => {
            select: (c: string) => {
              order: (
                col: string,
                opts: { ascending: boolean },
              ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
            };
          };
        }
      )
        .from(table)
        .select("*")
        .order(orderBy, { ascending });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

/* ---------------- watchlist ---------------- */

export function useWatchlist() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  const query = useOwnedQuery<WatchRow>("watchlist", "created_at");
  const rows = query.data ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ["watchlist", userId] });

  const toggle = useMutation({
    mutationFn: async (coin: { id: string; symbol: string; name: string }) => {
      if (!userId) throw new Error("Sign in to save your watchlist");
      const existing = rows.find((r) => r.coin_id === coin.id);
      if (existing) {
        const { error } = await supabase.from("watchlist").delete().eq("id", existing.id);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase
        .from("watchlist")
        .insert({ user_id: userId, coin_id: coin.id, symbol: coin.symbol, name: coin.name });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: invalidate,
  });

  return {
    rows,
    ids: rows.map((r) => r.coin_id),
    has: (id: string) => rows.some((r) => r.coin_id === id),
    toggle,
    isLoading: query.isLoading,
  };
}

/* ---------------- alerts ---------------- */

export function useAlerts() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  const query = useOwnedQuery<AlertRow>("price_alerts", "created_at");
  const invalidate = () => qc.invalidateQueries({ queryKey: ["price_alerts", userId] });

  const add = useMutation({
    mutationFn: async (input: {
      coinId: string;
      symbol: string;
      name: string;
      direction: "above" | "below";
      targetPrice: number;
    }) => {
      if (!userId) throw new Error("Sign in to save price alerts");
      const { error } = await supabase.from("price_alerts").insert({
        user_id: userId,
        coin_id: input.coinId,
        symbol: input.symbol,
        name: input.name,
        direction: input.direction,
        target_price: input.targetPrice,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("price_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { alerts: query.data ?? [], add, remove, isLoading: query.isLoading };
}

/* ---------------- holdings ---------------- */

export function useHoldings() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  const query = useOwnedQuery<HoldingRow>("holdings", "created_at");
  const invalidate = () => qc.invalidateQueries({ queryKey: ["holdings", userId] });

  const add = useMutation({
    mutationFn: async (input: {
      coinId: string;
      symbol: string;
      name: string;
      quantity: number;
      buyPrice: number;
    }) => {
      if (!userId) throw new Error("Sign in to save holdings");
      const { error } = await supabase.from("holdings").insert({
        user_id: userId,
        coin_id: input.coinId,
        symbol: input.symbol,
        name: input.name,
        quantity: input.quantity,
        buy_price: input.buyPrice,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("holdings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { holdings: query.data ?? [], add, remove, isLoading: query.isLoading };
}

/* ---------------- trades ---------------- */

export function useTrades() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  const query = useOwnedQuery<TradeRow>("trades", "traded_at");
  const invalidate = () => qc.invalidateQueries({ queryKey: ["trades", userId] });

  const add = useMutation({
    mutationFn: async (input: {
      coinId: string;
      symbol: string;
      name: string;
      side: "buy" | "sell";
      quantity: number;
      price: number;
      tradedAt: string;
      note?: string;
    }) => {
      if (!userId) throw new Error("Sign in to record trades");
      const { error } = await supabase.from("trades").insert({
        user_id: userId,
        coin_id: input.coinId,
        symbol: input.symbol,
        name: input.name,
        side: input.side,
        quantity: input.quantity,
        price: input.price,
        traded_at: input.tradedAt,
        note: input.note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { trades: query.data ?? [], add, remove, isLoading: query.isLoading };
}
