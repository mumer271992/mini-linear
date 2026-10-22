import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isProcessing?: boolean;
}

export function Button({
  isProcessing = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isProcessing}
      className={cn(
        // inline-flex + justify-center: Tailwind's preflight makes <svg> display:block,
        // which ignores text-align and pins the spinner left.
        "inline-flex cursor-pointer items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[#ccc]",
        className,
      )}
      {...props}
    >
      {/* h-5 matches text-sm's line height, so the button doesn't shrink while processing. */}
      {isProcessing ? (
        <span className="flex h-5 items-center">
          <Spinner />
        </span>
      ) : (
        children
      )}
    </button>
  );
}
