import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, LineChart, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { CoinSearch } from "@/components/coins/CoinSearch";

const links = [
  { to: "/", label: "Markets" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/trades", label: "Trades" },
  { to: "/news", label: "News" },
] as const;

export function NavBar() {
  const [open, setOpen] = useState(false);
  const { userId, ready, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <LineChart className="size-4" />
          </span>
          <span className="hidden sm:inline">CoinScope</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <CoinSearch />
          </div>
          {ready ? (
            userId ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="hidden h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground sm:inline-flex"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                className="hidden h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 sm:inline-flex"
              >
                <LogIn className="size-4" /> Sign in
              </Link>
            )
          ) : null}
          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-md border border-border text-foreground md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <div className={cn("border-t border-border px-4 py-3 md:hidden", open ? "block" : "hidden")}>
        <div className="mb-3 sm:hidden">
          <CoinSearch onNavigate={() => setOpen(false)} />
        </div>
        <nav className="grid gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
          {ready ? (
            userId ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-primary hover:bg-accent"
              >
                Sign in
              </Link>
            )
          ) : null}
        </nav>
      </div>
    </header>
  );
}
