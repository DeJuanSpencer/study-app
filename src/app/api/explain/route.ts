import { NextRequest, NextResponse } from "next/server";
import { explainConcept } from "@/lib/ai/explain-concept";
import { validateExplanation } from "@/lib/ai/validate";
import { isWebSearchAvailable } from "@/lib/ai/web-search";
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

    let validatedExplanation = explanation;
    try {
      validatedExplanation = await validateExplanation(explanation, context);
    } catch {
      // Validation failure should not block explanation delivery
    }

    return NextResponse.json({
      ...validatedExplanation,
      validationMeta: {
        performed: validatedExplanation.validation !== undefined,
        webSearchUsed: isWebSearchAvailable(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to explain concept";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
