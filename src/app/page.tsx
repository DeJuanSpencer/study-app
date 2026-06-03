"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import UploadModal from "@/components/UploadModal";
import DeckCard from "@/components/DeckCard";
import { loadAllDecks } from "@/lib/storage";
import { computeDeckStats, DeckStats } from "@/lib/deck-stats";
import { Deck } from "@/lib/types";

function JourneySteps() {
  const steps = [
    { num: "1", label: "Upload", desc: "Drop your PDF, DOCX, or notes" },
    { num: "2", label: "AI Builds", desc: "Cards, concepts, connections" },
    { num: "3", label: "Study Deeply", desc: "Explain, discuss, synthesize" },
  ];

  return (
    <div className="flex justify-center gap-12 pt-8">
      {steps.map((s) => (
        <div
          key={s.num}
          className="flex flex-col items-center gap-2 max-w-[140px]"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              color: "var(--primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {s.num}
          </div>
          <span className="text-sm font-semibold text-foreground">
            {s.label}
          </span>
          <span className="text-xs text-muted-foreground text-center leading-relaxed">
            {s.desc}
          </span>
        </div>
      ))}
    </div>
  );
}

function AddNewCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2.5 rounded-xl transition-all cursor-pointer min-h-[180px] p-6 group"
      style={{
        border: "2px dashed var(--border)",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--primary)";
        e.currentTarget.style.background = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
        style={{ background: "var(--secondary)" }}
      >
        <span
          className="text-[22px] font-light leading-none"
          style={{ color: "var(--primary)" }}
        >
          +
        </span>
      </div>
      <span className="text-sm font-medium text-muted-foreground">
        Add new material
      </span>
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    setDecks(loadAllDecks());
    setIsLoaded(true);
  }, []);

  const deckStatsMap = useMemo(() => {
    const map = new Map<string, DeckStats>();
    for (const deck of decks) {
      map.set(deck.id, computeDeckStats(deck));
    }
    return map;
  }, [decks]);

  const hasDecks = decks.length > 0;

  const totalConcepts = useMemo(
    () =>
      Array.from(deckStatsMap.values()).reduce(
        (sum, s) => sum + s.conceptCount,
        0
      ),
    [deckStatsMap]
  );

  const totalDeep = useMemo(
    () =>
      Array.from(deckStatsMap.values()).reduce(
        (sum, s) => sum + s.levelCounts.deep,
        0
      ),
    [deckStatsMap]
  );

  const handleComplete = (deckId: string) => {
    router.push(`/deck?id=${deckId}`);
  };

  if (!isLoaded) return null;

  return (
    <>
      <Header
        hasDecks={hasDecks}
        onNewMaterial={() => setShowUploadModal(true)}
      />
      <main className="flex-1 flex flex-col">
        {!hasDecks ? (
          /* ── New User Hero ── */
          <div className="max-w-[640px] mx-auto w-full px-6 text-center" style={{ paddingTop: 64, paddingBottom: 40 }}>
            <h1
              className="text-foreground mb-3 leading-tight"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              Study material in,
              <br />
              deep understanding out.
            </h1>
            <p
              className="text-muted-foreground mb-10 mx-auto"
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                maxWidth: 460,
              }}
            >
              Upload your notes, lectures, or textbook chapters.
              We&apos;ll build a learning experience that goes beyond
              memorization.
            </p>
            <UploadZone onComplete={handleComplete} />
            <JourneySteps />
          </div>
        ) : (
          /* ── Returning User Library ── */
          <div className="max-w-[1080px] mx-auto w-full px-8" style={{ paddingTop: 32, paddingBottom: 64 }}>
            <div className="mb-8">
              <h2
                className="text-foreground mb-1.5"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                Your Library
              </h2>
              <p className="text-sm text-muted-foreground">
                {decks.length} deck{decks.length !== 1 ? "s" : ""} &middot;{" "}
                {totalConcepts} concepts &middot; {totalDeep} at deep
                understanding
              </p>
            </div>

            <div
              className="gap-4 mb-10"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              }}
            >
              {decks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  stats={deckStatsMap.get(deck.id)!}
                  onClick={() => router.push(`/deck?id=${deck.id}`)}
                />
              ))}
              <AddNewCard onClick={() => setShowUploadModal(true)} />
            </div>
          </div>
        )}
      </main>

      {hasDecks && (
        <UploadModal
          open={showUploadModal}
          onOpenChange={setShowUploadModal}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
