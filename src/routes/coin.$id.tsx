import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Bell, Github, Globe, Send, Star, Twitter } from "lucide-react";
import { toast } from "sonner";
import { coinQuery } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { AdsterraBanner468x60 } from "@/components/ads/AdsterraBanner468x60";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { PriceChart, RANGES, type Range } from "@/components/coins/PriceChart";
import { useAlerts, useWatchlist } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  formatCompact,
  formatNumber,
  formatPercent,
  formatPrice,
} from "@/lib/format";

export const Route = createFileRoute("/coin/$id")({
  head: ({ params }) => {
    const name = params.id.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    const title = `${name} Price, Chart & Market Data — CoinScope`;
    const description = `Live ${name} price, interactive chart, market cap, 24h volume and supply data.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CoinDetailPage,
});

function CoinDetailPage() {
  const { id } = Route.useParams();
  const [range, setRange] = useState<Range>("7D");
  const { data, isLoading, isError } = useQuery(coinQuery(id, range));
  const { has, toggle } = useWatchlist();
  const { userId } = useAuth();
  const watched = has(id);

  return (
    <PageShell>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to markets
      </Link>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
      ) : isError || !data ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          We couldn't load this coin. Try again in a moment.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {data.image ? (
                <img src={data.image} alt="" className="size-10 rounded-full" />
              ) : null}
              <div>
                <h1 className="text-2xl font-semibold sm:text-3xl">
                  {data.name} <span className="text-muted-foreground">{data.symbol}</span>
                </h1>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="numeric text-2xl">{formatPrice(data.price)}</span>
                  <span
                    className={cn(
                      "numeric text-sm",
                      data.change24h >= 0 ? "text-gain" : "text-loss",
                    )}
                  >
                    {formatPercent(data.change24h)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!userId) {
                    toast.error("Sign in to save your watchlist");
                    return;
                  }
                  toggle.mutate(
                    { id, symbol: data.symbol, name: data.name },
                    {
                      onSuccess: (r) =>
                        toast.success(
                          r === "added"
                            ? `${data.name} added to watchlist`
                            : `${data.name} removed from watchlist`,
                        ),
                      onError: (e: Error) => toast.error(e.message),
                    },
                  );
                }}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors",
                  watched
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-foreground hover:bg-accent",
                )}
              >
                <Star className={cn("size-4", watched && "fill-current")} />
                {watched ? "In watchlist" : "Add to watchlist"}
              </button>
              <AlertDialogButton coinId={id} symbol={data.symbol} name={data.name} currentPrice={data.price} />
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex gap-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    r === range
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <PriceChart points={data.historicalPrices} range={range} positive={data.change24h >= 0} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Current price" value={formatPrice(data.price)} />
            <Stat label="Market cap" value={formatCompact(data.marketCap)} />
            <Stat label="24h volume" value={formatCompact(data.volume24h)} />
            <Stat
              label="Circulating supply"
              value={`${formatNumber(data.supplyCirculating)} ${data.symbol}`}
            />
            <Stat
              label="Max supply"
              value={data.supplyMax ? `${formatNumber(data.supplyMax)} ${data.symbol}` : "Unlimited"}
            />
          </div>

          <AdsterraBanner468x60 />

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Links
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <LinkChip href={data.homepage} icon={<Globe className="size-4" />} label="Website" />
              <LinkChip href={data.sourceCode} icon={<Github className="size-4" />} label="Source code" />
              <LinkChip href={data.twitter} icon={<Twitter className="size-4" />} label="Twitter" />
              <LinkChip href={data.telegram} icon={<Send className="size-4" />} label="Telegram" />
            </div>
            {data.description ? (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {data.description}
              </p>
            ) : null}
          </div>

          <AdsterraNativeBanner />

          <AlertList coinId={id} />
        </>
      )}
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="numeric mt-1 text-base">{value}</div>
    </div>
  );
}

function LinkChip({
  href,
  icon,
  label,
}: {
  href?: string | undefined;
  icon: React.ReactNode;
  label: string;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
    >
      {icon}
      {label}
    </a>
  );
}

function AlertDialogButton({
  coinId,
  symbol,
  name,
  currentPrice,
}: {
  coinId: string;
  symbol: string;
  name: string;
  currentPrice: number;
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [price, setPrice] = useState(String(Math.round(currentPrice * 1.1 * 100) / 100));
  const { add } = useAlerts();
  const { userId } = useAuth();

  const save = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sign in to save price alerts");
      const value = Number(price);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a valid price above zero");
      await add.mutateAsync({ coinId, symbol, name, direction, targetPrice: value });
    },
    onSuccess: () => {
      toast.success(
        `Alert saved: we'll email you when ${symbol} goes ${direction} ${formatPrice(Number(price))}`,
      );
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-accent"
      >
        <Bell className="size-4" /> Set price alert
      </button>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="absolute right-0 top-12 z-40 w-72 rounded-xl border border-border bg-popover p-4 shadow-xl"
        >
          <p className="text-sm font-medium">Notify me when {symbol} is</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["above", "below"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                className={cn(
                  "rounded-md border border-border px-3 py-2 text-sm capitalize",
                  direction === d ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-xs uppercase tracking-wide text-muted-foreground">
            Target price (USD)
          </label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="numeric mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
          />
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="h-9 flex-1 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save alert
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 rounded-md border border-border px-3 text-sm hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function AlertList({ coinId }: { coinId: string }) {
  const { alerts, remove } = useAlerts();
  const mine = alerts.filter((a) => a.coin_id === coinId);
  if (!mine.length) return null;
  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Your alerts
      </h2>
      <ul className="mt-3 space-y-2">
        {mine.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm"
          >
            <span className="numeric">
              {a.symbol} {a.direction} {formatPrice(Number(a.target_price))}
              {a.triggered_at ? (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-foreground">
                  triggered {new Date(a.triggered_at).toLocaleDateString()}
                </span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={() => remove.mutate(a.id)}
              className="text-xs text-muted-foreground hover:text-loss"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
