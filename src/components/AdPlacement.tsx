import { useEffect, useRef, useId } from "react";

interface AdPlacementProps {
  type: "in_article" | "display" | "multiplex" | "sticky_sidebar" | "horizontal_banner";
  className?: string;
}

export const AdPlacement = ({ type, className = "" }: AdPlacementProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const adPushedRef = useRef(false);
  const uniqueId = useId();

  useEffect(() => {
    // Reset on mount to handle strict mode double-render
    adPushedRef.current = false;
    
    const loadAd = () => {
      if (adPushedRef.current) return;
      
      try {
        const container = adContainerRef.current;
        if (!container) return;
        
        const insElement = container.querySelector('ins.adsbygoogle');
        if (!insElement) return;
        
        // Check if this specific ins element already has an ad
        if (insElement.getAttribute('data-ad-status')) return;
        
        const width = container.offsetWidth;
        if (width >= 250) {
          adPushedRef.current = true;
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (err) {
        // Silently handle AdSense errors
      }
    };

    // Delay initial load to ensure DOM is ready
    const timeoutId = setTimeout(loadAd, 100);

    // Use ResizeObserver to wait for valid width
    const observer = new ResizeObserver(() => {
      if (!adPushedRef.current) {
        loadAd();
      }
    });
    
    if (adContainerRef.current) {
      observer.observe(adContainerRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

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
      <div ref={adContainerRef} style={{ minWidth: "250px" }}>
        <ins
          className="adsbygoogle"
          {...config}
          data-ad-client="ca-pub-9847321075142960"
          data-adtest={process.env.NODE_ENV === 'development' ? 'on' : undefined}
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
