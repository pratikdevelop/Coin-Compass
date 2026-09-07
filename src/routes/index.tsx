import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { coinsQuery } from "@/lib/api";
import { toast } from "sonner";
import { useWatchlist } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { LiveTicker } from "@/components/coins/LiveTicker";
import { CoinTable } from "@/components/coins/CoinTable";
import { PageShell } from "@/components/layout/PageShell";
import { formatCompact } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CoinScope — Live Cryptocurrency Prices & Market Caps" },
      {
        name: "description",
        content:
          "Track live cryptocurrency prices, 24h changes and market caps. Search coins, build a watchlist and follow your portfolio.",
      },
      { property: "og:title", content: "CoinScope — Live Cryptocurrency Prices" },
      {
        property: "og:description",
        content: "Live crypto market data, watchlists, price alerts and portfolio tracking.",
      },
    ],
  }),
  component: MarketsPage,
});

function MarketsPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery(coinsQuery);
  const { ids: watchlist, toggle } = useWatchlist();
  const { userId } = useAuth();

  const onToggleWatch = (id: string) => {
    const coin = (data ?? []).find((c) => c.id === id);
    if (!coin) return;
    if (!userId) {
      toast.error("Sign in to save your watchlist");
      return;
    }
    toggle.mutate(
      { id: coin.id, symbol: coin.symbol, name: coin.name },
      {
        onSuccess: (r) =>
          toast.success(r === "added" ? `${coin.name} added to watchlist` : `${coin.name} removed`),
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };
  const [term, setTerm] = useState("");

  const coins = useMemo(() => {
    const q = term.trim().toLowerCase();
    const list = data ?? [];
    if (!q) return list;
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
    );
  }, [data, term]);

  const totalCap = useMemo(
    () => (data ?? []).reduce((sum, c) => sum + (c.marketCap || 0), 0),
    [data],
  );

  return (
    <PageShell>
      <LiveTicker />

      <section className="glow-surface -mx-4 mb-8 px-4 pb-8 pt-10 sm:-mx-6 sm:px-6">
        <h1 className="text-3xl font-semibold sm:text-4xl">Today's crypto markets</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Prices refresh automatically every minute. Star any coin to track it on your watchlist.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Total market cap</div>
            <div className="numeric text-lg">{formatCompact(totalCap)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Coins tracked</div>
            <div className="numeric text-lg">{data?.length ?? 0}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Last update</div>
            <div className="numeric text-lg">
              {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"}
            </div>
          </div>
        </div>
      </section>

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Filter by name or symbol"
          aria-label="Filter coins"
          className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Market data is unavailable right now. Please try again shortly.
        </p>
      ) : (
        <CoinTable
          coins={coins}
          watchlist={watchlist}
          onToggleWatch={onToggleWatch}
          emptyMessage="No coins match your search."
        />
      )}
    </PageShell>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}
