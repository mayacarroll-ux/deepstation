"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...textareaProps }, ref) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      ref={ref}
      {...textareaProps}
    />
  );
});

