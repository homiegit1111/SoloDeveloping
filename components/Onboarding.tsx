"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import ParticleField from "./ParticleField";
import { sysOpen } from "@/lib/sound";

// First-run gate: the System "awakens" the Hunter.
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { state, update } = useApp();
  const [name, setName] = useState(state.name || "Ravi");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-system relative overflow-hidden">
      <div className="absolute inset-0 opacity-50">
        <ParticleField color="#3B82F6" intensity={0.8} tier={4} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="sys-window sys-corner w-full max-w-md p-8 sm:p-10 text-center relative overflow-hidden z-10"
      >
        <div className="scanline" />
        <div className="absolute top-0 left-6 right-6"><div className="sys-bar" /></div>
        <motion.p
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          className="relative z-10 label !tracking-[0.34em] mb-4"
          style={{ color: "var(--rank)" }}
        >
          THE SYSTEM HAS FOUND YOU
        </motion.p>
        <h1 className="relative z-10 title-font text-5xl text-glow mb-3" style={{ color: "var(--rank)" }}>ARISE, HUNTER</h1>
        <p className="relative z-10 mono text-sm text-[#9aa6bd] mb-7 leading-relaxed">
          You had it all. You lost it. Now you rebuild — body, mind, money, discipline, presence. 90 days.
          One comeback. This is your weapon. State your name and step through the gate.
        </p>
        <label className="relative z-10 label block text-left mb-2">Hunter designation</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="relative z-10 w-full px-4 py-3 bg-[rgba(255,255,255,0.03)] border title-font text-[#eaf6ff] mb-5 outline-none transition-colors"
          style={{ borderColor: "var(--line-strong)" }}
          placeholder="Your name"
        />
        <button
          onClick={() => {
            sysOpen();
            update({ name: name.trim() || "Ravi" });
            onDone();
          }}
          className="relative z-10 sys-btn w-full py-3.5 text-sm"
        >
          BEGIN THE ASCENT
        </button>
      </motion.div>
    </div>
  );
}
