"use client";

import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";

type TaskCompletionPanelProps = {
  projectId: string;
  taskId: string;
  memberId: string;
  assignedMemberId?: string | null;
  canManageTasks: boolean;
  initialCompletionDescription?: string | null;
  initialCompletionLinks?: string[] | null;
  initialCompletionFiles?: string[] | null;
};

export default function TaskCompletionPanel({
  projectId,
  taskId,
  memberId,
  assignedMemberId,
  canManageTasks,
  initialCompletionDescription,
  initialCompletionLinks,
  initialCompletionFiles,
}: TaskCompletionPanelProps) {
  const [completionDescription, setCompletionDescription] = useState(
    initialCompletionDescription ?? "",
  );
  const [completionLinks, setCompletionLinks] = useState<string[]>(
    initialCompletionLinks ?? [],
  );
  const [completionFiles, setCompletionFiles] = useState<string[]>(
    initialCompletionFiles ?? [],
  );
  const [linkDraft, setLinkDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAssigned = assignedMemberId === memberId;
  const canEditCompletion = isAssigned || canManageTasks;
  const messageClass = useMemo(() => {
    if (error) return "border-rose-200 bg-rose-50 text-rose-700";
    if (success) return "border-emerald-200 bg-emerald-50 text-emerald-700";
    return "";
  }, [error, success]);

  const updateTask = async (payload: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/project/${projectId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, ...payload }),
      });
      const data = (await response.json().catch(() => null)) as
        | { message?: string; task?: { status?: string; completionDescription?: string | null; completionLinks?: string[] | null; completionFiles?: string[] | null } }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Nie udalo sie zapisac zmian.");
      }

      if (data?.task?.completionDescription !== undefined) {
        setCompletionDescription(data.task.completionDescription ?? "");
      }
      if (Array.isArray(data?.task?.completionLinks)) {
        setCompletionLinks(data.task.completionLinks ?? []);
      }
      if (Array.isArray(data?.task?.completionFiles)) {
        setCompletionFiles(data.task.completionFiles ?? []);
      }

      setSuccess("Zapisano zmiany.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udalo sie zapisac zmian.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = () => {
    const next = linkDraft.trim();
    if (!next) return;
    if (completionLinks.includes(next)) {
      setLinkDraft("");
      return;
    }
    setCompletionLinks((prev) => [...prev, next]);
    setLinkDraft("");
  };

  const handleRemoveLink = (link: string) => {
    setCompletionLinks((prev) => prev.filter((item) => item !== link));
  };

  const handleRemoveFile = (fileUrl: string) => {
    setCompletionFiles((prev) => prev.filter((item) => item !== fileUrl));
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `/api/project/${projectId}/tasks/${taskId}/files`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = (await response.json().catch(() => null)) as
        | { message?: string; url?: string }
        | null;
      if (!response.ok) {
        throw new Error(data?.message || "Nie udalo sie dodac pliku.");
      }
      if (!data?.url) {
        throw new Error("Brak linku do pliku.");
      }
      setCompletionFiles((prev) => [...prev, data.url!]);
      setSuccess("Plik dodany.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udalo sie dodac pliku.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSaveCompletion = () =>
    updateTask({
      completionDescription: completionDescription.trim() || null,
      completionLinks,
      completionFiles,
    });

  return (
    <div className="space-y-4 rounded-2xl border border-[#eadfd3] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
          Wykonanie zadania
        </p>
        {saving ? (
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b08a5c]">
            Zapisywanie...
          </span>
        ) : null}
      </div>

      {error || success ? (
        <div className={`rounded-2xl border px-4 py-3 text-xs ${messageClass}`}>
          {error || success}
        </div>
      ) : null}

      {canEditCompletion ? (
        <div className="space-y-3">
          <textarea
            rows={6}
            value={completionDescription}
            onChange={(event) => setCompletionDescription(event.target.value)}
            className="min-h-[150px] w-full rounded-xl border border-[#eadfd3] bg-[#fbf7f1] px-4 py-3 text-sm text-[#2a241f] outline-none ring-0 focus:border-[#cbb8a3] focus:bg-white"
            placeholder="Podsumuj wykonane dzialania..."
          />
          <div className="flex flex-wrap gap-2">
            <input
              type="url"
              value={linkDraft}
              onChange={(event) => setLinkDraft(event.target.value)}
              placeholder="https://..."
              className="min-w-[220px] flex-1 rounded-xl border border-[#eadfd3] bg-[#fbf7f1] px-3 py-2 text-sm text-[#2a241f] outline-none ring-0 focus:border-[#cbb8a3] focus:bg-white"
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="rounded-full border border-[#2a241f] bg-[#2a241f] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f6efe8] transition hover:-translate-y-[1px] hover:shadow-[0_12px_26px_-20px_rgba(40,30,20,0.55)]"
            >
              Dodaj link
            </button>
          </div>
          {completionLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {completionLinks.map((link) => (
                <div
                  key={link}
                  className="flex max-w-full items-center gap-2 rounded-full border border-[#eadfd3] bg-[#fbf7f1] px-3 py-2 text-xs"
                >
                  <span className="truncate text-[#2a241f]">{link}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(link)}
                    className="rounded-full border border-[#eadfd3] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6255]"
                  >
                    Usun
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-[#2a241f] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2a241f] transition hover:-translate-y-[1px] hover:shadow-[0_12px_26px_-20px_rgba(40,30,20,0.45)]">
              Dodaj plik
              <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
            {uploading ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b08a5c]">
                Upload...
              </span>
            ) : null}
          </div>
          {completionFiles.length > 0 ? (
            <div className="space-y-2">
              {completionFiles.map((fileUrl) => (
                <div
                  key={fileUrl}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#eadfd3] bg-[#fbf7f1] px-3 py-2 text-xs"
                >
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-semibold text-[#2a241f] underline decoration-[#e2d6c9] decoration-2 underline-offset-4"
                  >
                    {fileUrl}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(fileUrl)}
                    className="rounded-full border border-[#eadfd3] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6255]"
                  >
                    Usun
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#6f6255]">
              Zapisz wykonanie, aby udostepnic je do weryfikacji.
            </p>
            <button
              type="button"
              onClick={handleSaveCompletion}
              disabled={saving}
              className="rounded-full border border-[#2a241f] bg-[#2a241f] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f6efe8] transition hover:-translate-y-[1px] hover:shadow-[0_12px_26px_-20px_rgba(40,30,20,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Zapisz wykonanie
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-[#eadfd3] border-l-4 border-l-[#9a7a58] bg-[#f7f3ee] p-4 text-sm text-[#2a241f] shadow-[0_20px_40px_-35px_rgba(40,30,20,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
            Wykonanie
          </p>
          <p>{completionDescription.trim() || "Brak opisu."}</p>
          {completionLinks.length > 0 ? (
            <div className="space-y-1">
              {completionLinks.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-xs font-semibold text-[#2a241f] underline decoration-[#e2d6c9] decoration-2 underline-offset-4"
                >
                  {link}
                </a>
              ))}
            </div>
          ) : null}
          {completionFiles.length > 0 ? (
            <div className="space-y-1">
              {completionFiles.map((fileUrl) => (
                <a
                  key={fileUrl}
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-xs font-semibold text-[#2a241f] underline decoration-[#e2d6c9] decoration-2 underline-offset-4"
                >
                  {fileUrl}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
