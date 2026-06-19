"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/context";
import { AppState } from "@/lib/types";
import {
  supabaseConfigured,
  getHunterId,
  setHunterId,
  pushState,
  pullState,
  lastSyncedAt,
  markSynced,
} from "@/lib/cloudSync";
import { slimState } from "@/lib/store";

function hasProgress(state: AppState): boolean {
  return Object.keys(state.history || {}).length > 0 || state.totalXP > 0;
}

export default function CloudSyncPanel() {
  const { state, importState } = useApp();
  const configured = supabaseConfigured();
  const [code, setCode] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [synced, setSynced] = useState<string | null>(null);
  const pulledOnce = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!configured) return;
    setCode(getHunterId());
    setSynced(lastSyncedAt());
  }, [configured]);

  // On first mount: pull the cloud save and adopt it if it's newer than what
  // this device last synced (handles "edited on phone, now on laptop").
  useEffect(() => {
    if (!configured || pulledOnce.current) return;
    pulledOnce.current = true;
    (async () => {
      const remote = await pullState();
      if (!remote) return;
      const last = lastSyncedAt();
      const remoteNewer = !last || new Date(remote.updatedAt) > new Date(last);
      const localEmpty = !hasProgress(state);
      if (remoteNewer && (localEmpty || hasProgress(remote.state))) {
        importState(remote.state);
        markSynced(remote.updatedAt);
        setSynced(remote.updatedAt);
        setMsg("Pulled your latest save from the cloud.");
        setTimeout(() => setMsg(""), 2500);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  // Auto-push (debounced) whenever progress changes.
  useEffect(() => {
    if (!configured || !pulledOnce.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      const ok = await pushState(slimState(state));
      if (ok) setSynced(lastSyncedAt());
    }, 3000);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [state, configured]);

  async function manualPush() {
    setBusy(true);
    const ok = await pushState(slimState(state));
    setBusy(false);
    setSynced(lastSyncedAt());
    setMsg(ok ? "Saved to the cloud." : "Cloud push failed — check your connection.");
    setTimeout(() => setMsg(""), 2500);
  }

  async function manualPull() {
    setBusy(true);
    const remote = await pullState();
    setBusy(false);
    if (!remote) {
      setMsg("No cloud save found for this code yet.");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    if (!confirm("Pull the cloud save? This REPLACES progress on this device.")) return;
    importState(remote.state);
    markSynced(remote.updatedAt);
    setSynced(remote.updatedAt);
    setMsg("Cloud save restored on this device.");
    setTimeout(() => setMsg(""), 2500);
  }

  function linkDevice() {
    const c = linkInput.trim().toUpperCase();
    if (c.length < 6) return;
    setHunterId(c);
    setCode(c);
    setLinkInput("");
    markSynced(""); // force next pull to adopt remote
    setMsg("Linked. Tap “Pull” to load that hunter's save.");
    setTimeout(() => setMsg(""), 3500);
  }

  function copyCode() {
    navigator.clipboard?.writeText(code);
    setMsg("Sync code copied.");
    setTimeout(() => setMsg(""), 2000);
  }

  if (!configured) {
    return (
      <div className="glass p-4">
        <p className="title-font text-sm tracking-[0.16em] text-[#dcecff] mb-1">CLOUD SYNC</p>
        <p className="mono text-[12px] text-[#8993a6] leading-relaxed">
          Offline mode. Your save lives in this browser — keep exporting backups. Cross-device cloud sync turns on
          once Supabase is connected.
        </p>
      </div>
    );
  }

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="title-font text-sm tracking-[0.16em] text-[#dcecff]">CLOUD SYNC</p>
        <span className="label !text-[color:var(--rank)]">{synced ? "● LIVE" : "● READY"}</span>
      </div>
      <p className="mono text-[12px] text-[#8993a6] leading-relaxed mb-3">
        Auto-saves across devices. Share your <span className="text-[#cdd6e6]">sync code</span> with your other phone/laptop to link them.
      </p>

      <p className="label mb-1">YOUR SYNC CODE</p>
      <div className="flex gap-2 mb-3">
        <code className="term flex-1 text-[13px] px-3 py-2 border text-[#e7eefc] tracking-wider truncate" style={{ borderColor: "var(--line)" }}>
          {code || "…"}
        </code>
        <button onClick={copyCode} className="term text-[11px] px-3 border hover:text-[color:var(--rank)] transition-colors" style={{ borderColor: "var(--line)" }}>
          COPY
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <button onClick={manualPush} disabled={busy} className="flex-1 term text-[11px] py-2 border hover:text-[color:var(--rank)] disabled:opacity-50 transition-colors" style={{ borderColor: "var(--line)" }}>
          PUSH NOW
        </button>
        <button onClick={manualPull} disabled={busy} className="flex-1 term text-[11px] py-2 border hover:text-[color:var(--rank)] disabled:opacity-50 transition-colors" style={{ borderColor: "var(--line)" }}>
          PULL
        </button>
      </div>

      <p className="label mb-1">LINK A DEVICE</p>
      <div className="flex gap-2">
        <input
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          placeholder="paste code"
          className="flex-1 bg-[rgba(8,10,18,0.7)] border px-3 py-2 term text-[12px] text-[#e7eefc] placeholder:text-[#5d6678] outline-none focus:border-[color:var(--rank)] transition-colors uppercase"
          style={{ borderColor: "var(--line)" }}
        />
        <button onClick={linkDevice} className="term text-[11px] px-3 border hover:text-[color:var(--rank)] transition-colors" style={{ borderColor: "var(--line)" }}>
          LINK
        </button>
      </div>

      {msg && <p className="mono text-[11px] mt-2" style={{ color: "var(--rank)" }}>{msg}</p>}
    </div>
  );
}
