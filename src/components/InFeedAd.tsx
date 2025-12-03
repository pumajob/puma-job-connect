import { useEffect, useRef } from "react";

interface InFeedAdProps {
  className?: string;
}

export const InFeedAd = ({ className = "" }: InFeedAdProps) => {
  const adRef = useRef<HTMLDivElement>(null);
  const adPushedRef = useRef(false);

  useEffect(() => {
    adPushedRef.current = false;
    
    const loadAd = () => {
      if (adPushedRef.current) return;
      
      try {
        const container = adRef.current;
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

    const timeoutId = setTimeout(loadAd, 100);

    const observer = new ResizeObserver(() => {
      if (!adPushedRef.current) {
        loadAd();
      }
    });
    
    if (adRef.current) {
      observer.observe(adRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={adRef} className={`w-full ${className}`} style={{ minWidth: "250px" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-format="fluid"
        data-ad-layout-key="-6t+ed+2i-1n-4w"
        data-ad-client="ca-pub-9847321075142960"
        data-ad-slot="6521724398"
        data-adtest={process.env.NODE_ENV === 'development' ? 'on' : undefined}
      />
    </div>
  );
};

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
