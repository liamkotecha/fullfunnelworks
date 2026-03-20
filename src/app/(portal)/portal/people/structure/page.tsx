/**
 * Company Structure — interactive Miro-style org chart canvas.
 * Drag cards to arrange, set "Reports To" on each card,
 * and watch SVG arrows + smart alignment guides update in real time.
 */
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Users, ChevronRight, Crown, GripHorizontal, Maximize2 } from "lucide-react";
import { motion, type PanInfo } from "framer-motion";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { SectionProgressHeader, WhatsNext } from "@/components/framework";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { TeamMember } from "../team/page";

// ---------------------------------------------------------------------------
// Constants & types
// ---------------------------------------------------------------------------
const TEAM_FIELD_ID   = "team-members";
const STRUCT_FIELD_ID = "company-structure";

const CARD_W          = 230;
const CARD_H          = 96;
const GRID            = 8;   // fine 8-px grid for smooth positioning
const COLS            = 3;   // tighter initial columns
const GAP_X           = 40;
const GAP_Y           = 56;
const SNAP_THRESHOLD  = 10;  // px — distance at which a guide engages

type Pos = { x: number; y: number };

type StructureData = {
  positions: Record<string, Pos>;
  reportingLines: Record<string, string | null>;
};

type Guide = {
  type: "h" | "v";     // horizontal line (fixed y) or vertical line (fixed x)
  at: number;           // the y or x value
  isEqual: boolean;     // equal-spacing guide (teal) vs alignment guide (rose)
  extent: [number, number]; // [from, to] for line length in the cross axis
};

function snap(v: number) {
  return Math.round(v / GRID) * GRID;
}

function defaultLayout(members: TeamMember[]): Record<string, Pos> {
  const positions: Record<string, Pos> = {};
  members.forEach((m, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    positions[m.id] = {
      x: col * (CARD_W + GAP_X) + 24,
      y: row * (CARD_H + GAP_Y) + 24,
    };
  });
  return positions;
}

// ---------------------------------------------------------------------------
// Smart-guide computation
// Returns guides to render + the snapped position for the dragged card
// ---------------------------------------------------------------------------
function computeGuides(
  draggingId: string,
  live: Pos,
  allPositions: Record<string, Pos>,
  members: TeamMember[],
): { guides: Guide[]; snappedX: number; snappedY: number } {
  const others = members
    .filter((m) => m.id !== draggingId)
    .map((m) => allPositions[m.id])
    .filter((p): p is Pos => Boolean(p));

  const guides: Guide[] = [];
  let snappedX = live.x;
  let snappedY = live.y;

  // ── Alignment anchors ──────────────────────────────────────────────────
  // For the dragged card: left, centreX, right, top, centreY, bottom
  const dX = [live.x, live.x + CARD_W / 2, live.x + CARD_W];
  const dY = [live.y, live.y + CARD_H / 2, live.y + CARD_H];

  // X offsets from left edge to each anchor
  const dXoff = [0, CARD_W / 2, CARD_W];
  const dYoff = [0, CARD_H / 2, CARD_H];

  let bestDX = Infinity, bestDY = Infinity;

  for (const p of others) {
    const oX = [p.x, p.x + CARD_W / 2, p.x + CARD_W];
    const oY = [p.y, p.y + CARD_H / 2, p.y + CARD_H];

    // Vertical guide (card edges/centres align on x axis)
    for (let di = 0; di < 3; di++) {
      for (let oi = 0; oi < 3; oi++) {
        const diff = Math.abs(dX[di] - oX[oi]);
        if (diff < SNAP_THRESHOLD) {
          if (diff < bestDX) {
            bestDX = diff;
            snappedX = oX[oi] - dXoff[di];
          }
          // Guide runs vertically at x=oX[oi], from top of higher card to bottom of lower
          const minY = Math.min(live.y, p.y) - 20;
          const maxY = Math.max(live.y + CARD_H, p.y + CARD_H) + 20;
          guides.push({ type: "v", at: oX[oi], isEqual: false, extent: [minY, maxY] });
        }
      }
    }

    // Horizontal guide (card edges/centres align on y axis)
    for (let di = 0; di < 3; di++) {
      for (let oi = 0; oi < 3; oi++) {
        const diff = Math.abs(dY[di] - oY[oi]);
        if (diff < SNAP_THRESHOLD) {
          if (diff < bestDY) {
            bestDY = diff;
            snappedY = oY[oi] - dYoff[di];
          }
          const minX = Math.min(live.x, p.x) - 20;
          const maxX = Math.max(live.x + CARD_W, p.x + CARD_W) + 20;
          guides.push({ type: "h", at: oY[oi], isEqual: false, extent: [minX, maxX] });
        }
      }
    }
  }

  // ── Equal-spacing guides ───────────────────────────────────────────────
  // Horizontal: find cards to the left and right, check if drag would be equidistant
  const byX = [...others].sort((a, b) => a.x - b.x);
  const byY = [...others].sort((a, b) => a.y - b.y);

  // Horizontal equal spacing (drag between two cards on roughly same y)
  for (let i = 0; i < byX.length - 1; i++) {
    const a = byX[i], b = byX[i + 1];
    const sameRow = Math.abs(a.y - b.y) < CARD_H;
    if (!sameRow) continue;
    // ideal x so gap(a→drag) == gap(drag→b)
    // gap_left = live.x - (a.x + CARD_W), gap_right = b.x - (live.x + CARD_W)
    // equal when live.x = (a.x + b.x) / 2
    const idealX = (a.x + b.x) / 2;
    if (Math.abs(live.x - idealX) < SNAP_THRESHOLD) {
      if (Math.abs(live.x - idealX) < bestDX) {
        bestDX = Math.abs(live.x - idealX);
        snappedX = idealX;
      }
      // Equal-spacing teal guide along the row
      const rowY = (a.y + b.y) / 2 + CARD_H / 2;
      guides.push({ type: "h", at: rowY, isEqual: true, extent: [a.x, b.x + CARD_W] });
      // Also small vertical tick marks at the midpoints
      guides.push({ type: "v", at: a.x + CARD_W + (idealX - a.x - CARD_W) / 2, isEqual: true, extent: [rowY - 12, rowY + 12] });
      guides.push({ type: "v", at: idealX + CARD_W + (idealX - a.x - CARD_W) / 2, isEqual: true, extent: [rowY - 12, rowY + 12] });
    }
  }

  // Vertical equal spacing (drag between two cards on roughly same x)
  for (let i = 0; i < byY.length - 1; i++) {
    const a = byY[i], b = byY[i + 1];
    const sameCol = Math.abs(a.x - b.x) < CARD_W;
    if (!sameCol) continue;
    const idealY = (a.y + b.y) / 2;
    if (Math.abs(live.y - idealY) < SNAP_THRESHOLD) {
      if (Math.abs(live.y - idealY) < bestDY) {
        bestDY = Math.abs(live.y - idealY);
        snappedY = idealY;
      }
      const colX = (a.x + b.x) / 2 + CARD_W / 2;
      guides.push({ type: "v", at: colX, isEqual: true, extent: [a.y, b.y + CARD_H] });
      guides.push({ type: "h", at: a.y + CARD_H + (idealY - a.y - CARD_H) / 2, isEqual: true, extent: [colX - 12, colX + 12] });
      guides.push({ type: "h", at: idealY + CARD_H + (idealY - a.y - CARD_H) / 2, isEqual: true, extent: [colX - 12, colX + 12] });
    }
  }

  // Deduplicate identical type+at guide entries
  const seen = new Set<string>();
  const unique = guides.filter((g) => {
    const key = `${g.type}-${Math.round(g.at)}-${g.isEqual}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { guides: unique, snappedX, snappedY };
}

// ---------------------------------------------------------------------------
// SVG bezier arrow connector
// ---------------------------------------------------------------------------
function Arrow({ fromPos, toPos }: { fromPos: Pos; toPos: Pos }) {
  const x1 = fromPos.x + CARD_W / 2;
  const y1 = fromPos.y + CARD_H;
  const x2 = toPos.x + CARD_W / 2;
  const y2 = toPos.y;
  const cy = (y1 + y2) / 2;
  const d = `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;
  return (
    <path d={d} fill="none" stroke="#d1d5db" strokeWidth={2} markerEnd="url(#arrowhead)" />
  );
}

// ---------------------------------------------------------------------------
// Single draggable member card
// ---------------------------------------------------------------------------
function MemberCard({
  member,
  pos,
  reportsToId,
  members,
  isRoot,
  onDragStart,
  onDrag,
  onDragEnd,
  onReportsToChange,
  canvasRef,
}: {
  member: TeamMember;
  pos: Pos;
  reportsToId: string | null;
  members: TeamMember[];
  isRoot: boolean;
  onDragStart: (id: string) => void;
  onDrag: (id: string, info: PanInfo, canvasRect: DOMRect) => void;
  onDragEnd: (id: string, info: PanInfo, canvasRect: DOMRect) => void;
  onReportsToChange: (id: string, reportsToId: string | null) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}) {
  const options = members.filter((m) => m.id !== member.id);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={canvasRef}
      initial={false}
      animate={{ x: pos.x, y: pos.y }}
      onDragStart={() => onDragStart(member.id)}
      onDrag={(_, info) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) onDrag(member.id, info, rect);
      }}
      onDragEnd={(_, info) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) onDragEnd(member.id, info, rect);
      }}
      style={{ position: "absolute", top: 0, left: 0, width: CARD_W, cursor: "grab" }}
      whileDrag={{ cursor: "grabbing", scale: 1.03, zIndex: 50, boxShadow: "0 16px 40px rgba(0,0,0,0.16)" }}
      className={cn(
        "rounded-xl border shadow-sm select-none bg-white",
        isRoot ? "border-[#141414] ring-2 ring-[#141414]" : "border-gray-200",
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-3 py-2.5 flex items-center gap-2 rounded-t-xl",
        isRoot ? "bg-[#141414]" : "bg-gray-50 border-b border-gray-200",
      )}>
        <GripHorizontal className={cn("w-3.5 h-3.5 flex-shrink-0", isRoot ? "text-white/30" : "text-gray-300")} />
        {isRoot
          ? <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          : <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className={cn("text-[13px] font-bold truncate leading-tight", isRoot ? "text-white" : "text-gray-900")}>
            {member.name || <span className="font-normal opacity-40 italic">Unnamed</span>}
          </p>
          {(member.title || member.department) && (
            <p className={cn("text-[11px] truncate leading-tight", isRoot ? "text-white/55" : "text-gray-400")}>
              {[member.title, member.department].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
      {/* Reports-to selector — stop drag propagation so clicking select works */}
      <div className="px-3 py-2 rounded-b-xl" onPointerDown={(e) => e.stopPropagation()}>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Reports to
        </label>
        <select
          value={reportsToId ?? ""}
          onChange={(e) => onReportsToChange(member.id, e.target.value || null)}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
        >
          <option value="">No manager (top level)</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.name || "Unnamed"}</option>
          ))}
        </select>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function CompanyStructurePage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, setLocalResponse } = useResponses(clientId);
  const loading = clientLoading || responsesLoading;

  const members = useMemo<TeamMember[]>(() => {
    const raw = responses[TEAM_FIELD_ID];
    if (raw && typeof raw === "string" && raw.trim().startsWith("[")) {
      try { return JSON.parse(raw); } catch { /* fall through */ }
    }
    return [];
  }, [responses]);

  const [positions, setPositions]      = useState<Record<string, Pos>>({});
  const [reportingLines, setReporting] = useState<Record<string, string | null>>({});
  const [initialised, setInitialised]  = useState(false);
  const [draggingId, setDraggingId]    = useState<string | null>(null);
  const [liveDragPos, setLiveDragPos]  = useState<Pos>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null!);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live guides computed from current drag position
  const { guides, snappedX, snappedY } = useMemo(() => {
    if (!draggingId) return { guides: [] as Guide[], snappedX: 0, snappedY: 0 };
    return computeGuides(draggingId, liveDragPos, positions, members);
  }, [draggingId, liveDragPos, positions, members]);

  // Load saved canvas state
  useEffect(() => {
    if (loading || initialised) return;
    let saved: Partial<StructureData> = {};
    const raw = responses[STRUCT_FIELD_ID];
    if (raw && typeof raw === "string" && raw.trim().startsWith("{")) {
      try { saved = JSON.parse(raw); } catch { /* fall through */ }
    }
    const savedPos   = saved.positions      ?? {};
    const savedLines = saved.reportingLines ?? {};
    const defaultPos = defaultLayout(members);
    const mergedPos:   Record<string, Pos>              = {};
    const mergedLines: Record<string, string | null>    = {};
    for (const m of members) {
      mergedPos[m.id]   = savedPos[m.id]   ?? defaultPos[m.id];
      mergedLines[m.id] = savedLines[m.id] !== undefined ? savedLines[m.id] : null;
    }
    setPositions(mergedPos);
    setReporting(mergedLines);
    setInitialised(true);
  }, [loading, responses, initialised, members]);

  // Seed newly added members after initial load
  useEffect(() => {
    if (!initialised) return;
    const defaultPos = defaultLayout(members);
    setPositions((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const m of members) {
        if (!(m.id in next)) { next[m.id] = defaultPos[m.id]; changed = true; }
      }
      return changed ? next : prev;
    });
    setReporting((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const m of members) {
        if (!(m.id in next)) { next[m.id] = null; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [members, initialised]);

  const save = useCallback(
    (pos: Record<string, Pos>, lines: Record<string, string | null>) => {
      if (!clientId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const value = JSON.stringify({ positions: pos, reportingLines: lines });
        setLocalResponse(STRUCT_FIELD_ID, value);
        await fetch(`/api/responses/${clientId}/people/structure`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldId: STRUCT_FIELD_ID, value }),
        });
      }, 700);
    },
    [clientId, setLocalResponse],
  );

  const handleDragStart = useCallback((memberId: string) => {
    setDraggingId(memberId);
    setLiveDragPos(positions[memberId] ?? { x: 0, y: 0 });
  }, [positions]);

  const handleDrag = useCallback(
    (memberId: string, info: PanInfo, rect: DOMRect) => {
      const rawX = info.point.x - rect.left - CARD_W / 2;
      const rawY = info.point.y - rect.top  - CARD_H / 2;
      setLiveDragPos({ x: Math.max(0, rawX), y: Math.max(0, rawY) });
    },
    [],
  );

  const handleDragEnd = useCallback(
    (memberId: string, info: PanInfo, rect: DOMRect) => {
      const rawX = info.point.x - rect.left - CARD_W / 2;
      const rawY = info.point.y - rect.top  - CARD_H / 2;
      const live = { x: Math.max(0, rawX), y: Math.max(0, rawY) };
      // Use guide-snapped position if available, otherwise snap to 8px grid
      const { snappedX: gx, snappedY: gy } = computeGuides(memberId, live, positions, members);
      const finalX = Math.abs(gx - live.x) < SNAP_THRESHOLD ? gx : snap(live.x);
      const finalY = Math.abs(gy - live.y) < SNAP_THRESHOLD ? gy : snap(live.y);
      setDraggingId(null);
      setPositions((prev) => {
        const next = { ...prev, [memberId]: { x: Math.max(0, finalX), y: Math.max(0, finalY) } };
        save(next, reportingLines);
        return next;
      });
    },
    [save, reportingLines, positions, members],
  );

  const handleReportsToChange = useCallback(
    (memberId: string, reportsToId: string | null) => {
      setReporting((prev) => {
        const next = { ...prev, [memberId]: reportsToId };
        save(positions, next);
        return next;
      });
    },
    [save, positions],
  );

  // Expand canvas to always fit all cards with padding
  const canvasSize = useMemo(() => {
    if (!initialised || members.length === 0) return { w: 960, h: 560 };
    let maxX = 0, maxY = 0;
    for (const m of members) {
      const p = positions[m.id];
      if (!p) continue;
      maxX = Math.max(maxX, p.x + CARD_W + 80);
      maxY = Math.max(maxY, p.y + CARD_H + 80);
    }
    return { w: Math.max(960, maxX), h: Math.max(560, maxY) };
  }, [positions, members, initialised]);

  const filledCount = useMemo(
    () => members.filter((m) => m.id in reportingLines).length,
    [members, reportingLines],
  );

  const handleAutoArrange = useCallback(() => {
    if (members.length === 0) return;
    const newPos = defaultLayout(members);
    setPositions(newPos);
    save(newPos, reportingLines);
  }, [members, reportingLines, save]);

  // ── Early returns ──────────────────────────────────────────────────────────

  if (loading || !initialised) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-sm">No client profile found.</p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div>
        <SectionProgressHeader title="Company Structure" answeredCount={0} totalCount={1} lastSavedAt={null} />
        <div className="mt-8 flex flex-col items-center justify-center py-16 px-6 rounded-xl border-2 border-dashed border-gray-200 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No team members yet</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-sm">
            Add your team members first, then come back here to build the org chart.
          </p>
          <Link
            href="/portal/people/team"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#141414] text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Add team members <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Canvas board ───────────────────────────────────────────────────────────

  return (
    <div>
      <SectionProgressHeader
        title="Company Structure"
        answeredCount={filledCount}
        totalCount={members.length}
        lastSavedAt={null}
      />

      <div className="mt-4 flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          Drag cards to arrange. Set who each person reports to with the dropdown — arrows will draw automatically.
        </p>
        <button
          onClick={handleAutoArrange}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ml-4"
        >
          <Maximize2 className="w-3.5 h-3.5" /> Auto-arrange
        </button>
      </div>

      {/* Board canvas */}
      <div
        className="rounded-xl border border-gray-200 shadow-sm overflow-auto bg-[#f9fafb]"
        style={{ maxHeight: "65vh" }}
      >
        <div
          ref={canvasRef}
          className="relative"
          style={{
            width:  canvasSize.w,
            height: canvasSize.h,
            // Miro-style dot grid
            backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
            backgroundSize:  "40px 40px",
          }}
        >
          {/* SVG layer: arrows + smart guides */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              overflow: "visible",
            }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#9ca3af" />
              </marker>
            </defs>

            {/* Bezier arrows */}
            {members.map((m) => {
              const managerId = reportingLines[m.id];
              if (!managerId) return null;
              const fromPos = positions[managerId];
              const toPos   = positions[m.id];
              if (!fromPos || !toPos) return null;
              return <Arrow key={`${managerId}-${m.id}`} fromPos={fromPos} toPos={toPos} />;
            })}

            {/* Smart alignment / equal-spacing guides */}
            {draggingId && guides.map((g, i) =>
              g.type === "v" ? (
                <line
                  key={i}
                  x1={g.at} y1={g.extent[0]} x2={g.at} y2={g.extent[1]}
                  stroke={g.isEqual ? "#14b8a6" : "#f43f5e"}
                  strokeWidth={1}
                  strokeDasharray={g.isEqual ? "4 3" : "0"}
                  opacity={0.85}
                />
              ) : (
                <line
                  key={i}
                  x1={g.extent[0]} y1={g.at} x2={g.extent[1]} y2={g.at}
                  stroke={g.isEqual ? "#14b8a6" : "#f43f5e"}
                  strokeWidth={1}
                  strokeDasharray={g.isEqual ? "4 3" : "0"}
                  opacity={0.85}
                />
              )
            )}
          </svg>

          {/* Draggable member cards */}
          {members.map((member) => {
            const pos    = positions[member.id] ?? { x: 24, y: 24 };
            const isRoot = !reportingLines[member.id];
            return (
              <MemberCard
                key={member.id}
                member={member}
                pos={pos}
                reportsToId={reportingLines[member.id] ?? null}
                members={members}
                isRoot={isRoot}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onReportsToChange={handleReportsToChange}
                canvasRef={canvasRef}
              />
            );
          })}
        </div>
      </div>

      {filledCount > 0 && (
        <div className="mt-6">
          <WhatsNext
            completedTitle="Company Structure"
            nextTitle="Team Capability Tracker"
            nextHref="/portal/people/methodology"
            nextDescription="Assign skill levels and training priorities to each team member"
          />
        </div>
      )}
    </div>
  );
}
