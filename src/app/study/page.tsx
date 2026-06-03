"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import StudyHub from "@/components/StudyHub";
import QuickReviewSession from "@/components/QuickReviewSession";
import ExplainModeSession from "@/components/ExplainModeSession";
import SocraticSession from "@/components/SocraticSession";
import SynthesisSession from "@/components/SynthesisSession";
import StudySession from "@/components/StudySession";
import KnowledgeMap from "@/components/KnowledgeMap";
import { loadDeck, loadAllDecks } from "@/lib/storage";
import { Deck } from "@/lib/types";

function StudyPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deckId = searchParams.get("id");
  const mode = searchParams.get("mode");
  const concept = searchParams.get("concept");
  const [deck, setDeck] = useState<Deck | null>(null);
  const [allDecks, setAllDecks] = useState<Deck[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (deckId) {
      setDeck(loadDeck(deckId));
    }
    setAllDecks(loadAllDecks());
    setLoaded(true);
  }, [deckId]);

  if (!loaded) {
    return (
      <div className="max-w-2xl mx-auto w-full px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (deckId && deck) {
    if (deck.cards.length === 0) {
      return (
        <div className="max-w-2xl mx-auto w-full px-6 py-8">
          <Card className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              This deck has no cards. Go back and regenerate.
            </p>
            <Button onClick={() => router.push(`/deck?id=${deck.id}`)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Deck
            </Button>
          </Card>
        </div>
      );
    }

    if (!mode) {
      return (
        <div className="px-6 py-8">
          <StudyHub deck={deck} />
        </div>
      );
    }

    if (mode === "review") {
      return (
        <div className="px-6 py-8">
          <QuickReviewSession deck={deck} />
        </div>
      );
    }

    if (mode === "explain" && concept) {
      return (
        <div className="px-6 py-8">
          <ExplainModeSession deck={deck} concept={concept} />
        </div>
      );
    }

    if (mode === "socratic" && concept) {
      return (
        <div className="px-6 py-8">
          <SocraticSession deck={deck} concept={concept} />
        </div>
      );
    }

    if (mode === "synthesis") {
      return (
        <div className="px-6 py-8">
          <SynthesisSession deck={deck} />
        </div>
      );
    }

    if (mode === "knowledge") {
      return (
        <div className="px-6 py-8">
          <KnowledgeMap deck={deck} />
        </div>
      );
    }

    if (mode === "missed") {
      let studyCards = deck.cards;
      try {
        const raw = sessionStorage.getItem("studydeck_missed");
        if (raw) {
          const missedIds: string[] = JSON.parse(raw);
          const filtered = deck.cards.filter((c) => missedIds.includes(c.id));
          if (filtered.length > 0) studyCards = filtered;
          sessionStorage.removeItem("studydeck_missed");
        }
      } catch {
        // fall through to full deck
      }

      return (
        <div className="px-6 py-8">
          <StudySession deck={{ ...deck, cards: studyCards }} />
        </div>
      );
    }

    // Fallback: unrecognized mode → StudyHub
    return (
      <div className="px-6 py-8">
        <StudyHub deck={deck} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Choose a Deck to Study
      </h1>

      {allDecks.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground mb-4">
            No decks available. Upload study material first.
          </p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Upload Material
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allDecks.map((d) => (
            <Card
              key={d.id}
              className="p-5 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => router.push(`/study?id=${d.id}`)}
            >
              <h3 className="font-medium leading-tight">{d.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {d.cards.length} cards
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudyPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-2xl mx-auto w-full px-6 py-8 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-64" />
            </div>
          }
        >
          <StudyPageContent />
        </Suspense>
      </main>
    </>
  );
}
