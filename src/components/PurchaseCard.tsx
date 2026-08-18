import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { HealthRing } from "@/components/HealthRing";
import { ReturnBadge, WarrantyBadge } from "@/components/StatusBadges";
import { categoryMeta } from "@/lib/catalog";
import { fmtDate, fmtMoney, relativeDays } from "@/lib/format";
import type { PurchaseSummary } from "@/types/purchase";
import { TrendingDown } from "lucide-react";

export function PurchaseCard({ p }: { p: PurchaseSummary }) {
  const meta = categoryMeta(p.category);
  const Icon = meta.icon;
  const isSub = p.category === "Subscriptions";

  return (
    <Link
      to={`/purchases/${p.id}`}
      className="group nexus-card flex flex-col overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/50 text-xl">
          {p.image ?? meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold tracking-tight group-hover:text-primary transition-colors">
            {p.name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[p.brand, p.merchant].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <HealthRing score={p.healthScore} size={44} stroke={4} />
      </div>

      <div className="flex items-center justify-between px-4">
        <div>
          <p className="text-base font-bold tabular-nums tracking-tight">
            {fmtMoney(p.price)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {isSub ? "per month" : `Bought ${relativeDays(p.purchaseDate)?.toLowerCase() ?? fmtDate(p.purchaseDate)}`}
          </p>
        </div>
        <Badge variant="outline" className={`border ${meta.chip}`}>
          <Icon className="size-3" />
          {p.category}
        </Badge>
      </div>

      {p.hasPriceDrop && (
        <div className="mx-4 mt-3 flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-400/10 px-2 py-1.5 text-[11px] font-medium text-amber-300">
          <TrendingDown className="size-3" />
          Now {fmtMoney(p.currentPrice!)} — {fmtMoney(p.price - p.currentPrice!)} below what you paid
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border/60 p-3">
        <WarrantyBadge status={p.warrantyStatus} />
        {p.returnStatus !== "none" && p.returnStatus !== "closed" && (
          <ReturnBadge status={p.returnStatus} />
        )}
      </div>
    </Link>
  );
}
