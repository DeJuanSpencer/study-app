import { NextRequest, NextResponse } from "next/server";
import { generateCards } from "@/lib/ai/generate-cards";
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

    return NextResponse.json({ cards });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate cards";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
