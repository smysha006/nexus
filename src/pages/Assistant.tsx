import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AssistantChat } from "@/components/AssistantChat";
import { Badge } from "@/components/ui/badge";
import { categoryMeta } from "@/lib/catalog";

const SUGGESTIONS = [
  "What warranties expire this month?",
  "Can I still return my headphones?",
  "Which product is worth selling?",
  "How much have I spent on electronics?",
  "What's protected right now?",
  "Any price drops?",
];

export default function Assistant() {
  const user = useQuery(api.users.currentUser);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Nexus OS AI Assistant</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask anything about what you own — answers come from your real stored data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(user?.trackedCategories ?? []).slice(0, 4).map((c) => (
            <Badge key={c} variant="outline" className={`border ${categoryMeta(c).chip}`}>
              {categoryMeta(c).emoji} {c}
            </Badge>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="nexus-card flex h-[min(68vh,640px)] flex-col overflow-hidden"
      >
        <div className="flex items-center gap-2.5 border-b border-border/70 bg-muted/30 px-5 py-3.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Nexus OS Intelligence</p>
            <p className="text-[11px] text-muted-foreground">
              Reads your purchases, warranties, returns, and spending · estimates are labeled
            </p>
          </div>
        </div>
        <AssistantChat suggestions={SUGGESTIONS} />
      </motion.div>

      <p className="text-[11px] leading-4 text-muted-foreground/70">
        Honesty by design: Nexus OS only answers from data in your vault. Resale figures are
        depreciation-model estimates, never appraisals, and warranty statements are derived from
        your receipts unless you've verified them with the manufacturer.
      </p>
    </div>
  );
}
