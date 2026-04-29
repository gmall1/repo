import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-[var(--accent-fg)] hover:brightness-110 active:brightness-95",
        secondary:
          "bg-[var(--bg-elev)] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--bg-elev-2)] hover:border-[var(--border-strong)]",
        ghost: "text-[var(--fg)] hover:bg-[var(--bg-elev)]",
        danger:
          "bg-[var(--danger)] text-white hover:brightness-110",
        success:
          "bg-[var(--success)] text-black hover:brightness-110",
        outline:
          "border border-[var(--border-strong)] text-[var(--fg)] hover:bg-[var(--bg-elev)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { button as buttonVariants };
