import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import {
  Activity,
  BriefcaseBusiness,
  Crosshair,
  LayoutGrid,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  TASK_MESSAGE_CRUD_PERMISSION,
  TASKS_CUD_PERMISSION,
  TASK_VIEW_PERMISSION,
} from "@/lib/projects/permissions";
import TaskCompletionPanel from "./_components/task-completion-panel";

const statusLabels: Record<string, string> = {
  TODO: "Do zrobienia",
  IN_PROGRESS: "W trakcie",
  BLOCKED: "Zablokowane",
  READY_FOR_REVIEW: "Do review",
  IN_REVIEW: "W review",
  DONE: "Zakonczone",
  REJECTED: "Odrzucone",
  CANCELLED: "Anulowane",
};

const statusBadge: Record<string, string> = {
  TODO: "bg-[#f8f4ef] text-[#5b5044] border border-[#eadfd3]",
  IN_PROGRESS: "bg-amber-50 text-amber-800 border border-amber-200",
  BLOCKED: "bg-rose-50 text-rose-800 border border-rose-200",
  READY_FOR_REVIEW: "bg-sky-50 text-sky-800 border border-sky-200",
  IN_REVIEW: "bg-indigo-50 text-indigo-800 border border-indigo-200",
  DONE: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-800 border border-rose-200",
  CANCELLED: "bg-stone-100 text-stone-700 border border-stone-200",
};

const priorityBadge: Record<string, string> = {
  LOW: "bg-slate-50 text-slate-700 border border-slate-200",
  MEDIUM: "bg-blue-50 text-blue-800 border border-blue-200",
  HIGH: "bg-amber-50 text-amber-800 border border-amber-200",
  URGENT: "bg-rose-50 text-rose-800 border border-rose-200",
};

const defaultCategoryColor = "#eadfd3";
const hexColorRegex = /^#([0-9a-f]{3}){1,2}$/i;
const categoryIconMap: Record<string, LucideIcon> = {
  grid: LayoutGrid,
  target: Crosshair,
  users: Users,
  briefcase: BriefcaseBusiness,
  activity: Activity,
};

const formatDate = (value?: Date | null) =>
  value
    ? new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(value)
    : "Brak";

const stripHtml = (value?: string | null) =>
  value ? value.replace(/<[^>]*>/g, "").trim() : "";

const getInitials = (value?: string | null) => {
  if (!value) return "?";
  const parts = value.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

export default async function ProjectTaskPage({
  params,
}: {
  params: Promise<{ project_id: string; task_id: string }>;
}) {
  const { project_id: projectId, task_id: taskId } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const session = await auth.api.getSession({ headers: { cookie: cookieHeader } });
  if (!session?.user) {
    redirect("/login");
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { id: true, permissions: true },
  });

  if (!membership) {
    notFound();
  }

  const permissionSet = new Set<string>(membership.permissions ?? []);
  const canView =
    permissionSet.has(TASK_VIEW_PERMISSION)
    || permissionSet.has(TASKS_CUD_PERMISSION)
    || permissionSet.has(TASK_MESSAGE_CRUD_PERMISSION);
  const canManageTasks = permissionSet.has(TASKS_CUD_PERMISSION);

  if (!canView) {
    notFound();
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: {
      id: true,
      title: true,
      description: true,
      userStory: true,
      acceptanceCriteria: true,
      status: true,
      priority: true,
      completionDescription: true,
      completionLinks: true,
      completionFiles: true,
      taskNumber: true,
      deadline: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true, code: true, color: true, icon: true } },
      sprint: { select: { id: true, name: true, sprintNumber: true, startDate: true, endDate: true } },
      assignedMember: {
        select: {
          id: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      reviewMember: {
        select: {
          id: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      dependentTask: {
        select: {
          id: true,
          title: true,
          status: true,
          taskNumber: true,
          category: { select: { code: true } },
        },
      },
      blockingTasks: {
        select: {
          id: true,
          title: true,
          status: true,
          taskNumber: true,
          category: { select: { code: true } },
        },
      },
    },
  });

  if (!task) {
    notFound();
  }

  const issueId = task.category?.code
    ? `${task.category.code}-${task.taskNumber}`
    : `TASK-${task.taskNumber}`;
  const statusLabel = statusLabels[task.status] || task.status;
  const statusClass = statusBadge[task.status] || statusBadge.TODO;
  const priorityClass = priorityBadge[task.priority] || priorityBadge.MEDIUM;
  const categoryColor =
    typeof task.category?.color === "string" && hexColorRegex.test(task.category.color)
      ? task.category.color
      : defaultCategoryColor;
  const CategoryIcon = task.category?.icon
    ? categoryIconMap[task.category.icon] ?? Tags
    : Tags;
  const descriptionPlain = stripHtml(task.description);
  const userStory = stripHtml(task.userStory);
  const acceptance = stripHtml(task.acceptanceCriteria);
  const hasDescription = Boolean(descriptionPlain);
  const hasUserStory = Boolean(userStory);
  const hasAcceptance = Boolean(acceptance);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f4ef] via-white to-[#f8f4ef] px-6 py-12 text-[#2a241f]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Badge className="w-fit bg-[#2a241f] text-[#f6efe8] hover:bg-[#2a241f]">
              Szczegóły zadania
            </Badge>
            <h1 className="text-3xl font-semibold text-[#1f1b16]">{task.title}</h1>
            <p className="text-sm text-[#6f6255]">Zobacz status, priorytet i kontekst zadania.</p>
          </div>
        </div>

        <Card className="border-[#e2d6c9] bg-white/90 shadow-[0_24px_60px_-45px_rgba(60,40,20,0.35)]">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{
                    borderColor: categoryColor,
                    backgroundColor: `${categoryColor}1a`,
                    color: categoryColor,
                  }}
                >
                  {issueId}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusClass}`}
                >
                  {statusLabel}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${priorityClass}`}
                >
                  {task.priority}
                </span>
              </div>
              <div className="text-xs text-[#6f6255]">
                Aktualizacja: {formatDate(task.updatedAt)}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#eadfd3] bg-[#fbf7f1] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                  Kategoria
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full border"
                    style={{
                      borderColor: categoryColor,
                      backgroundColor: `${categoryColor}1a`,
                      color: categoryColor,
                    }}
                  >
                    <CategoryIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#2a241f]">
                      {task.category?.name || "Brak"}
                    </p>
                    <span
                      className="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                      style={{
                        borderColor: categoryColor,
                        backgroundColor: `${categoryColor}1a`,
                        color: categoryColor,
                      }}
                    >
                      {task.category?.code || "-"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#eadfd3] bg-[#fbf7f1] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                  Sprint
                </p>
                <p className="mt-2 text-sm font-semibold text-[#2a241f]">
                  {task.sprint ? `Sprint-${task.sprint.sprintNumber}` : "Brak sprintu"}
                </p>
                {task.sprint ? (
                  <p className="text-xs text-[#6f6255]">
                    {formatDate(task.sprint.startDate)} - {formatDate(task.sprint.endDate)}
                  </p>
                ) : (
                  <p className="text-xs text-[#6f6255]">Nieprzypisane</p>
                )}
              </div>
            </div>

            {(hasDescription || hasUserStory || hasAcceptance) ? (
              <div className="grid gap-4 md:grid-cols-2">
                {hasDescription ? (
                  <div
                    className={`rounded-2xl border border-[#eadfd3] bg-white p-4 ${hasUserStory ? "" : "md:col-span-2"}`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                      Opis
                    </p>
                    <p className="mt-2 text-sm text-[#2a241f]">
                      {descriptionPlain}
                    </p>
                  </div>
                ) : null}
                {hasUserStory ? (
                  <div
                    className={`rounded-2xl border border-[#eadfd3] bg-white p-4 ${hasDescription ? "" : "md:col-span-2"}`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                      User story
                    </p>
                    <p className="mt-2 text-sm text-[#2a241f]">
                      {userStory}
                    </p>
                  </div>
                ) : null}
                {hasAcceptance ? (
                  <div className="rounded-2xl border border-[#eadfd3] bg-white p-4 md:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                      Kryteria akceptacji
                    </p>
                    <p className="mt-2 text-sm text-[#2a241f]">
                      {acceptance}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#eadfd3] bg-[#fbf7f1] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                  Przypisany
                </p>
                {task.assignedMember?.user ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-[#eadfd3] bg-white">
                      {task.assignedMember.user.image ? (
                        <AvatarImage
                          src={task.assignedMember.user.image}
                          alt={task.assignedMember.user.name || task.assignedMember.user.email || "user"}
                        />
                      ) : null}
                      <AvatarFallback className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                        {getInitials(task.assignedMember.user.name || task.assignedMember.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-semibold text-[#2a241f]">
                      {task.assignedMember.user.name || task.assignedMember.user.email}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#6f6255]">Nieprzypisane</p>
                )}
              </div>
              <div className="rounded-2xl border border-[#eadfd3] bg-[#fbf7f1] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                  Reviewer
                </p>
                {task.reviewMember?.user ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-[#eadfd3] bg-white">
                      {task.reviewMember.user.image ? (
                        <AvatarImage
                          src={task.reviewMember.user.image}
                          alt={task.reviewMember.user.name || task.reviewMember.user.email || "user"}
                        />
                      ) : null}
                      <AvatarFallback className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f6255]">
                        {getInitials(task.reviewMember.user.name || task.reviewMember.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-semibold text-[#2a241f]">
                      {task.reviewMember.user.name || task.reviewMember.user.email}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#6f6255]">Brak osoby do review</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#eadfd3] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                  Zaleznosc
                </p>
                {task.dependentTask ? (
                  <p className="mt-2 text-sm text-[#2a241f]">
                    {(task.dependentTask.category?.code || "TASK")}-{task.dependentTask.taskNumber} ·{" "}
                    {task.dependentTask.title}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-[#6f6255]">Brak zaleznosci</p>
                )}
              </div>
              <div className="rounded-2xl border border-[#eadfd3] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                  Blokuje
                </p>
                {task.blockingTasks.length > 0 ? (
                  <div className="mt-2 space-y-1 text-sm text-[#2a241f]">
                    {task.blockingTasks.map((blocked) => (
                      <p key={blocked.id}>
                        {(blocked.category?.code || "TASK")}-{blocked.taskNumber} · {blocked.title}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#6f6255]">Brak blokowanych zadan</p>
                )}
              </div>
            </div>
            <TaskCompletionPanel
              projectId={projectId}
              taskId={taskId}
              memberId={membership.id}
              assignedMemberId={task.assignedMember?.id}
              canManageTasks={canManageTasks}
              initialCompletionDescription={task.completionDescription}
              initialCompletionLinks={task.completionLinks ?? []}
              initialCompletionFiles={task.completionFiles ?? []}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

