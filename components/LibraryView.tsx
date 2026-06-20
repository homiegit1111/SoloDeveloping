"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { BookChunk } from "@/lib/types";

// Spine accent colors so the shelf reads like a real library, not a grey list.
const SPINES = ["#C9A84C", "#7AA2F7", "#9D7CD8", "#7DCFB6", "#E08C7A", "#D8A657", "#86B8E0", "#B58BD8", "#6FC2B0", "#D98E78"];

export default function LibraryView({
  initialSlug,
  clearInitial,
}: {
  initialSlug?: string | null;
  clearInitial?: () => void;
}) {
  const { state } = useApp();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const readerRef = useRef<HTMLDivElement>(null);

  const books = useMemo(
    () => state.books.filter((b) => (state.bookChunks?.[b.slug]?.length || 0) > 0),
    [state.books, state.bookChunks]
  );

  // open a book if HQ deep-linked into it
  useEffect(() => {
    if (initialSlug) {
      setOpenSlug(initialSlug);
      clearInitial?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlug]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: { slug: string; chunk: BookChunk }[] = [];
    for (const [slug, chunks] of Object.entries(state.bookChunks || {})) {
      for (const c of chunks || []) {
        if (c.text.toLowerCase().includes(q) || (c.tags || []).join(" ").toLowerCase().includes(q)) {
          out.push({ slug, chunk: c });
        }
      }
    }
    return out.slice(0, 40);
  }, [query, state.bookChunks]);

  const open = openSlug ? books.find((b) => b.slug === openSlug) : null;
  const openChunks = openSlug ? state.bookChunks?.[openSlug] || [] : [];
  const spineFor = (slug: string) => SPINES[Math.abs(hash(slug)) % SPINES.length];

  // ---------- READER ----------
  if (open) {
    return (
      <motion.div ref={readerRef} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <button onClick={() => setOpenSlug(null)} className="label hover:text-[color:var(--rank)] transition-colors">
          ← back to the library
        </button>

        <div className="dossier p-5 border-l-2" style={{ borderColor: spineFor(open.slug) }}>
          <p className="label !text-[color:var(--rank)] mb-1">{(open.categories || []).join(" · ").toUpperCase()}</p>
          <h2 className="title-font text-2xl text-[#f1ead8] leading-tight">{open.title}</h2>
          <p className="mono text-sm text-[#b0a78f] mt-1">
            {open.author} · {openChunks.length} passages{open.pages ? ` · ${open.pages} pages` : ""}
          </p>
        </div>

        <div className="space-y-3">
          {openChunks.map((c, i) => (
            <article
              key={c.id || i}
              className="dossier p-4 border-l-2"
              style={{ borderColor: "color-mix(in srgb, var(--rank) 40%, transparent)" }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="label !tracking-[0.14em] !text-[#7e7561]">PASSAGE {String(i + 1).padStart(2, "0")}</p>
                {c.page ? <p className="label !text-[#7e7561]">p.{c.page}</p> : null}
              </div>
              <p className="mono text-[15px] text-[#e2d8c0] leading-relaxed">{c.text}</p>
              {c.tags?.length ? (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {c.tags.slice(0, 5).map((t) => (
                    <span key={t} className="term text-[10px] px-2 py-0.5 border text-[#8a8270]" style={{ borderColor: "var(--line)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </motion.div>
    );
  }

  // ---------- SHELF ----------
  return (
    <div className="space-y-4">
      <div>
        <h2 className="title-font text-xl text-[#eef4ff]">The Codex</h2>
        <p className="mono text-sm text-[#9aa6bd] mt-0.5">
          Every book the System reads from. Open one to study it directly — this is the knowledge behind your orders.
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search every book… (e.g. discipline, percentage, boundaries)"
        aria-label="Search books"
        className="w-full bg-[rgba(8,10,18,0.7)] border px-4 py-3 mono text-sm text-[#e7eefc] placeholder:text-[#5d6678] outline-none focus:border-[color:var(--rank)] transition-colors"
        style={{ borderColor: "var(--line)" }}
      />

      {query.trim().length >= 2 ? (
        <div className="space-y-3">
          <p className="label">{results.length} result{results.length === 1 ? "" : "s"}</p>
          {results.map((r, i) => (
            <button
              key={(r.chunk.id || i) + r.slug}
              onClick={() => setOpenSlug(r.slug)}
              className="dossier p-4 border-l-2 w-full text-left block hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              style={{ borderColor: spineFor(r.slug) }}
            >
              <p className="mono text-sm text-[#e2d8c0] leading-relaxed line-clamp-3">{highlight(r.chunk.text, query)}</p>
              <p className="label !tracking-[0.1em] !text-[#7e7561] mt-2">{titleOf(books, r.slug)}{r.chunk.page ? ` · p.${r.chunk.page}` : ""}</p>
            </button>
          ))}
          {results.length === 0 && <p className="mono text-sm text-[#7e7561]">No passages match that. Try another word.</p>}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <button
              key={b.slug}
              onClick={() => setOpenSlug(b.slug)}
              className="group relative text-left p-4 pl-5 overflow-hidden transition-transform hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(160deg, rgba(13,12,10,0.94), rgba(6,6,9,0.96))",
                border: "1px solid var(--line)",
              }}
            >
              <span className="absolute left-0 inset-y-0 w-1.5" style={{ background: spineFor(b.slug) }} />
              <p className="label !tracking-[0.12em] !text-[#7e7561] mb-1.5">{(b.categories || [])[0]?.toUpperCase() || "CODEX"}</p>
              <p className="title-font text-[15px] text-[#f1ead8] leading-tight line-clamp-2 min-h-[2.4em]">{b.title}</p>
              <p className="mono text-xs text-[#9a917b] mt-1.5">{b.author}</p>
              <p className="label !tracking-[0.1em] !text-[#6f6754] mt-2">{(state.bookChunks?.[b.slug]?.length || 0)} passages</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
function titleOf(books: { slug: string; title: string }[], slug: string): string {
  return books.find((b) => b.slug === slug)?.title || slug;
}
function highlight(text: string, q: string): string {
  // simple snippet around the first match so results read well
  const idx = text.toLowerCase().indexOf(q.trim().toLowerCase());
  if (idx < 0) return text.slice(0, 180);
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + 120);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}
