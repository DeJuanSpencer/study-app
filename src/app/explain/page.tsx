"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import ConceptExplainer from "@/components/ConceptExplainer";
import { loadAllDecks } from "@/lib/storage";

function ExplainPageContent() {
  const searchParams = useSearchParams();
  const initialConcept = searchParams.get("concept") || "";

  const [conceptInput, setConceptInput] = useState(initialConcept);
  const [activeConcept, setActiveConcept] = useState(initialConcept);
  const [knownConcepts, setKnownConcepts] = useState<string[]>([]);

  useEffect(() => {
    const decks = loadAllDecks();
    const concepts = new Set<string>();
    for (const deck of decks) {
      for (const card of deck.cards) {
        concepts.add(card.concept);
      }
    }
    setKnownConcepts([...concepts]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conceptInput.trim()) {
      setActiveConcept(conceptInput.trim());
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Concept Explainer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter any concept for a structured explanation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="e.g. Mitochondrial ATP synthesis"
          value={conceptInput}
          onChange={(e) => setConceptInput(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" disabled={!conceptInput.trim()}>
          <Search className="h-4 w-4 mr-1.5" />
          Explain
        </Button>
      </form>

      {knownConcepts.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Concepts from your decks:
          </p>
          <div className="flex flex-wrap gap-2">
            {knownConcepts.map((concept) => (
              <Badge
                key={concept}
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => {
                  setConceptInput(concept);
                  setActiveConcept(concept);
                }}
              >
                {concept}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {activeConcept && (
        <>
          <Separator />
          <ConceptExplainer key={activeConcept} concept={activeConcept} />
        </>
      )}
    </div>
  );
}

export default function ExplainPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-full" />
            </div>
          }
        >
          <ExplainPageContent />
        </Suspense>
      </main>
    </>
  );
}
