import { useId } from "react";
import { cn } from "@/lib/utils";

export function NexusMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b9bff" />
          <stop offset="0.55" stopColor="#5f7bff" />
          <stop offset="1" stopColor="#3f5fff" />
        </linearGradient>
      </defs>
      <rect x="1.2" y="1.2" width="29.6" height="29.6" rx="8.5" fill={`url(#${id})`} />
      <rect
        x="1.2"
        y="1.2"
        width="29.6"
        height="29.6"
        rx="8.5"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1"
      />
      <path
        d="M16 5.6 L25.4 10.8 V21.2 L16 26.4 L6.6 21.2 V10.8 Z"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.4"
        fill="rgba(255,255,255,0.1)"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="5.6" r="2" fill="white" />
      <circle cx="25.4" cy="21.2" r="2" fill="white" />
      <circle cx="6.6" cy="21.2" r="2" fill="white" />
      <circle cx="16" cy="16" r="1.7" fill="white" />
    </svg>
  );
}
