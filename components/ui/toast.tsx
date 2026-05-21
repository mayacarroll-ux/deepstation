"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type ToastProps = {
  actionLabel?: string;
  message: string;
  clearQueryParam?: string;
  onAction?: () => void;
};

export function Toast({ actionLabel, clearQueryParam, message, onAction }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsVisible(false), 3500);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      const timeoutId = window.setTimeout(() => {
        if (clearQueryParam) {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.delete(clearQueryParam);
          window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
        }
      }, 200);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [clearQueryParam, isVisible]);

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[60] w-[min(100vw-2rem,24rem)] rounded-md border border-[var(--border)] bg-[var(--panel)] p-4 text-sm text-[var(--foreground)] shadow-2xl transition-all duration-200",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">{message}</p>
        <Button className="h-8 px-3" onClick={() => setIsVisible(false)} variant="secondary">
          Close
        </Button>
      </div>
      {actionLabel && onAction ? (
        <Button className="mt-3 h-9 px-3" onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
