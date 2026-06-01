"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConceptRelation } from "@/lib/types";

interface ConceptMapProps {
  relations: ConceptRelation[];
}

export default function ConceptMap({ relations }: ConceptMapProps) {
  const router = useRouter();

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { outgoing: ConceptRelation[]; incoming: ConceptRelation[] }
    >();

    for (const r of relations) {
      if (!map.has(r.from)) map.set(r.from, { outgoing: [], incoming: [] });
      if (!map.has(r.to)) map.set(r.to, { outgoing: [], incoming: [] });
      map.get(r.from)!.outgoing.push(r);
      map.get(r.to)!.incoming.push(r);
    }

    return [...map.entries()]
      .sort(([, a], [, b]) => {
        const aTotal = a.outgoing.length + a.incoming.length;
        const bTotal = b.outgoing.length + b.incoming.length;
        return bTotal - aTotal;
      })
      .map(([concept, connections]) => ({ concept, ...connections }));
  }, [relations]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {grouped.map(({ concept, outgoing, incoming }) => (
        <Card
          key={concept}
          className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() =>
            router.push(`/explain?concept=${encodeURIComponent(concept)}`)
          }
        >
          <p className="font-medium text-sm mb-2">{concept}</p>
          <div className="space-y-1.5">
            {outgoing.map((r, i) => (
              <div key={`o-${i}`} className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px] px-1.5"
                >
                  {r.relationship}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">{r.to}</span>
              </div>
            ))}
            {incoming.map((r, i) => (
              <div key={`i-${i}`} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground truncate">
                  {r.from}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px] px-1.5"
                >
                  {r.relationship}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
