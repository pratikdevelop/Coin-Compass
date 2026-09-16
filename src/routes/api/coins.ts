import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/coins")({
  server: {
    handlers: {
      GET: async () => {
        const { getCoins } = await import("@/lib/market.server");
        try {
          const payload = await getCoins();
          return Response.json(payload, {
            headers: { "cache-control": "public, max-age=15" },
          });
        } catch {
          return Response.json(
            { error: "Market data is unavailable right now." },
            { status: 503 },
          );
        }
      },
    },
  },
});
