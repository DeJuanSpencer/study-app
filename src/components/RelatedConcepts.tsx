import { ConceptRelation } from "@/lib/types";

interface RelatedConceptsProps {
  relations: ConceptRelation[];
  activeConcept: string;
  onSelect: (concept: string) => void;
}

export default function RelatedConcepts({
  relations,
  activeConcept,
  onSelect,
}: RelatedConceptsProps) {
  const filtered = relations
    .filter((r) => r.from === activeConcept || r.to === activeConcept)
    .map((r) => ({
      name: r.from === activeConcept ? r.to : r.from,
      rel: r.relationship,
      direction: r.from === activeConcept ? ("to" as const) : ("from" as const),
    }));

  if (filtered.length === 0) return null;

  return (
    <div>
      <p
        className="text-muted-foreground uppercase mb-3"
        style={{
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.05em",
        }}
      >
        Connected Concepts
      </p>
      <div className="flex flex-col gap-2">
        {filtered.map((r, i) => (
          <button
            key={i}
            onClick={() => onSelect(r.name)}
            className="flex items-center gap-2.5 rounded-[10px] transition-all text-left hover:bg-accent/50"
            style={{
              padding: "10px 14px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <span className="font-semibold text-foreground">{r.name}</span>
            <span
              className="text-primary"
              style={{
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                background: "var(--accent)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {r.rel}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>
              {r.direction === "to" ? "→" : "←"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
