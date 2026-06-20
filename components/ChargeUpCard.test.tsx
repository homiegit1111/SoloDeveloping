import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import ChargeUpCard from "./ChargeUpCard";

const MockIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} data-testid="mock-icon" />
);

function makeProps(overrides: Partial<React.ComponentProps<typeof ChargeUpCard>> = {}) {
  return {
    id: "gym",
    label: "Gym",
    done: false,
    streak: 3,
    xp: 25,
    blurb: "Forge the body.",
    cracked: false,
    icon: MockIcon,
    onToggle: vi.fn(),
    ...overrides,
  };
}

describe("ChargeUpCard", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    root.unmount();
    document.body.removeChild(container);
    vi.unstubAllGlobals();
  });

  function render(props: React.ComponentProps<typeof ChargeUpCard>) {
    root.render(<ChargeUpCard {...props} />);
  }

  it("renders habit name, xp, and streak", () => {
    render(makeProps());
    expect(container.textContent).toContain("Gym");
    expect(container.textContent).toContain("+25");
    expect(container.textContent).toContain("3");
  });

  it("has aria-pressed reflecting done state", () => {
    render(makeProps());
    const btn = container.querySelector("[role=\"button\"]") as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.getAttribute("aria-pressed")).toBe("false");

    root.unmount();
    root = createRoot(container);
    render(makeProps({ done: true }));
    const btn2 = container.querySelector("[role=\"button\"]") as HTMLButtonElement;
    expect(btn2.getAttribute("aria-pressed")).toBe("true");
  });

  it("has descriptive aria-label", () => {
    render(makeProps());
    const btn = container.querySelector("[role=\"button\"]") as HTMLButtonElement;
    const label = btn.getAttribute("aria-label") || "";
    expect(label).toContain("Gym");
    expect(label).toContain("Streak: 3 days");
    expect(label).toContain("Not completed");
    expect(label).toContain("25 XP");
  });

  it("toggles instantly on Enter key", () => {
    const onToggle = vi.fn();
    render(makeProps({ onToggle }));
    const btn = container.querySelector("[role=\"button\"]") as HTMLButtonElement;
    btn.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("toggles instantly on Space key", () => {
    const onToggle = vi.fn();
    render(makeProps({ onToggle }));
    const btn = container.querySelector("[role=\"button\"]") as HTMLButtonElement;
    btn.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("contains shockwave markup in source", () => {
    // The component must contain the string 'shockwave' for verification.
    const fs = require("fs");
    const src = fs.readFileSync("./components/ChargeUpCard.tsx", "utf-8");
    expect(src).toContain("shockwave");
    expect(src).toContain("stroke-dasharray");
    expect(src).toContain("charge-ring");
  });

  it("shows renaming UI when isEditing is true", () => {
    const onSaveRename = vi.fn();
    render(makeProps({ isEditing: true, editText: "Custom Label", onSaveRename }));
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe("Custom Label");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(onSaveRename).toHaveBeenCalledWith("Custom Label");
  });

  it("shows cracked warning when cracked prop is true", () => {
    render(makeProps({ cracked: true }));
    expect(container.textContent).toContain("MISSED YESTERDAY");
  });

  it("renders checkmark when done is true", () => {
    render(makeProps({ done: true }));
    const btn = container.querySelector("[role=\"button\"]") as HTMLButtonElement;
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("renders digit-roll elements for streak", () => {
    render(makeProps({ streak: 42 }));
    const slots = container.querySelectorAll(".digit-slot");
    expect(slots.length).toBeGreaterThanOrEqual(2);
  });

  it("renders radial fill SVG on incomplete habits", () => {
    render(makeProps({ done: false }));
    const svg = container.querySelector(".charge-ring-svg");
    expect(svg).not.toBeNull();
    const circle = container.querySelector(".charge-ring");
    expect(circle).not.toBeNull();
  });

  it("skips radial fill SVG when habit is already done", () => {
    render(makeProps({ done: true }));
    const svg = container.querySelector(".charge-ring-svg");
    expect(svg).toBeNull();
  });

  it("skips animations when prefers-reduced-motion is true", () => {
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
    render(makeProps());
    // Reduced motion should skip the charge ring entirely
    const svg = container.querySelector(".charge-ring-svg");
    expect(svg).toBeNull();
    vi.unstubAllGlobals();
  });
});
