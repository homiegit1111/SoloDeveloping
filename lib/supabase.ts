import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cloud sync is OPTIONAL and additive. The app is localStorage-first and fully
// works without these env vars. When NEXT_PUBLIC_SUPABASE_URL +
// NEXT_PUBLIC_SUPABASE_ANON_KEY are set (in Vercel), sync turns on.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function supabaseConfigured(): boolean {
  return Boolean(URL && ANON);
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  if (!client) {
    client = createClient(URL as string, ANON as string, {
      auth: { persistSession: false },
    });
  }
  return client;
}

// Table the sync layer expects (create once in Supabase SQL editor):
//
//   create table if not exists saves (
//     hunter_id text primary key,
//     state jsonb not null,
//     updated_at timestamptz not null default now()
//   );
//   alter table saves enable row level security;
//   create policy "anon all" on saves for all
//     using (true) with check (true);
//
export const SAVES_TABLE = "saves";
