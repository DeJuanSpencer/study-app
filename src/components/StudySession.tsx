"use client";

import { Check, Minus, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import FlashCard from "./FlashCard";
import SessionSummary from "./SessionSummary";
import { useStudySession } from "@/hooks/useStudySession";
import { Deck } from "@/lib/types";

interface StudySessionProps {
  deck: Deck;
}

export default function StudySession({ deck }: StudySessionProps) {
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
    </div>
  );
}
