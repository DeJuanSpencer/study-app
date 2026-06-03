import { NextRequest, NextResponse } from "next/server";
import {
  evaluateExplanation,
  evaluateSynthesis,
} from "@/lib/ai/evaluate-response";
import { AITone } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { concept, studentResponse, sourceContext, tone, mode, concepts } =
      body as {
        concept: string;
        studentResponse: string;
        sourceContext?: string;
        tone?: AITone;
        mode: "explain" | "synthesis";
        concepts?: string[];
      };

    if (!studentResponse || typeof studentResponse !== "string") {
      return NextResponse.json(
        { error: "Missing 'studentResponse' field" },
        { status: 400 }
      );
    }

    if (mode === "synthesis") {
      if (!concepts || concepts.length < 2) {
        return NextResponse.json(
          { error: "Synthesis mode requires at least 2 concepts" },
          { status: 400 }
        );
      }
      const result = await evaluateSynthesis(
        concepts,
        studentResponse,
        sourceContext,
        tone
      );
      return NextResponse.json(result);
    }

    if (!concept || typeof concept !== "string") {
      return NextResponse.json(
        { error: "Missing 'concept' field" },
        { status: 400 }
      );
    }

    const result = await evaluateExplanation(
      concept,
      studentResponse,
      sourceContext,
      tone
    );
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to evaluate response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
