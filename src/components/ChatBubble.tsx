"use client";

import { useState, useEffect } from "react";
import AIAvatar from "./AIAvatar";
import TypingIndicator from "./TypingIndicator";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant";
  text: string;
  isLoading?: boolean;
  animate?: boolean;
  className?: string;
}

export default function ChatBubble({
  role,
  text,
  isLoading,
  animate = true,
  className,
}: ChatBubbleProps) {
  const [visible, setVisible] = useState(!animate);

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(t);
    }
  }, [animate]);

  const isAI = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-2.5 items-start transition-all duration-300",
        isAI ? "justify-start" : "justify-end",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}
    >
      {isAI && <AIAvatar size="sm" />}
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-[14px] text-sm leading-relaxed",
          isAI
            ? "bg-card text-card-foreground border border-border shadow-sm"
            : "bg-primary text-primary-foreground"
        )}
      >
        {isLoading ? <TypingIndicator /> : text}
      </div>
    </div>
  );
}
