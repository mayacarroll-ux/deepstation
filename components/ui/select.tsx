"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...selectProps }, ref) {
    return (
      <select
        className={cn(
          "flex h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        ref={ref}
        {...selectProps}
      >
        {children}
      </select>
    );
  }
);

