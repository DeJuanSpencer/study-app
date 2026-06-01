import { NextRequest, NextResponse } from "next/server";
import { generateCards } from "@/lib/ai/generate-cards";
import { generateKeyTerms } from "@/lib/ai/generate-terms";
import { generateConceptRelations } from "@/lib/ai/generate-relations";
import { validateCards } from "@/lib/ai/validate";
import { isWebSearchAvailable } from "@/lib/ai/web-search";
import { ParsedMaterial } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { material, cardCount = 10 } = body as {
      material: ParsedMaterial;
      cardCount?: number;
    };

    if (!material || !material.rawText) {
      return NextResponse.json(
        { error: "Missing or invalid parsed material" },
        { status: 400 }
      );
    }

    const count = Math.min(Math.max(cardCount, 1), 30);
    const cards = await generateCards(material, count);

    const [validatedCards, keyTerms] = await Promise.all([
      validateCards(cards, material).catch(() => cards),
      generateKeyTerms(material).catch(() => []),
    ]);

    const concepts = [
      ...new Set([
        ...validatedCards.map((c) => c.concept),
        ...keyTerms.map((t) => t.term),
      ]),
    ];
    const conceptRelations = await generateConceptRelations(
      concepts,
      material
    ).catch(() => []);

    return NextResponse.json({
      cards: validatedCards,
      keyTerms,
      conceptRelations,
      validation: {
        performed: validatedCards.some((c) => c.validation !== undefined),
        webSearchUsed: isWebSearchAvailable(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate cards";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
