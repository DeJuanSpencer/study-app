"use client";

import { useState, useCallback, useMemo } from "react";
import {
  FlashCard,
  Grade,
  CardResult,
  StudySessionResult,
  CardMastery,
  Difficulty,
} from "@/lib/types";
import { saveSessionResult, loadMastery, saveMastery } from "@/lib/storage";
import { calculateNextReview, sortByPriority, isDue } from "@/lib/srs";

interface StudySessionState {
  currentIndex: number;
  isRevealed: boolean;
  results: CardResult[];
  queue: FlashCard[];
  isComplete: boolean;
}

interface TierStatus {
  active: Difficulty;
  foundationalMastered: number;
  foundationalTotal: number;
  intermediateMastered: number;
  intermediateTotal: number;
  intermediateUnlocked: boolean;
  advancedUnlocked: boolean;
}

const UNLOCK_THRESHOLD = 0.6;

function buildAdaptiveQueue(
  cards: FlashCard[],
  masteryMap: Map<string, CardMastery>
): { queue: FlashCard[]; tierStatus: TierStatus } {
  const foundational = cards.filter((c) => c.difficulty === "foundational");
  const intermediate = cards.filter((c) => c.difficulty === "intermediate");
  const advanced = cards.filter((c) => c.difficulty === "advanced");

  const countMastered = (pool: FlashCard[]) =>
    pool.filter((c) => {
      const m = masteryMap.get(c.id);
      return m && m.lastGrade === "got-it" && m.reviewCount > 0;
    }).length;

  const foundationalMastered = countMastered(foundational);
  const intermediateMastered = countMastered(intermediate);

  const intermediateUnlocked =
    foundational.length === 0 ||
    foundationalMastered / foundational.length >= UNLOCK_THRESHOLD;
  const advancedUnlocked =
    intermediateUnlocked &&
    (intermediate.length === 0 ||
      intermediateMastered / intermediate.length >= UNLOCK_THRESHOLD);

  let eligible = [...foundational];
  if (intermediateUnlocked) eligible.push(...intermediate);
  if (advancedUnlocked) eligible.push(...advanced);

  const sortedIds = sortByPriority(
    eligible.map((c) => c.id),
    masteryMap
  );

  const cardMap = new Map(eligible.map((c) => [c.id, c]));
  const queue = sortedIds.map((id) => cardMap.get(id)!);

  const active: Difficulty = advancedUnlocked
    ? "advanced"
    : intermediateUnlocked
      ? "intermediate"
      : "foundational";

  return {
    queue,
    tierStatus: {
      active,
      foundationalMastered,
      foundationalTotal: foundational.length,
      intermediateMastered,
      intermediateTotal: intermediate.length,
      intermediateUnlocked,
      advancedUnlocked,
    },
  };
}

export function useStudySession(deckId: string, cards: FlashCard[]) {
  const masteryData = useMemo(() => {
    const data = loadMastery(deckId);
    return new Map(data.map((m) => [m.cardId, m]));
  }, [deckId]);

  const { queue: initialQueue, tierStatus: initialTierStatus } = useMemo(
    () => buildAdaptiveQueue(cards, masteryData),
    [cards, masteryData]
  );

  const [state, setState] = useState<StudySessionState>(() => ({
    currentIndex: 0,
    isRevealed: false,
    results: [],
    queue: initialQueue,
    isComplete: false,
  }));

  const [tierStatus, setTierStatus] = useState<TierStatus>(initialTierStatus);

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

      const currentMastery = masteryData.get(currentCard.id) ?? null;
      const newMastery = calculateNextReview(
        currentMastery,
        g,
        currentCard.id,
        deckId
      );
      saveMastery(newMastery);
      masteryData.set(currentCard.id, newMastery);

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

        // Check if new tiers unlocked
        const { tierStatus: updatedTiers } = buildAdaptiveQueue(
          cards,
          masteryData
        );
        setTierStatus(updatedTiers);

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
    [currentCard, cards, deckId, masteryData]
  );

  const restart = useCallback(() => {
    const freshMastery = loadMastery(deckId);
    const freshMap = new Map(freshMastery.map((m) => [m.cardId, m]));
    const { queue, tierStatus: freshTiers } = buildAdaptiveQueue(
      cards,
      freshMap
    );
    setTierStatus(freshTiers);
    setState({
      currentIndex: 0,
      isRevealed: false,
      results: [],
      queue,
      isComplete: false,
    });
  }, [cards, deckId]);

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

  const dueCount = useMemo(() => {
    let count = 0;
    for (const [, m] of masteryData) {
      if (isDue(m)) count++;
    }
    return count;
  }, [masteryData]);

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
    tierStatus,
    dueCount,
  };
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
