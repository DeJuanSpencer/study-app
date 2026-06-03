import Anthropic from "@anthropic-ai/sdk";
import { SocraticMessage, SocraticResponse, AITone } from "../types";
import { SOCRATIC_SYSTEM_PROMPT } from "./prompts";
import { validateFeedback } from "./validate";

const client = new Anthropic();

export async function socraticTurn(
  concept: string,
  messages: SocraticMessage[],
  tone: AITone = "supportive",
  sourceContext?: string,
  forceComplete?: boolean
): Promise<SocraticResponse> {
  const toneInstruction =
    tone === "supportive"
      ? "Be encouraging and warm. Acknowledge effort before probing deeper."
      : tone === "rigorous"
        ? "Be direct and demanding. Don't accept vague answers. Push for precision."
        : "Be balanced and neutral. Focus on the content, not the student's feelings.";

  const forceCompleteInstruction = forceComplete
    ? "\n\nIMPORTANT: This is the final exchange. You MUST wrap up now with a summary of what the student demonstrated."
    : "";

  const systemPrompt = `${SOCRATIC_SYSTEM_PROMPT}\n\nTone: ${toneInstruction}\n\nConcept being explored: "${concept}"${sourceContext ? `\n\nSource material context:\n${sourceContext}` : ""}${forceCompleteInstruction}`;

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: m.text,
  }));

  if (anthropicMessages.length === 0) {
    anthropicMessages.push({
      role: "user",
      content: `I want to explore the concept "${concept}". Start with your first question.`,
    });
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const result = parseSocraticResponse(text);

  if (result.isComplete && result.summary && sourceContext) {
    const summaryText = [
      `Demonstrated: ${result.summary.demonstrated.join(", ")}`,
      `Emerging: ${result.summary.emerging.join(", ")}`,
      `Depth assessment: ${result.summary.depth}`,
    ].join("\n");
    result.summary.validation = await validateFeedback(summaryText, sourceContext, concept);
  }

  return result;
}

function parseSocraticResponse(text: string): SocraticResponse {
  const cleaned = text
    .replace(/```(?:json)?\s*/g, "")
    .replace(/```\s*$/g, "")
    .trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Socratic response from AI");
  }

  const raw = JSON.parse(jsonMatch[0]) as {
    message: string;
    isComplete: boolean;
    summary?: {
      demonstrated: string[];
      emerging: string[];
      toExplore: string[];
      depth: string;
    };
  };

  return {
    message: raw.message,
    isComplete: raw.isComplete ?? false,
    summary: raw.summary
      ? {
          demonstrated: raw.summary.demonstrated ?? [],
          emerging: raw.summary.emerging ?? [],
          toExplore: raw.summary.toExplore ?? [],
          depth: raw.summary.depth ?? "",
        }
      : undefined,
  };
}
