import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { trackAdEvent } from "@/lib/ad-analytics";

/**
 * Shared shell for every third-party ad slot.
 * Keeps advertising visually separated from market data, prevents any ad
 * from overflowing the viewport, and records impressions/clicks.
 */
export function AdContainer({
  children,
  className,
  label = "Advertisement",
  unit = "unknown",
  slot = "default",
}: {
  children: ReactNode;
  className?: string | undefined;
  label?: string;
  unit?: string;
  slot?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const hovering = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            trackAdEvent(unit, slot, "impression");
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    const onDown = () => trackAdEvent(unit, slot, "clicked", { once: false });
    const onEnter = () => (hovering.current = true);
    const onLeave = () => (hovering.current = false);
    // An ad iframe steals focus on click, so a window blur while the pointer
    // sits over this slot is a reliable click signal for cross-origin units.
    const onBlur = () => {
      if (hovering.current && document.activeElement?.tagName === "IFRAME") {
        trackAdEvent(unit, slot, "clicked", { once: false });
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onBlur);

    return () => {
      io.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onBlur);
    };
  }, [unit, slot]);

  return (
    <aside
      ref={ref}
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
