"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { WeeklyReport } from "@/lib/types";
import { dayNumber } from "@/lib/store";

export default function WeeklyReportView() {
  const { state, saveReport, retrieve } = useApp();
  const day = dayNumber(state);
  const week = Math.ceil(day / 7);
  const reports = Object.values(state.reports).sort((a, b) => b.weekNumber - a.weekNumber);
  const [report, setReport] = useState<WeeklyReport | null>(reports[0] || null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function generate() {
    setLoading(true);
    setErr("");
    try {
      const chunks = retrieve("mindset discipline transformation legend psychology habit", 5);
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, chunks }),
      });
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
        saveReport(data.report);
        if (data.aiError) setErr(`AI unavailable. Showing local report.`);
      } else setErr(data.error || "Failed");
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  const rows: { label: string; key: keyof WeeklyReport; icon: string }[] = [
    { label: "Physical", key: "physical", icon: "" },
    { label: "Mental", key: "mental", icon: "" },
    { label: "Skills Gained", key: "skills", icon: "" },
    { label: "Legend Chapter", key: "legendChapter", icon: "" },
    { label: "Verdict", key: "verdict", icon: "" },
    { label: "Next Week Focus", key: "nextWeekFocus", icon: "" },
  ];

  return (
    <div className="space-y-4">
      <div className="glass-strong system-border rounded-2xl p-5">
        <h2 className="title-font text-lg text-mana-glow text-glow mb-1">WEEKLY TRANSFORMATION REPORT</h2>
        <p className="text-sm text-mana-glow/70 mb-4">
          Week {week}. Every 7 days the System judges your evolution and writes what should have changed.
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-3 rounded-xl title-font tracking-wider bg-arise/20 border border-arise/50 text-arise hover:bg-arise/30 disabled:opacity-50 shadow-arise"
        >
          {loading ? "COMPILING REPORT…" : "GENERATE WEEK " + week + " REPORT"}
        </button>
        {err && <p className="text-xs text-ember/80 mt-2">{err}</p>}
      </div>

      {report && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="COMPLETION" value={`${report.stats.completionRate}%`} />
            <Stat label="XP GAINED" value={`${report.stats.xpGained}`} />
            <Stat label="BEST STREAK" value={`${report.stats.bestStreak}`} />
          </div>
          {rows.map((r) => (
            <div key={r.key as string} className="glass rounded-2xl p-4">
              <p className="title-font text-xs text-mana-glow/70 mb-1">
                {r.icon} {r.label.toUpperCase()}
              </p>
              <p className="text-sm text-mana-glow/85 leading-relaxed">{report[r.key] as string}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <p className="title-font text-lg text-mana-glow text-glow">{value}</p>
      <p className="text-[10px] text-mana-glow/50">{label}</p>
    </div>
  );
}
