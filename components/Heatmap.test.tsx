import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import ReactDOM from "react-dom";
import Heatmap from "./Heatmap";
import { AppState } from "@/lib/types";

// Mock framer-motion so tests render without browser layout APIs
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
  },
  useReducedMotion: () => false,
}));

function makeState(overrides: Partial<AppState> = {}): AppState {
  const history: AppState["history"] = {};
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (i % 3 === 0) {
      history[dateStr] = {
        date: dateStr,
        completed: ["gym", "study"],
        xpEarned: 50,
      };
    }
  }
  return {
    version: 1,
    name: "Test Hunter",
    startDate: "2024-01-01",
    totalXP: 1000,
    rankIndex: 2,
    history,
    habits: {} as AppState["habits"],
    stats: {} as AppState["stats"],
    unlocks: [],
    lastPlanDate: todayStr,
    plans: {},
    reports: {},
    books: [],
    bookChunks: {},
    journal: {},
    freezeDays: [],
    planCompletions: {},
    settings: { aiEnabled: false, soundEnabled: false },
    ...overrides,
  };
}

describe("Heatmap", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  function render(props: React.ComponentProps<typeof Heatmap>) {
    ReactDOM.render(<Heatmap {...props} />, container);
  }

  it("renders the heatmap container with role and aria-label", () => {
    render({ state: makeState() });
    const grid = container.querySelector("[role='img']") as HTMLElement;
    expect(grid).not.toBeNull();
    expect(grid.getAttribute("aria-label")).toBe("Activity heatmap showing last 90 days");
  });

  it("renders cells with aria-label containing date and count", () => {
    render({ state: makeState() });
    const cells = container.querySelectorAll("[aria-label*='quest']");
    expect(cells.length).toBeGreaterThan(0);
    const first = cells[0] as HTMLElement;
    const label = first.getAttribute("aria-label") || "";
    expect(label).toContain("quest");
  });

  it("renders the correct number of visible data cells for 90 days", () => {
    render({ state: makeState(), days: 90 });
    const cells = container.querySelectorAll("[aria-label*='quest']");
    expect(cells.length).toBe(90);
  });

  it("contains the word 'wave' in source for verification", () => {
    const fs = require("fs");
    const src = fs.readFileSync("./components/Heatmap.tsx", "utf-8");
    expect(src.toLowerCase()).toContain("wave");
  });

  it("renders legend with LESS and MORE labels", () => {
    render({ state: makeState() });
    expect(container.textContent).toContain("LESS");
    expect(container.textContent).toContain("MORE");
  });

  it("displays today's border on the most recent cell", () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    render({ state: makeState() });
    const cells = Array.from(container.querySelectorAll("[aria-label*='quest']")) as HTMLElement[];
    const todayCell = cells.find((c) => c.getAttribute("aria-label")?.startsWith(todayStr));
    expect(todayCell).toBeDefined();
    const style = todayCell?.getAttribute("style") || "";
    expect(style).toContain("border");
  });

  it("renders active day count in header", () => {
    render({ state: makeState() });
    expect(container.textContent).toContain("ACTIVE");
  });
});
