"use client";

import { useState, useCallback, useRef } from "react";
import {
  FlashCard,
  KeyTerm,
  ConceptRelation,
  MaterialMetadata,
  Deck,
} from "@/lib/types";
import { saveDeck } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import { extractTextFromFile } from "@/lib/client-parsers";
import ProcessingView from "./ProcessingView";

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.pptx,.txt";

type UploadMode = "file" | "paste" | "import";
type UploadStatus = "idle" | "parsing" | "generating" | "validating" | "done" | "error";

interface UploadZoneProps {
  compact?: boolean;
  onComplete?: (deckId: string) => void;
  onProcessingChange?: (processing: boolean) => void;
}

export default function UploadZone({
  compact = false,
  onComplete,
  onProcessingChange,
}: UploadZoneProps) {
  const [mode, setMode] = useState<UploadMode>("file");
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [cardCount, setCardCount] = useState(10);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const suggestCount = useCallback((sizeInBytes: number) => {
    const estimated = sizeInBytes * 0.5;
    setCardCount(Math.min(30, Math.max(5, Math.round(estimated / 500))));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) {
        setFile(f);
        setError(null);
        suggestCount(f.size);
      }
    },
    [suggestCount]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
        setFile(f);
        setError(null);
        suggestCount(f.size);
      }
    },
    [suggestCount]
  );

  const processUpload = async () => {
    setStatus("parsing");
    setError(null);
    onProcessingChange?.(true);

    try {
      let text: string;
      let fileName: string;

      if (mode === "file" && file) {
        const extracted = await extractTextFromFile(file);
        text = extracted.text;
        fileName = file.name;
      } else if (mode === "paste" && pastedText.trim()) {
        text = pastedText;
        fileName = "Pasted Text";
      } else {
        throw new Error("No content to process");
      }

      setStatus("generating");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, cardCount, fileName }),
      });

      setStatus("validating");

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to generate cards");
      }

      const { cards, keyTerms, conceptRelations, title, metadata } =
        (await res.json()) as {
          cards: FlashCard[];
          keyTerms?: KeyTerm[];
          conceptRelations?: ConceptRelation[];
          title: string;
          metadata: MaterialMetadata;
        };

      const deck: Deck = {
        id: uuidv4(),
        title,
        cards,
        keyTerms: keyTerms ?? [],
        conceptRelations: conceptRelations ?? [],
        createdAt: new Date().toISOString(),
        materialMetadata: metadata,
      };
      saveDeck(deck);

      setStatus("done");
      setTimeout(() => {
        onProcessingChange?.(false);
        onComplete?.(deck.id);
      }, 1500);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
      onProcessingChange?.(false);
    }
  };

  const importDeck = async (importFile: File) => {
    setError(null);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      if (!data.title || !Array.isArray(data.cards)) {
        throw new Error("Invalid deck file: missing title or cards");
      }
      const imported: Deck = {
        ...data,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      saveDeck(imported);
      onComplete?.(imported.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to import deck file"
      );
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setError(null);
  };

  const switchMode = (m: UploadMode) => {
    setMode(m);
    setFile(null);
    setPastedText("");
    setError(null);
  };

  const hasContent =
    (mode === "file" && file) ||
    (mode === "paste" && pastedText.trim().length > 30);

  const isProcessing =
    status === "parsing" || status === "generating" || status === "validating";

  if (isProcessing || status === "done" || status === "error") {
    return (
      <ProcessingView
        status={status}
        fileName={file?.name ?? "Pasted text"}
        error={error}
        onRetry={handleRetry}
      />
    );
  }

  const dropPadding = compact ? "py-9 px-7" : "py-12 px-7";

  return (
    <div className="w-full" style={{ maxWidth: compact ? 480 : 560, margin: "0 auto" }}>
      {mode === "file" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className="rounded-[14px] transition-all text-center"
          style={{
            border: `2px dashed ${isDragging ? "var(--primary)" : file ? "var(--success)" : "var(--border)"}`,
            padding: file ? "24px 28px" : undefined,
            background: isDragging
              ? "var(--accent)"
              : file
                ? "var(--success-surface, var(--secondary))"
                : "var(--card)",
            cursor: file ? "default" : "pointer",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileSelect}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center gap-3.5">
              <div
                className="w-11 h-11 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "var(--success)", color: "#fff" }}
              >
                📄
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-semibold text-foreground mb-0.5">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-lg text-muted-foreground hover:text-foreground p-1 transition-colors"
              >
                &times;
              </button>
            </div>
          ) : (
            <div className={`flex flex-col items-center gap-2.5 ${dropPadding}`}>
              <div
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[22px]"
                style={{ background: "var(--secondary)" }}
              >
                {isDragging ? "📥" : "📄"}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-foreground mb-1">
                  {isDragging ? "Drop it here" : "Drop your file here"}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  PDF, DOCX, PPTX, or TXT &mdash; or{" "}
                  <span className="text-primary cursor-pointer">browse</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "paste" && (
        <textarea
          value={pastedText}
          onChange={(e) => {
            setPastedText(e.target.value);
            if (e.target.value.length > 100) {
              setCardCount(
                Math.min(30, Math.max(5, Math.round(e.target.value.length / 500)))
              );
            }
          }}
          placeholder="Paste your study material here..."
          className="w-full rounded-xl text-sm leading-relaxed resize-y"
          style={{
            minHeight: 200,
            padding: "14px 16px",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            lineHeight: 1.7,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      )}

      {mode === "import" && (
        <div
          onClick={() => importInputRef.current?.click()}
          className="rounded-[14px] text-center cursor-pointer"
          style={{
            border: "2px dashed var(--border)",
            padding: compact ? "36px 28px" : "48px 28px",
            background: "var(--card)",
            position: "relative",
          }}
        >
          <input
            ref={importInputRef}
            type="file"
            accept=".studydeck,.json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importDeck(f);
            }}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2.5">
            <span className="text-[28px]">📦</span>
            <p className="text-sm font-medium text-foreground">
              Import a deck file
            </p>
            <p className="text-xs text-muted-foreground">
              .studydeck or .json
            </p>
          </div>
        </div>
      )}

      {/* Mode switcher */}
      <div className="flex justify-center gap-5 mt-3.5">
        {(
          [
            { key: "file", label: "Upload file" },
            { key: "paste", label: "Paste text" },
            { key: "import", label: "Import deck" },
          ] as const
        ).map((m) => (
          <button
            key={m.key}
            onClick={() => switchMode(m.key)}
            className="text-xs transition-all py-1 px-0.5"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              color: mode === m.key ? "var(--primary)" : "var(--muted-foreground)",
              fontWeight: mode === m.key ? 600 : 400,
              borderBottom: mode === m.key ? "2px solid var(--primary)" : "2px solid transparent",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="mt-4 p-3.5 rounded-xl text-sm"
          style={{
            background: "var(--destructive)/10",
            border: "1px solid var(--destructive)/30",
            color: "var(--destructive)",
          }}
        >
          {error}
        </div>
      )}

      {/* Card count + Generate */}
      {hasContent && (
        <div
          className="mt-5 flex items-center gap-4"
          style={{
            padding: "18px 22px",
            borderRadius: 12,
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex-1">
            <label
              className="text-xs uppercase tracking-widest block mb-1.5"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--muted-foreground)",
              }}
            >
              Cards to generate
            </label>
            <div className="flex items-center gap-2.5">
              <input
                type="range"
                min={5}
                max={30}
                value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
                className="flex-1"
                style={{ accentColor: "var(--primary)" }}
              />
              <span
                className="text-base font-bold text-foreground min-w-[28px] text-right"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {cardCount}
              </span>
            </div>
          </div>
          <button
            onClick={processUpload}
            className="px-7 py-3 rounded-[10px] text-sm font-semibold whitespace-nowrap transition-opacity"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Generate
          </button>
        </div>
      )}
    </div>
  );
}
