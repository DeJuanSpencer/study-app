import { Deck, StudySessionResult } from "./types";

const DECKS_KEY = "studydeck_decks";
const SESSIONS_KEY = "studydeck_sessions";

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
