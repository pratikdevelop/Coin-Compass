import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/coins")({
  server: {
    handlers: {
      GET: async () => {
        const { getCoins } = await import("@/lib/market.server");
        const coins = await getCoins();
        return Response.json(coins, {
          headers: { "cache-control": "public, max-age=30" },
        });
      },
    },
  },
});
