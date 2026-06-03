"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Deck, EvaluationResult } from "@/lib/types";
import { useConceptMastery } from "@/hooks/useConceptMastery";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AIAvatar from "./AIAvatar";
import TypingIndicator from "./TypingIndicator";
import FeedbackPanel from "./FeedbackPanel";

interface SynthesisSessionProps {
  deck: Deck;
}

type SynthesisPhase = "prompt" | "evaluating" | "feedback";

export default function SynthesisSession({ deck }: SynthesisSessionProps) {
  const router = useRouter();
  const { concepts, updateMastery } = useConceptMastery(deck);
  const [phase, setPhase] = useState<SynthesisPhase>("prompt");
  const [response, setResponse] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eligible = concepts.filter((c) => c.level >= 2);
  const selected = eligible.slice(0, 3);

  const handleSubmit = useCallback(async () => {
    if (!response.trim()) return;

    setPhase("evaluating");
    setError(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentResponse: response,
          mode: "synthesis",
          concepts: selected.map((c) => c.name),
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
      setPhase("prompt");
    }
  }, [response, selected]);

  const handleContinue = () => {
    if (evaluation) {
      for (const c of selected) {
        updateMastery(c.name, "synthesis", evaluation.score);
      }
    }
    router.push(`/study?id=${deck.id}`);
  };

  const handleRetry = () => {
    setPhase("prompt");
    setResponse("");
    setEvaluation(null);
    setError(null);
  };

  if (selected.length < 2) {
    return (
      <div className="max-w-[720px] mx-auto">
        <Card className="text-center py-12 px-6">
          <h3 className="text-lg font-heading font-semibold mb-2">
            Not enough concepts ready
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Synthesis Lab requires at least 2 concepts at Recalled level or
            higher. Keep studying with Explain Mode and Socratic Challenge to
            unlock this mode.
          </p>
          <Button onClick={() => router.push(`/study?id=${deck.id}`)}>
            Back to Study Hub
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/study?id=${deck.id}`)}
        >
          ← Back
        </Button>
        <div className="flex-1" />
        <Badge variant="outline" className="border-primary text-primary">
          Synthesis Lab
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {selected.map((c) => (
          <Card key={c.name} className="p-4 text-center">
            <p className="text-sm font-semibold text-foreground mb-1.5">
              {c.name}
            </p>
            <p className="text-xs text-muted-foreground leading-snug">
              {c.description}
            </p>
          </Card>
        ))}
      </div>

      <Card
        className="mb-6 p-6"
        style={{ borderLeft: "3px solid var(--primary)" }}
      >
        <div className="flex items-start gap-3.5">
          <AIAvatar size="md" />
          <div>
            <p className="text-[17px] font-heading font-semibold text-foreground leading-relaxed mb-1.5">
              How do these {selected.length} concepts work together? What
              happens if you remove one?
            </p>
            <p className="text-[13px] text-muted-foreground italic">
              Don&apos;t just describe each concept &mdash; explain the relationships and
              dependencies between them.
            </p>
          </div>
        </div>
      </Card>

      {phase === "prompt" && (
        <div>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Describe how these concepts connect, reinforce, or depend on each other..."
            rows={7}
            className="text-[15px] leading-relaxed rounded-[10px] mb-3.5"
          />
          {error && (
            <p className="text-sm text-destructive mb-3">{error}</p>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={
                !response.trim() || response.trim().split(/\s+/).length < 10
              }
            >
              Submit Synthesis
            </Button>
          </div>
        </div>
      )}

      {phase === "evaluating" && (
        <Card className="text-center py-12 px-6">
          <div className="flex justify-center mb-4">
            <AIAvatar size="lg" />
          </div>
          <p className="text-[15px] text-muted-foreground mb-3">
            Evaluating your synthesis...
          </p>
          <div className="flex justify-center">
            <TypingIndicator />
          </div>
        </Card>
      )}

      {phase === "feedback" && evaluation && (
        <FeedbackPanel
          evaluation={evaluation}
          studentResponse={response}
          onRetry={handleRetry}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
