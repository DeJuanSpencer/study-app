"use client";

import { useState, useCallback, useMemo } from "react";
import { ConceptMastery, StudyMode, UnderstandingLevel } from "@/lib/types";
import { loadConceptMastery, saveConceptMastery } from "@/lib/storage";
import {
  calculateNewLevel,
  getRecommendedMode,
  deriveConceptsFromDeck,
} from "@/lib/concept-mastery";
import { Deck } from "@/lib/types";

export function useConceptMastery(deck: Deck) {
  const [version, setVersion] = useState(0);

  const masteries = useMemo(
    () => loadConceptMastery(deck.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck.id, version]
  );

  const deckConcepts = useMemo(() => deriveConceptsFromDeck(deck), [deck]);

  const getMastery = useCallback(
    (conceptName: string): ConceptMastery | null => {
      return (
        masteries.find(
          (m) => m.conceptName === conceptName && m.deckId === deck.id
        ) ?? null
      );
    },
    [masteries, deck.id]
  );

  const getLevel = useCallback(
    (conceptName: string): UnderstandingLevel => {
      return getMastery(conceptName)?.level ?? 0;
    },
    [getMastery]
  );

  const updateMastery = useCallback(
    (conceptName: string, mode: StudyMode, score?: number) => {
      const existing = getMastery(conceptName);
      const currentLevel = existing?.level ?? 0;
      const newLevel = calculateNewLevel(
        currentLevel as UnderstandingLevel,
        mode,
        score
      );

      const concept = deckConcepts.find((c) => c.name === conceptName);
      const updated: ConceptMastery = {
        conceptId: concept?.id ?? conceptName.toLowerCase().replace(/\s+/g, "-"),
        conceptName,
        deckId: deck.id,
        level: newLevel,
        lastMode: mode,
        updatedAt: new Date().toISOString(),
      };

      saveConceptMastery(updated);
      setVersion((v) => v + 1);
    },
    [getMastery, deck.id, deckConcepts]
  );

  const getRecommendation = useCallback(
    (conceptName: string): StudyMode => {
      const mastery = getMastery(conceptName);
      if (!mastery) return "review";
      return getRecommendedMode(mastery);
    },
    [getMastery]
  );

  const conceptsWithMastery = useMemo(
    () =>
      deckConcepts.map((c) => ({
        ...c,
        level: getLevel(c.name),
        recommendation: getRecommendation(c.name),
      })),
    [deckConcepts, getLevel, getRecommendation]
  );

  return {
    concepts: conceptsWithMastery,
    masteries,
    loaded: true,
    getMastery,
    getLevel,
    updateMastery,
    getRecommendation,
  };
}
