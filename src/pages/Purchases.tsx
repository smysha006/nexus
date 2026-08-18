import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Package, ScanLine, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { NexusMark } from "@/components/NexusMark";
import { PurchaseCard } from "@/components/PurchaseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, categoryMeta } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { PurchaseSummary } from "@/types/purchase";

type SortKey = "newest" | "price-desc" | "price-asc" | "warranty" | "health";

export default function Purchases() {
  const summary = useQuery(api.purchases.summary);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const items = useMemo(() => {
    if (!summary) return [];
    const q = query.trim().toLowerCase();
    let out = summary.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return [p.name, p.brand, p.merchant, p.model, p.serialNumber, p.invoiceNumber, p.orderNumber]
        .filter(Boolean)
        .some((f) => (f as string).toLowerCase().includes(q));
    });
    switch (sort) {
      case "price-desc":
        out = out.sort((a, b) => b.price - a.price);
        break;
      case "price-asc":
        out = out.sort((a, b) => a.price - b.price);
        break;
      case "warranty":
        out = out.sort((a, b) => {
          if (a.warrantyExpires && b.warrantyExpires) return a.warrantyExpires - b.warrantyExpires;
          if (a.warrantyExpires) return -1;
          if (b.warrantyExpires) return 1;
          return b.purchaseDate - a.purchaseDate;
        });
        break;
      case "health":
        out = out.sort((a, b) => (b.healthScore ?? 0) - (a.healthScore ?? 0));
        break;
      default:
        out = out.sort((a, b) => b.purchaseDate - a.purchaseDate);
    }
    return out;
  }, [summary, query, category, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Purchase Vault</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary ? `${summary.length} purchase${summary.length === 1 ? "" : "s"} tracked · search, filter, and sort everything you own` : "Loading your vault…"}
          </p>
        </div>
        <Button onClick={() => navigate("/scan")} className="gap-2 rounded-xl">
          <ScanLine className="size-4" />
          Scan a receipt
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, brand, merchant, serial…"
            className="rounded-xl pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={cn(
                "shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                category === "all"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  category === c
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:text-foreground",
                )}
              >
                {categoryMeta(c).emoji} {c}
              </button>
            ))}
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[190px] gap-2 rounded-xl text-xs">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="price-desc">Price · high to low</SelectItem>
              <SelectItem value="price-asc">Price · low to high</SelectItem>
              <SelectItem value="warranty">Warranty ending soonest</SelectItem>
              <SelectItem value="health">Health score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {summary === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {items.map((p: PurchaseSummary, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
            >
              <PurchaseCard p={p} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="nexus-card flex flex-col items-center gap-4 p-12 text-center">
          <NexusMark size={48} />
          <div className="max-w-sm">
            <p className="font-display text-base font-semibold">
              {query || category !== "all" ? "No purchases match" : "Your vault is empty"}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {query || category !== "all"
                ? "Try a different search or clear the filters."
                : "Scan your first receipt and NEXUS will build its profile — or add a purchase manually."}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {(query || category !== "all") && (
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                }}
              >
                <Package className="size-4" />
                Clear filters
              </Button>
            )}
            <Button className="gap-2 rounded-xl" onClick={() => navigate("/scan")}>
              <ScanLine className="size-4" />
              Scan a receipt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
