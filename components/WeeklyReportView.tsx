"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { WeeklyReport } from "@/lib/types";
import { dayNumber, activeChunks } from "@/lib/store";
import { diagnose } from "@/lib/diagnosis";
import { retrieveAll, domainChunksOf } from "@/lib/retrieval";
import {
  IconTarget,
  IconFlame,
  IconPlan,
  IconGym,
  IconBrain,
  IconBuild,
  IconCrown,
  IconGavel,
  IconArrowMark,
} from "@/components/icons";

type IconT = (p: any) => JSX.Element;

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

  const rows: { label: string; key: keyof WeeklyReport; Icon: IconT }[] = [
    { label: "Physical", key: "physical", Icon: IconGym },
    { label: "Mental", key: "mental", Icon: IconBrain },
    { label: "Skills Gained", key: "skills", Icon: IconBuild },
    { label: "Legend Chapter", key: "legendChapter", Icon: IconCrown },
  ];

  return (
    <div className="space-y-4">
      {/* ===== Header + stats, side by side on desktop ===== */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 sys-window sys-corner p-5 relative overflow-hidden">
          <div className="scanline" />
          <div className="relative z-10 flex flex-col h-full">
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
            <button onClick={generate} disabled={loading} className="sys-btn w-full py-3 text-sm disabled:opacity-50 mt-auto">
              {loading ? "COMPILING REPORT…" : `GENERATE WEEK ${week} REPORT`}
            </button>
            {err && <p className="mono text-[12px] text-[#ff7b7b] mt-2">{err}</p>}
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-3 gap-2.5">
          <Stat Icon={IconTarget} label="COMPLETION" value={report ? `${report.stats.completionRate}%` : "—"} />
          <Stat Icon={IconPlan} label="XP GAINED" value={report ? `${report.stats.xpGained}` : "—"} />
          <Stat Icon={IconFlame} label="BEST STREAK" value={report ? `${report.stats.bestStreak}` : "—"} />
        </div>
      </div>

      {report && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* evaluation sections — full-width 4-up on desktop */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map(({ label, key, Icon }) => (
              <div key={key as string} className="glass p-4 border-t-2 h-full" style={{ borderColor: "color-mix(in srgb, var(--rank) 55%, transparent)" }}>
                <p className="label mb-2 flex items-center gap-1.5">
                  <Icon size={14} style={{ color: "var(--rank)" }} /> {label.toUpperCase()}
                </p>
                <p className="mono text-[13px] text-[#cdd6e6] leading-relaxed">{report[key] as string}</p>
              </div>
            ))}
          </div>

          {/* verdict + directive side by side */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="sys-window sys-corner p-4 relative overflow-hidden">
              <div className="scanline" />
              <p className="relative z-10 label mb-1.5 flex items-center gap-1.5" style={{ color: "var(--rank)" }}>
                <IconGavel size={14} /> THE VERDICT
              </p>
              <p className="relative z-10 mono text-[14px] text-[#e7eefc] font-medium leading-relaxed">{report.verdict}</p>
            </div>
            <div className="dossier sys-corner p-4 relative overflow-hidden border-l-2" style={{ borderColor: "#b59b6a" }}>
              <p className="label !text-[#b59b6a] mb-1.5 flex items-center gap-1.5">
                <IconArrowMark size={14} /> NEXT WEEK · DIRECTIVE
              </p>
              <p className="mono text-[14px] text-[#ddd6c4] leading-relaxed">{report.nextWeekFocus}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Stat({ Icon, label, value }: { Icon: IconT; label: string; value: string }) {
  return (
    <div className="glass p-3 flex flex-col items-center justify-center text-center gap-1">
      <Icon size={18} style={{ color: "var(--rank)" }} />
      <p className="title-font text-2xl rank-text text-glow leading-none">{value}</p>
      <p className="label" style={{ color: "#828c9e" }}>{label}</p>
    </div>
  );
}
