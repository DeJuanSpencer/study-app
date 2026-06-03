import { cn } from "@/lib/utils";

const SIZES = {
  sm: { wh: 24, fontSize: 10 },
  md: { wh: 32, fontSize: 14 },
  lg: { wh: 48, fontSize: 20 },
};

interface AIAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function AIAvatar({ size = "md", className }: AIAvatarProps) {
  const { wh, fontSize } = SIZES[size];

  return (
    <div
      className={cn("rounded-full flex items-center justify-center flex-shrink-0 font-mono font-bold", className)}
      style={{
        width: wh,
        height: wh,
        fontSize,
        background: "linear-gradient(135deg, var(--primary), var(--warning))",
        color: "var(--primary-foreground)",
      }}
    >
      AI
    </div>
  );
}
