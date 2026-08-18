import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { NexusMark } from "@/components/NexusMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CurrencySelect } from "@/components/CurrencySelect";

import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Lock, Mail, Sparkles, UserX } from "lucide-react";
import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        `Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="nexus-glow relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute left-5 top-5 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <NexusMark size={26} />
        Nexus OS
      </button>
      <div className="absolute right-5 top-5 flex items-center gap-1">
        <CurrencySelect />
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="nexus-card overflow-hidden">
          {step === "signIn" ? (
            <>
              <div className="p-7 pb-6 text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Lock className="size-6" />
                </span>
                <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
                  Welcome to Nexus OS
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Your purchases, connected intelligently. Sign in or create an account to
                  continue.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit}>
                <div className="space-y-3 px-7">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      name="email"
                      placeholder="name@example.com"
                      type="email"
                      className="rounded-xl py-2.5 pl-10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gap-2 rounded-xl py-2.5"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Sending code…
                      </>
                    ) : (
                      <>
                        Continue with email
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                  {error && <p className="text-center text-xs text-destructive">{error}</p>}

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/60" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 rounded-xl py-2.5"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    <UserX className="size-4" />
                    Continue as guest
                  </Button>
                </div>

                <div className="mt-6 border-t border-border/60 bg-muted/30 px-7 py-4">
                  <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                    <Sparkles className="size-3 text-primary" />
                    New accounts get a guided setup and optional demo purchases.
                  </p>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="p-7 pb-5 text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Mail className="size-6" />
                </span>
                <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
                  Check your email
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  We've sent a 6-digit code to{" "}
                  <span className="font-medium text-foreground">{step.email}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit}>
                <div className="space-y-4 px-7">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                          const form = (e.target as HTMLElement).closest("form");
                          if (form) form.requestSubmit();
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && <p className="text-center text-xs text-destructive">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full gap-2 rounded-xl py-2.5"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        Verify code
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-6 border-t border-border/60 bg-muted/30 px-7 py-4 text-center text-xs text-muted-foreground">
                  Didn't receive a code?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-primary"
                    onClick={() => setStep("signIn")}
                  >
                    Try again
                  </Button>{" "}
                  ·{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-primary"
                    onClick={() => setStep("signIn")}
                  >
                    Use a different email
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-[11px] text-muted-foreground/70">
          Secured by{" "}
          <a
            href="https://freebuff.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
          >
            freebuff.com
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
