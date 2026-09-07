import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { tickerQuery } from "@/lib/api";
import { formatPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type Dir = "up" | "down" | null;

export function LiveTicker() {
  const { data } = useQuery(tickerQuery);
  const coins = (data ?? []).filter((c) => c.price > 0).slice(0, 12);
  const prev = useRef<Record<string, number>>({});
  const [flash, setFlash] = useState<Record<string, Dir>>({});

  useEffect(() => {
    if (!coins.length) return;
    const next: Record<string, Dir> = {};
    for (const c of coins) {
      const before = prev.current[c.id];
      if (before !== undefined && before !== c.price) next[c.id] = c.price > before ? "up" : "down";
      prev.current[c.id] = c.price;
    }
    if (Object.keys(next).length) {
      setFlash(next);
      const t = setTimeout(() => setFlash({}), 900);
      return () => clearTimeout(t);
    }
    return;
  }, [coins]);

  if (!coins.length) return null;

  const strip = (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {coins.map((c) => (
        <Link
          key={c.id}
          to="/coin/$id"
          params={{ id: c.id }}
          className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
        >
          <span className="font-medium">{c.symbol}</span>
          <span
            className={cn(
              "numeric transition-colors duration-300",
              flash[c.id] === "up" && "text-gain",
              flash[c.id] === "down" && "text-loss",
            )}
          >
            {formatPrice(c.price)}
          </span>
          <span className={cn("numeric text-xs", c.change24h >= 0 ? "text-gain" : "text-loss")}>
            {formatPercent(c.change24h)}
          </span>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center">
        <div className="flex shrink-0 items-center gap-2 border-r border-border px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-gain" /> Live
        </div>
        <div className="ticker-viewport flex-1 overflow-hidden py-2.5">
          <div className="ticker-track flex w-max">
            {strip}
            {strip}
          </div>
        </div>
      </div>
    </div>
  );
}
