import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const [decks, sessions, cardMastery, conceptMastery] = await Promise.all([
    supabase.from("decks").select("*"),
    supabase.from("study_sessions").select("*"),
    supabase.from("card_mastery").select("*"),
    supabase.from("concept_mastery").select("*"),
  ]);

  if (decks.error) {
    return NextResponse.json({ error: decks.error.message }, { status: 500 });
  }

  return NextResponse.json({
    decks: (decks.data ?? []).map(rowToDeck),
    sessions: (sessions.data ?? []).map(rowToSession),
    cardMastery: cardMastery.data ?? [],
    conceptMastery: (conceptMastery.data ?? []).map(rowToConceptMastery),
  });
}

function rowToDeck(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    cards: row.cards,
    keyTerms: row.key_terms,
    conceptRelations: row.concept_relations,
    createdAt: row.created_at,
    materialMetadata: row.material_metadata,
  };
}

function rowToSession(row: Record<string, unknown>) {
  return {
    deckId: row.deck_id,
    completedAt: row.completed_at,
    cardsReviewed: row.cards_reviewed,
    results: row.results,
    weakConcepts: row.weak_concepts,
  };
}

function rowToConceptMastery(row: Record<string, unknown>) {
  return {
    conceptId: row.concept_id,
    conceptName: row.concept_name,
    deckId: row.deck_id,
    level: row.level,
    lastMode: row.last_mode,
    updatedAt: row.updated_at,
  };
}
