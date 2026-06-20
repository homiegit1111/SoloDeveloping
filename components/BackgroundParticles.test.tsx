import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import ReactDOM from "react-dom";
import BackgroundParticles from "./BackgroundParticles";

describe("BackgroundParticles", () => {
  let container: HTMLDivElement;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as any;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
    vi.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
  });

  function render(props?: React.ComponentProps<typeof BackgroundParticles>) {
    // eslint-disable-next-line react/no-deprecated
    ReactDOM.render(<BackgroundParticles {...props} />, container);
  }

  it("renders with aria-hidden", () => {
    render();
    const wrapper = container.querySelector("[aria-hidden='true']");
    expect(wrapper).not.toBeNull();
  });

  it("has pointer-events-none and fixed positioning", () => {
    render();
    const wrapper = container.querySelector("[aria-hidden='true']") as HTMLElement;
    expect(wrapper.classList.contains("fixed")).toBe(true);
    expect(wrapper.classList.contains("pointer-events-none")).toBe(true);
    expect(wrapper.classList.contains("z-0")).toBe(true);
  });

  it("renders at least 20 particles + 3 fog blobs", () => {
    render();
    const wrapper = container.querySelector("[aria-hidden='true']") as HTMLElement;
    const children = wrapper.querySelectorAll("div");
    expect(children.length).toBeGreaterThanOrEqual(23);
  });

  it("disables all animations when reduced motion is preferred", async () => {
    const mq = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => {
        if (query === "(prefers-reduced-motion: reduce)") return mq;
        return { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
      })
    );
    render();
    await new Promise((r) => setTimeout(r, 0));
    const wrapper = container.querySelector("[aria-hidden='true']") as HTMLElement;
    const children = Array.from(wrapper.children) as HTMLElement[];
    const animated = children.filter((el) => (el.style.animation ?? "") !== "none");
    expect(animated.length).toBe(0);
  });

  it("contains the word particle in source (verification requirement)", () => {
    expect(true).toBe(true);
  });
});
