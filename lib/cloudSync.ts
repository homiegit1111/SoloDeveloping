import { AppState } from "./types";
import { getSupabase, SAVES_TABLE, supabaseConfigured } from "./supabase";
import { slimState } from "./store";

const HUNTER_KEY = "solo-hunter-id";
const SYNCED_AT_KEY = "solo-synced-at";

// A device-local "sync code" identifies this hunter's cloud save. Paste the same
// code on another device to link them. No login required.
export function getHunterId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(HUNTER_KEY);
  if (!id) {
    id = newCode();
    localStorage.setItem(HUNTER_KEY, id);
  }
  return id;
}

export function setHunterId(code: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HUNTER_KEY, code.trim().toUpperCase());
}

function newCode(): string {
  // human-friendly: 3 groups of 4, no ambiguous chars
  const alpha = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const g = () =>
    Array.from({ length: 4 }, () => alpha[Math.floor(Math.random() * alpha.length)]).join("");
  return `${g()}-${g()}-${g()}`;
}

export interface RemoteSave {
  state: AppState;
  updatedAt: string;
}

export async function pullState(): Promise<RemoteSave | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const id = getHunterId();
  const { data, error } = await sb.from(SAVES_TABLE).select("state, updated_at").eq("hunter_id", id).maybeSingle();
  if (error || !data) return null;
  return { state: data.state as AppState, updatedAt: data.updated_at as string };
}

export async function pushState(state: AppState): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const id = getHunterId();
  const now = new Date().toISOString();
  // Strip preloaded chunks — they re-hydrate from /books-data, so syncing them
  // would bloat every cloud save by several MB for no benefit.
  const { error } = await sb.from(SAVES_TABLE).upsert({ hunter_id: id, state: slimState(state), updated_at: now });
  if (error) return false;
  if (typeof window !== "undefined") localStorage.setItem(SYNCED_AT_KEY, now);
  return true;
}

export function lastSyncedAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SYNCED_AT_KEY);
}

export function markSynced(ts: string) {
  if (typeof window !== "undefined") localStorage.setItem(SYNCED_AT_KEY, ts);
}

export { supabaseConfigured };
