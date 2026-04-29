import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "open" | "closed" | "merged" | "private";
}) {
  const variants: Record<string, string> = {
    default:
      "bg-[var(--bg-elev-2)] text-[var(--fg-muted)] border border-[var(--border)]",
    open: "bg-[rgba(63,185,80,0.15)] text-[var(--success)] border border-[rgba(63,185,80,0.35)]",
    closed:
      "bg-[rgba(248,81,73,0.15)] text-[var(--danger)] border border-[rgba(248,81,73,0.35)]",
    merged:
      "bg-[rgba(167,139,250,0.18)] text-[var(--accent-2)] border border-[rgba(167,139,250,0.35)]",
    private:
      "bg-[rgba(210,153,34,0.12)] text-[var(--warning)] border border-[rgba(210,153,34,0.3)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
