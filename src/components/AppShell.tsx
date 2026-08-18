import { useAuth } from "@/hooks/use-auth";
import { NexusMark } from "@/components/NexusMark";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { AssistantWidget } from "@/components/AssistantWidget";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/purchases", label: "Purchases", icon: Package },
  { to: "/warranties", label: "Warranties", icon: ShieldCheck },
  { to: "/returns", label: "Returns", icon: RotateCcw },
  { to: "/claims", label: "Claims", icon: FileText },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
];

export function AppShell() {
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Route users through onboarding before the product workspace.
  if (!isLoading && user && !user.onboardingComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  const initials = (user?.name ?? user?.email ?? "N")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex shrink-0 items-center gap-2.5"
            aria-label="Nexus OS home"
          >
            <NexusMark size={30} />
            <span className="hidden font-display text-[15px] font-bold tracking-tight sm:block">
              Nexus OS
            </span>
          </button>

          <nav className="ml-2 hidden items-center gap-0.5 md:flex">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <GlobalSearch />
            <NotificationsPopover />
            <Button
              onClick={() => navigate("/scan")}
              className="hidden gap-1.5 rounded-xl sm:inline-flex"
              size="sm"
            >
              <Plus className="size-4" />
              Add purchase
            </Button>
            <Button
              onClick={() => navigate("/scan")}
              className="rounded-xl sm:hidden"
              size="icon"
              variant="outline"
              aria-label="Add purchase"
            >
              <Plus className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-full outline-none ring-ring focus-visible:ring-2" aria-label="Account menu">
                  <Avatar className="size-8 border border-border/70">
                    {user?.image && <AvatarImage src={user.image} alt="" />}
                    <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="truncate text-sm font-semibold">{user?.name ?? "Guest"}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/purchases")} className="cursor-pointer">
                  <Package className="mr-2 size-4" />
                  My purchases
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/assistant")} className="cursor-pointer">
                  <Sparkles className="mr-2 size-4" />
                  AI Assistant
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/50 px-3 py-1.5 md:hidden">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <Icon className="size-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:py-8">
        <Outlet />
      </main>

      <AssistantWidget />
    </div>
  );
}
