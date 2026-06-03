import { Deck } from "../types";

export function buildSourceContext(deck: Deck): string {
  const bySection = new Map<string, string[]>();

  for (const card of deck.cards) {
    const section = card.sourceSection || "General";
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section)!.push(`- ${card.concept}: ${card.answer}`);
  }

  let context = `Source material: "${deck.title}"\n\n`;

  for (const [heading, items] of bySection) {
    context += `[${heading}]\n${items.join("\n")}\n\n`;
  }

  if (deck.keyTerms?.length) {
    context += "[Key Terms]\n";
    for (const term of deck.keyTerms) {
      context += `- ${term.term}: ${term.definition}\n`;
    }
    context += "\n";
  }

  return context.slice(0, 6000);
}
