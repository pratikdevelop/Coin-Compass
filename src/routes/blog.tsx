import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PenLine, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageShell } from "@/components/layout/PageShell";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Crypto Insights Blog — CoinScope" },
      {
        name: "description",
        content:
          "Original crypto articles and market commentary published on CoinScope, alongside the live news feed.",
      },
      { property: "og:title", content: "Crypto Insights Blog — CoinScope" },
      {
        property: "og:description",
        content: "Write and read crypto articles with market commentary on CoinScope.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogPage,
});

export type Post = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  published: boolean;
  published_at: string;
};

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "post"
  );
}

function BlogPage() {
  const { userId, ready } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const posts = useQuery({
    queryKey: ["blog_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, author_id, title, slug, excerpt, content, published, published_at")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sign in to publish articles");
      const { error } = await supabase.from("blog_posts").insert({
        author_id: userId,
        title: title.trim(),
        slug: `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`,
        excerpt: excerpt.trim() || null,
        content: content.trim(),
        published_at: new Date(date).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Article published");
      setTitle("");
      setExcerpt("");
      setContent("");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["blog_posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["blog_posts"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Crypto insights</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Long-form articles and market commentary, written in-house.{" "}
            <Link to="/news" className="text-primary hover:underline">
              See the live news feed →
            </Link>
          </p>
        </div>
        {ready && userId ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <PenLine className="size-4" /> {open ? "Close editor" : "Write article"}
          </button>
        ) : null}
      </div>

      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !content.trim()) {
              toast.error("A title and article body are required");
              return;
            }
            create.mutate();
          }}
          className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-5"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
          />
          <input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short summary (optional)"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="Write your article…"
            className="rounded-md border border-border bg-surface p-3 text-sm outline-none focus:border-primary/60"
          />
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
            />
            <button
              type="submit"
              disabled={create.isPending}
              className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {create.isPending ? "Publishing…" : "Publish"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-8 grid gap-4">
        {posts.isLoading ? (
          <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
        ) : (posts.data ?? []).length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No articles yet.
          </p>
        ) : (
          (posts.data ?? []).map((p) => (
            <article key={p.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: p.slug }}
                    className="text-lg font-semibold hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(p.published_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                {userId === p.author_id ? (
                  <button
                    type="button"
                    aria-label={`Delete ${p.title}`}
                    onClick={() => remove.mutate(p.id)}
                    className="text-muted-foreground hover:text-loss"
                  >
                    <Trash2 className="size-4" />
                  </button>
                ) : null}
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {p.excerpt || p.content}
              </p>
            </article>
          ))
        )}
      </div>

      <AdsterraNativeBanner slot="blog-list" />
    </PageShell>
  );
}
