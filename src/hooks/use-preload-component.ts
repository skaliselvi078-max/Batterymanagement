import { useEffect } from "react";

/**
 * Preload a dynamic component to avoid loading delay when it's first used
 * Call this hook early in parent components
 */
export function usePreloadComponent(
  importFn: () => Promise<any>,
  enabled = true
) {
  useEffect(() => {
    if (enabled && typeof window !== "undefined") {
      // Preload on next tick to avoid blocking
      const hasIdle = typeof requestIdleCallback !== "undefined";
      const timer = hasIdle
        ? requestIdleCallback(() => {
            importFn().catch((err) => console.error("Error preloading component:", err));
          })
        : setTimeout(() => {
            importFn().catch((err) => console.error("Error preloading component:", err));
          }, 100);

      return () => {
        if (hasIdle && typeof cancelIdleCallback !== "undefined") {
          cancelIdleCallback(timer as number);
        } else {
          clearTimeout(timer as any);
        }
      };
    }
  }, [importFn, enabled]);
}
