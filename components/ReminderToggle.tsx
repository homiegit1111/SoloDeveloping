"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { todayStr } from "@/lib/store";

// Daily reminder via the browser Notification API. Honest scope: a notification
// fires when the app is open past your chosen hour and today's quests aren't done.
// For a guaranteed nudge we tell the user to also set a phone alarm.
export default function ReminderToggle() {
  const { state, update } = useApp();
  const enabled = !!state.settings.remindersEnabled;
  const hour = state.settings.reminderHour ?? 20;
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);

  // Fire a reminder when conditions are met (once per day, while app is open).
  useEffect(() => {
    if (!enabled || perm !== "granted") return;
    const check = () => {
      const now = new Date();
      if (now.getHours() < hour) return;
      const today = todayStr();
      const doneToday = state.history[today]?.completed.length || 0;
      if (doneToday >= 7) return;
      const flag = `solo-reminded-${today}`;
      if (localStorage.getItem(flag)) return;
      localStorage.setItem(flag, "1");
      try {
        new Notification("⚔️ The System is waiting, Hunter", {
          body: `${doneToday}/7 quests cleared today. The gate closes at midnight. Move.`,
        });
      } catch {
        /* ignore */
      }
    };
    check();
    const t = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [enabled, perm, hour, state.history]);

  async function toggle() {
    if (perm === "unsupported") return;
    if (!enabled) {
      let p = perm;
      if (p !== "granted") {
        p = await Notification.requestPermission();
        setPerm(p);
      }
      if (p === "granted") {
        update({ settings: { ...state.settings, remindersEnabled: true } });
        try {
          new Notification("🔔 Reminders armed", { body: "The System will nudge you each evening. Stay hard." });
        } catch {
          /* ignore */
        }
      }
    } else {
      update({ settings: { ...state.settings, remindersEnabled: false } });
    }
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="title-font text-sm text-mana-glow/80">🔔 DAILY REMINDER</p>
        <button
          onClick={toggle}
          disabled={perm === "unsupported"}
          className={`text-[11px] title-font px-3 py-1 rounded-full border ${
            enabled ? "border-arise/50 text-arise" : "border-mana/30 text-mana-glow/60"
          } disabled:opacity-40`}
        >
          {perm === "unsupported" ? "UNSUPPORTED" : enabled ? "ON" : "OFF"}
        </button>
      </div>
      {enabled && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-mana-glow/55">Nudge me at</span>
          <select
            value={hour}
            onChange={(e) => update({ settings: { ...state.settings, reminderHour: Number(e.target.value) } })}
            className="bg-black/30 border border-mana/20 rounded-md text-xs text-mana-glow px-2 py-1 focus:outline-none"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
          <span className="text-[11px] text-mana-glow/40">if quests aren&apos;t done</span>
        </div>
      )}
      <p className="text-[10px] text-mana-glow/40 mt-2 leading-relaxed">
        Fires while the app is open. For a guaranteed daily wake-up, also set a phone alarm — discipline doesn&apos;t
        rely on luck.
      </p>
    </div>
  );
}
