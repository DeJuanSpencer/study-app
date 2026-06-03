"use client";

import { useRouter } from "next/navigation";
import { Deck, UnderstandingLevel } from "@/lib/types";
import { useConceptMastery } from "@/hooks/useConceptMastery";
import { Card } from "@/components/ui/card";
import ScoreRing from "./ScoreRing";
import LevelBar from "./LevelBar";
import LevelBadge from "./LevelBadge";
import { cn } from "@/lib/utils";

const MASTERY_LEVELS: Array<{ label: string; icon: string }> = [
  { label: "New", icon: "○" },
  { label: "Recognized", icon: "◔" },
  { label: "Recalled", icon: "◑" },
  { label: "Explained", icon: "◕" },
  { label: "Applied", icon: "●" },
  { label: "Connected", icon: "✦" },
];

const MODE_HINTS = [
  "Start with Quick Review",
  "Try Quick Review",
  "Move to Explain Mode",
  "Try Socratic Challenge",
  "Attempt Synthesis",
  "Connected!",
];

interface KnowledgeMapProps {
  deck: Deck;
}

export default function KnowledgeMap({ deck }: KnowledgeMapProps) {
  const router = useRouter();
  const { concepts } = useConceptMastery(deck);

  const totalLevels = concepts.reduce((s, c) => s + c.level, 0);
  const maxLevels = concepts.length * 5;
  const overallScore = maxLevels > 0 ? Math.round((totalLevels / maxLevels) * 100) : 0;

  const levelCounts = [0, 0, 0, 0, 0, 0];
  concepts.forEach((c) => levelCounts[c.level]++);

  const sorted = [...concepts].sort((a, b) => a.level - b.level);

  const handleConceptClick = (concept: { name: string; level: UnderstandingLevel }) => {
    if (concept.level <= 2) {
      router.push(`/study?id=${deck.id}&mode=explain&concept=${encodeURIComponent(concept.name)}`);
    } else if (concept.level === 3) {
      router.push(`/study?id=${deck.id}&mode=socratic&concept=${encodeURIComponent(concept.name)}`);
    } else {
      router.push(`/study?id=${deck.id}&mode=synthesis`);
    }
  };

  return (
    <div className="max-w-[860px] mx-auto">
      <div className="mb-8">
        <h2 className="text-[26px] font-heading font-bold text-foreground mb-1.5">
          Knowledge Map
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Understanding depth across all concepts &mdash; not just what you&apos;ve
          seen, but what you truly own.
        </p>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-8 mb-9 items-center">
        <ScoreRing score={overallScore} size={100} strokeWidth={7} />
        <div>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {MASTERY_LEVELS.map((lvl, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs",
                  levelCounts[i] > 0
                    ? "bg-card border border-border"
                    : "opacity-50"
                )}
              >
                <span>{lvl.icon}</span>
                <span className="font-mono text-muted-foreground">
                  {lvl.label}
                </span>
                <span className="font-bold text-foreground">
                  {levelCounts[i]}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-muted-foreground">
            {levelCounts[4] + levelCounts[5]} concepts at deep understanding
            &middot; {levelCounts[0]} concepts not yet started
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
        {sorted.map((concept) => (
          <Card
            key={concept.name}
            className="p-[18px] cursor-pointer hover:bg-[var(--surface-hover,var(--secondary))] transition-all hover:shadow-md"
            onClick={() => handleConceptClick(concept)}
          >
            <div className="flex justify-between items-start mb-2.5">
              <p className="font-semibold text-[15px] text-foreground">
                {concept.name}
              </p>
              <LevelBadge level={concept.level} />
            </div>
            <LevelBar level={concept.level} size="sm" className="mb-2.5" />
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {concept.description}
            </p>
            {concept.level < 5 && (
              <p className="text-[11px] font-mono text-primary">
                Next: {MODE_HINTS[concept.level + 1]}
              </p>
            )}
            {concept.level === 5 && (
              <p className="text-[11px] font-mono text-[var(--success)]">
                {MODE_HINTS[5]}
              </p>
            )}
          </Card>
        ))}
      </div>

      {deck.conceptRelations && deck.conceptRelations.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
            Concept Connections
          </h3>
          <div className="flex flex-col gap-2">
            {deck.conceptRelations.map((conn, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-card border border-border text-[13px]"
              >
                <span className="font-semibold text-foreground">
                  {conn.from}
                </span>
                <span className="px-2 py-0.5 rounded bg-[var(--accent-surface,var(--accent))] text-primary font-mono text-[11px]">
                  {conn.relationship}
                </span>
                <span className="text-muted-foreground">&rarr;</span>
                <span className="font-semibold text-foreground">{conn.to}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
