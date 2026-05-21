"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = "text", ...inputProps }, ref) {
    return (
      <input
        className={cn(
          "flex h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        ref={ref}
        type={type}
        {...inputProps}
      />
    );
  }
);

