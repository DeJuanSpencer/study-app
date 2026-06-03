"use client";

import { UnderstandingLevel, StudyMode } from "@/lib/types";
import { Card } from "@/components/ui/card";
import LevelBar from "./LevelBar";
import LevelBadge from "./LevelBadge";
import { cn } from "@/lib/utils";

interface ConceptItem {
  name: string;
  level: UnderstandingLevel;
  recommendation: StudyMode;
  cardCount: number;
}

const MODE_HINTS: Record<StudyMode, string> = {
  review: "Start with Quick Review",
  explain: "Try Explain Mode",
  socratic: "Ready for Socratic Challenge",
  synthesis: "Attempt Synthesis",
};

interface ConceptPickerProps {
  concepts: ConceptItem[];
  onSelect: (conceptName: string) => void;
  className?: string;
}

export default function ConceptPicker({
  concepts,
  onSelect,
  className,
}: ConceptPickerProps) {
  const sorted = [...concepts].sort((a, b) => a.level - b.level);

  return (
    <div className={cn("space-y-3", className)}>
      <p
        className="text-xs font-mono uppercase tracking-widest"
        style={{ color: "var(--text-tertiary, var(--muted-foreground))" }}
      >
        Choose a concept
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((concept) => (
          <Card
            key={concept.name}
            className="p-4 cursor-pointer hover:bg-[var(--surface-hover,var(--secondary))] transition-all"
            onClick={() => onSelect(concept.name)}
          >
            <div className="flex justify-between items-start mb-2">
              <p className="font-semibold text-[15px] text-foreground">
                {concept.name}
              </p>
              <LevelBadge level={concept.level} />
            </div>
            <LevelBar level={concept.level} size="sm" className="mb-2" />
            <p className="text-[11px] font-mono text-primary">
              {MODE_HINTS[concept.recommendation]}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
