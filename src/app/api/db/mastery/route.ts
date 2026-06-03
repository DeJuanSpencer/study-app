import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { action, mastery } = await req.json();

  if (action === "save-card") {
    const { error } = await supabase.from("card_mastery").upsert(
      {
        card_id: mastery.cardId,
        deck_id: mastery.deckId,
        ease: mastery.ease,
        interval: mastery.interval,
        next_review: mastery.nextReview,
        review_count: mastery.reviewCount,
        last_grade: mastery.lastGrade,
      },
      { onConflict: "card_id,deck_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "save-concept") {
    const { error } = await supabase.from("concept_mastery").upsert(
      {
        concept_id: mastery.conceptId,
        concept_name: mastery.conceptName,
        deck_id: mastery.deckId,
        level: mastery.level,
        last_mode: mastery.lastMode,
        updated_at: mastery.updatedAt,
      },
      { onConflict: "concept_id,deck_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
