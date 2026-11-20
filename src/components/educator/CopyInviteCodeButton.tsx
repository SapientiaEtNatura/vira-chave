"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui";

export function CopyInviteCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setCopied(false);
        timerRef.current = null;
      }, 2000);
    } catch {
      // Clipboard indisponível em contextos sem permissão
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        leftIcon={
          copied ? (
            <Check className="h-3.5 w-3.5 text-[var(--status-success-ink)]" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )
        }
      >
        {copied ? "Código copiado" : `Copiar ${code}`}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `Código ${code} copiado para a área de transferência.` : ""}
      </span>
    </>
  );
}
