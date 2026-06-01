"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { KeyTerm } from "@/lib/types";

interface KeyTermsListProps {
  terms: KeyTerm[];
}

export default function KeyTermsList({ terms }: KeyTermsListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const sorted = [...terms].sort((a, b) =>
      a.term.localeCompare(b.term)
    );
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
    );
  }, [terms, search]);

  return (
    <div className="space-y-4">
      {terms.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((term) => (
          <Card key={term.id} className="p-4">
            <p className="font-medium text-sm">{term.term}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {term.definition}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              {term.sourceSection}
            </p>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && search && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No terms match "{search}"
        </p>
      )}
    </div>
  );
}
