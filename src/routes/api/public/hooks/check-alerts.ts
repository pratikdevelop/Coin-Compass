import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

type AlertRow = {
  id: string;
  user_id: string;
  coin_id: string;
  symbol: string;
  name: string;
  direction: "above" | "below";
  target_price: number;
};

export const Route = createFileRoute("/api/public/hooks/check-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await authenticateCronRequest(request);
        if (unauthorized) return unauthorized;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { getPrices } = await import("@/lib/market.server");

        const { data, error } = await supabaseAdmin
          .from("price_alerts")
          .select("id, user_id, coin_id, symbol, name, direction, target_price")
          .eq("active", true)
          .is("triggered_at", null);

        if (error) {
          console.error("check-alerts: query failed", error.message);
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const alerts = (data ?? []) as AlertRow[];
        if (!alerts.length) return Response.json({ ok: true, checked: 0, triggered: 0 });

        const prices = await getPrices([...new Set(alerts.map((a) => a.coin_id))]);

        const triggered = alerts.filter((a) => {
          const price = prices[a.coin_id];
          if (!price || price <= 0) return false;
          return a.direction === "above"
            ? price >= Number(a.target_price)
            : price <= Number(a.target_price);
        });

        for (const alert of triggered) {
          const { error: updateError } = await supabaseAdmin
            .from("price_alerts")
            .update({ triggered_at: new Date().toISOString(), active: false })
            .eq("id", alert.id);
          if (updateError) console.error("check-alerts: update failed", updateError.message);
        }

        return Response.json({
          ok: true,
          checked: alerts.length,
          triggered: triggered.length,
        });
      },
    },
  },
});
