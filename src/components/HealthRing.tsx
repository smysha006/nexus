import { cn } from "@/lib/utils";

export function healthColor(score?: number | null): string {
  if (score == null) return "stroke-muted-foreground/40";
  if (score >= 75) return "stroke-success";
  if (score >= 50) return "stroke-warning";
  return "stroke-danger";
}

export function healthText(score?: number | null): string {
  if (score == null) return "—";
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-danger";
}

interface HealthRingProps {
  score?: number | null;
  size?: number;
  stroke?: number;
  showValue?: boolean;
  className?: string;
}

export function HealthRing({
  score,
  size = 56,
  stroke = 5,
  showValue = true,
  className,
}: HealthRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score ?? 0));

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      title={score != null ? `Purchase health: ${score}/100` : "No health score"}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className={cn("transition-[stroke-dashoffset] duration-700", healthColor(score))}
        />
      </svg>
      {showValue && (
        <span className="absolute text-xs font-semibold tabular-nums text-foreground">
          {score ?? "—"}
        </span>
      )}
    </div>
  );
}
