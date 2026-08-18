import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Check,
  Circle,
  Download,
  FileText,
  FileWarning,
  Pencil,
  ReceiptText,
  RotateCcw,
  ScanLine,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthRing, healthText } from "@/components/HealthRing";
import { PurchaseForm, purchaseToForm } from "@/components/PurchaseForm";
import { ConfidencePill, ReturnBadge, SourceBadge, WarrantyBadge } from "@/components/StatusBadges";
import { categoryMeta } from "@/lib/catalog";
import { fmtDate, fmtMoney, fullDate, relativeDays } from "@/lib/format";
import { cn } from "@/lib/utils";

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();
  const purchase = useQuery(api.purchases.get, id ? { id: id as never } : "skip");
  const remove = useMutation(api.purchases.remove);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  if (purchase === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (purchase === null) {
    return (
      <div className="nexus-card mx-auto mt-16 flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <AlertTriangle className="size-8 text-muted-foreground" />
        <p className="font-semibold">Purchase not found</p>
        <p className="text-sm text-muted-foreground">It may have been deleted or the link is wrong.</p>
        <Link to="/purchases">
          <Button variant="outline" className="gap-2 rounded-xl">
            <ArrowLeft className="size-4" />
            Back to vault
          </Button>
        </Link>
      </div>
    );
  }

  const meta = categoryMeta(purchase.category);
  const Icon = meta.icon;
  const now = Date.now();
  const drop = purchase.currentPrice != null && purchase.currentPrice < purchase.price;

  const milestones = [
    {
      label: "Purchased",
      date: purchase.purchaseDate,
      icon: BadgeCheck,
      state: "done" as const,
      note: `Paid ${fmtMoney(purchase.price)} at ${purchase.merchant ?? "the merchant"}`,
    },
    purchase.warrantyExpires
      ? {
          label: "Warranty activated",
          date: purchase.purchaseDate,
          icon: Shield,
          state: "done" as const,
          note: `${purchase.warrantyMonths ?? "—"} month${(purchase.warrantyMonths ?? 0) === 1 ? "" : "s"} of coverage began`,
        }
      : null,
    purchase.returnDeadline
      ? {
          label: "Return window ends",
          date: purchase.returnDeadline,
          icon: RotateCcw,
          state: (purchase.returnDeadline < now ? "passed" : "upcoming") as "passed" | "upcoming",
          note:
            purchase.returnDeadline < now
              ? `Closed ${relativeDays(purchase.returnDeadline)}`
              : `${relativeDays(purchase.returnDeadline)} — ${fullDate(purchase.returnDeadline)}`,
        }
      : null,
    purchase.warrantyExpires
      ? {
          label: "Warranty expires",
          date: purchase.warrantyExpires,
          icon: ShieldCheck,
          state: (purchase.warrantyExpires < now ? "passed" : "upcoming") as "passed" | "upcoming",
          note:
            purchase.warrantyExpires < now
              ? `Coverage ended ${relativeDays(purchase.warrantyExpires)}`
              : `${relativeDays(purchase.warrantyExpires)} — ${fullDate(purchase.warrantyExpires)}`,
        }
      : null,
  ].filter(Boolean) as {
    label: string;
    date: number;
    icon: typeof Shield;
    state: "done" | "upcoming" | "passed";
    note: string;
  }[];

  const infoFields = [
    { label: "Category", value: purchase.category },
    { label: "Brand", value: purchase.brand ?? "—" },
    { label: "Model", value: purchase.model ?? "—" },
    { label: "Merchant", value: purchase.merchant ?? "—" },
    { label: "Price paid", value: fmtMoney(purchase.price) },
    { label: "Purchase date", value: fmtDate(purchase.purchaseDate) },
    { label: "Serial number", value: purchase.serialNumber ?? "—" },
    { label: "Invoice number", value: purchase.invoiceNumber ?? "—" },
    { label: "Order number", value: purchase.orderNumber ?? "—" },
    {
      label: "Current price",
      value: purchase.currentPrice != null ? fmtMoney(purchase.currentPrice) : "—",
    },
    {
      label: "Warranty",
      value: purchase.warrantyExpires ? `${purchase.warrantyMonths} months · until ${fmtDate(purchase.warrantyExpires)}` : "None on file",
    },
    {
      label: "Return window",
      value: purchase.returnDeadline ? `${purchase.returnWindowDays} days · until ${fmtDate(purchase.returnDeadline)}` : "None on file",
    },
  ];

  const handleDelete = async () => {
    await remove({ id: purchase._id });
    toast.success("Purchase removed from your vault");
    navigate("/purchases");
  };

  const receiptDoc = [
    `Nexus OS — Receipt record`,
    `==========================`,
    `Product: ${purchase.name}`,
    `Merchant: ${purchase.merchant ?? "—"}`,
    `Price: ${fmtMoney(purchase.price)}`,
    `Purchased: ${fullDate(purchase.purchaseDate)}`,
    `Invoice: ${purchase.invoiceNumber ?? "—"}`,
    `Order: ${purchase.orderNumber ?? "—"}`,
    `Source: ${purchase.source ?? "manual"}${purchase.confidence != null ? ` (AI confidence ${purchase.confidence}%)` : ""}`,
    ``,
    `Stored by Nexus OS. Original document is the authoritative receipt.`,
  ].join("\n");

  const invoiceDoc = [
    `Nexus OS — Invoice record`,
    `=========================`,
    `Product: ${purchase.name}`,
    `Brand: ${purchase.brand ?? "—"}`,
    `Model: ${purchase.model ?? "—"}`,
    `Merchant: ${purchase.merchant ?? "—"}`,
    `Invoice #: ${purchase.invoiceNumber ?? "—"}`,
    `Order #: ${purchase.orderNumber ?? "—"}`,
    `Amount: ${fmtMoney(purchase.price)}`,
    `Date: ${fullDate(purchase.purchaseDate)}`,
    ``,
    `Stored by Nexus OS. Original invoice remains authoritative.`,
  ].join("\n");

  const warrantyDoc = [
    `Nexus OS — Warranty record`,
    `==========================`,
    `Product: ${purchase.name}`,
    `Serial: ${purchase.serialNumber ?? "—"}`,
    `Coverage: ${purchase.warrantyMonths ?? "—"} months`,
    `Expires: ${purchase.warrantyExpires ? fullDate(purchase.warrantyExpires) : "—"}`,
    `Status: ${purchase.warrantyExpires ? (purchase.warrantyExpires < now ? "Expired" : "Active") : "No warranty on file"}`,
    ``,
    `Stored by Nexus OS. Warranty terms are estimates from the receipt unless verified with the manufacturer.`,
  ].join("\n");

  return (
    <div className="space-y-6">
      <Link
        to="/purchases"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to Purchase Vault
      </Link>

      {/* Header card */}
      <div className="nexus-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 text-3xl">
              {purchase.image ?? meta.emoji}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight">{purchase.name}</h1>
                <SourceBadge source={purchase.source} />
                <ConfidencePill value={purchase.confidence} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {[purchase.brand, purchase.model, purchase.merchant].filter(Boolean).join(" · ") || "Details coming soon"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className={`border ${meta.chip}`}>
                  <Icon className="size-3" />
                  {purchase.category}
                </Badge>
                <WarrantyBadge status={purchase.warrantyExpires ? (purchase.warrantyExpires < now ? "expired" : purchase.warrantyExpires - now <= 60 * 86_400_000 ? "expiring" : "active") : "none"} />
                <ReturnBadge status={purchase.returnDeadline ? (purchase.returnDeadline < now ? "closed" : purchase.returnDeadline - now <= 7 * 86_400_000 ? "closing" : "open") : "none"} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 lg:ml-auto">
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums tracking-tight">{fmtMoney(purchase.price)}</p>
              <p className="text-[11px] text-muted-foreground">
                {purchase.category === "Subscriptions" ? "per month" : `on ${fmtDate(purchase.purchaseDate)}`}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <HealthRing score={purchase.healthScore} size={64} stroke={6} />
              <p className={cn("text-[10px] font-semibold", healthText(purchase.healthScore))}>
                Health score
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-lg" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="gap-1.5 rounded-lg text-destructive hover:text-destructive">
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {purchase.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes the purchase, its warranty record, and documents from
                      your vault. This can't be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="rounded-xl bg-destructive text-white hover:bg-destructive/90" onClick={handleDelete}>
                      Delete purchase
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {drop && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3.5 py-2.5 text-sm text-amber-300">
            <TrendingDown className="size-4" />
            This item now sells for {fmtMoney(purchase.currentPrice!)} — {fmtMoney(purchase.price - purchase.currentPrice!)} below what you paid.
          </div>
        )}

        {purchase.healthReason && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5 text-xs leading-5 text-muted-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
              <strong className="font-semibold text-foreground">Why this score:</strong> {purchase.healthReason}
              {" "}· computed from stored data, not a guarantee.
            </span>
          </div>
        )}
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="timeline" className="rounded-lg">Timeline</TabsTrigger>
          <TabsTrigger value="details" className="rounded-lg">Details</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg">Documents</TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline">
          <div className="nexus-card p-5 sm:p-6">
            <ol className="relative space-y-6 border-l border-border/70 pl-6">
              {milestones.map((m, i) => {
                const Icon = m.icon;
                const isLast = i === milestones.length - 1;
                return (
                  <li key={m.label} className="relative">
                    {!isLast && <span className="absolute -left-[27px] top-6 h-full w-px bg-border/50" />}
                    <span
                      className={cn(
                        "absolute -left-[35px] top-0 flex size-4 items-center justify-center rounded-full border-2",
                        m.state === "done"
                          ? "border-emerald-400 bg-emerald-400/20"
                          : m.state === "upcoming"
                            ? "border-primary bg-primary/20"
                            : "border-border bg-muted",
                      )}
                    >
                      {m.state === "done" && <Check className="size-2.5 text-emerald-400" />}
                    </span>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            "size-4",
                            m.state === "passed" ? "text-muted-foreground/50" : m.state === "upcoming" ? "text-primary" : "text-emerald-400",
                          )}
                        />
                        <p className={cn("text-sm font-semibold", m.state === "passed" && "text-muted-foreground")}>
                          {m.label}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            m.state === "done" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
                            m.state === "upcoming" && "border-primary/25 bg-primary/10 text-primary",
                            m.state === "passed" && "border-border/70 text-muted-foreground",
                          )}
                        >
                          {m.state === "done" ? "Done" : m.state === "upcoming" ? "Upcoming" : "Passed"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{m.note}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </TabsContent>

        {/* Details */}
        <TabsContent value="details">
          <div className="nexus-card grid gap-px overflow-hidden rounded-2xl border-border/80 sm:grid-cols-2 lg:grid-cols-3">
            {infoFields.map((f) => (
              <div key={f.label} className="bg-card/60 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{f.label}</p>
                <p className="mt-1 text-sm font-medium break-words">{f.value}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Receipt",
                desc: `Merchant record from ${purchase.merchant ?? "the store"} · ${purchase.invoiceNumber ?? "no invoice #"}`,
                icon: ReceiptText,
                file: `nexus-receipt-${purchase.name.toLowerCase().replace(/\s+/g, "-")}.txt`,
                content: receiptDoc,
                tone: "text-sky-300 bg-sky-400/10 border-sky-400/20",
              },
              {
                title: "Invoice",
                desc: `${purchase.invoiceNumber ?? "Invoice not recorded"} · ${fmtMoney(purchase.price)} on ${fmtDate(purchase.purchaseDate)}`,
                icon: FileText,
                file: `nexus-invoice-${purchase.name.toLowerCase().replace(/\s+/g, "-")}.txt`,
                content: invoiceDoc,
                tone: "text-violet-300 bg-violet-400/10 border-violet-400/20",
              },
              {
                title: "Warranty card",
                desc: purchase.warrantyExpires
                  ? `Active until ${fullDate(purchase.warrantyExpires)}`
                  : "No warranty recorded for this purchase",
                icon: ShieldCheck,
                file: `nexus-warranty-${purchase.name.toLowerCase().replace(/\s+/g, "-")}.txt`,
                content: warrantyDoc,
                tone: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
              },
            ].map((doc) => {
              const DocIcon = doc.icon;
              return (
                <div key={doc.title} className="nexus-card flex flex-col p-5">
                  <span className={`flex size-10 items-center justify-center rounded-xl border ${doc.tone}`}>
                    <DocIcon className="size-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold">{doc.title}</h3>
                  <p className="mt-1 flex-1 text-xs leading-5 text-muted-foreground">{doc.desc}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5 rounded-lg"
                    onClick={() => downloadText(doc.file, doc.content)}
                  >
                    <Download className="size-3.5" />
                    Download
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
            <FileWarning className="size-3.5" />
            These are Nexus OS records of your data. The original receipt or invoice remains the
            authoritative document.
          </p>
        </TabsContent>
      </Tabs>

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-2">
        <Button className="gap-2 rounded-xl" onClick={() => navigate(`/claims?purchase=${purchase._id}`)}>
          <FileWarning className="size-4" />
          Start a warranty claim
        </Button>
        {purchase.returnDeadline && purchase.returnDeadline > now && (
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => navigate(`/returns`)}>
            <RotateCcw className="size-4" />
            View return center
          </Button>
        )}
        <Button variant="ghost" className="gap-2 rounded-xl text-muted-foreground" onClick={() => navigate("/scan")}>
          <ScanLine className="size-4" />
          Scan another receipt
        </Button>
      </div>

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Edit purchase</DialogTitle>
            <DialogDescription>
              Update any field — changes recalculate the health score automatically.
            </DialogDescription>
          </DialogHeader>
          <PurchaseForm
            initial={{ ...purchaseToForm(purchase), id: purchase._id }}
            submitLabel="Save changes"
            onSaved={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
