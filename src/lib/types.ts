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
  validation?: ValidationResult;
}

export interface ConceptRelation {
  from: string;
  to: string;
  relationship: string;
}

export interface Deck {
  id: string;
  title: string;
  cards: FlashCard[];
  keyTerms?: KeyTerm[];
  conceptRelations?: ConceptRelation[];
  createdAt: string;
  materialMetadata: MaterialMetadata;
}

export interface KeyTerm {
  id: string;
  term: string;
  definition: string;
  sourceSection: string;
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
  validation?: ValidationResult;
}

export type ValidationVerdict = "verified" | "uncertain" | "inaccurate";

export interface ValidationIssue {
  claim: string;
  problem: string;
  suggestion?: string;
}

export interface ValidationResult {
  verdict: ValidationVerdict;
  confidence: number;
  issues: ValidationIssue[];
  sourcesChecked: string[];
}

export interface CardMastery {
  cardId: string;
  deckId: string;
  ease: number;
  interval: number;
  nextReview: string;
  reviewCount: number;
  lastGrade: Grade;
}

export interface WebSearchResult {
  query: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
  }>;
}
