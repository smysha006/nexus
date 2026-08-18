import { api } from "@/convex/_generated/api";
import { useConvex } from "convex/react";
import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  name: string;
  image?: string;
  note: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  label?: string;
}

const DEFAULT_SUGGESTIONS = [
  "What warranties expire this month?",
  "Can I still return my headphones?",
  "Which product is worth selling?",
  "How much have I spent in total?",
  "What's protected right now?",
];

export function AssistantChat({
  suggestions = DEFAULT_SUGGESTIONS,
  className,
}: {
  suggestions?: string[];
  className?: string;
}) {
  const convex = useConvex();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm Nexus OS. I read your stored purchases, warranties, and return windows, and answer from that data — no guesswork. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const res = await convex.query(api.assistant.ask, { prompt: trimmed });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.answer,
          sources: res.sources,
          label: res.label,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Sorry — I hit a snag reading your data. Give it another try in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-2.5">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="size-3.5" />
              </div>
              <div className="max-w-[85%] space-y-2">
                <div className="rounded-2xl rounded-tl-sm border border-border/70 bg-card px-3.5 py-2.5 text-sm leading-6 text-foreground whitespace-pre-wrap">
                  {m.content}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.sources.map((s) => (
                      <Link
                        key={s.id}
                        to={`/purchases/${s.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        <span>{s.image ?? "📦"}</span>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground/70">· {s.note}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {m.label && (
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                    {m.label}
                  </p>
                )}
              </div>
            </div>
          ),
        )}
        {loading && (
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="size-3.5" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border/70 bg-card px-3.5 py-3">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:120ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:240ms]" />
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-border/70 p-3"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your purchases, warranties, returns…"
          className="max-h-28 min-h-10 flex-1 resize-none rounded-xl bg-muted/40"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || !input.trim()}
          className="size-10 shrink-0 rounded-xl"
          aria-label="Send message"
        >
          <ArrowUp className="size-4" />
        </Button>
      </form>
    </div>
  );
}
