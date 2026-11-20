"use client";

import * as React from "react";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Label } from "./Label";

const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const rules = accept
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return rules.some((rule) => {
    if (rule.startsWith(".")) {
      return fileName.endsWith(rule);
    }
    if (rule.endsWith("/*")) {
      return fileType.startsWith(rule.slice(0, -1));
    }
    return fileType === rule;
  });
}

export interface FileUploadFieldProps {
  id: string;
  label?: string;
  accept?: string;
  hint?: string;
  error?: string;
  maxSizeBytes?: number;
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
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  file,
  onFileChange,
  disabled = false,
  required = false,
  className,
}: FileUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const effectiveError = error ?? localError ?? undefined;
  const labelId = label ? `${id}-label` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = effectiveError ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const handleSelectFile = (selected: File | null) => {
    setLocalError(null);
    if (!selected) {
      onFileChange(null);
      return;
    }

    if (selected.size > maxSizeBytes) {
      setLocalError(
        `O arquivo ultrapassa o limite de ${formatFileSize(maxSizeBytes)}. Escolha um arquivo menor.`,
      );
      if (inputRef.current) inputRef.current.value = "";
      onFileChange(null);
      return;
    }

    if (!matchesAccept(selected, accept)) {
      setLocalError(
        "Formato de arquivo não aceito. Verifique os formatos indicados abaixo.",
      );
      if (inputRef.current) inputRef.current.value = "";
      onFileChange(null);
      return;
    }

    onFileChange(selected);
  };

  const handleClear = () => {
    setLocalError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onFileChange(null);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <Label id={labelId} htmlFor={`${id}-trigger`} required={required}>
          {label}
        </Label>
      ) : null}

      <input
        ref={inputRef}
        id={id}
        type="file"
        tabIndex={-1}
        accept={accept}
        required={required}
        disabled={disabled}
        aria-invalid={effectiveError ? true : undefined}
        aria-required={required || undefined}
        className="sr-only"
        onChange={(event) => {
          handleSelectFile(event.target.files?.[0] ?? null);
        }}
      />

      {!file ? (
        <button
          id={`${id}-trigger`}
          type="button"
          disabled={disabled}
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            if (disabled) return;
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            if (disabled) return;
            event.preventDefault();
            setIsDragging(false);
            handleSelectFile(event.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-sm font-medium text-[var(--ink-secondary)] transition-colors",
            "hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]/30 hover:text-[var(--brand-primary)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/35",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isDragging &&
              "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]/45 text-[var(--brand-primary)]",
            effectiveError && "border-[var(--status-danger-solid)]",
          )}
        >
          <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Selecionar ou arrastar arquivo</span>
        </button>
      ) : (
        <div
          className={cn(
            "flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2",
            effectiveError && "border-[var(--status-danger-solid)]",
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
      {effectiveError ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-[var(--status-danger-ink)]"
        >
          {effectiveError}
        </p>
      ) : null}
    </div>
  );
}
