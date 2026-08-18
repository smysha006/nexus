import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  FileText,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { NexusMark } from "@/components/NexusMark";
import { PurchaseCard } from "@/components/PurchaseCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtMoney, relativeDays } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { NotificationKind } from "@/convex/notifications";
import type { PurchaseSummary } from "@/types/purchase";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

interface AttentionCard {
  key: NotificationKind;
  emoji: string;
  title: string;
  message: string;
  actionLabel: string;
  actionTo: string;
  accent: string;
  chip: string;
  deadline?: number;
}

export default function Dashboard() {
  const stats = useQuery(api.purchases.stats);
  const summary = useQuery(api.purchases.summary);
  const notifications = useQuery(api.notifications.list);
  const seedDemo = useMutation(api.purchases.seedDemoData);
  const navigate = useNavigate();

  const loading = stats === undefined || summary === undefined || notifications === undefined;

  const recent = (summary ?? [])
    .slice()
    .sort((a, b) => b.purchaseDate - a.purchaseDate)
    .slice(0, 3);

  // One card per signal kind, most urgent item of each.
  const attention: AttentionCard[] = [];
  if (notifications) {
    const byKind = new Map<NotificationKind, (typeof notifications)[number]>();
    for (const n of notifications) {
      if (n.kind === "info") continue;
      if (!byKind.has(n.kind)) byKind.set(n.kind, n);
    }
    const map = (n: (typeof notifications)[number]): AttentionCard | null => {
      const base = {
        deadline: n.deadline,
        actionTo: n.purchaseId ? `/purchases/${n.purchaseId}` : "/claims",
      };
      switch (n.kind) {
        case "return":
          return {
            ...base,
            key: "return",
            emoji: "🔴",
            title: "Return window closing",
            message: n.message,
            actionLabel: "Start return",
            accent: "border-danger/30 bg-danger/[0.06]",
            chip: "bg-danger/10 text-danger border-danger/25",
          };
        case "warranty":
          return {
            ...base,
            key: "warranty",
            emoji: "🟠",
            title: "Warranty expiring",
            message: n.message,
            actionLabel: "Review coverage",
            actionTo: "/warranties",
            accent: "border-warning/30 bg-warning/[0.06]",
            chip: "bg-warning/10 text-warning border-warning/25",
          };
        case "price":
          return {
            ...base,
            key: "price",
            emoji: "🟡",
            title: "Price dropped",
            message: n.message,
            actionLabel: "View item",
            accent: "border-warning/30 bg-warning/[0.06]",
            chip: "bg-warning/10 text-warning border-warning/25",
          };
        case "claim":
          return {
            ...base,
            key: "claim",
            emoji: "🟢",
            title: "Claim-ready",
            message: n.message,
            actionLabel: "Start a claim",
            actionTo: `/claims?purchase=${n.purchaseId}`,
            accent: "border-success/30 bg-success/[0.06]",
            chip: "bg-success/10 text-success border-success/25",
          };
        default:
          return null;
      }
    };
    for (const n of byKind.values()) {
      const card = map(n);
      if (card) attention.push(card);
    }
    attention.sort((a, b) => {
      const rank: Record<string, number> = { return: 0, warranty: 1, price: 2, claim: 3 };
      return rank[a.key] - rank[b.key];
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}
            <span className="text-muted-foreground">, here's your Nexus OS</span>
          </h1>
        </div>
        <Button onClick={() => navigate("/scan")} className="gap-2 rounded-xl self-start sm:self-auto">
          <ScanLine className="size-4" />
          Scan a receipt
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {[
          {
            label: "Total Purchase Value",
            icon: Wallet,
            value: stats?.totalValue,
            format: (n: number) => fmtMoney(n),
            sub: stats ? `${stats.count} purchase${stats.count === 1 ? "" : "s"} tracked` : "…",
          },
          {
            label: "Protected Value",
            icon: ShieldCheck,
            value: stats?.protectedValue,
            format: (n: number) => fmtMoney(n),
            sub: "Under active coverage",
            tone: "text-success",
          },
          {
            label: "Active Warranties",
            icon: ShieldAlert,
            value: stats?.activeWarranties,
            sub: "Coverage in force",
            tone: "text-info",
          },
          {
            label: `Deadlines in ${stats?.monthLabel ?? "…"}`,
            icon: CalendarClock,
            value: stats?.deadlinesThisMonth,
            sub: "Returns & warranties due",
            tone: "text-warning",
          },
          {
            label: "Potential Savings",
            icon: TrendingDown,
            value: stats?.potentialSavings,
            format: (n: number) => fmtMoney(n),
            sub: "Price drops + open returns",
            tone: "text-violet",
          },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="nexus-card p-4"
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("size-4", s.tone ?? "text-primary")} />
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
              </div>
              <p className="mt-2.5 font-display text-xl font-bold tabular-nums tracking-tight sm:text-2xl">
                {loading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <AnimatedNumber value={s.value ?? 0} format={s.format} />
                )}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/80">{s.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Needs your attention */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Needs your attention
          </h2>
          <Link
            to="/assistant"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Ask Nexus OS instead
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : attention.length === 0 ? (
          <div className="nexus-card mt-4 flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <p className="font-medium">Everything's under control</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No deadlines, price drops, or claims are waiting on you right now.
              </p>
            </div>
            <Button variant="outline" className="mt-1 rounded-xl" onClick={() => navigate("/scan")}>
              <ScanLine className="mr-2 size-4" />
              Scan a receipt to grow your vault
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {attention.map((c, i) => (
              <motion.div
                key={`${c.key}-${c.title}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn("rounded-2xl border p-4", c.accent)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none">{c.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{c.title}</h3>
                      {c.deadline && (
                        <Badge variant="outline" className={`border ${c.chip}`}>
                          {relativeDays(c.deadline)}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{c.message}</p>
                    <Button
                      size="sm"
                      className="mt-3 gap-1.5 rounded-lg"
                      onClick={() => navigate(c.actionTo)}
                    >
                      {c.actionLabel}
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Recent purchases */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">Recent purchases</h2>
          <Link
            to="/purchases"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Open vault
            <ArrowRight className="size-3" />
          </Link>
        </div>
        {loading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : recent.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p: PurchaseSummary) => (
              <PurchaseCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="nexus-card mt-4 flex flex-col items-center gap-4 p-10 text-center">
            <NexusMark size={48} />
            <div className="max-w-sm">
              <p className="font-display text-base font-semibold">Your vault is empty</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Scan your first receipt — or load 12 realistic demo purchases to explore Nexus OS
                end to end.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => navigate("/scan")} className="gap-2 rounded-xl">
                <ScanLine className="size-4" />
                Scan a receipt
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                onClick={async () => {
                  const res = await seedDemo();
                  if (res?.seeded) {
                    toast.success("Demo purchases loaded");
                  } else {
                    toast.info("You already have purchases in your vault");
                  }
                }}
              >
                <Sparkles className="size-4" />
                Load demo data
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Quick links strip */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { to: "/warranties", icon: ShieldCheck, title: "Warranty Wallet", sub: "See all coverage" },
          { to: "/returns", icon: RotateCcw, title: "Return Center", sub: "Countdowns on open windows" },
          { to: "/claims", icon: FileText, title: "Claims", sub: "Drafts ready to send" },
        ].map((q) => {
          const Icon = q.icon;
          return (
            <Link
              key={q.to}
              to={q.to}
              className="nexus-card flex items-center gap-3 p-4 transition-colors hover:border-primary/30"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{q.title}</p>
                <p className="text-xs text-muted-foreground">{q.sub}</p>
              </div>
              <ArrowRight className="ml-auto size-4 text-muted-foreground/50" />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
