import { ParsedMaterial, MaterialSection } from "../types";

export function parseText(
  text: string,
  fileName: string = "Pasted Text"
): ParsedMaterial {
  const sections = splitTextIntoSections(text);
  const title = inferTitle(fileName, sections);

  return {
    title,
    sections,
    rawText: text,
    metadata: {
      sourceType: "text",
      fileName,
      uploadedAt: new Date().toISOString(),
    },
  };
}

function inferTitle(fileName: string, sections: MaterialSection[]): string {
  if (sections.length > 0 && sections[0].heading !== "Section 1") {
    return sections[0].heading;
  }
  if (fileName !== "Pasted Text") {
    return fileName.replace(/\.txt$/i, "");
  }
  return "Pasted Material";
}

function splitTextIntoSections(text: string): MaterialSection[] {
  const markdownHeadingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: { heading: string; index: number; level: number }[] = [];

  let match;
  while ((match = markdownHeadingRegex.exec(text)) !== null) {
    headings.push({
      heading: match[2].trim(),
      index: match.index,
      level: match[1].length,
    });
  }

  if (headings.length > 0) {
    return buildSectionsFromHeadings(text, headings);
  }

  return buildSectionsFromParagraphs(text);
}

function buildSectionsFromHeadings(
  text: string,
  headings: { heading: string; index: number; level: number }[]
): MaterialSection[] {
  const sections: MaterialSection[] = [];

  const preContent = text.slice(0, headings[0].index).trim();
  if (preContent) {
    sections.push({ heading: "Introduction", content: preContent, order: 1 });
  }

  for (let i = 0; i < headings.length; i++) {
    const lineEnd = text.indexOf("\n", headings[i].index);
    const start = lineEnd >= 0 ? lineEnd + 1 : headings[i].index;
    const end = i + 1 < headings.length ? headings[i + 1].index : text.length;
    const content = text.slice(start, end).trim();

    sections.push({
      heading: headings[i].heading,
      content,
      order: sections.length + 1,
    });
  }

  return sections;
}

function buildSectionsFromParagraphs(text: string): MaterialSection[] {
  const paragraphs = text.split(/\n{2,}/);
  const sections: MaterialSection[] = [];
  let order = 1;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    sections.push({
      heading: `Section ${order}`,
      content: trimmed,
      order: order++,
    });
  }

  if (sections.length === 0 && text.trim()) {
    sections.push({ heading: "Content", content: text.trim(), order: 1 });
  }

  return sections;
}
