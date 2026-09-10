import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { coinsQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useAlerts } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

/**
 * Watches live prices while the app is open and marks any price alert whose
 * threshold has been crossed as triggered in the database.
 */
export function AlertWatcher() {
  const { userId } = useAuth();
  const { alerts } = useAlerts();
  const { data: coins } = useQuery({ ...coinsQuery, enabled: !!userId });
  const qc = useQueryClient();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (!userId || !coins?.length) return;
    const pending = alerts.filter((a) => a.active && !a.triggered_at && !handled.current.has(a.id));
    if (!pending.length) return;

    const crossed = pending.filter((a) => {
      const price = coins.find((c) => c.id === a.coin_id)?.price ?? 0;
      if (price <= 0) return false;
      return a.direction === "above"
        ? price >= Number(a.target_price)
        : price <= Number(a.target_price);
    });
    if (!crossed.length) return;

    crossed.forEach((a) => handled.current.add(a.id));

    void (async () => {
      const { error } = await supabase
        .from("price_alerts")
        .update({ triggered_at: new Date().toISOString(), active: false })
        .in(
          "id",
          crossed.map((a) => a.id),
        );
      if (error) return;
      crossed.forEach((a) =>
        toast.success(
          `${a.symbol} is ${a.direction} ${formatPrice(Number(a.target_price))}`,
          { description: "Your price alert was triggered." },
        ),
      );
      void qc.invalidateQueries({ queryKey: ["price_alerts", userId] });
    })();
  }, [alerts, coins, userId, qc]);

  return null;
}
