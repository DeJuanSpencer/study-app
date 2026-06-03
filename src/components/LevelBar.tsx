import { UnderstandingLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LevelBarProps {
  level: UnderstandingLevel;
  size?: "sm" | "md";
  className?: string;
}

export default function LevelBar({
  level,
  size = "md",
  className,
}: LevelBarProps) {
  const h = size === "sm" ? "h-1" : "h-1.5";
  const w = size === "sm" ? "w-4" : "w-6";

  return (
    <div className={cn("flex gap-[3px] items-center", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            w,
            h,
            "rounded-full transition-colors duration-300",
            i < level ? "bg-primary" : "bg-border"
          )}
        />
      ))}
    </div>
  );
}
