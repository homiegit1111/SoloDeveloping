"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";

/* ============================================================
   Spring-physics micro-interaction primitives
   - Only transform / opacity — no layout animations
   - Respects prefers-reduced-motion
   - All native props forwarded for a11y
   ============================================================ */

export const springTap: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 17,
};

export const springToggle: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 25,
};

/* ── 1. TactileButton ─────────────────────────────────────── */

type TactileButtonProps = React.ComponentProps<typeof motion.button> & {
  glowColor?: string;
  glowIntensity?: number;
};

export function TactileButton({
  glowColor,
  glowIntensity = 0.6,
  children,
  style,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  ...props
}: TactileButtonProps) {
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);

  const glow =
    pressed && !reduced
      ? {
          boxShadow: `0 0 ${14 * glowIntensity}px ${glowColor || "var(--rank-glow)"},
                       0 0 ${28 * glowIntensity}px ${glowColor || "var(--rank-glow)"}`,
        }
      : {};

  return (
    <motion.button
      type="button"
      {...props}
      whileTap={reduced ? undefined : { scale: 0.95 }}
      transition={springTap}
      onPointerDown={(e) => {
        setPressed(true);
        onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        setPressed(false);
        onPointerUp?.(e);
      }}
      onPointerLeave={(e) => {
        setPressed(false);
        onPointerLeave?.(e);
      }}
      style={{ ...style, ...glow }}
    >
      {children}
    </motion.button>
  );
}

/* ── 2. TactileToggle ─────────────────────────────────────── */

type TactileToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  id?: string;
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
  "aria-label"?: string;
};

export function TactileToggle({
  value,
  onChange,
  label,
  id,
  activeColor,
  inactiveColor = "var(--line-strong)",
  thumbColor = "#e7eefc",
  "aria-label": ariaLabel,
}: TactileToggleProps) {
  const reduced = useReducedMotion();
  const trackActive = activeColor || "var(--rank)";
  const trackInactive = inactiveColor;
  const uniqueId = useRef(`tt-${Math.random().toString(36).slice(2, 9)}`);

  return (
    <button
      type="button"
      id={id || uniqueId.current}
      aria-pressed={value}
      aria-label={ariaLabel || label}
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-2.5 border-b"
      style={{ borderColor: "var(--line)", cursor: "pointer" }}
    >
      {label && (
        <span className="term text-[12px] text-[#b8c4dc]">{label}</span>
      )}
      <span className="relative inline-flex h-5 w-9 rounded-full">
        {/* Track */}
        <motion.span
          className="absolute inset-0 rounded-full"
          animate={{
            background: value ? trackActive : trackInactive,
          }}
          transition={reduced ? { duration: 0 } : springToggle}
        />
        {/* Thumb */}
        <motion.span
          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full"
          style={{ background: thumbColor }}
          animate={{
            x: value ? 16 : 0,
            scale: value && !reduced ? [1, 1.05, 1] : 1,
          }}
          transition={
            reduced
              ? { duration: 0 }
              : { ...springToggle, scale: { type: "spring", stiffness: 600, damping: 12 } }
          }
        />
      </span>
    </button>
  );
}

/* ── 3. TactileInput ─────────────────────────────────────── */

type TactileInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  wrapperClassName?: string;
  glowColor?: string;
};

export function TactileInput({
  wrapperClassName,
  glowColor,
  onFocus,
  onBlur,
  ...props
}: TactileInputProps) {
  const reduced = useReducedMotion();
  const [focused, setFocused] = useState(false);

  const glow =
    focused && !reduced
      ? {
          boxShadow: `0 0 10px ${glowColor || "var(--rank-glow)"}`,
          borderColor: glowColor || "var(--rank)",
        }
      : {};

  return (
    <motion.div
      className={wrapperClassName}
      animate={reduced ? {} : { scale: focused ? 1.01 : 1 }}
      transition={springTap}
      style={{ willChange: "transform" }}
    >
      <input
        {...props}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={{
          ...((props.style as React.CSSProperties) || {}),
          ...glow,
          transition: reduced ? undefined : "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      />
    </motion.div>
  );
}

/* ── 4. TactileNumber ─────────────────────────────────────── */

type TactileNumberProps = React.InputHTMLAttributes<HTMLInputElement> & {
  wrapperClassName?: string;
  glowColor?: string;
};

export function TactileNumber({
  wrapperClassName,
  glowColor,
  onChange,
  ...props
}: TactileNumberProps) {
  const reduced = useReducedMotion();
  const [flash, setFlash] = useState(false);

  const lastValue = useRef(props.value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value !== String(lastValue.current) && !reduced) {
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
    }
    lastValue.current = e.target.value;
    onChange?.(e);
  }

  const flashStyle = flash && !reduced
    ? {
        background: "color-mix(in srgb, var(--rank) 12%, rgba(4,6,12,0.9))",
        boxShadow: `0 0 12px ${glowColor || "var(--rank-glow)"}`,
      }
    : {};

  return (
    <motion.div
      className={wrapperClassName}
      animate={reduced ? {} : { scale: props.value !== lastValue.current ? [1, 1.015, 1] : 1 }}
      transition={springTap}
      style={{ willChange: "transform" }}
    >
      <input
        {...props}
        type="number"
        onChange={handleChange}
        style={{
          ...((props.style as React.CSSProperties) || {}),
          ...flashStyle,
          transition: "background 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease",
        }}
      />
    </motion.div>
  );
}
