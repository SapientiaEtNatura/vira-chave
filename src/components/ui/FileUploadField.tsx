"use client";

import * as React from "react";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Label } from "./Label";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export interface FileUploadFieldProps {
  id: string;
  label?: string;
  accept?: string;
  hint?: string;
  error?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function FileUploadField({
  id,
  label,
  accept,
  hint,
  error,
  file,
  onFileChange,
  disabled = false,
  required = false,
  className,
}: FileUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onFileChange(null);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      ) : null}

      <input
        ref={inputRef}
        id={id}
        type="file"
        tabIndex={-1}
        accept={accept}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className="sr-only"
        onChange={(event) => {
          const selected = event.target.files?.[0] ?? null;
          onFileChange(selected);
        }}
      />

      {!file ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-sm font-medium text-[var(--ink-secondary)] transition-colors",
            "hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]/30 hover:text-[var(--brand-primary)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/35",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--status-danger-solid)]",
          )}
        >
          <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Selecionar arquivo</span>
        </button>
      ) : (
        <div
          className={cn(
            "flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2",
            error && "border-[var(--status-danger-solid)]",
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText
              className="h-4 w-4 shrink-0 text-[var(--brand-primary)]"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--ink-primary)]">
                {file.name}
              </p>
              <p className="font-mono text-xs text-[var(--ink-muted)]">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={handleClear}
            aria-label={`Remover arquivo ${file.name}`}
            className={cn(
              "inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--ink-muted)] transition-colors",
              "hover:bg-[var(--status-danger-bg)] hover:text-[var(--status-danger-ink)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/35",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {hint ? (
        <p id={hintId} className="text-xs text-[var(--ink-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-[var(--status-danger-ink)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
