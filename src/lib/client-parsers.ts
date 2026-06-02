"use client";

import JSZip from "jszip";
import mammoth from "mammoth";

export interface ExtractedText {
  title: string;
  text: string;
}

export async function extractTextFromFile(file: File): Promise<ExtractedText> {
  const fallbackTitle = file.name.replace(/\.[^.]+$/, "");
  const ext = file.name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "txt": {
      const text = await file.text();
      const firstLine = text.split("\n")[0]?.trim();
      return { title: firstLine || fallbackTitle, text };
    }

    case "docx": {
      const text = await extractDocxText(file);
      const firstLine = text.split("\n")[0]?.trim();
      return { title: firstLine || fallbackTitle, text };
    }

    case "pptx": {
      const text = await extractPptxText(file);
      const firstLine = text.split("\n")[0]?.trim();
      return { title: firstLine || fallbackTitle, text };
    }

    case "pdf": {
      const text = await extractPdfText(file);
      const firstLine = text.split("\n")[0]?.trim();
      return { title: firstLine || fallbackTitle, text };
    }

    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractPptxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  const texts: string[] = [];
  const parser = new DOMParser();

  for (const slidePath of slideFiles) {
    const xml = await zip.files[slidePath].async("text");
    const doc = parser.parseFromString(xml, "text/xml");
    const textNodes = doc.getElementsByTagName("a:t");
    const slideText: string[] = [];
    for (let i = 0; i < textNodes.length; i++) {
      const content = textNodes[i].textContent?.trim();
      if (content) slideText.push(content);
    }
    if (slideText.length > 0) texts.push(slideText.join(" "));
  }

  return texts.join("\n\n");
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    useWorkerFetch: false,
    useSystemFonts: true,
  } as any).promise;

  const texts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");
    if (pageText.trim()) texts.push(pageText);
  }

  return texts.join("\n\n");
}
