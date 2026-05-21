"use client";

import { cloneElement, createContext, useContext } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils/cn";

type SheetContextValue = {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
};

const SheetContext = createContext<SheetContextValue | null>(null);

export function Sheet({
  open,
  onOpenChange,
  children
}: {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  children: React.ReactNode;
}) {
  return <SheetContext.Provider value={{ open, onOpenChange }}>{children}</SheetContext.Provider>;
}

export function SheetTrigger({
  asChild = false,
  children
}: {
  asChild?: boolean;
  children: React.ReactElement<any>;
}) {
  const sheetContext = useContext(SheetContext);

  if (!sheetContext) {
    throw new Error("SheetTrigger must be used inside Sheet");
  }
  const resolvedSheetContext = sheetContext;

  function handleClick() {
    resolvedSheetContext.onOpenChange(true);
  }

  if (asChild) {
    return cloneElement(children, {
      onClick: (event: unknown) => {
        const mouseEvent = event as React.MouseEvent;
        children.props?.onClick?.(mouseEvent);
        if (!mouseEvent.defaultPrevented) {
          handleClick();
        }
      }
    } as Partial<any>);
  }

  return <button onClick={handleClick}>{children}</button>;
}

export function SheetContent({
  className,
  children,
  side = "right"
}: {
  className?: string;
  children: React.ReactNode;
  side?: "right" | "left";
}) {
  const sheetContext = useContext(SheetContext);

  if (!sheetContext) {
    throw new Error("SheetContent must be used inside Sheet");
  }

  const { open, onOpenChange } = sheetContext;

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div aria-hidden={!open} className="fixed inset-0 z-50">
      <button
        aria-label="Close sheet"
        className={cn(
          "absolute inset-0 bg-black/60 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => onOpenChange(false)}
        tabIndex={open ? 0 : -1}
        type="button"
      />
      <aside
        className={cn(
          "absolute top-0 flex h-dvh w-full max-w-none flex-col border-l border-[var(--border)] bg-[var(--panel)] shadow-2xl transition-transform duration-200 sm:w-[min(100vw,42rem)]",
          side === "right" ? "right-0" : "left-0 border-l-0 border-r",
          open
            ? "translate-x-0"
            : side === "right"
              ? "pointer-events-none translate-x-full"
              : "pointer-events-none -translate-x-full",
          className
        )}
      >
        {children}
      </aside>
    </div>,
    document.body
  );
}

export function SheetHeader({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("grid gap-1.5 p-4", className)}>{children}</div>;
}

export function SheetTitle({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <h2 className={cn("text-lg font-semibold tracking-tight", className)}>{children}</h2>;
}

export function SheetDescription({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-sm text-[var(--muted)]", className)}>{children}</p>;
}

export function SheetClose({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const sheetContext = useContext(SheetContext);

  if (!sheetContext) {
    throw new Error("SheetClose must be used inside Sheet");
  }

  return (
    <button className={className} onClick={() => sheetContext.onOpenChange(false)} type="button">
      {children}
    </button>
  );
}
