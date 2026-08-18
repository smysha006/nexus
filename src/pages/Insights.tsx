import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Lightbulb, Sparkles, Store, Wallet } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryMeta } from "@/lib/catalog";
import { fmtMoney, monthKey } from "@/lib/format";
import { resaleEstimate } from "@/convex/lib";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--popover-foreground)",
  boxShadow: "0 8px 30px -12px rgba(0,0,0,0.5)",
};

function InsightCard({
  icon: Icon,
  title,
  text,
  tone = "text-primary bg-primary/10",
  delay = 0,
}: {
  icon: typeof Lightbulb;
  title: string;
  text: string;
  tone?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="nexus-card flex items-start gap-3 p-4"
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", tone)}>
        <Icon className="size-4.5" />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{text}</p>
      </div>
    </motion.div>
  );
}

export default function Insights() {
  const summary = useQuery(api.purchases.summary);
  const now = Date.now();

  const data = useMemo(() => {
    if (!summary) return null;
    const byCategory = new Map<string, number>();
    const byMerchant = new Map<string, number>();
    const byMonth = new Map<string, number>();
    for (const p of summary) {
      byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + p.price);
      byMerchant.set(p.merchant ?? "Unknown", (byMerchant.get(p.merchant ?? "Unknown") ?? 0) + p.price);
      byMonth.set(monthKey(p.purchaseDate), (byMonth.get(monthKey(p.purchaseDate)) ?? 0) + p.price);
    }
    const categoryData = [...byCategory.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const merchantData = [...byMerchant.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const lastMonths: { name: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      lastMonths.push({ name: monthKey(d.getTime()), value: byMonth.get(monthKey(d.getTime())) ?? 0 });
    }
    return { categoryData, merchantData, lastMonths };
  }, [summary, now]);

  const insights = useMemo(() => {
    if (!summary || summary.length === 0) return [];
    const total = summary.reduce((s, p) => s + p.price, 0);
    const byCat = new Map<string, number>();
    const byMerchant = new Map<string, number>();
    for (const p of summary) {
      byCat.set(p.category, (byCat.get(p.category) ?? 0) + p.price);
      byMerchant.set(p.merchant ?? "Unknown", (byMerchant.get(p.merchant ?? "Unknown") ?? 0) + p.price);
    }
    const topCat = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
    const topMerchant = [...byMerchant.entries()].sort((a, b) => b[1] - a[1])[0];
    const subs = summary
      .filter((p) => p.category === "Subscriptions")
      .reduce((s, p) => s + p.price, 0);
    const biggest = [...summary].sort((a, b) => b.price - a.price)[0];
    const resale = [...summary]
      .filter((p) => p.category !== "Subscriptions")
      .map((p) => ({ p, v: resaleEstimate(p, now) }))
      .sort((a, b) => b.v - a.v)[0];

    const out: { icon: typeof Lightbulb; title: string; text: string; tone: string }[] = [];
    if (topCat && total > 0) {
      const pct = Math.round((topCat[1] / total) * 100);
      out.push({
        icon: Wallet,
        title: `${topCat[0]} lead your spending`,
        text: `${topCat[0]} account for ${pct}% of your tracked spend (${fmtMoney(topCat[1])} of ${fmtMoney(total)}).`,
        tone: "text-sky-300 bg-sky-400/10",
      });
    }
    if (topMerchant) {
      out.push({
        icon: Store,
        title: `${topMerchant[0]} is your biggest merchant`,
        text: `You've spent ${fmtMoney(topMerchant[1])} there — worth checking for loyalty or price-match policies.`,
        tone: "text-violet-300 bg-violet-400/10",
      });
    }
    if (subs > 0) {
      out.push({
        icon: Sparkles,
        title: `${fmtMoney(subs)} in subscriptions per month`,
        text: `That's ${fmtMoney(subs * 12)} a year. NEXUS tracks them like purchases so nothing renews unnoticed.`,
        tone: "text-emerald-300 bg-emerald-400/10",
      });
    }
    if (biggest && resale) {
      out.push({
        icon: Lightbulb,
        title: resale.p._id === biggest._id ? `${biggest.name} is your most valuable item` : `${biggest.name} is your biggest single purchase`,
        text:
          resale.p._id === biggest._id
            ? `Paid ${fmtMoney(biggest.price)} — estimated resale value today is ${fmtMoney(resale.v)}.`
            : `At ${fmtMoney(biggest.price)}, it drives a lot of your protected value. ${resale.p.name} holds the best resale estimate (${fmtMoney(resale.v)}).`,
        tone: "text-amber-300 bg-amber-400/10",
      });
    }
    return out;
  }, [summary, now]);

  if (summary === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-52" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }

  if (summary.length === 0) {
    return (
      <div className="nexus-card mx-auto mt-16 flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <BarChart3 className="size-8 text-muted-foreground" />
        <p className="font-semibold">No data to analyze yet</p>
        <p className="text-sm text-muted-foreground">
          Scan a few receipts and NEXUS will start breaking down your spending by category, month,
          and merchant.
        </p>
        <Link to="/scan">
          <Badge className="cursor-pointer">Scan a receipt</Badge>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Spending Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Computed from {summary.length} tracked purchase{summary.length === 1 ? "" : "s"} — no
          estimates presented as facts.
        </p>
      </div>

      {/* Plain-language insights */}
      <div className="grid gap-3 md:grid-cols-2">
        {insights.map((ins, i) => (
          <InsightCard key={ins.title} {...ins} delay={i * 0.06} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* By category */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="nexus-card p-5"
        >
          <h2 className="text-sm font-semibold">Spending by category</h2>
          <p className="text-xs text-muted-foreground">Share of your total tracked spend</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data!.categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data!.categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => fmtMoney(Number(value))}
                  contentStyle={tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {data!.categoryData.map((c, i) => (
              <span key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                {categoryMeta(c.name).emoji} {c.name} · {fmtMoney(c.value)}
              </span>
            ))}
          </div>
        </motion.div>

        {/* By month */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="nexus-card p-5"
        >
          <h2 className="text-sm font-semibold">Spending by month</h2>
          <p className="text-xs text-muted-foreground">Last six months of purchases</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data!.lastMonths} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(1)}k` : v}`}
                  width={44}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  formatter={(value) => fmtMoney(Number(value))}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--chart-1)" maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* By merchant */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="nexus-card p-5"
      >
        <h2 className="text-sm font-semibold">Top merchants</h2>
        <p className="text-xs text-muted-foreground">Where your money goes</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data!.merchantData}
              layout="vertical"
              margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(1)}k` : v}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                formatter={(value) => fmtMoney(Number(value))}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="var(--chart-2)" maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
