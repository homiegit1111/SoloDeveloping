"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { NAV_ICON } from "./icons";

export type TabId = "home" | "plan" | "library" | "report";

export interface MagneticGlowNavProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  tabs?: { id: TabId; label: string; sub: string }[];
}

const DEFAULT_TABS: { id: TabId; label: string; sub: string }[] = [
  { id: "home", label: "HQ", sub: "Status" },
  { id: "plan", label: "Plan", sub: "Today" },
  { id: "library", label: "Codex", sub: "Books" },
  { id: "report", label: "Report", sub: "Weekly" },
];

/**
 * MagneticGlowNav — a Hunter-Association HUD bottom navigation bar.
 *
 * A soft glow indicator fluidly slides between tabs via Framer Motion's
 * shared layoutId. Each icon has a subtle parallax lift on activation and
 * a press dip before the spring-up.  Keyboard navigation with arrow keys.
 * Respects prefers-reduced-motion.
 */
export default function MagneticGlowNav({
  activeTab,
  onChange,
  tabs = DEFAULT_TABS,
}: MagneticGlowNavProps) {
  const reduced = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const [pressedTab, setPressedTab] = useState<TabId | null>(null);

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  const activate = useCallback(
    (tab: TabId) => {
      if (tab === activeTab) return;
      setPressedTab(tab);
      window.setTimeout(() => setPressedTab(null), 150);
      onChange(tab);
    },
    [activeTab, onChange]
  );

  // Keyboard navigation: Left / Right arrows cycle tabs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      // Only handle when focus is inside the nav or nothing is focused
      const focused = document.activeElement;
      const insideNav = navRef.current?.contains(focused) ?? false;
      if (focused && focused !== document.body && !insideNav) return;

      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(tabs.length - 1, activeIndex + dir));
      const nextTab = tabs[nextIndex].id;
      activate(nextTab);
      // Move focus to the newly activated tab button
      const btn = navRef.current?.querySelector<HTMLButtonElement>(
        `[data-tab="${nextTab}"]`
      );
      btn?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, tabs, activate]);

  return (
    <nav
      ref={navRef}
      role="navigation"
      aria-label="Main navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
    >
      {/* Ambient top border glow — the track behind all tabs */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--line-strong), transparent)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-[2px] blur-[2px] opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--rank) 20%, var(--rank) 80%, transparent)",
        }}
      />

      <div
        className="flex justify-around items-stretch px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
        style={{ background: "rgba(4,5,11,0.92)" }}
      >
        {tabs.map((t) => {
          const Icon = NAV_ICON[t.id];
          const isActive = activeTab === t.id;
          const isPressed = pressedTab === t.id;

          // Parallax offset: active floats upward; on press it dips first then springs up
          const parallaxY = isPressed ? 2 : isActive ? (reduced ? 0 : -3) : 1;
          const parallaxScale = isActive ? (reduced ? 1 : 1.12) : 1;

          return (
            <button
              key={t.id}
              data-tab={t.id}
              onClick={() => activate(t.id)}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              tabIndex={isActive ? 0 : -1}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rank)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030305] rounded-sm"
              style={{
                color: isActive
                  ? "var(--rank)"
                  : "rgba(150,160,180,0.55)",
              }}
            >
              {/* Active glow indicator — uses shared layoutId for fluid morph */}
              {isActive && (
                <motion.span
                  layoutId="mag-glow-indicator"
                  transition={
                    reduced
                      ? { duration: 0 }
                      : {
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }
                  }
                  className="absolute inset-x-2 top-1 bottom-1 rounded-[6px] pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse 90% 70% at 50% 50%, var(--rank-soft), transparent 70%)",
                    boxShadow: `
                      0 0 18px -4px var(--rank-glow),
                      0 0 6px -1px var(--rank-soft),
                      inset 0 1px 0 rgba(255,255,255,0.04)
                    `,
                    filter: "blur(0.5px)",
                  }}
                  initial={reduced ? false : { scaleX: 0.85, opacity: 0.7 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                />
              )}

              {/* parallax icon wrapper */}
              <motion.span
                className="relative z-10"
                animate={{
                  y: reduced ? 0 : parallaxY,
                  scale: reduced ? 1 : parallaxScale,
                }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: 400,
                        damping: 22,
                        mass: 0.8,
                      }
                }
                style={{
                  filter: isActive
                    ? "drop-shadow(0 0 6px var(--rank-glow))"
                    : "none",
                }}
              >
                <Icon size={20} />
              </motion.span>

              {/* Label fades and lifts on active */}
              <motion.span
                className="title-font text-[10px] tracking-wide relative z-10"
                animate={{
                  opacity: reduced
                    ? isActive
                      ? 1
                      : 0.55
                    : isActive
                      ? 1
                      : 0.55,
                  y: reduced ? 0 : isActive ? -1 : 0,
                }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: 0.25, ease: "easeOut" }
                }
                style={{
                  color: isActive ? "var(--rank)" : undefined,
                }}
              >
                {t.label}
              </motion.span>

              {/* Sub-label peek for active tab */}
              <motion.span
                className="mono text-[9px] tracking-wider absolute bottom-1 left-0 right-0 text-center pointer-events-none"
                initial={false}
                animate={{
                  opacity: isActive ? 0.5 : 0,
                  y: reduced ? 0 : isActive ? 0 : 3,
                }}
                transition={reduced ? { duration: 0 } : { duration: 0.2 }}
                style={{ color: "var(--ink-dim)" }}
              >
                {t.sub}
              </motion.span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
