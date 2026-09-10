import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared shell for every third-party ad slot.
 * Keeps advertising visually separated from market data and prevents
 * any ad from overflowing the viewport on small screens.
 */
export function AdContainer({
  children,
  className,
  label = "Advertisement",
}: {
  children: ReactNode;
  className?: string | undefined;
  label?: string;
}) {
  return (
    <aside
      aria-label={label}
      className={cn(
        "my-8 w-full max-w-full overflow-hidden rounded-xl border border-dashed border-border bg-surface/40 p-3",
        className,
      )}
    >
      <div className="mb-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      {children}
    </aside>
  );
}

export function AdPlaceholder({ height = 60 }: { height?: number }) {
  return (
    <div
      style={{ height }}
      className="flex w-full animate-pulse items-center justify-center rounded-md bg-muted/50 text-xs text-muted-foreground"
    >
      Loading advertisement…
    </div>
  );
}
