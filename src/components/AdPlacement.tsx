import { useEffect, useRef, useState } from "react";

interface AdPlacementProps {
  type: "in_article" | "display" | "multiplex" | "sticky_sidebar" | "horizontal_banner";
  className?: string;
  refreshInterval?: number;
}

export const AdPlacement = ({ type, className = "", refreshInterval = 60 }: AdPlacementProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const adPushedRef = useRef(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adKey, setAdKey] = useState(0);

  useEffect(() => {
    if (adPushedRef.current) return;

    const loadAd = () => {
      if (adPushedRef.current) return;
      
      try {
        if (window.adsbygoogle && adContainerRef.current) {
          const width = adContainerRef.current.offsetWidth;
          if (width >= 250) {
            adPushedRef.current = true;
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setAdLoaded(true);
          }
        }
      } catch (err) {
        console.error("AdSense error:", err);
      }
    };

    // Try immediately
    loadAd();

    // If not loaded, use ResizeObserver to wait for valid width
    if (!adPushedRef.current && adContainerRef.current) {
      const observer = new ResizeObserver(() => {
        loadAd();
      });
      observer.observe(adContainerRef.current);
      return () => observer.disconnect();
    }
  }, [adKey]);

  // Ad refresh mechanism
  useEffect(() => {
    if (!adLoaded || refreshInterval <= 0) return;

    const refreshAd = () => {
      if (adContainerRef.current) {
        const rect = adContainerRef.current.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isInViewport) {
          adPushedRef.current = false;
          setAdKey(prev => prev + 1);
          setAdLoaded(false);
        }
      }
    };

    const intervalId = setInterval(refreshAd, refreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [adLoaded, refreshInterval]);

  const getAdConfig = () => {
    switch (type) {
      case "in_article":
        return {
          style: { display: "block", textAlign: "center", minHeight: "280px" } as React.CSSProperties,
          "data-ad-layout": "in-article",
          "data-ad-format": "fluid",
          "data-ad-slot": "6521724398",
        };
      case "display":
        return {
          style: { display: "block", minHeight: "250px" } as React.CSSProperties,
          "data-ad-format": "auto",
          "data-ad-slot": "3154909234",
          "data-full-width-responsive": "true",
        };
      case "multiplex":
        return {
          style: { display: "block", minHeight: "300px" } as React.CSSProperties,
          "data-ad-format": "autorelaxed",
          "data-ad-slot": "6159596154",
        };
      case "sticky_sidebar":
        return {
          style: { display: "block", minHeight: "600px" } as React.CSSProperties,
          "data-ad-format": "auto",
          "data-ad-slot": "3154909234",
          "data-full-width-responsive": "false",
        };
      case "horizontal_banner":
        return {
          style: { display: "block", minHeight: "100px", width: "100%", maxWidth: "728px" } as React.CSSProperties,
          "data-ad-format": "auto",
          "data-ad-slot": "3154909234",
          "data-full-width-responsive": "true",
        };
    }
  };

  const config = getAdConfig();

  return (
    <div className={`my-8 ${className}`}>
      <div ref={adContainerRef} key={adKey}>
        <ins
          className="adsbygoogle"
          {...config}
          data-ad-client="ca-pub-9847321075142960"
        />
      </div>
    </div>
  );
};

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
