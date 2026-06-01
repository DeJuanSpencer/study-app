import { Deck, StudySessionResult, CardMastery } from "./types";

const DECKS_KEY = "studydeck_decks";
const SESSIONS_KEY = "studydeck_sessions";
const MASTERY_KEY = "studydeck_mastery";

function getItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadAllDecks(): Deck[] {
  return getItem<Deck[]>(DECKS_KEY) ?? [];
}

export function loadDeck(id: string): Deck | null {
  const decks = loadAllDecks();
  return decks.find((d) => d.id === id) ?? null;
}

export function saveDeck(deck: Deck): void {
  const decks = loadAllDecks();
  const idx = decks.findIndex((d) => d.id === deck.id);
  if (idx >= 0) {
    decks[idx] = deck;
  } else {
    decks.push(deck);
  }
  setItem(DECKS_KEY, decks);
}

export function updateDeck(id: string, updates: Partial<Deck>): Deck | null {
  const decks = loadAllDecks();
  const idx = decks.findIndex((d) => d.id === id);
  if (idx < 0) return null;
  decks[idx] = { ...decks[idx], ...updates };
  setItem(DECKS_KEY, decks);
  return decks[idx];
}

export function deleteDeck(id: string): void {
  const decks = loadAllDecks().filter((d) => d.id !== id);
  setItem(DECKS_KEY, decks);
}

export function saveSessionResult(result: StudySessionResult): void {
  const sessions = getItem<StudySessionResult[]>(SESSIONS_KEY) ?? [];
  sessions.push(result);
  setItem(SESSIONS_KEY, sessions);
}

export function loadSessionResults(deckId?: string): StudySessionResult[] {
  const sessions = getItem<StudySessionResult[]>(SESSIONS_KEY) ?? [];
  if (deckId) return sessions.filter((s) => s.deckId === deckId);
  return sessions;
}

export function loadMastery(deckId: string): CardMastery[] {
  const all = getItem<CardMastery[]>(MASTERY_KEY) ?? [];
  return all.filter((m) => m.deckId === deckId);
}

export function loadAllMastery(): CardMastery[] {
  return getItem<CardMastery[]>(MASTERY_KEY) ?? [];
}

export function saveMastery(mastery: CardMastery): void {
  const all = getItem<CardMastery[]>(MASTERY_KEY) ?? [];
  const idx = all.findIndex(
    (m) => m.cardId === mastery.cardId && m.deckId === mastery.deckId
  );
  if (idx >= 0) {
    all[idx] = mastery;
  } else {
    all.push(mastery);
  }
  setItem(MASTERY_KEY, all);
}
