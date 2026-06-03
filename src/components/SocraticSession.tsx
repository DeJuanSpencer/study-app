"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Deck } from "@/lib/types";
import { useSocraticChat } from "@/hooks/useSocraticChat";
import { useConceptMastery } from "@/hooks/useConceptMastery";
import { buildSourceContext } from "@/lib/ai/source-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import AIAvatar from "./AIAvatar";
import ChatBubble from "./ChatBubble";
import TypingIndicator from "./TypingIndicator";
import ValidationBadge from "./ValidationBadge";

interface SocraticSessionProps {
  deck: Deck;
  concept: string;
}

export default function SocraticSession({
  deck,
  concept,
}: SocraticSessionProps) {
  const router = useRouter();
  const sourceContext = useMemo(() => buildSourceContext(deck), [deck]);
  const {
    messages,
    isThinking,
    phase,
    summary,
    error,
    turnCount,
    send,
    startSession,
  } = useSocraticChat(concept, deck.id, "supportive", sourceContext);
  const { updateMastery } = useConceptMastery(deck);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startSession();
  }, [startSession]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    send(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (phase === "complete" && summary) {
    updateMastery(concept, "socratic", { summary });

    return (
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/study?id=${deck.id}`)}
          >
            ← Back
          </Button>
          <div className="flex-1" />
          <Badge variant="outline" className="border-primary text-primary">
            Session Summary
          </Badge>
        </div>

        <Card className="text-center p-8 mb-5">
          <div className="flex justify-center mb-4">
            <AIAvatar size="lg" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h3 className="text-[22px] font-heading font-semibold text-foreground">
              Socratic Session Complete
            </h3>
            <ValidationBadge validation={summary.validation} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[500px] mx-auto">
            {summary.depth}
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <Card className="p-4">
            <p className="text-xs font-mono uppercase tracking-widest mb-2.5 text-[var(--success)]">
              Demonstrated
            </p>
            <div className="flex flex-col gap-1.5">
              {summary.demonstrated.map((d, i) => (
                <span
                  key={i}
                  className="text-[13px] text-foreground flex items-center gap-1.5"
                >
                  <span style={{ color: "var(--success)" }}>✓</span> {d}
                </span>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-mono uppercase tracking-widest mb-2.5 text-[var(--warning)]">
              Emerging
            </p>
            <div className="flex flex-col gap-1.5">
              {summary.emerging.map((d, i) => (
                <span
                  key={i}
                  className="text-[13px] text-foreground flex items-center gap-1.5"
                >
                  <span style={{ color: "var(--warning)" }}>◐</span> {d}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {summary.toExplore.length > 0 && (
          <Card className="p-4 mb-5">
            <p className="text-xs font-mono uppercase tracking-widest mb-2.5 text-primary">
              Explore next
            </p>
            <div className="flex gap-2 flex-wrap">
              {summary.toExplore.map((d, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="border-primary text-primary"
                >
                  {d}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/study?id=${deck.id}`)}
          >
            Back to Modes
          </Button>
          <Button onClick={() => router.push(`/study?id=${deck.id}`)}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto flex flex-col" style={{ height: "calc(100vh - 160px)", minHeight: 500 }}>
      <div className="flex items-center gap-3 mb-5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/study?id=${deck.id}`)}
        >
          ← Back
        </Button>
        <div className="flex-1" />
        <Badge variant="outline" className="border-primary text-primary">
          Socratic Challenge
        </Badge>
        <span className="text-xs font-mono text-muted-foreground">
          Turn {turnCount + 1}
        </span>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div ref={scrollRef} className="flex flex-col gap-4 py-2 pr-2">
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} text={m.text} />
          ))}
          {isThinking && (
            <div className="flex gap-2.5 items-start">
              <AIAvatar size="sm" />
              <Card className="px-4 py-3">
                <TypingIndicator />
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {error && (
        <p className="text-sm text-destructive py-2 flex-shrink-0">{error}</p>
      )}

      <div className="flex-shrink-0 pt-4 border-t border-border">
        <div className="flex gap-2.5">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response..."
            rows={2}
            disabled={isThinking}
            className="text-[15px] leading-relaxed rounded-[10px]"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="self-end flex-shrink-0"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
