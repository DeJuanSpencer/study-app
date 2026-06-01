"use client";

import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ValidationResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ValidationBadgeProps {
  validation?: ValidationResult;
  className?: string;
}

const VERDICT_CONFIG = {
  verified: {
    icon: ShieldCheck,
    label: "Verified",
    style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  uncertain: {
    icon: ShieldQuestion,
    label: "Unverified",
    style: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  inaccurate: {
    icon: ShieldAlert,
    label: "Issue Found",
    style: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
};

export default function ValidationBadge({
  validation,
  className,
}: ValidationBadgeProps) {
  if (!validation) return null;

  const config = VERDICT_CONFIG[validation.verdict];
  const Icon = config.icon;

  const webSources = validation.sourcesChecked.filter((s) =>
    s.startsWith("web:")
  );
  const tooltipText =
    validation.issues.length > 0
      ? `${validation.issues.length} issue(s) found`
      : `Checked against ${validation.sourcesChecked.length} source(s)${webSources.length > 0 ? " incl. web" : ""}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn("text-xs cursor-help", config.style, className)}
          >
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
