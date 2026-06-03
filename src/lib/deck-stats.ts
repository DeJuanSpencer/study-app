import { Deck, UnderstandingLevel } from "./types";
import { loadConceptMastery, loadSessionResults } from "./storage";
import { deriveConceptsFromDeck } from "./concept-mastery";

export interface DeckStats {
  cardCount: number;
  conceptCount: number;
  lastStudied: string | null;
  depthPercent: number;
  levelCounts: { deep: number; building: number; new: number };
  conceptLevels: Array<{ name: string; level: UnderstandingLevel }>;
}

export function computeDeckStats(deck: Deck): DeckStats {
  const derived = deriveConceptsFromDeck(deck);
  const mastery = loadConceptMastery(deck.id);
  const masteryMap = new Map(mastery.map((m) => [m.conceptName, m.level]));

  const conceptLevels = derived.map((c) => ({
    name: c.name,
    level: (masteryMap.get(c.name) ?? 0) as UnderstandingLevel,
  }));

  const conceptCount = conceptLevels.length;
  const totalLevels = conceptLevels.reduce((s, c) => s + c.level, 0);
  const maxLevels = conceptCount * 5;
  const depthPercent = maxLevels > 0 ? Math.round((totalLevels / maxLevels) * 100) : 0;

  let deep = 0, building = 0, newCount = 0;
  for (const c of conceptLevels) {
    if (c.level >= 4) deep++;
    else if (c.level >= 2) building++;
    else newCount++;
  }

  const sessions = loadSessionResults(deck.id);
  let lastStudied: string | null = null;
  if (sessions.length > 0) {
    const latest = sessions.reduce((a, b) =>
      a.completedAt > b.completedAt ? a : b
    );
    lastStudied = formatTimeAgo(latest.completedAt);
  }

  return {
    cardCount: deck.cards.length,
    conceptCount,
    lastStudied,
    depthPercent,
    levelCounts: { deep, building, new: newCount },
    conceptLevels,
  };
}

export function formatTimeAgo(isoDate: string | null): string {
  if (!isoDate) return "Not studied yet";

  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return new Date(isoDate).toLocaleDateString();
}
