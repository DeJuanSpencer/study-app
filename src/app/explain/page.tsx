"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import ConceptExplainer from "@/components/ConceptExplainer";
import ConceptSidebar, { DeckConceptGroup } from "@/components/ConceptSidebar";
import { loadAllDecks } from "@/lib/storage";
import { loadConceptMastery } from "@/lib/storage";
import { ConceptRelation, UnderstandingLevel } from "@/lib/types";

function EmptyExplainState() {
  return (
    <div className="text-center" style={{ padding: "60px 20px" }}>
      <div
        className="mx-auto mb-5 flex items-center justify-center rounded-full"
        style={{
          width: 72,
          height: 72,
          background: "var(--secondary)",
          fontSize: 30,
        }}
      >
        🔍
      </div>
      <h3
        className="text-foreground mb-2"
        style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 600 }}
      >
        Explore any concept
      </h3>
      <p
        className="text-muted-foreground mx-auto"
        style={{ fontSize: 14, maxWidth: 360, lineHeight: 1.6 }}
      >
        Search for a concept or pick one from your decks. We&apos;ll break it
        down from plain language to technical depth.
      </p>
    </div>
  );
}

function ExplainPageContent() {
  const searchParams = useSearchParams();
  const initialConcept = searchParams.get("concept") || "";

  const [conceptInput, setConceptInput] = useState(initialConcept);
  const [activeConcept, setActiveConcept] = useState(initialConcept);
  const [deckConcepts] = useState<DeckConceptGroup[]>(() => {
    if (typeof window === "undefined") return [];
    const decks = loadAllDecks();
    return decks.map((deck) => {
      const conceptNames = [...new Set(deck.cards.map((c) => c.concept))];
      const mastery = loadConceptMastery(deck.id);
      return {
        deckId: deck.id,
        deckTitle: deck.title,
        concepts: conceptNames.map((name) => ({
          name,
          level: (mastery.find((m) => m.conceptName === name)?.level ?? 0) as UnderstandingLevel,
        })),
      };
    });
  });
  const [activeConceptLevel, setActiveConceptLevel] = useState<UnderstandingLevel>(0);
  const [activeConceptRelations, setActiveConceptRelations] = useState<ConceptRelation[]>([]);

  const handleSelectConcept = (concept: string) => {
    setConceptInput(concept);
    setActiveConcept(concept);

    const decks = loadAllDecks();
    for (const deck of decks) {
      if (deck.cards.some((c) => c.concept === concept)) {
        const mastery = loadConceptMastery(deck.id);
        setActiveConceptLevel(
          (mastery.find((m) => m.conceptName === concept)?.level ?? 0) as UnderstandingLevel
        );
        setActiveConceptRelations(deck.conceptRelations ?? []);
        return;
      }
    }
    setActiveConceptLevel(0);
    setActiveConceptRelations([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conceptInput.trim()) {
      handleSelectConcept(conceptInput.trim());
    }
  };

  const hasActiveConcept = activeConcept.length > 0;

  return (
    <div
      className="mx-auto w-full"
      style={{ maxWidth: 960, padding: "32px 32px 64px" }}
    >
      {/* Title + search */}
      <div style={{ marginBottom: hasActiveConcept ? 24 : 32 }}>
        {!hasActiveConcept && (
          <>
            <h1
              className="text-foreground mb-1.5"
              style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 700 }}
            >
              Concept Explorer
            </h1>
            <p className="text-sm text-muted-foreground" style={{ marginBottom: 24 }}>
              Explore any concept in depth — from plain language to technical precision.
            </p>
          </>
        )}
        <form
          onSubmit={handleSubmit}
          className="flex gap-2.5"
          style={{ maxWidth: hasActiveConcept ? "100%" : 560 }}
        >
          <input
            type="text"
            value={conceptInput}
            onChange={(e) => setConceptInput(e.target.value)}
            placeholder="Search any concept — e.g. Mitochondrial ATP synthesis"
            className="flex-1 text-sm focus:outline-none"
            style={{
              padding: "11px 16px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--foreground)",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
            }}
          />
          <Button
            type="submit"
            disabled={!conceptInput.trim()}
            className="text-[13px] font-semibold"
            style={{ padding: "11px 22px", borderRadius: 10 }}
          >
            Explore
          </Button>
        </form>
      </div>

      {/* Two-state layout */}
      {hasActiveConcept ? (
        <div
          className="items-start"
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: 32,
          }}
        >
          {/* Left: sticky sidebar */}
          <div
            className="self-start overflow-hidden"
            style={{
              position: "sticky",
              top: 72,
              maxHeight: "calc(100vh - 72px - 32px)",
            }}
          >
            <ConceptSidebar
              deckConcepts={deckConcepts}
              activeConcept={activeConcept}
              onSelectConcept={handleSelectConcept}
            />
          </div>

          {/* Right: explanation */}
          <div>
            <ConceptExplainer
              key={activeConcept}
              concept={activeConcept}
              level={activeConceptLevel}
              conceptRelations={activeConceptRelations}
              onSelectRelatedConcept={handleSelectConcept}
            />
          </div>
        </div>
      ) : (
        <div>
          {deckConcepts.length > 0 ? (
            <ConceptSidebar
              deckConcepts={deckConcepts}
              activeConcept={null}
              onSelectConcept={handleSelectConcept}
              defaultAllExpanded
            />
          ) : null}
          <EmptyExplainState />
        </div>
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
            <div className="max-w-[960px] mx-auto w-full px-8 py-8 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-full max-w-[560px]" />
            </div>
          }
        >
          <ExplainPageContent />
        </Suspense>
      </main>
    </>
  );
}
