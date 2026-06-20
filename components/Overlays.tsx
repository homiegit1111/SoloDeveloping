"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import SystemWindow from "./SystemWindow";
export { default as PunishmentOverlay } from "./PunishmentOverlay";

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
  const containerRef = useFocusTrap(open, onClose);

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
          ref={containerRef as any}
          role="dialog"
          aria-modal="true"
          aria-label="Reward overlay"
          tabIndex={-1}
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

