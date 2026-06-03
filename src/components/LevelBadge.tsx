import { UnderstandingLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LEVEL_CONFIG: Array<{
  label: string;
  icon: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  className: string;
}> = [
  { label: "New", icon: "○", variant: "secondary", className: "" },
  { label: "Recognized", icon: "◔", variant: "secondary", className: "" },
  {
    label: "Recalled",
    icon: "◑",
    variant: "outline",
    className: "border-[var(--warning)] text-[var(--warning)]",
  },
  {
    label: "Explained",
    icon: "◕",
    variant: "outline",
    className: "border-primary text-primary",
  },
  {
    label: "Applied",
    icon: "●",
    variant: "outline",
    className: "border-[var(--success)] text-[var(--success)]",
  },
  {
    label: "Connected",
    icon: "✦",
    variant: "outline",
    className: "border-[var(--success)] text-[var(--success)]",
  },
];

interface LevelBadgeProps {
  level: UnderstandingLevel;
  className?: string;
}

export default function LevelBadge({ level, className }: LevelBadgeProps) {
  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG[0];

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      <span className="text-[11px] mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}
