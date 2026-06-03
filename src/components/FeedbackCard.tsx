import { cn } from "@/lib/utils";

type FeedbackType = "strength" | "gap" | "correction" | "insight";

const CONFIG: Record<
  FeedbackType,
  { icon: string; label: string; colorVar: string; bgVar: string; borderVar: string }
> = {
  strength: {
    icon: "✓",
    label: "Strength",
    colorVar: "var(--success)",
    bgVar: "var(--success-surface, var(--success-foreground))",
    borderVar: "var(--success-border, var(--success))",
  },
  gap: {
    icon: "◐",
    label: "Gap in understanding",
    colorVar: "var(--warning)",
    bgVar: "var(--warning-surface, var(--warning-foreground))",
    borderVar: "var(--warning-border, var(--warning))",
  },
  correction: {
    icon: "✕",
    label: "Needs correction",
    colorVar: "var(--destructive)",
    bgVar: "var(--error-surface, #FEF2F2)",
    borderVar: "var(--error-border, var(--destructive))",
  },
  insight: {
    icon: "✦",
    label: "Next steps",
    colorVar: "var(--primary)",
    bgVar: "var(--accent-surface, var(--accent))",
    borderVar: "var(--accent-border, var(--primary))",
  },
};

interface FeedbackCardProps {
  type: FeedbackType;
  children: React.ReactNode;
  className?: string;
}

export default function FeedbackCard({
  type,
  children,
  className,
}: FeedbackCardProps) {
  const c = CONFIG[type];

  return (
    <div
      className={cn("rounded-[10px] px-4 py-3.5", className)}
      style={{
        background: c.bgVar,
        border: `1px solid ${c.borderVar}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-bold text-sm" style={{ color: c.colorVar }}>
          {c.icon}
        </span>
        <span
          className="text-[13px] font-semibold"
          style={{ color: c.colorVar }}
        >
          {c.label}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed m-0">
        {children}
      </p>
    </div>
  );
}
