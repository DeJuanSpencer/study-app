"use client";

import { useEffect } from "react";

type ProcessingStatus = "parsing" | "generating" | "validating" | "done" | "error";

const STEPS = [
  { key: "parsing", label: "Reading your material", emoji: "📖" },
  { key: "generating", label: "Building study cards", emoji: "🧠" },
  { key: "validating", label: "Fact-checking & mapping concepts", emoji: "✓" },
] as const;

const PROGRESS_MAP: Record<string, number> = {
  parsing: 15,
  generating: 50,
  validating: 80,
  done: 100,
};

interface ProcessingViewProps {
  status: ProcessingStatus;
  fileName: string;
  error?: string | null;
  onRetry?: () => void;
  onComplete?: () => void;
}

export default function ProcessingView({
  status,
  fileName,
  error,
  onRetry,
  onComplete,
}: ProcessingViewProps) {
  const stepIndex = STEPS.findIndex((s) => s.key === status);
  const progress = PROGRESS_MAP[status] ?? 0;

  useEffect(() => {
    if (status === "done" && onComplete) {
      const t = setTimeout(onComplete, 1500);
      return () => clearTimeout(t);
    }
  }, [status, onComplete]);

  if (status === "done") {
    return (
      <div className="max-w-[480px] mx-auto text-center py-20">
        <div
          className="w-[72px] h-[72px] rounded-full mx-auto mb-5 flex items-center justify-center text-[32px]"
          style={{ background: "var(--success-surface, var(--secondary))" }}
        >
          ✦
        </div>
        <h3 className="text-2xl font-heading font-semibold text-foreground mb-2">
          Deck ready
        </h3>
        <p className="text-sm text-muted-foreground">
          Redirecting to your new deck...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-[480px] mx-auto text-center py-20">
        <div className="w-[72px] h-[72px] rounded-full mx-auto mb-5 flex items-center justify-center text-[32px] bg-destructive/10">
          !
        </div>
        <h3 className="text-2xl font-heading font-semibold text-foreground mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {error || "Failed to process your material"}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-[10px] text-sm font-semibold transition-opacity"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const currentEmoji =
    stepIndex >= 0 ? STEPS[stepIndex].emoji : STEPS[0].emoji;

  return (
    <div className="max-w-[480px] mx-auto text-center py-20">
      <div
        className="w-[72px] h-[72px] rounded-full mx-auto mb-7 flex items-center justify-center text-[30px] animate-pulse"
        style={{ background: "var(--accent)" }}
      >
        {currentEmoji}
      </div>

      <h3 className="text-[22px] font-heading font-semibold text-foreground mb-1.5">
        {stepIndex >= 0 ? STEPS[stepIndex].label : "Processing..."}
      </h3>
      <p className="text-[13px] text-muted-foreground font-mono mb-8">
        {fileName}
      </p>

      <div
        className="h-2 rounded-md overflow-hidden mb-7"
        style={{ background: "var(--secondary)" }}
      >
        <div
          className="h-full rounded-md transition-[width] duration-300 ease-linear"
          style={{ background: "var(--primary)", width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col gap-3 text-left">
        {STEPS.map((step, i) => {
          const done = i < stepIndex;
          const current = i === stepIndex;
          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={{
                  background: done
                    ? "var(--success)"
                    : current
                      ? "var(--primary)"
                      : "var(--secondary)",
                  color: done || current
                    ? "var(--primary-foreground)"
                    : "var(--muted-foreground)",
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className="text-sm transition-all duration-300"
                style={{
                  color: done
                    ? "var(--muted-foreground)"
                    : current
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                  fontWeight: current ? 600 : 400,
                  textDecoration: done ? "line-through" : "none",
                  opacity: !done && !current ? 0.5 : 1,
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
