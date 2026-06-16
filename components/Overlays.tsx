"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

// REWARD overlay — fires on milestones (perfect day, rank up).
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
      const t = setTimeout(onClose, 6000);
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
          style={{ background: "radial-gradient(circle, rgba(255,206,84,0.18), rgba(5,6,15,0.96))" }}
        >
          {/* rays */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 18 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 origin-top"
                style={{ width: 2, height: "60vh", background: "linear-gradient(#ffce54, transparent)", transform: `rotate(${i * 20}deg)` }}
                animate={{ opacity: [0.1, 0.5, 0.1] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.6, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="sys-window sys-corner p-7 text-center max-w-sm relative z-10"
            style={{ boxShadow: "0 0 40px rgba(255,206,84,0.5)", borderColor: "rgba(255,206,84,0.6)" }}
          >
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gold/30">
              <span className="grid place-items-center w-9 h-9 rounded-full border-2 border-gold text-gold text-lg" style={{ boxShadow: "0 0 10px rgba(255,206,84,0.6)" }}>!</span>
              <span className="title-font tracking-[0.25em] text-gold text-glow text-lg">NOTIFICATION</span>
            </div>
            <p className="title-font text-gold tracking-[0.3em] text-xs mb-2 text-glow">LEVEL UP</p>
            <h2 className="title-font text-2xl font-black text-gold text-glow mb-1">{title}</h2>
            <p className="text-mana-glow/85 mb-4">{subtitle}</p>
            {quote && <p className="text-sm italic text-gold/90 border-t border-gold/20 pt-3">"{quote}"</p>}
            <p className="text-[10px] text-mana-glow/40 mt-4">tap to dismiss</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// PUNISHMENT overlay — fires when the user missed a day.
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
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: "radial-gradient(circle, rgba(255,77,94,0.15), rgba(2,2,6,0.97))" }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 0.4, repeat: Infinity }}
            style={{ boxShadow: "inset 0 0 120px rgba(255,77,94,0.5)" }}
          />
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="sys-window sys-corner p-7 text-center max-w-sm relative z-10 animate-shake"
            style={{ boxShadow: "0 0 40px rgba(255,77,94,0.45)", borderColor: "rgba(255,77,94,0.6)" }}
          >
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-ember/30">
              <span className="grid place-items-center w-9 h-9 rounded-full border-2 border-ember text-ember text-lg" style={{ boxShadow: "0 0 10px rgba(255,77,94,0.6)" }}>!</span>
              <span className="title-font tracking-[0.25em] text-ember text-glow text-lg">NOTIFICATION</span>
            </div>
            <p className="title-font text-ember tracking-[0.3em] text-xs mb-2 text-glow">⚠ PENALTY ZONE ⚠</p>
            <h2 className="title-font text-2xl font-black text-ember text-glow mb-1">YOU FELL BEHIND</h2>
            <p className="text-mana-glow/85 mb-4">
              {missedCount} quest{missedCount === 1 ? "" : "s"} left undone yesterday. The System logged your absence.
              Weakness is a choice you can unmake today.
            </p>
            <p className="text-sm italic text-ember/90 border-t border-ember/20 pt-3">"{quote}"</p>
            <p className="text-xs text-mana-glow/50 mt-1">— {legend}</p>
            <button
              onClick={onClose}
              className="mt-5 px-5 py-2 rounded-lg title-font text-sm bg-ember/20 border border-ember/50 text-ember hover:bg-ember/30"
            >
              I ACCEPT — I RISE TODAY
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
