import { PDFParse } from "pdf-parse";
import { ParsedMaterial, MaterialSection } from "../types";

export async function parsePdf(
  buffer: Buffer,
  fileName: string
): Promise<ParsedMaterial> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const rawText = result.text || result.pages.map((p) => p.text).join("\n\n");

  const sections = splitIntoSections(rawText);
  const title = inferTitle(fileName, sections);

  return {
    title,
    sections,
    rawText,
    metadata: {
      sourceType: "pdf",
      fileName,
      uploadedAt: new Date().toISOString(),
    },
  };
}

function inferTitle(fileName: string, sections: MaterialSection[]): string {
  if (sections.length > 0 && sections[0].heading) {
    return sections[0].heading;
  }
  return fileName.replace(/\.pdf$/i, "");
}

function splitIntoSections(text: string): MaterialSection[] {
  const lines = text.split("\n");
  const sections: MaterialSection[] = [];
  let currentHeading = "";
  let currentContent: string[] = [];
  let order = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isLikelyHeading(trimmed, lines)) {
      if (currentContent.length > 0 || currentHeading) {
        sections.push({
          heading: currentHeading || `Section ${order}`,
          content: currentContent.join("\n").trim(),
          order: order++,
        });
      }
      currentHeading = trimmed;
      currentContent = [];
    } else {
      currentContent.push(trimmed);
    }
  }

  if (currentContent.length > 0 || currentHeading) {
    sections.push({
      heading: currentHeading || `Section ${order}`,
      content: currentContent.join("\n").trim(),
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

function isLikelyHeading(line: string, allLines: string[]): boolean {
  if (line.length > 100) return false;
  if (line.length < 3) return false;
  if (/^(chapter|section|part)\s+\d/i.test(line)) return true;
  if (/^\d+(\.\d+)*\s+[A-Z]/.test(line)) return true;
  if (line === line.toUpperCase() && line.length > 3 && line.length < 80)
    return true;

  const idx = allLines.findIndex((l) => l.trim() === line);
  if (idx >= 0 && idx < allLines.length - 1) {
    const nextLine = allLines[idx + 1]?.trim();
    if (nextLine === "" && line.length < 60) return true;
  }

  return false;
}
