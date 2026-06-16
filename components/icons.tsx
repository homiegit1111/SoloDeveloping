"use client";

import { CSSProperties } from "react";

type P = { size?: number; className?: string; style?: CSSProperties };

// Crisp, minimal line icons. Stroke-based, inherit currentColor.
// No emoji anywhere — this is the System, not a toy.
function S({ size = 22, className, style, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/* ---------- Habit / quest icons ---------- */
export const IconGym = (p: P) => (
  <S {...p}>
    <path d="M4 9v6M7 7v10M17 7v10M20 9v6" />
    <path d="M7 12h10" />
  </S>
);
export const IconStudy = (p: P) => (
  <S {...p}>
    <path d="M12 6.5C10.5 5 7.5 5 4.5 6v12c3-1 6-1 7.5.5C13.5 17 16.5 17 19.5 18V6c-3-1-6-1-7.5.5Z" />
    <path d="M12 6.5V18" />
  </S>
);
export const IconDiscipline = (p: P) => (
  <S {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
    <path d="m9 11.5 2 2 4-4.5" />
  </S>
);
export const IconSkincare = (p: P) => (
  <S {...p}>
    <path d="M12 3c1.5 4 3 5.5 7 7-4 1.5-5.5 3-7 7-1.5-4-3-5.5-7-7 4-1.5 5.5-3 7-7Z" />
  </S>
);
export const IconFood = (p: P) => (
  <S {...p}>
    <path d="M3 13h18a8 8 0 0 1-8 7H11a8 8 0 0 1-8-7Z" />
    <path d="M12 13c0-4 2.5-7 6-8M9 13c.5-2 2-3.5 4-4" />
  </S>
);
export const IconBuild = (p: P) => (
  <S {...p}>
    <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 6l-4 12" />
  </S>
);
export const IconMaths = (p: P) => (
  <S {...p}>
    <path d="M6 5h12l-5.5 7L18 19H6l5.5-7L6 5Z" />
  </S>
);

/* ---------- Stat icons ---------- */
export const IconSTR = IconGym;
export const IconINT = (p: P) => (
  <S {...p}>
    <path d="M12 4a4 4 0 0 0-4 4c-1.5.5-2.5 2-2.5 3.5 0 1.3.7 2.4 1.7 3 .2 2 1.9 3.5 4.8 3.5V4Z" />
    <path d="M12 4a4 4 0 0 1 4 4c1.5.5 2.5 2 2.5 3.5 0 1.3-.7 2.4-1.7 3-.2 2-1.9 3.5-4.8 3.5" />
    <path d="M12 9v3M9.5 8.5h0M14.5 8.5h0" />
  </S>
);
export const IconWIL = IconDiscipline;
export const IconCHA = IconSkincare;
export const IconVIT = (p: P) => (
  <S {...p}>
    <path d="M3 12h4l2-4 3 8 2-5 1 1h6" />
  </S>
);
export const IconCRE = IconBuild;

/* ---------- Nav icons ---------- */
export const IconHQ = (p: P) => (
  <S {...p}>
    <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
    <path d="M12 3v18M4 7.5l8 4.5 8-4.5" />
  </S>
);
export const IconPlan = (p: P) => (
  <S {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </S>
);
export const IconTrain = (p: P) => (
  <S {...p}>
    <path d="m6 18 9-9 1.5-4.5L20 3l-1.5 3.5L14 8l-9 9-2 2 1 1 2-2Z" />
    <path d="m13 7 4 4M5 19l1 1" />
  </S>
);
export const IconReport = (p: P) => (
  <S {...p}>
    <path d="M4 20V4M4 20h16M8 16l3-5 3 2 4-7" />
  </S>
);
export const IconBooks = (p: P) => (
  <S {...p}>
    <path d="M5 4h5a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5V4Z" />
    <path d="M19 4h-5a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h5V4Z" />
  </S>
);

/* ---------- Utility icons ---------- */
export const IconCheck = (p: P) => (
  <S {...p}>
    <path d="m5 12 4 4L19 6" />
  </S>
);
export const IconFlame = (p: P) => (
  <S {...p}>
    <path d="M12 3c.5 3-2 4.5-2 7a2 2 0 0 0 4 0c0-1 .5-1.5 1-2 1 1.5 2 3 2 5a5 5 0 0 1-10 0c0-3.5 3-5.5 5-10Z" />
  </S>
);
export const IconLock = (p: P) => (
  <S {...p}>
    <rect x="5" y="11" width="14" height="9" rx="1.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </S>
);

/* ---------- Lookup maps ---------- */
export const HABIT_ICON: Record<string, (p: P) => JSX.Element> = {
  gym: IconGym,
  study: IconStudy,
  discipline: IconDiscipline,
  skincare: IconSkincare,
  food: IconFood,
  build: IconBuild,
  maths: IconMaths,
};

export const STAT_ICON: Record<string, (p: P) => JSX.Element> = {
  STR: IconSTR,
  INT: IconINT,
  WIL: IconWIL,
  CHA: IconCHA,
  VIT: IconVIT,
  CRE: IconCRE,
};

export const NAV_ICON: Record<string, (p: P) => JSX.Element> = {
  home: IconHQ,
  plan: IconPlan,
  curriculum: IconTrain,
  report: IconReport,
  books: IconBooks,
};
