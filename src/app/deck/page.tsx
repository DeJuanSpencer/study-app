"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import DeckView from "@/components/DeckView";
import { loadDeck, loadAllDecks } from "@/lib/storage";
import { Deck } from "@/lib/types";

function DeckPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deckId = searchParams.get("id");
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
      <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (deckId && deck) {
    return (
      <div className="max-w-5xl mx-auto w-full px-6 py-8">
        <DeckView
          deck={deck}
          onDeckUpdate={(updated) => setDeck(updated)}
          onDeckDelete={() => router.push("/deck")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Your Decks</h1>

      {allDecks.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground mb-4">
            No decks yet. Upload some study material to get started.
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
              onClick={() => router.push(`/deck?id=${d.id}`)}
            >
              <h3 className="font-medium leading-tight">{d.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {d.cards.length} cards &middot;{" "}
                {new Date(d.createdAt).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DeckPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          }
        >
          <DeckPageContent />
        </Suspense>
      </main>
    </>
  );
}
