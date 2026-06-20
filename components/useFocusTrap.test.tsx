import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { useFocusTrap } from "../hooks/useFocusTrap";

function TestTrap({ active, onClose }: { active: boolean; onClose?: () => void }) {
  const ref = useFocusTrap(active, onClose);
  if (!active) return null;
  return (
    <div ref={ref as any} data-testid="trap">
      <button data-testid="first">First</button>
      <button data-testid="middle">Middle</button>
      <a href="#" data-testid="link">Link</a>
      <button data-testid="last" disabled>
        Last
      </button>
    </div>
  );
}

describe("useFocusTrap", () => {
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
  });

  function render(active: boolean, onClose?: () => void) {
    root.render(<TestTrap active={active} onClose={onClose} />);
  }

  it("does not mount anything when inactive", () => {
    render(false);
    expect(container.querySelector('[data-testid="trap"]')).toBeNull();
  });

  it("mounts trap container when active", () => {
    render(true);
    expect(container.querySelector('[data-testid="trap"]')).not.toBeNull();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(true, onClose);
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
    window.dispatchEvent(event);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cycles focus from last to first on Tab at end", async () => {
    render(true);
    await new Promise((r) => setTimeout(r, 20));
    const first = container.querySelector('[data-testid="first"]') as HTMLButtonElement;
    const middle = container.querySelector('[data-testid="middle"]') as HTMLButtonElement;
    const link = container.querySelector('[data-testid="link"]') as HTMLAnchorElement;

    first.focus();
    middle.focus();
    link.focus();

    const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    window.dispatchEvent(tabEvent);

    // Focus should have wrapped back to first because link was the last focusable
    expect(document.activeElement).toBe(first);
  });

  it("cycles focus from first to last on Shift+Tab at start", async () => {
    render(true);
    await new Promise((r) => setTimeout(r, 20));
    const first = container.querySelector('[data-testid="first"]') as HTMLButtonElement;
    const link = container.querySelector('[data-testid="link"]') as HTMLAnchorElement;

    first.focus();

    const shiftTabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
    });
    window.dispatchEvent(shiftTabEvent);

    // Focus should have wrapped to last focusable (link, since "last" is disabled)
    expect(document.activeElement).toBe(link);
  });

  it("auto-focuses first focusable element on activation", async () => {
    const outside = document.createElement("button");
    outside.textContent = "Outside";
    document.body.appendChild(outside);
    outside.focus();

    render(true);
    await new Promise((r) => setTimeout(r, 20));

    const first = container.querySelector('[data-testid="first"]') as HTMLButtonElement;
    expect(document.activeElement).toBe(first);

    document.body.removeChild(outside);
  });

  it("restores previous focus on deactivation", async () => {
    const outside = document.createElement("button");
    outside.textContent = "Outside";
    document.body.appendChild(outside);
    outside.focus();

    render(true);
    await new Promise((r) => setTimeout(r, 20));

    root.render(<TestTrap active={false} />);
    await new Promise((r) => setTimeout(r, 20));

    expect(document.activeElement).toBe(outside);
    document.body.removeChild(outside);
  });
});
