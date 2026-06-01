import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parsers";
import { parseText } from "@/lib/parsers/text";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (!body.text || typeof body.text !== "string") {
        return NextResponse.json(
          { error: "Missing 'text' field for plain text parsing" },
          { status: 400 }
        );
      }
      const material = parseText(body.text, body.fileName || "Pasted Text");
      const suggestedCardCount = Math.min(
        30,
        Math.max(5, Math.round(material.sections.length * 2 + material.rawText.length / 500))
      );
      return NextResponse.json({ ...material, suggestedCardCount });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const material = await parseFile(buffer, file.name, file.type);
    const suggestedCardCount = Math.min(
      30,
      Math.max(5, Math.round(material.sections.length * 2 + material.rawText.length / 500))
    );
    return NextResponse.json({ ...material, suggestedCardCount });
  } catch (error) {
    console.error("[/api/parse] Error:", error);
    const message =
      error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
