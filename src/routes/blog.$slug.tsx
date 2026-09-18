import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/PageShell";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import type { Post } from "./blog";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    const title = `${name} — CoinScope Crypto Insights`;
    const description = `Read "${name}", a crypto market article published on CoinScope.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["blog_post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, author_id, title, slug, excerpt, content, published, published_at")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Post | null;
    },
  });

  return (
    <PageShell>
      <Link
        to="/blog"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All articles
      </Link>

      {isLoading ? (
        <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
      ) : !data ? (
        <p className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          This article is not available.
        </p>
      ) : (
        <article className="rounded-xl border border-border bg-card p-6">
          <h1 className="text-3xl font-semibold">{data.title}</h1>
          <div className="mt-2 text-xs text-muted-foreground">
            {new Date(data.published_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {data.content}
          </div>
        </article>
      )}

      <AdsterraNativeBanner slot="blog-article" />
    </PageShell>
  );
}
