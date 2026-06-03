import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, deck, deckId } = body;

  if (action === "save") {
    const { error } = await supabase.from("decks").upsert(
      {
        id: deck.id,
        title: deck.title,
        cards: deck.cards,
        key_terms: deck.keyTerms ?? [],
        concept_relations: deck.conceptRelations ?? [],
        material_metadata: deck.materialMetadata,
        created_at: deck.createdAt,
      },
      { onConflict: "id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { error } = await supabase.from("decks").delete().eq("id", deckId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
