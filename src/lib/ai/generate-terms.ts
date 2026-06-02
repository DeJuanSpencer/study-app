import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import { ParsedMaterial, KeyTerm } from "../types";
import { KEY_TERMS_SYSTEM_PROMPT } from "./prompts";

const client = new Anthropic();

export async function generateKeyTerms(
  material: ParsedMaterial
): Promise<KeyTerm[]> {
  const materialSummary = buildMaterialPrompt(material);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: KEY_TERMS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extract the key vocabulary terms and important phrases from this study material:\n\n${materialSummary}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return parseTermsResponse(text, response.stop_reason === "max_tokens");
}

function buildMaterialPrompt(material: ParsedMaterial): string {
  const parts = [`Title: ${material.title}\n`];

  for (const section of material.sections) {
    parts.push(`## ${section.heading}\n${section.content}\n`);
  }

  return parts.join("\n");
}

function parseTermsResponse(text: string, wasTruncated: boolean = false): KeyTerm[] {
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
    throw new Error("Failed to parse key terms response from AI");
  }

  const raw = JSON.parse(jsonMatch[0]) as Array<{
    term: string;
    definition: string;
    sourceSection: string;
  }>;

  return raw.map((t) => ({
    id: uuidv4(),
    term: t.term,
    definition: t.definition,
    sourceSection: t.sourceSection,
  }));
}
