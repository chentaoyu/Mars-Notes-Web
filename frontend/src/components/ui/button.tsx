import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50",
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-br from-purple-600 to-purple-700",
          "text-white shadow-md shadow-purple-500/25",
          "hover:shadow-lg hover:shadow-purple-500/40 hover:scale-[1.02]",
          "active:scale-[0.98]",
          "dark:from-purple-500 dark:to-purple-600",
          "dark:shadow-purple-600/30 dark:hover:shadow-purple-600/50"
        ],
        destructive: [
          "bg-gradient-to-br from-red-600 to-red-700",
          "text-white shadow-md shadow-red-500/25",
          "hover:shadow-lg hover:shadow-red-500/40 hover:scale-[1.02]",
          "active:scale-[0.98]",
          "dark:from-red-500 dark:to-red-600",
          "dark:shadow-red-600/30 dark:hover:shadow-red-600/50"
        ],
        outline: [
          "border-2 border-purple-300 bg-white/50 text-purple-700",
          "backdrop-blur-sm shadow-sm",
          "hover:bg-purple-50 hover:border-purple-400 hover:shadow-md",
          "active:bg-purple-100",
          "dark:border-purple-500 dark:bg-slate-800/50 dark:text-purple-300",
          "dark:hover:bg-purple-950/30 dark:hover:border-purple-400"
        ],
        secondary: [
          "bg-gradient-to-br from-purple-50 to-purple-100",
          "text-purple-800 shadow-sm",
          "hover:from-purple-100 hover:to-purple-200 hover:shadow-md",
          "active:from-purple-200 active:to-purple-300",
          "dark:from-purple-950/50 dark:to-purple-900/50",
          "dark:text-purple-200 dark:hover:from-purple-900/60 dark:hover:to-purple-800/60"
        ],
        ghost: [
          "text-purple-700 hover:bg-purple-100/80",
          "active:bg-purple-200/80",
          "dark:text-purple-300 dark:hover:bg-purple-950/50",
          "dark:active:bg-purple-900/50"
        ],
        link: [
          "text-purple-700 underline-offset-4 hover:underline",
          "dark:text-purple-400"
        ],
        success: [
          "bg-gradient-to-br from-green-600 to-green-700",
          "text-white shadow-md shadow-green-500/25",
          "hover:shadow-lg hover:shadow-green-500/40 hover:scale-[1.02]",
          "active:scale-[0.98]",
          "dark:from-green-500 dark:to-green-600",
          "dark:shadow-green-600/30 dark:hover:shadow-green-600/50"
        ],
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 px-3.5 py-2 text-xs rounded-md",
        lg: "h-12 px-8 py-3 text-base rounded-xl",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

