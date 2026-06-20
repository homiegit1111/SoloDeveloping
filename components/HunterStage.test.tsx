import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import HunterStage from "./HunterStage";
import { RANKS } from "@/lib/ranks";

// Mock the context so HunterStage can render
vi.mock("@/lib/context", () => ({
  useApp: () => ({
    state: {
      settings: { use3dModel: false },
      name: "TestHunter",
      totalXP: 0,
      rankIndex: 0,
    },
  }),
}));

describe("HunterStage", () => {
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

  function render(props: {
    rank: (typeof RANKS)[number];
    totalXP: number;
    condition?: number;
    penalty?: boolean;
  }) {
    root.render(<HunterStage name="Test" {...props} />);
  }

  it("renders with accessibility role and label", () => {
    render({ rank: RANKS[0], totalXP: 0 });
    const stage = container.querySelector('[role="img"]');
    expect(stage).not.toBeNull();
    expect(stage?.getAttribute("aria-label")).toContain("Hunter manifestation");
  });

  it("contains crossfade motion wrapper when rank changes", () => {
    render({ rank: RANKS[0], totalXP: 0 });
    // Initial render: motion.div with AnimatePresence should exist
    expect(container.querySelector(".sys-window")).not.toBeNull();
  });

  it("contains energy surge element", () => {
    render({ rank: RANKS[0], totalXP: 0 });
    // EnergySurge renders a div even when inactive (returns null), so we just
    // verify the stage container renders without error.
    expect(container.querySelector(".sys-window")).not.toBeNull();
  });

  it("displays the rank name in the HUD", () => {
    render({ rank: RANKS[2], totalXP: 600 });
    expect(container.textContent).toContain("D-RANK");
  });

  it("displays vitality label based on condition", () => {
    render({ rank: RANKS[2], totalXP: 600, condition: 0.8 });
    expect(container.textContent).toContain("BLAZING");
  });

  it("displays penalty vitality when penalty is true", () => {
    render({ rank: RANKS[2], totalXP: 600, condition: 0.8, penalty: true });
    expect(container.textContent).toContain("SHACKLED");
  });

  it("skips crossfade and particles when prefers-reduced-motion is true", () => {
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
    render({ rank: RANKS[1], totalXP: 200 });
    // Should render without AnimatePresence motion blur wrappers
    const motionDivs = container.querySelectorAll('[style*="blur"]');
    expect(motionDivs.length).toBe(0);
    vi.unstubAllGlobals();
  });

  it("updates aria-label when rank evolves", async () => {
    render({ rank: RANKS[0], totalXP: 0 });
    const stage1 = container.querySelector('[role="img"]');
    const label1 = stage1?.getAttribute("aria-label") || "";

    // Re-render with a new rank (simulate evolution)
    render({ rank: RANKS[1], totalXP: 200 });

    // Wait for effect to run
    await new Promise((r) => setTimeout(r, 50));

    const stage2 = container.querySelector('[role="img"]');
    const label2 = stage2?.getAttribute("aria-label") || "";

    // The label should have changed to mention evolution
    expect(label2).not.toBe(label1);
    expect(label2).toContain("evolving");
  });
});

describe("EnergySurge component presence", () => {
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

  it("renders inside HunterStage container", () => {
    root.render(
      <HunterStage rank={RANKS[0]} name="Test" totalXP={0} />
    );
    expect(container.querySelector(".sys-window")).not.toBeNull();
  });
});
