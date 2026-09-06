import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { coinsQuery } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { CoinTable } from "@/components/coins/CoinTable";
import { useWatchlist } from "@/lib/local-store";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "My Crypto Watchlist — CoinScope" },
      {
        name: "description",
        content: "Follow the coins you care about with live prices, 24h changes and market caps.",
      },
      { property: "og:title", content: "My Crypto Watchlist — CoinScope" },
      { property: "og:description", content: "Live prices for the coins you follow." },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { data, isLoading, dataUpdatedAt } = useQuery(coinsQuery);
  const { watchlist, toggle, hydrated } = useWatchlist();

  const coins = (data ?? []).filter((c) => watchlist.includes(c.id));

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Watchlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live prices, refreshed every minute.
            {dataUpdatedAt ? ` Last update ${new Date(dataUpdatedAt).toLocaleTimeString()}.` : ""}
          </p>
        </div>
        <Link to="/" className="text-sm text-primary hover:underline">
          Browse all coins
        </Link>
      </div>

      {isLoading || !hydrated ? (
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      ) : (
        <CoinTable
          coins={coins}
          watchlist={watchlist}
          onToggleWatch={toggle}
          emptyMessage="Your watchlist is empty. Star a coin on the markets page to add it here."
        />
      )}
    </PageShell>
  );
}
