import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { coinsQuery } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { SignInPrompt } from "@/components/layout/SignInPrompt";
import { useTrades } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trades")({
  head: () => ({
    meta: [
      { title: "Crypto Trade History — CoinScope" },
      {
        name: "description",
        content:
          "Record every crypto buy and sell with price and date, and see the totals on your portfolio.",
      },
      { property: "og:title", content: "Crypto Trade History — CoinScope" },
      { property: "og:description", content: "Log your buys and sells with price and date." },
    ],
  }),
  component: TradesPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function TradesPage() {
  const { data: coins } = useQuery(coinsQuery);
  const { trades, add, remove, isLoading } = useTrades();
  const { userId, ready } = useAuth();

  const [coinId, setCoinId] = useState("");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");

  const totals = useMemo(() => {
    let bought = 0;
    let sold = 0;
    trades.forEach((t) => {
      const amount = Number(t.quantity) * Number(t.price);
      if (t.side === "buy") bought += amount;
      else sold += amount;
    });
    return { bought, sold };
  }, [trades]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const coin = coins?.find((c) => c.id === coinId);
    const qty = Number(quantity);
    const unit = Number(price);
    if (!coin) return toast.error("Pick a coin first");
    if (!Number.isFinite(qty) || qty <= 0) return toast.error("Enter a quantity above zero");
    if (!Number.isFinite(unit) || unit <= 0) return toast.error("Enter a valid price");
    add.mutate(
      {
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        side,
        quantity: qty,
        price: unit,
        tradedAt: new Date(date).toISOString(),
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setQuantity("");
          setPrice("");
          setNote("");
          toast.success(`${side === "buy" ? "Buy" : "Sell"} recorded for ${coin.symbol}`);
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  }

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Trade history</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record every buy and sell with its price and date.
          </p>
        </div>
        <Link to="/portfolio" className="text-sm text-primary hover:underline">
          Back to portfolio
        </Link>
      </div>

      {ready && !userId ? (
        <div className="mt-6">
          <SignInPrompt what="your trade history" />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Total bought" value={formatPrice(totals.bought)} />
            <Stat label="Total sold" value={formatPrice(totals.sold)} />
            <Stat label="Trades recorded" value={String(trades.length)} />
          </div>

          <form
            onSubmit={submit}
            className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1.5fr_auto_1fr_1fr_1fr_auto]"
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

            <div className="flex overflow-hidden rounded-md border border-border">
              {(["buy", "sell"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={cn(
                    "h-10 px-4 text-sm font-medium capitalize",
                    side === s ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Quantity"
              inputMode="decimal"
              aria-label="Quantity"
              className="numeric h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price (USD)"
              inputMode="decimal"
              aria-label="Price"
              className="numeric h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Trade date"
              className="numeric h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
            />
            <button
              type="submit"
              className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Record trade
            </button>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              aria-label="Note"
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60 md:col-span-6"
            />
          </form>

          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
            {isLoading ? (
              <div className="h-32 animate-pulse bg-muted" />
            ) : trades.length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">
                No trades yet. Record your first buy above.
              </p>
            ) : (
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Asset</th>
                    <th className="px-3 py-3">Side</th>
                    <th className="px-3 py-3 text-right">Quantity</th>
                    <th className="px-3 py-3 text-right">Price</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3">Note</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id} className="border-b border-border/60 last:border-0">
                      <td className="numeric px-3 py-3">
                        {new Date(t.traded_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3 font-medium">
                        <Link to="/coin/$id" params={{ id: t.coin_id }} className="hover:underline">
                          {t.name}
                        </Link>{" "}
                        <span className="text-xs text-muted-foreground">{t.symbol}</span>
                      </td>
                      <td
                        className={cn(
                          "px-3 py-3 font-medium uppercase",
                          t.side === "buy" ? "text-gain" : "text-loss",
                        )}
                      >
                        {t.side}
                      </td>
                      <td className="numeric px-3 py-3 text-right">{Number(t.quantity)}</td>
                      <td className="numeric px-3 py-3 text-right">
                        {formatPrice(Number(t.price))}
                      </td>
                      <td className="numeric px-3 py-3 text-right">
                        {formatPrice(Number(t.quantity) * Number(t.price))}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{t.note ?? ""}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          aria-label={`Delete ${t.symbol} trade`}
                          onClick={() => remove.mutate(t.id)}
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
        </>
      )}
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="numeric mt-1 text-lg">{value}</div>
    </div>
  );
}
