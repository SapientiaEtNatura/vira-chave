import * as React from "react";
import { cn } from "@/lib/cn";
import { Label } from "./Label";

export interface FormFieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children:
    | React.ReactElement<Partial<FormFieldControlProps>>
    | ((controlProps: FormFieldControlProps) => React.ReactNode);
}

export function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const controlProps: FormFieldControlProps = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
  };

  let renderedControl: React.ReactNode;
  if (typeof children === "function") {
    renderedControl = children(controlProps);
  } else if (React.isValidElement(children)) {
    const existingDescribedBy = children.props["aria-describedby"];
    const mergedDescribedBy =
      [existingDescribedBy, describedBy].filter(Boolean).join(" ") || undefined;
    renderedControl = React.cloneElement(children, {
      id: children.props.id ?? id,
      "aria-describedby": mergedDescribedBy,
      "aria-invalid": error ? true : children.props["aria-invalid"],
    });
  } else {
    renderedControl = children;
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {renderedControl}
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
