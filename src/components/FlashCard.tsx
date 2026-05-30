"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlashCard as FlashCardType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FlashCardProps {
  card: FlashCardType;
  onFlag?: (cardId: string, reason: "too-easy" | "unclear") => void;
  showAnswer?: boolean;
  className?: string;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  foundational: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  advanced: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export default function FlashCard({
  card,
  onFlag,
  showAnswer: controlledShow,
  className,
}: FlashCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledShow ?? internalFlipped;

  return (
    <div
      className={cn("perspective-[1000px] w-full", className)}
      onClick={() => {
        if (controlledShow === undefined) setInternalFlipped(!internalFlipped);
      }}
    >
      <div
        className={cn(
          "relative w-full min-h-[280px] transition-transform duration-500 [transform-style:preserve-3d] cursor-pointer",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* Front - Question */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-xl border border-border bg-card p-6 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-4">
            <Badge
              variant="outline"
              className={cn("text-xs", DIFFICULTY_STYLES[card.difficulty])}
            >
              {card.difficulty}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {card.concept}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg text-center leading-relaxed">
              {card.question}
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Click to reveal answer
          </p>
        </div>

        {/* Back - Answer */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl border border-border bg-card p-6 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-4">
            <Badge
              variant="outline"
              className={cn("text-xs", DIFFICULTY_STYLES[card.difficulty])}
            >
              {card.difficulty}
            </Badge>
            {onFlag && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFlag(card.id, "too-easy");
                  }}
                >
                  <Flag className="h-3 w-3 mr-1" />
                  Too easy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFlag(card.id, "unclear");
                  }}
                >
                  <Flag className="h-3 w-3 mr-1" />
                  Unclear
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-base text-center leading-relaxed text-muted-foreground">
              {card.answer}
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            From: {card.sourceSection}
          </p>
        </div>
      </div>
    </div>
  );
}
