import { useEffect } from "react";
import { ADSENSE_CLIENT, ADSENSE_LEFT_SLOT, ADSENSE_RIGHT_SLOT } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSenseRailProps {
  side: "left" | "right";
}

export function AdSenseRail({ side }: AdSenseRailProps) {
  const slot = side === "left" ? ADSENSE_LEFT_SLOT : ADSENSE_RIGHT_SLOT;
  const enabled = Boolean(ADSENSE_CLIENT && slot);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch (error) {
      console.warn("AdSense failed to render", error);
    }
  }, [enabled, slot]);

  return (
    <aside
      className="hidden xl:block"
      aria-label={`Anuncio ${side === "left" ? "esquerdo" : "direito"}`}
    >
      <div className="sticky top-6">
        <div className="ad-rail">
          {enabled ? (
            <ins
              className="adsbygoogle"
              style={{ display: "block", width: "160px", minHeight: "600px" }}
              data-ad-client={ADSENSE_CLIENT}
              data-ad-slot={slot}
              data-ad-format="auto"
              data-full-width-responsive="false"
            />
          ) : (
            <div className="ad-rail__placeholder">
              <span>ADS</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
