import { parseOffice } from "officeparser";
import { ParsedMaterial, MaterialSection } from "../types";

export async function parsePptx(
  buffer: Buffer,
  fileName: string
): Promise<ParsedMaterial> {
  const ast = await parseOffice(buffer);
  const rawText = ast.toText();

  const sections = splitIntoSlides(rawText);
  const title = inferTitle(fileName, sections);

  return {
    title,
    sections,
    rawText,
    metadata: {
      sourceType: "pptx",
      fileName,
      uploadedAt: new Date().toISOString(),
    },
  };
}

function inferTitle(fileName: string, sections: MaterialSection[]): string {
  if (sections.length > 0 && sections[0].heading) {
    return sections[0].heading;
  }
  return fileName.replace(/\.pptx?$/i, "");
}

function splitIntoSlides(text: string): MaterialSection[] {
  const chunks = text.split(/\n{2,}/);
  const sections: MaterialSection[] = [];
  let order = 1;

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n");
    const heading = lines[0].trim();
    const content = lines.slice(1).join("\n").trim();

    sections.push({
      heading: heading || `Slide ${order}`,
      content: content || heading,
      order: order++,
    });
  }

  if (sections.length === 0 && text.trim()) {
    sections.push({
      heading: "Content",
      content: text.trim(),
      order: 1,
    });
  }

  return sections;
}
