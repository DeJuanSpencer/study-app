import { NextRequest, NextResponse } from "next/server";
import { socraticTurn } from "@/lib/ai/socratic-dialogue";
import { SocraticMessage, AITone } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { concept, messages, tone, sourceContext, forceComplete } = body as {
      concept: string;
      messages: SocraticMessage[];
      tone?: AITone;
      sourceContext?: string;
      forceComplete?: boolean;
    };

    if (!concept || typeof concept !== "string") {
      return NextResponse.json(
        { error: "Missing 'concept' field" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Missing 'messages' array" },
        { status: 400 }
      );
    }

    const result = await socraticTurn(
      concept,
      messages,
      tone ?? "supportive",
      sourceContext,
      forceComplete
    );

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate Socratic response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
