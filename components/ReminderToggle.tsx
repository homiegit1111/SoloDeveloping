"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { todayStr } from "@/lib/store";
import { TactileButton } from "@/components/TactileMotion";

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

  const doneToday = state.history[todayStr()]?.completed.length || 0;

  // Fire a reminder when conditions are met (once per day, while app is open).
  useEffect(() => {
    if (!enabled || perm !== "granted") return;
    const check = () => {
      const now = new Date();
      if (now.getHours() < hour) return;
      const today = todayStr();
      if (doneToday >= 7) return;
      const flag = `solo-reminded-${today}`;
      if (localStorage.getItem(flag)) return;
      localStorage.setItem(flag, "1");
      try {
        new Notification("The System is waiting, Hunter", {
          body: `${doneToday}/7 quests cleared today. The gate closes at midnight. Move.`,
        });
      } catch {
        /* ignore */
      }
    };
    check();
    const t = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [enabled, perm, hour, doneToday]);

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
          new Notification("Reminders armed", { body: "The System will nudge you each evening. Stay hard." });
        } catch {
          /* ignore */
        }
      }
    } else {
      update({ settings: { ...state.settings, remindersEnabled: false } });
    }
  }

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between">
        <p className="title-font text-sm tracking-[0.16em] text-[#dcecff]">DAILY REMINDER</p>
        <TactileButton
          onClick={toggle}
          disabled={perm === "unsupported"}
          className="term text-[11px] px-3 py-1 border transition-colors disabled:opacity-40"
          style={{
            borderColor: enabled ? "var(--rank)" : "var(--line)",
            color: enabled ? "var(--rank)" : "#8993a6",
            background: enabled ? "color-mix(in srgb, var(--rank) 12%, transparent)" : "transparent",
          }}
        >
          {perm === "unsupported" ? "N/A" : enabled ? "ON" : "OFF"}
        </TactileButton>
      </div>
      {enabled && (
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          <span className="mono text-[12px] text-[#8993a6]">Nudge me at</span>
          <select
            value={hour}
            onChange={(e) => update({ settings: { ...state.settings, reminderHour: Number(e.target.value) } })}
            aria-label="Reminder hour"
            className="term text-[12px] text-[#e7eefc] px-2 py-1 border bg-[rgba(8,10,18,0.7)] focus:outline-none focus:border-[color:var(--rank)]"
            style={{ borderColor: "var(--line)" }}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
          <span className="mono text-[12px] text-[#8993a6]">if quests aren&apos;t done</span>
        </div>
      )}
      <p className="mono text-[12px] text-[#8993a6] mt-2 leading-relaxed">
        Fires while the app is open. For a guaranteed wake-up, also set a phone alarm — discipline doesn&apos;t rely on luck.
      </p>
    </div>
  );
}
