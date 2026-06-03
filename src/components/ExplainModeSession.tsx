"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Deck } from "@/lib/types";
import { useExplainMode } from "@/hooks/useExplainMode";
import { useConceptMastery } from "@/hooks/useConceptMastery";
import { buildSourceContext } from "@/lib/ai/source-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AIAvatar from "./AIAvatar";
import LevelBadge from "./LevelBadge";
import TypingIndicator from "./TypingIndicator";
import FeedbackPanel from "./FeedbackPanel";

interface ExplainModeSessionProps {
  deck: Deck;
  concept: string;
}

export default function ExplainModeSession({
  deck,
  concept,
}: ExplainModeSessionProps) {
  const router = useRouter();
  const sourceContext = useMemo(() => buildSourceContext(deck), [deck]);
  const { phase, response, evaluation, error, setResponse, submit, reset } =
    useExplainMode(concept, deck.id, "supportive", sourceContext);
  const { getLevel, updateMastery } = useConceptMastery(deck);
  const level = getLevel(concept);

  const handleContinue = () => {
    if (evaluation) {
      updateMastery(concept, "explain", { score: evaluation.score });
    }
    router.push(`/study?id=${deck.id}`);
  };

  const handleRetry = () => {
    reset();
  };

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
        <Badge
          variant="outline"
          className="border-primary text-primary"
        >
          Explain Mode
        </Badge>
        <LevelBadge level={level} />
      </div>

      <Card
        className="mb-6 p-6"
        style={{ borderLeft: "3px solid var(--primary)" }}
      >
        <div className="flex items-start gap-3.5">
          <AIAvatar size="md" />
          <div>
            <p className="text-[13px] font-mono text-muted-foreground mb-2">
              {concept}
            </p>
            <p className="text-[17px] font-heading font-semibold text-foreground leading-relaxed mb-2">
              Explain {concept.toLowerCase()} in your own words. What is it, why
              does it matter, and how does it connect to other ideas?
            </p>
            <p className="text-[13px] text-muted-foreground italic">
              Think about the mechanisms involved, not just the outcome.
            </p>
          </div>
        </div>
      </Card>

      {(phase === "prompt" || phase === "writing") && (
        <div>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your explanation here. Don't worry about being perfect — the goal is to articulate your understanding..."
            rows={8}
            className="text-[15px] leading-relaxed rounded-[10px] mb-3.5"
          />
          {error && (
            <p className="text-sm text-destructive mb-3">{error}</p>
          )}
          <div className="flex justify-end">
            <Button
              onClick={submit}
              disabled={!response.trim() || response.trim().split(/\s+/).length < 10}
            >
              Submit for Review
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
            Evaluating your explanation...
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
