"use client";

import { useRef, useState } from "react";
import { useApp } from "@/lib/context";
import { todayStr } from "@/lib/store";

// Backup & Restore. localStorage can be wiped (clearing the browser, switching
// phones). This lets Ravi download his entire save and restore it anywhere —
// the single most important safeguard for a 90-day journey.
export default function BackupPanel() {
  const { state, importState } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  function exportSave() {
    // Strip preloaded book chunks (re-fetchable) to keep the file small;
    // uploaded books + all progress are preserved.
    const slimChunks: Record<string, unknown> = {};
    for (const b of state.books) {
      if (!b.preloaded && state.bookChunks[b.slug]) slimChunks[b.slug] = state.bookChunks[b.slug];
    }
    const payload = { ...state, bookChunks: slimChunks, _exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solo-developing-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Backup downloaded. Keep it safe.");
    setTimeout(() => setMsg(""), 2500);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data || typeof data !== "object" || !("history" in data)) {
          setMsg("That doesn't look like a SoloDeveloping backup.");
          return;
        }
        if (
          !confirm(
            "Restore this backup? It will REPLACE your current progress on this device with the saved file."
          )
        )
          return;
        importState(data);
        setMsg("Save restored. Welcome back, Hunter.");
      } catch {
        setMsg("Could not read that file — is it a valid backup?");
      } finally {
        setTimeout(() => setMsg(""), 3000);
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="glass p-4">
      <p className="title-font text-sm tracking-[0.16em] text-[#dcecff] mb-1">BACKUP &amp; RESTORE</p>
      <p className="mono text-[12px] text-[#8993a6] leading-relaxed mb-3">
        A local export you can never lose your 90 days with — even offline. With Cloud Sync on, this is your manual safety net.
      </p>
      <div className="flex gap-2">
        <button
          onClick={exportSave}
          className="flex-1 term text-[11px] py-2 border hover:text-[color:var(--rank)] transition-colors"
          style={{ borderColor: "var(--line-strong)", background: "color-mix(in srgb, var(--rank) 8%, transparent)" }}
        >
          EXPORT SAVE
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 term text-[11px] py-2 border hover:text-[color:var(--rank)] transition-colors"
          style={{ borderColor: "var(--line)" }}
        >
          RESTORE
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onPickFile} className="hidden" />
      </div>
      {msg && <p className="mono text-[12px] mt-2" style={{ color: "var(--rank)" }}>{msg}</p>}
    </div>
  );
}
