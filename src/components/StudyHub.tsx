"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Deck } from "@/lib/types";
import { useConceptMastery } from "@/hooks/useConceptMastery";
import { Card } from "@/components/ui/card";
import AIAvatar from "./AIAvatar";
import ModeCard from "./ModeCard";
import ConceptPicker from "./ConceptPicker";

interface StudyHubProps {
  deck: Deck;
}

export default function StudyHub({ deck }: StudyHubProps) {
  const router = useRouter();
  const { concepts, recommendation } = useConceptMastery(deck);
  const [pickingFor, setPickingFor] = useState<"explain" | "socratic" | null>(
    null
  );

  const readyForExplain = concepts.filter(
    (c) => c.level >= 0 && c.level <= 2
  );
  const readyForSocratic = concepts.filter((c) => c.level === 3);
  const newConcepts = concepts.filter((c) => c.level <= 1);
  const deepConcepts = concepts.filter((c) => c.level >= 4);
  const buildingConcepts = concepts.filter(
    (c) => c.level >= 1 && c.level <= 3
  );

  const synthesisCandidates = concepts.filter((c) => c.level >= 3);

  const handleModeStart = (mode: "explain" | "socratic") => {
    setPickingFor(mode);
  };

  const handleConceptSelect = (conceptName: string) => {
    if (pickingFor) {
      router.push(
        `/study?id=${deck.id}&mode=${pickingFor}&concept=${encodeURIComponent(conceptName)}`
      );
    }
  };

  if (pickingFor) {
    const relevantConcepts =
      pickingFor === "explain" ? readyForExplain : readyForSocratic;
    const fallback = relevantConcepts.length === 0 ? concepts : relevantConcepts;

    return (
      <div className="max-w-[860px] mx-auto">
        <div className="mb-8">
          <button
            onClick={() => setPickingFor(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            ← Back to modes
          </button>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-1">
            {pickingFor === "explain" ? "Explain Mode" : "Socratic Challenge"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a concept to study
          </p>
        </div>
        <ConceptPicker concepts={fallback} onSelect={handleConceptSelect} />
      </div>
    );
  }

  return (
    <div className="max-w-[860px] mx-auto">
      <div className="mb-9">
        <h2 className="text-[28px] font-heading font-bold text-foreground mb-1.5">
          {deck.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {deck.cards.length} cards · {concepts.length} concepts
        </p>
      </div>

      <Card
        className="mb-7 p-6"
        style={{ borderLeft: "3px solid var(--primary)" }}
      >
        <div className="flex items-start gap-3.5">
          <AIAvatar size="md" />
          <div>
            <p className="text-xs font-mono text-primary uppercase tracking-widest mb-1.5">
              Study Recommendation
            </p>
            <p className="text-[15px] text-foreground leading-relaxed mb-1">
              {recommendation.message}
            </p>
          </div>
        </div>
      </Card>

      <p
        className="text-xs font-mono uppercase tracking-widest mb-3"
        style={{ color: "var(--text-tertiary, var(--muted-foreground))" }}
      >
        Choose your study mode
      </p>
      <div className="grid grid-cols-2 gap-3 mb-9">
        <ModeCard
          icon="✍️"
          title="Explain Mode"
          subtitle="Articulate your understanding. AI evaluates depth and accuracy."
          tag={`${readyForExplain.length} ready`}
          tagClassName="bg-[var(--accent-surface)] text-primary border-[var(--accent-border)]"
          onClick={() => handleModeStart("explain")}
        />
        <ModeCard
          icon="💬"
          title="Socratic Challenge"
          subtitle="AI pushes your reasoning with follow-up questions."
          tag={`${readyForSocratic.length} topics`}
          tagClassName="bg-[var(--warning-surface)] text-[var(--warning)] border-[var(--warning-border)]"
          onClick={() => handleModeStart("socratic")}
        />
        <ModeCard
          icon="⚡"
          title="Quick Review"
          subtitle="Flashcard review with honesty checks. Build foundations fast."
          tag={`${deck.cards.length} cards`}
          onClick={() => router.push(`/study?id=${deck.id}&mode=review`)}
        />
        <ModeCard
          icon="🔗"
          title="Synthesis Lab"
          subtitle="Connect concepts together. Prove deep understanding."
          tag={
            synthesisCandidates.length >= 2
              ? `${Math.floor(synthesisCandidates.length / 2)} pairs`
              : "Locked"
          }
          onClick={() => {
            if (synthesisCandidates.length >= 2) {
              router.push(`/study?id=${deck.id}&mode=synthesis`);
            }
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card
          className="p-[18px] cursor-pointer hover:bg-[var(--surface-hover,var(--secondary))] transition-all"
          onClick={() => router.push(`/study?id=${deck.id}&mode=knowledge`)}
        >
          <p
            className="text-xs font-mono uppercase tracking-widest mb-2"
            style={{ color: "var(--text-tertiary, var(--muted-foreground))" }}
          >
            Deep Understanding
          </p>
          <p className="text-[28px] font-bold mb-1" style={{ color: "var(--success)" }}>
            {deepConcepts.length}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {concepts.length}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Applied or Connected level
          </p>
        </Card>
        <Card className="p-[18px]">
          <p
            className="text-xs font-mono uppercase tracking-widest mb-2"
            style={{ color: "var(--text-tertiary, var(--muted-foreground))" }}
          >
            Building
          </p>
          <p
            className="text-[28px] font-bold mb-1"
            style={{ color: "var(--warning)" }}
          >
            {buildingConcepts.length}
          </p>
          <p className="text-xs text-muted-foreground">
            Ready for deeper study
          </p>
        </Card>
        <Card className="p-[18px]">
          <p
            className="text-xs font-mono uppercase tracking-widest mb-2"
            style={{ color: "var(--text-tertiary, var(--muted-foreground))" }}
          >
            New
          </p>
          <p className="text-[28px] font-bold mb-1 text-muted-foreground">
            {newConcepts.length}
          </p>
          <p className="text-xs text-muted-foreground">Not yet started</p>
        </Card>
      </div>
    </div>
  );
}
