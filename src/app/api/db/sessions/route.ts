import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { session } = await req.json();

  const { error } = await supabase.from("study_sessions").insert({
    deck_id: session.deckId,
    completed_at: session.completedAt,
    cards_reviewed: session.cardsReviewed,
    results: session.results,
    weak_concepts: session.weakConcepts,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
