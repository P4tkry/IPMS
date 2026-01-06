"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
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
import { BacklogAiModal } from "./backlog-ai-modal";
import { BacklogTaskModal } from "./backlog-task-modal";
import { PertDiagram } from "./pert-diagram";
import type { ProjectTask, Sprint, TaskCategory, TaskPriority, TaskStatus } from "./types";

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

const priorityConfig: Record<TaskPriority, { label: string; badge: string; dot: string }> = {
    LOW: {
        label: "Niski",
        badge: "bg-slate-50 text-slate-700 border border-slate-200",
        dot: "bg-slate-400",
    },
    MEDIUM: {
        label: "—redni",
        badge: "bg-blue-50 text-blue-800 border border-blue-200",
        dot: "bg-blue-500",
    },
    HIGH: {
        label: "Wysoki",
        badge: "bg-amber-50 text-amber-800 border border-amber-200",
        dot: "bg-amber-500",
    },
    URGENT: {
        label: "Pilny",
        badge: "bg-rose-50 text-rose-800 border border-rose-200",
        dot: "bg-rose-500",
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

type CategorySortKey = "name" | "code" | "description" | "tasksCount";
type CategorySortDirection = "asc" | "desc";
type AiTarget = "description" | "criteria";
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
    const [aiAssignError, setAiAssignError] = useState<string | null>(null);
    const [aiAssignLoading, setAiAssignLoading] = useState(false);
    const [issueQuery, setIssueQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
    const [assigneeFilter, setAssigneeFilter] = useState("all");
    const canManageTasks = (project.canManageTasks ?? project.canCreateTasks) === true;
    const canViewTasks = (project.canViewTasks ?? false) || canManageTasks;
    const canMessageTasks = project.canMessageTasks === true;
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
            void loadMembers();
            void loadCategories();
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
        setAiAssignError(null);
        setShowAiModal(false);
        setAiPrompt("");
        setAiTarget("description");
        setAiFormTarget("create");
        void loadMembers();
        void loadSprints();
    }, [loadMembers, showModal]);

    useEffect(() => {
        if (!showEditModal) return;
        setEditError(null);
        setAiError(null);
        setAiAssignError(null);
        setShowAiModal(false);
        setAiPrompt("");
        setAiTarget("description");
        setAiFormTarget("edit");
        void loadMembers();
        void loadSprints();
    }, [loadMembers, loadSprints, showEditModal]);




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
            userStory: "",
            acceptanceCriteria: "",
            assignedMemberId: "",
            reviewMemberId: "",
            categoryCode: "",
            sprintId: "",
            status: "TODO" as TaskStatus,
            priority: "MEDIUM" as TaskPriority,
        },
        validationSchema: Yup.object({
            title: Yup.string().trim().required("Tytuł jest wymagany.").max(120, "Tytuł jest za długi."),
            description: Yup.string()
                .trim()
                .test("description-length", "Opis jest za długi.", (value) => {
                    const plain = getRichTextPlain(value ?? "");
                    return plain.length <= 1000;
                }),
            userStory: Yup.string().trim().max(1000, "User story jest za długa."),
            acceptanceCriteria: Yup.string().trim().max(1000, "Kryteria są za długie."),
            assignedMemberId: Yup.string().trim(),
            reviewMemberId: Yup.string().trim(),
            categoryCode: Yup.string().trim().required("Kategoria jest wymagana."),
            sprintId: Yup.string().trim(),
            status: Yup.mixed<TaskStatus>()
                .oneOf(
                    [
                        "TODO",
                        "IN_PROGRESS",
                        "BLOCKED",
                        "READY_FOR_REVIEW",
                        "IN_REVIEW",
                        "DONE",
                        "REJECTED",
                        "CANCELLED",
                    ],
                    "Nieprawidlowy status.",
                )
                .required("Status jest wymagany."),
            priority: Yup.mixed<TaskPriority>()
                .oneOf(["LOW", "MEDIUM", "HIGH", "URGENT"], "Nieprawidlowy priorytet.")
                .required("Priorytet jest wymagany."),
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
                    userStory: values.userStory.trim() || null,
                    acceptanceCriteria: values.acceptanceCriteria.trim() || null,
                    assignedMemberId: values.assignedMemberId.trim() || null,
                    reviewMemberId: values.reviewMemberId.trim() || null,
                    categoryCode: values.categoryCode.trim().toUpperCase(),
                    sprintId: values.sprintId.trim() || null,
                    status: values.status,
                    priority: values.priority,
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
            userStory: editingTask?.userStory ?? "",
            categoryCode: editingTask?.category?.code ?? "",
            acceptanceCriteria: editingTask?.acceptanceCriteria ?? "",
            assignedMemberId: editingTask?.assignedMember?.id ?? "",
            reviewMemberId: editingTask?.reviewMember?.id ?? "",
            sprintId: editingTask?.sprintId ?? "",
            status: editingTask?.status ?? "TODO",
            priority: editingTask?.priority ?? "MEDIUM",
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
            userStory: Yup.string().trim().max(1000, "User story jest za długa."),
            acceptanceCriteria: Yup.string().trim().max(1000, "Kryteria są za długie."),
            assignedMemberId: Yup.string().trim(),
            reviewMemberId: Yup.string().trim(),
            sprintId: Yup.string().trim(),
            status: Yup.mixed<TaskStatus>()
                .oneOf(
                    [
                        "TODO",
                        "IN_PROGRESS",
                        "BLOCKED",
                        "READY_FOR_REVIEW",
                        "IN_REVIEW",
                        "DONE",
                        "REJECTED",
                        "CANCELLED",
                    ],
                    "Nieprawidlowy status.",
                )
                .required("Status jest wymagany."),
            priority: Yup.mixed<TaskPriority>()
                .oneOf(["LOW", "MEDIUM", "HIGH", "URGENT"], "Nieprawidlowy priorytet.")
                .required("Priorytet jest wymagany."),
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
                    userStory: values.userStory.trim() || null,
                    acceptanceCriteria: values.acceptanceCriteria.trim() || null,
                    assignedMemberId: values.assignedMemberId.trim() || null,
                    reviewMemberId: values.reviewMemberId.trim() || null,
                    categoryCode: values.categoryCode.trim().toUpperCase(),
                    sprintId: values.sprintId.trim() || null,
                    status: values.status,
                    priority: values.priority,
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
                aiTarget === "criteria"
                    ? "Wpisz, co ma zawierac kryteria."
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
                    mode: aiTarget === "criteria" ? "criteria" : "description",
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
                    targetForm.setFieldValue("acceptanceCriteria", payload.text.trim());
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

    const canAutoAssignCreate = useMemo(() => {
        const title = taskForm.values.title.trim();
        const category = taskForm.values.categoryCode.trim();
        const description = getRichTextPlain(taskForm.values.description).trim();
        return Boolean(title && category && description);
    }, [getRichTextPlain, taskForm.values.categoryCode, taskForm.values.description, taskForm.values.title]);

    const canAutoAssignEdit = useMemo(() => {
        const title = editTaskForm.values.title.trim();
        const category = editTaskForm.values.categoryCode.trim();
        const description = getRichTextPlain(editTaskForm.values.description).trim();
        return Boolean(title && category && description);
    }, [
        editTaskForm.values.categoryCode,
        editTaskForm.values.description,
        editTaskForm.values.title,
        getRichTextPlain,
    ]);

    const handleAutoAssign = useCallback(
        async (target: AiFormTarget) => {
            if (!canUseAi) {
                setAiAssignError("Brak uprawnien do uzycia AI.");
                return;
            }
            const form = target === "edit" ? editTaskForm : taskForm;
            const title = form.values.title.trim();
            const categoryCode = form.values.categoryCode.trim().toUpperCase();
            const descriptionPlain = getRichTextPlain(form.values.description).trim();
            if (!title || !categoryCode || !descriptionPlain) {
                setAiAssignError("Wypelnij tytul, kategorie i opis.");
                return;
            }
            setAiAssignError(null);
            setAiAssignLoading(true);
            try {
                const response = await fetch(`/api/project/${project.id}/tasks/assign`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title,
                        description: form.values.description,
                        categoryCode,
                        acceptanceCriteria: form.values.acceptanceCriteria,
                    }),
                });
                const payload = await response.json();
                if (!response.ok) {
                    setAiAssignError(payload?.message || "Nie udalo sie dobrac osoby.");
                    return;
                }
                if (payload?.memberId) {
                    form.setFieldValue("assignedMemberId", payload.memberId);
                    form.setFieldTouched("assignedMemberId", true, false);
                } else {
                    setAiAssignError("Nie udalo sie dobrac osoby.");
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Nie udalo sie dobrac osoby.";
                setAiAssignError(message);
            } finally {
                setAiAssignLoading(false);
            }
        },
        [canUseAi, editTaskForm, getRichTextPlain, project.id, taskForm],
    );

    const selectedCreateCategory = useMemo(
        () => categories.find((category) => category.code === taskForm.values.categoryCode) ?? null,
        [categories, taskForm.values.categoryCode],
    );

    const selectedEditCategory = useMemo(
        () => categories.find((category) => category.code === editTaskForm.values.categoryCode) ?? null,
        [categories, editTaskForm.values.categoryCode],
    );
    const selectedFilterCategory = useMemo(
        () => categories.find((category) => category.id === categoryFilter) ?? null,
        [categories, categoryFilter],
    );
    const selectedFilterAssignee = useMemo(
        () => members.find((member) => member.id === assigneeFilter) ?? null,
        [assigneeFilter, members],
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

    const filteredTasks = useMemo(() => {
        const query = issueQuery.trim().toUpperCase();
        return orderedTasks.filter((task) => {
            if (categoryFilter !== "all" && task.category?.id !== categoryFilter) return false;
            if (statusFilter !== "all" && task.status !== statusFilter) return false;
            if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
            if (assigneeFilter !== "all" && task.assignedMember?.id !== assigneeFilter) return false;
            if (query) {
                const issueId = getIssueId(task).toUpperCase();
                if (!issueId.includes(query)) return false;
            }
            return true;
        });
    }, [
        assigneeFilter,
        categoryFilter,
        getIssueId,
        issueQuery,
        orderedTasks,
        priorityFilter,
        statusFilter,
    ]);

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
    const statusFilterLabel = statusFilter === "all" ? "Wszystkie" : statusConfig[statusFilter].label;
    const priorityFilterLabel = priorityFilter === "all" ? "Wszystkie" : priorityConfig[priorityFilter].label;
    const assigneeFilterLabel =
        assigneeFilter === "all" ? "Wszyscy" : selectedFilterAssignee ? getMemberLabel(selectedFilterAssignee) : "Wszyscy";
    const statusFilterDot = statusFilter === "all" ? "bg-[#c3b5a5]" : statusConfig[statusFilter].dot;
    const priorityFilterDot = priorityFilter === "all" ? "bg-[#c3b5a5]" : priorityConfig[priorityFilter].dot;


    return (
        <div className="space-y-4">

            <BacklogAiModal
                open={showAiModal}
                target={aiTarget}
                prompt={aiPrompt}
                error={aiError}
                loading={aiLoading}
                onClose={() => {
                    setShowAiModal(false);
                    setAiError(null);
                }}
                onPromptChange={setAiPrompt}
                onSubmit={handleGenerateAiContent}
            />

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
                        <div className="mt-6 space-y-4">
                            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#eadfd3] bg-[#fbf7f1] px-4 py-3 text-sm text-[#5b5044]">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                                        Issue ID
                                    </span>
                                    <input
                                        value={issueQuery}
                                        onChange={(event) => setIssueQuery(event.target.value)}
                                        placeholder="np. CAT-12"
                                        className="w-40 rounded-lg border border-[#d7c8b7] bg-white px-2 py-1 text-xs outline-none focus:border-[#2a241f]"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                                        Kategoria
                                    </span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="flex w-40 items-center justify-between gap-2 rounded-lg border border-[#d7c8b7] bg-white px-2 py-1 text-xs shadow-sm outline-none transition focus:border-[#2a241f]"
                                            >
                                                {selectedFilterCategory ? (
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-full border border-[#d7c8b7]"
                                                            style={{
                                                                backgroundColor:
                                                                    selectedFilterCategory.color || defaultCategoryColor,
                                                            }}
                                                        />
                                                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                                                            {selectedFilterCategory.code}
                                                        </span>
                                                        <span className="text-xs font-semibold text-[#2a241f]">
                                                            {selectedFilterCategory.name}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-semibold text-[#6f6255]">Wszystkie</span>
                                                )}
                                                <ChevronDown className="h-3.5 w-3.5 text-[#8a7762]" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border-[#eadfd3] bg-white p-1">
                                            <DropdownMenuItem
                                                onSelect={() => setCategoryFilter("all")}
                                                className="cursor-pointer rounded-md px-2 py-2 text-xs font-semibold text-[#2a241f] focus:bg-[#f6efe8]"
                                            >
                                                Wszystkie
                                            </DropdownMenuItem>
                                            {categories.map((category) => (
                                                <DropdownMenuItem
                                                    key={category.id}
                                                    onSelect={() => setCategoryFilter(category.id)}
                                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs text-[#2a241f] focus:bg-[#f6efe8]"
                                                >
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full border border-[#d7c8b7]"
                                                        style={{
                                                            backgroundColor: category.color || defaultCategoryColor,
                                                        }}
                                                    />
                                                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                                                        {category.code}
                                                    </span>
                                                    <span className="text-xs font-semibold text-[#2a241f]">
                                                        {category.name}
                                                    </span>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                                        Status
                                    </span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="flex w-40 items-center justify-between gap-2 rounded-lg border border-[#d7c8b7] bg-white px-2 py-1 text-xs shadow-sm outline-none transition focus:border-[#2a241f]"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className={`h-2.5 w-2.5 rounded-full ${statusFilterDot}`} />
                                                    <span className="text-xs font-semibold text-[#2a241f]">{statusFilterLabel}</span>
                                                </span>
                                                <ChevronDown className="h-3.5 w-3.5 text-[#8a7762]" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border-[#eadfd3] bg-white p-1">
                                            <DropdownMenuItem
                                                onSelect={() => setStatusFilter("all")}
                                                className="cursor-pointer rounded-md px-2 py-2 text-xs font-semibold text-[#2a241f] focus:bg-[#f6efe8]"
                                            >
                                                Wszystkie
                                            </DropdownMenuItem>
                                            {(Object.keys(statusConfig) as TaskStatus[]).map((status) => (
                                                <DropdownMenuItem
                                                    key={status}
                                                    onSelect={() => setStatusFilter(status)}
                                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs text-[#2a241f] focus:bg-[#f6efe8]"
                                                >
                                                    <span className={`h-2.5 w-2.5 rounded-full ${statusConfig[status].dot}`} />
                                                    {statusConfig[status].label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                                        Priorytet
                                    </span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="flex w-40 items-center justify-between gap-2 rounded-lg border border-[#d7c8b7] bg-white px-2 py-1 text-xs shadow-sm outline-none transition focus:border-[#2a241f]"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className={`h-2.5 w-2.5 rounded-full ${priorityFilterDot}`} />
                                                    <span className="text-xs font-semibold text-[#2a241f]">{priorityFilterLabel}</span>
                                                </span>
                                                <ChevronDown className="h-3.5 w-3.5 text-[#8a7762]" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border-[#eadfd3] bg-white p-1">
                                            <DropdownMenuItem
                                                onSelect={() => setPriorityFilter("all")}
                                                className="cursor-pointer rounded-md px-2 py-2 text-xs font-semibold text-[#2a241f] focus:bg-[#f6efe8]"
                                            >
                                                Wszystkie
                                            </DropdownMenuItem>
                                            {(Object.keys(priorityConfig) as TaskPriority[]).map((priority) => (
                                                <DropdownMenuItem
                                                    key={priority}
                                                    onSelect={() => setPriorityFilter(priority)}
                                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs text-[#2a241f] focus:bg-[#f6efe8]"
                                                >
                                                    <span className={`h-2.5 w-2.5 rounded-full ${priorityConfig[priority].dot}`} />
                                                    {priorityConfig[priority].label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                                        Uzytkownik
                                    </span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="flex w-40 items-center justify-between gap-2 rounded-lg border border-[#d7c8b7] bg-white px-2 py-1 text-xs shadow-sm outline-none transition focus:border-[#2a241f]"
                                            >
                                                <span className="flex items-center gap-2">
                                                    {selectedFilterAssignee?.user ? (
                                                        <Avatar className="h-5 w-5 border border-[#eadfd3] bg-white">
                                                            {selectedFilterAssignee.user.image ? (
                                                                <AvatarImage
                                                                    src={selectedFilterAssignee.user.image}
                                                                    alt={selectedFilterAssignee.user.name || selectedFilterAssignee.user.email || "user"}
                                                                />
                                                            ) : null}
                                                            <AvatarFallback className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6f6255]">
                                                                {getInitials(selectedFilterAssignee.user.name || selectedFilterAssignee.user.email)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ) : null}
                                                    <span className="text-xs font-semibold text-[#2a241f]">{assigneeFilterLabel}</span>
                                                </span>
                                                <ChevronDown className="h-3.5 w-3.5 text-[#8a7762]" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border-[#eadfd3] bg-white p-1">
                                            <DropdownMenuItem
                                                onSelect={() => setAssigneeFilter("all")}
                                                className="cursor-pointer rounded-md px-2 py-2 text-xs font-semibold text-[#2a241f] focus:bg-[#f6efe8]"
                                            >
                                                Wszyscy
                                            </DropdownMenuItem>
                                            {members.map((member) => (
                                                <DropdownMenuItem
                                                    key={member.id}
                                                    onSelect={() => setAssigneeFilter(member.id)}
                                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs text-[#2a241f] focus:bg-[#f6efe8]"
                                                >
                                                    <Avatar className="h-5 w-5 border border-[#eadfd3] bg-white">
                                                        {member.user?.image ? (
                                                            <AvatarImage
                                                                src={member.user.image}
                                                                alt={member.user.name || member.user.email || "user"}
                                                            />
                                                        ) : null}
                                                        <AvatarFallback className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6f6255]">
                                                            {getInitials(member.user?.name || member.user?.email)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {getMemberLabel(member)}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            {loading ? (
                                <p className="text-sm text-[#6f6255]">Ładuję zadania...</p>
                            ) : filteredTasks.length === 0 ? (
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

                                            <th className="w-44 px-4 py-3 text-left font-semibold">Status</th>

                                            <th className="w-32 px-4 py-3 text-left font-semibold">Priorytet</th>

                                            <th className="w-48 px-4 py-3 text-left font-semibold">Przypisany</th>

                                        </tr>

                                        </thead>

                                        <tbody>

                                        {filteredTasks.map((task, index) => {
                                            const isExpanded = expandedTaskId === task.id;
                                            const isLast = index === filteredTasks.length - 1;
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
                              <span
                                  className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${priorityConfig[task.priority].badge}`}
                              >
                                {priorityConfig[task.priority].label}
                              </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {task.assignedMember?.user ? (
                                                                <div className="flex items-center">
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
                                                                </div>
                                                            ) : (
                                                                <span className="rounded-full border border-dashed border-[#eadfd3] px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8a7762]">
                                  Nieprzypisane
                                </span>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                    <tr className={isExpanded ? "" : "border-t-0"}>
                                                        <td colSpan={5} className="bg-[#fcf8f2]/90 px-0 text-sm text-[#6f6255]">
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
                                        Priorytet
                                      </span>
                                      <span className={`inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${priorityConfig[task.priority].badge}`}>
                                        {priorityConfig[task.priority].label}
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

            <BacklogTaskModal
                mode="create"
                open={showModal}
                error={createError}
                categories={categories}
                members={members}
                sprints={sprints}
                selectedCategory={selectedCreateCategory}
                defaultCategoryColor={defaultCategoryColor}
                canManageTasks={canManageTasks}
                taskId={null}
                canMessageTasks={canMessageTasks}
                canUseAi={canUseAi}
                onAiDescriptionClick={() => openAiModal("description", "create")}
                onAiCriteriaClick={() => openAiModal("criteria", "create")}
                showAiAssign={canAutoAssignCreate}
                aiAssignLoading={aiAssignLoading}
                aiAssignError={aiAssignError}
                onAiAssign={() => handleAutoAssign("create")}
                onClose={() => {
                    setShowModal(false);
                    setCreateError(null);
                    setAiAssignError(null);
                    taskForm.resetForm();
                }}
                formik={taskForm}
            />

            <BacklogTaskModal
                mode="edit"
                open={showEditModal}
                error={editError}
                categories={categories}
                members={members}
                sprints={sprints}
                selectedCategory={selectedEditCategory}
                defaultCategoryColor={defaultCategoryColor}
                canManageTasks={canManageTasks}
                taskId={editingTask?.id ?? null}
                canMessageTasks={canMessageTasks}
                canUseAi={canUseAi}
                onAiDescriptionClick={() => openAiModal("description", "edit")}
                onAiCriteriaClick={() => openAiModal("criteria", "edit")}
                showAiAssign={canAutoAssignEdit}
                aiAssignLoading={aiAssignLoading}
                aiAssignError={aiAssignError}
                onAiAssign={() => handleAutoAssign("edit")}
                onClose={() => {
                    setShowEditModal(false);
                    setEditError(null);
                    setEditingTask(null);
                    setAiAssignError(null);
                    editTaskForm.resetForm();
                }}
                formik={editTaskForm}
            />
        </div>
    );
}
