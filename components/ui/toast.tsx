"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type ToastTone = "default" | "success" | "warning" | "error";

type ToastProps = {
  actionLabel?: string;
  clearQueryParams?: string[];
  message: string;
  clearQueryParam?: string;
  detail?: string;
  dismissAfterMs?: number;
  tone?: ToastTone;
  onAction?: () => void;
};

const toastToneClassNames: Record<ToastTone, string> = {
  default: "border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)]",
  success: "border-[var(--accent)] bg-[var(--panel)] text-[var(--foreground)]",
  warning: "border-[var(--warning)] bg-[#241c09] text-[var(--foreground)]",
  error: "border-[#7f1d1d] bg-[#1c1212] text-[var(--foreground)]"
};

const toastDetailToneClassNames: Record<ToastTone, string> = {
  default: "text-[var(--muted)]",
  success: "text-[var(--muted)]",
  warning: "text-[#fde68a]",
  error: "text-[#fecaca]"
};

export function Toast({
  actionLabel,
  clearQueryParam,
  clearQueryParams,
  detail,
  dismissAfterMs,
  message,
  onAction,
  tone = "default"
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const queryParamsToClear = clearQueryParams ?? (clearQueryParam ? [clearQueryParam] : []);
  const autoDismissMs =
    dismissAfterMs ?? (tone === "error" ? 5000 : tone === "warning" ? 4200 : 3500);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsVisible(false), autoDismissMs);

    return () => window.clearTimeout(timeoutId);
  }, [autoDismissMs]);

  useEffect(() => {
    if (!isVisible) {
      const timeoutId = window.setTimeout(() => {
        if (queryParamsToClear.length > 0) {
          const nextUrl = new URL(window.location.href);
          queryParamsToClear.forEach((queryParam) => {
            nextUrl.searchParams.delete(queryParam);
          });
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
        "fixed bottom-4 right-4 z-[60] w-[min(100vw-2rem,24rem)] rounded-md border p-4 text-sm shadow-2xl transition-all duration-200",
        toastToneClassNames[tone],
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <p className="font-semibold">{message}</p>
          {detail ? <p className={cn("text-xs", toastDetailToneClassNames[tone])}>{detail}</p> : null}
        </div>
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
