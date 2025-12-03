import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface AdPlacementProps {
  type: "in_article" | "display" | "multiplex" | "sticky_sidebar" | "horizontal_banner";
  className?: string;
  lazy?: boolean;
}

export const AdPlacement = ({ type, className = "", lazy = false }: AdPlacementProps) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!lazy);
  const [adLoaded, setAdLoaded] = useState(false);

  const getMinHeight = () => {
    switch (type) {
      case "in_article": return 280;
      case "display": return 250;
      case "multiplex": return 300;
      case "sticky_sidebar": return 600;
      case "horizontal_banner": return 100;
    }
  };

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!lazy || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "200px", // Load ad 200px before it enters viewport
        threshold: 0,
      }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isVisible]);

  // Load ad when visible
  useEffect(() => {
    if (!isVisible || adLoaded) return;

    try {
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      }
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [isVisible, adLoaded]);

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
  const minHeight = getMinHeight();

  return (
    <div ref={adRef} className={`my-8 ${className}`}>
      {!isVisible && (
        <div className="relative overflow-hidden rounded-lg bg-muted/50" style={{ minHeight }}>
          <Skeleton className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-muted-foreground/50">Ad</span>
          </div>
        </div>
      )}
      {isVisible && (
        <ins
          className="adsbygoogle"
          {...config}
          data-ad-client="ca-pub-9847321075142960"
        />
      )}
    </div>
  );
};

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
