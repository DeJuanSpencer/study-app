"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export default function ScoreRing({
  score,
  size = 64,
  strokeWidth = 5,
  label,
  className,
}: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame: number;
    let current = 0;
    const step = () => {
      current = Math.min(current + 2, score);
      setAnimatedScore(current);
      if (current < score) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animatedScore / 100) * circ;
  const color =
    score >= 80
      ? "var(--success)"
      : score >= 50
        ? "var(--warning)"
        : "var(--destructive)";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 flex-shrink-0",
        className
      )}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.15s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-bold"
            style={{ fontSize: size * 0.28, color: "var(--foreground)" }}
          >
            {animatedScore}%
          </span>
        </div>
      </div>
      {label && (
        <span
          className="font-mono text-[11px]"
          style={{ color: "var(--text-tertiary, var(--muted-foreground))" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
