import { Check, ChevronDown } from "lucide-react";
import { CURRENCY_META, useCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function CurrencySelect({
  align = "end",
  compact = false,
}: {
  align?: "start" | "end";
  compact?: boolean;
}) {
  const { currency, setCurrency } = useCurrency();
  const active = CURRENCY_META.find((c) => c.code === currency) ?? CURRENCY_META[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className="gap-1.5 rounded-xl px-2.5"
          aria-label={`Currency: ${active.code}`}
          title={`Currency: ${active.code}`}
        >
          <span className="text-sm font-semibold tabular-nums">{active.symbol}</span>
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
            {active.code}
          </span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Currency
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CURRENCY_META.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className="cursor-pointer py-2"
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
                c.code === currency
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border/70 bg-muted/50 text-muted-foreground",
              )}
            >
              {c.symbol}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{c.code}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{c.name}</span>
            </span>
            {c.code === currency && <Check className="size-4 shrink-0 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
