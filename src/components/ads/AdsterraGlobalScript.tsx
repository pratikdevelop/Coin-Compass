import { useEffect } from "react";

/**
 * Loads the account-level Adsterra scripts once, appended to the end of
 * <body> on the client only. Third-party code is untrusted, so it is never
 * given access to app state, props or environment values.
 */
const GLOBAL_SCRIPTS = [
  "https://beavercolourfuldelinquent.com/3b/69/45/3b69459a0936f7cc29a76e5101f7203c.js",
  "https://beavercolourfuldelinquent.com/j35a109aqc?key=3aadd6750f952de54b1792202741c223",
];

let injected = false;

export function AdsterraGlobalScript() {
  useEffect(() => {
    if (injected || typeof document === "undefined") return;
    injected = true;

    for (const src of GLOBAL_SCRIPTS) {
      if (document.querySelector(`script[data-adsterra="${src}"]`)) continue;
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset["adsterra"] = src;
      script.onerror = () => console.warn("Ad script failed to load");
      document.body.appendChild(script);
    }
  }, []);

  return null;
}
