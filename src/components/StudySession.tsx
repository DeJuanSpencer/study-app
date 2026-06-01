"use client";

import { useState } from "react";
import { Check, Minus, X, Eye, Lightbulb, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FlashCard from "./FlashCard";
import SessionSummary from "./SessionSummary";
import ConceptExplainer from "./ConceptExplainer";
import { useStudySession } from "@/hooks/useStudySession";
import { Deck } from "@/lib/types";

interface StudySessionProps {
  deck: Deck;
}

export default function StudySession({ deck }: StudySessionProps) {
  const [explainConcept, setExplainConcept] = useState<string | null>(null);

  const {
    currentCard,
    isRevealed,
    isComplete,
    progress,
    cardsRemaining,
    totalCards,
    currentIndex,
    reveal,
    grade,
    restart,
    sessionResult,
    tierStatus,
    dueCount,
  } = useStudySession(deck.id, deck.cards);

  if (isComplete && sessionResult) {
    return (
      <SessionSummary
        result={sessionResult}
        deck={deck}
        onRestart={restart}
      />
    );
  }

  if (!currentCard) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Card {currentIndex + 1} of {totalCards}
          </span>
          <span>{cardsRemaining} remaining</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs capitalize">
            {tierStatus.active} level
          </Badge>
          {dueCount > 0 && (
            <span className="text-amber-400">{dueCount} due for review</span>
          )}
          {!tierStatus.intermediateUnlocked && tierStatus.foundationalTotal > 0 && (
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Intermediate: {tierStatus.foundationalMastered}/{Math.ceil(tierStatus.foundationalTotal * 0.6)} to unlock
            </span>
          )}
          {tierStatus.intermediateUnlocked && !tierStatus.advancedUnlocked && tierStatus.intermediateTotal > 0 && (
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Advanced: {tierStatus.intermediateMastered}/{Math.ceil(tierStatus.intermediateTotal * 0.6)} to unlock
            </span>
          )}
          {tierStatus.advancedUnlocked && tierStatus.intermediateTotal > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Unlock className="h-3 w-3" />
              All levels unlocked
            </span>
          )}
        </div>
      </div>

      <FlashCard card={currentCard} showAnswer={isRevealed} />

      <div className="flex justify-center gap-3">
        {!isRevealed ? (
          <Button size="lg" onClick={reveal} className="min-w-[200px]">
            <Eye className="h-4 w-4 mr-2" />
            Reveal Answer
          </Button>
        ) : (
          <>
            <Button
              size="lg"
              variant="outline"
              onClick={() => grade("missed-it")}
              className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
            >
              <X className="h-4 w-4 mr-1.5" />
              Missed it
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => grade("partially")}
              className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            >
              <Minus className="h-4 w-4 mr-1.5" />
              Partially
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => grade("got-it")}
              className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Got it
            </Button>
          </>
        )}
      </div>

      {isRevealed && currentCard && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setExplainConcept(currentCard.concept)}
          >
            <Lightbulb className="h-4 w-4 mr-1.5" />
            Explain this concept
          </Button>
        </div>
      )}

      <Dialog
        open={!!explainConcept}
        onOpenChange={(open) => !open && setExplainConcept(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Concept Explainer</DialogTitle>
          </DialogHeader>
          {explainConcept && (
            <ConceptExplainer key={explainConcept} concept={explainConcept} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
