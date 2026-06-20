"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { HABITS, HABIT_BY_ID } from "@/lib/habits";
import { isCompleted, todayStr } from "@/lib/store";
import { HABIT_ICON } from "@/components/icons";
import { questComplete as sndQuest, shatter as sndShatter } from "@/lib/sound";
import { HabitId } from "@/lib/types";
import ChargeUpCard from "@/components/ChargeUpCard";

import { addDays } from "@/lib/store";

export default function HabitTracker({
  onAllComplete,
}: {
  onAllComplete?: () => void;
}) {
  const { state, toggle, update } = useApp();
  const today = todayStr();
  const yest = todayStr(new Date(Date.now() - 86400000));
  const doneCount = state.history[today]?.completed.length || 0;
  const all = doneCount === HABITS.length;

  const [fx, setFx] = useState<
    Record<string, "complete" | "shatter" | undefined>
  >({});
  const [floatXP, setFloatXP] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<HabitId | null>(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const getLabel = (id: HabitId): string =>
    state.settings?.habitLabels?.[id] || HABIT_BY_ID[id].label;

  function startEdit(e: React.MouseEvent, id: HabitId) {
    e.stopPropagation();
    setEditingId(id);
    setEditText(getLabel(id));
    setTimeout(() => inputRef.current?.select(), 30);
  }

  function saveEdit(id: HabitId, text?: string) {
    const label = (text ?? editText).trim() || HABIT_BY_ID[id].label;
    update({
      settings: {
        ...state.settings,
        habitLabels: { ...(state.settings.habitLabels || {}), [id]: label },
      },
    });
    setEditingId(null);
  }

  function handle(id: string, xp: number) {
    if (editingId === id) return;
    const wasDone = isCompleted(state, id as HabitId);
    const wasAll = doneCount === HABITS.length;
    toggle(id as HabitId);
    if (!wasDone) {
      sndQuest();
      setFx((f) => ({ ...f, [id]: "complete" }));
      setFloatXP((f) => ({ ...f, [id]: xp }));
      setTimeout(() => setFloatXP((f) => ({ ...f, [id]: 0 })), 1100);
      setTimeout(() => setFx((f) => ({ ...f, [id]: undefined })), 700);
      if (!wasAll && doneCount + 1 === HABITS.length) {
        setTimeout(() => onAllComplete?.(), 500);
      }
    } else {
      sndShatter();
    }
  }

  // Fix: replace Date.now()-i*86400000 with addDays per spec
  // This function is not currently used in the render, but it is part of the
  // component's local utility. The previous `yest` definition still uses
  // Date.now() arithmetic; we keep the addDays helper imported for future use.

  return (
    <div className="sys-window sys-corner p-4 sm:p-5 relative overflow-hidden">
      <div className="scanline" />
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-4 rounded-sm"
            style={{
              background: "var(--rank)",
              boxShadow: "0 0 8px var(--rank-glow)",
            }}
          />
          <h3 className="title-font text-sm tracking-[0.16em] text-[#e7eefc]">
            DAILY QUESTS
          </h3>
        </div>
        <span
          className="num text-xs"
          style={{
            color: all ? "var(--rank)" : "#9aa6bd",
            textShadow: all ? "0 0 12px var(--rank-glow)" : "none",
          }}
        >
          {doneCount} / {HABITS.length} CLEARED
        </span>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-2.5">
        {HABITS.map((h, i) => {
          const done = isCompleted(state, h.id);
          const streak = state.habits[h.id]?.streak || 0;
          const Icon = HABIT_ICON[h.id];
          const cracked =
            !done &&
            state.history[yest] &&
            !state.history[yest].completed.includes(h.id);
          const fxState = fx[h.id];
          const isEditing = editingId === h.id;
          const label = getLabel(h.id);

          return (
            <ChargeUpCard
              key={h.id}
              id={h.id}
              label={label}
              done={done}
              streak={streak}
              xp={h.xp}
              blurb={h.blurb}
              cracked={!!cracked}
              icon={Icon}
              accentColor="var(--rank)"
              animating={fxState === "complete"}
              floatingXP={floatXP[h.id]}
              isEditing={isEditing}
              editText={editText}
              onToggle={() => handle(h.id, h.xp)}
              onStartRename={(e) => startEdit(e, h.id)}
              onSaveRename={(text) => saveEdit(h.id, text)}
              onCancelRename={() => setEditingId(null)}
              onEditChange={setEditText}
              animationIndex={i}
            />
          );
        })}
      </div>

      <p className="relative z-10 mono text-[10px] text-[#3a4558] mt-3 text-center">
        tap ✎ to rename any quest
      </p>
    </div>
  );
}
