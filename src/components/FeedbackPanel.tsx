"use client";

import { useState, useEffect } from "react";
import { EvaluationResult, AITone } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ScoreRing from "./ScoreRing";
import FeedbackCard from "./FeedbackCard";
import { cn } from "@/lib/utils";

const TONE_LABELS: Record<
  AITone,
  { scoreHigh: string; scoreMid: string; scoreLow: string; intro: string }
> = {
  supportive: {
    scoreHigh: "Great work!",
    scoreMid: "Good foundation — keep building.",
    scoreLow: "Nice effort — let's strengthen this together.",
    intro: "Here's what I noticed in your explanation:",
  },
  rigorous: {
    scoreHigh: "Solid.",
    scoreMid: "Acceptable, but significant gaps remain.",
    scoreLow: "This needs substantial work. Be specific.",
    intro: "Assessment:",
  },
  neutral: {
    scoreHigh: "Strong Understanding",
    scoreMid: "Good Foundation",
    scoreLow: "Keep Building",
    intro: "Feedback:",
  },
};

interface FeedbackPanelProps {
  evaluation: EvaluationResult;
  studentResponse: string;
  tone?: AITone;
  onRetry: () => void;
  onContinue: () => void;
  className?: string;
}

export default function FeedbackPanel({
  evaluation,
  studentResponse,
  tone = "supportive",
  onRetry,
  onContinue,
  className,
}: FeedbackPanelProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowDetails(true), 600);
    return () => clearTimeout(t);
  }, []);

  const labels = TONE_LABELS[tone];
  const heading =
    evaluation.score >= 80
      ? labels.scoreHigh
      : evaluation.score >= 50
        ? labels.scoreMid
        : labels.scoreLow;

  return (
    <div className={cn("space-y-5", className)}>
      <Card className="p-6 flex items-center gap-6">
        <ScoreRing score={evaluation.score} size={80} strokeWidth={6} />
        <div className="flex-1">
          <h3 className="text-lg font-heading font-semibold m-0">
            {heading}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1 m-0">
            {labels.intro}
          </p>
        </div>
      </Card>

      <div>
        <p
          className="text-xs font-mono uppercase tracking-widest mb-2"
          style={{ color: "var(--text-tertiary, var(--muted-foreground))" }}
        >
          Your Response
        </p>
        <Card
          className="p-4"
          style={{
            background: "var(--secondary)",
            borderStyle: "dashed",
          }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed m-0">
            {studentResponse}
          </p>
        </Card>
      </div>

      <div
        className={cn(
          "flex flex-col gap-3 transition-opacity duration-500",
          showDetails ? "opacity-100" : "opacity-0"
        )}
      >
        {evaluation.strengths.map((s, i) => (
          <FeedbackCard key={`s${i}`} type="strength">
            {s}
          </FeedbackCard>
        ))}
        {evaluation.gaps.map((g, i) => (
          <FeedbackCard key={`g${i}`} type="gap">
            {g}
          </FeedbackCard>
        ))}
        {evaluation.corrections.map((c, i) => (
          <FeedbackCard key={`c${i}`} type="correction">
            {c}
          </FeedbackCard>
        ))}
        <FeedbackCard type="insight">{evaluation.nextStep}</FeedbackCard>
      </div>

      <div className="flex justify-center gap-3 pt-2">
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
        <Button onClick={onContinue}>Continue Studying</Button>
      </div>
    </div>
  );
}
