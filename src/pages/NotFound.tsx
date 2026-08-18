import { motion } from "framer-motion";
import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { NexusMark } from "@/components/NexusMark";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="nexus-glow flex min-h-screen flex-col items-center justify-center px-4 text-center"
    >
      <NexusMark size={52} />
      <h1 className="mt-6 font-display text-6xl font-bold tracking-tight">404</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        This page isn't part of your Nexus OS.
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground/70">
        <Compass className="size-4" />
        The link may be broken, or the page may have been moved.
      </p>
      <Link to="/" className="mt-8">
        <Button className="gap-2 rounded-xl">
          <ArrowLeft className="size-4" />
          Back to Nexus OS
        </Button>
      </Link>
    </motion.div>
  );
}
