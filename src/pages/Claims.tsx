import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ClipboardCopy,
  Download,
  FileWarning,
  Loader2,
  MessageSquareText,
  Send,
  ShieldAlert,
  ShieldX,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate, fmtMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

function eligibilityMeta(eligibility: string) {
  switch (eligibility) {
    case "covered":
      return {
        label: "Eligible — within warranty",
        cls: "border-success/20 bg-success/10 text-success",
        icon: CheckCircle2,
      };
    case "expiring":
      return {
        label: "Eligible — expires soon",
        cls: "border-warning/20 bg-warning/10 text-warning",
        icon: ShieldAlert,
      };
    case "expired":
      return {
        label: "Warranty expired — not covered",
        cls: "border-danger/20 bg-danger/10 text-danger",
        icon: ShieldX,
      };
    default:
      return {
        label: "No warranty on file",
        cls: "border-border/60 bg-muted/40 text-muted-foreground",
        icon: FileWarning,
      };
  }
}

export default function Claims() {
  useCurrency();
  const claims = useQuery(api.claims.list);
  const purchases = useQuery(api.purchases.list);
  const create = useMutation(api.claims.create);
  const updateStatus = useMutation(api.claims.updateStatus);
  const remove = useMutation(api.claims.remove);

  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("purchase");

  const [purchaseId, setPurchaseId] = useState<string>(preselected ?? "none");
  const [issue, setIssue] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (preselected && purchases?.some((p) => p._id === preselected)) {
      setPurchaseId(preselected);
    }
  }, [preselected, purchases]);

  const generate = async () => {
    if (!issue.trim()) {
      toast.error("Describe the problem first — that's what goes in the draft");
      return;
    }
    setGenerating(true);
    try {
      const purchase = purchases?.find((p) => p._id === purchaseId);
      await create({
        purchaseId: purchaseId !== "none" ? (purchaseId as never) : undefined,
        productName: purchase?.name ?? "Unspecified product",
        issue,
      });
      toast.success("Claim draft generated");
      setIssue("");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't generate the draft. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyDraft = async (subject: string, body: string) => {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      toast.success("Claim draft copied to clipboard");
    } catch {
      toast.error("Clipboard unavailable — use Download instead");
    }
  };

  const downloadDraft = (claim: NonNullable<typeof claims>[number]) => {
    const blob = new Blob(
      [`${claim.draft.subject}\n\n${claim.draft.body}`],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-claim-${claim.productName.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">AI Claim Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe what's wrong — Nexus OS checks your warranty and drafts the claim for you.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Generator */}
        <Card className="rounded-2xl border-border/70 bg-card/70 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <MessageSquareText className="size-4" />
              </span>
              New claim
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Product</label>
              {purchases === undefined ? (
                <Skeleton className="h-9 rounded-xl" />
              ) : (
                <Select value={purchaseId} onValueChange={setPurchaseId}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Choose a purchase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General / other product</SelectItem>
                    {purchases.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.image ?? "📦"} {p.name} · {fmtMoney(p.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">What's wrong?</label>
              <Textarea
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="e.g. The screen flickers and shuts off randomly after an hour of use…"
                className="min-h-28 rounded-xl"
              />
            </div>

            <Button
              className="w-full gap-2 rounded-xl"
              onClick={generate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Checking eligibility…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate claim draft
                </>
              )}
            </Button>

            <p className="text-[11px] leading-4 text-muted-foreground/70">
              Nexus OS checks the warranty dates on file and marks coverage honestly — it never
              invents terms or legal rights. You stay in control of what gets sent.
            </p>
          </CardContent>
        </Card>

        {/* History */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Claim drafts ({claims?.length ?? 0})
          </h2>
          {claims === undefined ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : claims.length === 0 ? (
            <div className="nexus-card flex flex-col items-center gap-3 p-10 text-center">
              <FileWarning className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">No claims yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick a product, describe the issue, and Nexus OS will draft a claim from your
                  warranty data.
                </p>
              </div>
            </div>
          ) : (
            claims.map((claim, i) => {
              const meta = eligibilityMeta(claim.eligibility);
              const ElIcon = meta.icon;
              const purchase = purchases?.find((p) => p._id === claim.purchaseId);
              return (
                <motion.div
                  key={claim._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className="nexus-card overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{purchase?.image ?? "📄"}</span>
                      <div>
                        <p className="text-sm font-semibold">{claim.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          Drafted {fmtDate(claim.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("border", meta.cls)}>
                        <ElIcon className="size-3" />
                        {meta.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border",
                          claim.status === "submitted"
                            ? "border-success/20 bg-success/10 text-success"
                            : "border-border/60 text-muted-foreground",
                        )}
                      >
                        {claim.status === "submitted" ? "Sent" : "Draft"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-primary">{claim.draft.subject}</p>
                      <pre className="mt-2 max-h-44 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-5 text-muted-foreground">
                        {claim.draft.body}
                      </pre>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 rounded-lg"
                        onClick={() => copyDraft(claim.draft.subject, claim.draft.body)}
                      >
                        <ClipboardCopy className="size-3.5" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 rounded-lg"
                        onClick={() => downloadDraft(claim)}
                      >
                        <Download className="size-3.5" />
                        Download
                      </Button>
                      {claim.status === "draft" && (
                        <Button
                          size="sm"
                          className="gap-1.5 rounded-lg"
                          onClick={async () => {
                            await updateStatus({ id: claim._id, status: "submitted" });
                            toast.success("Marked as sent");
                          }}
                        >
                          <Send className="size-3.5" />
                          Mark as sent
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto gap-1.5 rounded-lg text-destructive hover:text-destructive"
                        onClick={async () => {
                          await remove({ id: claim._id });
                          toast.success("Claim draft deleted");
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
