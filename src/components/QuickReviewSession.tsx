"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Deck, Grade } from "@/lib/types";
import { useStudySession } from "@/hooks/useStudySession";
import { useConceptMastery } from "@/hooks/useConceptMastery";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import LevelBadge from "./LevelBadge";
import AIAvatar from "./AIAvatar";
import SessionSummary from "./SessionSummary";

interface QuickReviewSessionProps {
  deck: Deck;
}

export default function QuickReviewSession({ deck }: QuickReviewSessionProps) {
  const router = useRouter();
  const {
    currentCard,
    isRevealed,
    isComplete,
    totalCards,
    currentIndex,
    reveal,
    grade: commitGrade,
    restart,
    sessionResult,
  } = useStudySession(deck.id, deck.cards);
  const { getLevel, updateMastery } = useConceptMastery(deck);

  const [honestyCheck, setHonestyCheck] = useState(false);
  const [checkResponse, setCheckResponse] = useState("");

  const results = useMemo(() => {
    const r: Grade[] = [];
    if (sessionResult) {
      for (const res of sessionResult.results) {
        r.push(res.grade);
      }
    }
    return r;
  }, [sessionResult]);

  const handleGrade = useCallback(
    (g: Grade) => {
      if (g === "got-it" && !honestyCheck && Math.random() < 0.4) {
        setHonestyCheck(true);
        return;
      }

      if (currentCard) {
        updateMastery(currentCard.concept, "review", { grade: g });
      }
      commitGrade(g);
      setHonestyCheck(false);
      setCheckResponse("");
    },
    [honestyCheck, currentCard, commitGrade, updateMastery]
  );

  const handleHonestyConfirm = useCallback(() => {
    if (currentCard) {
      updateMastery(currentCard.concept, "review", { grade: "got-it" });
    }
    commitGrade("got-it");
    setHonestyCheck(false);
    setCheckResponse("");
  }, [currentCard, commitGrade, updateMastery]);

  const handleHonestyDowngrade = useCallback(() => {
    if (currentCard) {
      updateMastery(currentCard.concept, "review", { grade: "partially" });
    }
    commitGrade("partially");
    setHonestyCheck(false);
    setCheckResponse("");
  }, [currentCard, commitGrade, updateMastery]);

  if (isComplete && sessionResult) {
    return (
      <SessionSummary result={sessionResult} deck={deck} onRestart={restart} />
    );
  }

  if (!currentCard) return null;

  const level = getLevel(currentCard.concept);

  return (
    <div className="max-w-[720px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/study?id=${deck.id}`)}
        >
          ← Back
        </Button>
        <div className="flex-1" />
        <Badge variant="secondary">Quick Review</Badge>
        <span className="text-xs font-mono text-muted-foreground">
          {currentIndex + 1} / {totalCards}
        </span>
      </div>

      <div className="flex gap-1 mb-6">
        {Array.from({ length: totalCards }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-colors"
            style={{
              background:
                i < currentIndex
                  ? results[i] === "got-it"
                    ? "var(--success)"
                    : results[i] === "partially"
                      ? "var(--warning)"
                      : "var(--destructive)"
                  : i === currentIndex
                    ? "var(--primary)"
                    : "var(--border)",
            }}
          />
        ))}
      </div>

      <Card
        className="min-h-[280px] flex flex-col p-6"
        style={{ cursor: !isRevealed ? "pointer" : "default" }}
        onClick={() => !isRevealed && reveal()}
      >
        <div className="flex justify-between items-center mb-4">
          <LevelBadge level={level} />
          <span className="text-xs font-mono text-muted-foreground">
            {currentCard.concept}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center text-center px-4">
          {!isRevealed ? (
            <div>
              <p className="text-[18px] font-heading text-foreground leading-relaxed mb-4">
                {currentCard.question}
              </p>
              <p className="text-[13px] text-muted-foreground">
                Click to reveal
              </p>
            </div>
          ) : (
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {currentCard.answer}
            </p>
          )}
        </div>
      </Card>

      {isRevealed && !honestyCheck && (
        <div className="flex justify-center gap-2.5 mt-5">
          <Button
            variant="outline"
            onClick={() => handleGrade("missed-it")}
            className="text-destructive border-[var(--error-border)]"
          >
            Didn&apos;t know
          </Button>
          <Button
            variant="outline"
            onClick={() => handleGrade("partially")}
            className="text-[var(--warning)] border-[var(--warning-border)]"
          >
            Partially
          </Button>
          <Button
            variant="outline"
            onClick={() => handleGrade("got-it")}
            className="text-[var(--success)] border-[var(--success-border)]"
          >
            I can explain this
          </Button>
        </div>
      )}

      {honestyCheck && (
        <Card
          className="mt-5 p-5"
          style={{ borderLeft: "3px solid var(--primary)" }}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <AIAvatar size="sm" />
            <p className="text-sm text-foreground font-medium">
              Quick check &mdash; briefly explain this concept to confirm your
              understanding:
            </p>
          </div>
          <Textarea
            value={checkResponse}
            onChange={(e) => setCheckResponse(e.target.value)}
            placeholder="A sentence or two is fine..."
            rows={3}
            className="mb-2.5"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleHonestyDowngrade}>
              Actually, only partially
            </Button>
            <Button
              size="sm"
              onClick={handleHonestyConfirm}
              disabled={!checkResponse.trim()}
            >
              Confirm
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
