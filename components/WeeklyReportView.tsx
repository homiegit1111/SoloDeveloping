"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { WeeklyReport } from "@/lib/types";
import { dayNumber, activeChunks } from "@/lib/store";
import { diagnose } from "@/lib/diagnosis";
import { retrieveAll, domainChunksOf } from "@/lib/retrieval";

export default function WeeklyReportView() {
  const { state, saveReport } = useApp();
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
      const passages = retrieveAll(activeChunks(state), diagnose(state));
      const domainChunks = domainChunksOf(passages);
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, domainChunks }),
      });
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
        saveReport(data.report);
        if (data.aiError) setErr(`AI unavailable — showing the System's grounded report.`);
      } else setErr(data.error || "Failed");
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  const rows: { label: string; key: keyof WeeklyReport; glyph: string }[] = [
    { label: "Physical", key: "physical", glyph: "▲" },
    { label: "Mental", key: "mental", glyph: "◆" },
    { label: "Skills Gained", key: "skills", glyph: "✦" },
    { label: "Legend Chapter", key: "legendChapter", glyph: "❖" },
  ];

  return (
    <div className="space-y-4">
      {/* ===== Header ===== */}
      <div className="sys-window sys-corner p-5 relative overflow-hidden">
        <div className="scanline" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <p className="label">SYSTEM · EVALUATION</p>
            <span className="term text-[11px] px-2 py-0.5 border" style={{ borderColor: "var(--line)", color: "var(--rank)" }}>
              WEEK {week}
            </span>
          </div>
          <h2 className="title-font text-xl text-[#eaf1ff] text-glow mb-1">TRANSFORMATION REPORT</h2>
          <p className="mono text-[13px] text-[#9aa5b8] leading-relaxed mb-4">
            Every 7 days the System judges your evolution and writes what should have changed.
          </p>
          <button onClick={generate} disabled={loading} className="sys-btn w-full py-3 text-sm disabled:opacity-50">
            {loading ? "COMPILING REPORT…" : `GENERATE WEEK ${week} REPORT`}
          </button>
          {err && <p className="mono text-[12px] text-[#ff7b7b] mt-2">{err}</p>}
        </div>
      </div>

      {report && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* stat block */}
          <div className="grid grid-cols-3 gap-2.5">
            <Stat label="COMPLETION" value={`${report.stats.completionRate}%`} />
            <Stat label="XP GAINED" value={`${report.stats.xpGained}`} />
            <Stat label="BEST STREAK" value={`${report.stats.bestStreak}`} />
          </div>

          {/* evaluation sections */}
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.key as string} className="glass p-4 border-l-2 h-full" style={{ borderColor: "color-mix(in srgb, var(--rank) 55%, transparent)" }}>
                <p className="label mb-1.5 flex items-center gap-1.5">
                  <span style={{ color: "var(--rank)" }}>{r.glyph}</span> {r.label.toUpperCase()}
                </p>
                <p className="mono text-[13.5px] text-[#cdd6e6] leading-relaxed">{report[r.key] as string}</p>
              </div>
            ))}
          </div>

          {/* verdict — the System's judgement */}
          <div className="sys-window sys-corner p-4 relative overflow-hidden">
            <div className="scanline" />
            <p className="relative z-10 label mb-1.5" style={{ color: "var(--rank)" }}>⚖ THE VERDICT</p>
            <p className="relative z-10 mono text-[14px] text-[#e7eefc] font-medium leading-relaxed">{report.verdict}</p>
          </div>

          {/* next week directive */}
          <div className="dossier sys-corner p-4 relative overflow-hidden border-l-2" style={{ borderColor: "#b59b6a" }}>
            <p className="label !text-[#b59b6a] mb-1.5">➤ NEXT WEEK · DIRECTIVE</p>
            <p className="mono text-[14px] text-[#ddd6c4] leading-relaxed">{report.nextWeekFocus}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass p-4 text-center">
      <p className="title-font text-2xl rank-text text-glow leading-none">{value}</p>
      <p className="label mt-1.5" style={{ color: "#828c9e" }}>{label}</p>
    </div>
  );
}
