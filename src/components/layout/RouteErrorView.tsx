"use client";

import { useEffect } from "react";
import { Alert, Button, ButtonLink, Card } from "@/components/ui";

export interface RouteErrorViewProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function RouteErrorView({ error, reset }: RouteErrorViewProps) {
  useEffect(() => {
    console.error("[RouteErrorView]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-8">
      <Card padding="lg" className="space-y-4">
        <Alert variant="danger" title="Não foi possível carregar esta página">
          Ocorreu um erro inesperado ao carregar os dados. Tente novamente ou
          volte para a página inicial.
          {error.digest ? (
            <span className="mt-1.5 block font-mono text-xs opacity-80">
              Código de referência: {error.digest}
            </span>
          ) : null}
        </Alert>

        <div className="flex flex-wrap justify-end gap-2">
          <ButtonLink href="/" variant="outline">
            Voltar ao início
          </ButtonLink>
          <Button type="button" variant="primary" onClick={() => reset()}>
            Tentar novamente
          </Button>
        </div>
      </Card>
    </div>
  );
}
