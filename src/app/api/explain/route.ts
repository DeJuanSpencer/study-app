import { NextRequest, NextResponse } from "next/server";
import { explainConcept } from "@/lib/ai/explain-concept";
import { ConceptExplanation } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { concept, context, previousExplanation } = body as {
      concept: string;
      context?: string;
      previousExplanation?: ConceptExplanation;
    };

    if (!concept || typeof concept !== "string") {
      return NextResponse.json(
        { error: "Missing 'concept' field" },
        { status: 400 }
      );
    }

    const explanation = await explainConcept(
      concept,
      context,
      previousExplanation
    );

    return NextResponse.json(explanation);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to explain concept";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
