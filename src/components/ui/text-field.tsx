import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  labelExtra?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
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
        <input
          id={id}
          ref={ref}
          className={cn(
            "rounded-md border border-black/[.08] px-3 py-2 text-sm outline-none focus:border-zinc-950 dark:border-white/[.145] dark:focus:border-zinc-50",
            className,
          )}
          {...props}
        />
        {error && (
          <p className={cn("text-sm text-red-600", errorClassName)}>
            {error}
          </p>
        )}
      </div>
    );
  },
);
TextField.displayName = "TextField";
