"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/context";
import { lessonOfTheDay } from "@/lib/lesson";

// One passage, surfaced every day on HQ — knowledge even before you generate a plan.
export default function LessonCard({ onOpenLibrary }: { onOpenLibrary?: (slug: string) => void }) {
  const { state } = useApp();
  const lesson = useMemo(() => lessonOfTheDay(state), [state.bookChunks]);
  if (!lesson) return null;

  return (
    <div className="dossier p-4 border-l-2" style={{ borderColor: "var(--rank)" }}>
      <div className="flex items-center justify-between mb-2">
        <p className="label !text-[color:var(--rank)]">LESSON OF THE DAY</p>
        <p className="label !tracking-[0.12em] !text-[#7e7561]">FROM THE BOOKS</p>
      </div>
      <p className="mono text-[15px] text-[#e7dcc4] leading-relaxed italic">
        &ldquo;{lesson.chunk.text}&rdquo;
      </p>
      <div className="flex items-center justify-between mt-3 gap-3">
        <p className="label !tracking-[0.1em] !text-[#8a8270] truncate">
          {lesson.author} · {lesson.book}
          {lesson.chunk.page ? ` · p.${lesson.chunk.page}` : ""}
        </p>
        {onOpenLibrary && (
          <button
            onClick={() => onOpenLibrary(lesson.bookSlug)}
            className="label !text-[color:var(--rank)] hover:underline whitespace-nowrap"
          >
            read more →
          </button>
        )}
      </div>
    </div>
  );
}
