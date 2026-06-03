"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConceptExplanation, ConceptRelation, UnderstandingLevel } from "@/lib/types";
import ValidationBadge from "./ValidationBadge";
import LevelBadge from "./LevelBadge";
import DepthIndicator from "./DepthIndicator";
import RelatedConcepts from "./RelatedConcepts";
import TestYourselfModal from "./TestYourselfModal";

interface ConceptExplainerProps {
  concept: string;
  context?: string;
  level?: UnderstandingLevel;
  conceptRelations?: ConceptRelation[];
  onSelectRelatedConcept?: (concept: string) => void;
}

const TABS = [
  { key: "plainLanguage", label: "Plain Language", icon: "💬" },
  { key: "technical", label: "Technical", icon: "🔬" },
  { key: "anchoringExample", label: "Example", icon: "📌" },
  { key: "commonMisconceptions", label: "Misconceptions", icon: "⚠️" },
] as const;

export default function ConceptExplainer({
  concept,
  context,
  level,
  conceptRelations,
  onSelectRelatedConcept,
}: ConceptExplainerProps) {
  const [explanations, setExplanations] = useState<ConceptExplanation[]>([]);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("plainLanguage");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);

  const currentExplanation = explanations[currentDepth] ?? null;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concept, context }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || "Failed to get explanation");
        }

        const data: ConceptExplanation = await res.json();
        setExplanations([data]);
        setLoading(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goDeeper = async (previous: ConceptExplanation) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, context, previousExplanation: previous }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to get explanation");
      }

      const data: ConceptExplanation = await res.json();
      setExplanations((prev) => [...prev, data]);
      setCurrentDepth((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoDeeper = () => {
    if (currentDepth + 1 < explanations.length) {
      setCurrentDepth(currentDepth + 1);
    } else {
      goDeeper(currentExplanation!);
    }
  };

  if (error && explanations.length === 0) {
    return (
      <Card className="p-6 border-destructive/50 bg-destructive/10">
        <p className="text-sm text-destructive mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Card>
    );
  }

  if (loading && explanations.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h2
            className="text-foreground mb-3"
            style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 700 }}
          >
            {concept}
          </h2>
          <div className="flex gap-2">
            {[120, 80, 90].map((w, i) => (
              <Skeleton key={i} className="h-3.5 rounded" style={{ width: w }} />
            ))}
          </div>
        </div>
        <Card className="p-7" style={{ borderRadius: 14 }}>
          {[100, 95, 85, 90, 60].map((w, i) => (
            <Skeleton
              key={i}
              className="h-3.5 rounded mb-4 last:mb-0"
              style={{ width: `${w}%` }}
            />
          ))}
        </Card>
      </div>
    );
  }

  if (!currentExplanation) return null;

  return (
    <div>
      {/* Concept header */}
      <div style={{ marginBottom: 28 }}>
        <div className="flex items-center gap-3 mb-2">
          <h2
            className="text-foreground"
            style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 700, margin: 0 }}
          >
            {concept}
          </h2>
          {level != null && <LevelBadge level={level} />}
        </div>
        <div className="flex items-center gap-4">
          <DepthIndicator depth={currentDepth} />
          {currentExplanation.validation?.verdict === "verified" && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--success)" }}>
              ✓ Verified
            </span>
          )}
          {currentExplanation.validation?.verdict &&
            currentExplanation.validation.verdict !== "verified" && (
              <ValidationBadge validation={currentExplanation.validation} />
            )}
        </div>
      </div>

      {/* Tabbed sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="w-full justify-start border-b border-border mb-6">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="after:!bg-primary text-[13px] px-4 py-2.5"
            >
              <span style={{ fontSize: 14 }}>{tab.icon}</span>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            <Card
              className="mb-6"
              style={{
                borderRadius: 14,
                padding: "28px 32px",
                minHeight: 200,
                boxShadow: "var(--shadow)",
              }}
            >
              {tab.key === "anchoringExample" ? (
                <div style={{ borderLeft: "3px solid var(--primary)", paddingLeft: 20 }}>
                  <p
                    className="text-foreground"
                    style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: "pre-line", margin: 0 }}
                  >
                    {currentExplanation[tab.key]}
                  </p>
                </div>
              ) : (
                <p
                  className="text-foreground"
                  style={{
                    fontSize: tab.key === "plainLanguage" ? 16 : 15,
                    lineHeight: 1.8,
                    whiteSpace: "pre-line",
                    margin: 0,
                  }}
                >
                  {currentExplanation[tab.key]}
                </p>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Action bar */}
      <div className="flex items-center gap-3" style={{ marginBottom: 36 }}>
        <Button
          variant="outline"
          onClick={handleGoDeeper}
          disabled={loading || currentDepth >= 2}
          className="gap-2 text-[13px] font-semibold"
          style={{ borderRadius: 10, padding: "10px 22px" }}
        >
          {loading ? (
            <span className="inline-flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-muted-foreground"
                  style={{
                    animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </span>
          ) : (
            "↓"
          )}
          {currentDepth > 0 ? "Go Even Deeper" : "Go Deeper"}
        </Button>

        {currentDepth > 0 && (
          <Button
            variant="ghost"
            onClick={() => setCurrentDepth(0)}
            className="text-muted-foreground text-[13px]"
            style={{ borderRadius: 10 }}
          >
            ↑ Back to overview
          </Button>
        )}

        <div className="flex-1" />

        <Button
          onClick={() => setTestModalOpen(true)}
          className="gap-2 text-[13px] font-semibold"
          style={{ borderRadius: 10, padding: "10px 22px" }}
        >
          ✍️ Test yourself on this
        </Button>
      </div>

      {/* Validation issues */}
      {currentExplanation.validation?.issues &&
        currentExplanation.validation.issues.length > 0 && (
          <Card className="p-4 border-rose-500/20 mb-8">
            <p className="text-xs font-medium text-rose-400 mb-2">
              Validation Issues
            </p>
            <div className="space-y-2">
              {currentExplanation.validation.issues.map((issue, i) => (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-rose-500/5 border border-rose-500/20"
                >
                  <p className="font-medium text-rose-400">{issue.claim}</p>
                  <p className="text-muted-foreground mt-0.5">{issue.problem}</p>
                  {issue.suggestion && (
                    <p className="text-emerald-400 mt-1">
                      Suggested: {issue.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

      {/* Related concepts */}
      {conceptRelations && onSelectRelatedConcept && (
        <RelatedConcepts
          relations={conceptRelations}
          activeConcept={concept}
          onSelect={onSelectRelatedConcept}
        />
      )}

      {/* Test yourself modal */}
      <TestYourselfModal
        concept={concept}
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
      />
    </div>
  );
}
