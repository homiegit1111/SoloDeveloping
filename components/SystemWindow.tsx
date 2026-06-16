"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { sysOpen as sndOpen, shatter as sndShatter } from "@/lib/sound";

// ============================================================
// SYSTEM WINDOW — the manhwa popup frame.
//   • SYSTEM label top-left, corner brackets, scanline
//   • body text types in letter-by-letter
//   • dismiss = crack/shatter animation
// Pure presentational. Caller controls open/close.
// ============================================================

export function useTypewriter(text: string, speed = 16, start = true) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!start) return;
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, start]);
  return out;
}

export default function SystemWindow({
  label = "SYSTEM",
  accent,
  children,
  onDismiss,
  dismissLabel = "ACKNOWLEDGE",
  autoSound = true,
  className = "",
  maxWidth = "max-w-md",
}: {
  label?: string;
  accent?: string; // override --rank locally
  children: React.ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  autoSound?: boolean;
  className?: string;
  maxWidth?: string;
}) {
  const [shattering, setShattering] = useState(false);
  const opened = useRef(false);

  useEffect(() => {
    if (!opened.current && autoSound) {
      opened.current = true;
      sndOpen();
    }
  }, [autoSound]);

  function dismiss() {
    if (shattering) return;
    sndShatter();
    setShattering(true);
    setTimeout(() => onDismiss?.(), 380);
  }

  const style = accent
    ? ({ ["--rank" as any]: accent, ["--rank-glow" as any]: accent } as React.CSSProperties)
    : undefined;

  return (
    <motion.div
      initial={{ scale: 0.82, opacity: 0, y: 18 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={`sys-window sys-corner relative w-full ${maxWidth} ${shattering ? "shatter" : ""} ${className}`}
      style={style}
    >
      <div className="scanline" />
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rotate-45 border" style={{ borderColor: "var(--rank)", boxShadow: "0 0 6px var(--rank-glow)" }} />
          <span className="label !tracking-[0.34em] !text-[color:var(--rank)]" style={{ opacity: 0.9 }}>{label}</span>
        </div>
        <span className="num text-[10px] opacity-40">◇◇◇</span>
      </div>
      <div className="px-4"><div className="sys-bar mt-2 mb-3" /></div>

      <div className="px-5 pb-5 relative z-10">{children}</div>

      {onDismiss && (
        <div className="px-5 pb-5">
          <button onClick={dismiss} className="sys-btn w-full py-2.5 text-sm">
            [ {dismissLabel} ]
          </button>
        </div>
      )}
    </motion.div>
  );
}
