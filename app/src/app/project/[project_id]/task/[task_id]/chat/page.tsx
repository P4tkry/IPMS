"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TaskMessage = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

const getInitials = (value?: string | null) => {
  if (!value) return "?";
  const parts = value.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

export default function TaskChatPage({
  params,
}: {
  params: Promise<{ project_id: string; task_id: string }>;
}) {
  const { project_id: projectId, task_id: taskId } = use(params);
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/project/${projectId}/tasks/${taskId}/messages`,
        );
        const payload = await response.json();
        if (!response.ok) {
          if (isActive) {
            setError(payload?.message || "Nie udało się pobrać wiadomości.");
            setMessages([]);
          }
          return;
        }
        if (isActive) {
          setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
        }
      } catch (err) {
        if (isActive) {
          const message =
            err instanceof Error ? err.message : "Nie udało się pobrać wiadomości.";
          setError(message);
          setMessages([]);
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [projectId, taskId]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/project/${projectId}/tasks/${taskId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.message || "Nie udało się wysłać wiadomości.");
        return;
      }
      if (payload?.message) {
        setMessages((prev) => [...prev, payload.message]);
        setDraft("");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nie udało się wysłać wiadomości.";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f4ef] via-white to-[#f8f4ef] px-6 py-12 text-[#2a241f]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
              Chat zadania
            </p>
            <h1 className="text-3xl font-semibold text-[#1f1b16]">
              Dyskusja w zadaniu
            </h1>
          </div>
          <Link
            href={`/project/${projectId}/task/${taskId}`}
            className="rounded-full border border-[#eadfd3] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2a241f] transition hover:border-[#2a241f]"
          >
            Wróć do zadania
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-3xl border border-[#eadfd3] bg-white/90 p-6 shadow-[0_24px_60px_-45px_rgba(60,40,20,0.35)]">
          {loading ? (
            <p className="text-sm text-[#6f6255]">Ładuję wiadomości...</p>
          ) : messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#eadfd3] bg-[#fcfaf7] px-4 py-3 text-sm text-[#6f6255]">
              Brak wiadomości w tym zadaniu.
            </div>
          ) : (
            <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
              {messages.map((message) => (
                <div key={message.id} className="rounded-xl border border-[#eadfd3] bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border border-[#eadfd3] bg-white">
                        {message.author.image ? (
                          <AvatarImage
                            src={message.author.image}
                            alt={message.author.name || message.author.email || "user"}
                          />
                        ) : null}
                        <AvatarFallback className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                          {getInitials(message.author.name || message.author.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold text-[#2a241f]">
                        {message.author.name || message.author.email || "Nieznany"}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#8a7762]">
                      {timeFormatter.format(new Date(message.createdAt))}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#2a241f]">{message.content}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
              Wiadomość
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                placeholder="Napisz wiadomość do zespołu..."
                className="mt-2 w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm text-[#2a241f] shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
              />
            </label>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || draft.trim().length === 0}
              className="h-10 rounded-full border border-[#2a241f] bg-[#2a241f] px-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#f6efe8] shadow-[0_10px_20px_-15px_rgba(20,15,10,0.6)] transition hover:-translate-y-[1px] hover:shadow-[0_12px_24px_-16px_rgba(20,15,10,0.6)] disabled:cursor-not-allowed disabled:bg-[#c3b5a5]"
            >
              {sending ? "Wysyłam..." : "Wyślij"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
