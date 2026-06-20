import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import PunishmentOverlay from "./PunishmentOverlay";

describe("PunishmentOverlay", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  function render(props: {
    open: boolean;
    missedCount: number;
    quote: string;
    legend: string;
    onClose: () => void;
  }) {
    root.render(<PunishmentOverlay {...props} />);
  }

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    root.unmount();
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  it("does not render when closed", () => {
    render({ open: false, missedCount: 2, quote: "Test", legend: "L", onClose: vi.fn() });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders dialog with correct aria attributes when open", () => {
    render({ open: true, missedCount: 2, quote: "A penalty has been issued.", legend: "Legend", onClose: vi.fn() });
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-label")).toBe("Penalty zone overlay");
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
  });

  it("displays missed count with correct pluralization", () => {
    render({ open: true, missedCount: 1, quote: "Q", legend: "L", onClose: vi.fn() });
    expect(container.textContent).toContain("1 quest left undone");

    root.unmount();
    root = createRoot(container);
    render({ open: true, missedCount: 3, quote: "Q", legend: "L", onClose: vi.fn() });
    expect(container.textContent).toContain("3 quests left undone");
  });

  it("renders the quote and legend", () => {
    render({ open: true, missedCount: 2, quote: "Do the work.", legend: "Goggins", onClose: vi.fn() });
    expect(container.textContent).toContain("Do the work.");
    expect(container.textContent).toContain("Goggins");
  });

  it("starts typing the quote character by character", () => {
    vi.useFakeTimers();
    render({ open: true, missedCount: 2, quote: "ABC", legend: "L", onClose: vi.fn() });
    // initially only a few characters (or empty if timer hasn't ticked)
    const quoteEl = container.querySelector(".term");
    expect(quoteEl).not.toBeNull();
    vi.advanceTimersByTime(20);
    vi.advanceTimersByTime(20);
    vi.advanceTimersByTime(20);
    // After 3 intervals of 18ms + some buffer, full quote should appear
    vi.advanceTimersByTime(100);
    expect(quoteEl!.textContent).toContain("ABC");
  });

  it("shows full quote immediately when prefers-reduced-motion is true", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((q: string) => ({
        matches: q === "(prefers-reduced-motion: reduce)",
        media: q,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
    render({ open: true, missedCount: 2, quote: "IMMEDIATE", legend: "L", onClose: vi.fn() });
    const quoteEl = container.querySelector(".term");
    expect(quoteEl!.textContent).toContain("IMMEDIATE");
    vi.unstubAllGlobals();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render({ open: true, missedCount: 2, quote: "Q", legend: "L", onClose });
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
    window.dispatchEvent(event);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when accept button is clicked", () => {
    const onClose = vi.fn();
    render({ open: true, missedCount: 2, quote: "Q", legend: "L", onClose });
    const btn = container.querySelector('button[aria-label="Accept penalty and rise today"]') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("focuses the accept button on open (focus trap entry)", async () => {
    render({ open: true, missedCount: 2, quote: "Q", legend: "L", onClose: vi.fn() });
    // Give React a tick to run effects
    await new Promise((r) => setTimeout(r, 10));
    const btn = container.querySelector('button[aria-label="Accept penalty and rise today"]') as HTMLButtonElement;
    expect(document.activeElement).toBe(btn);
  });

  it("renders recovery timer", () => {
    render({ open: true, missedCount: 2, quote: "Q", legend: "L", onClose: vi.fn() });
    expect(container.textContent).toContain("RECOVERY WINDOW");
    expect(container.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it("renders red crack SVG lines", () => {
    render({ open: true, missedCount: 2, quote: "Q", legend: "L", onClose: vi.fn() });
    const paths = container.querySelectorAll("svg path");
    expect(paths.length).toBeGreaterThan(0);
  });
});
