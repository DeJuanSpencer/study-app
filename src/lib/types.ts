export interface MaterialSection {
  heading: string;
  content: string;
  order: number;
}

export interface MaterialMetadata {
  sourceType: "pdf" | "docx" | "pptx" | "text";
  fileName: string;
  uploadedAt: string;
}

export interface ParsedMaterial {
  title: string;
  sections: MaterialSection[];
  rawText: string;
  metadata: MaterialMetadata;
}

export type Difficulty = "foundational" | "intermediate" | "advanced";

export interface FlashCard {
  id: string;
  question: string;
  answer: string;
  concept: string;
  difficulty: Difficulty;
  sourceSection: string;
  flagged?: "too-easy" | "unclear";
}

export interface Deck {
  id: string;
  title: string;
  cards: FlashCard[];
  createdAt: string;
  materialMetadata: MaterialMetadata;
}

export type Grade = "got-it" | "partially" | "missed-it";

export interface CardResult {
  cardId: string;
  grade: Grade;
}

export interface StudySessionResult {
  deckId: string;
  completedAt: string;
  cardsReviewed: number;
  results: CardResult[];
  weakConcepts: string[];
}

export interface ConceptExplanation {
  concept: string;
  plainLanguage: string;
  technical: string;
  anchoringExample: string;
  commonMisconceptions: string;
  depth: number;
}
