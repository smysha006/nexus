import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { relativeDays } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationKind } from "@/convex/notifications";

const KIND_META: Record<
  NotificationKind,
  { icon: typeof Bell; cls: string; ring: string }
> = {
  return: { icon: RotateCcw, cls: "text-danger bg-danger/10", ring: "border-danger/25" },
  warranty: { icon: ShieldAlert, cls: "text-warning bg-warning/10", ring: "border-warning/25" },
  price: { icon: TrendingDown, cls: "text-warning bg-warning/10", ring: "border-warning/25" },
  claim: { icon: Sparkles, cls: "text-success bg-success/10", ring: "border-success/25" },
  info: { icon: AlertTriangle, cls: "text-muted-foreground bg-muted", ring: "border-border/70" },
};

export function NotificationsPopover() {
  const notifications = useQuery(api.notifications.list);
  const unread = useQuery(api.notifications.unreadCount);
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const navigate = useNavigate();

  const loading = notifications === undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-4.5" />
          {(unread ?? 0) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(92vw,380px)] border-border/70 p-0"
      >
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {(unread ?? 0) > 0 && (
              <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                {unread} new
              </Badge>
            )}
          </div>
          {(unread ?? 0) > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/60" />
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((n) => {
              const meta = KIND_META[n.kind];
              const Icon = meta.icon;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.read) markRead({ id: n.id });
                    if (n.purchaseId) navigate(`/purchases/${n.purchaseId}`);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/50",
                    !n.read && "bg-primary/[0.04]",
                  )}
                >
                  <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border", meta.cls, meta.ring)}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold">{n.title}</span>
                      {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      {n.message}
                    </span>
                    {n.deadline && (
                      <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
                        {relativeDays(n.deadline)}
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Bell className="size-5" />
              </span>
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="text-xs text-muted-foreground">
                Deadlines, price drops, and claim reminders will land here.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
