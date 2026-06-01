"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Flame,
  BookOpen,
  Target,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { loadAllDecks, loadSessionResults, loadAllMastery } from "@/lib/storage";
import { isDue } from "@/lib/srs";

export default function ProgressDashboard() {
  const router = useRouter();

  const data = useMemo(() => {
    const decks = loadAllDecks();
    const sessions = loadSessionResults();
    const allMastery = loadAllMastery();

    const totalSessions = sessions.length;
    const totalCardsReviewed = sessions.reduce(
      (sum, s) => sum + s.cardsReviewed,
      0
    );

    const accuracies = sessions.map((s) => {
      const gotIt = s.results.filter((r) => r.grade === "got-it").length;
      return s.results.length > 0
        ? Math.round((gotIt / s.results.length) * 100)
        : 0;
    });

    const recentAccuracies = accuracies.slice(-10);

    // Streak calculation
    const sessionDates = new Set(
      sessions.map((s) =>
        new Date(s.completedAt).toISOString().split("T")[0]
      )
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (sessionDates.has(key)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Per-deck stats
    const deckStats = decks.map((deck) => {
      const deckSessions = sessions.filter((s) => s.deckId === deck.id);
      const deckMastery = allMastery.filter((m) => m.deckId === deck.id);
      const mastered = deckMastery.filter((m) => m.interval >= 7).length;
      const due = deckMastery.filter((m) => isDue(m)).length;
      const latestSession = deckSessions[deckSessions.length - 1];
      const latestAccuracy = latestSession
        ? Math.round(
            (latestSession.results.filter((r) => r.grade === "got-it").length /
              latestSession.results.length) *
              100
          )
        : null;

      return {
        deck,
        sessionCount: deckSessions.length,
        mastered,
        due,
        latestAccuracy,
        totalCards: deck.cards.length,
      };
    });

    // Weak concepts across all sessions
    const conceptMisses: Record<string, { missed: number; total: number }> = {};
    for (const session of sessions) {
      const deck = decks.find((d) => d.id === session.deckId);
      if (!deck) continue;
      for (const result of session.results) {
        const card = deck.cards.find((c) => c.id === result.cardId);
        if (!card) continue;
        if (!conceptMisses[card.concept]) {
          conceptMisses[card.concept] = { missed: 0, total: 0 };
        }
        conceptMisses[card.concept].total++;
        if (result.grade === "missed-it") {
          conceptMisses[card.concept].missed++;
        }
      }
    }

    const weakConcepts = Object.entries(conceptMisses)
      .filter(([, stats]) => stats.total >= 2 && stats.missed / stats.total > 0.3)
      .sort(([, a], [, b]) => b.missed / b.total - a.missed / a.total)
      .slice(0, 8)
      .map(([concept, stats]) => ({
        concept,
        missRate: Math.round((stats.missed / stats.total) * 100),
      }));

    return {
      totalSessions,
      totalCardsReviewed,
      recentAccuracies,
      streak,
      deckStats,
      weakConcepts,
    };
  }, []);

  if (data.totalSessions === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-muted-foreground mb-2">No study sessions yet.</p>
        <p className="text-sm text-muted-foreground">
          Upload material and study a deck to start tracking your progress.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <BookOpen className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-semibold">{data.totalSessions}</p>
          <p className="text-xs text-muted-foreground">Sessions</p>
        </Card>
        <Card className="p-4 text-center">
          <Target className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-semibold">{data.totalCardsReviewed}</p>
          <p className="text-xs text-muted-foreground">Cards Reviewed</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-semibold">
            {data.recentAccuracies.length > 0
              ? `${data.recentAccuracies[data.recentAccuracies.length - 1]}%`
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Latest Accuracy</p>
        </Card>
        <Card className="p-4 text-center">
          <Flame className="h-5 w-5 mx-auto mb-2 text-orange-400" />
          <p className="text-2xl font-semibold">{data.streak}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </Card>
      </div>

      {data.recentAccuracies.length > 1 && (
        <>
          <div>
            <h3 className="text-sm font-medium mb-3">
              Recent Accuracy (last {data.recentAccuracies.length} sessions)
            </h3>
            <div className="flex items-end gap-1 h-24">
              {data.recentAccuracies.map((acc, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-primary/80 transition-all relative group"
                  style={{ height: `${acc}%` }}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {acc}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      <div>
        <h3 className="text-sm font-medium mb-3">Deck Progress</h3>
        <div className="space-y-3">
          {data.deckStats.map(
            ({ deck, sessionCount, mastered, due, latestAccuracy, totalCards }) => (
              <Card
                key={deck.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => router.push(`/deck?id=${deck.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{deck.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{sessionCount} sessions</span>
                      <span className="text-emerald-400">
                        {mastered} mastered
                      </span>
                      {due > 0 && (
                        <span className="text-amber-400">{due} due</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {latestAccuracy !== null && (
                      <p className="text-lg font-semibold">{latestAccuracy}%</p>
                    )}
                    <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{
                          width: `${totalCards > 0 ? (mastered / totalCards) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )
          )}
        </div>
      </div>

      {data.weakConcepts.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Concepts to Focus On
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.weakConcepts.map(({ concept, missRate }) => (
                <Badge
                  key={concept}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors px-3 py-1.5"
                  onClick={() =>
                    router.push(
                      `/explain?concept=${encodeURIComponent(concept)}`
                    )
                  }
                >
                  {concept}
                  <span className="ml-1.5 text-rose-400">{missRate}% miss</span>
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
