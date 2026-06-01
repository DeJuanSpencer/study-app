import Anthropic from "@anthropic-ai/sdk";
import {
  FlashCard,
  ConceptExplanation,
  ParsedMaterial,
  ValidationResult,
  ValidationVerdict,
  WebSearchResult,
} from "../types";
import {
  CARD_VALIDATION_SYSTEM_PROMPT,
  EXPLANATION_VALIDATION_SYSTEM_PROMPT,
} from "./prompts";
import { searchTopics } from "./web-search";

const client = new Anthropic();

export async function validateCards(
  cards: FlashCard[],
  material: ParsedMaterial
): Promise<FlashCard[]> {
  const uniqueConcepts = [...new Set(cards.map((c) => c.concept))];
  const searchQueries = buildSearchQueries(uniqueConcepts, material.title);

  const webResults = await searchTopics(searchQueries, 3);

  const validationResults = await callCardValidation(
    cards,
    material,
    webResults
  );

  return cards.map((card, i) => ({
    ...card,
    validation: validationResults[i] ?? {
      verdict: "uncertain" as const,
      confidence: 0,
      issues: [],
      sourcesChecked: ["validation-failed"],
    },
  }));
}

export async function validateExplanation(
  explanation: ConceptExplanation,
  context?: string
): Promise<ConceptExplanation> {
  const webResults = await searchTopics(
    [`${explanation.concept} explained accurately`],
    5
  );

  const validation = await callExplanationValidation(
    explanation,
    context,
    webResults
  );

  return { ...explanation, validation };
}

function buildSearchQueries(concepts: string[], materialTitle: string): string[] {
  if (concepts.length <= 3) {
    return concepts.map((c) => `${c} ${materialTitle} facts`);
  }

  const queries: string[] = [];
  for (let i = 0; i < concepts.length; i += 3) {
    const group = concepts.slice(i, i + 3);
    queries.push(`${group.join(" AND ")} key facts`);
  }
  return queries.slice(0, 4);
}

async function callCardValidation(
  cards: FlashCard[],
  material: ParsedMaterial,
  webResults: WebSearchResult[]
): Promise<ValidationResult[]> {
  const sourceMaterialExcerpt = material.sections
    .map((s) => `[${s.heading}]: ${s.content}`)
    .join("\n\n")
    .slice(0, 6000);

  const webContext =
    webResults.length > 0
      ? webResults
          .map(
            (wr) =>
              `Search: "${wr.query}"\n${wr.results
                .map((r) => `- [${r.title}](${r.url}): ${r.content.slice(0, 300)}`)
                .join("\n")}`
          )
          .join("\n\n")
      : "No web search results available.";

  const cardsJson = JSON.stringify(
    cards.map((c, i) => ({
      index: i,
      question: c.question,
      answer: c.answer,
      concept: c.concept,
    })),
    null,
    2
  );

  const sourcesChecked = ["source-material", "model-knowledge"];
  if (webResults.length > 0) {
    sourcesChecked.push(...webResults.map((wr) => `web:${wr.query}`));
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: CARD_VALIDATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `## Source Material\n${sourceMaterialExcerpt}\n\n## Web Reference Data\n${webContext}\n\n## Cards to Validate\n${cardsJson}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return parseCardValidationResponse(text, cards.length, sourcesChecked);
}

async function callExplanationValidation(
  explanation: ConceptExplanation,
  context: string | undefined,
  webResults: WebSearchResult[]
): Promise<ValidationResult> {
  const webContext =
    webResults.length > 0
      ? webResults
          .map(
            (wr) =>
              `Search: "${wr.query}"\n${wr.results
                .map((r) => `- [${r.title}](${r.url}): ${r.content.slice(0, 400)}`)
                .join("\n")}`
          )
          .join("\n\n")
      : "No web search results available.";

  const sourcesChecked = ["model-knowledge"];
  if (context) sourcesChecked.unshift("source-material");
  if (webResults.length > 0) {
    sourcesChecked.push(...webResults.map((wr) => `web:${wr.query}`));
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: EXPLANATION_VALIDATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `## Concept\n${explanation.concept}\n\n## Source Context\n${context || "None provided."}\n\n## Web Reference Data\n${webContext}\n\n## Explanation to Validate\n${JSON.stringify(
          {
            plainLanguage: explanation.plainLanguage,
            technical: explanation.technical,
            anchoringExample: explanation.anchoringExample,
            commonMisconceptions: explanation.commonMisconceptions,
          },
          null,
          2
        )}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return parseSingleValidation(text, sourcesChecked);
}

function parseCardValidationResponse(
  text: string,
  expectedCount: number,
  sourcesChecked: string[]
): ValidationResult[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return Array.from({ length: expectedCount }, () => ({
      verdict: "uncertain" as const,
      confidence: 0,
      issues: [],
      sourcesChecked,
    }));
  }

  try {
    const raw = JSON.parse(jsonMatch[0]) as Array<{
      index: number;
      verdict: string;
      confidence: number;
      issues: Array<{ claim: string; problem: string; suggestion?: string }>;
    }>;

    const results: ValidationResult[] = Array.from(
      { length: expectedCount },
      () => ({
        verdict: "uncertain" as const,
        confidence: 0,
        issues: [],
        sourcesChecked,
      })
    );

    for (const item of raw) {
      if (item.index >= 0 && item.index < expectedCount) {
        results[item.index] = {
          verdict: normalizeVerdict(item.verdict),
          confidence: Math.max(0, Math.min(1, item.confidence)),
          issues: item.issues ?? [],
          sourcesChecked,
        };
      }
    }

    return results;
  } catch {
    return Array.from({ length: expectedCount }, () => ({
      verdict: "uncertain" as const,
      confidence: 0,
      issues: [],
      sourcesChecked,
    }));
  }
}

function parseSingleValidation(
  text: string,
  sourcesChecked: string[]
): ValidationResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { verdict: "uncertain", confidence: 0, issues: [], sourcesChecked };
  }

  try {
    const raw = JSON.parse(jsonMatch[0]) as {
      verdict: string;
      confidence: number;
      issues: Array<{ claim: string; problem: string; suggestion?: string }>;
    };

    return {
      verdict: normalizeVerdict(raw.verdict),
      confidence: Math.max(0, Math.min(1, raw.confidence)),
      issues: raw.issues ?? [],
      sourcesChecked,
    };
  } catch {
    return { verdict: "uncertain", confidence: 0, issues: [], sourcesChecked };
  }
}

function normalizeVerdict(v: string): ValidationVerdict {
  const lower = v.toLowerCase();
  if (lower === "verified") return "verified";
  if (lower === "inaccurate") return "inaccurate";
  return "uncertain";
}
