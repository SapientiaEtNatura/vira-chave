"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ConfirmDialog } from "./ConfirmDialog";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  isDirty?: boolean;
  closeOnBackdropClick?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  isDirty = false,
  closeOnBackdropClick = true,
  footer,
  children,
  className,
}: DrawerProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const onCloseRef = React.useRef(onClose);
  const isDirtyRef = React.useRef(isDirty);
  const [mounted, setMounted] = React.useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = React.useState(false);

  const effectiveConfirmOpen = open && confirmDiscardOpen;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  React.useEffect(() => {
    if (!open) {
      setConfirmDiscardOpen(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open || !mounted) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    return () => {
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [open, mounted]);

  React.useEffect(() => {
    if (!open || !mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, mounted]);

  React.useEffect(() => {
    if (!open || !mounted || effectiveConfirmOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isDirtyRef.current) {
          setConfirmDiscardOpen(true);
        } else {
          onCloseRef.current();
        }
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) {
        return;
      }

      const focusables = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusables.length === 0) {
        event.preventDefault();
        drawerRef.current.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !drawerRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !drawerRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, mounted, effectiveConfirmOpen]);

  const handleRequestClose = React.useCallback(() => {
    if (isDirtyRef.current) {
      setConfirmDiscardOpen(true);
    } else {
      onCloseRef.current();
    }
  }, []);

  if (!open || !mounted) {
    return null;
  }

  return (
    <>
      {createPortal(
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="presentation"
        >
          <div
            aria-hidden="true"
            className="animate-drawer-backdrop fixed inset-0 bg-[#101828]/50 backdrop-blur-[1px]"
            onClick={() => {
              if (closeOnBackdropClick) {
                handleRequestClose();
              }
            }}
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitle ? descriptionId : undefined}
            className={cn(
              "animate-drawer-right relative z-10 flex h-full w-full max-w-xl flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xl focus:outline-none",
              className,
            )}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-6 py-4">
              <div className="min-w-0 space-y-1">
                <h2
                  id={titleId}
                  className="font-display text-lg font-bold text-[var(--ink-primary)]"
                >
                  {title}
                </h2>
                {subtitle ? (
                  <p
                    id={descriptionId}
                    className="text-sm leading-relaxed text-[var(--ink-secondary)]"
                  >
                    {subtitle}
                  </p>
                ) : null}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Fechar painel"
                onClick={handleRequestClose}
                className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--ink-muted)] transition-colors hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--ink-primary)]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {footer ? (
              <footer className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4">
                {footer}
              </footer>
            ) : null}
          </div>
        </div>,
        document.body,
      )}

      <ConfirmDialog
        open={effectiveConfirmOpen}
        title="Descartar alterações?"
        description="Você tem alterações não salvas. Se sair agora, elas serão perdidas."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        variant="danger"
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          onCloseRef.current();
        }}
        onCancel={() => setConfirmDiscardOpen(false)}
      />
    </>
  );
}
