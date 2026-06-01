"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Loader2, Clipboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParsedMaterial, FlashCard, Deck } from "@/lib/types";
import { saveDeck } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

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
    "idle" | "parsing" | "generating" | "done" | "error"
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setError(null);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) {
        setFile(selected);
        setError(null);
      }
    },
    []
  );

  const processUpload = async (mode: "file" | "text") => {
    setStatus("parsing");
    setError(null);

    try {
      let material: ParsedMaterial;

      if (mode === "file" && file) {
        const formData = new FormData();
        formData.append("file", file);
        const parseRes = await fetch("/api/parse", {
          method: "POST",
          body: formData,
        });
        if (!parseRes.ok) {
          const err = await parseRes.json().catch(() => null);
          throw new Error(err?.error || "Failed to parse file");
        }
        material = await parseRes.json();
      } else if (mode === "text" && pastedText.trim()) {
        const parseRes = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: pastedText }),
        });
        if (!parseRes.ok) {
          const err = await parseRes.json().catch(() => null);
          throw new Error(err?.error || "Failed to parse text");
        }
        material = await parseRes.json();
      } else {
        throw new Error("No content to process");
      }

      setStatus("generating");

      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material, cardCount }),
      });
      if (!genRes.ok) {
        const err = await genRes.json().catch(() => null);
        throw new Error(err?.error || "Failed to generate cards");
      }
      const { cards } = (await genRes.json()) as { cards: FlashCard[] };

      const deck: Deck = {
        id: uuidv4(),
        title: material.title,
        cards,
        createdAt: new Date().toISOString(),
        materialMetadata: material.metadata,
      };
      saveDeck(deck);

      setStatus("done");
      router.push(`/deck?id=${deck.id}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const isProcessing = status === "parsing" || status === "generating";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" disabled={isProcessing}>
            <Upload className="h-4 w-4 mr-1.5" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="paste" disabled={isProcessing}>
            <Clipboard className="h-4 w-4 mr-1.5" />
            Paste Text
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
            onChange={(e) => setPastedText(e.target.value)}
            disabled={isProcessing}
          />
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
        {status === "parsing" && (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Parsing material...
          </>
        )}
        {status === "generating" && (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating & fact-checking...
          </>
        )}
        {(status === "idle" || status === "done" || status === "error") &&
          "Generate Flashcards"}
      </Button>

      {error && (
        <Card className="p-4 border-destructive/50 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}
    </div>
  );
}
