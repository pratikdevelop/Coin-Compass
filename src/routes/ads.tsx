import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageShell } from "@/components/layout/PageShell";
import { SignInPrompt } from "@/components/layout/SignInPrompt";

export const Route = createFileRoute("/ads")({
  head: () => ({
    meta: [
      { title: "Ad Performance Dashboard — CoinScope" },
      {
        name: "description",
        content:
          "See how many advertisements loaded, failed and were clicked on each page of CoinScope.",
      },
      { property: "og:title", content: "Ad Performance Dashboard — CoinScope" },
      {
        property: "og:description",
        content: "Impressions, loads, failures and clicks for every ad slot, page by page.",
      },
    ],
  }),
  component: AdsDashboard,
});

type Row = { page: string; unit: string; slot: string; event: string; created_at: string };

function AdsDashboard() {
  const { userId, ready } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["ad_events", userId],
    enabled: ready && !!userId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_events")
        .select("page, unit, slot, event, created_at")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const rows = useMemo(() => {
    const map = new Map<
      string,
      { page: string; unit: string; impression: number; loaded: number; failed: number; clicked: number }
    >();
    for (const e of data ?? []) {
      const key = `${e.page}|${e.unit}`;
      const entry =
        map.get(key) ?? { page: e.page, unit: e.unit, impression: 0, loaded: 0, failed: 0, clicked: 0 };
      if (e.event in entry) (entry as Record<string, number | string>)[e.event] = (entry[e.event as "loaded"] ?? 0) + 1;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.impression - a.impression);
  }, [data]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (t, r) => ({
          impression: t.impression + r.impression,
          loaded: t.loaded + r.loaded,
          failed: t.failed + r.failed,
          clicked: t.clicked + r.clicked,
        }),
        { impression: 0, loaded: 0, failed: 0, clicked: 0 },
      ),
    [rows],
  );

  const ctr = totals.impression ? (totals.clicked / totals.impression) * 100 : 0;

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold">Ad performance</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Impressions, successful loads, failures and clicks recorded for each advertising slot,
        broken down by page. Updates every 30 seconds.
      </p>

      {!ready ? null : !userId ? (
        <div className="mt-8">
          <SignInPrompt what="ad performance" />
        </div>
      ) : isLoading ? (
        <div className="mt-8 h-64 animate-pulse rounded-xl border border-border bg-card" />
      ) : (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Card label="Impressions" value={totals.impression} />
            <Card label="Loaded" value={totals.loaded} />
            <Card label="Failed" value={totals.failed} />
            <Card label="Clicks" value={totals.clicked} />
            <Card label="Click rate" value={`${ctr.toFixed(2)}%`} />
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Page</th>
                  <th className="px-3 py-3">Ad unit</th>
                  <th className="px-3 py-3 text-right">Impressions</th>
                  <th className="px-3 py-3 text-right">Loaded</th>
                  <th className="px-3 py-3 text-right">Failed</th>
                  <th className="px-3 py-3 text-right">Clicks</th>
                  <th className="px-3 py-3 text-right">CTR</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                      No ad activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={`${r.page}-${r.unit}`} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-3">{r.page}</td>
                      <td className="px-3 py-3 text-muted-foreground">{r.unit}</td>
                      <td className="numeric px-3 py-3 text-right">{r.impression}</td>
                      <td className="numeric px-3 py-3 text-right">{r.loaded}</td>
                      <td className="numeric px-3 py-3 text-right text-loss">{r.failed}</td>
                      <td className="numeric px-3 py-3 text-right text-gain">{r.clicked}</td>
                      <td className="numeric px-3 py-3 text-right">
                        {r.impression ? ((r.clicked / r.impression) * 100).toFixed(2) : "0.00"}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageShell>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="numeric mt-1 text-2xl">{value}</div>
    </div>
  );
}
