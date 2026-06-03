"use client";

import { useState, useCallback } from "react";
import { EvaluationResult, AITone } from "@/lib/types";

type ExplainPhase = "prompt" | "writing" | "evaluating" | "feedback";

export function useExplainMode(
  concept: string,
  deckId: string,
  tone: AITone = "supportive"
) {
  const [phase, setPhase] = useState<ExplainPhase>("prompt");
  const [response, setResponse] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!response.trim()) return;

    setPhase("evaluating");
    setError(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept,
          studentResponse: response,
          tone,
          mode: "explain",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Evaluation failed");
      }

      const result: EvaluationResult = await res.json();
      setEvaluation(result);
      setPhase("feedback");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
      setPhase("writing");
    }
  }, [concept, response, tone]);

  const reset = useCallback(() => {
    setPhase("prompt");
    setResponse("");
    setEvaluation(null);
    setError(null);
  }, []);

  return {
    phase,
    response,
    evaluation,
    error,
    setResponse: (text: string) => {
      setResponse(text);
      if (phase === "prompt" && text.trim()) setPhase("writing");
    },
    submit,
    reset,
  };
}
