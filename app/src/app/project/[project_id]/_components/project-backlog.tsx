"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, PointerEvent } from "react";
import dynamic from "next/dynamic";
import { useFormik } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";
import {
    Activity,
    BriefcaseBusiness,
    ChevronsUpDown,
    ChevronDown,
    ChevronUp,
    Crosshair,
    FileText,
    LayoutGrid,
    ListChecks,
    Tags,
    Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/useI18n";
import { useProjectContext } from "./project-context";
import type { ProjectTask, Sprint, TaskCategory, TaskStatus } from "./types";

const statusConfig: Record<
    TaskStatus,
    { label: string; description: string; badge: string; border: string; dot: string }
> = {
    TODO: {
        label: "To Do",
        description: "Zadanie do wykonania, jeszcze nierozpoczęte.",
        badge: "bg-[#f8f4ef] text-[#5b5044] border border-[#eadfd3]",
        border: "border-[#eadfd3]",
        dot: "bg-[#c3b5a5]",
    },
    IN_PROGRESS: {
        label: "In Progress",
        description: "Zadanie jest aktualnie realizowane.",
        badge: "bg-amber-50 text-amber-800 border border-amber-200",
        border: "border-amber-200",
        dot: "bg-amber-500",
    },
    BLOCKED: {
        label: "Blocked",
        description:
            "Zadanie nie może być kontynuowane (np. brak danych, zależność od innego taska).",
        badge: "bg-rose-50 text-rose-800 border border-rose-200",
        border: "border-rose-200",
        dot: "bg-rose-500",
    },
    READY_FOR_REVIEW: {
        label: "Ready for Review",
        description: "Zadanie ukończone przez wykonawcę i gotowe do sprawdzenia.",
        badge: "bg-sky-50 text-sky-800 border border-sky-200",
        border: "border-sky-200",
        dot: "bg-sky-500",
    },
    IN_REVIEW: {
        label: "In Review",
        description: "Zadanie jest aktualnie sprawdzane (code review, QA, akceptacja).",
        badge: "bg-indigo-50 text-indigo-800 border border-indigo-200",
        border: "border-indigo-200",
        dot: "bg-indigo-500",
    },
    DONE: {
        label: "Done",
        description: "Zadanie zakończone i zaakceptowane.",
        badge: "bg-emerald-50 text-emerald-800 border border-emerald-200",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
    },
    REJECTED: {
        label: "Rejected",
        description: "Zadanie odrzucone (np. nie spełnia wymagań).",
        badge: "bg-orange-50 text-orange-800 border border-orange-200",
        border: "border-orange-200",
        dot: "bg-orange-500",
    },
    CANCELLED: {
        label: "Cancelled",
        description: "Zadanie anulowane – nie będzie realizowane.",
        badge: "bg-slate-50 text-slate-700 border border-slate-200",
        border: "border-slate-200",
        dot: "bg-slate-500",
    },
};

const categoryPalette = [
    "#f97316",
    "#0ea5e9",
    "#22c55e",
    "#a855f7",
    "#ef4444",
    "#eab308",
    "#6366f1",
    "#14b8a6",
] as const;

const defaultCategoryColor = categoryPalette[0];
const hexColorRegex = /^#(?:[0-9a-fA-F]{6})$/u;
const iconOptions = [
    { value: "grid", icon: LayoutGrid, label: "Układ" },
    { value: "target", icon: Crosshair, label: "Cel" },
    { value: "users", icon: Users, label: "Zespół" },
    { value: "briefcase", icon: BriefcaseBusiness, label: "Biznes" },
    { value: "activity", icon: Activity, label: "Praca" },
] as const;

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
const quillModules = {
    toolbar: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
    ],
};
const quillFormats = ["bold", "italic", "underline", "list"];

type CategorySortKey = "name" | "code" | "description" | "tasksCount";
type CategorySortDirection = "asc" | "desc";
type AiTarget = "description" | "guidelines";
type AiFormTarget = "create" | "edit";
type ProjectMemberSummary = {
    id: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    } | null;
};

const getTextColorForBg = (color: string) => {
    if (!hexColorRegex.test(color)) return "#1f1b16";
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65 ? "#1f1b16" : "#ffffff";
};

const getInitials = (value?: string | null) => {
    if (!value) return "•";
    const parts = value.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};



export default function ProjectBacklog() {
    const project = useProjectContext();
    const { locale } = useI18n();
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
    const [categories, setCategories] = useState<TaskCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [loadingSprints, setLoadingSprints] = useState(false);
    const [sprintsError, setSprintsError] = useState<string | null>(null);
    const [createSprintError, setCreateSprintError] = useState<string | null>(null);
    const [showCreateSprint, setShowCreateSprint] = useState(false);
    const [sprintAssignError, setSprintAssignError] = useState<string | null>(null);
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
    const [categorySort, setCategorySort] = useState<{
        key: CategorySortKey;
        direction: CategorySortDirection;
    }>({ key: "name", direction: "asc" });
    const [activeTab, setActiveTab] = useState<"tasks" | "categories" | "sprints">("tasks");
    const [tasksView, setTasksView] = useState<"list" | "pert">("list");
    const [createCategoryError, setCreateCategoryError] = useState<string | null>(null);
    const [showCreateCategory, setShowCreateCategory] = useState(false);
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [members, setMembers] = useState<ProjectMemberSummary[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [membersError, setMembersError] = useState<string | null>(null);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiTarget, setAiTarget] = useState<AiTarget>("description");
    const [aiFormTarget, setAiFormTarget] = useState<AiFormTarget>("create");
    const canManageTasks = (project.canManageTasks ?? project.canCreateTasks) === true;
    const canViewTasks = (project.canViewTasks ?? false) || canManageTasks;
    const canUseAi = project.canUseAi === true;

    const sortedCategories = useMemo(() => {
        const categoriesCopy = [...categories];
        const direction = categorySort.direction === "asc" ? 1 : -1;
        const getStringValue = (category: TaskCategory) => {
            if (categorySort.key === "code") return category.code ?? "";
            if (categorySort.key === "description") return category.description ?? "";
            return category.name ?? "";
        };

        categoriesCopy.sort((a, b) => {
            if (categorySort.key === "tasksCount") {
                return ((a.tasksCount ?? 0) - (b.tasksCount ?? 0)) * direction;
            }
            const valueA = getStringValue(a);
            const valueB = getStringValue(b);
            return valueA
                    .localeCompare(valueB, locale ?? undefined, { sensitivity: "base" })
                * direction;
        });

        return categoriesCopy;
    }, [categories, categorySort, locale]);

    const handleCategorySort = useCallback((key: CategorySortKey) => {
        setCategorySort((previous) => {
            if (previous.key === key) {
                return { key, direction: previous.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    }, []);

    const getCategorySortIcon = (key: CategorySortKey) => {
        if (categorySort.key === key) {
            return categorySort.direction === "asc" ? ChevronUp : ChevronDown;
        }
        return ChevronsUpDown;
    };

    const getCategoryAriaSort = (key: CategorySortKey) => {
        if (categorySort.key !== key) {
            return "none";
        }
        return categorySort.direction === "asc" ? "ascending" : "descending";
    };

    const categoryHeaderButtonClass =
        "flex w-full items-center justify-between gap-1 text-left text-sm font-semibold text-[#2a241f] transition hover:text-[#1f1b16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2a241f] focus-visible:outline-offset-2";
    const centeredHeaderButtonClass =
        "flex w-full items-center justify-center gap-1 text-sm font-semibold text-[#2a241f] transition hover:text-[#1f1b16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2a241f] focus-visible:outline-offset-2";

    const renderSortableHeader = (
        columnKey: CategorySortKey,
        label: string,
        buttonClass: string,
        thClassName = "px-4 py-3 text-left font-semibold",
    ) => {
        const SortIconComponent = getCategorySortIcon(columnKey);
        return (
            <th className={thClassName} aria-sort={getCategoryAriaSort(columnKey)}>
                <button type="button" className={buttonClass} onClick={() => handleCategorySort(columnKey)}>
                    <span>{label}</span>
                    <SortIconComponent className="h-3 w-3 text-[#8a7a6d]" aria-hidden="true" />
                </button>
            </th>
        );
    };

    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(locale, {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
        [locale],
    );

    const getAssigneeLabel = useCallback((task: ProjectTask) => {
        const user = task.assignedMember?.user;
        if (!user) return "Nieprzypisane";
        return user.name || user.email || "Nieznany";
    }, []);

    const getMemberLabel = useCallback((member: ProjectMemberSummary) => {
        const user = member.user;
        if (!user) return "Nieznany";
        return user.name || user.email || "Nieznany";
    }, []);

    const getCategoryLabel = useCallback((task: ProjectTask) => {
        if (!task.category) return "Brak";
        const code = task.category.code ? `${task.category.code}` : "";
        const name = task.category.name ? ` ${task.category.name}` : "";
        return `${code}${name}`.trim();
    }, []);

    const getIssueId = useCallback((task: ProjectTask) => {
        if (!task.category?.code || typeof task.taskNumber !== "number") return "-";
        return `${task.category.code}-${task.taskNumber}`;
    }, []);

    const getDependencyLabel = useCallback((task: ProjectTask) => {
        if (!task.dependentTask) return "Brak";
        const title = task.dependentTask.title || "Zadanie";
        const status = task.dependentTask.status
            ? ` (${statusConfig[task.dependentTask.status].label})`
            : "";
        return `${title}${status}`;
    }, []);

    const sanitizeRichText = useCallback((value: string) => {
        if (!value) return "";
        const parser = new DOMParser();
        const doc = parser.parseFromString(value, "text/html");
        const allowedTags = new Set(["B", "STRONG", "I", "EM", "U", "UL", "OL", "LI", "P", "BR", "DIV"]);
        const sanitizeNode = (node: Node) => {
            Array.from(node.childNodes).forEach((child) => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    const element = child as HTMLElement;
                    if (!allowedTags.has(element.tagName)) {
                        const fragment = document.createDocumentFragment();
                        while (element.firstChild) {
                            fragment.appendChild(element.firstChild);
                        }
                        element.replaceWith(fragment);
                        return;
                    }
                    Array.from(element.attributes).forEach((attr) => element.removeAttribute(attr.name));
                    sanitizeNode(element);
                }
            });
        };
        sanitizeNode(doc.body);
        return doc.body.innerHTML.trim();
    }, []);

    const getRichTextPlain = useCallback((value: string) => {
        if (!value) return "";
        const parser = new DOMParser();
        const doc = parser.parseFromString(value, "text/html");
        return (doc.body.textContent || "").trim();
    }, []);

    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!canViewTasks) {
            setTasks([]);
            setError("Brak uprawnień do przeglądania zadań.");
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`/api/project/${project.id}/tasks`);
            const payload = await response.json();
            if (!response.ok) {
                setError(payload?.message || "Nie udało się pobrać backlogu.");
                setTasks([]);
                return;
            }
            setTasks(Array.isArray(payload?.tasks) ? payload.tasks : []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Nie udało się pobrać backlogu.";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [canViewTasks, project.id]);

    const replaceTask = useCallback((updatedTask: ProjectTask) => {
        setTasks((prev) => {
            const exists = prev.some((task) => task.id === updatedTask.id);
            if (!exists) {
                return [updatedTask, ...prev];
            }
            return prev.map((task) => (task.id === updatedTask.id ? updatedTask : task));
        });
    }, []);

    const loadCategories = useCallback(async () => {
        setLoadingCategories(true);
        setCategoriesError(null);
        if (!canManageTasks) {
            setCategories([]);
            setCategoriesError("Brak uprawnień do kategorii zadań.");
            setLoadingCategories(false);
            return;
        }
        try {
            const response = await fetch(`/api/task-categories?projectId=${project.id}`);
            const payload = await response.json();
            if (!response.ok) {
                setCategories([]);
                setCategoriesError(payload?.message || "Nie udało się pobrać kategorii.");
                return;
            }
            const payloadCategories = Array.isArray(payload?.categories) ? payload.categories : [];
            const normalized = payloadCategories.map(
                (category: TaskCategory & { tasksCount?: number | null; color?: string | null }) => {
                    const color =
                        typeof category.color === "string" && hexColorRegex.test(category.color)
                            ? category.color
                            : defaultCategoryColor;
                    const tasksCount =
                        typeof category.tasksCount === "number" && Number.isFinite(category.tasksCount)
                            ? category.tasksCount
                            : 0;
                    return { ...category, color, tasksCount };
                },
            );
            setCategories(normalized);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Nie udało się pobrać kategorii.";
            setCategories([]);
            setCategoriesError(message);
        } finally {
            setLoadingCategories(false);
        }
    }, [canManageTasks, project.id]);

    const loadMembers = useCallback(async () => {
        setLoadingMembers(true);
        setMembersError(null);
        try {
            const response = await fetch(`/api/project/${project.id}/members`);
            const payload = await response.json();
            if (!response.ok) {
                setMembers([]);
                setMembersError(payload?.message || "Nie udalo sie pobrac czlonkow.");
                return;
            }
            setMembers(Array.isArray(payload?.members) ? payload.members : []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Nie udalo sie pobrac czlonkow.";
            setMembers([]);
            setMembersError(message);
        } finally {
            setLoadingMembers(false);
        }
    }, [project.id]);

    const loadSprints = useCallback(async () => {
        setLoadingSprints(true);
        setSprintsError(null);
        if (!canViewTasks) {
            setSprints([]);
            setSprintsError("Brak uprawnień do przeglądania sprintów.");
            setLoadingSprints(false);
            return;
        }
        try {
            const response = await fetch(`/api/project/${project.id}/sprints`);
            const payload = await response.json();
            if (!response.ok) {
                setSprints([]);
                setSprintsError(payload?.message || "Nie udało się pobrać sprintów.");
                return;
            }
            setSprints(Array.isArray(payload?.sprints) ? payload.sprints : []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Nie udało się pobrać sprintów.";
            setSprints([]);
            setSprintsError(message);
        } finally {
            setLoadingSprints(false);
        }
    }, [canViewTasks, project.id]);

    function hasSprintOverlap(startDate: Date, endDate: Date) {
        return sprints.some((sprint) => {
            const existingStart = new Date(sprint.startDate);
            const existingEnd = new Date(sprint.endDate);
            if (Number.isNaN(existingStart.getTime()) || Number.isNaN(existingEnd.getTime())) return false;
            return existingStart <= endDate && existingEnd >= startDate;
        });
    }

    const updateTaskSprint = useCallback(
        async (taskId: string, sprintId: string | null) => {
            if (!canManageTasks) {
                setSprintAssignError("Brak uprawnień do przypisywania sprintów.");
                return;
            }
            setSprintAssignError(null);
            try {
                const response = await fetch(`/api/project/${project.id}/tasks`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ taskId, sprintId }),
                });
                const payload = await response.json();
                if (!response.ok) {
                    setSprintAssignError(payload?.message || "Nie udało się przypisać sprintu.");
                    return;
                }
                const updated = payload?.task as ProjectTask | undefined;
                if (updated) {
                    replaceTask(updated);
                } else {
                    setTasks((prev) =>
                        prev.map((task) =>
                            task.id === taskId ? { ...task, sprintId } : task,
                        ),
                    );
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Nie udało się przypisać sprintu.";
                setSprintAssignError(message);
            }
        },
        [canManageTasks, project.id, replaceTask],
    );

    const handleDragStart = useCallback(
        (taskId: string, event: DragEvent<HTMLDivElement>) => {
            if (!canManageTasks) return;
            event.dataTransfer.setData("text/plain", taskId);
            event.dataTransfer.setData("application/x-task-id", taskId);
            event.dataTransfer.effectAllowed = "move";
            setDraggingTaskId(taskId);
        },
        [canManageTasks],
    );

    const handleDragEnd = useCallback(() => {
        setDraggingTaskId(null);
    }, []);

    const handleSprintDrop = useCallback(
        (sprintId: string | null, event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            const taskId =
                event.dataTransfer.getData("text/plain")
                || event.dataTransfer.getData("application/x-task-id");
            if (!taskId) return;
            void updateTaskSprint(taskId, sprintId);
            setDraggingTaskId(null);
        },
        [updateTaskSprint],
    );


    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    useEffect(() => {
        if (activeTab === "tasks") {
            loadTasks();
        }
        if (activeTab === "categories") {
            loadCategories();
        }
        if (activeTab === "sprints") {
            loadSprints();
            loadTasks();
        }
    }, [activeTab, loadCategories, loadSprints, loadTasks]);

    const toggleExpandedTask = useCallback((taskId: string) => {
        setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
    }, []);

    useEffect(() => {
        if (!showModal) return;
        setCreateError(null);
        setAiError(null);
        setShowAiModal(false);
        setAiPrompt("");
        setAiTarget("description");
        setAiFormTarget("create");
        void loadMembers();
    }, [loadMembers, showModal]);

    useEffect(() => {
        if (!showEditModal) return;
        setEditError(null);
        setAiError(null);
        setShowAiModal(false);
        setAiPrompt("");
        setAiTarget("description");
        setAiFormTarget("edit");
        void loadMembers();
    }, [loadMembers, showEditModal]);




    useEffect(() => {
        if (activeTab !== "sprints") return;
        setSprintAssignError(null);
    }, [activeTab]);

    const categoryForm = useFormik({
        initialValues: {
            name: "",
            code: "",
            description: "",
            color: defaultCategoryColor,
            icon: "",
        },
        validationSchema: Yup.object({
            name: Yup.string().trim().required("Nazwa jest wymagana."),
            code: Yup.string().trim().required("Kod jest wymagany."),
            description: Yup.string().trim(),
            color: Yup.string()
                .required("Kolor kategorii jest wymagany.")
                .matches(hexColorRegex, "Kolor kategorii jest wymagany."),
            icon: Yup.string().oneOf(["", ...iconOptions.map((option) => option.value)], "Nieprawidłowa ikona."),
        }),
        onSubmit: async (values, helpers) => {
            setCreateCategoryError(null);
            if (!canManageTasks) {
                helpers.setSubmitting(false);
                setCreateCategoryError("Brak uprawnień do tworzenia kategorii.");
                return;
            }
            try {
                const payload = {
                    name: values.name.trim(),
                    code: values.code.trim().toUpperCase(),
                    color: values.color.trim(),
                    description: values.description.trim() || null,
                    icon: values.icon || null,
                };
                const response = await fetch(`/api/task-categories?projectId=${project.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const json = await response.json();
                if (!response.ok) {
                    setCreateCategoryError(json?.message || "Nie udało się utworzyć kategorii.");
                    return;
                }
                const created = json?.category as TaskCategory | undefined;
                if (created) {
                    const normalized = {
                        ...created,
                        color: hexColorRegex.test(created.color) ? created.color : defaultCategoryColor,
                        tasksCount:
                            typeof created.tasksCount === "number" && Number.isFinite(created.tasksCount)
                                ? created.tasksCount
                                : 0,
                    };
                    setCategories((prev) => {
                        const merged = [normalized, ...prev.filter((category) => category.id !== normalized.id)];
                        return merged.sort((a, b) => a.name.localeCompare(b.name));
                    });
                }
                helpers.resetForm({
                    values: {
                        name: "",
                        code: "",
                        description: "",
                        color: defaultCategoryColor,
                        icon: "",
                    },
                });
                setShowCreateCategory(false);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Nie udało się utworzyć kategorii.";
                setCreateCategoryError(message);
            } finally {
                helpers.setSubmitting(false);
            }
        },
    });

    const sprintForm = useFormik({
        initialValues: {
            name: "",
            startDate: "",
            endDate: "",
        },
        validationSchema: Yup.object({
            name: Yup.string().trim().required("Nazwa sprintu jest wymagana.").max(120, "Nazwa jest za długa."),
            startDate: Yup.string().required("Data rozpoczęcia jest wymagana."),
            endDate: Yup.string()
                .required("Data zakończenia jest wymagana.")
                .test("after-start", "Data zakończenia musi być późniejsza od daty rozpoczęcia.", function (value) {
                    const startValue = this.parent.startDate as string | undefined;
                    if (!value || !startValue) return true;
                    const start = new Date(startValue);
                    const end = new Date(value);
                    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
                    return end >= start;
                }),
        }),
        onSubmit: async (values, helpers) => {
            setCreateSprintError(null);
            if (!canManageTasks) {
                helpers.setSubmitting(false);
                setCreateSprintError("Brak uprawnień do tworzenia sprintów.");
                return;
            }
            try {
                const start = new Date(values.startDate);
                const end = new Date(values.endDate);
                if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
                    if (hasSprintOverlap(start, end)) {
                        const message = "Daty sprintu nakładają się na istniejący sprint.";
                        helpers.setFieldError("startDate", message);
                        helpers.setFieldError("endDate", message);
                        setCreateSprintError(message);
                        return;
                    }
                }
                const payload = {
                    name: values.name.trim(),
                    startDate: values.startDate,
                    endDate: values.endDate,
                };
                const response = await fetch(`/api/project/${project.id}/sprints`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const json = await response.json();
                if (!response.ok) {
                    setCreateSprintError(json?.message || "Nie udało się utworzyć sprintu.");
                    return;
                }
                const created = json?.sprint as Sprint | undefined;
                if (created) {
                    setSprints((prev) => [created, ...prev]);
                }
                helpers.resetForm();
                setShowCreateSprint(false);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Nie udało się utworzyć sprintu.";
                setCreateSprintError(message);
            } finally {
                helpers.setSubmitting(false);
            }
        },
    });
    useEffect(() => {
        if (!showCreateSprint) return;
        setCreateSprintError(null);
    }, [showCreateSprint]);

    const toDateInputValue = useCallback((value: Date) => {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }, []);

    const setSprintEndDate = useCallback(
        (days: number) => {
            const startValue = sprintForm.values.startDate;
            if (!startValue) return;
            const start = new Date(startValue);
            if (Number.isNaN(start.getTime())) return;
            const end = new Date(start);
            end.setDate(end.getDate() + Math.max(days - 1, 0));
            sprintForm.setFieldValue("endDate", toDateInputValue(end), true);
        },
        [sprintForm, toDateInputValue],
    );

    const taskForm = useFormik({
        initialValues: {
            title: "",
            description: "",
            deliveryGuidelines: "",
            assignedMemberId: "",
            categoryCode: "",
        },
        validationSchema: Yup.object({
            title: Yup.string().trim().required("Tytuł jest wymagany.").max(120, "Tytuł jest za długi."),
            description: Yup.string()
                .trim()
                .test("description-length", "Opis jest za długi.", (value) => {
                    const plain = getRichTextPlain(value ?? "");
                    return plain.length <= 1000;
                }),
            deliveryGuidelines: Yup.string().trim().max(1000, "Wytyczne są za długie."),
            assignedMemberId: Yup.string().trim(),
            categoryCode: Yup.string().trim().required("Kategoria jest wymagana."),
        }),
        onSubmit: async (values, helpers) => {
            setCreateError(null);
            if (!canManageTasks) {
                helpers.setSubmitting(false);
                setCreateError("Brak uprawnień do tworzenia zadań.");
                return;
            }
            try {
                const sanitizedDescription = sanitizeRichText(values.description.trim());
                const payload = {
                    title: values.title.trim(),
                    description: sanitizedDescription || null,
                    deliveryGuidelines: values.deliveryGuidelines.trim() || null,
                    assignedMemberId: values.assignedMemberId.trim() || null,
                    categoryCode: values.categoryCode.trim().toUpperCase(),
                    status: "TODO" as TaskStatus,
                };
                const response = await fetch(`/api/project/${project.id}/tasks`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const json = await response.json();
                if (!response.ok) {
                    setCreateError(json?.message || "Nie udało się dodać zadania.");
                    return;
                }
                const created = json?.task as ProjectTask | undefined;
                if (created) {
                    setTasks((prev) => [created, ...prev]);
                }
                helpers.resetForm();
                setShowModal(false);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Nie udało się dodać zadania.";
                setCreateError(message);
            } finally {
                helpers.setSubmitting(false);
            }
        },
    });

    const editTaskForm = useFormik({
        enableReinitialize: true,
        initialValues: {
            title: editingTask?.title ?? "",
            description: editingTask?.description ?? "",
            categoryCode: editingTask?.category?.code ?? "",
            deliveryGuidelines: editingTask?.deliveryGuidelines ?? "",
            assignedMemberId: editingTask?.assignedMember?.id ?? "",
        },
        validationSchema: Yup.object({
            title: Yup.string().trim().required("Tytuł jest wymagany.").max(120, "Tytuł jest za długi."),
            description: Yup.string()
                .trim()
                .test("description-length", "Opis jest za długi.", (value) => {
                    const plain = getRichTextPlain(value ?? "");
                    return plain.length <= 1000;
                }),
            categoryCode: Yup.string().trim().required("Kategoria jest wymagana."),
            deliveryGuidelines: Yup.string().trim().max(1000, "Wytyczne są za długie."),
            assignedMemberId: Yup.string().trim(),
        }),
        onSubmit: async (values, helpers) => {
            setEditError(null);
            if (!canManageTasks || !editingTask) {
                helpers.setSubmitting(false);
                setEditError("Brak uprawnień do edycji zadań.");
                return;
            }
            try {
                const sanitizedDescription = sanitizeRichText(values.description.trim());
                const payload = {
                    taskId: editingTask.id,
                    title: values.title.trim(),
                    description: sanitizedDescription || null,
                    deliveryGuidelines: values.deliveryGuidelines.trim() || null,
                    assignedMemberId: values.assignedMemberId.trim() || null,
                    categoryCode: values.categoryCode.trim().toUpperCase(),
                };
                const response = await fetch(`/api/project/${project.id}/tasks`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const json = await response.json();
                if (!response.ok) {
                    setEditError(json?.message || "Nie udało się zaktualizować zadania.");
                    return;
                }
                const updated = json?.task as ProjectTask | undefined;
                if (updated) {
                    replaceTask(updated);
                }
                setShowEditModal(false);
                setEditingTask(null);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Nie udało się zaktualizować zadania.";
                setEditError(message);
            } finally {
                helpers.setSubmitting(false);
            }
        },
    });

    const formatAiDescription = useCallback((value: string) => {
        if (value.includes("<")) return value;
        const paragraphs = value
            .split(/\n{2,}/u)
            .map((entry) => entry.trim())
            .filter(Boolean)
            .map((entry) => `<p>${entry.replace(/\n/gu, "<br />")}</p>`);
        return paragraphs.length ? paragraphs.join("") : value;
    }, []);


    const openAiModal = useCallback(
        (target: AiTarget, formTarget: AiFormTarget) => {
            setAiError(null);
            setAiTarget(target);
            setAiFormTarget(formTarget);
            const form = formTarget === "edit" ? editTaskForm : taskForm;
            setAiPrompt(form.values.title || "");
            setShowAiModal(true);
        },
        [editTaskForm, taskForm],
    );

    const handleGenerateAiContent = useCallback(async () => {
        if (!canUseAi) {
            setAiError("Brak uprawnien do uzycia AI.");
            return;
        }
        if (!aiPrompt.trim()) {
            setAiError(
                aiTarget === "guidelines"
                    ? "Wpisz, co ma zawierac wytyczne."
                    : "Wpisz, co ma zawierac opis.",
            );
            return;
        }
        setAiError(null);
        setAiLoading(true);
        try {
            const response = await fetch("/api/project/tasks/describe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: project.id,
                    prompt: aiPrompt.trim(),
                    mode: aiTarget === "guidelines" ? "guidelines" : "description",
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                setAiError(payload?.message || "Nie udalo sie wygenerowac tekstu.");
                return;
            }
            if (typeof payload?.text === "string") {
                const targetForm = aiFormTarget === "edit" ? editTaskForm : taskForm;
                if (aiTarget === "description") {
                    targetForm.setFieldValue("description", formatAiDescription(payload.text));
                } else {
                    targetForm.setFieldValue("deliveryGuidelines", payload.text.trim());
                }
                setShowAiModal(false);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Nie udalo sie wygenerowac tekstu.";
            setAiError(message);
        } finally {
            setAiLoading(false);
        }
    }, [
        aiFormTarget,
        aiPrompt,
        aiTarget,
        canUseAi,
        editTaskForm,
        formatAiDescription,
        project.id,
        taskForm,
    ]);

    const selectedCreateCategory = useMemo(
        () => categories.find((category) => category.code === taskForm.values.categoryCode) ?? null,
        [categories, taskForm.values.categoryCode],
    );

    const selectedEditCategory = useMemo(
        () => categories.find((category) => category.code === editTaskForm.values.categoryCode) ?? null,
        [categories, editTaskForm.values.categoryCode],
    );

    const handleDeleteCategory = useCallback(
        async (categoryId: string) => {
            if (!canManageTasks) return;
            setCreateCategoryError(null);
            setDeletingCategoryId(categoryId);
            try {
                const response = await fetch(
                    `/api/task-categories?projectId=${project.id}&categoryId=${categoryId}`,
                    { method: "DELETE" },
                );
                const payload = await response.json();
                if (!response.ok) {
                    setCreateCategoryError(payload?.message || "Nie udało się usunąć kategorii.");
                    return;
                }
                setCategories((prev) => prev.filter((category) => category.id !== categoryId));
            } catch (err) {
                const message = err instanceof Error ? err.message : "Nie udało się usunąć kategorii.";
                setCreateCategoryError(message);
            } finally {
                setDeletingCategoryId(null);
            }
        },
        [canManageTasks, project.id],
    );

    const orderedTasks = useMemo(() => {
        const order: TaskStatus[] = [
            "TODO",
            "IN_PROGRESS",
            "BLOCKED",
            "READY_FOR_REVIEW",
            "IN_REVIEW",
            "DONE",
            "REJECTED",
            "CANCELLED",
        ];
        return [...tasks].sort((a, b) => {
            const byStatus = order.indexOf(a.status) - order.indexOf(b.status);
            if (byStatus !== 0) return byStatus;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    }, [tasks]);

    const tasksBySprintId = useMemo(() => {
        const map = new Map<string, ProjectTask[]>();
        orderedTasks.forEach((task) => {
            const key = task.sprintId ?? "unassigned";
            const group = map.get(key) ?? [];
            group.push(task);
            map.set(key, group);
        });
        return map;
    }, [orderedTasks]);

    const unassignedTasks = useMemo(
        () => tasksBySprintId.get("unassigned") ?? [],
        [tasksBySprintId],
    );

    const isSprintActive = useCallback((sprint: Sprint) => {
        const now = new Date();
        const start = new Date(sprint.startDate);
        const end = new Date(sprint.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
        return now >= start && now <= end;
    }, []);

    const tabs = [
        { key: "tasks" as const, label: "Pełny backlog", icon: ListChecks },
        { key: "categories" as const, label: "Kategorie", icon: Tags },
        { key: "sprints" as const, label: "Sprinty", icon: Activity },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#e5ddd1] pb-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`group relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                                isActive ? "text-[#1f1b16]" : "text-[#7a6c5f] hover:text-[#2a241f]"
                            }`}
                        >
              <span
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
                      isActive ? "bg-[#f2ede5] text-[#1f1b16]" : "bg-transparent text-[#8a7a6d] group-hover:text-[#2a241f]"
                  }`}
              >
                <Icon className="h-4 w-4" />
              </span>
                            <span className="relative">
                {tab.label}
                                {isActive ? (
                                    <span className="absolute inset-x-0 bottom-[-8px] h-[2px] rounded-full bg-[#2a241f]" />
                                ) : null}
              </span>
                        </button>
                    );
                })}
            </div>

            <div className="rounded-3xl border border-[#e1d7cb] bg-white/80 p-6 shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
                            {activeTab === "tasks"
                                ? "Pełny backlog"
                                : activeTab === "categories"
                                    ? "Kategorie"
                                    : "Sprinty"}
                        </p>
                        <h1 className="text-2xl font-semibold text-[#1f1b16]">
                            {activeTab === "tasks"
                                ? "Zarządzaj backlogiem"
                                : activeTab === "categories"
                                    ? "Zarządzaj kategoriami"
                                    : "Planowanie sprintów"}
                        </h1>
                        <p className="text-sm text-[#6f6255]">
                            {activeTab === "tasks"
                                ? "Dodawaj zadania i porządkuj backlog w jednym miejscu, bez potrzeby odświeżania widoku."
                                : activeTab === "categories"
                                    ? "Dodawaj i porządkuj kategorie zadań oraz ich kolory w jednym miejscu."
                                    : "Ustalaj zakres i cele sprintów oraz kontroluj postęp pracy zespołu."}
                        </p>
                    </div>
                    {activeTab === "tasks" && canManageTasks ? (
                        <button
                            type="button"
                            onClick={() => {
                                setCreateError(null);
                                taskForm.resetForm();
                                setShowModal(true);
                            }}
                            disabled={!canManageTasks}
                            className="rounded-full bg-[#2a241f] px-4 py-2 text-sm font-semibold text-[#f6efe8] shadow-[0_14px_35px_-18px_rgba(30,20,10,0.55)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_40px_-18px_rgba(30,20,10,0.55)] disabled:cursor-not-allowed disabled:bg-[#c3b5a5] cursor-pointer"
                        >
                            Dodaj zadanie
                        </button>
                    ) : null}
                </div>

                {activeTab === "tasks" ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-[#f8f4ef] px-3 py-2 text-sm text-[#5b5044]">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7762]">Widok backlogu:</span>
                        {[
                            { key: "list" as const, label: "Lista" },
                            { key: "pert" as const, label: "PERT diagram" },
                        ].map((view) => (
                            <button
                                key={view.key}
                                type="button"
                                onClick={() => setTasksView(view.key)}
                                className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-semibold transition ${
                                    tasksView === view.key
                                        ? "border-[#2a241f] bg-white text-[#2a241f] shadow-sm"
                                        : "border-transparent bg-transparent text-[#5b5044] hover:border-[#d7c8b7] hover:bg-white"
                                }`}
                            >
                                {view.label}
                            </button>
                        ))}
                    </div>
                ) : null}

                {activeTab === "tasks" && error ? (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                        {error}
                    </div>
                ) : null}

                {activeTab === "tasks" ? (
                    tasksView === "list" ? (
                        <div className="mt-6">
                            {loading ? (
                                <p className="text-sm text-[#6f6255]">Ładuję zadania...</p>
                            ) : orderedTasks.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6f6255]">
                                    Brak zadań w backlogu.
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-[#eadfd3] bg-white shadow-[0_12px_28px_-26px_rgba(20,14,8,0.55)]">

                                    <table className="w-full text-sm text-[#2a241f] table-fixed">

                                        <thead className="bg-[#f4efe8] text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f6255]">

                                        <tr>

                                            <th className="w-28 px-4 py-3 text-left font-semibold">Issue ID</th>

                                            <th className="px-4 py-3 text-left font-semibold">Tytuł</th>

                                            <th className="w-36 px-4 py-3 text-left font-semibold">Status</th>

                                            <th className="w-48 px-4 py-3 text-left font-semibold">Przypisany</th>

                                        </tr>

                                        </thead>

                                        <tbody>

                                        {orderedTasks.map((task, index) => {
                                            const isExpanded = expandedTaskId === task.id;
                                            const isLast = index === orderedTasks.length - 1;
                                            const categoryColor = task.category?.color || defaultCategoryColor;
                                            const badgeBg =
                                                task.category && hexColorRegex.test(categoryColor) ? `${categoryColor}1a` : "transparent";
                                            return (
                                                <Fragment key={task.id}>
                                                    <motion.tr
                                                        layout
                                                        initial={false}
                                                        className={`align-middle hover:bg-[#fdfaf5] ${!isExpanded && !isLast ? "border-b border-[#f0e6d8]" : ""} ${
                                                            isExpanded ? "bg-[#fdfaf5]" : ""
                                                        } cursor-pointer`}
                                                        onClick={() => toggleExpandedTask(task.id)}
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-expanded={isExpanded}
                                                        onKeyDown={(event) => {
                                                            if (event.key === "Enter" || event.key === " ") {
                                                                event.preventDefault();
                                                                toggleExpandedTask(task.id);
                                                            }
                                                        }}
                                                    >
                                                        <td className="px-4 py-3 text-sm font-semibold text-[#2a241f] whitespace-nowrap">
                                                            {task.category ? (
                                                                <span
                                                                    className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                                                                    style={{
                                                                        borderColor: categoryColor,
                                                                        backgroundColor: badgeBg,
                                                                        color: categoryColor,
                                                                    }}
                                                                >
                                  {task.category.code}-{typeof task.taskNumber === "number" ? task.taskNumber : "—"}
                                </span>
                                                            ) : (
                                                                <span className="text-[#8a7762]">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-base font-semibold text-[#1f1b16]">{task.title}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                              <span
                                  className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusConfig[task.status].badge}`}
                              >
                                {statusConfig[task.status].label}
                              </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {task.assignedMember?.user ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="h-7 w-7 border border-[#eadfd3] bg-white">
                                                                        {task.assignedMember.user.image ? (
                                                                            <AvatarImage
                                                                                src={task.assignedMember.user.image}
                                                                                alt={task.assignedMember.user.name || task.assignedMember.user.email || "user"}
                                                                            />
                                                                        ) : null}
                                                                        <AvatarFallback className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                                                                            {getInitials(task.assignedMember.user.name || task.assignedMember.user.email)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-sm font-semibold text-[#2a241f]">
                                    {task.assignedMember.user.name || task.assignedMember.user.email}
                                  </span>
                                                                </div>
                                                            ) : (
                                                                <span className="rounded-full border border-dashed border-[#eadfd3] px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8a7762]">
                                  Nieprzypisane
                                </span>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                    <tr className={isExpanded ? "" : "border-t-0"}>
                                                        <td colSpan={4} className="bg-[#fcf8f2]/90 px-0 text-sm text-[#6f6255]">
                                                            <motion.div
                                                                className="overflow-hidden border-t border-[#eadfd3] px-4"
                                                                initial={false}
                                                                animate={{
                                                                    height: isExpanded ? "auto" : 0,
                                                                    opacity: isExpanded ? 1 : 0,
                                                                }}
                                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                                aria-hidden={!isExpanded}
                                                            >
                                                                <div className="space-y-3 py-3 leading-relaxed text-sm">
                                                                    <div className="grid gap-3 text-sm text-[#5b5044] sm:grid-cols-2 lg:grid-cols-4">
                                                                        <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                        Kategoria
                                      </span>
                                                                            <span className="font-semibold text-[#1f1b16]">
                                        {getCategoryLabel(task)}
                                      </span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                        Status
                                      </span>
                                                                            <span className="font-semibold text-[#1f1b16]">
                                        {statusConfig[task.status].label}
                                      </span>
                                                                            <span className="text-xs text-[#6f6255]">
                                        {statusConfig[task.status].description}
                                      </span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                        Przypisany
                                      </span>
                                                                            <span className="font-semibold text-[#1f1b16]">
                                        {getAssigneeLabel(task)}
                                      </span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                        Termin
                                      </span>
                                                                            <span className="font-semibold text-[#1f1b16]">
                                        {task.deadline ? dateFormatter.format(new Date(task.deadline)) : "Brak"}
                                      </span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                        Zależność
                                      </span>
                                                                            <span className="font-semibold text-[#1f1b16]">
                                        {getDependencyLabel(task)}
                                      </span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                        Utworzono
                                      </span>
                                                                            <span className="font-semibold text-[#1f1b16]">
                                        {dateFormatter.format(new Date(task.createdAt))}
                                      </span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                        Zaktualizowano
                                      </span>
                                                                            <span className="font-semibold text-[#1f1b16]">
                                        {dateFormatter.format(new Date(task.updatedAt))}
                                      </span>
                                                                        </div>
                                                                    </div>
                                                                    {canManageTasks ? (
                                                                        <div className="pt-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setEditingTask(task);
                                                                                    setShowEditModal(true);
                                                                                }}
                                                                                className="inline-flex items-center rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2a241f] transition hover:border-[#2a241f] cursor-pointer"
                                                                            >
                                                                                Edytuj zadanie
                                                                            </button>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                </Fragment>
                                            );
                                        })}

                                        </tbody>

                                    </table>

                                </div>
                            )}
                        </div>
                    ) : (
                        <PertDiagram
                            tasks={tasks}
                            canManageTasks={canManageTasks}
                            projectId={project.id}
                            onTaskUpdate={replaceTask}
                            onReload={loadTasks}
                            loading={loading}
                        />
                    )
                ) : activeTab === "categories" ? (
                    <div className="mt-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">Kategorie</p>
                                <h3 className="text-lg font-semibold text-[#1f1b16]">Zarządzaj kategoriami</h3>
                            </div>
                            {canManageTasks ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreateCategoryError(null);
                                        categoryForm.resetForm();
                                        setShowCreateCategory(true);
                                    }}
                                    className="cursor-pointer rounded-full border border-[#eadfd3] bg-white px-4 py-2 text-sm font-semibold text-[#2a241f] shadow-sm transition hover:border-[#2a241f]"
                                >
                                    Utwórz nową kategorię
                                </button>
                            ) : (
                                <span className="rounded-full border border-[#eadfd3] bg-[#f8f4ef] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                Brak uprawnień
              </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            {categoriesError ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                                    {categoriesError}
                                </div>
                            ) : null}
                            {!showCreateCategory && createCategoryError ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                                    {createCategoryError}
                                </div>
                            ) : null}
                            {loadingCategories ? (
                                <p className="text-sm text-[#6f6255]">Ładuję kategorie...</p>
                            ) : categories.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6f6255]">
                                    Brak kategorii zadań.
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-[#eadfd3] bg-white shadow-sm">
                                    <table className="min-w-full text-sm text-[#2a241f]">
                                        <thead className="bg-[#f8f4ef] text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6f6255]">
                                        <tr>
                                            {renderSortableHeader("name", "Kategoria", categoryHeaderButtonClass)}
                                            {renderSortableHeader("code", "Kod", categoryHeaderButtonClass)}
                                            <th className="px-4 py-3 text-left font-semibold">Kolor / Ikona</th>
                                            {renderSortableHeader("description", "Opis", categoryHeaderButtonClass)}
                                            {renderSortableHeader(
                                                "tasksCount",
                                                "Zadania",
                                                centeredHeaderButtonClass,
                                                "px-4 py-3 text-center font-semibold",
                                            )}
                                            {canManageTasks ? <th className="px-4 py-3 text-right font-semibold">Akcje</th> : null}
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#f0e6d8]">
                                        {sortedCategories.map((category) => {
                                            const color = category.color || defaultCategoryColor;
                                            const tasksCount = category.tasksCount ?? 0;
                                            const canDeleteCategory = canManageTasks && tasksCount === 0;
                                            return (
                                                <tr key={category.id} className="align-middle hover:bg-[#fdfaf5]">
                                                    <td className="px-4 py-3 font-semibold text-[#1f1b16]">{category.name}</td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#7a6c5f]">
                                                        {category.code}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                <span
                                    className="h-3 w-3 rounded-full border border-[#d7c8b7]"
                                    style={{ backgroundColor: color }}
                                />
                                                            {category.icon ? (
                                                                (() => {
                                                                    const iconMatch = iconOptions.find((option) => option.value === category.icon);
                                                                    if (!iconMatch) return null;
                                                                    const Icon = iconMatch.icon;
                                                                    return <Icon className="h-4 w-4 text-[#4a4037]" />;
                                                                })()
                                                            ) : (
                                                                <span className="text-xs text-[#a08f7f]">brak</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm leading-relaxed text-[#4a4037]">
                                                        {category.description ? (
                                                            <span className="line-clamp-2">{category.description}</span>
                                                        ) : (
                                                            <span className="text-[#b1a394]">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                                                        {tasksCount}
                                                    </td>
                                                    {canManageTasks ? (
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => canDeleteCategory && handleDeleteCategory(category.id)}
                                                                disabled={!canDeleteCategory || deletingCategoryId === category.id}
                                                                className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2a241f] transition hover:border-[#2a241f] disabled:cursor-not-allowed disabled:opacity-70"
                                                            >
                                                                {deletingCategoryId === category.id ? "Usuwam..." : "Usuń"}
                                                            </button>
                                                        </td>
                                                    ) : null}
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">Sprinty</p>
                                <h3 className="text-lg font-semibold text-[#1f1b16]">Zarządzaj sprintami</h3>
                            </div>
                            {canManageTasks ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreateSprintError(null);
                                        if (showCreateSprint) {
                                            sprintForm.resetForm();
                                        }
                                        setShowCreateSprint((prev) => !prev);
                                    }}
                                    className="cursor-pointer rounded-full border border-[#eadfd3] bg-white px-4 py-2 text-sm font-semibold text-[#2a241f] shadow-sm transition hover:border-[#2a241f]"
                                >
                                    {showCreateSprint ? "Ukryj formularz" : "Dodaj sprint"}
                                </button>
                            ) : (
                                <span className="rounded-full border border-[#eadfd3] bg-[#f8f4ef] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                Brak uprawnień
              </span>
                            )}
                        </div>

                        {showCreateSprint ? (
                            <form
                                onSubmit={sprintForm.handleSubmit}
                                className="space-y-4 rounded-2xl border border-[#eadfd3] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(30,20,10,0.55)]"
                                noValidate
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
                                            Nowy sprint
                                        </p>
                                        <h4 className="text-lg font-semibold text-[#1f1b16]">Dodaj sprint do projektu</h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateSprint(false);
                                            setCreateSprintError(null);
                                            sprintForm.resetForm();
                                        }}
                                        className="cursor-pointer rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-sm text-[#5b5044] transition hover:border-[#2a241f]"
                                    >
                                        Zamknij
                                    </button>
                                </div>

                                {createSprintError ? (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                                        {createSprintError}
                                    </div>
                                ) : null}

                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="space-y-2 text-sm font-semibold text-[#2a241f]">
                                        Nazwa sprintu *
                                        <input
                                            name="name"
                                            type="text"
                                            value={sprintForm.values.name}
                                            onChange={sprintForm.handleChange}
                                            onBlur={sprintForm.handleBlur}
                                            className="w-full rounded-xl border border-[#eadfd3] bg-white px-3 py-2 text-sm font-normal text-[#1f1b16] shadow-sm focus:border-[#2a241f] focus:outline-none"
                                            placeholder="Np. Sprint 5"
                                        />
                                        {sprintForm.touched.name && sprintForm.errors.name ? (
                                            <span className="text-xs font-semibold text-rose-700">{sprintForm.errors.name}</span>
                                        ) : null}
                                    </label>


                                    <label className="space-y-2 text-sm font-semibold text-[#2a241f]">
                                        Data rozpoczęcia *
                                        <input
                                            name="startDate"
                                            type="date"
                                            value={sprintForm.values.startDate}
                                            onChange={sprintForm.handleChange}
                                            onBlur={sprintForm.handleBlur}
                                            className="w-full rounded-xl border border-[#eadfd3] bg-white px-3 py-2 text-sm font-normal text-[#1f1b16] shadow-sm focus:border-[#2a241f] focus:outline-none"
                                        />
                                        {sprintForm.touched.startDate && sprintForm.errors.startDate ? (
                                            <span className="text-xs font-semibold text-rose-700">{sprintForm.errors.startDate}</span>
                                        ) : null}
                                    </label>

                                    <label className="space-y-2 text-sm font-semibold text-[#2a241f]">
                                        Data zakończenia *
                                        <input
                                            name="endDate"
                                            type="date"
                                            value={sprintForm.values.endDate}
                                            onChange={sprintForm.handleChange}
                                            onBlur={sprintForm.handleBlur}
                                            className="w-full rounded-xl border border-[#eadfd3] bg-white px-3 py-2 text-sm font-normal text-[#1f1b16] shadow-sm focus:border-[#2a241f] focus:outline-none"
                                        />
                                        {sprintForm.touched.endDate && sprintForm.errors.endDate ? (
                                            <span className="text-xs font-semibold text-rose-700">{sprintForm.errors.endDate}</span>
                                        ) : null}
                                    </label>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6f6255]">
                <span className="font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                  Długość sprintu
                </span>
                                    {[5, 7, 14].map((days) => {
                                        const startValue = sprintForm.values.startDate;
                                        const start = startValue ? new Date(startValue) : null;
                                        const isValidStart = !!start && !Number.isNaN(start.getTime());
                                        return (
                                            <button
                                                key={days}
                                                type="button"
                                                disabled={!isValidStart}
                                                onClick={() => setSprintEndDate(days)}
                                                className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2a241f] transition hover:border-[#2a241f] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {days} dni
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex flex-wrap items-center justify-end gap-3">
                                    <button
                                        type="submit"
                                        disabled={sprintForm.isSubmitting || !canManageTasks}
                                        className="rounded-full bg-[#2a241f] px-4 py-2 text-sm font-semibold text-[#f6efe8] shadow-[0_14px_35px_-18px_rgba(30,20,10,0.55)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_40px_-18px_rgba(30,20,10,0.55)] disabled:cursor-not-allowed disabled:bg-[#c3b5a5] cursor-pointer"
                                    >
                                        {sprintForm.isSubmitting ? "Tworzę..." : "Utwórz sprint"}
                                    </button>
                                </div>
                            </form>
                        ) : null}

                        <div className="space-y-3">
                            {!showCreateSprint && createSprintError ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                                    {createSprintError}
                                </div>
                            ) : null}
                            {sprintAssignError ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                                    {sprintAssignError}
                                </div>
                            ) : null}
                            {sprintsError ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                                    {sprintsError}
                                </div>
                            ) : null}
                            {loadingSprints ? (
                                <p className="text-sm text-[#6f6255]">Ładuję sprinty...</p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-dashed border-[#eadfd3] bg-[#fcf8f2] px-3 py-2 text-sm text-[#5b5044]">
                                        Przeciągnij zadania, aby przypisać je do sprintów. Aby zdjąć z sprintu, upuść w sekcji "Backlog bez sprintu".
                                    </div>

                                    <div
                                        className={`rounded-2xl border border-[#eadfd3] bg-white p-4 shadow-sm ${
                                            draggingTaskId ? "ring-2 ring-[#eadfd3]" : ""
                                        }`}
                                        onDragOver={(event) => {
                                            if (!canManageTasks) return;
                                            event.preventDefault();
                                            event.dataTransfer.dropEffect = "move";
                                        }}
                                        onDrop={(event) => handleSprintDrop(null, event)}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                                    Backlog bez sprintu
                                                </p>
                                                <h4 className="text-base font-semibold text-[#1f1b16]">Nieprzypisane zadania</h4>
                                            </div>
                                            <span className="rounded-full border border-[#eadfd3] bg-[#f8f4ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                      {unassignedTasks.length}
                    </span>
                                        </div>

                                        <div
                                            className="mt-4 space-y-2"
                                            onDragOver={(event) => {
                                                if (!canManageTasks) return;
                                                event.preventDefault();
                                                event.dataTransfer.dropEffect = "move";
                                            }}
                                            onDrop={(event) => handleSprintDrop(null, event)}
                                        >
                                            {unassignedTasks.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6f6255]">
                                                    Brak zadań do przypisania.
                                                </div>
                                            ) : (
                                                unassignedTasks.map((task) => {
                                                    const isDragging = draggingTaskId === task.id;
                                                    return (
                                                        <div
                                                            key={task.id}
                                                            draggable={canManageTasks}
                                                            onDragStart={(event) => handleDragStart(task.id, event)}
                                                            onDragEnd={handleDragEnd}
                                                            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#2a241f] shadow-sm transition ${
                                                                canManageTasks ? "cursor-grab hover:border-[#2a241f]" : "cursor-default"
                                                            } ${isDragging ? "opacity-60" : ""}`}
                                                        >
                                                            <div>
                                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                                                    {getIssueId(task)}
                                                                </p>
                                                                <p className="text-sm font-semibold text-[#1f1b16]">{task.title}</p>
                                                            </div>
                                                            <span
                                                                className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusConfig[task.status].badge}`}
                                                            >
                              {statusConfig[task.status].label}
                            </span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {sprints.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6f6255]">
                                            Brak sprintów do wyświetlenia. Dodaj pierwszy sprint, aby rozpocząć planowanie pracy.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {sprints.map((sprint) => {
                                                const sprintTasks = tasksBySprintId.get(sprint.id) ?? [];
                                                return (
                                                    <div
                                                        key={sprint.id}
                                                        className={`rounded-2xl border p-4 shadow-sm ${
                                                            isSprintActive(sprint)
                                                                ? "border-emerald-300 bg-emerald-50/60"
                                                                : "border-[#eadfd3] bg-white"
                                                        } ${draggingTaskId ? "ring-1 ring-[#eadfd3]" : ""}`}
                                                        onDragOver={(event) => {
                                                            if (!canManageTasks) return;
                                                            event.preventDefault();
                                                            event.dataTransfer.dropEffect = "move";
                                                        }}
                                                        onDrop={(event) => handleSprintDrop(sprint.id, event)}
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div>
                                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                                                    Sprint {sprint.sprintNumber}
                                                                </p>
                                                                <h4 className="text-base font-semibold text-[#1f1b16]">{sprint.name}</h4>
                                                                <p className="text-xs text-[#5b5044]">
                                                                    {dateFormatter.format(new Date(sprint.startDate))} -{" "}
                                                                    {dateFormatter.format(new Date(sprint.endDate))}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isSprintActive(sprint) ? (
                                                                    <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                                  Trwający
                                </span>
                                                                ) : null}
                                                                <span className="rounded-full border border-[#eadfd3] bg-[#f8f4ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                {sprintTasks.length}
                              </span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 space-y-2">
                                                            {sprintTasks.length === 0 ? (
                                                                <div className="rounded-xl border border-dashed border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6f6255]">
                                                                    Brak zadań w sprincie.
                                                                </div>
                                                            ) : (
                                                                sprintTasks.map((task) => {
                                                                    const isDragging = draggingTaskId === task.id;
                                                                    return (
                                                                        <div
                                                                            key={task.id}
                                                                            draggable={canManageTasks}
                                                                            onDragStart={(event) => handleDragStart(task.id, event)}
                                                                            onDragEnd={handleDragEnd}
                                                                            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#2a241f] shadow-sm transition ${
                                                                                canManageTasks ? "cursor-grab hover:border-[#2a241f]" : "cursor-default"
                                                                            } ${isDragging ? "opacity-60" : ""}`}
                                                                        >
                                                                            <div>
                                                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                                                                    {getIssueId(task)}
                                                                                </p>
                                                                                <p className="text-sm font-semibold text-[#1f1b16]">{task.title}</p>
                                                                            </div>
                                                                            <span
                                                                                className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusConfig[task.status].badge}`}
                                                                            >
                                      {statusConfig[task.status].label}
                                    </span>
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {showCreateCategory ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => {
                        setShowCreateCategory(false);
                        setCreateCategoryError(null);
                        categoryForm.resetForm();
                    }}
                >
                    <form
                        className="w-full max-w-xl rounded-2xl border border-[#eadfd3] bg-white p-6 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.45)]"
                        onClick={(event) => event.stopPropagation()}
                        onSubmit={categoryForm.handleSubmit}
                        noValidate
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">Nowa kategoria</p>
                                <h2 className="text-xl font-semibold text-[#1f1b16]">Dodaj kategorię</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateCategory(false);
                                    setCreateCategoryError(null);
                                    categoryForm.resetForm();
                                }}
                                className="cursor-pointer rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-sm text-[#5b5044] transition hover:border-[#2a241f]"
                            >
                                Zamknij
                            </button>
                        </div>

                        {createCategoryError ? (
                            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                                {createCategoryError}
                            </div>
                        ) : null}

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]" htmlFor="newCategoryName">
                                    Nazwa *
                                </label>
                                <input
                                    id="newCategoryName"
                                    name="name"
                                    value={categoryForm.values.name}
                                    onChange={categoryForm.handleChange}
                                    placeholder="Np. Architektura"
                                    className="w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                                />
                                {categoryForm.touched.name && categoryForm.errors.name ? (
                                    <p className="text-xs text-rose-700">{categoryForm.errors.name}</p>
                                ) : null}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]" htmlFor="newCategoryCode">
                                    Kod *
                                </label>
                                <input
                                    id="newCategoryCode"
                                    name="code"
                                    value={categoryForm.values.code}
                                    onChange={(e) => categoryForm.setFieldValue("code", e.target.value.toUpperCase())}
                                    placeholder="Np. UX"
                                    className="w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                                />
                                {categoryForm.touched.code && categoryForm.errors.code ? (
                                    <p className="text-xs text-rose-700">{categoryForm.errors.code}</p>
                                ) : null}
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]" htmlFor="newCategoryDescription">
                                Opis
                            </label>
                            <textarea
                                id="newCategoryDescription"
                                name="description"
                                value={categoryForm.values.description}
                                onChange={categoryForm.handleChange}
                                rows={3}
                                placeholder="Krótki opis kategorii"
                                className="w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                            />
                            {categoryForm.touched.description && categoryForm.errors.description ? (
                                <p className="text-xs text-rose-700">{categoryForm.errors.description}</p>
                            ) : null}
                        </div>
                        <div className="mt-3 space-y-2">
                            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">Kolor</label>
                            <div className="flex flex-wrap items-center gap-2">
                                {categoryPalette.map((colorOption) => (
                                    <button
                                        key={colorOption}
                                        type="button"
                                        onClick={() => categoryForm.setFieldValue("color", colorOption)}
                                        className={`h-9 w-9 rounded-full border transition hover:scale-105 cursor-pointer ${
                                            categoryForm.values.color === colorOption ? "ring-2 ring-offset-2 ring-[#2a241f]" : ""
                                        }`}
                                        style={{ backgroundColor: colorOption, borderColor: colorOption }}
                                        aria-label={`Wybierz kolor ${colorOption}`}
                                    />
                                ))}
                                <label className="flex items-center gap-2 rounded-full border border-[#d7c8b7] bg-white px-3 py-1 text-xs font-semibold text-[#5b5044] shadow-sm">
                                    <input
                                        type="color"
                                        name="color"
                                        value={categoryForm.values.color}
                                        onChange={(e) => categoryForm.setFieldValue("color", e.target.value)}
                                        className="h-7 w-7 cursor-pointer rounded border border-[#eadfd3] bg-transparent p-0"
                                    />
                                    <span>Własny kolor</span>
                                </label>
                                <span className="text-xs text-[#6f6255]">Wybrano: {categoryForm.values.color}</span>
                            </div>
                            {categoryForm.touched.color && categoryForm.errors.color ? (
                                <p className="text-xs text-rose-700">{categoryForm.errors.color}</p>
                            ) : null}
                        </div>
                        <div className="mt-3 space-y-2">
                            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                Ikona (opcjonalnie)
                            </label>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                <button
                                    type="button"
                                    onClick={() => categoryForm.setFieldValue("icon", "")}
                                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                                        categoryForm.values.icon === ""
                                            ? "border-[#2a241f] bg-[#f8f4ef] font-semibold text-[#2a241f]"
                                            : "border-[#d7c8b7] bg-white text-[#2a241f]"
                                    }`}
                                >
                                    Brak ikony
                                </button>
                                {iconOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isActive = categoryForm.values.icon === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => categoryForm.setFieldValue("icon", option.value)}
                                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                                                isActive
                                                    ? "border-[#2a241f] bg-[#f3f8ff] font-semibold text-[#2a241f]"
                                                    : "border-[#d7c8b7] bg-white text-[#2a241f] hover:border-[#2a241f]"
                                            }`}
                                        >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#eadfd3] bg-white text-[#2a241f]">
                        <Icon className="h-5 w-5" />
                      </span>
                                            <span className="text-left">{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {categoryForm.touched.icon && categoryForm.errors.icon ? (
                                <p className="text-xs text-rose-700">{categoryForm.errors.icon}</p>
                            ) : null}
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateCategory(false);
                                    setCreateCategoryError(null);
                                    categoryForm.resetForm();
                                }}
                                className="cursor-pointer rounded-full border border-[#eadfd3] bg-white px-4 py-2 text-sm font-semibold text-[#5b5044] shadow-sm transition hover:border-[#2a241f]"
                            >
                                Anuluj
                            </button>
                            <button
                                type="submit"
                                disabled={categoryForm.isSubmitting}
                                className="rounded-full bg-[#2a241f] px-4 py-2 text-sm font-semibold text-[#f6efe8] shadow-[0_14px_35px_-18px_rgba(30,20,10,0.55)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_40px_-18px_rgba(30,20,10,0.55)] disabled:cursor-not-allowed disabled:bg-[#c3b5a5] cursor-pointer"
                            >
                                {categoryForm.isSubmitting ? "Dodaję..." : "Dodaj kategorię"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {showModal ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="w-full max-w-xl rounded-2xl border border-[#eadfd3] bg-white p-6 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.45)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">Nowe zadanie</p>
                                <h2 className="text-xl font-semibold text-[#1f1b16]">Dodaj do backlogu</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-sm text-[#5b5044] transition hover:border-[#2a241f] cursor-pointer"
                            >
                                Zamknij
                            </button>
                        </div>
                        {createError ? (
                            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                                {createError}
                            </div>
                        ) : null}

                        <form className="mt-4 space-y-3" onSubmit={taskForm.handleSubmit}>
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                  <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                    <Tags className="h-3.5 w-3.5" />
                  </span>
                                    Tytuł *
                                </label>
                                <input
                                    name="title"
                                    value={taskForm.values.title}
                                    onChange={taskForm.handleChange}
                                    onBlur={taskForm.handleBlur}
                                    placeholder="Np. Przygotować plan wdrożenia"
                                    className="w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                                />
                                {taskForm.touched.title && taskForm.errors.title ? (
                                    <p className="text-xs text-rose-700">{taskForm.errors.title}</p>
                                ) : null}
                            </div>
                            <div className="space-y-1">
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
                                            {selectedCreateCategory ? (
                                                <span className="flex items-center gap-2">
                          <span
                              className="h-2.5 w-2.5 rounded-full border border-[#d7c8b7]"
                              style={{ backgroundColor: selectedCreateCategory.color || defaultCategoryColor }}
                          />
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                            {selectedCreateCategory.code}
                          </span>
                          <span className="text-sm font-semibold text-[#2a241f]">
                            {selectedCreateCategory.name}
                          </span>
                        </span>
                                            ) : (
                                                <span className="text-[#8a7762]">
                          {categories.length === 0 ? "Brak kategorii" : "Wybierz kategorię"}
                        </span>
                                            )}
                                            <ChevronDown className="h-4 w-4 text-[#8a7762]" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border-[#eadfd3] bg-white p-1">
                                        {categories.length === 0 ? (
                                            <div className="px-2 py-2 text-sm text-[#8a7762]">Brak dostępnych kategorii.</div>
                                        ) : (
                                            categories.map((category) => (
                                                <DropdownMenuItem
                                                    key={category.id}
                                                    onSelect={() => {
                                                        taskForm.setFieldValue("categoryCode", category.code);
                                                        taskForm.setFieldTouched("categoryCode", true, false);
                                                    }}
                                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-[#2a241f] focus:bg-[#f6efe8]"
                                                >
                          <span
                              className="h-2.5 w-2.5 rounded-full border border-[#d7c8b7]"
                              style={{ backgroundColor: category.color || defaultCategoryColor }}
                          />
                                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                            {category.code}
                          </span>
                                                    <span className="text-sm font-semibold text-[#2a241f]">{category.name}</span>
                                                </DropdownMenuItem>
                                            ))
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                {taskForm.touched.categoryCode && taskForm.errors.categoryCode ? (
                                    <p className="text-xs text-rose-700">{taskForm.errors.categoryCode}</p>
                                ) : null}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                    <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                                        Opis
                                    </label>
                                    {canUseAi ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAiError(null);
                                                setAiPrompt(taskForm.values.title || "");
                                                setShowAiModal(true);
                                            }}
                                            className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2a241f] transition hover:border-[#2a241f]"
                                        >
                                            AI utwórz opis
                                        </button>
                                    ) : null}
                                </div>
                                {showAiModal ? (
                                    <div
                                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                                        onClick={() => {
                                            setShowAiModal(false);
                                            setAiError(null);
                                        }}
                                    >
                                        <div
                                            className="w-full max-w-lg space-y-4 rounded-2xl border border-[#eadfd3] bg-white p-5 shadow-[0_24px_60px_-35px_rgba(30,20,10,0.6)]"
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
                                                    AI opis zadania
                                                </p>
                                                <h4 className="text-lg font-semibold text-[#1f1b16]">
                                                    Utwórz opis zadania
                                                </h4>
                                            </div>
                                            <textarea
                                                value={aiPrompt}
                                                onChange={(event) => setAiPrompt(event.target.value)}
                                                rows={4}
                                                placeholder="Opisz, co ma zawierać opis zadania..."
                                                className="w-full resize-none rounded-xl border border-[#d7c8b7] bg-[#fcfaf7] px-3 py-2 text-sm text-[#2a241f] outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                                            />
                                            {aiError ? <p className="text-xs text-rose-700">{aiError}</p> : null}
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowAiModal(false);
                                                        setAiError(null);
                                                    }}
                                                    className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-xs font-semibold text-[#6f6255] transition hover:border-[#2a241f]"
                                                >
                                                    Anuluj
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateDescription}
                                                    disabled={aiLoading}
                                                    className="rounded-full bg-[#2a241f] px-3 py-1 text-xs font-semibold text-[#f6efe8] shadow-sm transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:bg-[#c3b5a5]"
                                                >
                                                    {aiLoading ? "Generuję..." : "Generuj"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                                <ReactQuill
                                    theme="snow"
                                    value={taskForm.values.description}
                                    onChange={(value) => taskForm.setFieldValue("description", value)}
                                    onBlur={() => taskForm.setFieldTouched("description", true, false)}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Krótki opis zadania"
                                    className="ipms-quill"
                                />
                                {taskForm.touched.description && taskForm.errors.description ? (
                                    <p className="text-xs text-rose-700">{taskForm.errors.description}</p>
                                ) : null}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                    Wytyczne oddania
                                </label>
                                <textarea
                                    name="deliveryGuidelines"
                                    value={taskForm.values.deliveryGuidelines}
                                    onChange={taskForm.handleChange}
                                    onBlur={taskForm.handleBlur}
                                    rows={3}
                                    placeholder="Np. format plików, kryteria akceptacji"
                                    className="w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                                />
                                {taskForm.touched.deliveryGuidelines && taskForm.errors.deliveryGuidelines ? (
                                    <p className="text-xs text-rose-700">{taskForm.errors.deliveryGuidelines}</p>
                                ) : null}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setCreateError(null);
                                        taskForm.resetForm();
                                    }}
                                    className="rounded-full border border-[#eadfd3] bg-white px-4 py-2 text-sm font-semibold text-[#5b5044] shadow-sm transition hover:border-[#2a241f] cursor-pointer"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={taskForm.isSubmitting || !canManageTasks}
                                    className="rounded-full bg-[#2a241f] px-4 py-2 text-sm font-semibold text-[#f6efe8] shadow-[0_14px_35px_-18px_rgba(30,20,10,0.55)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_40px_-18px_rgba(30,20,10,0.55)] disabled:cursor-not-allowed disabled:bg-[#c3b5a5] cursor-pointer"
                                >
                                    {taskForm.isSubmitting ? "Dodaję..." : "Dodaj zadanie"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {showEditModal ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setShowEditModal(false)}
                >
                    <div
                        className="w-full max-w-xl rounded-2xl border border-[#eadfd3] bg-white p-6 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.45)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">Edycja zadania</p>
                                <h2 className="text-xl font-semibold text-[#1f1b16]">Zmień dane zadania</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-sm text-[#5b5044] transition hover:border-[#2a241f] cursor-pointer"
                            >
                                Zamknij
                            </button>
                        </div>

                        {editError ? (
                            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                                {editError}
                            </div>
                        ) : null}

                        <form className="mt-4 space-y-3" onSubmit={editTaskForm.handleSubmit}>
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                  <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                    <Tags className="h-3.5 w-3.5" />
                  </span>
                                    Tytuł *
                                </label>
                                <input
                                    name="title"
                                    value={editTaskForm.values.title}
                                    onChange={editTaskForm.handleChange}
                                    onBlur={editTaskForm.handleBlur}
                                    placeholder="Np. Przygotować plan wdrożenia"
                                    className="w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                                />
                                {editTaskForm.touched.title && editTaskForm.errors.title ? (
                                    <p className="text-xs text-rose-700">{editTaskForm.errors.title}</p>
                                ) : null}
                            </div>
                            <div className="space-y-1">
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
                                            {selectedEditCategory ? (
                                                <span className="flex items-center gap-2">
                          <span
                              className="h-2.5 w-2.5 rounded-full border border-[#d7c8b7]"
                              style={{ backgroundColor: selectedEditCategory.color || defaultCategoryColor }}
                          />
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                            {selectedEditCategory.code}
                          </span>
                          <span className="text-sm font-semibold text-[#2a241f]">
                            {selectedEditCategory.name}
                          </span>
                        </span>
                                            ) : (
                                                <span className="text-[#8a7762]">
                          {categories.length === 0 ? "Brak kategorii" : "Wybierz kategorię"}
                        </span>
                                            )}
                                            <ChevronDown className="h-4 w-4 text-[#8a7762]" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border-[#eadfd3] bg-white p-1">
                                        {categories.length === 0 ? (
                                            <div className="px-2 py-2 text-sm text-[#8a7762]">Brak dostępnych kategorii.</div>
                                        ) : (
                                            categories.map((category) => (
                                                <DropdownMenuItem
                                                    key={category.id}
                                                    onSelect={() => {
                                                        editTaskForm.setFieldValue("categoryCode", category.code);
                                                        editTaskForm.setFieldTouched("categoryCode", true, false);
                                                    }}
                                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-[#2a241f] focus:bg-[#f6efe8]"
                                                >
                          <span
                              className="h-2.5 w-2.5 rounded-full border border-[#d7c8b7]"
                              style={{ backgroundColor: category.color || defaultCategoryColor }}
                          />
                                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                            {category.code}
                          </span>
                                                    <span className="text-sm font-semibold text-[#2a241f]">{category.name}</span>
                                                </DropdownMenuItem>
                                            ))
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                {editTaskForm.touched.categoryCode && editTaskForm.errors.categoryCode ? (
                                    <p className="text-xs text-rose-700">{editTaskForm.errors.categoryCode}</p>
                                ) : null}
                            </div>
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                  <span className="inline-flex h-6 w-6 items-center justify-center text-[#8a7762]">
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                                    Opis
                                </label>
                                <ReactQuill
                                    theme="snow"
                                    value={editTaskForm.values.description}
                                    onChange={(value) => editTaskForm.setFieldValue("description", value)}
                                    onBlur={() => editTaskForm.setFieldTouched("description", true, false)}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Krótki opis zadania"
                                    className="ipms-quill"
                                />
                                {editTaskForm.touched.description && editTaskForm.errors.description ? (
                                    <p className="text-xs text-rose-700">{editTaskForm.errors.description}</p>
                                ) : null}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                                    Wytyczne oddania
                                </label>
                                <textarea
                                    name="deliveryGuidelines"
                                    value={editTaskForm.values.deliveryGuidelines}
                                    onChange={editTaskForm.handleChange}
                                    onBlur={editTaskForm.handleBlur}
                                    rows={3}
                                    placeholder="Np. format plików, kryteria akceptacji"
                                    className="w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                                />
                                {editTaskForm.touched.deliveryGuidelines && editTaskForm.errors.deliveryGuidelines ? (
                                    <p className="text-xs text-rose-700">{editTaskForm.errors.deliveryGuidelines}</p>
                                ) : null}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditError(null);
                                        setEditingTask(null);
                                        editTaskForm.resetForm();
                                    }}
                                    className="rounded-full border border-[#eadfd3] bg-white px-4 py-2 text-sm font-semibold text-[#5b5044] shadow-sm transition hover:border-[#2a241f] cursor-pointer"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={editTaskForm.isSubmitting || !canManageTasks}
                                    className="rounded-full bg-[#2a241f] px-4 py-2 text-sm font-semibold text-[#f6efe8] shadow-[0_14px_35px_-18px_rgba(30,20,10,0.55)] transition hover:-translate-y-[1px] hover:shadow-[0_16px_40px_-18px_rgba(30,20,10,0.55)] disabled:cursor-not-allowed disabled:bg-[#c3b5a5] cursor-pointer"
                                >
                                    {editTaskForm.isSubmitting ? "Zapisuję..." : "Zapisz zmiany"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

type PertDiagramProps = {
    tasks: ProjectTask[];
    canManageTasks: boolean;
    projectId: string;
    onTaskUpdate: (task: ProjectTask) => void;
    onReload: () => void;
    loading: boolean;
};

const STATUS_COLUMNS: Record<TaskStatus, number> = {
    TODO: 0,
    IN_PROGRESS: 1,
    BLOCKED: 2,
    READY_FOR_REVIEW: 3,
    IN_REVIEW: 4,
    DONE: 5,
    REJECTED: 6,
    CANCELLED: 6,
};

const NODE_WIDTH = 260;
const NODE_HEIGHT = 56;
const LEFT_HANDLE_CENTER = 2;
const RIGHT_HANDLE_CENTER = NODE_WIDTH - 18;

function PertDiagram({ tasks, canManageTasks, projectId, onTaskUpdate, onReload, loading }: PertDiagramProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [layout, setLayout] = useState<Record<string, { x: number; y: number }>>({});
    const [anchors, setAnchors] = useState<Record<string, { left: number; right: number; centerY: number }>>({});
    const [scale, setScale] = useState(1);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [pointerOffset, setPointerOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [dragLinkFrom, setDragLinkFrom] = useState<string | null>(null);
    const [linkMode, setLinkMode] = useState<"outgoing" | "incoming" | null>(null);
    const [linkPreview, setLinkPreview] = useState<{ fromId: string; toX: number; toY: number } | null>(null);
    const [linkingError, setLinkingError] = useState<string | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<{ from: string; to: string } | null>(null);
    const linkPreviewRef = useRef<{ fromId: string; toX: number; toY: number } | null>(null);
    const layoutRef = useRef<Record<string, { x: number; y: number }>>({});
    const draggingRef = useRef<string | null>(null);

    useEffect(() => {
        setLayout((prev) => {
            const next: Record<string, { x: number; y: number }> = {};
            let index = 0;
            tasks.forEach((task) => {
                if (typeof task.pertX === "number" && typeof task.pertY === "number") {
                    next[task.id] = { x: task.pertX, y: task.pertY };
                    return;
                }
                if (prev[task.id]) {
                    next[task.id] = prev[task.id];
                    return;
                }
                next[task.id] = {
                    x: 80 + index * 280,
                    y: 60,
                };
                index += 1;
            });
            return next;
        });
    }, [tasks]);

    useEffect(() => {
        layoutRef.current = layout;
    }, [layout]);

    useEffect(() => {
        draggingRef.current = draggingId;
    }, [draggingId]);

    useEffect(() => {
        linkPreviewRef.current = linkPreview;
    }, [linkPreview]);

    const pertSize = useMemo(() => {
        let maxX = 900;
        let maxY = 650;
        tasks.forEach((task) => {
            const pos = layout[task.id];
            if (!pos) return;
            maxX = Math.max(maxX, pos.x + NODE_WIDTH);
            maxY = Math.max(maxY, pos.y + NODE_HEIGHT);
        });
        return {
            width: maxX + 120,
            height: maxY + 120,
        };
    }, [layout, tasks]);

    const edges = useMemo(() => {
        return tasks
            .filter((task) => task.dependentTask?.id)
            .map((task) => ({
                from: task.dependentTask!.id,
                to: task.id,
            }))
            .filter((edge) => layout[edge.from] && layout[edge.to]);
    }, [layout, tasks]);

    const getPointerPosition = useCallback((event: { clientX: number; clientY: number }) => {
        if (!containerRef.current) return null;
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) / scale,
            y: (event.clientY - rect.top) / scale,
        };
    }, [scale]);

    const updateAnchors = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const next: Record<string, { left: number; right: number; centerY: number }> = {};
        tasks.forEach((task) => {
            const node = nodeRefs.current[task.id];
            if (!node) return;
            const nodeRect = node.getBoundingClientRect();
            next[task.id] = {
                left: (nodeRect.left - containerRect.left) / scale,
                right: (nodeRect.right - containerRect.left) / scale,
                centerY: (nodeRect.top - containerRect.top + nodeRect.height / 2) / scale,
            };
        });
        setAnchors(next);
    }, [scale, tasks]);

    const getNodeAnchor = useCallback(
        (taskId: string) => {
            return anchors[taskId] ?? null;
        },
        [anchors],
    );

    const handleZoomChange = useCallback((delta: number) => {
        setScale((prev) => {
            const next = Math.min(1.6, Math.max(0.6, prev + delta));
            return Number(next.toFixed(2));
        });
    }, []);

    useLayoutEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            updateAnchors();
        });
        return () => window.cancelAnimationFrame(frame);
    }, [layout, pertSize.height, pertSize.width, scale, tasks, updateAnchors]);

    useEffect(() => {
        const handleResize = () => updateAnchors();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [updateAnchors]);

    const handlePointerDown = useCallback(
        (taskId: string, event: PointerEvent<HTMLDivElement>) => {
            if (!containerRef.current) return;
            if ((event.target as HTMLElement | null)?.closest("[data-link-handle]")) return;
            const pointer = getPointerPosition(event);
            if (!pointer) return;
            const current = layout[taskId] ?? { x: 80, y: 60 };
            setPointerOffset({
                x: pointer.x - current.x,
                y: pointer.y - current.y,
            });
            setDraggingId(taskId);
            event.preventDefault();
        },
        [canManageTasks, getPointerPosition, layout],
    );

    const handlePointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            const pointer = getPointerPosition(event);
            if (linkPreview && pointer) {
                setLinkPreview((prev) => (prev ? { ...prev, toX: pointer.x, toY: pointer.y } : prev));
            }
            if (!draggingId || !pointer) return;
            const x = Math.max(12, pointer.x - pointerOffset.x);
            const y = Math.max(12, pointer.y - pointerOffset.y);
            setLayout((prev) => ({
                ...prev,
                [draggingId]: { x, y },
            }));
        },
        [draggingId, getPointerPosition, linkPreview, pointerOffset.x, pointerOffset.y],
    );

    const updateDependency = useCallback(
        async (taskId: string, dependentTaskId: string | null) => {
            if (!canManageTasks) {
                setLinkingError("Brak uprawnień do łączenia zadań.");
                return;
            }
            setLinkingError(null);
            try {
                const response = await fetch(`/api/project/${projectId}/tasks`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ taskId, dependentTaskId }),
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    setLinkingError(payload?.message || "Nie udało się zaktualizować połączenia.");
                    return;
                }
                const updated = payload?.task as ProjectTask | undefined;
                if (updated) {
                    onTaskUpdate(updated);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Nie udało się zaktualizować połączenia.";
                setLinkingError(message);
            } finally {
                setDragLinkFrom(null);
                setLinkPreview(null);
            }
        },
        [canManageTasks, onTaskUpdate, projectId],
    );

    const persistLayout = useCallback(
        async (taskId: string, position: { x: number; y: number }) => {
            if (!canManageTasks) return;
            try {
                const response = await fetch(`/api/project/${projectId}/tasks`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ taskId, pertX: position.x, pertY: position.y }),
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    return;
                }
                const updated = payload?.task as ProjectTask | undefined;
                if (updated) {
                    onTaskUpdate(updated);
                }
            } catch {
                // best-effort persistence
            }
        },
        [canManageTasks, onTaskUpdate, projectId],
    );

    useEffect(() => {
        const handlePointerUp = (event: PointerEvent) => {
            const dragId = draggingRef.current;
            if (dragId) {
                setDraggingId(null);
                const position = layoutRef.current[dragId];
                if (position) {
                    void persistLayout(dragId, position);
                }
                return;
            }
            const preview = linkPreviewRef.current;
            if (!preview) return;
            const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
            const targetId = target?.closest("[data-task-id]")?.getAttribute("data-task-id") || null;
            if (!targetId) {
                setLinkPreview(null);
                setDragLinkFrom(null);
                setLinkMode(null);
                return;
            }
            if (targetId === preview.fromId) {
                setLinkingError("Nie mozna polaczyc zadania z samym soba.");
                setLinkPreview(null);
                setDragLinkFrom(null);
                setLinkMode(null);
                return;
            }
            if (linkMode === "incoming") {
                void updateDependency(preview.fromId, targetId);
            } else {
                void updateDependency(targetId, preview.fromId);
            }
            setLinkPreview(null);
            setDragLinkFrom(null);
            setLinkMode(null);
        };
        window.addEventListener("pointerup", handlePointerUp);
        return () => window.removeEventListener("pointerup", handlePointerUp);
    }, [linkMode, persistLayout, updateDependency]);

    const handleLinkStart = useCallback(
        (taskId: string, mode: "outgoing" | "incoming", event: PointerEvent<HTMLButtonElement>) => {
            if (!canManageTasks) {
                setLinkingError("Brak uprawnien do laczenia zadan.");
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            const pointer = getPointerPosition(event);
            if (!pointer) return;
            setLinkingError(null);
            setDraggingId(null);
            setDragLinkFrom(taskId);
            setLinkMode(mode);
            setLinkPreview({ fromId: taskId, toX: pointer.x, toY: pointer.y });
        },
        [canManageTasks, getPointerPosition],
    );


    return (
        <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#f8f4ef] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
          PERT diagram
        </span>
                <p className="text-sm text-[#5b5044]">
                    Przeciągaj karty, aby je ułożyć. Aby połączyć zadania, przeciągnij od prawej krawędzi zadania do zadania docelowego.
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => {
                        setLinkingError(null);
                        setDragLinkFrom(null);
                        setLinkPreview(null);
                        setSelectedEdge(null);
                        onReload();
                    }}
                    className="cursor-pointer rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-sm font-semibold text-[#2a241f] shadow-sm transition hover:border-[#2a241f]"
                >
                    Odśwież i wyczyść wybór
                </button>
                <div className="flex items-center gap-1 rounded-full border border-[#eadfd3] bg-white px-2 py-1 shadow-sm">
                    <button
                        type="button"
                        onClick={() => handleZoomChange(-0.1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold text-[#2a241f] transition hover:bg-[#f3ede6]"
                        aria-label="Pomniejsz diagram"
                    >
                        -
                    </button>
                    <span className="min-w-[48px] text-center text-[11px] font-semibold text-[#6f6255]">
            {Math.round(scale * 100)}%
          </span>
                    <button
                        type="button"
                        onClick={() => handleZoomChange(0.1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold text-[#2a241f] transition hover:bg-[#f3ede6]"
                        aria-label="Powieksz diagram"
                    >
                        +
                    </button>
                </div>
                {dragLinkFrom ? (
                    <span className="rounded-full bg-[#2a241f] px-3 py-1 text-sm font-semibold text-[#f6efe8]">
            Laczenie: {tasks.find((task) => task.id === dragLinkFrom)?.title || "zadanie"}{" "}
                        {linkMode === "incoming" ? "(z przodu)" : "(z tylu)"}
          </span>
                ) : null}
                {linkingError ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-800">
            {linkingError}
          </span>
                ) : null}
            </div>

            {loading ? (
                <p className="text-sm text-[#6f6255]">Ładuję zadania...</p>
            ) : tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6f6255]">
                    Brak zadań do wyświetlenia na diagramie PERT.
                </div>
            ) : (
                <div className="overflow-auto rounded-2xl border border-[#e6ded0] bg-gradient-to-br from-[#fdfaf5] to-[#f4ede4] shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)]">
                    <div
                        className="relative"
                        style={{ width: `${pertSize.width * scale}px`, height: `${pertSize.height * scale}px` }}
                    >
                        <div
                            ref={containerRef}
                            onPointerMove={handlePointerMove}
                            className="relative"
                            style={{
                                width: `${pertSize.width}px`,
                                height: `${pertSize.height}px`,
                                transform: `scale(${scale})`,
                                transformOrigin: "top left",
                                backgroundSize: "32px 32px",
                                backgroundImage: "radial-gradient(circle, rgba(90,80,70,0.12) 1px, transparent 0)",
                            }}
                        >
                            <svg className="absolute inset-0" width={pertSize.width} height={pertSize.height}>
                                <defs>
                                    <marker
                                        id="arrowhead"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="9"
                                        refY="4"
                                        orient="auto"
                                        markerUnits="strokeWidth"
                                    >
                                        <path d="M0,0 L8,4 L0,8 z" fill="#8a7762" />
                                    </marker>
                                    <marker
                                        id="arrowhead-active"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="9"
                                        refY="4"
                                        orient="auto"
                                        markerUnits="strokeWidth"
                                    >
                                        <path d="M0,0 L8,4 L0,8 z" fill="#dc2626" />
                                    </marker>
                                </defs>
                                {edges.map((edge) => {
                                    const from = layout[edge.from];
                                    const to = layout[edge.to];
                                    if (!from || !to) return null;
                                    const fromAnchor = getNodeAnchor(edge.from);
                                    const toAnchor = getNodeAnchor(edge.to);
                                    const startX = fromAnchor?.right ?? from.x + RIGHT_HANDLE_CENTER;
                                    const startY = fromAnchor?.centerY ?? from.y + NODE_HEIGHT / 2;
                                    const endX = toAnchor?.left ?? to.x + LEFT_HANDLE_CENTER;
                                    const endY = toAnchor?.centerY ?? to.y + NODE_HEIGHT / 2;
                                    const midX = (startX + endX) / 2;
                                    const isSelected = selectedEdge?.from === edge.from && selectedEdge?.to === edge.to;
                                    const path = `M ${startX} ${startY} C ${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`;
                                    return (
                                        <path
                                            key={`${edge.from}-${edge.to}`}
                                            d={path}
                                            fill="none"
                                            stroke={isSelected ? "#dc2626" : "#8a7762"}
                                            strokeWidth={2}
                                            markerEnd={isSelected ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                            className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
                                            onClick={() =>
                                                setSelectedEdge((prev) =>
                                                    prev?.from === edge.from && prev?.to === edge.to ? null : edge,
                                                )
                                            }
                                            style={{ pointerEvents: "stroke" }}
                                        />
                                    );
                                })}
                                {linkPreview && layout[linkPreview.fromId] ? (
                                    (() => {
                                        const from = layout[linkPreview.fromId];
                                        if (!from) return null;
                                        const fromAnchor = getNodeAnchor(linkPreview.fromId);
                                        const startX =
                                            linkMode === "incoming"
                                                ? fromAnchor?.left ?? from.x + LEFT_HANDLE_CENTER
                                                : fromAnchor?.right ?? from.x + RIGHT_HANDLE_CENTER;
                                        const startY = fromAnchor?.centerY ?? from.y + NODE_HEIGHT / 2;
                                        const endX = linkPreview.toX;
                                        const endY = linkPreview.toY;
                                        const midX = (startX + endX) / 2;
                                        const path = `M ${startX} ${startY} C ${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`;
                                        return (
                                            <path
                                                d={path}
                                                fill="none"
                                                stroke="#2a241f"
                                                strokeWidth={2}
                                                strokeDasharray="6 6"
                                                className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
                                            />
                                        );
                                    })()
                                ) : null}
                            </svg>
                            {selectedEdge ? (
                                (() => {
                                    const from = layout[selectedEdge.from];
                                    const to = layout[selectedEdge.to];
                                    if (!from || !to) return null;
                                    const fromAnchor = getNodeAnchor(selectedEdge.from);
                                    const toAnchor = getNodeAnchor(selectedEdge.to);
                                    const startX = fromAnchor?.right ?? from.x + RIGHT_HANDLE_CENTER;
                                    const startY = fromAnchor?.centerY ?? from.y + NODE_HEIGHT / 2;
                                    const endX = toAnchor?.left ?? to.x + LEFT_HANDLE_CENTER;
                                    const endY = toAnchor?.centerY ?? to.y + NODE_HEIGHT / 2;
                                    const midX = (startX + endX) / 2;
                                    const midY = (startY + endY) / 2;
                                    return (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void updateDependency(selectedEdge.to, null);
                                                setSelectedEdge(null);
                                            }}
                                            className="absolute flex h-5 w-5 items-center justify-center rounded-full border border-[#dc2626] bg-white text-[10px] font-semibold text-[#dc2626] shadow-sm"
                                            style={{
                                                left: `${midX - 10}px`,
                                                top: `${midY - 10}px`,
                                            }}
                                            aria-label="Usun polaczenie"
                                        >
                                            <span className="relative -top-[1px] text-[12px] leading-none">X</span>
                                        </button>
                                    );
                                })()
                            ) : null}

                            {tasks.map((task) => {
                                const pos = layout[task.id] ?? { x: 80, y: 60 };
                                const isSelected = dragLinkFrom === task.id;
                                const categoryCode = task.category?.code ? task.category.code.trim().toUpperCase() : "TASK";
                                const issueId = `${categoryCode}-${task.taskNumber}`;
                                return (
                                    <div
                                        key={task.id}
                                        data-task-id={task.id}
                                        style={{ left: pos.x, top: pos.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
                                        className={`absolute relative cursor-grab rounded-xl border bg-white px-2 py-1 text-sm shadow-[0_10px_24px_-20px_rgba(20,14,8,0.45)] transition ${
                                            isSelected ? "border-[#2a241f]" : "border-[#eadfd3]"
                                        }`}
                                        ref={(node) => {
                                            nodeRefs.current[task.id] = node;
                                        }}
                                        onPointerDown={(event) => handlePointerDown(task.id, event)}
                                    >
                                        <div className="flex h-full items-center justify-center text-center">
                                            <p className="truncate text-[14px] font-semibold text-[#1f1b16]">{issueId}</p>
                                        </div>
                                        <button
                                            type="button"
                                            data-link-handle="left"
                                            onPointerDown={(event) => handleLinkStart(task.id, "incoming", event)}
                                            className="absolute -left-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-[#2a241f] bg-white text-[10px] font-semibold text-[#2a241f] shadow-sm"
                                            aria-label="Polacz z przodu"
                                        >
                                            +
                                        </button>
                                        <button
                                            type="button"
                                            data-link-handle="right"
                                            onPointerDown={(event) => handleLinkStart(task.id, "outgoing", event)}
                                            className="absolute -right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-[#2a241f] bg-white text-[10px] font-semibold text-[#2a241f] shadow-sm"
                                            aria-label="Polacz z tylu"
                                        >
                                            +
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
