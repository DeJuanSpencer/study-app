"use client";

import { useState, useCallback, useRef } from "react";
import { SocraticMessage, SocraticSummary, AITone } from "@/lib/types";

type SocraticPhase = "chatting" | "complete";

export function useSocraticChat(
  concept: string,
  deckId: string,
  tone: AITone = "supportive"
) {
  const [messages, setMessages] = useState<SocraticMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [phase, setPhase] = useState<SocraticPhase>("chatting");
  const [summary, setSummary] = useState<SocraticSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const callSocratic = useCallback(
    async (allMessages: SocraticMessage[]) => {
      const res = await fetch("/api/socratic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept,
          messages: allMessages,
          tone,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Socratic dialogue failed");
      }

      return res.json();
    },
    [concept, tone]
  );

  const startSession = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setIsThinking(true);
    setError(null);

    try {
      const result = await callSocratic([]);
      const aiMessage: SocraticMessage = {
        role: "assistant",
        text: result.message,
      };
      setMessages([aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
      initializedRef.current = false;
    } finally {
      setIsThinking(false);
    }
  }, [callSocratic]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isThinking) return;

      const userMessage: SocraticMessage = { role: "user", text };
      const updated = [...messages, userMessage];
      setMessages(updated);
      setIsThinking(true);
      setError(null);

      try {
        const result = await callSocratic(updated);
        const aiMessage: SocraticMessage = {
          role: "assistant",
          text: result.message,
        };
        setMessages((prev) => [...prev, aiMessage]);

        if (result.isComplete && result.summary) {
          setSummary(result.summary);
          setPhase("complete");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to get AI response"
        );
      } finally {
        setIsThinking(false);
      }
    },
    [messages, isThinking, callSocratic]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setIsThinking(false);
    setPhase("chatting");
    setSummary(null);
    setError(null);
    initializedRef.current = false;
  }, []);

  const turnCount = messages.filter((m) => m.role === "user").length;

  return {
    messages,
    isThinking,
    phase,
    summary,
    error,
    turnCount,
    send,
    startSession,
    reset,
  };
}
