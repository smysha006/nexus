import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, Shield, ShieldCheck, ShieldX } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate, fmtMoney, relativeDays } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { WarrantyStatus } from "@/convex/lib";

type Filter = "all" | WarrantyStatus;

function warrantyProgress(purchaseDate: number, expires: number, now: number): number {
  const total = expires - purchaseDate;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((now - purchaseDate) / total) * 100));
}

export default function Warranties() {
  useCurrency();
  const summary = useQuery(api.purchases.summary);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const now = Date.now();

  const items = useMemo(() => {
    if (!summary) return [];
    const withWarranty = summary.filter((p) => p.warrantyExpires != null);
    const sorted = withWarranty.sort((a, b) => {
      const rank: Record<WarrantyStatus, number> = { expiring: 0, active: 1, expired: 2, none: 3 };
      return rank[a.warrantyStatus] - rank[b.warrantyStatus];
    });
    if (filter === "all") return sorted;
    return sorted.filter((p) => p.warrantyStatus === filter);
  }, [summary, filter]);

  const counts = useMemo(() => {
    const c = { active: 0, expiring: 0, expired: 0 } as Record<string, number>;
    for (const p of summary ?? []) {
      if (p.warrantyStatus !== "none" && c[p.warrantyStatus] != null) c[p.warrantyStatus]++;
    }
    return c;
  }, [summary]);

  const protectedValue = (summary ?? [])
    .filter((p) => p.warrantyStatus === "active" || p.warrantyStatus === "expiring")
    .reduce((s, p) => s + p.price, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Warranty Wallet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmtMoney(protectedValue)} of your stuff is under active coverage.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {([
            ["all", `All (${(summary ?? []).filter((p) => p.warrantyExpires != null).length})`],
            ["active", `Active (${counts.active})`],
            ["expiring", `Expiring (${counts.expiring})`],
            ["expired", `Expired (${counts.expired})`],
          ] as [Filter, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                filter === key
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {summary === undefined ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="nexus-card flex flex-col items-center gap-3 p-10 text-center">
          <ShieldCheck className="size-8 text-muted-foreground" />
          <p className="font-medium">No warranties in this view</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Warranty coverage is extracted from receipts automatically. Scan one to start tracking.
          </p>
          <Button className="mt-1 rounded-xl" onClick={() => navigate("/scan")}>
            Scan a receipt
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => {
            const days = p.warrantyExpires ? Math.ceil((p.warrantyExpires - now) / 86_400_000) : null;
            const progress = p.warrantyExpires
              ? warrantyProgress(p.purchaseDate, p.warrantyExpires, now)
              : 0;
            const tone =
              p.warrantyStatus === "expiring"
                ? "border-warning/25"
                : p.warrantyStatus === "expired"
                  ? "border-danger/20 opacity-80"
                  : "border-border/70";
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                className={cn("nexus-card flex flex-col p-5", tone)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-muted/40 text-lg">
                      {p.image ?? "🛡️"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.brand} · {p.category}
                      </p>
                    </div>
                  </div>
                  {p.warrantyStatus === "active" && (
                    <ShieldCheck className="size-4 text-success" />
                  )}
                  {p.warrantyStatus === "expiring" && (
                    <CalendarClock className="size-4 text-warning" />
                  )}
                  {p.warrantyStatus === "expired" && <ShieldX className="size-4 text-danger" />}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Coverage used</span>
                    <span className="font-medium tabular-nums">{Math.round(progress)}%</span>
                  </div>
                  <Progress
                    value={progress}
                    className={cn(
                      "mt-1.5 h-1.5",
                      p.warrantyStatus === "expiring" && "bg-warning/20 [&>div]:bg-warning",
                      p.warrantyStatus === "expired" && "bg-danger/20 [&>div]:bg-danger",
                      p.warrantyStatus === "active" && "bg-success/20 [&>div]:bg-success",
                    )}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Expires {p.warrantyExpires ? fmtDate(p.warrantyExpires) : "—"}</span>
                  {days != null && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "border",
                        p.warrantyStatus === "active" && "border-success/20 bg-success/10 text-success",
                        p.warrantyStatus === "expiring" && "border-warning/20 bg-warning/10 text-warning",
                        p.warrantyStatus === "expired" && "border-danger/20 bg-danger/10 text-danger",
                      )}
                    >
                      {days > 0 ? relativeDays(p.warrantyExpires) : "Expired"}
                    </Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-1.5 rounded-lg"
                  onClick={() => navigate(`/purchases/${p.id}`)}
                >
                  {p.warrantyStatus === "expired" ? "Review coverage" : "View warranty"}
                  <ArrowRight className="size-3.5" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
        <Shield className="size-3.5" />
        Warranty terms are extracted from receipts where visible. Verify extended coverage with
        your manufacturer — Nexus OS never invents terms.
      </p>
    </div>
  );
}
