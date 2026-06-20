"use client";

import { useEffect, useRef, useCallback } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.offsetParent === null) return false;
      const style = window.getComputedStyle(htmlEl);
      return style.display !== "none" && style.visibility !== "hidden";
    }
  );
}

/**
 * useFocusTrap — trap keyboard focus inside a container when active.
 *
 * @param active   Whether the focus trap is active
 * @param onClose  Called when Escape is pressed
 * @param options  { autoFocus?: boolean; returnFocus?: boolean }
 * @returns ref to attach to the container element
 */
export function useFocusTrap<
  T extends HTMLElement = HTMLElement
>(
  active: boolean,
  onClose?: () => void,
  options: { autoFocus?: boolean; returnFocus?: boolean } = {}
): React.RefObject<T | null> {
  const { autoFocus = true, returnFocus = true } = options;
  const containerRef = useRef<T | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== "Tab" || !containerRef.current) return;

      const items = getFocusable(containerRef.current);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!active) return;

    if (returnFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    }

    // Defer focus so the DOM has settled (portal / animation frames)
    const focusTimeout = setTimeout(() => {
      if (!containerRef.current) return;
      if (autoFocus) {
        const items = getFocusable(containerRef.current);
        if (items.length) {
          items[0].focus();
        } else if (
          containerRef.current.tabIndex === -1 ||
          containerRef.current.hasAttribute("tabindex")
        ) {
          containerRef.current.focus();
        } else {
          containerRef.current.tabIndex = -1;
          containerRef.current.focus();
        }
      }
    }, 0);

    // Use capture on window to intercept Tab before it leaves the overlay
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      clearTimeout(focusTimeout);
      window.removeEventListener("keydown", handleKeyDown, true);
      if (returnFocus && previousFocusRef.current) {
        const prev = previousFocusRef.current;
        // Only restore if focus is still inside the trap (or on body)
        if (
          document.activeElement === document.body ||
          containerRef.current?.contains(document.activeElement)
        ) {
          prev.focus();
        }
      }
    };
  }, [active, autoFocus, returnFocus, handleKeyDown]);

  return containerRef;
}

export default useFocusTrap;
