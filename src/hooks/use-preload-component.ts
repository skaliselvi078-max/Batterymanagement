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
      const timer = requestIdleCallback(() => {
        importFn().catch((err) => console.error("Error preloading component:", err));
      });

      return () => {
        if (typeof cancelIdleCallback !== "undefined") {
          cancelIdleCallback(timer);
        }
      };
    }
  }, [importFn, enabled]);
}
