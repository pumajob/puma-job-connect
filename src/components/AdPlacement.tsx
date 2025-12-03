import { useEffect, useRef } from "react";

interface AdPlacementProps {
  type: "in_article" | "display" | "multiplex" | "sticky_sidebar" | "horizontal_banner";
  className?: string;
}

export const AdPlacement = ({ type, className = "" }: AdPlacementProps) => {
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
    <div ref={adRef} className={`my-8 ${className}`}>
      <ins
        className="adsbygoogle"
        {...config}
        data-ad-client="ca-pub-9847321075142960"
      />
    </div>
  );
};

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}