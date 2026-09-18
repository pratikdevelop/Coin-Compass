import { useEffect, useRef, useState } from "react";
import { AdContainer, AdPlaceholder } from "./AdContainer";
import { trackAdEvent } from "@/lib/ad-analytics";

const KEY = "b9ba65c48ae24da0a38901875fde6f1e";

/**
 * Fixed 468x60 Adsterra banner rendered inside a sandboxed iframe so the
 * network's global `atOptions` never touches the app's window, and so the
 * fixed size can never break the responsive layout.
 */
const DOC = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style>
</head><body>
<script>atOptions={'key':'${KEY}','format':'iframe','height':60,'width':468,'params':{}};<\/script>
<script src="https://beavercolourfuldelinquent.com/${KEY}/invoke.js"><\/script>
</body></html>`;

export function AdsterraBanner468x60({
  className,
  slot = "banner-468x60",
}: {
  className?: string | undefined;
  slot?: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    frame.srcdoc = DOC;
  }, []);

  return (
    <AdContainer className={className} unit="banner-468x60" slot={slot}>
      {!loaded ? <AdPlaceholder height={60} /> : null}
      {/* Horizontal scrolling stays inside this box, never on the page. */}
      <div className="mx-auto w-full max-w-full overflow-x-auto">
        <iframe
          ref={frameRef}
          title="Advertisement"
          width={468}
          height={60}
          scrolling="no"
          onLoad={() => {
            setLoaded(true);
            trackAdEvent("banner-468x60", slot, "loaded");
          }}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
          className="mx-auto block border-0"
          style={{ width: 468, height: 60, display: loaded ? "block" : "none" }}
        />
      </div>
    </AdContainer>
  );
}
