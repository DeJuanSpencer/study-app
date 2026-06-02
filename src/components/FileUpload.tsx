"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  Loader2,
  Clipboard,
  X,
  Check,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FlashCard,
  KeyTerm,
  ConceptRelation,
  MaterialMetadata,
  Deck,
} from "@/lib/types";
import { saveDeck } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
];

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.pptx,.txt";

export default function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [cardCount, setCardCount] = useState(10);
  const [status, setStatus] = useState<
    "idle" | "parsing" | "generating" | "validating" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const suggestCount = useCallback((sizeInBytes: number) => {
    const estimatedChars = sizeInBytes * 0.5;
    setCardCount(Math.min(30, Math.max(5, Math.round(estimatedChars / 500))));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) {
        setFile(dropped);
        setError(null);
        suggestCount(dropped.size);
      }
    },
    [suggestCount]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) {
        setFile(selected);
        setError(null);
        suggestCount(selected.size);
      }
    },
    [suggestCount]
  );

  const processUpload = async (mode: "file" | "text") => {
    setStatus("parsing");
    setError(null);

    try {
      let fetchOptions: RequestInit;

      if (mode === "file" && file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("cardCount", String(cardCount));
        fetchOptions = { method: "POST", body: formData };
      } else if (mode === "text" && pastedText.trim()) {
        fetchOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: pastedText, cardCount }),
        };
      } else {
        throw new Error("No content to process");
      }

      setStatus("generating");

      const res = await fetch("/api/generate", fetchOptions);

      setStatus("validating");

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to generate cards");
      }

      const {
        cards,
        keyTerms,
        conceptRelations,
        title,
        metadata,
        suggestedCardCount,
      } = (await res.json()) as {
        cards: FlashCard[];
        keyTerms?: KeyTerm[];
        conceptRelations?: ConceptRelation[];
        title: string;
        metadata: MaterialMetadata;
        suggestedCardCount?: number;
      };

      if (suggestedCardCount) setCardCount(suggestedCardCount);

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
      router.push(`/deck?id=${deck.id}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const isProcessing =
    status === "parsing" ||
    status === "generating" ||
    status === "validating";

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
      router.push(`/deck?id=${imported.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to import deck file"
      );
    }
  };

  const STEPS = [
    { key: "parsing", label: "Parsing material" },
    { key: "generating", label: "Generating cards" },
    { key: "validating", label: "Fact-checking & extracting key terms" },
  ] as const;

  const currentStepIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" disabled={isProcessing}>
            <Upload className="h-4 w-4 mr-1.5" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="paste" disabled={isProcessing}>
            <Clipboard className="h-4 w-4 mr-1.5" />
            Paste Text
          </TabsTrigger>
          <TabsTrigger value="import" disabled={isProcessing}>
            <Download className="h-4 w-4 mr-1.5" />
            Import Deck
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <Card
            className={`relative border-2 border-dashed transition-colors cursor-pointer p-10 ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3 text-center">
              {file ? (
                <>
                  <FileText className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop your file here</p>
                    <p className="text-sm text-muted-foreground">
                      PDF, DOCX, PPTX, or TXT
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="paste" className="mt-4">
          <Textarea
            placeholder="Paste your study material here..."
            className="min-h-[200px] resize-y"
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value);
              if (e.target.value.trim().length > 100) {
                setCardCount(
                  Math.min(30, Math.max(5, Math.round(e.target.value.length / 500)))
                );
              }
            }}
            disabled={isProcessing}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <Card className="relative border-2 border-dashed border-border hover:border-muted-foreground/50 transition-colors cursor-pointer p-10">
            <input
              type="file"
              accept=".studydeck,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importDeck(f);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-3 text-center">
              <Download className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Import a deck file</p>
                <p className="text-sm text-muted-foreground">
                  .studydeck or .json exported from StudyDeck
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-4">
        <label className="text-sm text-muted-foreground whitespace-nowrap">
          Cards to generate:
        </label>
        <input
          type="number"
          min={1}
          max={30}
          value={cardCount}
          onChange={(e) =>
            setCardCount(
              Math.min(30, Math.max(1, parseInt(e.target.value) || 10))
            )
          }
          className="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          disabled={isProcessing}
        />
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={isProcessing || (!file && !pastedText.trim())}
        onClick={() => processUpload(file ? "file" : "text")}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Generate Flashcards"
        )}
      </Button>

      {isProcessing && (
        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const isDone = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <div key={step.key} className="flex items-center gap-3">
                {isDone ? (
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    isDone && "text-muted-foreground line-through",
                    isCurrent && "text-foreground font-medium",
                    !isDone && !isCurrent && "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <Card className="p-4 border-destructive/50 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}
    </div>
  );
}
