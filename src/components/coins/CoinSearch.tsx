import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { coinsQuery } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export function CoinSearch({ onNavigate }: { onNavigate?: () => void }) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data } = useQuery(coinsQuery);

  const matches = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return [];
    return (data ?? [])
      .filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
      .slice(0, 7);
  }, [term, data]);

  function go(id: string) {
    setTerm("");
    setOpen(false);
    onNavigate?.();
    navigate({ to: "/coin/$id", params: { id } });
  }

  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (!matches.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % matches.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i - 1 + matches.length) % matches.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            const pick = matches[active];
            if (pick) go(pick.id);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Search coins…"
        aria-label="Search coins by name or symbol"
        className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
      />

      {open && matches.length > 0 && (
        <ul className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-md border border-border bg-popover shadow-xl">
          {matches.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  go(c.id);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                  i === active ? "bg-accent text-accent-foreground" : "text-foreground"
                }`}
              >
                <span className="truncate">
                  {c.name} <span className="text-muted-foreground">{c.symbol}</span>
                </span>
                <span className="numeric shrink-0 text-xs text-muted-foreground">
                  {formatPrice(c.price)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
