import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { coinsQuery } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { SignInPrompt } from "@/components/layout/SignInPrompt";
import { useHoldings, useTrades } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { formatCompact, formatPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Crypto Portfolio Tracker — CoinScope" },
      {
        name: "description",
        content:
          "Track your crypto holdings, total balance and profit or loss against live prices, with your trade history.",
      },
      { property: "og:title", content: "Crypto Portfolio Tracker — CoinScope" },
      { property: "og:description", content: "Total balance and profit/loss across your holdings." },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { data: coins } = useQuery(coinsQuery);
  const { holdings, add, remove, isLoading } = useHoldings();
  const { trades } = useTrades();
  const { userId, ready } = useAuth();

  const [coinId, setCoinId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");

  const rows = useMemo(
    () =>
      holdings.map((h) => {
        const live = coins?.find((c) => c.id === h.coin_id);
        const qty = Number(h.quantity);
        const buy = Number(h.buy_price);
        const price = live?.price && live.price > 0 ? live.price : buy;
        const value = price * qty;
        const cost = buy * qty;
        return {
          id: h.id,
          coinId: h.coin_id,
          name: h.name,
          symbol: h.symbol,
          quantity: qty,
          buyPrice: buy,
          price,
          value,
          cost,
          pnl: value - cost,
          change24h: live?.change24h ?? 0,
        };
      }),
    [holdings, coins],
  );

  const totals = rows.reduce(
    (acc, r) => ({ value: acc.value + r.value, cost: acc.cost + r.cost }),
    { value: 0, cost: 0 },
  );
  const pnl = totals.value - totals.cost;
  const pnlPct = totals.cost > 0 ? (pnl / totals.cost) * 100 : 0;

  const chartData = useMemo(() => {
    if (!rows.length) return [];
    const start = rows.reduce(
      (sum, r) => sum + (r.price / (1 + r.change24h / 100)) * r.quantity,
      0,
    );
    const steps = 24;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const t = Date.now() - (steps - i) * 3600_000;
      const ratio = i / steps;
      return { t, value: start + (totals.value - start) * ratio };
    });
  }, [rows, totals.value]);

  const recentTrades = trades.slice(0, 5);
  const realised = useMemo(() => {
    // Simple average-cost realised P/L from recorded sells.
    let result = 0;
    const byCoin: Record<string, { qty: number; cost: number }> = {};
    [...trades]
      .sort((a, b) => +new Date(a.traded_at) - +new Date(b.traded_at))
      .forEach((t) => {
        const bucket = (byCoin[t.coin_id] ??= { qty: 0, cost: 0 });
        const qty = Number(t.quantity);
        const price = Number(t.price);
        if (t.side === "buy") {
          bucket.qty += qty;
          bucket.cost += qty * price;
        } else {
          const avg = bucket.qty > 0 ? bucket.cost / bucket.qty : price;
          result += (price - avg) * qty;
          bucket.qty = Math.max(0, bucket.qty - qty);
          bucket.cost = Math.max(0, bucket.cost - avg * qty);
        }
      });
    return result;
  }, [trades]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const coin = coins?.find((c) => c.id === coinId);
    const qty = Number(quantity);
    const cost = Number(buyPrice);
    if (!coin) {
      toast.error("Pick a coin first");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Enter a quantity above zero");
      return;
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      toast.error("Enter a valid buy price");
      return;
    }
    add.mutate(
      { coinId: coin.id, symbol: coin.symbol, name: coin.name, quantity: qty, buyPrice: cost },
      {
        onSuccess: () => {
          setQuantity("");
          setBuyPrice("");
          toast.success(`${coin.symbol} added to your portfolio`);
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  }

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold sm:text-3xl">Portfolio</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your holdings, valued against live prices and saved to your account.
      </p>

      {ready && !userId ? (
        <div className="mt-6">
          <SignInPrompt what="your holdings and trades" />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Stat label="Total balance" value={formatCompact(totals.value)} />
            <Stat label="Total cost" value={formatCompact(totals.cost)} />
            <Stat
              label="Unrealised P/L"
              value={`${pnl >= 0 ? "+" : "-"}${formatPrice(Math.abs(pnl))} (${formatPercent(pnlPct)})`}
              tone={pnl >= 0 ? "gain" : "loss"}
            />
            <Stat
              label="Realised P/L (trades)"
              value={`${realised >= 0 ? "+" : "-"}${formatPrice(Math.abs(realised))}`}
              tone={realised >= 0 ? "gain" : "loss"}
            />
          </div>

          <form
            onSubmit={submit}
            className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <select
              value={coinId}
              onChange={(e) => setCoinId(e.target.value)}
              aria-label="Coin"
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
            >
              <option value="">Select a coin…</option>
              {(coins ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Quantity"
              inputMode="decimal"
              aria-label="Quantity"
              className="numeric h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
            />
            <input
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="Buy price (USD)"
              inputMode="decimal"
              aria-label="Buy price"
              className="numeric h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
            />
            <button
              type="submit"
              className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Add holding
            </button>
          </form>

          {chartData.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Portfolio value (24h)
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pfFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="t"
                      tickFormatter={(t: number) =>
                        new Date(t).toLocaleTimeString([], { hour: "2-digit" })
                      }
                      minTickGap={32}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      width={78}
                      tickFormatter={(v: number) => formatCompact(v)}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
                      formatter={(v: number | string) => [formatPrice(Number(v)), "Value"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-chart-2)"
                      strokeWidth={2}
                      fill="url(#pfFill)"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
            {isLoading ? (
              <div className="h-32 animate-pulse bg-muted" />
            ) : rows.length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">
                No holdings yet. Add your first one above.
              </p>
            ) : (
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Asset</th>
                    <th className="px-3 py-3 text-right">Quantity</th>
                    <th className="px-3 py-3 text-right">Buy price</th>
                    <th className="px-3 py-3 text-right">Price</th>
                    <th className="px-3 py-3 text-right">Value</th>
                    <th className="px-3 py-3 text-right">P/L</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-3 font-medium">
                        <Link to="/coin/$id" params={{ id: r.coinId }} className="hover:underline">
                          {r.name}
                        </Link>{" "}
                        <span className="text-xs text-muted-foreground">{r.symbol}</span>
                      </td>
                      <td className="numeric px-3 py-3 text-right">{r.quantity}</td>
                      <td className="numeric px-3 py-3 text-right">{formatPrice(r.buyPrice)}</td>
                      <td className="numeric px-3 py-3 text-right">{formatPrice(r.price)}</td>
                      <td className="numeric px-3 py-3 text-right">{formatPrice(r.value)}</td>
                      <td
                        className={cn(
                          "numeric px-3 py-3 text-right",
                          r.pnl >= 0 ? "text-gain" : "text-loss",
                        )}
                      >
                        {r.pnl >= 0 ? "+" : "-"}
                        {formatPrice(Math.abs(r.pnl))}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          aria-label={`Remove ${r.symbol} holding`}
                          onClick={() => remove.mutate(r.id)}
                          className="text-muted-foreground hover:text-loss"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Recent trades
              </h2>
              <Link to="/trades" className="text-sm text-primary hover:underline">
                View trade history
              </Link>
            </div>
            {recentTrades.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No trades recorded yet. Add buys and sells on the trade history page.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {recentTrades.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <span>
                      <span
                        className={cn(
                          "mr-2 rounded px-1.5 py-0.5 text-xs font-medium uppercase",
                          t.side === "buy" ? "text-gain" : "text-loss",
                        )}
                      >
                        {t.side}
                      </span>
                      {t.symbol}
                    </span>
                    <span className="numeric text-muted-foreground">
                      {Number(t.quantity)} @ {formatPrice(Number(t.price))} ·{" "}
                      {new Date(t.traded_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "gain" | "loss" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          "numeric mt-1 text-lg",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </div>
    </div>
  );
}
