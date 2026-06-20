"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconFlame, IconEdit, IconCheck } from "@/components/icons";
import { TactileButton, springTap } from "@/components/TactileMotion";

interface ChargeUpCardProps {
  id: string;
  label: string;
  done: boolean;
  streak: number;
  xp: number;
  blurb: string;
  cracked: boolean;
  icon: React.ComponentType<{ size?: number }>;
  accentColor?: string;
  animating?: boolean;
  floatingXP?: number;
  isEditing?: boolean;
  editText?: string;
  onToggle: () => void;
  onStartRename?: (e: React.MouseEvent) => void;
  onSaveRename?: (text: string) => void;
  onCancelRename?: () => void;
  onEditChange?: (text: string) => void;
  animationIndex?: number;
}

const CIRCUMFERENCE = 164; // 2 * PI * 26

function DigitRoll({
  oldDigit,
  newDigit,
  rolling,
}: {
  oldDigit: string;
  newDigit: string;
  rolling: boolean;
}) {
  const changed = oldDigit !== newDigit;
  return (
    <span className="digit-slot">
      <span
        className="digit-track"
        data-rolling={rolling && changed ? "true" : "false"}
      >
        <span className="digit" aria-hidden={rolling && changed ? "true" : undefined}>
          {oldDigit}
        </span>
        {rolling && changed ? (
          <span className="digit">{newDigit}</span>
        ) : null}
      </span>
    </span>
  );
}

export default function ChargeUpCard({
  id,
  label,
  done,
  streak,
  xp,
  blurb,
  cracked,
  icon: Icon,
  accentColor,
  animating,
  floatingXP,
  isEditing,
  editText,
  onToggle,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onEditChange,
  animationIndex = 0,
}: ChargeUpCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const chargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [charging, setCharging] = useState(false);
  const [shockwave, setShockwave] = useState(false);
  const [rolling, setRolling] = useState(false);
  const prevStreakRef = useRef(streak);
  const [oldStreak, setOldStreak] = useState(streak);
  const reducedMotionRef = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing) {
      const t = setTimeout(() => inputRef.current?.select(), 30);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

  // Number roll on streak change
  useEffect(() => {
    if (reducedMotionRef.current) {
      prevStreakRef.current = streak;
      return;
    }
    if (streak !== prevStreakRef.current) {
      setOldStreak(prevStreakRef.current);
      setRolling(true);
      const t = setTimeout(() => {
        setRolling(false);
        prevStreakRef.current = streak;
      }, 420);
      return () => clearTimeout(t);
    }
  }, [streak]);

  const onChargeComplete = useCallback(() => {
    chargeTimerRef.current = null;
    setCharging(false);
    setShockwave(true);
    onToggle();
    const t = setTimeout(() => setShockwave(false), 700);
    return () => clearTimeout(t);
  }, [onToggle]);

  const handlePointerDown = useCallback(() => {
    if (isEditing) return;
    if (done) {
      onToggle();
      return;
    }
    if (reducedMotionRef.current) {
      onToggle();
      return;
    }
    setCharging(true);
    chargeTimerRef.current = setTimeout(() => {
      onChargeComplete();
    }, 1000);
  }, [done, isEditing, onToggle, onChargeComplete]);

  const handlePointerUp = useCallback(() => {
    if (chargeTimerRef.current) {
      clearTimeout(chargeTimerRef.current);
      chargeTimerRef.current = null;
    }
    setCharging(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEditing) {
        e.stopPropagation();
        if (e.key === "Enter") onSaveRename?.(editText || label);
        if (e.key === "Escape") onCancelRename?.();
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle();
      }
    },
    [isEditing, onToggle, onSaveRename, onCancelRename, editText, label]
  );

  // Pad streaks to same length for digit comparison
  const oldStr = String(oldStreak);
  const newStr = String(streak);
  const maxLen = Math.max(oldStr.length, newStr.length);
  const oldPadded = oldStr.padStart(maxLen, "0");
  const newPadded = newStr.padStart(maxLen, "0");

  const ringColor = accentColor || "var(--rank)";
  const ringGlow = accentColor
    ? accentColor.replace(")", ", 0.5)").replace("rgb", "rgba")
    : "var(--rank-glow)";

  return (
    <motion.button
      className="relative w-full text-left"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springTap, delay: animationIndex * 0.03 }}
      whileTap={isEditing || reducedMotionRef.current ? undefined : { scale: 0.95 }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      aria-pressed={done}
      aria-label={`${label} quest. Streak: ${streak} days. ${done ? "Completed" : "Not completed"}. ${xp} XP.`}
      role="button"
      tabIndex={0}
      disabled={isEditing}
    >
      {/* Shockwave rings — outside clip-path so they can expand freely */}
      <AnimatePresence>
        {shockwave &&
          [0, 120, 240].map((delay) => (
            <motion.div
              key={delay}
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                border: `2px solid ${ringColor}`,
                borderRadius: "2px",
                boxShadow: `0 0 20px ${ringGlow}`,
              }}
              initial={{ scale: 0.6, opacity: 0.65 }}
              animate={{ scale: 2.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.65,
                ease: "easeOut",
                delay: delay / 1000,
              }}
            />
          ))}
      </AnimatePresence>

      {/* Completion flash overlay */}
      <AnimatePresence>
        {animating && (
          <motion.span
            className="absolute inset-0 pointer-events-none z-30"
            style={{ background: "#ffffff" }}
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          />
        )}
      </AnimatePresence>

      {/* Floating +XP */}
      <AnimatePresence>
        {floatingXP ? (
          <motion.span
            className="absolute right-10 top-2 num text-sm pointer-events-none z-40"
            style={{
              color: ringColor,
              textShadow: `0 0 14px ${ringGlow}`,
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -34 }}
            transition={{ duration: 1.0 }}
          >
            +{floatingXP} XP
          </motion.span>
        ) : null}
      </AnimatePresence>

      {/* Card body (clipped) */}
      <div
        className="quest-card group relative flex items-center gap-3 px-3.5 py-3"
        data-done={done}
        data-cracked={cracked}
      >
        {/* SVG radial fill indicator */}
        {!done && !isEditing && !reducedMotionRef.current && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              className="charge-ring-svg"
              style={{ filter: `drop-shadow(0 0 4px ${ringGlow})` }}
            >
              <circle
                cx="28"
                cy="28"
                r="26"
                fill="none"
                stroke={ringColor}
                strokeWidth="3"
                className="charge-ring"
                data-charging={charging}
              />
            </svg>
          </div>
        )}

        {/* Habit icon */}
        <span
          className="grid place-items-center w-10 h-10 shrink-0 transition-colors z-10"
          style={{
            border: `1px solid ${done ? ringColor : "var(--line)"}`,
            color: done ? ringColor : "#9aa6bd",
            background: done
              ? `color-mix(in srgb, ${ringColor} 10%, transparent)`
              : "transparent",
            clipPath:
              "polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)",
          }}
        >
          {Icon ? <Icon size={20} /> : null}
        </span>

        {/* Label + blurb / rename input */}
        <div className="flex-1 min-w-0 z-10">
          {isEditing ? (
            <input
              ref={inputRef}
              value={editText || ""}
              onChange={(e) => onEditChange?.(e.target.value)}
              onBlur={() => onSaveRename?.(editText || label)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              maxLength={32}
              aria-label={`Rename ${label} quest`}
              className="title-font text-[15px] uppercase tracking-wide bg-transparent border-b outline-none w-full"
              style={{ color: "#f1f6ff", borderColor: ringColor }}
              autoFocus
            />
          ) : (
            <p
              className="title-font text-[15px] uppercase tracking-wide"
              style={{ color: done ? "#f1f6ff" : "#cdd8ec" }}
            >
              {label}
            </p>
          )}
          <p className="mono text-[11px] text-[#80909f] truncate">
            {isEditing
              ? "Enter to save · Esc to cancel"
              : cracked
              ? "⚠ MISSED YESTERDAY — recover it"
              : blurb}
          </p>
        </div>

        {/* Right column: streak + xp + rename btn */}
        <div className="flex flex-col items-end gap-0.5 shrink-0 z-10">
          {streak > 0 && !isEditing && (
            <span
              className="num text-[11px] flex items-center gap-0.5"
              style={{ color: ringColor }}
            >
              <IconFlame size={12} />
              <span className="streak-counter inline-flex">
                {newPadded.split("").map((digit, i) => (
                  <DigitRoll
                    key={`${id}-digit-${i}`}
                    oldDigit={oldPadded[i] || "0"}
                    newDigit={digit}
                    rolling={rolling}
                  />
                ))}
              </span>
            </span>
          )}
          {!isEditing && (
            <span
              className="num text-[12px]"
              style={{ color: done ? ringColor : "#80909f" }}
            >
              +{xp}
            </span>
          )}
          {/* rename */}
          {!isEditing && (
            <TactileButton
              onClick={(e) => {
                e.stopPropagation();
                onStartRename?.(e);
              }}
              aria-label={`Rename ${label}`}
              className="sm:opacity-0 sm:group-hover:opacity-50 hover:!opacity-100 opacity-25 transition-opacity p-1 -m-1 mt-0.5"
              style={{ color: ringColor }}
              title="Rename quest"
              glowColor={ringGlow}
            >
              <IconEdit size={12} />
            </TactileButton>
          )}
        </div>

        {/* Done checkmark */}
        <div
          className="grid place-items-center w-6 h-6 shrink-0 transition-all z-10"
          style={{
            background: done ? ringColor : "transparent",
            border: `1px solid ${
              done ? ringColor : "rgba(150,160,180,0.35)"
            }`,
            color: done ? "#04060c" : "transparent",
            clipPath:
              "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)",
          }}
        >
          <AnimatePresence>
            {done && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <IconCheck size={15} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
}
