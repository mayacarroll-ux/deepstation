"use client";

import { createContext, useContext } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils/cn";

type DialogContextValue = {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children
}: {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  children: React.ReactNode;
}) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

export function DialogContent({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const dialogContext = useContext(DialogContext);

  if (!dialogContext) {
    throw new Error("DialogContent must be used inside Dialog");
  }

  const { open, onOpenChange } = dialogContext;

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div aria-hidden={!open} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close dialog"
        className={cn(
          "absolute inset-0 bg-black/60 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => onOpenChange(false)}
        tabIndex={open ? 0 : -1}
        type="button"
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-md border border-[var(--border)] bg-[var(--panel)] shadow-2xl",
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("grid gap-1.5 p-5", className)}>{children}</div>;
}

export function DialogTitle({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <h2 className={cn("text-lg font-semibold tracking-tight", className)}>{children}</h2>;
}

export function DialogDescription({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-sm text-[var(--muted)]", className)}>{children}</p>;
}

