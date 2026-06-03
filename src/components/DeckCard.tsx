"use client";

import { Deck } from "@/lib/types";
import { DeckStats } from "@/lib/deck-stats";
import { Card } from "@/components/ui/card";

interface DeckCardProps {
  deck: Deck;
  stats: DeckStats;
  onClick: () => void;
}

function segmentColor(level: number): string {
  if (level >= 4) return "var(--success)";
  if (level >= 2) return "var(--primary)";
  if (level >= 1) return "var(--warning)";
  return "var(--border)";
}

export default function DeckCard({ deck, stats, onClick }: DeckCardProps) {
  return (
    <Card
      className="p-[22px] cursor-pointer transition-all hover:shadow-lg"
      style={{
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
      onClick={onClick}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--surface-hover, var(--secondary))")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "")
      }
    >
      {/* Header */}
      <div>
        <h3
          className="text-foreground mb-1 leading-snug"
          style={{
            fontSize: 16,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
          }}
        >
          {deck.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {stats.cardCount} cards &middot; {stats.conceptCount} concepts
          {stats.lastStudied ? ` · ${stats.lastStudied}` : " · Not studied yet"}
        </p>
      </div>

      {/* Mastery bar */}
      <div>
        <div className="flex gap-0.5 mb-2">
          {stats.conceptLevels.map((c, i) => (
            <div
              key={i}
              title={c.name}
              className="h-1.5 rounded-sm transition-colors"
              style={{
                flex: 1,
                background: segmentColor(c.level),
                opacity: c.level === 0 ? 0.4 : 1,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span
            className="text-muted-foreground"
            style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
          >
            {stats.depthPercent}% depth
          </span>
          <div className="flex gap-2.5">
            {stats.levelCounts.deep > 0 && (
              <span style={{ fontSize: 11, color: "var(--success)" }}>
                ● {stats.levelCounts.deep} deep
              </span>
            )}
            {stats.levelCounts.building > 0 && (
              <span style={{ fontSize: 11, color: "var(--primary)" }}>
                ◑ {stats.levelCounts.building}
              </span>
            )}
            {stats.levelCounts.new > 0 && (
              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                ○ {stats.levelCounts.new}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Source tag */}
      <div
        className="flex items-center gap-1.5 self-start"
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          background: "var(--secondary)",
        }}
      >
        <span className="text-xs">📄</span>
        <span
          className="text-muted-foreground"
          style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
        >
          {deck.materialMetadata.fileName}
        </span>
      </div>
    </Card>
  );
}
