"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function Digit({
  digit,
  direction,
  stiffness,
  damping,
}: {
  digit: string;
  direction: -1 | 0 | 1;
  stiffness: number;
  damping: number;
}) {
  // Motion.dev example leans/animates with direction.
  // We do a subtle up/down flip per digit.
  const offset = direction === 0 ? 0 : direction > 0 ? -6 : 6;

  return (
    <span className="relative inline-block w-[0.6em] text-center tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={{ y: -offset, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: offset, opacity: 0 }}
          transition={{ type: "spring", stiffness, damping, mass: 0.6 }}
          className="absolute inset-0"
          aria-hidden
        >
          {digit}
        </motion.span>
      </AnimatePresence>
      {/* Keeps layout stable */}
      <span className="invisible">0</span>
    </span>
  );
}

function AnimatedDigits({ value }: { value: number }) {
  const prev = useRef<number>(Math.round(value));
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);

  const intValue = Math.round(value);
  useEffect(() => {
    const delta = intValue - prev.current;
    if (delta !== 0) setDirection(delta > 0 ? 1 : -1);
    prev.current = intValue;
  }, [intValue]);

  const clamped = clamp(intValue, 0, 100);
  const digits = String(clamped).split("");

  // Less-significant digits animate faster.
  // Left digit slower, right digit faster (matches example feel).
  const stiffnesses = [220, 340, 760];
  const damping = 28;

  return (
    <span className="inline-flex items-center">
      {digits.map((d, idx) => (
        <Digit
          key={idx}
          digit={d}
          direction={direction}
          stiffness={stiffnesses[(3 - digits.length) + idx] ?? stiffnesses[2]}
          damping={damping}
        />
      ))}
    </span>
  );
}

export function NumberRadixSlider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
}: {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}) {
  const safeValue = useMemo(() => {
    const normalized = Number.isFinite(value) ? value : min;
    return clamp(normalized, min, max);
  }, [value, min, max]);

  const digitCount = useMemo(() => String(Math.round(safeValue)).length, [safeValue]);

  // Velocity-based tilt (closer to the Motion.dev example than a timed "kick").
  const raw = useMotionValue(safeValue);
  useEffect(() => {
    raw.set(safeValue);
  }, [raw, safeValue]);

  const velocity = useVelocity(raw);
  const rotateTarget = useTransform(velocity, [-60, 0, 60], [7, 0, -7], { clamp: true });
  const skewTarget = useTransform(velocity, [-60, 0, 60], [2, 0, -2], { clamp: true });
  const xTarget = useTransform(velocity, [-60, 0, 60], [2.5, 0, -2.5], { clamp: true });
  const rotate = useSpring(rotateTarget, { stiffness: 600, damping: 40, mass: 0.3 });
  const skewX = useSpring(skewTarget, { stiffness: 600, damping: 40, mass: 0.3 });
  const x = useSpring(xTarget, { stiffness: 600, damping: 40, mass: 0.3 });

  return (
    <div className={cn("space-y-1.5", className)}>
      <SliderPrimitive.Root
        value={[safeValue]}
        onValueChange={(vals) => onValueChange(vals[0] ?? min)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          disabled && "opacity-60"
        )}
        aria-label="Capability score"
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200">
          <SliderPrimitive.Range className="absolute h-full bg-brand-blue" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "relative block h-5 w-5 rounded-full border border-brand-blue bg-white shadow-sm",
            "transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20"
          )}
        >
          <div className="pointer-events-none absolute -top-[31px] left-1/2 -translate-x-1/2">
            <motion.div
              style={{ rotate, skewX, x, transformOrigin: "50% 100%" }}
              className={cn(
                "relative rounded bg-[#141414] text-white",
                "w-7 h-7 flex items-center justify-center",
                "leading-[1] font-bold",
                digitCount >= 3 ? "text-xs" : "text-sm",
                "shadow-sm ring-1 ring-white/10"
              )}
            >
              <AnimatedDigits value={safeValue} />
            </motion.div>
          </div>
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>

      <div className="flex justify-between text-xs text-slate-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
