"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import { useI18n } from "@/i18n/useI18n";

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantChatProps = {
  context: string;
  projectId: string;
  contextData?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderInlineMarkdown = (value: string) => {
  let output = escapeHtml(value);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(
    /(^|[\s(])\*([^*]+)\*(?=[\s).,!?]|$)/g,
    "$1<em>$2</em>",
  );
  output = output.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  );
  return output;
};

const renderMarkdown = (value: string) => {
  const blocks = value.split(/```/);
  let html = "";

  blocks.forEach((block, index) => {
    if (index % 2 === 1) {
      html += `<pre><code>${escapeHtml(block)}</code></pre>`;
      return;
    }

    const lines = block.split(/\r?\n/);
    let listType: "ul" | "ol" | null = null;

    const closeList = () => {
      if (listType) {
        html += `</${listType}>`;
        listType = null;
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        closeList();
        return;
      }

      const unordered = /^[-*]\s+/.exec(trimmed);
      const ordered = /^\d+\.\s+/.exec(trimmed);

      if (unordered || ordered) {
        const nextType = unordered ? "ul" : "ol";
        if (listType !== nextType) {
          closeList();
          listType = nextType;
          html += `<${listType}>`;
        }
        const content = trimmed.replace(/^([-*]|\d+\.)\s+/, "");
        html += `<li>${renderInlineMarkdown(content)}</li>`;
        return;
      }

      closeList();
      html += `<p>${renderInlineMarkdown(line)}</p>`;
    });

    closeList();
  });

  return html;
};

export default function AssistantChat({
  context,
  projectId,
  contextData,
}: AssistantChatProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content: t("project.create.assistant.initial"),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const headerLabel = useMemo(() => {
    const baseLabel = t("project.create.assistant.title");
    if (!context) {
      return baseLabel;
    }
    return `${baseLabel} - ${context}`;
  }, [context, t]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) {
      return;
    }
    const history: AssistantMessage[] = [...messages, { role: "user", content: text }];
    setInput("");
    setIsSending(true);
    setMessages(history);
    try {
      const response = await fetch("/api/project/create/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: text,
          context,
          projectId,
          contextData,
          history,
        }),
      });
      const payload = await response.json();
      const reply =
        response.ok && payload?.reply
          ? payload.reply
          : t("project.create.assistant.errorResponse");
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("project.create.assistant.errorConnection"),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [isOpen, messages, isSending]);

  return (
    <>
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#2a241f] text-[#f6efe8] shadow-[0_20px_40px_-20px_rgba(40,30,20,0.5)] transition hover:bg-[#3a332c]"
        onClick={() => setIsOpen(true)}
      >
        <FiMessageCircle className="h-6 w-6" />
      </button>

      {isOpen ? (
        <div className="fixed bottom-6 right-6 z-50 w-[320px] max-w-[calc(100vw-48px)] overflow-hidden rounded-3xl border border-[#e2d6c9] bg-white shadow-[0_30px_70px_-35px_rgba(40,30,20,0.55)]">
          <div className="flex items-center justify-between border-b border-[#eadfd3] px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                {t("project.create.assistant.subtitle")}
              </p>
              <p className="text-sm font-semibold text-[#2a241f]">{headerLabel}</p>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#eadfd3] text-[#6f6255] hover:border-[#2a241f] hover:text-[#2a241f]"
              onClick={() => setIsOpen(false)}
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
          <div
            ref={scrollRef}
            className="max-h-[320px] space-y-3 overflow-y-auto px-4 py-4 text-sm"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl px-3 py-2 ${
                  message.role === "assistant"
                    ? "border border-[#eadfd3] bg-[#f8f4ef] text-[#2a241f]"
                    : "bg-[#2a241f] text-[#f6efe8]"
                }`}
              >
                <div
                  className={`space-y-2 text-sm leading-relaxed [&_a]:underline [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-black/10 [&_pre]:p-3 ${
                    message.role === "assistant"
                      ? "[&_a]:text-[#2a241f]"
                      : "[&_a]:text-[#f6efe8]"
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                />
              </div>
            ))}
            {isSending ? (
              <div className="rounded-2xl border border-[#eadfd3] bg-[#f8f4ef] px-3 py-2 text-xs text-[#6f6255]">
                {t("project.create.assistant.typing")}
              </div>
            ) : null}
          </div>
          <div className="border-t border-[#eadfd3] px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t("project.create.assistant.placeholder")}
                className="h-10 flex-1 rounded-full border border-[#d7c8b7] bg-white px-4 text-sm outline-none focus:border-[#2a241f]"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a241f] text-[#f6efe8] transition hover:bg-[#3a332c]"
                onClick={sendMessage}
                disabled={isSending}
              >
                <FiSend className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
