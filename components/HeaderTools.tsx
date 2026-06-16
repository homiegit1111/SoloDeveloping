"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { freezesAvailable } from "@/lib/store";
import { supabaseConfigured } from "@/lib/supabase";
import { IconShield, IconBell, IconVault, IconCloud } from "@/components/icons";
import FreezePanel from "@/components/FreezePanel";
import ReminderToggle from "@/components/ReminderToggle";
import BackupPanel from "@/components/BackupPanel";
import CloudSyncPanel from "@/components/CloudSyncPanel";

type ToolId = "freeze" | "reminder" | "backup" | "cloud";

const TOOLS: { id: ToolId; label: string; Icon: (p: any) => JSX.Element }[] = [
  { id: "freeze", label: "STREAK FREEZE", Icon: IconShield },
  { id: "reminder", label: "DAILY REMINDER", Icon: IconBell },
  { id: "backup", label: "BACKUP & RESTORE", Icon: IconVault },
  { id: "cloud", label: "CLOUD SYNC", Icon: IconCloud },
];

export default function HeaderTools({ compact = false }: { compact?: boolean }) {
  const { state } = useApp();
  const [open, setOpen] = useState<ToolId | null>(null);

  const freezeCount = freezesAvailable(state);
  const reminderOn = !!state.settings.remindersEnabled;
  const cloudLive = supabaseConfigured();

  // Badge: a small dot/number top-right of an icon for live state.
  const badgeFor = (id: ToolId): { show: boolean; text?: string } => {
    if (id === "freeze") return { show: freezeCount > 0, text: String(freezeCount) };
    if (id === "reminder") return { show: reminderOn };
    if (id === "cloud") return { show: cloudLive };
    return { show: false };
  };

  const size = compact ? 34 : 38;
  const icon = compact ? 18 : 20;

  return (
    <>
      <div className="flex items-center gap-1.5">
        {TOOLS.map(({ id, label, Icon }) => {
          const badge = badgeFor(id);
          return (
            <button
              key={id}
              onClick={() => setOpen(id)}
              title={label}
              aria-label={label}
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
              <Icon size={icon} />
              {badge.show && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-[3px] grid place-items-center term text-[9px] leading-none rounded-full"
                  style={{
                    background: "var(--rank)",
                    color: "#04050b",
                    boxShadow: "0 0 8px var(--rank-glow)",
                  }}
                >
                  {badge.text ?? ""}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-4 sm:p-6"
            onClick={() => setOpen(null)}
          >
            <div className="absolute inset-0" style={{ background: "rgba(2,3,8,0.78)", backdropFilter: "blur(6px)" }} />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative z-10 w-full max-w-md mt-16 sm:mt-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="label">SYSTEM · {TOOLS.find((t) => t.id === open)?.label}</p>
                <button
                  onClick={() => setOpen(null)}
                  aria-label="Close"
                  className="term text-[13px] w-7 h-7 grid place-items-center border hover:text-[color:var(--rank)] transition-colors"
                  style={{ borderColor: "var(--line)" }}
                >
                  ✕
                </button>
              </div>
              {open === "freeze" && <FreezePanel />}
              {open === "reminder" && <ReminderToggle />}
              {open === "backup" && <BackupPanel />}
              {open === "cloud" && <CloudSyncPanel />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
