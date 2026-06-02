import { NextRequest, NextResponse } from "next/server";
import { parseText } from "@/lib/parsers/text";
import { generateCards } from "@/lib/ai/generate-cards";
import { generateKeyTerms } from "@/lib/ai/generate-terms";
import { generateConceptRelations } from "@/lib/ai/generate-relations";
import { validateCards } from "@/lib/ai/validate";
import { isWebSearchAvailable } from "@/lib/ai/web-search";
import { ParsedMaterial } from "@/lib/types";

function suggestCardCount(material: ParsedMaterial): number {
  return Math.min(
    30,
    Math.max(
      5,
      Math.round(material.sections.length * 2 + material.rawText.length / 500)
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let material: ParsedMaterial;
    let cardCount = 10;

    if (body.text) {
      material = parseText(body.text, body.fileName || "Pasted Text");
      cardCount = body.cardCount ?? 10;
    } else if (body.material) {
      material = body.material;
      cardCount = body.cardCount ?? 10;
    } else {
      return NextResponse.json(
        { error: "Missing text or material content" },
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
      title: material.title,
      metadata: material.metadata,
      suggestedCardCount: suggestCardCount(material),
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
