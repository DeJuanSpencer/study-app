"use client";

import { useState, useEffect, useCallback } from "react";
import { Deck } from "@/lib/types";
import { loadAllDecks, loadDeck, saveDeck, deleteDeck } from "@/lib/storage";

export function useDeck(deckId?: string) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [allDecks, setAllDecks] = useState<Deck[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (deckId) {
      setDeck(loadDeck(deckId));
    }
    setAllDecks(loadAllDecks());
    setLoaded(true);
  }, [deckId]);

  const refresh = useCallback(() => {
    if (deckId) setDeck(loadDeck(deckId));
    setAllDecks(loadAllDecks());
  }, [deckId]);

  const save = useCallback(
    (updated: Deck) => {
      saveDeck(updated);
      setDeck(updated);
      setAllDecks(loadAllDecks());
    },
    []
  );

  const remove = useCallback(
    (id: string) => {
      deleteDeck(id);
      if (deckId === id) setDeck(null);
      setAllDecks(loadAllDecks());
    },
    [deckId]
  );

  return { deck, allDecks, loaded, refresh, save, remove };
}
