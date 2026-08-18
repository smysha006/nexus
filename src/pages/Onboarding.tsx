import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { NexusMark } from "@/components/NexusMark";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { categoryMeta } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const PRIORITIES = ["Warranty", "Returns", "Spending", "Resale"];

export default function Onboarding() {
  const navigate = useNavigate();
  const savePreferences = useMutation(api.onboarding.savePreferences);
  const seedDemoData = useMutation(api.purchases.seedDemoData);
  const [categories, setCategories] = useState<string[]>([
    "Electronics",
    "Appliances",
    "Vehicles",
  ]);
  const [priorities, setPriorities] = useState<string[]>(["Warranty", "Returns"]);
  const [withDemo, setWithDemo] = useState(true);
  const [loading, setLoading] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const finish = async (useDemo: boolean) => {
    setLoading(true);
    const cat = categories.length > 0 ? categories : Object.keys(categoryMeta);
    const pri = priorities.length > 0 ? priorities : PRIORITIES;
    try {
      await savePreferences({ categories: cat, priorities: pri });
      if (useDemo) {
        await seedDemoData();
        toast.success("Demo purchases loaded — explore your new vault");
      } else {
        toast.success("Workspace ready — add your first purchase");
      }
      navigate("/dashboard");
    } catch {
      setLoading(false);
      toast.error("Something went wrong saving your preferences. Try again.");
    }
  };

  return (
    <div className="nexus-glow flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xl"
      >
        <div className="nexus-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <NexusMark size={40} />
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">Set up your NEXUS</h1>
              <p className="text-sm text-muted-foreground">
                Two quick questions — then we'll build your workspace.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Step 1 · What do you want to track?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(categoryMeta).map(([cat, meta]) => {
                const Icon = meta.icon;
                const active = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggle(categories, setCategories, cat)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/70 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    <span className={cn("flex size-5 items-center justify-center rounded-md border", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-transparent")}>
                      {active && <Check className="size-3" />}
                    </span>
                    <Icon className="size-4" />
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Step 2 · What matters most to you?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRIORITIES.map((p) => {
                const active = priorities.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggle(priorities, setPriorities, p)}
                    className={cn(
                      "rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/70 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Load demo purchases</p>
                <p className="text-xs text-muted-foreground">
                  12 realistic purchases so every screen is alive immediately.
                </p>
              </div>
            </div>
            <Switch checked={withDemo} onCheckedChange={setWithDemo} />
          </div>

          <div className="mt-8 flex flex-col gap-2">
            <Button
              size="lg"
              className="gap-2 rounded-xl"
              onClick={() => finish(withDemo)}
              disabled={loading}
            >
              {loading ? "Building your workspace…" : "Build my NEXUS"}
              {!loading && <ArrowRight className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              className="rounded-xl text-muted-foreground"
              onClick={() => finish(false)}
              disabled={loading}
            >
              Skip for now
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
