"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProjectContext } from "../../_components/project-context";
import { io, type Socket } from "socket.io-client";

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  taskId?: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

type ChatListItem = {
  id: string;
  title: string;
  issueId: string;
  category?: { code: string; name: string; color: string } | null;
  lastMessage: ChatMessage | null;
};

const getInitials = (value?: string | null) => {
  if (!value) return "?";
  const parts = value.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

const trimMessage = (value: string, max = 90) => {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
};

export default function ProjectChatView({ selectedTaskId }: { selectedTaskId?: string | null }) {
  const project = useProjectContext();
  const pathname = usePathname();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const canMessageTasks = project?.canMessageTasks === true;

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
    const loadMe = async () => {
      try {
        const response = await fetch("/api/me");
        const payload = await response.json();
        if (!response.ok) return;
        if (isActive) {
          setCurrentUserId(payload?.user?.id ?? null);
        }
      } catch {
        if (isActive) setCurrentUserId(null);
      }
    };
    loadMe();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!project?.id || !canMessageTasks) return;
    let isActive = true;
    const load = async () => {
      setChatsLoading(true);
      setChatsError(null);
      try {
        const response = await fetch(`/api/project/${project.id}/task-chats`);
        const payload = await response.json();
        if (!response.ok) {
          if (isActive) {
            setChatsError(payload?.message || "Nie udalo sie pobrac rozmow.");
            setChats([]);
          }
          return;
        }
        if (isActive) {
          setChats(Array.isArray(payload?.chats) ? payload.chats : []);
        }
      } catch (err) {
        if (isActive) {
          const message =
            err instanceof Error ? err.message : "Nie udalo sie pobrac rozmow.";
          setChatsError(message);
          setChats([]);
        }
      } finally {
        if (isActive) setChatsLoading(false);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [project?.id, canMessageTasks]);

  const addMessage = useCallback(
    (message: ChatMessage) => {
      if (message.taskId && selectedTaskId && message.taskId !== selectedTaskId) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
    },
    [selectedTaskId],
  );

  useEffect(() => {
    if (!canMessageTasks) return;
    const socket = io({
      path: "/api/socket",
    });
    socketRef.current = socket;
    socket.on("task:message", (message: ChatMessage) => {
      if (message.taskId) {
        setChats((prev) => {
          const index = prev.findIndex((chat) => chat.id === message.taskId);
          if (index === -1) return prev;
          const updated = { ...prev[index], lastMessage: message };
          return [updated, ...prev.filter((chat) => chat.id !== message.taskId)];
        });
        if (!selectedTaskId || message.taskId !== selectedTaskId) {
          setUnreadCounts((prev) => ({
            ...prev,
            [message.taskId as string]: (prev[message.taskId as string] ?? 0) + 1,
          }));
        }
      }
      addMessage(message);
    });
    return () => {
      socket.off("task:message");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [addMessage, canMessageTasks, selectedTaskId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedTaskId) return;
    socket.emit("join-task", selectedTaskId);
    return () => {
      socket.emit("leave-task", selectedTaskId);
    };
  }, [selectedTaskId]);

  useEffect(() => {
    if (!project?.id || !selectedTaskId || !canMessageTasks) {
      setMessages([]);
      return;
    }
    let isActive = true;
    const load = async () => {
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const response = await fetch(
          `/api/project/${project.id}/tasks/${selectedTaskId}/messages`,
        );
        const payload = await response.json();
        if (!response.ok) {
          if (isActive) {
            setMessagesError(payload?.message || "Nie udalo sie pobrac wiadomosci.");
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
            err instanceof Error ? err.message : "Nie udalo sie pobrac wiadomosci.";
          setMessagesError(message);
          setMessages([]);
        }
      } finally {
        if (isActive) setMessagesLoading(false);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [project?.id, selectedTaskId, canMessageTasks]);

  useEffect(() => {
    if (!selectedTaskId) return;
    setUnreadCounts((prev) => {
      if (!prev[selectedTaskId]) return prev;
      const next = { ...prev };
      delete next[selectedTaskId];
      return next;
    });
  }, [selectedTaskId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    if (!selectedTaskId) return;
    scrollToBottom();
  }, [messages, scrollToBottom, selectedTaskId]);

  const activeChat = chats.find((chat) => chat.id === selectedTaskId) ?? null;
  const hasSelection = Boolean(selectedTaskId);

  const handleSend = async () => {
    if (!project?.id || !selectedTaskId || !canMessageTasks) return;
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    setMessagesError(null);
    try {
      const response = await fetch(
        `/api/project/${project.id}/tasks/${selectedTaskId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        setMessagesError(payload?.message || "Nie udalo sie wyslac wiadomosci.");
        return;
      }
      if (payload?.message) {
        addMessage(payload.message);
        setDraft("");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nie udalo sie wyslac wiadomosci.";
      setMessagesError(message);
    } finally {
      setSending(false);
    }
  };

  if (!canMessageTasks) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
        Brak uprawnien do rozmow w zadaniach.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e7dbce] bg-white/90 shadow-[0_30px_80px_-45px_rgba(60,40,20,0.35)] ring-1 ring-[#efe5d8]">
      <div className="flex h-[calc(100vh-260px)] min-h-[540px] flex-col lg:flex-row">
        <aside className="w-full border-b border-[#eadfd3] bg-[#fbf7f2] p-4 lg:w-[320px] lg:border-b-0 lg:border-r lg:rounded-l-2xl">
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
              Task chats
            </p>
            <p className="text-sm font-semibold text-[#1f1b16]">Twoje rozmowy</p>
          </div>
          {chatsLoading ? (
            <p className="text-sm text-[#6f6255]">Laduje rozmowy...</p>
          ) : chatsError ? (
            <p className="text-sm text-rose-700">{chatsError}</p>
          ) : chats.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6f6255]">
              Brak rozmow z Twoimi wiadomosciami.
            </div>
          ) : (
            <div className="max-h-[calc(100vh-360px)] space-y-2 overflow-y-auto pr-1">
              {chats.map((chat) => {
                const isActive =
                  pathname === `/project/${project.id}/chat/${chat.id}` ||
                  pathname.startsWith(`/project/${project.id}/chat/${chat.id}/`);
                const accent = chat.category?.color || "#eadfd3";
                const unreadCount = unreadCounts[chat.id] ?? 0;
                return (
                  <Link
                    key={chat.id}
                    href={`/project/${project.id}/chat/${chat.id}`}
                    className={`block rounded-xl border px-3 py-2 transition ${
                      isActive
                        ? "border-[#d8c8b6] bg-gradient-to-r from-[#fff1df] via-white to-white shadow-[0_12px_28px_-18px_rgba(20,15,10,0.55)] ring-1 ring-[#f6dcc7]"
                        : "border-transparent bg-transparent hover:border-[#eadfd3] hover:bg-white"
                    }`}
                    style={{
                      borderLeftColor: accent,
                      borderLeftWidth: isActive ? 6 : 3,
                      boxShadow: isActive ? `inset 0 0 0 1px ${accent}26` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                        style={{
                          backgroundColor: `${accent}1a`,
                          color: accent,
                        }}
                      >
                        {chat.issueId}
                      </span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 ? (
                          <span className="rounded-full bg-[#2a241f] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f6efe8]">
                            {unreadCount} nowe
                          </span>
                        ) : null}
                        {chat.lastMessage ? (
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#8a7762]">
                            {timeFormatter.format(new Date(chat.lastMessage.createdAt))}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#1f1b16]">{chat.title}</p>
                    <p className="mt-1 text-xs text-[#6f6255]">
                      {chat.lastMessage
                        ? trimMessage(chat.lastMessage.content)
                        : "Brak wiadomosci"}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </aside>

        <section className="flex flex-1 flex-col bg-[#fffdf9]">
          <div className="border-b border-[#eadfd3] px-6 py-4">
            {activeChat ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#eadfd3] bg-[#fbf7f1] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6255]">
                  {activeChat.issueId}
                </span>
                <span className="text-base font-semibold text-[#1f1b16]">
                  {activeChat.title}
                </span>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
                  Wybierz rozmowe
                </p>
                <p className="text-sm text-[#6f6255]">
                  Kliknij po lewej, aby otworzyc konwersacje.
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {!hasSelection ? (
              <div className="flex h-full items-center justify-center text-sm text-[#8a7762]">
                Brak aktywnego czatu.
              </div>
            ) : messagesLoading ? (
              <p className="text-sm text-[#6f6255]">Laduje wiadomosci...</p>
            ) : messagesError ? (
              <p className="text-sm text-rose-700">{messagesError}</p>
            ) : messages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#eadfd3] bg-[#fcfaf7] px-4 py-3 text-sm text-[#6f6255]">
                Brak wiadomosci w tym zadaniu.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isMine = currentUserId && message.author.id === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      {!isMine ? (
                        <Avatar className="h-7 w-7 border border-[#eadfd3] bg-white">
                          {message.author.image ? (
                            <AvatarImage
                              src={message.author.image}
                              alt={message.author.name || message.author.email || "user"}
                            />
                          ) : null}
                          <AvatarFallback className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6f6255]">
                            {getInitials(message.author.name || message.author.email)}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                      <div
                        className={`max-w-[70%] rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                          isMine
                            ? "border-[#2a241f] bg-[#2a241f] text-[#f6efe8] shadow-[0_14px_30px_-18px_rgba(20,15,10,0.55)]"
                            : "border-[#eadfd3] bg-white text-[#2a241f] ring-1 ring-[#f3ebe2]"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]">
                          <span className={isMine ? "text-[#f6efe8]/80" : "text-[#8a7762]"}>
                            {message.author.name || message.author.email || "Nieznany"}
                          </span>
                          <span className={isMine ? "text-[#f6efe8]/60" : "text-[#8a7762]"}>
                            {timeFormatter.format(new Date(message.createdAt))}
                          </span>
                        </div>
                        <p className="mt-2">{message.content}</p>
                      </div>
                      {isMine ? (
                        <Avatar className="h-7 w-7 border border-[#eadfd3] bg-white">
                          {message.author.image ? (
                            <AvatarImage
                              src={message.author.image}
                              alt={message.author.name || message.author.email || "user"}
                            />
                          ) : null}
                          <AvatarFallback className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6f6255]">
                            {getInitials(message.author.name || message.author.email)}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-[#eadfd3] px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                placeholder="Napisz wiadomosc do zespolu..."
                className="flex-1 rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm text-[#2a241f] shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                disabled={!hasSelection}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || draft.trim().length === 0 || !hasSelection}
                className="h-10 rounded-full border border-[#2a241f] bg-[#2a241f] px-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#f6efe8] shadow-[0_10px_20px_-15px_rgba(20,15,10,0.6)] transition hover:-translate-y-[1px] hover:shadow-[0_12px_24px_-16px_rgba(20,15,10,0.6)] disabled:cursor-not-allowed disabled:bg-[#c3b5a5]"
              >
                {sending ? "Wysylam..." : "Wyslij"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
