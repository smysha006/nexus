import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AssistantChat } from "@/components/AssistantChat";
import { Sparkles, X } from "lucide-react";

export function AssistantWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group fixed bottom-5 right-5 z-40 flex size-13 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-[#5f7bff] to-[#3f5fff] text-white shadow-[0_8px_30px_-6px_rgba(79,107,255,0.55)] transition-all hover:scale-105 hover:shadow-[0_10px_36px_-6px_rgba(79,107,255,0.7)]"
        aria-label="Open Nexus OS AI assistant"
        title="Ask Nexus OS"
      >
        <Sparkles className="size-5" />
        <span className="absolute -top-1 -right-1 flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
          <span className="relative inline-flex size-3 rounded-full border-2 border-background bg-success" />
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full border-l-border/70 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border/70 bg-muted/30 px-5 py-4">
            <SheetTitle className="flex items-center gap-2 font-display text-base">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="size-4" />
              </span>
              Nexus OS AI Assistant
            </SheetTitle>
            <SheetDescription>
              Answers from your real stored data — warranties, returns, spending.
            </SheetDescription>
          </SheetHeader>
          <AssistantChat />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close assistant"
          >
            <X className="size-4" />
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}
