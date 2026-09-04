import type { StatusRisco } from "@/types";
import { cn } from "@/lib/utils";

const DOT_CLASS: Record<StatusRisco, string> = {
  Alto: "bg-risk-alto",
  Médio: "bg-risk-medio",
  "Risco Futuro": "bg-risk-futuro",
  Baixo: "bg-risk-baixo",
};

const TEXT_CLASS: Record<StatusRisco, string> = {
  Alto: "text-risk-alto",
  Médio: "text-risk-medio",
  "Risco Futuro": "text-risk-futuro",
  Baixo: "text-risk-baixo",
};

export function RiskBadge({ status }: { status: StatusRisco }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 py-1 text-xs font-medium",
        TEXT_CLASS[status]
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", DOT_CLASS[status])} />
      {status}
    </span>
  );
}
