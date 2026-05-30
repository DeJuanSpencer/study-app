"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  RefreshCw,
  Loader2,
  Filter,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import FlashCard from "./FlashCard";
import { Deck, Difficulty, FlashCard as FlashCardType } from "@/lib/types";
import { saveDeck, deleteDeck } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface DeckViewProps {
  deck: Deck;
  onDeckUpdate: (deck: Deck) => void;
  onDeckDelete: () => void;
}

const DIFFICULTIES: Difficulty[] = [
  "foundational",
  "intermediate",
  "advanced",
];

export default function DeckView({
  deck,
  onDeckUpdate,
  onDeckDelete,
}: DeckViewProps) {
  const router = useRouter();
  const [difficultyFilter, setDifficultyFilter] = useState<Set<Difficulty>>(
    new Set(DIFFICULTIES)
  );
  const [conceptFilter, setConceptFilter] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState(false);
  const [cardCount, setCardCount] = useState(deck.cards.length);

  const concepts = useMemo(
    () => [...new Set(deck.cards.map((c) => c.concept))],
    [deck.cards]
  );

  const filteredCards = useMemo(() => {
    return deck.cards.filter((card) => {
      if (!difficultyFilter.has(card.difficulty)) return false;
      if (conceptFilter.size > 0 && !conceptFilter.has(card.concept))
        return false;
      return true;
    });
  }, [deck.cards, difficultyFilter, conceptFilter]);

  const handleFlag = (cardId: string, reason: "too-easy" | "unclear") => {
    const updated = {
      ...deck,
      cards: deck.cards.map((c) =>
        c.id === cardId ? { ...c, flagged: reason as FlashCardType["flagged"] } : c
      ),
    };
    saveDeck(updated);
    onDeckUpdate(updated);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material: {
            title: deck.title,
            sections: [],
            rawText: deck.cards.map((c) => c.answer).join("\n"),
            metadata: deck.materialMetadata,
          },
          cardCount,
        }),
      });
      if (!res.ok) throw new Error("Regeneration failed");
      const { cards } = await res.json();
      const updated = { ...deck, cards };
      saveDeck(updated);
      onDeckUpdate(updated);
    } catch {
      // silently fail — user can retry
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = () => {
    deleteDeck(deck.id);
    onDeckDelete();
  };

  const toggleDifficulty = (d: Difficulty) => {
    setDifficultyFilter((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const toggleConcept = (c: string) => {
    setConceptFilter((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {deck.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {deck.cards.length} cards &middot; Created{" "}
            {new Date(deck.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/study?id=${deck.id}`)}
          >
            <GraduationCap className="h-4 w-4 mr-1.5" />
            Study
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1.5" />
              Difficulty
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filter by difficulty</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DIFFICULTIES.map((d) => (
              <DropdownMenuCheckboxItem
                key={d}
                checked={difficultyFilter.has(d)}
                onCheckedChange={() => toggleDifficulty(d)}
              >
                {d}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {concepts.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1.5" />
                Concept
                {conceptFilter.size > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                    {conceptFilter.size}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-60 overflow-y-auto">
              <DropdownMenuLabel>Filter by concept</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {concepts.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c}
                  checked={conceptFilter.has(c)}
                  onCheckedChange={() => toggleConcept(c)}
                >
                  {c}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Count:</label>
          <input
            type="number"
            min={1}
            max={30}
            value={cardCount}
            onChange={(e) =>
              setCardCount(
                Math.min(30, Math.max(1, parseInt(e.target.value) || 10))
              )
            }
            className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm"
            disabled={regenerating}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1.5">Regenerate</span>
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredCards.length} of {deck.cards.length} cards
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCards.map((card) => (
          <FlashCard
            key={card.id}
            card={card}
            onFlag={handleFlag}
            className={cn(card.flagged && "opacity-50")}
          />
        ))}
      </div>

      {filteredCards.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">
            No cards match the current filters.
          </p>
        </Card>
      )}
    </div>
  );
}
