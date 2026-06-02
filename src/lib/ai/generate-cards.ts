import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import { ParsedMaterial, FlashCard } from "../types";
import { CARD_GENERATION_SYSTEM_PROMPT } from "./prompts";

const client = new Anthropic();

export async function generateCards(
  material: ParsedMaterial,
  cardCount: number = 10
): Promise<FlashCard[]> {
  const materialSummary = buildMaterialPrompt(material);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: CARD_GENERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate exactly ${cardCount} higher-order flashcards from this study material:\n\n${materialSummary}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return parseCardResponse(text, response.stop_reason === "max_tokens");
}

function buildMaterialPrompt(material: ParsedMaterial): string {
  const parts = [`Title: ${material.title}\n`];

  for (const section of material.sections) {
    parts.push(`## ${section.heading}\n${section.content}\n`);
  }

  return parts.join("\n");
}

function parseCardResponse(text: string, wasTruncated: boolean = false): FlashCard[] {
  let cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*$/g, "").trim();

  let jsonMatch = cleaned.match(/\[[\s\S]*\]/);

  if (!jsonMatch && wasTruncated) {
    const start = cleaned.indexOf("[");
    if (start !== -1) {
      let partial = cleaned.slice(start).replace(/,\s*$/, "");
      const lastComplete = partial.lastIndexOf("}");
      if (lastComplete !== -1) {
        partial = partial.slice(0, lastComplete + 1) + "]";
        jsonMatch = [partial];
      }
    }
  }

  if (!jsonMatch) {
    throw new Error("Failed to parse flashcard response from AI");
  }

  const raw = JSON.parse(jsonMatch[0]) as Array<{
    question: string;
    answer: string;
    concept: string;
    difficulty: string;
    sourceSection: string;
  }>;

  return raw.map((card) => ({
    id: uuidv4(),
    question: card.question,
    answer: card.answer,
    concept: card.concept,
    difficulty: validateDifficulty(card.difficulty),
    sourceSection: card.sourceSection,
  }));
}

function validateDifficulty(
  d: string
): "foundational" | "intermediate" | "advanced" {
  const valid = ["foundational", "intermediate", "advanced"] as const;
  const lower = d.toLowerCase();
  if (valid.includes(lower as (typeof valid)[number])) {
    return lower as (typeof valid)[number];
  }
  return "intermediate";
}
