/**
 * TtsButton — compact audio read-aloud pill using Microsoft Edge TTS.
 * Fetches audio from /api/tts and plays via <audio>.
 * Idle: slate pill with speaker icon + "Listen"
 * Loading: pulse animation
 * Playing: animated waveform bars + "Stop"
 */
"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TtsButtonProps {
  /** The text to speak aloud */
  text: string;
  className?: string;
}

const BARS = [0.5, 1, 0.7, 1, 0.6]; // relative peak heights for each bar

export function TtsButton({ text, className }: TtsButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setState("idle");
  }, []);

  const play = useCallback(async () => {
    stop();
    setState("loading");

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("TTS request failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => stop();
      audio.onerror = () => stop();

      await audio.play();
      setState("playing");
    } catch {
      setState("idle");
    }
  }, [text, stop]);

  const toggle = useCallback(() => {
    if (state === "playing" || state === "loading") {
      stop();
    } else {
      play();
    }
  }, [state, stop, play]);

  return (
    <button
      type="button"
      onClick={toggle}
      title={state === "playing" ? "Stop reading" : "Read aloud"}
      className={cn(
        "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold select-none transition-all duration-150",
        state === "playing"
          ? "bg-[#141414] text-white"
          : state === "loading"
            ? "bg-[#141414] text-white/70"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800",
        className
      )}
    >
      {state === "playing" ? (
        /* Animated waveform bars */
        <span className="flex items-end gap-px h-3">
          {BARS.map((peak, i) => (
            <motion.span
              key={i}
              className="block w-[2px] rounded-full bg-white"
              animate={{
                height: ["3px", `${Math.round(peak * 12)}px`, "3px"],
              }}
              transition={{
                duration: 0.7 + i * 0.05,
                delay: i * 0.08,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ height: "3px" }}
            />
          ))}
        </span>
      ) : state === "loading" ? (
        <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
      ) : (
        <Volume2 className="w-3 h-3 flex-shrink-0" />
      )}
      <span>{state === "playing" ? "Stop" : state === "loading" ? "Loading…" : "Listen"}</span>
    </button>
  );
}
