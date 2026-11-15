"use client";

import { Alert, Button, Card } from "@/components/ui";

export interface RouteErrorViewProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function RouteErrorView({ error, reset }: RouteErrorViewProps) {
  void error;

  return (
    <div className="mx-auto max-w-xl py-8">
      <Card padding="lg" className="space-y-4">
        <Alert variant="danger" title="Não foi possível carregar esta página">
          Ocorreu um erro inesperado ao carregar os dados. Você pode tentar
          novamente agora.
        </Alert>

        <div className="flex justify-end">
          <Button type="button" variant="primary" onClick={() => reset()}>
            Tentar novamente
          </Button>
        </div>
      </Card>
    </div>
  );
}
