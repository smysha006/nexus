import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight, RotateCcw, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

function useNow(interval = 60_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

function Countdown({ target }: { target: number }) {
  const now = useNow(60_000);
  const diff = target - now;
  if (diff <= 0) return <span className="font-bold text-rose-400">Closed</span>;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  return (
    <span className="font-bold tabular-nums tracking-tight">
      {days}d {hours}h
    </span>
  );
}

export default function Returns() {
  const summary = useQuery(api.purchases.summary);
  const navigate = useNavigate();
  const now = Date.now();

  const withWindows = (summary ?? []).filter((p) => p.returnDeadline != null);
  const open = withWindows
    .filter((p) => p.returnDeadline! > now)
    .sort((a, b) => a.returnDeadline! - b.returnDeadline!);
  const closed = withWindows
    .filter((p) => p.returnDeadline! <= now)
    .sort((a, b) => b.returnDeadline! - a.returnDeadline!);

  const renderCard = (p: (typeof open)[number], i: number, isOpen: boolean) => {
    const deadline = p.returnDeadline!;
    const total = deadline - p.purchaseDate;
    const remaining = Math.max(0, deadline - now);
    const progress = isOpen ? ((total - remaining) / total) * 100 : 100;
    const closing = p.returnStatus === "closing";
    return (
      <motion.div
        key={p.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(i * 0.06, 0.3) }}
        className={cn(
          "nexus-card flex flex-col p-5",
          closing && "border-rose-400/30",
          !isOpen && "opacity-75",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-muted/40 text-lg">
              {p.image ?? "🛍️"}
            </span>
            <div>
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Store className="size-3" />
                {p.merchant ?? "Unknown merchant"}
              </p>
            </div>
          </div>
          {isOpen ? (
            closing ? (
              <Badge className="border-rose-400/20 bg-rose-400/10 text-rose-300">
                <RotateCcw className="size-3" />
                Closing soon
              </Badge>
            ) : (
              <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-300">
                <RotateCcw className="size-3" />
                Open
              </Badge>
            )
          ) : (
            <Badge variant="outline" className="border-border/60 text-muted-foreground">
              Closed
            </Badge>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Purchased</p>
            <p className="mt-0.5 text-xs font-medium">{fmtDate(p.purchaseDate)}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Deadline</p>
            <p className="mt-0.5 text-xs font-medium">{fmtDate(deadline)}</p>
          </div>
          <div
            className={cn(
              "rounded-xl border p-2.5",
              isOpen
                ? closing
                  ? "border-rose-400/25 bg-rose-400/10"
                  : "border-sky-400/25 bg-sky-400/10"
                : "border-border/70 bg-muted/30",
            )}
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {isOpen ? "Time left" : "Ended"}
            </p>
            <p className={cn("mt-0.5 text-sm", isOpen && closing && "text-rose-300")}>
              {isOpen ? <Countdown target={deadline} /> : fmtDate(deadline)}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Window used</span>
            <span className="tabular-nums">{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            className={cn(
              "mt-1 h-1.5",
              closing
                ? "bg-rose-400/20 [&>div]:bg-rose-400"
                : isOpen
                  ? "bg-sky-400/20 [&>div]:bg-sky-400"
                  : "bg-muted [&>div]:bg-muted-foreground/40",
            )}
          />
        </div>

        {isOpen && (
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5 rounded-lg"
              onClick={() => navigate(`/purchases/${p.id}`)}
            >
              Start return
              <ArrowRight className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 rounded-lg"
              onClick={() => navigate(`/purchases/${p.id}`)}
            >
              View details
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Return Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {open.length > 0
            ? `${open.length} open return window${open.length === 1 ? "" : "s"} · worth ${fmtMoney(open.reduce((s, p) => s + p.price, 0))} if you return them`
            : "No open return windows right now."}
        </p>
      </div>

      {summary === undefined ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : withWindows.length === 0 ? (
        <div className="nexus-card flex flex-col items-center gap-3 p-10 text-center">
          <RotateCcw className="size-8 text-muted-foreground" />
          <p className="font-medium">No return windows tracked</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Return windows are auto-calculated from purchase date and the store policy on your
            receipt. Scan a recent receipt to start tracking them.
          </p>
          <Button className="mt-1 rounded-xl" onClick={() => navigate("/scan")}>
            Scan a receipt
          </Button>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {open.map((p, i) => renderCard(p, i, true))}
            </div>
          )}
          {closed.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Recently closed
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {closed.slice(0, 4).map((p, i) => renderCard(p, i, false))}
              </div>
            </section>
          )}
        </>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
        <RotateCcw className="size-3.5" />
        Deadlines are calculated from the return policy recorded on your receipt. Store policies
        change — confirm with the merchant before relying on a window.
      </p>
    </div>
  );
}
