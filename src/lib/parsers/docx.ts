import mammoth from "mammoth";
import { ParsedMaterial, MaterialSection } from "../types";

export async function parseDocx(
  buffer: Buffer,
  fileName: string
): Promise<ParsedMaterial> {
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;

  const sections = extractSectionsFromHtml(html);
  const rawText = stripHtml(html);
  const title = inferTitle(fileName, sections);

  return {
    title,
    sections,
    rawText,
    metadata: {
      sourceType: "docx",
      fileName,
      uploadedAt: new Date().toISOString(),
    },
  };
}

function inferTitle(fileName: string, sections: MaterialSection[]): string {
  if (sections.length > 0 && sections[0].heading) {
    return sections[0].heading;
  }
  return fileName.replace(/\.docx?$/i, "");
}

function extractSectionsFromHtml(html: string): MaterialSection[] {
  const sections: MaterialSection[] = [];
  const headingRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
  const headings: { heading: string; index: number }[] = [];

  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      heading: stripHtml(match[1]),
      index: match.index,
    });
  }

  if (headings.length === 0) {
    const text = stripHtml(html).trim();
    if (text) {
      sections.push({ heading: "Content", content: text, order: 1 });
    }
    return sections;
  }

  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index;
    const end = i + 1 < headings.length ? headings[i + 1].index : html.length;
    const sectionHtml = html.slice(start, end);
    const contentWithoutHeading = sectionHtml.replace(
      /<h[1-6][^>]*>.*?<\/h[1-6]>/i,
      ""
    );
    const content = stripHtml(contentWithoutHeading).trim();

    sections.push({
      heading: headings[i].heading,
      content,
      order: i + 1,
    });
  }

  const beforeFirstHeading = html.slice(0, headings[0].index);
  const preContent = stripHtml(beforeFirstHeading).trim();
  if (preContent) {
    sections.unshift({
      heading: "Introduction",
      content: preContent,
      order: 0,
    });
    sections.forEach((s, i) => (s.order = i + 1));
  }

  return sections;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
