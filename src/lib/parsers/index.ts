import { ParsedMaterial } from "../types";

export type SupportedFormat = "pdf" | "docx" | "pptx" | "text";

export function detectFormat(fileName: string, mimeType?: string): SupportedFormat | null {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (
    ext === "docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  if (ext === "ppt" || mimeType === "application/vnd.ms-powerpoint") {
    throw new Error(
      "Legacy .ppt files are not supported. Please save the file as .pptx in PowerPoint and re-upload."
    );
  }
  if (
    ext === "pptx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  )
    return "pptx";
  if (ext === "txt" || mimeType === "text/plain") return "text";

  return null;
}

export async function parseFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<ParsedMaterial> {
  const format = detectFormat(fileName, mimeType);

  if (!format) {
    throw new Error(
      `Unsupported file format: ${fileName}. Supported formats: PDF, DOCX, PPTX, TXT`
    );
  }

  switch (format) {
    case "pdf": {
      const { parsePdf } = await import("./pdf");
      return parsePdf(buffer, fileName);
    }
    case "docx": {
      const { parseDocx } = await import("./docx");
      return parseDocx(buffer, fileName);
    }
    case "pptx": {
      const { parsePptx } = await import("./pptx");
      return parsePptx(buffer, fileName);
    }
    case "text": {
      const { parseText } = await import("./text");
      return parseText(buffer.toString("utf-8"), fileName);
    }
  }
}
