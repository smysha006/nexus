import { motion } from "framer-motion";
import {
  CalendarClock,
  Camera,
  Check,
  FileUp,
  PackageSearch,
  ReceiptText,
  ScanLine,
  Sparkles,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PurchaseForm } from "@/components/PurchaseForm";
import { sampleReceipt, type ExtractedFields } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Reading receipt", icon: ReceiptText },
  { label: "Identifying products", icon: PackageSearch },
  { label: "Extracting warranty & dates", icon: CalendarClock },
  { label: "Building your profile", icon: Sparkles },
];

function hashFileName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

type Phase = "idle" | "processing" | "review";

export default function Scan() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const startProcessing = (seed: number, name?: string) => {
    setFileName(name ?? null);
    setPhase("processing");
    setStepIndex(0);
    const data = sampleReceipt(seed);
    STEPS.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => setStepIndex(i), i * 700),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setExtracted(data);
        setPhase("review");
      }, STEPS.length * 700 + 400),
    );
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    startProcessing(hashFileName(file.name), file.name);
  };

  const [sampleCounter, setSampleCounter] = useState(0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">AI Receipt Scanner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop a receipt photo or PDF and Nexus OS extracts the product, warranty, and return window —
          then flags anything it's unsure about.
        </p>
      </div>

      {/* Dropzone / processing / review */}
      {phase === "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 text-center transition-colors sm:p-16",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border/80 bg-card/50 hover:border-primary/40",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Upload className="size-7" />
          </span>
          <div>
            <p className="font-display text-base font-semibold">
              Drag & drop your receipt here
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Photos, PDFs, and screenshots all work. Nothing leaves your browser until you save.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              className="gap-2 rounded-xl"
              onClick={() => inputRef.current?.click()}
            >
              <FileUp className="size-4" />
              Choose a file
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              onClick={() => {
                setSampleCounter((c) => c + 1);
                startProcessing(sampleCounter);
              }}
            >
              <Camera className="size-4" />
              Scan a sample receipt
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="text-[11px] text-muted-foreground/70">
            Demo mode: extraction is simulated locally for this hackathon build — every field is
            editable before saving, and low-confidence values are flagged.
          </p>
        </motion.div>
      )}

      {phase === "processing" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="nexus-card p-8 sm:p-10"
        >
          <div className="mx-auto flex max-w-sm flex-col items-center gap-6 text-center">
            <div className="relative">
              <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/20" />
              <span className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <ScanLine className="size-7" />
              </span>
            </div>
            <div>
              <p className="font-display text-base font-semibold">Analyzing your receipt</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {fileName ?? "receipt.jpg"} · Nexus OS Intelligence
              </p>
            </div>
            <div className="w-full space-y-3">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const state = i < stepIndex ? "done" : i === stepIndex ? "current" : "pending";
                return (
                  <div
                    key={s.label}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                      state === "done" && "border-emerald-400/20 bg-emerald-400/5",
                      state === "current" && "border-primary/30 bg-primary/5",
                      state === "pending" && "border-border/60 opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg",
                        state === "done"
                          ? "bg-emerald-400/15 text-emerald-400"
                          : state === "current"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {state === "done" ? (
                        <Check className="size-4" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </span>
                    <span className="text-sm font-medium">{s.label}</span>
                    {state === "current" && (
                      <span className="ml-auto size-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {phase === "review" && extracted && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="nexus-card space-y-5 p-5 sm:p-6"
        >
          <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Extraction complete — review before saving</p>
                <p className="text-xs text-muted-foreground">
                  {extracted.lowConfidence.length > 0
                    ? `${extracted.lowConfidence.length} field${extracted.lowConfidence.length === 1 ? "" : "s"} need${extracted.lowConfidence.length === 1 ? "s" : ""} your review`
                    : "All fields extracted with high confidence"}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "self-start sm:self-auto",
                extracted.confidence >= 90
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-amber-400/20 bg-amber-400/10 text-amber-300",
              )}
            >
              AI confidence {extracted.confidence}%
            </Badge>
          </div>

          {extracted.lowConfidence.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {extracted.lowConfidence.map((f) => (
                <Badge key={f} variant="outline" className="border-amber-400/25 bg-amber-400/10 text-amber-300">
                  ⚠ {f} — estimated, verify
                </Badge>
              ))}
            </div>
          )}

          <PurchaseForm
            initial={{ ...extracted, source: "scanned" }}
            submitLabel="Save to vault"
            onSaved={(id) => navigate(`/purchases/${id}`)}
            onCancel={() => {
              setPhase("idle");
              setExtracted(null);
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
