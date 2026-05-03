"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type ReportRegenerateButtonProps = {
  reportId: string;
  label?: string;
};

export function ReportRegenerateButton({ reportId, label = "Сгенерировать заново" }: ReportRegenerateButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/reports/${reportId}/ai-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

      if (!response.ok) {
        const message = payload?.error ?? payload?.message ?? "Сейчас невозможно заново сгенерировать AI-сводку.";
        setError(message);
        toast({
          title: "Не удалось заново сгенерировать AI-сводку",
          description: message,
          tone: "error",
        });
        return;
      }

      toast({
        title: "AI-сводка обновлена",
        description: "Сводка отчета успешно сгенерирована заново.",
        tone: "success",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch {
      const message = "Сейчас невозможно связаться с endpoint AI-сводки.";
      setError(message);
      toast({
        title: "AI-сводка недоступна",
        description: message,
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting || isPending}
        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting || isPending ? "Генерация..." : label}
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
