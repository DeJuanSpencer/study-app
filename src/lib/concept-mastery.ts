import {
  UnderstandingLevel,
  StudyMode,
  ConceptMastery,
  Deck,
  Grade,
  SocraticSummary,
} from "./types";

export function calculateNewLevel(
  current: UnderstandingLevel,
  mode: StudyMode,
  result: {
    grade?: Grade;
    score?: number;
    summary?: SocraticSummary;
  }
): UnderstandingLevel {
  switch (mode) {
    case "review":
      if (result.grade === "got-it" && current < 2) return 2;
      if (result.grade === "partially" && current < 1) return 1;
      if (result.grade === "missed-it" && current < 1) return 1;
      return current;

    case "explain":
      if (result.score !== undefined && result.score >= 70 && current < 3)
        return 3;
      return current;

    case "socratic":
      if (
        result.summary &&
        result.summary.demonstrated.length >= 2 &&
        current < 4
      )
        return 4;
      return current;

    case "synthesis":
      if (result.score !== undefined && result.score >= 70 && current < 5)
        return 5;
      return current;

    default:
      return current;
  }
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

export interface Recommendation {
  mode: StudyMode;
  concepts: ConceptMastery[];
  message: string;
}

function daysSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

export function generateRecommendation(
  concepts: ConceptMastery[]
): Recommendation {
  const byLevel: Record<number, ConceptMastery[]> = {};
  for (const c of concepts) {
    (byLevel[c.level] ??= []).push(c);
  }

  const staleLevel2 = (byLevel[2] ?? []).filter(
    (c) => daysSince(c.updatedAt) >= 1
  );
  if (staleLevel2.length > 0) {
    return {
      mode: "explain",
      concepts: staleLevel2.slice(0, 3),
      message: `${staleLevel2.length} concept(s) are at "Recalled" level — you've self-graded these as known, but haven't proven it yet. Try Explain Mode to demonstrate real understanding.`,
    };
  }

  const readyForSocratic = (byLevel[3] ?? []).filter(
    (c) => daysSince(c.updatedAt) >= 1
  );
  if (readyForSocratic.length > 0) {
    return {
      mode: "socratic",
      concepts: readyForSocratic.slice(0, 2),
      message: `You've explained ${readyForSocratic.length} concept(s) well. Ready to go deeper? Socratic Challenge will push your reasoning.`,
    };
  }

  const synthesisReady = concepts.filter((c) => c.level >= 3);
  if (synthesisReady.length >= 2) {
    return {
      mode: "synthesis",
      concepts: synthesisReady.slice(0, 3),
      message: `You have ${synthesisReady.length} concepts at "Explained" or higher. Try connecting them in Synthesis Lab.`,
    };
  }

  const needsReview = concepts.filter((c) => c.level <= 1);
  if (needsReview.length > 0) {
    return {
      mode: "review",
      concepts: needsReview,
      message: `${needsReview.length} concept(s) are new or barely started. Quick Review will build your foundation.`,
    };
  }

  return {
    mode: "synthesis",
    concepts: concepts.slice(0, 3),
    message:
      "Great progress! Keep connecting concepts to strengthen your understanding.",
  };
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
    const concept = card.concept || "General";
    const existing = conceptMap.get(concept);
    if (existing) {
      existing.cards++;
    } else {
      conceptMap.set(concept, {
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
