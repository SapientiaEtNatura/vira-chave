"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
  Textarea,
} from "@/components/ui";
import { FileUploadField } from "@/components/ui/FileUploadField";

interface ChallengeSubmitClientProps {
  challengeId: string;
  challengeTitle: string;
}

export function ChallengeSubmitClient({
  challengeId,
  challengeTitle,
}: ChallengeSubmitClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [isIncludedInShare, setIsIncludedInShare] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (reflection.trim().length < 10) {
      setError(
        "Descreva sua solução e aprendizado com pelo menos 10 caracteres.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (title.trim()) {
        formData.set("title", title.trim());
      }
      formData.set("reflection", reflection.trim());
      if (externalUrl.trim()) {
        formData.set("externalUrl", externalUrl.trim());
      }
      formData.set("isIncludedInShare", isIncludedInShare ? "true" : "false");
      if (file) {
        formData.set("file", file);
      }

      const response = await fetch(`/api/challenges/${challengeId}/submit`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        project?: { title?: string };
      };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível enviar sua entrega.");
        return;
      }

      setSuccessMessage(
        `Projeto "${data.project?.title ?? challengeTitle}" registrado no seu portfólio!`,
      );
      setTitle("");
      setReflection("");
      setExternalUrl("");
      setIsIncludedInShare(true);
      setFile(null);
      setFileInputKey((prev) => prev + 1);
      router.refresh();
    } catch {
      setError("Erro de conexão ao enviar sua entrega. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card as="div">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
            Registrar evidência do desafio
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-secondary)]">
            Conte o que você construiu ou testou. Sua entrega será salva como um
            projeto no seu portfólio.
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {successMessage && (
          <Alert variant="success">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-medium">{successMessage}</span>
              <Link
                href="/app/portfolio"
                className="font-semibold underline hover:opacity-80"
              >
                Ver no portfólio
              </Link>
            </div>
          </Alert>
        )}

        <FormField
          id="challenge-title"
          label="Título do projeto (opcional)"
        >
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={challengeTitle}
            maxLength={140}
          />
        </FormField>

        <FormField
          id="challenge-reflection"
          label="Descrição da solução e aprendizado"
          required
          hint={
            reflection.trim().length < 10
              ? `Faltam ${10 - reflection.trim().length} caracteres para atingir o mínimo.`
              : `${reflection.trim().length} caracteres registrados.`
          }
        >
          <Textarea
            required
            rows={4}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Explique o que você fez, quais ferramentas usou e o que aprendeu com este desafio..."
          />
        </FormField>

        <FormField
          id="challenge-url"
          label="Link externo (opcional)"
        >
          <Input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://github.com/... ou https://figma.com/..."
          />
        </FormField>

        <FileUploadField
          key={fileInputKey}
          id="challenge-file"
          label="Arquivo de evidência (opcional)"
          hint="PDF, PNG ou JPG até 5 MB."
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          file={file}
          onFileChange={setFile}
        />

        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/60 p-3.5 text-sm text-[var(--ink-secondary)]">
          <input
            type="checkbox"
            checked={isIncludedInShare}
            onChange={(e) => setIsIncludedInShare(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
          />
          <span>
            <span className="font-medium text-[var(--ink-primary)]">
              Incluir este projeto no meu link de portfólio compartilhado
            </span>
            <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">
              Se desmarcado, o projeto e seu arquivo ficam visíveis apenas para
              você.
            </span>
          </span>
        </label>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
          >
            {submitting ? "Enviando..." : "Enviar desafio"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
