/**
 * GlobalSearch — Cmd+K / Ctrl+K search modal for the admin panel.
 * Searches clients server-side; only id/businessName/status are returned.
 * Nothing is fetched on mount — data is only requested when the user types.
 */
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  businessName: string;
  status: string;
}

const STATUS_DOT: Record<string, string> = {
  active:     "bg-amber-400",
  onboarding: "bg-amber-400",
  blocked:    "bg-red-400",
  invited:    "bg-slate-300",
  paused:     "bg-slate-200",
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive]   = useState(0);
  const inputRef  = useRef<HTMLInputElement>(null);
  const debouncer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Keyboard shortcut to open */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Focus + reset when opened */
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* Debounced server search — only fires when user types */
  useEffect(() => {
    if (debouncer.current) clearTimeout(debouncer.current);
    const q = query.trim();
    if (!q) { setResults([]); setLoading(false); return; }

    setLoading(true);
    debouncer.current = setTimeout(() => {
      fetch(`/api/clients/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => { setResults(d.data ?? []); setActive(0); })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 200);

    return () => { if (debouncer.current) clearTimeout(debouncer.current); };
  }, [query]);

  const navigate = useCallback((client: SearchResult) => {
    setOpen(false);
    router.push(`/admin/clients/${client.id}`);
  }, [router]);

  /* Keep refs in sync for stable arrow-key listener */
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const activeRef = useRef(active);
  activeRef.current = active;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  /* Arrow key navigation — listener only re-registers when open changes */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown")  { e.preventDefault(); setActive((v) => Math.min(v + 1, resultsRef.current.length - 1)); }
      if (e.key === "ArrowUp")    { e.preventDefault(); setActive((v) => Math.max(v - 1, 0)); }
      if (e.key === "Enter" && resultsRef.current[activeRef.current]) navigateRef.current(resultsRef.current[activeRef.current]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Trigger — Algolia-style wide search bar */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-3 w-72 lg:w-96 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/[0.15] border border-white/[0.12] transition-colors group"
      >
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="flex-1 text-left text-sm text-slate-400">
          Search clients…
        </span>
        <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 border border-white/[0.15] text-[11px] font-mono text-slate-400 leading-none">
          <span className="text-[13px] leading-none">⌘</span>K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="search-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              key="search-dialog"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="w-full max-w-xl pointer-events-auto">

              <div className="bg-[#1a1a1a] rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/[0.08]">

                {/* Search input row */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
                  {loading
                    ? <Loader2 className="w-4 h-4 text-slate-400 flex-shrink-0 animate-spin" />
                    : <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  }
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                    placeholder="Search clients…"
                    className="flex-1 bg-transparent text-[15px] text-white placeholder:text-slate-500 outline-none"
                  />
                  {query ? (
                    <button onClick={() => setQuery("")} className="text-slate-500 hover:text-slate-300 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 border border-white/[0.1] text-[10px] font-mono text-slate-500">
                      ESC
                    </kbd>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto py-2">
                  {!query.trim() ? (
                    <p className="text-sm text-slate-500 text-center py-10">
                      Type to search clients…
                    </p>
                  ) : results.length === 0 && !loading ? (
                    <div className="text-center py-10">
                      <p className="text-sm text-slate-400">No results for <span className="text-white">&ldquo;{query}&rdquo;</span></p>
                    </div>
                  ) : (
                    <div>
                      {results.length > 0 && (
                        <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                          Clients
                        </p>
                      )}
                      {results.map((client, i) => (
                        <button
                          key={client.id}
                          onClick={() => navigate(client)}
                          onMouseEnter={() => setActive(i)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            i === active ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 ring-1 ring-white/[0.08]">
                            <span className="text-xs font-semibold text-white">
                              {client.businessName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{client.businessName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[client.status] ?? "bg-slate-600")} />
                              <span className="text-xs text-slate-500 capitalize">{client.status}</span>
                            </div>
                          </div>
                          <ArrowRight className={cn(
                            "w-3.5 h-3.5 flex-shrink-0 transition-colors",
                            i === active ? "text-slate-300" : "text-slate-600"
                          )} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-white/[0.06] px-4 py-2.5 flex items-center gap-4">
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-slate-400">↑↓</kbd> navigate
                  </span>
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-slate-400">↵</kbd> open
                  </span>
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-slate-400">esc</kbd> close
                  </span>
                </div>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
