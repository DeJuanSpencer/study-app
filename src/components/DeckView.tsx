"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  RefreshCw,
  Loader2,
  Filter,
  Trash2,
  Download,
  Pencil,
  BookOpen,
  Network,
  ChevronDown,
  ChevronRight,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import FlashCard from "./FlashCard";
import KeyTermsList from "./KeyTermsList";
import ConceptMap from "./ConceptMap";
import { Deck, Difficulty, FlashCard as FlashCardType } from "@/lib/types";
import { saveDeck, deleteDeck, loadMastery } from "@/lib/storage";
import { isDue } from "@/lib/srs";
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showConceptMap, setShowConceptMap] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashCardType | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  const concepts = useMemo(
    () => [...new Set(deck.cards.map((c) => c.concept))],
    [deck.cards]
  );

  const validationSummary = useMemo(() => {
    const validated = deck.cards.filter((c) => c.validation);
    if (validated.length === 0) return null;
    return {
      verified: validated.filter((c) => c.validation!.verdict === "verified")
        .length,
      uncertain: validated.filter((c) => c.validation!.verdict === "uncertain")
        .length,
      inaccurate: validated.filter(
        (c) => c.validation!.verdict === "inaccurate"
      ).length,
      total: validated.length,
    };
  }, [deck.cards]);

  const masterySummary = useMemo(() => {
    const mastery = loadMastery(deck.id);
    const masteryMap = new Map(mastery.map((m) => [m.cardId, m]));
    let mastered = 0;
    let due = 0;
    let unseen = 0;
    for (const card of deck.cards) {
      const m = masteryMap.get(card.id);
      if (!m) {
        unseen++;
      } else if (isDue(m)) {
        due++;
      } else if (m.interval >= 7) {
        mastered++;
      }
    }
    return { mastered, due, unseen, total: deck.cards.length };
  }, [deck.id, deck.cards]);

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

  const handleEdit = (cardId: string, question: string, answer: string) => {
    const updated = {
      ...deck,
      cards: deck.cards.map((c) =>
        c.id === cardId ? { ...c, question, answer } : c
      ),
    };
    saveDeck(updated);
    onDeckUpdate(updated);
  };

  const openEditDialog = (card: FlashCardType) => {
    setEditingCard(card);
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
  };

  const saveEdit = () => {
    if (editingCard) {
      handleEdit(editingCard.id, editQuestion, editAnswer);
      setEditingCard(null);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(deck, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.studydeck`;
    a.click();
    URL.revokeObjectURL(url);
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
          <div className="flex items-center gap-3 mt-1 text-xs">
            {masterySummary.mastered > 0 && (
              <span className="text-emerald-400">
                {masterySummary.mastered} mastered
              </span>
            )}
            {masterySummary.due > 0 && (
              <span className="text-amber-400">
                {masterySummary.due} due for review
              </span>
            )}
            {masterySummary.unseen > 0 && (
              <span className="text-muted-foreground">
                {masterySummary.unseen} new
              </span>
            )}
          </div>
          {validationSummary && (
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-emerald-400">
                {validationSummary.verified} verified
              </span>
              {validationSummary.uncertain > 0 && (
                <span className="text-amber-400">
                  {validationSummary.uncertain} unverified
                </span>
              )}
              {validationSummary.inaccurate > 0 && (
                <span className="text-rose-400">
                  {validationSummary.inaccurate} issues
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/study?id=${deck.id}`)}
          >
            <GraduationCap className="h-4 w-4 mr-1.5" />
            Study
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
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
            onEdit={openEditDialog}
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

      {deck.keyTerms && deck.keyTerms.length > 0 && (
        <>
          <Separator />
          <div>
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors w-full text-left"
            >
              {showTerms ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <BookOpen className="h-4 w-4" />
              Key Terms
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                {deck.keyTerms.length}
              </Badge>
            </button>
            {showTerms && (
              <div className="mt-4">
                <KeyTermsList terms={deck.keyTerms} />
              </div>
            )}
          </div>
        </>
      )}

      {deck.conceptRelations && deck.conceptRelations.length > 0 && (
        <>
          <Separator />
          <div>
            <button
              onClick={() => setShowConceptMap(!showConceptMap)}
              className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors w-full text-left"
            >
              {showConceptMap ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Network className="h-4 w-4" />
              Concept Connections
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                {deck.conceptRelations.length}
              </Badge>
            </button>
            {showConceptMap && (
              <div className="mt-4">
                <ConceptMap relations={deck.conceptRelations} />
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this deck?</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{deck.title}&rdquo; and all{" "}
              {deck.cards.length} cards. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingCard}
        onOpenChange={(open) => !open && setEditingCard(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Question
              </label>
              <Textarea
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                className="min-h-[100px] resize-y"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Answer</label>
              <Textarea
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                className="min-h-[100px] resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
