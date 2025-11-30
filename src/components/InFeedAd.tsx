import { useEffect, useRef } from "react";

interface InFeedAdProps {
  className?: string;
}

export const InFeedAd = ({ className = "" }: InFeedAdProps) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div ref={adRef} className={`w-full ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-format="fluid"
        data-ad-layout-key="-6t+ed+2i-1n-4w"
        data-ad-client="ca-pub-9847321075142960"
        data-ad-slot="6521724398"
      />
    </div>
  );
};

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
