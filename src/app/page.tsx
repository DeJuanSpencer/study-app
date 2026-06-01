"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import { loadAllDecks } from "@/lib/storage";
import { Deck } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    setDecks(loadAllDecks());
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="max-w-5xl mx-auto w-full px-6 py-12 space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Turn your notes into flashcards
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Upload your class material and get flashcards that test real
              understanding, not just memorization.
            </p>
          </div>

          <FileUpload />

          {decks.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-lg font-medium mb-4">Your Decks</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {decks.map((deck) => (
                    <Card
                      key={deck.id}
                      className="p-5 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => router.push(`/deck?id=${deck.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium leading-tight">
                            {deck.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {deck.cards.length} cards -{" "}
                            {new Date(deck.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
