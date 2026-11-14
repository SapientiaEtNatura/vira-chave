"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, FileUp, Loader2, Send } from "lucide-react";

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
        setError(data.error ?? "Não foi possível enviar sua submissão.");
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
      setError("Erro de conexão ao enviar sua submissão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Registrar evidência do desafio
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Conte o que você construiu ou testou. Sua entrega será salva como um
          projeto no seu portfólio.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <span className="inline-flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            {successMessage}
          </span>
          <Link
            href="/app/portfolio"
            className="font-semibold text-emerald-800 underline hover:text-emerald-950"
          >
            Ver no portfólio
          </Link>
        </div>
      )}

      <div>
        <label
          htmlFor="challenge-title"
          className="block text-sm font-medium text-slate-800"
        >
          Título do projeto <span className="text-slate-400">(opcional)</span>
        </label>
        <input
          id="challenge-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={challengeTitle}
          maxLength={140}
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div>
        <label
          htmlFor="challenge-reflection"
          className="block text-sm font-medium text-slate-800"
        >
          Descrição da solução e aprendizado{" "}
          <span className="text-rose-600">*</span>
        </label>
        <textarea
          id="challenge-reflection"
          required
          rows={4}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Explique o que você fez, quais ferramentas usou e o que aprendeu com este desafio..."
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <p className="mt-1 text-xs text-slate-500">
          Mínimo de 10 caracteres ({reflection.trim().length}/10).
        </p>
      </div>

      <div>
        <label
          htmlFor="challenge-url"
          className="block text-sm font-medium text-slate-800"
        >
          Link externo <span className="text-slate-400">(opcional)</span>
        </label>
        <input
          id="challenge-url"
          type="url"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          placeholder="https://github.com/... ou https://figma.com/..."
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div>
        <label
          htmlFor="challenge-file"
          className="block text-sm font-medium text-slate-800"
        >
          Arquivo de evidência{" "}
          <span className="text-slate-400">(opcional · PDF, PNG ou JPG até 5 MB)</span>
        </label>
        <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
          <FileUp className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
          <input
            key={fileInputKey}
            id="challenge-file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={isIncludedInShare}
          onChange={(e) => setIsIncludedInShare(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span>
          <span className="font-medium text-slate-900">
            Incluir este projeto no meu link de portfólio compartilhado
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Se desmarcado, o projeto e seu arquivo ficam visíveis apenas para você.
          </span>
        </span>
      </label>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>Enviar desafio</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
