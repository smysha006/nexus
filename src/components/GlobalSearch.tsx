import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search, ScanLine, Sparkles, ShieldCheck, RotateCcw, LayoutDashboard, BarChart3, FileText, Package } from "lucide-react";
import { categoryMeta } from "@/lib/catalog";
import { fmtMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";

const NAV_ACTIONS = [
  { label: "Go to Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Open Purchase Vault", to: "/purchases", icon: Package },
  { label: "Scan a receipt", to: "/scan", icon: ScanLine },
  { label: "View Warranties", to: "/warranties", icon: ShieldCheck },
  { label: "View Returns", to: "/returns", icon: RotateCcw },
  { label: "View Claims", to: "/claims", icon: FileText },
  { label: "Open Insights", to: "/insights", icon: BarChart3 },
  { label: "Talk to AI Assistant", to: "/assistant", icon: Sparkles },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const purchases = useQuery(api.purchases.list);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    if (!purchases) return [];
    const t = term.trim().toLowerCase();
    if (!t) return purchases.slice(0, 6);
    return purchases
      .filter((p) =>
        [p.name, p.brand, p.merchant, p.model, p.serialNumber, p.invoiceNumber, p.orderNumber, p.category]
          .filter(Boolean)
          .some((f) => (f as string).toLowerCase().includes(t)),
      )
      .slice(0, 8);
  }, [purchases, term]);

  return (
    <>
      <Button
        variant="ghost"
        className="gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="hidden text-xs lg:inline">Search everything…</span>
        <kbd className="ml-1 hidden rounded-md border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Global search">
        <CommandInput
          placeholder="Search products, brands, merchants, serial numbers…"
          value={term}
          onValueChange={setTerm}
          autoFocus
        />
        <CommandList>
          <CommandEmpty>No matches — try a product name, brand, or serial number.</CommandEmpty>

          {results.length > 0 && (
            <>
              <CommandGroup heading="Purchases">
                {results.map((p) => {
                  const meta = categoryMeta(p.category);
                  return (
                    <CommandItem
                      key={p._id}
                      value={`${p.name} ${p.brand ?? ""} ${p.merchant ?? ""} ${p.serialNumber ?? ""}`}
                      onSelect={() => {
                        setOpen(false);
                        navigate(`/purchases/${p._id}`);
                      }}
                      className="cursor-pointer"
                    >
                      <span className="flex size-7 items-center justify-center rounded-lg bg-muted/70 text-sm">
                        {p.image ?? meta.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{p.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[p.brand, p.merchant].filter(Boolean).join(" · ") || p.category}
                        </span>
                      </span>
                      <Badge variant="outline" className={`border ${meta.chip}`}>
                        {p.category}
                      </Badge>
                      <span className="ml-2 text-xs font-semibold tabular-nums text-muted-foreground">
                        {fmtMoney(p.price)}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Actions">
            {NAV_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <CommandItem
                  key={a.to}
                  value={a.label}
                  onSelect={() => {
                    setOpen(false);
                    navigate(a.to);
                  }}
                  className="cursor-pointer"
                >
                  <Icon className="size-4" />
                  <span>{a.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
