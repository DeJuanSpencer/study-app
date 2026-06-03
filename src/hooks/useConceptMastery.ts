"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ConceptMastery,
  StudyMode,
  UnderstandingLevel,
  Grade,
  SocraticSummary,
  Deck,
} from "@/lib/types";
import { loadConceptMastery, saveConceptMastery } from "@/lib/storage";
import {
  calculateNewLevel,
  getRecommendedMode,
  generateRecommendation,
  deriveConceptsFromDeck,
  Recommendation,
} from "@/lib/concept-mastery";

function initializeConceptMastery(deck: Deck): void {
  const existing = loadConceptMastery(deck.id);
  const existingNames = new Set(existing.map((m) => m.conceptName));
  const concepts = deriveConceptsFromDeck(deck);

  for (const concept of concepts) {
    if (!existingNames.has(concept.name)) {
      saveConceptMastery({
        conceptId: concept.id,
        conceptName: concept.name,
        deckId: deck.id,
        level: 0,
        lastMode: null,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

export function useConceptMastery(deck: Deck) {
  const [version, setVersion] = useState(() => {
    initializeConceptMastery(deck);
    return 0;
  });

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
    (
      conceptName: string,
      mode: StudyMode,
      result: {
        grade?: Grade;
        score?: number;
        summary?: SocraticSummary;
      } = {}
    ) => {
      const existing = getMastery(conceptName);
      const currentLevel = (existing?.level ?? 0) as UnderstandingLevel;
      const newLevel = calculateNewLevel(currentLevel, mode, result);

      const concept = deckConcepts.find((c) => c.name === conceptName);
      const updated: ConceptMastery = {
        conceptId:
          concept?.id ?? conceptName.toLowerCase().replace(/\s+/g, "-"),
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

  const recommendation: Recommendation = useMemo(
    () => generateRecommendation(masteries),
    [masteries]
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
    recommendation,
  };
}
