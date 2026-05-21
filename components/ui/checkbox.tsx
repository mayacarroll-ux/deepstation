"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

export const Checkbox = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Checkbox({ className, type = "checkbox", ...checkboxProps }, ref) {
  return (
    <input
      className={cn(
        "h-4 w-4 rounded border border-[var(--border)] bg-[var(--surface)] accent-[var(--accent)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30",
        className
      )}
      ref={ref}
      type={type}
      {...checkboxProps}
    />
  );
});

