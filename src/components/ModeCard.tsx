"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ModeCardProps {
  icon: string;
  title: string;
  subtitle: string;
  tag?: string;
  tagVariant?: "default" | "secondary" | "outline" | "destructive";
  tagClassName?: string;
  onClick: () => void;
  className?: string;
}

export default function ModeCard({
  icon,
  title,
  subtitle,
  tag,
  tagVariant = "secondary",
  tagClassName,
  onClick,
  className,
}: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-xl border border-border bg-card p-5 cursor-pointer",
        "transition-all duration-150 shadow-sm",
        "hover:bg-[var(--surface-hover,var(--secondary))] hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-[22px] mb-2">{icon}</div>
          <div className="font-semibold text-[15px] text-foreground mb-1">
            {title}
          </div>
          <div className="text-[13px] text-muted-foreground leading-snug">
            {subtitle}
          </div>
        </div>
        {tag && (
          <Badge variant={tagVariant} className={cn("flex-shrink-0", tagClassName)}>
            {tag}
          </Badge>
        )}
      </div>
    </button>
  );
}
