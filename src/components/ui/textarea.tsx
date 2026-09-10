import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  labelExtra?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      labelExtra,
      containerClassName,
      labelClassName,
      errorClassName,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {(label || labelExtra) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={id}
                className={cn("text-sm font-medium", labelClassName)}
              >
                {label}
              </label>
            )}
            {labelExtra}
          </div>
        )}
        <textarea
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "rounded-md border border-black/[.08] px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-white/[.145] dark:focus:border-zinc-50",
            className,
          )}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className={cn("text-sm text-red-600", errorClassName)}>
            {error}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
