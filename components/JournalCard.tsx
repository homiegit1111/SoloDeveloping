"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { todayStr } from "@/lib/store";

// One-line evening reflection. Feeds the AI daily verdict (next day) and the
// weekly report so the System's judgment is personal, not generic.
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
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="title-font text-sm text-mana-glow/80">🌙 EVENING REFLECTION</p>
        {saved && <span className="text-[10px] text-arise/80 title-font">SAVED</span>}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        rows={2}
        maxLength={240}
        placeholder="One honest line about today — what you conquered, what you dodged."
        className="w-full bg-black/30 border border-mana/20 rounded-lg p-2 text-sm text-mana-glow placeholder:text-mana-glow/30 focus:outline-none focus:border-mana/50 resize-none"
      />
      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-mana-glow/40">The System remembers. It will weigh this tomorrow.</p>
        <span className="text-[10px] text-mana-glow/30">{text.length}/240</span>
      </div>
    </div>
  );
}
