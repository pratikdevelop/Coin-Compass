import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { newsQuery } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "Latest Crypto News Headlines — CoinScope" },
      {
        name: "description",
        content: "Recent cryptocurrency news headlines from major outlets, updated throughout the day.",
      },
      { property: "og:title", content: "Latest Crypto News — CoinScope" },
      { property: "og:description", content: "Recent crypto headlines from major outlets." },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { data, isLoading, isError } = useQuery(newsQuery);

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold sm:text-3xl">Crypto news</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Headlines from across the market. Articles open in a new tab.
      </p>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          ))
        ) : isError || !data?.length ? (
          <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No headlines available right now.
          </p>
        ) : (
          data.map((item) => (
            <a
              key={item.url + item.title}
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
            >
              <div>
                <h2 className="text-base font-medium leading-snug group-hover:text-primary">
                  {item.title}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.source} · {timeAgo(item.date)}
                </p>
              </div>
              <ExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground" />
            </a>
          ))
        )}
      </div>
    </PageShell>
  );
}
