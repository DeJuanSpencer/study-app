"use client";

import { useState } from "react";
import {
  ArrowDown,
  Loader2,
  BookOpen,
  Beaker,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConceptExplanation } from "@/lib/types";
import ValidationBadge from "./ValidationBadge";

interface ConceptExplainerProps {
  concept: string;
  context?: string;
}

const SECTION_CONFIG = [
  {
    key: "plainLanguage" as const,
    label: "Plain Language",
    icon: BookOpen,
    description: "No jargon, just understanding",
  },
  {
    key: "technical" as const,
    label: "Technical Explanation",
    icon: Beaker,
    description: "Precise terminology and mechanisms",
  },
  {
    key: "anchoringExample" as const,
    label: "Anchoring Example",
    icon: MapPin,
    description: "A concrete, real-world scenario",
  },
  {
    key: "commonMisconceptions" as const,
    label: "Common Misconceptions",
    icon: AlertTriangle,
    description: "What students get wrong",
  },
];

export default function ConceptExplainer({
  concept,
  context,
}: ConceptExplainerProps) {
  const [explanation, setExplanation] = useState<ConceptExplanation | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchExplanation = async (previous?: ConceptExplanation) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept,
          context,
          previousExplanation: previous,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get explanation");
      }

      const data: ConceptExplanation = await res.json();
      setExplanation(data);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!hasLoaded && !loading) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">{concept}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get a structured explanation of this concept
        </p>
        <Button onClick={() => fetchExplanation()}>
          <BookOpen className="h-4 w-4 mr-1.5" />
          Explain This
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{concept}</h3>
        {SECTION_CONFIG.map(({ key, label }) => (
          <Card key={key} className="p-5">
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-4/5 mb-2" />
            <Skeleton className="h-3 w-3/5" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive/50 bg-destructive/10">
        <p className="text-sm text-destructive mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={() => fetchExplanation()}>
          Try Again
        </Button>
      </Card>
    );
  }

  if (!explanation) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{concept}</h3>
        <div className="flex items-center gap-2">
          {explanation.depth > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              Depth {explanation.depth}
            </span>
          )}
          <ValidationBadge validation={explanation.validation} />
        </div>
      </div>

      {SECTION_CONFIG.map(({ key, label, icon: Icon, description }) => (
        <Card key={key} className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">{label}</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{description}</p>
          <Separator className="mb-3" />
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {explanation[key]}
          </p>
        </Card>
      ))}

      {explanation.validation?.issues &&
        explanation.validation.issues.length > 0 && (
          <Card className="p-4 border-rose-500/20">
            <p className="text-xs font-medium text-rose-400 mb-2">
              Validation Issues
            </p>
            <div className="space-y-2">
              {explanation.validation.issues.map((issue, i) => (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-rose-500/5 border border-rose-500/20"
                >
                  <p className="font-medium text-rose-400">{issue.claim}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {issue.problem}
                  </p>
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

      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          onClick={() => fetchExplanation(explanation)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <ArrowDown className="h-4 w-4 mr-1.5" />
          )}
          Go Deeper
        </Button>
      </div>
    </div>
  );
}
