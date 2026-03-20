/**
 * Voice Preview — admin tool to audition Edge TTS voices before choosing one.
 * Listen to each voice reading a sample strategy question, then pick your favourite.
 */
"use client";

import { useState, useRef, useCallback } from "react";
import { Volume2, Loader2, Square, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const SAMPLE_TEXT =
  "What are the three biggest growth opportunities you see in the next twelve months, and what's stopping you from pursuing them right now?";

interface VoiceOption {
  id: string;
  name: string;
  gender: "Female" | "Male";
  accent: string;
}

const VOICES: VoiceOption[] = [
  // GB
  { id: "en-GB-SoniaNeural", name: "Sonia", gender: "Female", accent: "British" },
  { id: "en-GB-LibbyNeural", name: "Libby", gender: "Female", accent: "British" },
  { id: "en-GB-MaisieNeural", name: "Maisie", gender: "Female", accent: "British" },
  { id: "en-GB-RyanNeural", name: "Ryan", gender: "Male", accent: "British" },
  { id: "en-GB-ThomasNeural", name: "Thomas", gender: "Male", accent: "British" },
  // US
  { id: "en-US-AvaNeural", name: "Ava", gender: "Female", accent: "American" },
  { id: "en-US-EmmaNeural", name: "Emma", gender: "Female", accent: "American" },
  { id: "en-US-AriaNeural", name: "Aria", gender: "Female", accent: "American" },
  { id: "en-US-JennyNeural", name: "Jenny", gender: "Female", accent: "American" },
  { id: "en-US-MichelleNeural", name: "Michelle", gender: "Female", accent: "American" },
  { id: "en-US-AndrewNeural", name: "Andrew", gender: "Male", accent: "American" },
  { id: "en-US-BrianNeural", name: "Brian", gender: "Male", accent: "American" },
  { id: "en-US-GuyNeural", name: "Guy", gender: "Male", accent: "American" },
  { id: "en-US-ChristopherNeural", name: "Christopher", gender: "Male", accent: "American" },
  { id: "en-US-EricNeural", name: "Eric", gender: "Male", accent: "American" },
  { id: "en-US-RogerNeural", name: "Roger", gender: "Male", accent: "American" },
  { id: "en-US-SteffanNeural", name: "Steffan", gender: "Male", accent: "American" },
  // AU
  { id: "en-AU-NatashaNeural", name: "Natasha", gender: "Female", accent: "Australian" },
  { id: "en-AU-WilliamMultilingualNeural", name: "William", gender: "Male", accent: "Australian" },
  // IE
  { id: "en-IE-EmilyNeural", name: "Emily", gender: "Female", accent: "Irish" },
  { id: "en-IE-ConnorNeural", name: "Connor", gender: "Male", accent: "Irish" },
];

type PlayState = "idle" | "loading" | "playing";

export default function VoicePreviewPage() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "Female" | "Male">("all");
  const [accentFilter, setAccentFilter] = useState<string>("all");
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
    setPlayingId(null);
    setLoadingId(null);
  }, []);

  const play = useCallback(
    async (voiceId: string) => {
      stop();
      setLoadingId(voiceId);

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: SAMPLE_TEXT, voice: voiceId }),
        });

        if (!res.ok) throw new Error("TTS failed");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        urlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => stop();
        audio.onerror = () => stop();

        await audio.play();
        setLoadingId(null);
        setPlayingId(voiceId);
      } catch {
        stop();
      }
    },
    [stop],
  );

  const toggle = useCallback(
    (voiceId: string) => {
      if (playingId === voiceId || loadingId === voiceId) {
        stop();
      } else {
        play(voiceId);
      }
    },
    [playingId, loadingId, stop, play],
  );

  const getState = (id: string): PlayState => {
    if (loadingId === id) return "loading";
    if (playingId === id) return "playing";
    return "idle";
  };

  const filtered = VOICES.filter((v) => {
    if (filter !== "all" && v.gender !== filter) return false;
    if (accentFilter !== "all" && v.accent !== accentFilter) return false;
    return true;
  });

  const accents = Array.from(new Set(VOICES.map((v) => v.accent)));

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-slate-900">Voice Preview</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Listen to each voice reading a sample strategy question. Pick your
        favourite, then tell me which one to use.
      </p>

      {/* Sample text display */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          Sample question
        </p>
        <p className="text-sm text-slate-700 italic">&ldquo;{SAMPLE_TEXT}&rdquo;</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 bg-[#141414] rounded-lg p-1">
          {(["all", "Female", "Male"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                filter === g
                  ? "bg-white/15 text-white"
                  : "text-white/55 hover:text-white",
              )}
            >
              {g === "all" ? "All" : g}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#141414] rounded-lg p-1">
          {["all", ...accents].map((a) => (
            <button
              key={a}
              onClick={() => setAccentFilter(a)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                accentFilter === a
                  ? "bg-white/15 text-white"
                  : "text-white/55 hover:text-white",
              )}
            >
              {a === "all" ? "All" : a}
            </button>
          ))}
        </div>
      </div>

      {/* Voice grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((v) => {
          const state = getState(v.id);
          return (
            <button
              key={v.id}
              onClick={() => toggle(v.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 text-left transition-all",
                state === "playing"
                  ? "border-brand-blue bg-slate-50 ring-1 ring-brand-blue/30"
                  : state === "loading"
                    ? "border-slate-300 bg-slate-50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50",
              )}
            >
              {/* Play/Stop icon */}
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  state === "playing"
                    ? "bg-brand-blue text-white"
                    : state === "loading"
                      ? "bg-slate-200 text-slate-500"
                      : "bg-slate-100 text-slate-500",
                )}
              >
                {state === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : state === "playing" ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{v.name}</p>
                <p className="text-xs text-slate-500">
                  {v.gender} &middot; {v.accent}
                </p>
              </div>

              {/* Currently active indicator */}
              {v.id === "en-GB-RyanNeural" && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 mt-6 text-center">
        21 voices available &middot; All are Microsoft Neural (natural-sounding) voices
      </p>
    </div>
  );
}
