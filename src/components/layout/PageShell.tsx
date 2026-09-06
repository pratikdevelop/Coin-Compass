import type { ReactNode } from "react";
import { NavBar } from "./NavBar";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6">{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Market data from CoinGecko. For information only — not financial advice.
      </footer>
    </div>
  );
}
