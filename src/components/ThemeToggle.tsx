import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const DARK_BG = "#0c0e17";
const LIGHT_BG = "#f4f5fa";

/**
 * Sun/moon theme toggle. Persists the choice via next-themes (localStorage,
 * key "theme") and defaults to the system preference until the user picks one.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === "dark";

  useEffect(() => setMounted(true), []);

  // Keep the browser chrome (mobile URL bar, etc.) in sync with the theme.
  useEffect(() => {
    if (!mounted) return;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? DARK_BG : LIGHT_BG);
  }, [mounted, isDark]);

  const toggleTheme = () => {
    const root = document.documentElement;
    // Animate colors while the class flips, then remove the transition hook.
    root.classList.add("theme-anim");
    setTheme(isDark ? "light" : "dark");
    window.setTimeout(() => root.classList.remove("theme-anim"), 350);
  };

  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <AnimatePresence mode="wait" initial={false}>
        {mounted && (
          <motion.span
            key={isDark ? "sun" : "moon"}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
