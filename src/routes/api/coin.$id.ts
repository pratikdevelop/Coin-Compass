import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const rangeSchema = z.enum(["1D", "7D", "1M", "1Y"]).catch("7D");
const idSchema = z.string().min(1).max(64).regex(/^[a-z0-9-]+$/i);

export const Route = createFileRoute("/api/coin/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const parsed = idSchema.safeParse(params.id);
        if (!parsed.success) return new Response("Invalid id", { status: 400 });
        const range = rangeSchema.parse(new URL(request.url).searchParams.get("range"));
        const { getCoin } = await import("@/lib/market.server");
        const coin = await getCoin(parsed.data, range);
        if (!coin) return new Response("Not found", { status: 404 });
        return Response.json(coin, { headers: { "cache-control": "public, max-age=30" } });
      },
    },
  },
});
