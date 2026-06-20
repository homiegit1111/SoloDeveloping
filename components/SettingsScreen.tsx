"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useApp } from "@/lib/context";
import { TactileButton, TactileToggle } from "@/components/TactileMotion";
import { AppState, HabitId } from "@/lib/types";
import { HABIT_BY_ID } from "@/lib/habits";
import { freezesAvailable } from "@/lib/store";
import { supabaseConfigured } from "@/lib/supabase";
import {
  IconCheck,
  IconFlame,
  IconLock,
  IconVault,
  IconCloud,
  IconBell,
  IconShield,
  IconBrain,
  IconTarget,
} from "@/components/icons";
import FreezePanel from "@/components/FreezePanel";
import ReminderToggle from "@/components/ReminderToggle";
import BackupPanel from "@/components/BackupPanel";
import CloudSyncPanel from "@/components/CloudSyncPanel";

type SectionId = "display" | "notifications" | "ai" | "habits" | "system";

const SECTIONS: { id: SectionId; label: string; Icon: (p: any) => JSX.Element }[] = [
  { id: "display", label: "DISPLAY", Icon: IconTarget },
  { id: "notifications", label: "ALERTS", Icon: IconBell },
  { id: "ai", label: "AI PLANNER", Icon: IconBrain },
  { id: "habits", label: "QUEST LABELS", Icon: IconFlame },
  { id: "system", label: "SYSTEM", Icon: IconLock },
];

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <TactileToggle
      value={on}
      onChange={onToggle}
      label={label}
    />
  );
}

function HabitLabelRow({
  id,
  state,
  update,
}: {
  id: HabitId;
  state: AppState;
  update: (patch: Partial<AppState>) => void;
}) {
  const label = state.settings?.habitLabels?.[id] || HABIT_BY_ID[id].label;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(label);

  const save = () => {
    const clean = text.trim() || HABIT_BY_ID[id].label;
    update({
      settings: {
        ...state.settings,
        habitLabels: { ...(state.settings.habitLabels || {}), [id]: clean },
      },
    });
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: "var(--line)" }}>
      <span className="term text-[11px] text-[#8993a6] uppercase">{HABIT_BY_ID[id].label}</span>
      {editing ? (
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          aria-label={`Edit ${HABIT_BY_ID[id].label} quest label`}
          className="term text-[12px] text-[#e7eefc] bg-transparent border-b focus:outline-none focus:border-[color:var(--rank)] text-right w-40"
          style={{ borderColor: "var(--line)" }}
        />
      ) : (
        <button
          onClick={() => {
            setText(label);
            setEditing(true);
          }}
          className="term text-[12px] text-[#e7eefc] hover:text-[color:var(--rank)] transition-colors text-right"
        >
          {label}
        </button>
      )}
    </div>
  );
}

export default function SettingsScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  const containerRef = useFocusTrap(open, onClose);
  const { state, update } = useApp();
  const [section, setSection] = useState<SectionId>("display");

  const soundOn = state.settings?.soundEnabled !== false;
  const prefer3d = !!state.settings?.use3dModel;
  const aiOn = state.settings?.aiEnabled !== false;
  const freezeCount = freezesAvailable(state);
  const cloudLive = supabaseConfigured();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          ref={containerRef as any}
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
          tabIndex={-1}
          className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-4 sm:p-6"
          onClick={onClose}
        >
          <div
            className="absolute inset-0"
            style={{ background: "rgba(2,3,8,0.78)", backdropFilter: "blur(6px)" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 w-full max-w-md mt-16 sm:mt-0 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="label">SYSTEM · SETTINGS</p>
              <TactileButton
                onClick={onClose}
                aria-label="Close"
                className="term text-[13px] w-7 h-7 grid place-items-center border hover:text-[color:var(--rank)] transition-colors"
                style={{ borderColor: "var(--line)" }}
              >
                ✕
              </TactileButton>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {SECTIONS.map(({ id, label, Icon }) => (
                <TactileButton
                  key={id}
                  onClick={() => setSection(id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 border term text-[10px] transition-all whitespace-nowrap ${
                    section === id
                      ? "text-[color:var(--rank)]"
                      : "text-[#8993a6] hover:text-[#b8c4dc]"
                  }`}
                  style={{
                    borderColor: section === id ? "var(--rank)" : "var(--line)",
                    background:
                      section === id
                        ? "linear-gradient(180deg, color-mix(in srgb, var(--rank) 10%, transparent), transparent)"
                        : "transparent",
                  }}
                >
                  <Icon size={12} />
                  {label}
                </TactileButton>
              ))}
            </div>

            {/* Content */}
            <div
              className="overflow-y-auto pr-1 pt-1 pb-2"
              style={{
                borderTop: "1px solid var(--line)",
                maxHeight: "60vh",
              }}
            >
              {section === "display" && (
                <div className="space-y-1">
                  <Toggle
                    on={soundOn}
                    onToggle={() =>
                      update({ settings: { ...state.settings, soundEnabled: !soundOn } })
                    }
                    label="SOUND EFFECTS"
                  />
                  <Toggle
                    on={prefer3d}
                    onToggle={() =>
                      update({ settings: { ...state.settings, use3dModel: !prefer3d } })
                    }
                    label="3D HUNTER MODEL (WEBGL)"
                  />
                  <p className="mono text-[10px] text-[#8993a6] mt-2 leading-relaxed">
                    The 3D model requires WebGL. If your device struggles, the 2D canvas renderer
                    is used automatically as fallback.
                  </p>
                </div>
              )}

              {section === "notifications" && (
                <div className="space-y-1">
                  <ReminderToggle />
                </div>
              )}

              {section === "ai" && (
                <div className="space-y-1">
                  <Toggle
                    on={aiOn}
                    onToggle={() =>
                      update({ settings: { ...state.settings, aiEnabled: !aiOn } })
                    }
                    label="AI PLANNER & REPORTS"
                  />
                  <p className="mono text-[10px] text-[#8993a6] mt-2 leading-relaxed">
                    When off, plans and reports are generated locally from your library without
                    calling the AI API. Faster, zero cost, less creative.
                  </p>
                </div>
              )}

              {section === "habits" && (
                <div className="space-y-1">
                  <p className="mono text-[10px] text-[#8993a6] mb-2">
                    Tap a label to rename your daily quests.
                  </p>
                  {(
                    ["gym", "study", "discipline", "skincare", "food", "build", "maths"] as HabitId[]
                  ).map((id) => (
                    <HabitLabelRow key={id} id={id} state={state} update={update} />
                  ))}
                </div>
              )}

              {section === "system" && (
                <div className="space-y-3">
                  {/* Freeze */}
                  <div className="border p-2.5" style={{ borderColor: "var(--line)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="term text-[11px] text-[#b8c4dc] flex items-center gap-1.5">
                        <IconShield size={13} />
                        STREAK FREEZE
                      </span>
                      <span className="term text-[11px] text-[color:var(--rank)]">
                        {freezeCount} AVAILABLE
                      </span>
                    </div>
                    <FreezePanel defaultOpen={true} />
                  </div>

                  {/* Backup */}
                  <div className="border p-2.5" style={{ borderColor: "var(--line)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <IconVault size={13} />
                      <span className="term text-[11px] text-[#b8c4dc]">BACKUP & RESTORE</span>
                    </div>
                    <BackupPanel />
                  </div>

                  {/* Cloud */}
                  <div className="border p-2.5" style={{ borderColor: "var(--line)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <IconCloud size={13} />
                      <span className="term text-[11px] text-[#b8c4dc]">CLOUD SYNC</span>
                      {cloudLive && (
                        <span className="term text-[9px] text-[color:var(--rank)]">● LIVE</span>
                      )}
                    </div>
                    <CloudSyncPanel />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
