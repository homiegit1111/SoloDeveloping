"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";

// First-run gate: the System "awakens" the Hunter.
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { state, update } = useApp();
  const [name, setName] = useState(state.name || "Ravi");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-system">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong system-border rounded-2xl p-7 max-w-sm w-full text-center"
      >
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="title-font text-mana-glow tracking-[0.3em] text-xs mb-3"
        >
          ⚡ THE SYSTEM HAS FOUND YOU ⚡
        </motion.p>
        <h1 className="title-font text-3xl font-black text-mana-glow text-glow mb-2">ARISE, HUNTER</h1>
        <p className="text-sm text-mana-glow/75 mb-6 leading-relaxed">
          You had it all. You lost it. Now you rebuild — body, mind, money, discipline, presence. 90 days. One
          comeback. This is your weapon. State your name and step through the gate.
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-void-700 border border-mana/40 text-mana-glow text-center title-font mb-4 outline-none focus:border-mana"
          placeholder="Your name"
        />
        <button
          onClick={() => {
            update({ name: name.trim() || "Ravi" });
            onDone();
          }}
          className="w-full py-3 rounded-xl title-font tracking-wider bg-mana/20 border border-mana/50 text-mana-glow hover:bg-mana/30 shadow-mana"
        >
          BEGIN THE ASCENT
        </button>
      </motion.div>
    </div>
  );
}
