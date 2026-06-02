import Anthropic from "@anthropic-ai/sdk";
import { ConceptExplanation } from "../types";
import {
  CONCEPT_EXPLANATION_SYSTEM_PROMPT,
  DEEPER_EXPLANATION_SYSTEM_PROMPT,
} from "./prompts";

const client = new Anthropic();

export async function explainConcept(
  concept: string,
  context?: string,
  previousExplanation?: ConceptExplanation
): Promise<ConceptExplanation> {
  const isDeeper = !!previousExplanation;
  const systemPrompt = isDeeper
    ? DEEPER_EXPLANATION_SYSTEM_PROMPT
    : CONCEPT_EXPLANATION_SYSTEM_PROMPT;

  let userMessage = `Explain this concept: "${concept}"`;

  if (context) {
    userMessage += `\n\nContext from the study material:\n${context}`;
  }

  if (previousExplanation) {
    userMessage += `\n\nPrevious explanation the student already saw:\n${JSON.stringify(previousExplanation, null, 2)}`;
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return parseExplanationResponse(
    text,
    concept,
    previousExplanation ? previousExplanation.depth + 1 : 1
  );
}

function parseExplanationResponse(
  text: string,
  concept: string,
  depth: number
): ConceptExplanation {
  const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*$/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse explanation response from AI");
  }

  const raw = JSON.parse(jsonMatch[0]) as {
    plainLanguage: string;
    technical: string;
    anchoringExample: string;
    commonMisconceptions: string;
  };

  return {
    concept,
    plainLanguage: raw.plainLanguage,
    technical: raw.technical,
    anchoringExample: raw.anchoringExample,
    commonMisconceptions: raw.commonMisconceptions,
    depth,
  };
}
