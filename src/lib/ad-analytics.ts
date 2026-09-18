import { supabase } from "@/integrations/supabase/client";

export type AdEventType = "impression" | "loaded" | "failed" | "clicked";

const sent = new Set<string>();

/**
 * Fire-and-forget ad telemetry. Completely isolated from crypto data:
 * failures here are swallowed and never surface to the user.
 */
export function trackAdEvent(
  unit: string,
  slot: string,
  event: AdEventType,
  options: { once?: boolean } = {},
) {
  if (typeof window === "undefined") return;
  const page = window.location.pathname;
  const key = `${page}|${unit}|${slot}|${event}`;
  if (options.once !== false && event !== "clicked") {
    if (sent.has(key)) return;
    sent.add(key);
  }
  void (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      await supabase.from("ad_events").insert({
        user_id: data.session?.user.id ?? null,
        page,
        unit,
        slot,
        event,
      });
    } catch {
      /* telemetry must never break the app */
    }
  })();
}
