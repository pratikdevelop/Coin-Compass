import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Coin } from "@/lib/types";
import { formatCompact, formatPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "rank" | "name" | "price" | "change24h" | "marketCap";

export function CoinTable({
  coins,
  watchlist,
  onToggleWatch,
  emptyMessage = "No coins to show.",
}: {
  coins: Coin[];
  watchlist: string[];
  onToggleWatch: (id: string) => void;
  emptyMessage?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [asc, setAsc] = useState(true);

  const sorted = useMemo(() => {
    const list = [...coins];
    list.sort((a, b) => {
      const x = a[sortKey];
      const y = b[sortKey];
      const cmp = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
      return asc ? cmp : -cmp;
    });
    return list;
  }, [coins, sortKey, asc]);

  function header(key: SortKey, label: string, className?: string) {
    return (
      <th className={cn("px-3 py-3 text-xs font-medium uppercase tracking-wide", className)}>
        <button
          type="button"
          onClick={() => {
            if (sortKey === key) setAsc((v) => !v);
            else {
              setSortKey(key);
              setAsc(key === "rank" || key === "name");
            }
          }}
          className={cn(
            "transition-colors hover:text-foreground",
            sortKey === key ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
          {sortKey === key ? (asc ? " ↑" : " ↓") : ""}
        </button>
      </th>
    );
  }

  if (!coins.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <th className="w-10 px-3 py-3" />
            {header("rank", "#", "w-14")}
            {header("name", "Name")}
            {header("price", "Price", "text-right [&>button]:w-full [&>button]:text-right")}
            {header("change24h", "24h %", "text-right [&>button]:w-full [&>button]:text-right")}
            {header("marketCap", "Market Cap", "text-right [&>button]:w-full [&>button]:text-right")}
          </tr>
        </thead>
        <tbody>
          {sorted.map((coin) => {
            const watched = watchlist.includes(coin.id);
            const up = coin.change24h >= 0;
            return (
              <tr key={coin.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                <td className="px-3 py-3">
                  <button
                    type="button"
                    aria-label={watched ? `Remove ${coin.name} from watchlist` : `Add ${coin.name} to watchlist`}
                    onClick={() => onToggleWatch(coin.id)}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Star className={cn("size-4", watched && "fill-primary text-primary")} />
                  </button>
                </td>
                <td className="numeric px-3 py-3 text-muted-foreground">{coin.rank || "—"}</td>
                <td className="px-3 py-3">
                  <Link
                    to="/coin/$id"
                    params={{ id: coin.id }}
                    className="flex items-center gap-2 font-medium hover:text-primary"
                  >
                    {coin.image ? (
                      <img src={coin.image} alt="" className="size-5 rounded-full" loading="lazy" />
                    ) : null}
                    <span>{coin.name}</span>
                    <span className="text-xs text-muted-foreground">{coin.symbol}</span>
                  </Link>
                </td>
                <td className="numeric px-3 py-3 text-right">{formatPrice(coin.price)}</td>
                <td
                  className={cn("numeric px-3 py-3 text-right", up ? "text-gain" : "text-loss")}
                >
                  {formatPercent(coin.change24h)}
                </td>
                <td className="numeric px-3 py-3 text-right text-muted-foreground">
                  {formatCompact(coin.marketCap)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
