import { CardMastery, Grade } from "./types";

export function calculateNextReview(
  current: CardMastery | null,
  grade: Grade,
  cardId: string,
  deckId: string
): CardMastery {
  const now = new Date();
  const ease = current?.ease ?? 2.5;
  const interval = current?.interval ?? 0;
  const reviewCount = (current?.reviewCount ?? 0) + 1;

  let newEase = ease;
  let newInterval: number;

  switch (grade) {
    case "got-it":
      newEase = Math.min(3.0, ease + 0.1);
      if (interval === 0) {
        newInterval = 1;
      } else if (interval === 1) {
        newInterval = 3;
      } else {
        newInterval = Math.round(interval * newEase);
      }
      break;

    case "partially":
      newEase = Math.max(1.3, ease - 0.15);
      newInterval = 1;
      break;

    case "missed-it":
      newEase = Math.max(1.3, ease - 0.3);
      newInterval = 0;
      break;
  }

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    cardId,
    deckId,
    ease: newEase,
    interval: newInterval,
    nextReview: nextReview.toISOString(),
    reviewCount,
    lastGrade: grade,
  };
}

export function isDue(mastery: CardMastery): boolean {
  return new Date(mastery.nextReview) <= new Date();
}

export function sortByPriority(
  cardIds: string[],
  masteryMap: Map<string, CardMastery>
): string[] {
  return [...cardIds].sort((a, b) => {
    const ma = masteryMap.get(a);
    const mb = masteryMap.get(b);

    // Unseen cards after due cards but before future cards
    if (!ma && !mb) return 0;
    if (!ma) return mb && isDue(mb) ? 1 : -1;
    if (!mb) return ma && isDue(ma) ? -1 : 1;

    const aDue = isDue(ma);
    const bDue = isDue(mb);

    // Due cards first
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;

    // Among due cards, lowest ease first (hardest)
    if (aDue && bDue) return ma.ease - mb.ease;

    // Among future cards, nearest review date first
    return new Date(ma.nextReview).getTime() - new Date(mb.nextReview).getTime();
  });
}
