/**
 * Attempts to create a WebGL context on an offscreen canvas.
 * Returns false gracefully if WebGL is unavailable or if running in SSR.
 */
export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/**
 * Checks if the user prefers reduced motion.
 * Safe for SSR — returns false when `window` is undefined.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
