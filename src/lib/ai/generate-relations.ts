import Anthropic from "@anthropic-ai/sdk";
import { ParsedMaterial, ConceptRelation } from "../types";
import { CONCEPT_RELATIONS_SYSTEM_PROMPT } from "./prompts";

const client = new Anthropic();

export async function generateConceptRelations(
  concepts: string[],
  material: ParsedMaterial
): Promise<ConceptRelation[]> {
  if (concepts.length < 2) return [];

  const materialSummary = material.sections
    .map((s) => `## ${s.heading}\n${s.content}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: CONCEPT_RELATIONS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here are the concepts from the study material:\n\n${concepts.map((c) => `- ${c}`).join("\n")}\n\nSource material for context:\n\n${materialSummary}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return parseRelationsResponse(text, concepts);
}

function parseRelationsResponse(
  text: string,
  validConcepts: string[]
): ConceptRelation[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const raw = JSON.parse(jsonMatch[0]) as Array<{
      from: string;
      to: string;
      relationship: string;
    }>;

    const conceptSet = new Set(validConcepts.map((c) => c.toLowerCase()));

    return raw.filter(
      (r) =>
        conceptSet.has(r.from.toLowerCase()) &&
        conceptSet.has(r.to.toLowerCase()) &&
        r.from !== r.to
    );
  } catch {
    return [];
  }
}
