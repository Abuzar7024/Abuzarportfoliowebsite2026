import { useEffect } from "react";

/**
 * SiteIcon handles the injection of the custom "A" favicon into the document head.
 * This ensures the production-ready portfolio has a cohesive brand identity
 * from the tab icon down to the footer.
 */
export const SiteIcon = () => {
  useEffect(() => {
    // Creating a clean SVG string and then encoding it
    const svgString = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2322d3ee' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M12 3L4 21h4.5l1.5-4h4l1.5 4h4.5L12 3z'/><path d='M10.5 13h3' opacity='0.4'/></svg>`;
    
    // We use encodeURIComponent for the SVG content after the mime type
    const faviconUrl = `data:image/svg+xml;charset=utf8,${svgString}`;
    
    const setFavicon = () => {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      
      if (!link) {
        link = document.createElement("link");
        link.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      
      link.type = "image/svg+xml";
      link.href = faviconUrl;
    };

    setFavicon();
    
    // Set the document title to a professional name if generic
    if (document.title.includes("Vite") || document.title === "React App" || !document.title) {
      document.title = "Portfolio | Creative Developer";
    }

    // Support for potential dark/light mode switches at the OS level
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => setFavicon();
    matcher.addEventListener('change', handleThemeChange);

    return () => {
      matcher.removeEventListener('change', handleThemeChange);
    };
  }, []);

  return null;
};
