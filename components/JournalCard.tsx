"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/context";
import { todayStr } from "@/lib/store";

// Evening reflection — the Hunter's night log. One honest line per day. Feeds the
// AI daily verdict (next day) and the weekly report so judgment is personal.
export default function JournalCard() {
  const { state, setJournal } = useApp();
  const today = todayStr();
  const [text, setText] = useState(state.journal?.[today] || "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setText(state.journal?.[today] || "");
  }, [state.journal, today]);

  function commit() {
    setJournal(today, text.trim());
    if (text.trim()) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  // Past entries (most recent first, today excluded, non-empty).
  const past = useMemo(() => {
    const j = state.journal || {};
    return Object.keys(j)
      .filter((d) => d !== today && (j[d] || "").trim())
      .sort((a, b) => (a < b ? 1 : -1))
      .slice(0, 6)
      .map((d) => ({ date: d, text: j[d] }));
  }, [state.journal, today]);

  const logged = Object.values(state.journal || {}).filter((t) => (t || "").trim()).length;

  const fmt = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
  };

  return (
    <div className="sys-window sys-corner p-5 relative overflow-hidden">
      <div className="scanline" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="label">SYSTEM · NIGHT LOG</p>
            <h3 className="title-font text-lg text-[#eaf1ff] text-glow leading-tight">EVENING REFLECTION</h3>
          </div>
          <div className="text-right">
            {saved ? (
              <span className="term text-[11px]" style={{ color: "var(--rank)" }}>✓ SEALED</span>
            ) : (
              <span className="term text-[11px]" style={{ color: "#828c9e" }}>{logged} LOGGED</span>
            )}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Today's entry */}
          <div className="flex flex-col">
            <p className="label mb-2" style={{ color: "var(--rank)" }}>➤ TONIGHT</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={commit}
              rows={4}
              maxLength={240}
              placeholder="One honest line about today — what you conquered, what you dodged. The System does not judge the words, only the truth."
              className="w-full flex-1 mono text-[13.5px] text-[#e7eefc] placeholder:text-[#5c6374] p-3 border bg-[rgba(6,8,15,0.6)] focus:outline-none resize-none leading-relaxed transition-colors"
              style={{ borderColor: "var(--line)", minHeight: 110 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--rank)")}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="mono text-[11px] text-[#717b8d]">The System weighs this tomorrow.</p>
              <span className="term text-[11px]" style={{ color: text.length > 220 ? "var(--rank)" : "#717b8d" }}>
                {text.length}/240
              </span>
            </div>
            <button
              onClick={commit}
              className="sys-btn mt-3 py-2 text-[12px]"
              disabled={!text.trim() || text.trim() === (state.journal?.[today] || "").trim()}
            >
              SEAL TONIGHT&apos;S ENTRY
            </button>
          </div>

          {/* Past entries */}
          <div className="flex flex-col">
            <p className="label mb-2">◈ THE RECORD</p>
            {past.length === 0 ? (
              <div
                className="flex-1 grid place-items-center border border-dashed p-4 text-center"
                style={{ borderColor: "var(--line)" }}
              >
                <p className="mono text-[12px] text-[#6f7888] leading-relaxed">
                  No entries sealed yet. Tonight is the first page of the record.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {past.map((e) => (
                  <div
                    key={e.date}
                    className="border-l-2 pl-3 py-1.5"
                    style={{ borderColor: "color-mix(in srgb, var(--rank) 45%, transparent)" }}
                  >
                    <p className="label !tracking-[0.18em]" style={{ color: "var(--rank)" }}>{fmt(e.date)}</p>
                    <p className="mono text-[12.5px] text-[#bcc6d6] leading-relaxed mt-0.5">{e.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
