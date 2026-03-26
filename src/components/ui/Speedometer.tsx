/**
 * Speedometer — SVG arc gauge for company maturity score (0–100).
 * Five zones: Not Started / Early Stage / Developing / Progressing / Advanced
 */
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpeedometerProps {
  percent: number;
  size?: number;
  className?: string;
}

const ZONES = [
  { label: "Not Started",  color: "#e2e8f0", min: 0,  max: 20  },
  { label: "Early Stage",  color: "#fca5a5", min: 20, max: 40  },
  { label: "Developing",   color: "#fcd34d", min: 40, max: 60  },
  { label: "Progressing",  color: "#86efac", min: 60, max: 80  },
  { label: "Advanced",     color: "#34d399", min: 80, max: 100 },
];

function getZone(percent: number) {
  return ZONES.findLast((z) => percent >= z.min) ?? ZONES[0];
}

/** Convert polar angle (degrees, 0=right) to Cartesian, centred at (cx,cy) r=radius */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** SVG arc path for a gauge segment */
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

export function Speedometer({ percent, size = 200, className }: SpeedometerProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const zone = getZone(clampedPercent);

  const cx = size / 2;
  const cy = size / 2 + size * 0.1; // shift centre down slightly so arc sits in upper portion
  const outerR = size * 0.42;
  const trackThickness = size * 0.09;
  const innerR = outerR - trackThickness;

  // Arc spans 210΄ (-210 to 30, i.e. 210↗ CCW from bottom-left to bottom-right)
  const START_DEG = 210; // bottom-left
  const END_DEG = 330;   // bottom-right  (210 → 330 = 120° total... let's use 200° sweep)
  // Better: 200° arc centred at top. Start=200°, End=340°  
  // We'll use: startDeg=210°, sweep=180° across the top, so endDeg=210+180=390→30°
  // Simpler convention used here: start=210°, end=150° going clockwise (200° sweep through top)
  // SVG arc: large-arc=1, sweep=1 (clockwise)
  const ARC_START = 210; // degrees on unit circle
  // 200° total sweep clockwise from 210°
  const ARC_SWEEP = 180;
  const ARC_END = ARC_START - ARC_SWEEP; // 30°

  // Needle angle: maps 0% → ARC_START, 100% → ARC_END
  const needleAngle = ARC_START - (clampedPercent / 100) * ARC_SWEEP;

  const strokeWidth = trackThickness;
  const zoneCount = ZONES.length;
  const degPerZone = ARC_SWEEP / zoneCount;

  // Needle tip and base points
  const needleLength = outerR - 2;
  const needleTip = polar(cx, cy, needleLength, needleAngle);
  const needleBase1 = polar(cx, cy, size * 0.04, needleAngle + 90);
  const needleBase2 = polar(cx, cy, size * 0.04, needleAngle - 90);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size * 0.65}
        viewBox={`0 0 ${size} ${size * 0.65}`}
        aria-label={`Company maturity ${clampedPercent}%`}
      >
        {/* Zone arcs */}
        {ZONES.map((z, i) => {
          const segStart = ARC_START - i * degPerZone;
          const segEnd   = segStart - degPerZone;
          return (
            <path
              key={z.label}
              d={arcPathThick(cx, cy, innerR, outerR, segStart, segEnd)}
              fill={z.color}
              opacity={0.9}
            />
          );
        })}

        {/* Track inner ring (overlay to create donut illusion with background) */}
        <circle cx={cx} cy={cy} r={innerR - 1} fill="white" />

        {/* Progress arc overlay to show fill up to current value */}
        {clampedPercent > 0 && (
          <path
            d={arcPathThick(cx, cy, innerR, outerR, ARC_START, needleAngle)}
            fill="none"
            stroke="transparent"
          />
        )}

        {/* Needle */}
        <motion.polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill="#0f172a"
          initial={{ rotate: 0, originX: `${cx}px`, originY: `${cy}px` }}
          animate={{ rotate: -(clampedPercent / 100) * ARC_SWEEP }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          transition={{ duration: 1.0, ease: "easeOut", delay: 0.3 }}
        />

        {/* Needle hub */}
        <circle cx={cx} cy={cy} r={size * 0.038} fill="#0f172a" />
        <circle cx={cx} cy={cy} r={size * 0.018} fill="white" />

        {/* Zone labels — min/max tick marks */}
        <text
          x={polar(cx, cy, outerR + size * 0.05, ARC_START).x}
          y={polar(cx, cy, outerR + size * 0.05, ARC_START).y}
          textAnchor="middle"
          fontSize={size * 0.065}
          fill="#94a3b8"
        >
          0
        </text>
        <text
          x={polar(cx, cy, outerR + size * 0.05, ARC_END).x}
          y={polar(cx, cy, outerR + size * 0.05, ARC_END).y}
          textAnchor="middle"
          fontSize={size * 0.065}
          fill="#94a3b8"
        >
          100
        </text>
      </svg>

      {/* Score readout */}
      <div className="text-center -mt-2">
        <div
          className="text-4xl font-extrabold tabular-nums"
          style={{ color: zone.color === "#e2e8f0" ? "#94a3b8" : zone.color, letterSpacing: "-0.04em" }}
        >
          {clampedPercent}
          <span className="text-xl font-semibold">%</span>
        </div>
        <div
          className="text-xs font-semibold uppercase tracking-widest mt-0.5"
          style={{ color: zone.color === "#e2e8f0" ? "#94a3b8" : zone.color }}
        >
          {zone.label}
        </div>
      </div>
    </div>
  );
}

/** Build a thick arc path (filled band between innerR and outerR) */
function arcPathThick(
  cx: number, cy: number,
  innerR: number, outerR: number,
  startDeg: number, endDeg: number
) {
  // Clockwise from startDeg to endDeg (endDeg < startDeg since we go CCW on unit circle)
  // Using SVG coordinates (y down), sweep-flag=0 is CCW in screen space
  const os = polar(cx, cy, outerR, startDeg);
  const oe = polar(cx, cy, outerR, endDeg);
  const ie = polar(cx, cy, innerR, endDeg);
  const is_ = polar(cx, cy, innerR, startDeg);
  const sweep = endDeg < startDeg ? 1 : 0; // clockwise in screen SVG
  const diff = Math.abs(startDeg - endDeg);
  const large = diff > 180 ? 1 : 0;
  return [
    `M ${os.x} ${os.y}`,
    `A ${outerR} ${outerR} 0 ${large} ${sweep} ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${innerR} ${innerR} 0 ${large} ${1 - sweep} ${is_.x} ${is_.y}`,
    "Z",
  ].join(" ");
}
