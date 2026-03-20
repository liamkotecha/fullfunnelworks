/**
 * CompletionBurst — particle animation when a sub-section reaches 100%.
 * 12–16 small circles radiate outward from the progress bar's end point.
 * Tasteful brand-colour burst lasting 1.2s, then unmounts.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CompletionBurstProps {
  /** When this flips to true, fire the burst */
  trigger: boolean;
  /** Accent colour for particles — defaults to brand-pink */
  color?: string;
  className?: string;
}

const PARTICLE_COUNT = 14;
const BURST_DURATION = 1.2;

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    angle: (360 / PARTICLE_COUNT) * i + randomBetween(-15, 15),
    distance: randomBetween(30, 60),
    size: randomBetween(4, 8),
    delay: randomBetween(0, 0.15),
  }));
}

export function CompletionBurst({
  trigger,
  color = "rgb(255, 118, 184)",
  className,
}: CompletionBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);

  const fire = useCallback(() => {
    setParticles(generateParticles());
    setShow(true);
    setTimeout(() => setShow(false), BURST_DURATION * 1000 + 200);
  }, []);

  // Fire on trigger change (false→true)
  const [prevTrigger, setPrevTrigger] = useState(false);
  useEffect(() => {
    if (trigger && !prevTrigger) {
      fire();
    }
    setPrevTrigger(trigger);
  }, [trigger, prevTrigger, fire]);

  return (
    <div className={`relative inline-block ${className || ""}`}>
      <AnimatePresence>
        {show &&
          particles.map((p) => {
            const radians = (p.angle * Math.PI) / 180;
            const x = Math.cos(radians) * p.distance;
            const y = Math.sin(radians) * p.distance;

            return (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x, y, scale: 0, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: BURST_DURATION,
                  delay: p.delay,
                  ease: "easeOut",
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: p.size,
                  height: p.size,
                  borderRadius: "50%",
                  backgroundColor: color,
                  marginTop: -p.size / 2,
                  marginLeft: -p.size / 2,
                  pointerEvents: "none",
                }}
              />
            );
          })}
      </AnimatePresence>
    </div>
  );
}
