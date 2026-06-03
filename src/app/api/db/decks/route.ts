import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { action, deck, deckId } = body;

  if (action === "save") {
    const { error } = await supabase.from("decks").upsert(
      {
        id: deck.id,
        user_id: user.id,
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
    const { error } = await supabase
      .from("decks")
      .delete()
      .eq("id", deckId)
      .eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
