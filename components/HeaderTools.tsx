"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { freezesAvailable } from "@/lib/store";
import { supabaseConfigured } from "@/lib/supabase";
import { IconShield, IconBell, IconVault, IconCloud } from "@/components/icons";
import SettingsScreen from "@/components/SettingsScreen";

export default function HeaderTools({ compact = false }: { compact?: boolean }) {
  const { state } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const freezeCount = freezesAvailable(state);
  const reminderOn = !!state.settings.remindersEnabled;
  const cloudLive = supabaseConfigured();

  const size = compact ? 34 : 38;
  const icon = compact ? 18 : 20;

  // Live badge counts for the settings gear — Ravi can see at a glance if
  // something needs attention before opening the panel.
  const activeBadges = [freezeCount > 0, reminderOn, cloudLive].filter(Boolean).length;

  return (
    <>
      <button
        onClick={() => setSettingsOpen(true)}
        title="SETTINGS"
        aria-label="Open Settings"
        className="relative grid place-items-center border transition-all duration-150 hover:-translate-y-0.5"
        style={{
          width: size,
          height: size,
          borderColor: "var(--line-strong)",
          background: "linear-gradient(180deg, color-mix(in srgb, var(--rank) 8%, transparent), transparent)",
          color: "color-mix(in srgb, var(--rank) 85%, #ffffff)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 18px -6px var(--rank-glow)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
      >
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        {activeBadges > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-[3px] grid place-items-center term text-[9px] leading-none rounded-full"
            style={{
              background: "var(--rank)",
              color: "#04050b",
              boxShadow: "0 0 8px var(--rank-glow)",
            }}
          >
            {activeBadges}
          </span>
        )}
      </button>
      <SettingsScreen open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
