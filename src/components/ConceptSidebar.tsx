"use client";

import { useState } from "react";
import { UnderstandingLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const LEVEL_ICONS = ["○", "◔", "◑", "◕", "●", "✦"];
const LEVEL_COLORS = [
  "var(--muted-foreground)",
  "var(--muted-foreground)",
  "var(--warning)",
  "var(--primary)",
  "var(--success)",
  "var(--success)",
];

export interface DeckConceptGroup {
  deckId: string;
  deckTitle: string;
  concepts: Array<{ name: string; level: UnderstandingLevel }>;
}

interface ConceptSidebarProps {
  deckConcepts: DeckConceptGroup[];
  activeConcept: string | null;
  onSelectConcept: (concept: string) => void;
  defaultAllExpanded?: boolean;
}

function computeDefaultExpanded(
  deckConcepts: DeckConceptGroup[],
  activeConcept: string | null,
  defaultAllExpanded: boolean
): Set<string> {
  if (defaultAllExpanded) {
    return new Set(deckConcepts.map((d) => d.deckId));
  }
  const activeDeck = deckConcepts.find((d) =>
    d.concepts.some((c) => c.name === activeConcept)
  );
  return new Set(activeDeck ? [activeDeck.deckId] : []);
}

export default function ConceptSidebar({
  deckConcepts,
  activeConcept,
  onSelectConcept,
  defaultAllExpanded = false,
}: ConceptSidebarProps) {
  const [toggleState, setToggleState] = useState<{
    forConcept: string | null;
    toggles: Record<string, boolean>;
  }>({ forConcept: activeConcept, toggles: {} });

  const userToggles =
    toggleState.forConcept === activeConcept ? toggleState.toggles : {};

  const defaultExpanded = computeDefaultExpanded(
    deckConcepts,
    activeConcept,
    defaultAllExpanded
  );

  const isDeckExpanded = (deckId: string) => {
    if (deckId in userToggles) return userToggles[deckId];
    return defaultExpanded.has(deckId);
  };

  const toggleDeck = (deckId: string) => {
    setToggleState({
      forConcept: activeConcept,
      toggles: { ...userToggles, [deckId]: !isDeckExpanded(deckId) },
    });
  };

  return (
    <ScrollArea className="max-h-full">
      <div className="flex flex-col gap-4">
        {deckConcepts.map((deck) => (
          <div key={deck.deckId}>
            <button
              onClick={() => toggleDeck(deck.deckId)}
              className="flex items-center gap-1.5 mb-2 p-0 bg-transparent border-none cursor-pointer text-muted-foreground uppercase"
              style={{
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
              }}
            >
              <span
                className="transition-transform duration-150"
                style={{
                  fontSize: 10,
                  display: "inline-block",
                  transform: isDeckExpanded(deck.deckId)
                    ? "rotate(90deg)"
                    : "rotate(0)",
                }}
              >
                ▶
              </span>
              {deck.deckTitle}
              <span style={{ fontSize: 11, opacity: 0.7 }}>
                ({deck.concepts.length})
              </span>
            </button>
            {isDeckExpanded(deck.deckId) && (
              <div className="flex flex-wrap gap-1.5">
                {deck.concepts.map((c) => {
                  const isActive = activeConcept === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => onSelectConcept(c.name)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md transition-all cursor-pointer",
                        isActive
                          ? "text-primary font-medium"
                          : "text-foreground hover:bg-accent/50"
                      )}
                      style={{
                        padding: "5px 12px",
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: "var(--font-sans)",
                        border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                        background: isActive ? "var(--accent)" : "var(--card)",
                      }}
                    >
                      <span style={{ color: LEVEL_COLORS[c.level], fontSize: 10 }}>
                        {LEVEL_ICONS[c.level]}
                      </span>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
