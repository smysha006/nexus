import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  FileText,
  Mail,
  MessageSquare,
  Paperclip,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Wallet,
  Zap,
  BarChart3,
  Cpu,
  FileWarning,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router";
import { NexusMark } from "@/components/NexusMark";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const PROBLEMS = [
  {
    icon: Mail,
    title: "Buried in email",
    text: "Receipts from Apple, Amazon, and Best Buy pile up in a folder nobody opens — until the day you need them.",
  },
  {
    icon: MessageSquare,
    title: "Lost in chat threads",
    text: "“Send me the receipt” promises in WhatsApp and iMessage quietly expire, along with your return windows.",
  },
  {
    icon: Paperclip,
    title: "Paper everywhere",
    text: "Drawer receipts fade to blank white slips right around the time your warranty actually kicks in.",
  },
  {
    icon: FileText,
    title: "Scattered PDFs",
    text: "Downloads, screenshots, and scans live on five devices. Your warranty expiry date lives nowhere.",
  },
];

const STEPS = [
  {
    n: "01",
    icon: ScanLine,
    title: "Scan",
    text: "Snap a receipt or drop in a PDF. NEXUS reads the product, price, and dates, and flags anything it's unsure about.",
  },
  {
    n: "02",
    icon: Cpu,
    title: "Understand",
    text: "Every purchase gets a profile: warranty coverage, return window, serial number, and a 0–100 ownership health score.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Protect",
    text: "Deadlines turn into reminders. Warranty expirations and return windows never sneak past you again.",
  },
  {
    n: "04",
    icon: Zap,
    title: "Act",
    text: "File a claim, start a return, or sell at the right moment — with a draft and the details ready to go.",
  },
];

const FEATURES = [
  {
    icon: ScanLine,
    title: "AI Receipt Scanner",
    text: "Drag, drop, or photograph. NEXUS extracts product, merchant, price, and dates — and tells you exactly what it's confident about.",
    accent: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  },
  {
    icon: ShieldCheck,
    title: "Warranty Intelligence",
    text: "Every warranty tracked to the day, with expiring coverage surfaced before it lapses.",
    accent: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  },
  {
    icon: RotateCcw,
    title: "Return Tracking",
    text: "Return windows auto-calculated from purchase date + store policy. Countdowns, not guesswork.",
    accent: "text-rose-300 bg-rose-400/10 border-rose-400/20",
  },
  {
    icon: FileWarning,
    title: "AI Claim Assistant",
    text: "Describe the problem. NEXUS checks eligibility against your warranty and drafts the claim for you.",
    accent: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  },
  {
    icon: BarChart3,
    title: "Spending Insights",
    text: "Spend by category, month, and merchant — explained in plain language, not spreadsheets.",
    accent: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  },
  {
    icon: ClipboardCheck,
    title: "Purchase Health Score",
    text: "A 0–100 score per item based on coverage, age, and value — with the one-line reason why.",
    accent: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
  },
];

const DEMO_PURCHASES = [
  { emoji: "🎧", name: "WH-1000XM5", price: "$399", badge: "Return closes in 3 days", tone: "text-rose-300 bg-rose-400/10 border-rose-400/20" },
  { emoji: "💻", name: "MacBook Pro 14″", price: "$1,999", badge: "Warranty expiring", tone: "text-amber-300 bg-amber-400/10 border-amber-400/20" },
  { emoji: "⌚", name: "Apple Watch S9", price: "$429", badge: "Protected · Claim-ready", tone: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient glow */}
      <div className="nexus-glow pointer-events-none fixed inset-0 -z-10" />

      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <NexusMark size={32} />
            <span className="font-display text-lg font-bold tracking-tight">
              NEXUS
              <span className="ml-1.5 rounded-md border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                OS
              </span>
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#problem" className="transition-colors hover:text-foreground">The problem</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          </nav>
          <Link to="/auth">
            <Button className="rounded-xl">
              Open the app
              <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="mr-1.5 size-3" />
                Your purchases, connected intelligently
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]"
            >
              NEXUS doesn't just remember what you bought.{" "}
              <span className="text-gradient">It helps you get the most from everything you own.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg"
            >
              Scan a receipt and NEXUS builds a living profile for every purchase — warranties, return
              windows, serial numbers, and resale value — then tells you what to do before it's too late.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/auth">
                <Button size="lg" className="gap-2 rounded-xl px-6">
                  Get started free
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a href="#how">
                <Button size="lg" variant="outline" className="gap-2 rounded-xl px-6">
                  See how it works
                </Button>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> Free to start
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> No card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> Your data stays yours
              </span>
            </motion.div>
          </div>

          {/* Animated dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="nexus-card relative overflow-hidden p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Wallet className="size-4" />
                  </span>
                  <p className="text-sm font-semibold">Protected value</p>
                </div>
                <Badge variant="outline" className="border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  +18% this quarter
                </Badge>
              </div>
              <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">
                $<AnimatedNumber value={23876} />
              </p>
              <div className="mt-5 space-y-3">
                {DEMO_PURCHASES.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 p-3"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-lg">
                      {p.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.price}</p>
                    </div>
                    <Badge variant="outline" className={`border ${p.tone}`}>
                      {p.badge}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Floating assistant card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="absolute -bottom-8 -left-4 hidden w-64 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-2xl backdrop-blur sm:block lg:-left-10"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <p className="text-xs font-semibold">NEXUS Assistant</p>
              </div>
              <p className="mt-2.5 rounded-xl rounded-tl-sm bg-muted/60 px-3 py-2 text-xs leading-5">
                Can I still return my headphones?
              </p>
              <p className="mt-1.5 rounded-xl rounded-tr-sm border border-border/60 bg-card px-3 py-2 text-xs leading-5 text-muted-foreground">
                Yes — 3 days left. Your return window closes on the 21st. Want me to start the return?
              </p>
            </motion.div>

            {/* Floating scan chip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 }}
              className="absolute -right-3 -top-4 hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary sm:flex"
            >
              <ScanLine className="size-3.5" />
              Receipt scanned
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="border-y border-border/60 bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">The problem</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Your proof of purchase is everywhere — except where you need it.
            </h2>
            <p className="mt-4 text-muted-foreground">
              You paid for warranties, return rights, and resale value. NEXUS exists because those
              rights expire silently, scattered across a dozen inboxes and drawers.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                  className="nexus-card p-5"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-muted/50 text-muted-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{p.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Buy → Scan → Understand → Track → Protect → Act
            </h2>
            <p className="mt-4 text-muted-foreground">
              One receipt in, and NEXUS runs the whole ownership lifecycle for you.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.n}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                  className="relative rounded-2xl border border-border/70 bg-card/60 p-6"
                >
                  <span className="font-display text-3xl font-bold text-border">{s.n}</span>
                  <span className="mt-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-border/60 bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Capabilities</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you own, on a map you can act on.
            </h2>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: (i % 3) * 0.08 }}
                  className="nexus-card p-6 transition-colors hover:border-primary/25"
                >
                  <span className={`flex size-11 items-center justify-center rounded-xl border ${f.accent}`}>
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mock assistant conversation */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Ask anything</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Your data, actually answering back.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              NEXUS's assistant reads your real stored purchases — not marketing copy — to answer
              questions about what you own.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="nexus-card mx-auto mt-10 max-w-2xl p-5 sm:p-7">
            <div className="space-y-4">
              <div className="flex justify-end">
                <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  What warranties expire this month?
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="size-3.5" />
                </span>
                <div className="max-w-[85%]">
                  <p className="rounded-2xl rounded-tl-sm border border-border/70 bg-card px-4 py-2.5 text-sm leading-6 text-foreground">
                    Two items have coverage ending within 60 days: your MacBook Pro warranty expires
                    in 45 days, and the Sony headphones' return window closes in 3 days. I'd start
                    with the headphones.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["💻 MacBook Pro · 45 days", "🎧 WH-1000XM5 · 3 days"].map((chip) => (
                      <span key={chip} className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  Which product is worth selling?
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="size-3.5" />
                </span>
                <p className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border/70 bg-card px-4 py-2.5 text-sm leading-6 text-foreground">
                  Your Sony A7 III camera holds the best estimated resale value (~$1,200, based on
                  depreciation from $1,998). Want a listing draft?
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.div {...fadeUp}>
            <Badge variant="outline" className="border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Camera className="mr-1.5 size-3" />
              First receipt scanned in seconds
            </Badge>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Stop losing value to forgotten receipts.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground sm:text-lg">
              Connect your first purchase in under a minute. Free to start, demo data included so
              you can see NEXUS working immediately.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/auth">
                <Button size="lg" className="gap-2 rounded-xl px-7">
                  Get started free
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="gap-2 rounded-xl px-7">
                  <TrendingDown className="size-4" />
                  Try the live demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <NexusMark size={24} />
            <span className="font-display text-sm font-bold tracking-tight">
              NEXUS OS
            </span>
            <span className="text-xs text-muted-foreground">· Your purchases. Connected intelligently.</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Estimated vs. extracted vs. user-entered data is always labeled. NEXUS never invents
            prices, warranty terms, or legal rights.
          </p>
        </div>
      </footer>
    </div>
  );
}
