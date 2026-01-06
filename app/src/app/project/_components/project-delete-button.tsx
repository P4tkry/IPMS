"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiMoreVertical, FiTrash2, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DeleteProjectButtonProps = {
  projectId: string;
  projectName: string;
  variant?: "pill" | "icon";
};

export default function DeleteProjectButton({
  projectId,
  projectName,
  variant = "pill",
}: DeleteProjectButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/project/${projectId}`, { method: "DELETE" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(payload?.message || "Nie udało się usunąć projektu.");
          return;
        }
        setOpen(false);
        setConfirmValue("");
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Nie udało się usunąć projektu.";
        setError(message);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className={
          variant === "icon"
            ? "h-9 w-9 rounded-md border border-[#e4d6c6] bg-white text-[#5b5044] shadow-[0_10px_30px_-22px_rgba(40,30,20,0.55)] transition hover:border-[#d2c0ac] hover:shadow-[0_16px_40px_-26px_rgba(40,30,20,0.55)] hover:text-[#1f1b16]"
            : "h-9 rounded-full border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-800 transition hover:border-rose-300 hover:bg-rose-100"
        }
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {variant === "icon" ? (
          <FiMoreVertical className="h-4 w-4" aria-hidden="true" />
        ) : (
          <>
            <FiTrash2 className="mr-2 h-4 w-4" />
            Usuń
          </>
        )}
        <span className="sr-only">Usuń projekt</span>
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 md:p-6"
          onClick={() => {
            setOpen(false);
            setConfirmValue("");
            setError(null);
          }}
        >
          <div
            className="flex w-full max-w-xl flex-col gap-4 overflow-auto rounded-3xl border border-[#eadfd3] bg-white p-6 text-sm text-[#2a241f] shadow-[0_28px_70px_-38px_rgba(30,20,10,0.55)] md:p-7 max-h-[85vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b86865]">
                  Usuwanie projektu
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[#1f1b16]">{projectName}</h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#eadfd3] bg-white p-2 text-[#6f6255] transition hover:border-[#d8c9b6] hover:text-[#2a241f]"
                onClick={() => {
                  setOpen(false);
                  setConfirmValue("");
                  setError(null);
                }}
                aria-label="Zamknij"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm text-[#5b5044]">
              Aby potwierdzić, przepisz nazwę projektu. Operacja jest nieodwracalna.
            </p>
            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                Nazwa projektu
              </label>
              <Input
                value={confirmValue}
                onChange={(event) => setConfirmValue(event.target.value)}
                placeholder={projectName}
                aria-label="Potwierdź nazwę projektu"
                data-1p-ignore
              />
            </div>

            {error ? (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {error}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border border-[#eadfd3] bg-white px-4 text-xs font-semibold text-[#2a241f]"
                onClick={() => {
                  setOpen(false);
                  setConfirmValue("");
                  setError(null);
                }}
              >
                Anuluj
              </Button>
              <Button
                type="button"
                disabled={confirmValue.trim() !== projectName.trim() || isPending}
                className="h-10 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white shadow-[0_14px_30px_-18px_rgba(190,40,40,0.45)] transition hover:bg-rose-700 disabled:opacity-70"
                onClick={handleDelete}
              >
                {isPending ? "Usuwanie..." : "Usuń projekt"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
