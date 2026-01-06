"use client";

import dynamic from "next/dynamic";
import type { FormikProps } from "formik";
import { ChevronDown, FileText, ListChecks, Tags, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useMemo, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Sprint, TaskCategory, TaskPriority, TaskStatus } from "./types";
import { useProjectContext } from "./project-context";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
const quillModules = {
    toolbar: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
    ],
};
const quillFormats = ["bold", "italic", "underline", "list"];

type TaskFormValues = {
    title: string;
    description: string;
    userStory: string;
    acceptanceCriteria: string;
    assignedMemberId: string;
    reviewMemberId: string;
    categoryCode: string;
    sprintId: string;
    status: TaskStatus;
    priority: TaskPriority;
};

type ProjectMemberSummary = {
    id: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    } | null;
};

const getInitials = (value?: string | null) => {
    if (!value) return "?";
    const parts = value.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

const statusConfig: Record<TaskStatus, { label: string; dot: string }> = {
    TODO: { label: "To Do", dot: "bg-[#c3b5a5]" },
    IN_PROGRESS: { label: "In Progress", dot: "bg-amber-500" },
    BLOCKED: { label: "Blocked", dot: "bg-rose-500" },
    READY_FOR_REVIEW: { label: "Ready for Review", dot: "bg-sky-500" },
    IN_REVIEW: { label: "In Review", dot: "bg-indigo-500" },
    DONE: { label: "Done", dot: "bg-emerald-500" },
    REJECTED: { label: "Rejected", dot: "bg-orange-500" },
    CANCELLED: { label: "Cancelled", dot: "bg-slate-500" },
};

const priorityConfig: Record<TaskPriority, { label: string; dot: string }> = {
    LOW: { label: "Niski", dot: "bg-slate-500" },
    MEDIUM: { label: "Średni", dot: "bg-blue-500" },
    HIGH: { label: "Wysoki", dot: "bg-amber-500" },
    URGENT: { label: "Pilny", dot: "bg-rose-500" },
};

type BacklogTaskModalProps = {
    mode: "create" | "edit";
    open: boolean;
    error: string | null;
    categories: TaskCategory[];
    members: ProjectMemberSummary[];
    sprints: Sprint[];
    selectedCategory: TaskCategory | null;
    defaultCategoryColor: string;
    canManageTasks: boolean;
    taskId?: string | null;
    canMessageTasks?: boolean;
    canUseAi?: boolean;
    onAiDescriptionClick?: () => void;
    onAiCriteriaClick?: () => void;
    showAiAssign?: boolean;
    aiAssignLoading?: boolean;
    aiAssignError?: string | null;
    onAiAssign?: () => void;
    onClose: () => void;
    formik: FormikProps<TaskFormValues>;
};

export function BacklogTaskModal({
    mode,
    open,
    error,
    categories,
    members,
    sprints,
    selectedCategory,
    defaultCategoryColor,
    canManageTasks,
    taskId,
    canMessageTasks,
    canUseAi,
    onAiDescriptionClick,
    onAiCriteriaClick,
    showAiAssign,
    aiAssignLoading,
    aiAssignError,
    onAiAssign,
    onClose,
    formik,
}: BacklogTaskModalProps) {
    const project = useProjectContext();
    const canMessage = canMessageTasks === true;
    const [messages, setMessages] = useState<
        Array<{
            id: string;
            content: string;
            createdAt: string;
            author: { id: string; name: string | null; email: string | null; image: string | null };
        }>
    >([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState<string | null>(null);
    const [messageDraft, setMessageDraft] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open || !taskId || !canMessage || !project?.id) return;
        let isActive = true;
        const load = async () => {
            setMessagesLoading(true);
            setMessagesError(null);
            try {
                const response = await fetch(`/api/project/${project.id}/tasks/${taskId}/messages`);
                const payload = await response.json();
                if (!response.ok) {
                    if (isActive) {
                        setMessagesError(payload?.message || "Nie udało się pobrać wiadomości.");
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
                    setMessagesError(message);
                    setMessages([]);
                }
            } finally {
                if (isActive) {
                    setMessagesLoading(false);
                }
            }
        };
        load();
        return () => {
            isActive = false;
        };
    }, [open, taskId, canMessage, project?.id]);

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

    const handleSendMessage = async () => {
        if (!taskId || !project?.id || !canMessage) return;
        const content = messageDraft.trim();
        if (!content) return;
        setSendingMessage(true);
        setMessagesError(null);
        try {
            const response = await fetch(`/api/project/${project.id}/tasks/${taskId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            const payload = await response.json();
            if (!response.ok) {
                setMessagesError(payload?.message || "Nie udało się wysłać wiadomości.");
                return;
            }
            if (payload?.message) {
                setMessages((prev) => [...prev, payload.message]);
                setMessageDraft("");
            }
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Nie udało się wysłać wiadomości.";
            setMessagesError(message);
        } finally {
            setSendingMessage(false);
        }
    };

    if (!open) return null;

    const isCreate = mode === "create";
    const headerLabel = isCreate ? "Nowe zadanie" : "Edycja zadania";
    const headerTitle = isCreate ? "Dodaj do backlogu" : "Zmien dane zadania";
    const submitLabel = isCreate ? "Dodaj zadanie" : "Zapisz zmiany";
    const submitLoadingLabel = isCreate ? "Dodaje..." : "Zapisuje...";
    const selectedMember = members.find((member) => member.id === formik.values.assignedMemberId);
    const selectedMemberLabel =
        selectedMember?.user?.name || selectedMember?.user?.email || "Nieznany";
    const selectedReviewer = members.find((member) => member.id === formik.values.reviewMemberId);
    const selectedReviewerLabel =
        selectedReviewer?.user?.name || selectedReviewer?.user?.email || "Nieznany";
    const currentStatus = statusConfig[formik.values.status] ? formik.values.status : "TODO";
    const selectedSprint = sprints.find((sprint) => sprint.id === formik.values.sprintId);
    const currentPriority = priorityConfig[formik.values.priority] ? formik.values.priority : "MEDIUM";

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl rounded-2xl border border-[#eadfd3] bg-white p-6 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.45)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
                            {headerLabel}
                        </p>
                        <h2 className="text-xl font-semibold text-[#1f1b16]">{headerTitle}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-sm text-[#5b5044] transition hover:border-[#2a241f] cursor-pointer"
                    >
                        Zamknij
                    </button>
                </div>

                {error ? (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                        {error}
                    </div>
                ) : null}

                <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={formik.handleSubmit}>
                    <div className="rounded-2xl border border-[#eadfd3] bg-[#fbf7f1] p-5 shadow-[0_10px_24px_-20px_rgba(20,14,8,0.35)] space-y-2 md:col-span-1">
                        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                            <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                                <Tags className="h-3.5 w-3.5" />
                            </span>
                            Tytul *
                        </label>
                        <input
                            name="title"
                            value={formik.values.title}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Np. Przygotowac plan wdrozenia"
                            className="w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                        />
                        {formik.touched.title && formik.errors.title ? (
                            <p className="text-xs text-rose-700">{formik.errors.title}</p>
                        ) : null}
                    </div>
                    <div className="rounded-2xl border border-[#eadfd3] bg-[#fbf7f1] p-5 shadow-[0_10px_24px_-20px_rgba(20,14,8,0.35)] space-y-2 md:col-span-1">
                        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                            <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                                <ListChecks className="h-3.5 w-3.5" />
                            </span>
                            Status *
                        </label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                                >
                                    <span className="flex items-center gap-2">
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${statusConfig[currentStatus].dot}`}
                                        />
                                        <span className="text-sm font-semibold text-[#2a241f]">
                                            {statusConfig[currentStatus].label}
                                        </span>
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-[#8a7762]" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border-[#eadfd3] bg-white p-1">
                                {(Object.keys(statusConfig) as TaskStatus[]).map((status) => (
                                    <DropdownMenuItem
                                        key={status}
                                        onSelect={() => {
                                            formik.setFieldValue("status", status);
                                            formik.setFieldTouched("status", true, false);
                                        }}
                                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-[#2a241f] focus:bg-[#f6efe8]"
                                    >
                                        <span className={`h-2.5 w-2.5 rounded-full ${statusConfig[status].dot}`} />
                                        {statusConfig[status].label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {formik.touched.status && formik.errors.status ? (
                            <p className="text-xs text-rose-700">{formik.errors.status}</p>
                        ) : null}
                    </div>
                    <div className="rounded-2xl border border-[#eadfd3] bg-[#fbf7f1] p-5 shadow-[0_10px_24px_-20px_rgba(20,14,8,0.35)] space-y-2 md:col-span-1">

                        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">

                            <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">

                                <ListChecks className="h-3.5 w-3.5" />

                            </span>

                            Priorytet *

                        </label>

                        <DropdownMenu>

                            <DropdownMenuTrigger asChild>

                                <button

                                    type="button"

                                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"

                                >

                                    <span className="flex items-center gap-2">

                                        <span className={`h-2.5 w-2.5 rounded-full ${priorityConfig[currentPriority].dot}`} />

                                        <span className="text-sm font-semibold text-[#2a241f]">

                                            {priorityConfig[currentPriority].label}

                                        </span>

                                    </span>

                                    <ChevronDown className="h-4 w-4 text-[#8a7762]" />

                                </button>

                            </DropdownMenuTrigger>

                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border-[#eadfd3] bg-white p-1">

                                {(Object.keys(priorityConfig) as TaskPriority[]).map((priority) => (

                                    <DropdownMenuItem

                                        key={priority}

                                        onSelect={() => {

                                            formik.setFieldValue("priority", priority);

                                            formik.setFieldTouched("priority", true, false);

                                        }}

                                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-[#2a241f] focus:bg-[#f6efe8]"

                                    >

                                        <span className={`h-2.5 w-2.5 rounded-full ${priorityConfig[priority].dot}`} />

                                        {priorityConfig[priority].label}

                                    </DropdownMenuItem>

                                ))}

                            </DropdownMenuContent>

                        </DropdownMenu>

                        {formik.touched.priority && formik.errors.priority ? (

                            <p className="text-xs text-rose-700">{formik.errors.priority}</p>

                        ) : null}

                    </div>


                    <div className="rounded-2xl border border-[#eadfd3] bg-[#fbf7f1] p-5 shadow-[0_10px_24px_-20px_rgba(20,14,8,0.35)] space-y-2 md:col-span-1">
                        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                            <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                                <Tags className="h-3.5 w-3.5" />
                            </span>
                            Kategoria *
                        </label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    disabled={categories.length === 0}
                                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10 disabled:cursor-not-allowed disabled:bg-[#f4efe8]"
                                >
                                    {selectedCategory ? (
                                        <span className="flex items-center gap-2">
                                            <span
                                                className="h-2.5 w-2.5 rounded-full border border-[#d7c8b7]"
                                                style={{
                                                    backgroundColor:
                                                        selectedCategory.color || defaultCategoryColor,
                                                }}
                                            />
                                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                                                {selectedCategory.code}
                                            </span>
                                            <span className="text-sm font-semibold text-[#2a241f]">
                                                {selectedCategory.name}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="text-[#8a7762]">
                                            {categories.length === 0
                                                ? "Brak kategorii"
                                                : "Wybierz kategorie"}
                                        </span>
                                    )}
                                    <ChevronDown className="h-4 w-4 text-[#8a7762]" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border-[#eadfd3] bg-white p-1">
                                {categories.length === 0 ? (
                                    <div className="px-2 py-2 text-sm text-[#8a7762]">
                                        Brak dostepnych kategorii.
                                    </div>
                                ) : (
                                    categories.map((category) => (
                                        <DropdownMenuItem
                                            key={category.id}
                                            onSelect={() => {
                                                formik.setFieldValue("categoryCode", category.code);
                                                formik.setFieldTouched("categoryCode", true, false);
                                            }}
                                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-[#2a241f] focus:bg-[#f6efe8]"
                                        >
                                            <span
                                                className="h-2.5 w-2.5 rounded-full border border-[#d7c8b7]"
                                                style={{
                                                    backgroundColor: category.color || defaultCategoryColor,
                                                }}
                                            />
                                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                                                {category.code}
                                            </span>
                                            <span className="text-sm font-semibold text-[#2a241f]">
                                                {category.name}
                                            </span>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {formik.touched.categoryCode && formik.errors.categoryCode ? (
                            <p className="text-xs text-rose-700">{formik.errors.categoryCode}</p>
                        ) : null}
                    </div>
                    <div className="rounded-2xl border border-[#eadfd3] bg-[#fbf7f1] p-5 shadow-[0_10px_24px_-20px_rgba(20,14,8,0.35)] space-y-3 md:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                                    <FileText className="h-3.5 w-3.5" />
                                </span>
                                Opis
                            </label>
                            {canUseAi && onAiDescriptionClick ? (
                                <button
                                    type="button"
                                    onClick={onAiDescriptionClick}
                                    className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2a241f] transition hover:border-[#2a241f]"
                                >
                                    AI utworz opis
                                </button>
                            ) : null}
                        </div>
                        <ReactQuill
                            theme="snow"
                            value={formik.values.description}
                            onChange={(value) => formik.setFieldValue("description", value)}
                            onBlur={() => formik.setFieldTouched("description", true, false)}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Krotki opis zadania"
                            className="ipms-quill"
                        />
                        {formik.touched.description && formik.errors.description ? (
                            <p className="text-xs text-rose-700">{formik.errors.description}</p>
                        ) : null}
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                                    <FileText className="h-3.5 w-3.5" />
                                </span>
                                User story
                            </label>
                            <textarea
                                name="userStory"
                                value={formik.values.userStory}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                rows={3}
                                placeholder="Jako [rola] chce [funkcja], aby [cel]"
                                className="w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                            />
                            {formik.touched.userStory && formik.errors.userStory ? (
                                <p className="text-xs text-rose-700">{formik.errors.userStory}</p>
                            ) : null}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#eadfd3] bg-[#fbf7f1] p-5 shadow-[0_10px_24px_-20px_rgba(20,14,8,0.35)] space-y-2 md:col-span-1">
                        <div className="flex items-center justify-between gap-3">
                            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                                    <Users className="h-3.5 w-3.5" />
                                </span>
                                Przypisz osobe
                            </label>
                            {showAiAssign && canUseAi && onAiAssign ? (
                                <button
                                    type="button"
                                    onClick={onAiAssign}
                                    disabled={aiAssignLoading}
                                    className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2a241f] transition hover:border-[#2a241f] disabled:cursor-not-allowed disabled:text-[#9b8f81]"
                                >
                                    {aiAssignLoading ? "Dobieram..." : "Dobierz (AI)"}
                                </button>
                            ) : null}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                                >
                                    {formik.values.assignedMemberId ? (
                                        <span className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6 border border-[#eadfd3] bg-white">
                                                {selectedMember?.user?.image ? (
                                                    <AvatarImage
                                                        src={selectedMember.user.image}
                                                        alt={selectedMemberLabel}
                                                    />
                                                ) : null}
                                                <AvatarFallback className="bg-[#f4efe8] text-[10px] text-[#6f6255]">
                                                    {getInitials(selectedMemberLabel)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-semibold text-[#2a241f]">
                                                {selectedMemberLabel}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="text-[#8a7762]">Nieprzypisane</span>
                                    )}
                                    <ChevronDown className="h-4 w-4 text-[#8a7762]" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border-[#eadfd3] bg-white p-1">
                                <DropdownMenuItem
                                    onSelect={() => {
                                        formik.setFieldValue("assignedMemberId", "");
                                        formik.setFieldTouched("assignedMemberId", true, false);
                                    }}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-[#2a241f] focus:bg-[#f6efe8]"
                                >
                                    Nieprzypisane
                                </DropdownMenuItem>
                                {members.map((member) => {
                                    const label =
                                        member.user?.name || member.user?.email || "Nieznany";
                                    return (
                                        <DropdownMenuItem
                                            key={member.id}
                                            onSelect={() => {
                                                formik.setFieldValue("assignedMemberId", member.id);
                                                formik.setFieldTouched("assignedMemberId", true, false);
                                            }}
                                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-[#2a241f] focus:bg-[#f6efe8]"
                                        >
                                            <Avatar className="h-6 w-6 border border-[#eadfd3] bg-white">
                                                {member.user?.image ? (
                                                    <AvatarImage src={member.user.image} alt={label} />
                                                ) : null}
                                                <AvatarFallback className="bg-[#f4efe8] text-[10px] text-[#6f6255]">
                                                    {getInitials(label)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {label}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {aiAssignError ? <p className="text-xs text-rose-700">{aiAssignError}</p> : null}
                    </div>
                    <div className="rounded-2xl border border-[#eadfd3] bg-[#fbf7f1] p-5 shadow-[0_10px_24px_-20px_rgba(20,14,8,0.35)] space-y-4 md:col-span-1">
                        <div className="flex items-center justify-between gap-3">
                            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                                    <ListChecks className="h-3.5 w-3.5" />
                                </span>
                                Kryteria akceptacji
                            </label>
                            {canUseAi && onAiCriteriaClick ? (
                                <button
                                    type="button"
                                    onClick={onAiCriteriaClick}
                                    className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2a241f] transition hover:border-[#2a241f]"
                                >
                                    AI utworz kryteria
                                </button>
                            ) : null}
                        </div>
                        <textarea
                            name="acceptanceCriteria"
                            value={formik.values.acceptanceCriteria}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            rows={3}
                            placeholder="Np. testy, warunki odbioru"
                            className="w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                        />
                        {formik.touched.acceptanceCriteria && formik.errors.acceptanceCriteria ? (
                            <p className="text-xs text-rose-700">{formik.errors.acceptanceCriteria}</p>
                        ) : null}
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                                    <Users className="h-3.5 w-3.5" />
                                </span>
                                Osoba do review
                            </label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                                    >
                                        {formik.values.reviewMemberId ? (
                                            <span className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 border border-[#eadfd3] bg-white">
                                                    {selectedReviewer?.user?.image ? (
                                                        <AvatarImage
                                                            src={selectedReviewer.user.image}
                                                            alt={selectedReviewerLabel}
                                                        />
                                                    ) : null}
                                                    <AvatarFallback className="bg-[#f4efe8] text-[10px] text-[#6f6255]">
                                                        {getInitials(selectedReviewerLabel)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-semibold text-[#2a241f]">
                                                    {selectedReviewerLabel}
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-[#8a7762]">Brak</span>
                                        )}
                                        <ChevronDown className="h-4 w-4 text-[#8a7762]" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border-[#eadfd3] bg-white p-1">
                                    <DropdownMenuItem
                                        onSelect={() => {
                                            formik.setFieldValue("reviewMemberId", "");
                                            formik.setFieldTouched("reviewMemberId", true, false);
                                        }}
                                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-[#2a241f] focus:bg-[#f6efe8]"
                                    >
                                        Brak
                                    </DropdownMenuItem>
                                    {members.map((member) => {
                                        const label =
                                            member.user?.name || member.user?.email || "Nieznany";
                                        return (
                                            <DropdownMenuItem
                                                key={member.id}
                                                onSelect={() => {
                                                    formik.setFieldValue("reviewMemberId", member.id);
                                                    formik.setFieldTouched("reviewMemberId", true, false);
                                                }}
                                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-[#2a241f] focus:bg-[#f6efe8]"
                                            >
                                                <Avatar className="h-6 w-6 border border-[#eadfd3] bg-white">
                                                    {member.user?.image ? (
                                                        <AvatarImage src={member.user.image} alt={label} />
                                                    ) : null}
                                                    <AvatarFallback className="bg-[#f4efe8] text-[10px] text-[#6f6255]">
                                                        {getInitials(label)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {label}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#eadfd3] bg-[#fbf7f1] p-5 shadow-[0_10px_24px_-20px_rgba(20,14,8,0.35)] space-y-2 md:col-span-2">
                        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                            <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                                <ListChecks className="h-3.5 w-3.5" />
                            </span>
                            Sprint
                        </label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                                >
                                    {selectedSprint ? (
                                        <span className="text-sm font-semibold text-[#2a241f]">
                                            {selectedSprint.name}
                                        </span>
                                    ) : (
                                        <span className="text-[#8a7762]">Brak sprintu</span>
                                    )}
                                    <ChevronDown className="h-4 w-4 text-[#8a7762]" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border-[#eadfd3] bg-white p-1">
                                <DropdownMenuItem
                                    onSelect={() => {
                                        formik.setFieldValue("sprintId", "");
                                        formik.setFieldTouched("sprintId", true, false);
                                    }}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-[#2a241f] focus:bg-[#f6efe8]"
                                >
                                    Brak sprintu
                                </DropdownMenuItem>
                                {sprints.length === 0 ? (
                                    <div className="px-2 py-2 text-sm text-[#8a7762]">Brak sprintow.</div>
                                ) : (
                                    sprints.map((sprint) => (
                                        <DropdownMenuItem
                                            key={sprint.id}
                                            onSelect={() => {
                                                formik.setFieldValue("sprintId", sprint.id);
                                                formik.setFieldTouched("sprintId", true, false);
                                            }}
                                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-[#2a241f] focus:bg-[#f6efe8]"
                                        >
                                            {sprint.name}
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex justify-end gap-2 md:col-span-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full border border-[#eadfd3] bg-white px-4 py-2 text-sm font-semibold text-[#5b5044] shadow-sm transition hover:border-[#2a241f] cursor-pointer"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={formik.isSubmitting || !canManageTasks}
                            className="rounded-full bg-[#2a241f] px-4 py-2 text-sm font-semibold text-[#f6efe8] shadow-[0_14px_35px_-18px_rgba(30,20,10,0.55)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_40px_-18px_rgba(30,20,10,0.55)] disabled:cursor-not-allowed disabled:bg-[#c3b5a5] cursor-pointer"
                        >
                            {formik.isSubmitting ? submitLoadingLabel : submitLabel}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
