import { cn } from "@/lib/utils";

interface DepthIndicatorProps {
  depth: number;
  className?: string;
}

export default function DepthIndicator({ depth, className }: DepthIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className="text-muted-foreground uppercase tracking-[0.05em]"
        style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
      >
        Depth
      </span>
      <div className="flex gap-[3px]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "w-5 h-1.5 rounded-full transition-colors duration-300",
              i <= depth ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}
