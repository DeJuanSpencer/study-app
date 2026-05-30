"use client";

import { useState, useCallback, useMemo } from "react";
import { FlashCard, Grade, CardResult, StudySessionResult } from "@/lib/types";
import { saveSessionResult } from "@/lib/storage";

interface StudySessionState {
  currentIndex: number;
  isRevealed: boolean;
  results: CardResult[];
  queue: FlashCard[];
  isComplete: boolean;
}

export function useStudySession(deckId: string, cards: FlashCard[]) {
  const [state, setState] = useState<StudySessionState>(() => ({
    currentIndex: 0,
    isRevealed: false,
    results: [],
    queue: shuffleArray([...cards]),
    isComplete: false,
  }));

  const currentCard = state.queue[state.currentIndex] ?? null;

  const progress = useMemo(() => {
    if (state.queue.length === 0) return 0;
    return (state.currentIndex / state.queue.length) * 100;
  }, [state.currentIndex, state.queue.length]);

  const reveal = useCallback(() => {
    setState((prev) => ({ ...prev, isRevealed: true }));
  }, []);

  const grade = useCallback(
    (g: Grade) => {
      if (!currentCard) return;

      setState((prev) => {
        const newResults = [
          ...prev.results,
          { cardId: currentCard.id, grade: g },
        ];
        const nextIndex = prev.currentIndex + 1;

        let newQueue = [...prev.queue];
        if (g === "missed-it") {
          const insertPos = Math.min(
            nextIndex + 3 + Math.floor(Math.random() * 3),
            newQueue.length
          );
          newQueue.splice(insertPos, 0, currentCard);
        }

        const isComplete = nextIndex >= newQueue.length;

        if (isComplete) {
          const weakConcepts = computeWeakConcepts(newResults, cards);
          const sessionResult: StudySessionResult = {
            deckId,
            completedAt: new Date().toISOString(),
            cardsReviewed: newResults.length,
            results: newResults,
            weakConcepts,
          };
          saveSessionResult(sessionResult);
        }

        return {
          ...prev,
          results: newResults,
          queue: newQueue,
          currentIndex: nextIndex,
          isRevealed: false,
          isComplete,
        };
      });
    },
    [currentCard, cards, deckId]
  );

  const restart = useCallback(() => {
    setState({
      currentIndex: 0,
      isRevealed: false,
      results: [],
      queue: shuffleArray([...cards]),
      isComplete: false,
    });
  }, [cards]);

  const sessionResult = useMemo((): StudySessionResult | null => {
    if (!state.isComplete) return null;
    return {
      deckId,
      completedAt: new Date().toISOString(),
      cardsReviewed: state.results.length,
      results: state.results,
      weakConcepts: computeWeakConcepts(state.results, cards),
    };
  }, [state.isComplete, state.results, deckId, cards]);

  return {
    currentCard,
    isRevealed: state.isRevealed,
    isComplete: state.isComplete,
    progress,
    cardsRemaining: state.queue.length - state.currentIndex,
    totalCards: state.queue.length,
    currentIndex: state.currentIndex,
    reveal,
    grade,
    restart,
    sessionResult,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function computeWeakConcepts(
  results: CardResult[],
  cards: FlashCard[]
): string[] {
  const conceptScores: Record<string, { correct: number; total: number }> = {};

  for (const result of results) {
    const card = cards.find((c) => c.id === result.cardId);
    if (!card) continue;

    if (!conceptScores[card.concept]) {
      conceptScores[card.concept] = { correct: 0, total: 0 };
    }
    conceptScores[card.concept].total++;
    if (result.grade === "got-it") {
      conceptScores[card.concept].correct++;
    }
  }

  return Object.entries(conceptScores)
    .filter(([, score]) => score.correct / score.total < 0.7)
    .map(([concept]) => concept);
}
