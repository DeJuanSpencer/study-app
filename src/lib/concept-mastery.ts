import {
  UnderstandingLevel,
  StudyMode,
  ConceptMastery,
  Deck,
} from "./types";

const MODE_CEILING: Record<StudyMode, UnderstandingLevel> = {
  review: 2,
  explain: 3,
  socratic: 4,
  synthesis: 5,
};

export function calculateNewLevel(
  currentLevel: UnderstandingLevel,
  mode: StudyMode,
  score?: number
): UnderstandingLevel {
  const ceiling = MODE_CEILING[mode];
  const passed = score === undefined || score >= 70;
  if (passed && ceiling > currentLevel) {
    return Math.min(currentLevel + 1, ceiling) as UnderstandingLevel;
  }
  return currentLevel;
}

export function getRecommendedMode(mastery: ConceptMastery): StudyMode {
  switch (mastery.level) {
    case 0:
    case 1:
      return "review";
    case 2:
      return "explain";
    case 3:
      return "socratic";
    case 4:
      return "synthesis";
    case 5:
      return "review";
    default:
      return "review";
  }
}

export interface DeckConcept {
  id: string;
  name: string;
  description: string;
  cardCount: number;
}

export function deriveConceptsFromDeck(deck: Deck): DeckConcept[] {
  const conceptMap = new Map<string, { cards: number; desc: string }>();

  for (const card of deck.cards) {
    const existing = conceptMap.get(card.concept);
    if (existing) {
      existing.cards++;
    } else {
      conceptMap.set(card.concept, {
        cards: 1,
        desc: card.answer.slice(0, 120),
      });
    }
  }

  return Array.from(conceptMap.entries()).map(([name, info]) => ({
    id: slugify(name),
    name,
    description: info.desc,
    cardCount: info.cards,
  }));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
