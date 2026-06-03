import Anthropic from "@anthropic-ai/sdk";
import { EvaluationResult, AITone } from "../types";
import { EVALUATE_RESPONSE_SYSTEM_PROMPT } from "./prompts";

const client = new Anthropic();

export async function evaluateExplanation(
  concept: string,
  studentResponse: string,
  sourceContext?: string,
  tone: AITone = "supportive"
): Promise<EvaluationResult> {
  let userMessage = `Concept: "${concept}"\n\nStudent's explanation:\n${studentResponse}`;

  if (sourceContext) {
    userMessage += `\n\nSource material context:\n${sourceContext}`;
  }

  const systemPrompt = `${EVALUATE_RESPONSE_SYSTEM_PROMPT}\n\nTone: ${tone}. Adjust your language accordingly — ${tone === "supportive" ? "be encouraging and constructive" : tone === "rigorous" ? "be direct and demanding" : "be neutral and balanced"}.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return parseEvaluationResponse(text);
}

export async function evaluateSynthesis(
  concepts: string[],
  studentResponse: string,
  sourceContext?: string,
  tone: AITone = "supportive"
): Promise<EvaluationResult> {
  let userMessage = `Concepts to synthesize: ${concepts.join(", ")}\n\nStudent's synthesis:\n${studentResponse}\n\nEvaluate how well the student connects these concepts together. Assess the quality of the relationships they identify, not just their understanding of individual concepts.`;

  if (sourceContext) {
    userMessage += `\n\nSource material context:\n${sourceContext}`;
  }

  const systemPrompt = `${EVALUATE_RESPONSE_SYSTEM_PROMPT}\n\nTone: ${tone}. This is a synthesis evaluation — prioritize assessing cross-concept connections, not individual concept accuracy.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return parseEvaluationResponse(text);
}

function parseEvaluationResponse(text: string): EvaluationResult {
  const cleaned = text
    .replace(/```(?:json)?\s*/g, "")
    .replace(/```\s*$/g, "")
    .trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse evaluation response from AI");
  }

  const raw = JSON.parse(jsonMatch[0]) as {
    score: number;
    strengths: string[];
    gaps: string[];
    corrections: string[];
    nextStep: string;
  };

  return {
    score: Math.max(0, Math.min(100, raw.score)),
    strengths: raw.strengths ?? [],
    gaps: raw.gaps ?? [],
    corrections: raw.corrections ?? [],
    nextStep: raw.nextStep ?? "",
  };
}
