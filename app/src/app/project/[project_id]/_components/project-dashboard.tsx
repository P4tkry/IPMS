"use client";

import {
  type ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PenLine } from "lucide-react";
import { Form, Formik } from "formik";
import ReactMarkdown from "react-markdown";
import * as Yup from "yup";
import { useI18n } from "@/i18n/useI18n";
import { authClient } from "@/lib/auth-client";
import { useProjectContext } from "./project-context";
import type { ProjectDashboardEntry } from "./types";

export default function ProjectDashboard() {
  const project = useProjectContext();
  const { t, locale } = useI18n();
  const PAGE_SIZE = 10;
  const [entries, setEntries] = useState<ProjectDashboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { data: session } = authClient.useSession();

  const canManage = project.canManageDashboard === true;
  const canPost = canManage || project.canPostDashboard === true;
  const canUploadFiles = project.canUploadFiles === true;
  const canEditEntry = (entry: ProjectDashboardEntry) =>
    canManage || (canPost && entry.author?.id && session?.user?.id === entry.author.id);

  const appendWithNewline = (current: string, next: string) => (current.trim() ? `${current}\n${next}` : next);

  const uploadFile = async (file: File) => {
    if (!canUploadFiles) {
      setError("Brak uprawnień do przesyłania plików.");
      return null;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => ({}))) as { url?: string; message?: string };
      if (!response.ok || !payload?.url) {
        setError(payload?.message || "Nie udało się wgrać pliku.");
        return null;
      }
      setError(null);
      return payload.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się wgrać pliku.";
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleComposerFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    const url = await uploadFile(file);
    if (url) {
      setContent((prev) => appendWithNewline(prev, url));
    }
  };

  const tagPalette = [
    { bg: "#fff3e4", border: "#f7d7b8", text: "#8a5322" },
    { bg: "#f2f5ff", border: "#d7defa", text: "#3b4e99" },
    { bg: "#f3fffb", border: "#c7f0de", text: "#1e6b4d" },
    { bg: "#fff1f4", border: "#f4c6d3", text: "#9b2d4d" },
    { bg: "#f4f1ff", border: "#dcd4fa", text: "#5a3aac" },
    { bg: "#f0fbff", border: "#c6eaf7", text: "#1c5c75" },
  ];

  const hashTag = (value: string) =>
    value
      .toLowerCase()
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const getTagTone = (value: string) => {
    const index = Math.abs(hashTag(value)) % tagPalette.length;
    return tagPalette[index];
  };

  const normalizeTag = (value: string) => value.trim().replace(/\s+/g, " ");

  const addTagToList = (value: string, list: string[], setter: Dispatch<SetStateAction<string[]>>) => {
    const normalized = normalizeTag(value);
    if (!normalized) return;
    if (list.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      setter(list);
      return;
    }
    setter([...list, normalized]);
  };

  const removeTagFromList = (tagToRemove: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const renderTags = (tagList?: string[], onRemove?: (tag: string) => void) => {
    if (!tagList || tagList.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {tagList.map((tag) => (
          <span
            key={tag}
            style={{
              backgroundColor: getTagTone(tag).bg,
              borderColor: getTagTone(tag).border,
              color: getTagTone(tag).text,
            }}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-[0_6px_20px_-16px_rgba(0,0,0,0.35)]"
          >
            {tag}
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="rounded-full border border-transparent px-1 text-[#604c3e] transition hover:border-[#d6c9b9] hover:text-[#2a241f]"
                aria-label="Remove tag"
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
      </div>
    );
  };

  const getInitial = (value?: string | null) => {
    if (!value) return "•";
    return value.trim().charAt(0).toUpperCase();
  };

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  const fetchEntries = useCallback(
    async (nextCursor: string | null = null) => {
      const isLoadMore = Boolean(nextCursor);
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("take", String(PAGE_SIZE));
        if (nextCursor) {
          params.set("cursor", nextCursor);
        }
        const response = await fetch(`/api/project/${project.id}/dashboard?${params.toString()}`);
        const payload = await response.json();
        if (!response.ok) {
          setError(payload?.message || t("project.view.dashboard.loadError"));
          if (!isLoadMore) {
            setEntries([]);
            setHasMore(false);
            setCursor(null);
          }
          return;
        }
        const receivedEntries = Array.isArray(payload?.entries)
          ? (payload.entries as ProjectDashboardEntry[])
          : [];
        setEntries((prev) => (isLoadMore ? [...prev, ...receivedEntries] : receivedEntries));
        const next = payload?.nextCursor ?? null;
        setCursor(next);
        setHasMore(Boolean(next));
      } catch (err) {
        const message = err instanceof Error ? err.message : t("project.view.dashboard.loadError");
        setError(message);
      } finally {
        if (isLoadMore) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [PAGE_SIZE, project.id, t],
  );

  useEffect(() => {
    setEntries([]);
    setCursor(null);
    setHasMore(true);
    fetchEntries(null);
  }, [fetchEntries]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore || !cursor) return;
    fetchEntries(cursor);
  }, [cursor, fetchEntries, hasMore, loading, loadingMore]);

  useEffect(() => {
    if (!hasMore) return;
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entriesList) => {
        if (entriesList[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [entries.length, hasMore, loadMore]);

  const handleSubmit = async () => {
    if (!canPost) {
      return;
    }
    const trimmedContent = content.trim();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t("project.view.dashboard.validation.titleRequired"));
      return;
    }
    if (!trimmedContent) {
      setError(t("project.view.dashboard.validation.contentRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/project/${project.id}/dashboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          tags,
          urgent,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.message || t("project.view.dashboard.submitError"));
        return;
      }
      if (payload?.entry) {
        setEntries((prev) => [payload.entry as ProjectDashboardEntry, ...prev]);
        setTitle("");
        setContent("");
        setTags([]);
        setTagInput("");
        setUrgent(false);
        setShowComposer(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("project.view.dashboard.submitError");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!canPost) {
      return;
    }
    setDeletingId(entryId);
    setError(null);
    try {
      const response = await fetch(`/api/project/${project.id}/dashboard/${entryId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.message || t("project.view.dashboard.delete.error"));
        return;
      }
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("project.view.dashboard.delete.error");
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteRequest = (entry: ProjectDashboardEntry) => {
    if (!canEditEntry(entry)) {
      setError(t("project.view.dashboard.readOnly"));
      return;
    }
    const entryId = entry.id;
    if (confirmDeleteId === entryId) {
      handleDelete(entryId);
      setConfirmDeleteId(null);
      return;
    }
    setConfirmDeleteId(entryId);
    setTimeout(() => {
      setConfirmDeleteId((current) => (current === entryId ? null : current));
    }, 4000);
  };

  const handleStartEdit = (entry: ProjectDashboardEntry) => {
    if (!canEditEntry(entry)) {
      setError(t("project.view.dashboard.readOnly"));
      return;
    }
    setShowComposer(false);
    setError(null);
    setEditingId(entry.id);
    setEditingAuthorId(entry.author?.id || null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingAuthorId(null);
  };

  const handleUpdate = async (payloadValues: {
    title: string;
    content: string;
    tags: string[];
    urgent: boolean;
  }) => {
    if (!editingId) return;
    const canEdit =
      canManage || (canPost && editingAuthorId && session?.user?.id && editingAuthorId === session.user.id);
    if (!canEdit) {
      setError(t("project.view.dashboard.readOnly"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/project/${project.id}/dashboard/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payloadValues.title.trim(),
          content: payloadValues.content.trim(),
          tags: payloadValues.tags,
          urgent: payloadValues.urgent,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.message || t("project.view.dashboard.submitError"));
        return;
      }
      if (payload?.entry) {
        setEntries((prev) =>
          prev.map((item) => (item.id === editingId ? (payload.entry as ProjectDashboardEntry) : item)),
        );
        handleCancelEdit();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("project.view.dashboard.submitError");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#e1d7cb] bg-white/80 p-6 shadow-[0_30px_70px_-45px_rgba(40,30,20,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a7762]">
            {t("project.view.dashboard.label")}
          </p>
          <h2 className="text-2xl font-semibold text-[#1f1b16]">
            {t("project.view.dashboard.title")}
          </h2>
          <p className="text-sm text-[#5b5044]">{t("project.view.dashboard.subtitle")}</p>
        </div>
        {canPost ? (
          <button
            type="button"
            onClick={() => {
              setShowComposer((prev) => !prev);
              setEditingId(null);
              setEditingAuthorId(null);
              setUrgent(false);
            }}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#2a241f] px-4 py-2 text-sm font-semibold text-[#f6efe8] shadow-[0_14px_35px_-18px_rgba(30,20,10,0.55)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_40px_-18px_rgba(30,20,10,0.55)]"
          >
            <PenLine size={16} />
            {t("project.view.dashboard.form.openButton")}
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {canPost && showComposer ? (
        <div className="mt-5 rounded-2xl border border-[#e1d7cb] bg-white/90 px-4 py-4 shadow-[0_18px_45px_-24px_rgba(20,15,10,0.35)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0e7dc] text-sm font-semibold text-[#2a241f]">
              {t("project.view.dashboard.form.badge").charAt(0)}
            </div>
            <div className="flex-1 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleComposerFileChange}
                aria-hidden="true"
              />
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                    {t("project.view.dashboard.form.titlePlaceholder")}
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    aria-required="true"
                    className="w-full rounded-xl border border-[#e1d7cb] bg-white px-3 py-2.5 text-sm text-[#2a241f] outline-none transition focus:border-[#b59a7c]"
                    placeholder={t("project.view.dashboard.form.titlePlaceholder")}
                    maxLength={160}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                    <span>Tagi</span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#b3a18f]">
                      Enter aby dodać
                    </span>
                  </div>
                  {renderTags(tags, (tag) => removeTagFromList(tag, setTags))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTagToList(tagInput, tags, setTags);
                        setTagInput("");
                      }
                    }}
                    className="w-full rounded-xl border border-[#e1d7cb] bg-white px-3 py-2 text-sm text-[#2a241f] outline-none transition focus:border-[#b59a7c]"
                    placeholder="Dodaj tag i naciśnij Enter"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                  {t("project.view.dashboard.form.contentPlaceholder")}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] w-full rounded-xl border border-[#e1d7cb] bg-white px-3 py-3 text-sm text-[#2a241f] outline-none transition focus:border-[#b59a7c]"
                  placeholder={t("project.view.dashboard.form.contentPlaceholder")}
                />
                <p className="text-[11px] text-[#8a7762]">
                  Podpowiedź: możesz używać Markdown. Sprawdź{" "}
                  <a
                    href="https://www.markdownguide.org/basic-syntax/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline"
                  >
                    podstawy Markdown
                  </a>
                  .
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-[#8a7762]">{t("project.view.dashboard.form.hint")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 rounded-full border border-[#fca5a5] bg-[#fff1f2] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b91c1c] shadow-[0_10px_30px_-22px_rgba(200,60,40,0.7)] ring-1 ring-inset ring-[#fecdd3]">
                    <input
                      type="checkbox"
                      checked={urgent}
                      onChange={(e) => setUrgent(e.target.checked)}
                      className="h-4 w-4 accent-[#ef4444]"
                    />
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ef4444] shadow-[0_0_0_4px_rgba(239,68,68,0.12)]" />
                      Pilne
                    </span>
                  </label>
                  {canUploadFiles ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="cursor-pointer rounded-xl border border-[#e1d7cb] px-4 py-2 text-sm font-semibold text-[#2a241f] transition hover:bg-[#faf7f2] disabled:cursor-not-allowed disabled:text-[#b3a79b]"
                    >
                      {uploading ? "Wgrywanie..." : "Dodaj plik"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setTitle("");
                      setContent("");
                      setTags([]);
                      setTagInput("");
                      setShowComposer(false);
                    }}
                    className="cursor-pointer rounded-xl border border-[#e1d7cb] px-4 py-2 text-sm font-semibold text-[#2a241f] transition hover:bg-[#faf7f2]"
                  >
                    {t("project.view.dashboard.form.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !content.trim() || !title.trim()}
                    className="cursor-pointer rounded-xl bg-[#2a241f] px-4 py-2 text-sm font-semibold text-[#f6efe8] shadow-[0_14px_35px_-18px_rgba(30,20,10,0.55)] transition disabled:cursor-not-allowed disabled:bg-[#c3b5a5]"
                  >
                    {submitting
                      ? t("project.view.dashboard.form.submitting")
                      : t("project.view.dashboard.form.submit")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {loading ? (
          <div className="text-sm text-[#6f6255]">{t("project.view.dashboard.loading")}</div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#e1d7cb] bg-[#faf7f2] px-4 py-6 text-center text-sm text-[#6f6255]">
            {t("project.view.dashboard.empty")}
          </div>
        ) : (
          <>
            {entries.map((entry) => (
              <article
                key={entry.id}
                className={`rounded-2xl px-4 py-4 shadow-[0_18px_45px_-24px_rgba(20,15,10,0.35)] ${entry.urgent
                    ? "border border-[#fca5a5] bg-[#fff1f2]"
                    : "border border-[#e1d7cb] bg-white/90"
                  }`}
              >
                {editingId === entry.id ? (
                  <Formik
                    key={entry.id}
                    enableReinitialize
                    initialValues={{
                      title: entry.title || "",
                      content: entry.content,
                      tags: entry.tags || [],
                      tagInput: "",
                      urgent: entry.urgent ?? false,
                    }}
                    validationSchema={Yup.object({
                      title: Yup.string().trim().required(t("project.view.dashboard.validation.titleRequired")),
                      content: Yup.string().trim().required(t("project.view.dashboard.validation.contentRequired")),
                      tags: Yup.array().of(Yup.string()),
                      tagInput: Yup.string(),
                      urgent: Yup.boolean(),
                    })}
                    onSubmit={async (values, { setSubmitting: setFormikSubmitting }) => {
                      await handleUpdate({
                        title: values.title.trim(),
                        content: values.content.trim(),
                        tags: values.tags,
                        urgent: values.urgent,
                      });
                      setFormikSubmitting(false);
                    }}
                  >
                    {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
                      <Form className="space-y-4">
                        <input
                          ref={editFileInputRef}
                          type="file"
                          className="hidden"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            event.target.value = "";
                            const url = await uploadFile(file);
                            if (url) {
                              setFieldValue("content", appendWithNewline(values.content, url));
                            }
                          }}
                          aria-hidden="true"
                        />
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                            Tytuł
                          </label>
                          <input
                            name="title"
                            value={values.title}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            aria-required="true"
                            className="w-full rounded-xl border border-[#e1d7cb] bg-white px-3 py-2.5 text-sm text-[#2a241f] outline-none transition focus:border-[#b59a7c]"
                            placeholder="Tytuł"
                            maxLength={160}
                          />
                          {touched.title && errors.title ? (
                            <p className="text-xs text-red-600">{errors.title}</p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                            <span>Tagi</span>
                            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#b3a18f]">
                              Enter aby dodać
                            </span>
                          </div>
                          {renderTags(values.tags, (tag) =>
                            setFieldValue(
                              "tags",
                              values.tags.filter((item) => item !== tag),
                            ),
                          )}
                          <input
                            name="tagInput"
                            value={values.tagInput}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const normalized = normalizeTag(values.tagInput);
                                if (!normalized) return;
                                const exists = values.tags.some(
                                  (tag) => tag.toLowerCase() === normalized.toLowerCase(),
                                );
                                if (!exists) {
                                  setFieldValue("tags", [...values.tags, normalized]);
                                }
                                setFieldValue("tagInput", "");
                              }
                            }}
                            className="w-full rounded-xl border border-[#e1d7cb] bg-white px-3 py-2 text-sm text-[#2a241f] outline-none transition focus:border-[#b59a7c]"
                            placeholder="Dodaj tag i naciśnij Enter"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                            {t("project.view.dashboard.form.contentPlaceholder")}
                          </label>
                          <textarea
                            name="content"
                            value={values.content}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="min-h-[200px] w-full rounded-xl border border-[#e1d7cb] bg-white px-3 py-3 text-sm text-[#2a241f] outline-none transition focus:border-[#b59a7c]"
                            placeholder={t("project.view.dashboard.form.contentPlaceholder")}
                          />
                          {touched.content && errors.content ? (
                            <p className="text-xs text-red-600">{errors.content}</p>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-[#8a7762]">
                          Podpowiedź: możesz używać Markdown. Sprawdź{" "}
                          <a
                            href="https://www.markdownguide.org/basic-syntax/"
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold underline"
                          >
                            podstawy Markdown
                          </a>
                          .
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <label className="flex items-center gap-2 rounded-full border border-[#fca5a5] bg-[#fff1f2] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b91c1c] shadow-[0_10px_30px_-22px_rgba(200,60,40,0.7)] ring-1 ring-inset ring-[#fecdd3]">
                            <input
                              type="checkbox"
                              checked={values.urgent}
                              onChange={(e) => setFieldValue("urgent", e.target.checked)}
                              className="h-4 w-4 accent-[#ef4444]"
                            />
                            <span className="flex items-center gap-2">
                              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ef4444] shadow-[0_0_0_4px_rgba(239,68,68,0.12)]" />
                              Pilne
                            </span>
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            {canUploadFiles ? (
                              <button
                                type="button"
                                onClick={() => editFileInputRef.current?.click()}
                                disabled={uploading}
                                className="cursor-pointer rounded-xl border border-[#e1d7cb] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2a241f] transition hover:bg-[#faf7f2] disabled:cursor-not-allowed disabled:text-[#b3a79b]"
                              >
                                {uploading ? "Wgrywanie..." : "Dodaj plik"}
                              </button>
                            ) : null}
                            <button
                              type="submit"
                              disabled={submitting || isSubmitting}
                              className="cursor-pointer rounded-xl bg-[#2a241f] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f6efe8] shadow-[0_14px_35px_-18px_rgba(30,20,10,0.55)] transition disabled:cursor-not-allowed disabled:bg-[#c3b5a5]"
                            >
                              {submitting || isSubmitting
                                ? t("project.view.dashboard.edit.saving")
                                : t("project.view.dashboard.edit.save")}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="cursor-pointer rounded-xl border border-[#e1d7cb] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2a241f] transition hover:bg-[#faf7f2]"
                            >
                              {t("project.view.dashboard.edit.cancel")}
                            </button>
                          </div>
                        </div>
                      </Form>
                    )}
                  </Formik>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {entry.author?.image ? (
                          <img
                            src={entry.author.image}
                            alt={entry.author?.name || entry.author?.email || "Author avatar"}
                            className="h-11 w-11 rounded-full border border-[#e1d7cb] object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0e7dc] text-sm font-semibold text-[#2a241f]">
                            {getInitial(entry.author?.name || entry.author?.email)}
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-[#1f1b16]">
                              {entry.title || t("project.view.dashboard.entryUntitled")}
                            </h3>
                            {entry.urgent ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-[#fca5a5] bg-[#fff1f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b91c1c] shadow-[0_10px_30px_-20px_rgba(200,60,40,0.65)] ring-1 ring-inset ring-[#fecdd3]">
                                <span className="inline-block h-2 w-2 rounded-full bg-[#ef4444] shadow-[0_0_0_3px_rgba(239,68,68,0.15)]" />
                                Pilne
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-[#8a7762]">
                            {entry.author?.name || entry.author?.email || t("project.view.dashboard.unknownAuthor")} ·{" "}
                            {dateFormatter.format(new Date(entry.createdAt))}
                          </div>
                        </div>
                      </div>
                      {canEditEntry(entry) ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(entry)}
                            className="cursor-pointer rounded-xl border border-[#e1d7cb] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2a241f] transition hover:bg-[#faf7f2]"
                          >
                            {t("project.view.dashboard.edit.label")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(entry)}
                            disabled={deletingId === entry.id}
                            className="cursor-pointer rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-red-100 disabled:text-red-300"
                          >
                            {deletingId === entry.id
                              ? t("project.view.dashboard.delete.deleting")
                              : confirmDeleteId === entry.id
                                ? "Kliknij ponownie, aby usunąć"
                                : t("project.view.dashboard.delete.label")}
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-2">{renderTags(entry.tags)}</div>
                    <div className="prose prose-sm mt-3 max-w-none rounded-xl border border-[#f1e7db] bg-[#faf7f2] px-4 py-3 text-[#3c3128] prose-a:text-[#2a241f] prose-strong:text-[#2a241f]">
                      <ReactMarkdown>{entry.content}</ReactMarkdown>
                    </div>
                  </>
                )}
              </article>
            ))}
            {loadingMore ? (
              <div className="text-sm text-[#6f6255]">{t("project.view.dashboard.loading")}</div>
            ) : null}
            {hasMore ? <div ref={loadMoreRef} className="h-6" /> : null}
          </>
        )}
      </div>
    </div>
  );
}
