"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StudySessionResult, Deck } from "@/lib/types";

interface SessionSummaryProps {
  result: StudySessionResult;
  deck: Deck;
  onRestart: () => void;
}

export default function SessionSummary({
  result,
  deck,
  onRestart,
}: SessionSummaryProps) {
  const router = useRouter();

  const stats = useMemo(() => {
    const gotIt = result.results.filter((r) => r.grade === "got-it").length;
    const partially = result.results.filter(
      (r) => r.grade === "partially"
    ).length;
    const missed = result.results.filter(
      (r) => r.grade === "missed-it"
    ).length;
    const total = result.results.length;
    const accuracy = total > 0 ? Math.round((gotIt / total) * 100) : 0;

    return { gotIt, partially, missed, total, accuracy };
  }, [result.results]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Session Complete
        </h2>
        <p className="text-muted-foreground">
          You reviewed {stats.total} cards from &ldquo;{deck.title}&rdquo;
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
          <p className="text-2xl font-semibold">{stats.gotIt}</p>
          <p className="text-xs text-muted-foreground">Got it</p>
        </Card>
        <Card className="p-4 text-center">
          <MinusCircle className="h-5 w-5 mx-auto mb-2 text-amber-400" />
          <p className="text-2xl font-semibold">{stats.partially}</p>
          <p className="text-xs text-muted-foreground">Partially</p>
        </Card>
        <Card className="p-4 text-center">
          <AlertCircle className="h-5 w-5 mx-auto mb-2 text-rose-400" />
          <p className="text-2xl font-semibold">{stats.missed}</p>
          <p className="text-xs text-muted-foreground">Missed</p>
        </Card>
      </div>

      <Card className="p-5 text-center">
        <p className="text-sm text-muted-foreground mb-1">Overall Accuracy</p>
        <p className="text-4xl font-bold">{stats.accuracy}%</p>
      </Card>

      {result.weakConcepts.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-medium mb-3">Concepts to Review</h3>
            <div className="flex flex-wrap gap-2">
              {result.weakConcepts.map((concept) => (
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
                  <Lightbulb className="h-3 w-3 mr-1.5" />
                  {concept}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onRestart}>
          <RotateCcw className="h-4 w-4 mr-1.5" />
          Study Again
        </Button>
        {stats.missed > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              const missedIds = result.results
                .filter((r) => r.grade === "missed-it")
                .map((r) => r.cardId);
              sessionStorage.setItem(
                "studydeck_missed",
                JSON.stringify(missedIds)
              );
              router.push(`/study?id=${deck.id}&mode=missed`);
            }}
          >
            <Target className="h-4 w-4 mr-1.5" />
            Study Missed ({stats.missed})
          </Button>
        )}
        <Button onClick={() => router.push(`/deck?id=${deck.id}`)}>
          Back to Deck
        </Button>
      </div>
    </div>
  );
}
