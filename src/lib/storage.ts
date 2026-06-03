import { Deck, StudySessionResult, CardMastery, ConceptMastery } from "./types";

const DECKS_KEY = "studydeck_decks";
const SESSIONS_KEY = "studydeck_sessions";
const MASTERY_KEY = "studydeck_mastery";
const CONCEPT_MASTERY_KEY = "studydeck_concept_mastery";
const HYDRATED_KEY = "studydeck_hydrated";

// ── localStorage helpers (sync, unchanged interface) ──

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

// ── Fire-and-forget persist to Supabase ──

function persistToDb(url: string, body: unknown): void {
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {
    // Silent fail — localStorage is the immediate source of truth.
    // Supabase sync will catch up on next hydration.
  });
}

// ── Decks ──

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
  persistToDb("/api/db/decks", { action: "save", deck });
}

export function updateDeck(id: string, updates: Partial<Deck>): Deck | null {
  const decks = loadAllDecks();
  const idx = decks.findIndex((d) => d.id === id);
  if (idx < 0) return null;
  decks[idx] = { ...decks[idx], ...updates };
  setItem(DECKS_KEY, decks);
  persistToDb("/api/db/decks", { action: "save", deck: decks[idx] });
  return decks[idx];
}

export function deleteDeck(id: string): void {
  const decks = loadAllDecks().filter((d) => d.id !== id);
  setItem(DECKS_KEY, decks);
  persistToDb("/api/db/decks", { action: "delete", deckId: id });
}

// ── Study Sessions ──

export function saveSessionResult(result: StudySessionResult): void {
  const sessions = getItem<StudySessionResult[]>(SESSIONS_KEY) ?? [];
  sessions.push(result);
  setItem(SESSIONS_KEY, sessions);
  persistToDb("/api/db/sessions", { session: result });
}

export function loadSessionResults(deckId?: string): StudySessionResult[] {
  const sessions = getItem<StudySessionResult[]>(SESSIONS_KEY) ?? [];
  if (deckId) return sessions.filter((s) => s.deckId === deckId);
  return sessions;
}

// ── Card Mastery ──

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
  persistToDb("/api/db/mastery", { action: "save-card", mastery });
}

// ── Concept Mastery ──

export function loadConceptMastery(deckId: string): ConceptMastery[] {
  const all = getItem<ConceptMastery[]>(CONCEPT_MASTERY_KEY) ?? [];
  return all.filter((m) => m.deckId === deckId);
}

export function loadAllConceptMastery(): ConceptMastery[] {
  return getItem<ConceptMastery[]>(CONCEPT_MASTERY_KEY) ?? [];
}

export function saveConceptMastery(mastery: ConceptMastery): void {
  const all = getItem<ConceptMastery[]>(CONCEPT_MASTERY_KEY) ?? [];
  const idx = all.findIndex(
    (m) => m.conceptId === mastery.conceptId && m.deckId === mastery.deckId
  );
  if (idx >= 0) {
    all[idx] = mastery;
  } else {
    all.push(mastery);
  }
  setItem(CONCEPT_MASTERY_KEY, all);
  persistToDb("/api/db/mastery", { action: "save-concept", mastery });
}

// ── Hydration: pull Supabase → localStorage on first load ──

export async function hydrateFromSupabase(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(HYDRATED_KEY)) return false;

  try {
    const res = await fetch("/api/db/sync");
    if (!res.ok) return false;

    const data = await res.json();

    if (data.decks?.length) setItem(DECKS_KEY, data.decks);
    if (data.sessions?.length) setItem(SESSIONS_KEY, data.sessions);
    if (data.cardMastery?.length) setItem(MASTERY_KEY, data.cardMastery);
    if (data.conceptMastery?.length) setItem(CONCEPT_MASTERY_KEY, data.conceptMastery);

    localStorage.setItem(HYDRATED_KEY, Date.now().toString());
    return true;
  } catch {
    return false;
  }
}
