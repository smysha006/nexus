import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Purchase } from "@/types/purchase";

export interface PurchaseFormValues {
  name: string;
  brand?: string;
  model?: string;
  category: string;
  merchant?: string;
  price: number;
  purchaseDate: number;
  warrantyMonths?: number;
  returnWindowDays?: number;
  serialNumber?: string;
  invoiceNumber?: string;
  orderNumber?: string;
  notes?: string;
  image?: string;
  currentPrice?: number;
  source?: "scanned" | "manual" | "demo";
  confidence?: number;
  lowConfidenceFields?: string[];
}

function toDateInput(ts?: number): string {
  if (!ts) return "";
  return new Date(ts).toISOString().slice(0, 10);
}

function fromDateInput(s: string): number | undefined {
  if (!s) return undefined;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.getTime();
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

export function PurchaseForm({
  initial,
  submitLabel = "Save purchase",
  onSaved,
  onCancel,
}: {
  initial?: Partial<PurchaseFormValues> & { id?: string };
  submitLabel?: string;
  onSaved: (id: string) => void;
  onCancel?: () => void;
}) {
  const upsert = useMutation(api.purchases.upsert);
  const [values, setValues] = useState<PurchaseFormValues>({
    name: initial?.name ?? "",
    brand: initial?.brand ?? "",
    model: initial?.model ?? "",
    category: initial?.category ?? "Electronics",
    merchant: initial?.merchant ?? "",
    price: initial?.price ?? 0,
    purchaseDate: initial?.purchaseDate ?? Date.now(),
    warrantyMonths: initial?.warrantyMonths,
    returnWindowDays: initial?.returnWindowDays,
    serialNumber: initial?.serialNumber ?? "",
    invoiceNumber: initial?.invoiceNumber ?? "",
    orderNumber: initial?.orderNumber ?? "",
    notes: initial?.notes ?? "",
    image: initial?.image ?? "",
    currentPrice: initial?.currentPrice,
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof PurchaseFormValues>(k: K, v: PurchaseFormValues[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      toast.error("Give this purchase a name first");
      return;
    }
    if (values.price <= 0) {
      toast.error("Price must be greater than zero");
      return;
    }
    setSaving(true);
    try {
      const id = await upsert({
        id: initial?.id,
        name: values.name.trim(),
        brand: values.brand?.trim() || undefined,
        model: values.model?.trim() || undefined,
        category: values.category,
        merchant: values.merchant?.trim() || undefined,
        price: values.price,
        purchaseDate: values.purchaseDate,
        warrantyMonths: values.warrantyMonths,
        warrantyExpires:
          values.warrantyMonths && values.purchaseDate
            ? values.purchaseDate + values.warrantyMonths * 30.44 * 86_400_000
            : undefined,
        returnWindowDays: values.returnWindowDays,
        returnDeadline:
          values.returnWindowDays && values.purchaseDate
            ? values.purchaseDate + values.returnWindowDays * 86_400_000
            : undefined,
        serialNumber: values.serialNumber?.trim() || undefined,
        invoiceNumber: values.invoiceNumber?.trim() || undefined,
        orderNumber: values.orderNumber?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        image: values.image?.trim() || undefined,
        currentPrice: values.currentPrice,
        source: values.source,
        confidence: values.confidence,
        lowConfidenceFields: values.lowConfidenceFields,
      });
      toast.success(initial?.id ? "Purchase updated" : "Purchase saved to your vault");
      onSaved(id);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save this purchase. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name">
          <Input
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="MacBook Pro 14″"
            className="rounded-xl"
          />
        </Field>
        <Field label="Brand">
          <Input
            value={values.brand ?? ""}
            onChange={(e) => set("brand", e.target.value)}
            placeholder="Apple"
            className="rounded-xl"
          />
        </Field>
        <Field label="Model / variant">
          <Input
            value={values.model ?? ""}
            onChange={(e) => set("model", e.target.value)}
            placeholder="M3 Pro · 18 GB"
            className="rounded-xl"
          />
        </Field>
        <Field label="Category">
          <Select value={values.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Merchant">
          <Input
            value={values.merchant ?? ""}
            onChange={(e) => set("merchant", e.target.value)}
            placeholder="Apple Store"
            className="rounded-xl"
          />
        </Field>
        <Field label="Emoji / image">
          <Input
            value={values.image ?? ""}
            onChange={(e) => set("image", e.target.value)}
            placeholder="💻"
            className="rounded-xl"
            maxLength={4}
          />
        </Field>
        <Field label="Price paid (USD)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={values.price || ""}
            onChange={(e) => set("price", Number(e.target.value))}
            placeholder="1999"
            className="rounded-xl"
          />
        </Field>
        <Field label="Purchase date">
          <Input
            type="date"
            value={toDateInput(values.purchaseDate)}
            onChange={(e) => set("purchaseDate", fromDateInput(e.target.value) ?? values.purchaseDate)}
            className="rounded-xl"
          />
        </Field>
        <Field label="Warranty (months)" hint="Leave empty if no warranty">
          <Input
            type="number"
            min={0}
            value={values.warrantyMonths ?? ""}
            onChange={(e) =>
              set("warrantyMonths", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="12"
            className="rounded-xl"
          />
        </Field>
        <Field label="Return window (days)" hint="Store policy from the receipt, if visible">
          <Input
            type="number"
            min={0}
            value={values.returnWindowDays ?? ""}
            onChange={(e) =>
              set("returnWindowDays", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="14"
            className="rounded-xl"
          />
        </Field>
        <Field label="Serial number">
          <Input
            value={values.serialNumber ?? ""}
            onChange={(e) => set("serialNumber", e.target.value)}
            placeholder="FVF53L7XQ9"
            className="rounded-xl font-mono text-xs"
          />
        </Field>
        <Field label="Invoice / order number">
          <Input
            value={values.invoiceNumber ?? ""}
            onChange={(e) => set("invoiceNumber", e.target.value)}
            placeholder="INV-90213"
            className="rounded-xl font-mono text-xs"
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea
            value={values.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Anything worth remembering about this purchase…"
            className="min-h-20 rounded-xl"
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving} className="gap-2 rounded-xl">
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** Convert a stored purchase doc into form values (used by the edit dialog). */
export function purchaseToForm(p: Purchase): PurchaseFormValues {
  return {
    name: p.name,
    brand: p.brand,
    model: p.model,
    category: p.category,
    merchant: p.merchant,
    price: p.price,
    purchaseDate: p.purchaseDate,
    warrantyMonths: p.warrantyMonths,
    returnWindowDays: p.returnWindowDays,
    serialNumber: p.serialNumber,
    invoiceNumber: p.invoiceNumber,
    orderNumber: p.orderNumber,
    notes: p.notes,
    image: p.image,
    currentPrice: p.currentPrice,
    source: p.source,
    confidence: p.confidence,
    lowConfidenceFields: p.lowConfidenceFields,
  };
}
