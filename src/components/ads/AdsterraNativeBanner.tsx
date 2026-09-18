import { useEffect, useRef, useState } from "react";
import { AdContainer, AdPlaceholder } from "./AdContainer";
import { trackAdEvent } from "@/lib/ad-analytics";

const KEY = "8d0da1cba6cd6afd22b572b5aacfca65";
const SRC = `https://beavercolourfuldelinquent.com/${KEY}/invoke.js`;

/**
 * Reusable Adsterra native banner. The invoke script is loaded once per page
 * and renders into its own container element, isolated from app state.
 */
export function AdsterraNativeBanner({
  className,
  slot = "native",
}: {
  className?: string | undefined;
  slot?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.innerHTML = "";
    const container = document.createElement("div");
    container.id = `container-${KEY}`;
    host.appendChild(container);

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = SRC;
    script.onload = () => {
      setStatus("ready");
      trackAdEvent("native-banner", slot, "loaded");
    };
    script.onerror = () => {
      setStatus("failed");
      trackAdEvent("native-banner", slot, "failed");
    };
    host.appendChild(script);

    return () => {
      host.innerHTML = "";
    };
  }, [slot]);

  if (status === "failed") return null;

  return (
    <AdContainer className={className} unit="native-banner" slot={slot}>
      {status === "loading" ? <AdPlaceholder height={110} /> : null}
      <div ref={hostRef} className="w-full max-w-full overflow-hidden" />
    </AdContainer>
  );
}
