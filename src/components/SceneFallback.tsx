import React, { useEffect } from "react";

/**
 * 2D stand-in for the 3D scene when WebGL is unavailable, data-saver is on, or
 * the scene fails: a perspective grid horizon and a wireframe planet outline.
 * `onShow` lets the hero render the name in HTML instead of chrome.
 */
export function SceneFallback({ onShow }: { onShow?: () => void }) {
  useEffect(() => {
    onShow?.();
  }, [onShow]);

  return (
    <div className="fixed inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute right-[-6rem] top-[8%] h-[clamp(14rem,32vw,26rem)] w-[clamp(14rem,32vw,26rem)] rounded-full border border-silver/15"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent 0 22px, rgba(201,207,216,0.06) 22px 23px), radial-gradient(circle at 35% 30%, #22252a, #141518 70%)",
          boxShadow: "0 0 0 1px rgba(201,207,216,0.05), 0 0 120px -20px rgba(201,210,224,0.18)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[42vh] [perspective:420px]">
        <div
          className="absolute inset-x-[-50%] bottom-0 h-[160%] origin-bottom [transform:rotateX(62deg)]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(174,182,194,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(174,182,194,0.16) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "linear-gradient(to top, black 20%, transparent 85%)",
            WebkitMaskImage: "linear-gradient(to top, black 20%, transparent 85%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
      </div>
    </div>
  );
}
