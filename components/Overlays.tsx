"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import SystemWindow, { useTypewriter } from "./SystemWindow";
import { punishment as sndPunish } from "@/lib/sound";

// REWARD — "ALL QUESTS CLEARED" manhwa panel with particle explosion.
export function RewardOverlay({
  open,
  title,
  subtitle,
  quote,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  quote?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (open) {
      const t = setTimeout(onClose, 6500);
      return () => clearTimeout(t);
    }
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--rank) 16%, transparent), rgba(2,2,5,0.97))" }}
        >
          {/* particle explosion rays */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 22 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 origin-top"
                style={{ width: 2, height: "62vh", background: "linear-gradient(var(--rank), transparent)", transform: `rotate(${i * (360 / 22)}deg)` }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0, 0.6, 0.1], scaleY: [0, 1, 1] }}
                transition={{ duration: 1.4, delay: i * 0.02 }}
              />
            ))}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.span
                key={`p${i}`}
                className="absolute left-1/2 top-1/2 w-1.5 h-1.5"
                style={{ background: "var(--rank)", boxShadow: "0 0 8px var(--rank-glow)" }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ x: Math.cos((i / 30) * 6.28) * 240, y: Math.sin((i / 30) * 6.28) * 240, opacity: 0 }}
                transition={{ duration: 1.3, ease: "easeOut" }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.7, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0 }}
            className="relative z-10 w-full max-w-md"
          >
            <SystemWindow label="SYSTEM · NOTIFICATION" onDismiss={onClose} dismissLabel="ARISE">
              <p className="title-font tracking-[0.3em] text-xs mb-2 text-glow" style={{ color: "var(--rank)" }}>QUEST LOG CLEARED</p>
              <h2 className="title-font text-3xl text-glow mb-2" style={{ color: "var(--rank)" }}>{title}</h2>
              <p className="mono text-sm text-[#c3cde0] mb-3">{subtitle}</p>
              {quote && <p className="mono text-sm italic text-[#9aa6bd] border-t pt-3" style={{ borderColor: "var(--line)" }}>&ldquo;{quote}&rdquo;</p>}
            </SystemWindow>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// PUNISHMENT — "THE SYSTEM IS DISAPPOINTED". Red bleed, legend voice, 24h timer.
export function PunishmentOverlay({
  open,
  missedCount,
  quote,
  legend,
  onClose,
}: {
  open: boolean;
  missedCount: number;
  quote: string;
  legend: string;
  onClose: () => void;
}) {
  const RED = "#ef4444";
  const typed = useTypewriter(quote, 18, open);
  const [hrs, setHrs] = useState("24:00:00");

  useEffect(() => {
    if (!open) return;
    sndPunish();
  }, [open]);

  // 24h recovery countdown until next local midnight
  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      let s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      s %= 3600;
      const m = String(Math.floor(s / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      setHrs(`${h}:${m}:${sec}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ ["--rank" as any]: RED, ["--rank-glow" as any]: "rgba(239,68,68,0.6)" } as React.CSSProperties}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[rgba(2,1,3,0.92)]" />
          {/* red bleeds from edges inward */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{ boxShadow: "inset 0 0 160px rgba(239,68,68,0.5), inset 0 0 0 2px rgba(239,68,68,0.3)" }}
          />

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative z-10 w-full max-w-md animate-shake"
          >
            <SystemWindow label="SYSTEM · PENALTY ZONE" autoSound={false}>
              <p className="title-font tracking-[0.28em] text-xs mb-2 text-glow-crimson" style={{ color: RED }}>⚠ PENALTY APPLIED ⚠</p>
              <h2 className="title-font text-2xl mb-2 text-glow-crimson" style={{ color: RED }}>THE SYSTEM IS DISAPPOINTED</h2>
              <p className="mono text-sm text-[#c3cde0] mb-3">
                {missedCount} quest{missedCount === 1 ? "" : "s"} left undone. The Hunter weakens until today is cleared.
              </p>
              <p className="mono text-sm italic text-[#e2b3b3] border-t pt-3 min-h-[4em] caret" style={{ borderColor: "rgba(239,68,68,0.25)" }}>
                {typed}
              </p>
              <p className="mono text-[11px] text-[#9aa6bd] mt-1">— {legend}</p>

              <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
                <span className="label !tracking-[0.2em]" style={{ color: RED }}>RECOVERY WINDOW</span>
                <span className="num text-lg" style={{ color: RED, textShadow: "0 0 12px rgba(239,68,68,0.6)" }}>{hrs}</span>
              </div>

              <button onClick={onClose} className="sys-btn sys-btn-danger w-full py-2.5 text-sm mt-4">
                [ I ACCEPT — I RISE TODAY ]
              </button>
            </SystemWindow>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
