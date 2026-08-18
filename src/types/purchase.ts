import type { Doc } from "@/convex/_generated/dataModel";
import type { ReturnStatus, WarrantyStatus } from "@/convex/lib";

export type Purchase = Doc<"purchases">;

export interface PurchaseSummary {
  id: string;
  name: string;
  brand?: string;
  category: string;
  merchant?: string;
  price: number;
  purchaseDate: number;
  warrantyExpires?: number;
  warrantyStatus: WarrantyStatus;
  returnDeadline?: number;
  returnStatus: ReturnStatus;
  healthScore?: number;
  image?: string;
  serialNumber?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  currentPrice?: number;
  hasPriceDrop: boolean;
  warrantyExpiresLabel?: string | null;
}
