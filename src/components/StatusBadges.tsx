import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldX, RotateCcw, Sparkles, ScanLine, PenLine } from "lucide-react";
import type { ReturnStatus, WarrantyStatus } from "@/convex/lib";

export function WarrantyBadge({ status }: { status?: WarrantyStatus | null }) {
  if (!status || status === "none") {
    return (
      <Badge variant="outline" className="border-border/60 text-muted-foreground">
        <ShieldX className="size-3" />
        No warranty
      </Badge>
    );
  }
  if (status === "active") {
    return (
      <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
        <ShieldCheck className="size-3" />
        Warranty active
      </Badge>
    );
  }
  if (status === "expiring") {
    return (
      <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-300">
        <ShieldAlert className="size-3" />
        Warranty expiring
      </Badge>
    );
  }
  return (
    <Badge className="border-rose-400/20 bg-rose-400/10 text-rose-300">
      <ShieldX className="size-3" />
      Warranty expired
    </Badge>
  );
}

export function ReturnBadge({ status }: { status?: ReturnStatus | null }) {
  if (!status || status === "none") return null;
  if (status === "open") {
    return (
      <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-300">
        <RotateCcw className="size-3" />
        Return open
      </Badge>
    );
  }
  if (status === "closing") {
    return (
      <Badge className="border-rose-400/20 bg-rose-400/10 text-rose-300">
        <RotateCcw className="size-3" />
        Return closing
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-border/60 text-muted-foreground">
      Return closed
    </Badge>
  );
}

export function SourceBadge({ source }: { source?: string }) {
  if (source === "scanned") {
    return (
      <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">
        <ScanLine className="size-3" />
        Scanned
      </Badge>
    );
  }
  if (source === "demo") {
    return (
      <Badge variant="outline" className="border-violet-400/20 bg-violet-400/10 text-violet-300">
        <Sparkles className="size-3" />
        Demo data
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-border/60 text-muted-foreground">
      <PenLine className="size-3" />
      Manual
    </Badge>
  );
}

export function ConfidencePill({ value }: { value?: number }) {
  if (value == null) return null;
  const tone =
    value >= 90
      ? "text-emerald-300 border-emerald-400/20 bg-emerald-400/10"
      : value >= 80
        ? "text-amber-300 border-amber-400/20 bg-amber-400/10"
        : "text-rose-300 border-rose-400/20 bg-rose-400/10";
  return (
    <Badge variant="outline" className={tone}>
      AI {value}%
    </Badge>
  );
}
