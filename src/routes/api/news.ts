import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/news")({
  server: {
    handlers: {
      GET: async () => {
        const { getNews } = await import("@/lib/market.server");
        const news = await getNews();
        return Response.json(news, {
          headers: { "cache-control": "public, max-age=120" },
        });
      },
    },
  },
});
