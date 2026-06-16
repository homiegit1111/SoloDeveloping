"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { BookMeta, BookChunk } from "@/lib/types";

// Loads preloaded books from /books-data/index.json (once), merges with any
// uploaded books in localStorage, and lets the user upload more PDFs.
export default function BookManager() {
  const { state, setBooks } = useApp();
  const [loadingPreload, setLoadingPreload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // On first mount, ensure preloaded books are present in state.
  useEffect(() => {
    const hasPreloaded = state.books.some((b) => b.preloaded);
    if (hasPreloaded) return;
    (async () => {
      try {
        setLoadingPreload(true);
        const idx = await fetch("/books-data/index.json").then((r) => r.json());
        const newBooks: BookMeta[] = [];
        const newChunks: Record<string, BookChunk[]> = {};
        for (const b of idx.books) {
          const data = await fetch(`/books-data/${b.file}`).then((r) => r.json());
          newBooks.push({
            slug: b.slug,
            title: b.title,
            author: b.author,
            categories: b.categories,
            pages: b.pages,
            chunkCount: b.chunkCount,
            preloaded: true,
            active: true,
          });
          newChunks[b.slug] = data.chunks;
        }
        // merge keeping existing uploaded books
        const uploaded = state.books.filter((b) => !b.preloaded);
        setBooks([...newBooks, ...uploaded], newChunks);
      } catch (e) {
        // ignore — preloaded data optional
      } finally {
        setLoadingPreload(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(`Reading "${file.name}" page by page…`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/books", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) {
        setMsg(`⚠ ${data.error}`);
      } else {
        const meta: BookMeta = data.meta;
        const chunks: BookChunk[] = data.chunks;
        const others = state.books.filter((b) => b.slug !== meta.slug);
        setBooks([...others, meta], { [meta.slug]: chunks });
        setMsg(`✓ Loaded "${meta.title}" — ${meta.chunkCount} chunks indexed (${meta.categories.join(", ")}).`);
      }
    } catch (e: any) {
      setMsg(`⚠ ${e?.message || "Upload failed"}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function toggleActive(slug: string) {
    const books = state.books.map((b) => (b.slug === slug ? { ...b, active: !b.active } : b));
    setBooks(books, {});
  }

  return (
    <div className="space-y-4">
      <div className="glass-strong system-border rounded-2xl p-5">
        <h2 className="title-font text-lg text-mana-glow text-glow mb-1">BOOK INTELLIGENCE</h2>
        <p className="text-sm text-mana-glow/70 mb-4">
          Every page of every book becomes daily wisdom. The System injects relevant passages into your plan.
          {loadingPreload && " · loading library…"}
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full py-3 rounded-xl title-font tracking-wider bg-jade/15 border border-jade/50 text-jade hover:bg-jade/25 disabled:opacity-50"
        >
          {uploading ? "PROCESSING…" : "+ UPLOAD A BOOK (PDF)"}
        </button>
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onUpload} />
        {msg && <p className="text-xs text-mana-glow/70 mt-2">{msg}</p>}
      </div>

      <div className="space-y-2">
        <p className="title-font text-xs text-mana-glow/60 px-1">
          LOADED & ACTIVE — {state.books.filter((b) => b.active).length}/{state.books.length}
        </p>
        {state.books.length === 0 && (
          <p className="text-sm text-mana-glow/50 px-1">No books yet. Upload your first PDF above.</p>
        )}
        {state.books.map((b) => (
          <motion.div
            key={b.slug}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass rounded-xl p-3 flex items-center gap-3 ${b.active ? "" : "opacity-50"}`}
          >
            <span className="text-2xl">📕</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-mana-glow font-semibold truncate">{b.title}</p>
              <p className="text-xs text-mana-glow/55 truncate">
                {b.author} · {b.pages}p · {b.chunkCount} chunks · {b.categories.join(", ")}
                {b.preloaded ? " · preloaded" : ""}
              </p>
            </div>
            <button
              onClick={() => toggleActive(b.slug)}
              className={`text-xs title-font px-2 py-1 rounded-md border ${
                b.active ? "border-jade/50 text-jade" : "border-mana/30 text-mana-glow/50"
              }`}
            >
              {b.active ? "ACTIVE" : "OFF"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
