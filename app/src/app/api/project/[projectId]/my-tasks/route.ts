import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TASKS_CUD_PERMISSION, TASK_VIEW_PERMISSION } from "@/lib/projects/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { id: true, permissions: true },
  });

  if (!membership) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const permissionSet = new Set(membership.permissions ?? []);
  const canView = permissionSet.has(TASK_VIEW_PERMISSION) || permissionSet.has(TASKS_CUD_PERMISSION);
  if (!canView) {
    return Response.json({ message: "Missing permission TASK_VIEW." }, { status: 403 });
  }

  const now = new Date();
  const sprint = await prisma.sprint.findFirst({
    where: {
      projectId,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    select: {
      id: true,
      name: true,
      sprintNumber: true,
      startDate: true,
      endDate: true,
    },
    orderBy: [{ startDate: "desc" }, { sprintNumber: "desc" }],
  });

  if (!sprint) {
    return Response.json({ sprint: null });
  }

  const tasks = await prisma.task.findMany({
    where: {
      sprintId: sprint.id,
      assignedMemberId: membership.id,
    },
    select: {
      id: true,
      title: true,
      taskNumber: true,
      status: true,
      deadline: true,
      sprintId: true,
      category: { select: { code: true } },
    },
    orderBy: [{ deadline: "asc" }, { taskNumber: "asc" }],
  });

  const sprintPayload = {
    id: sprint.id,
    name: sprint.name,
    sprintNumber: sprint.sprintNumber,
    startDate: sprint.startDate.toISOString(),
    endDate: sprint.endDate.toISOString(),
    tasks: [] as Array<{
      id: string;
      title: string;
      issueId: string;
      status: string;
      deadline: string | null;
    }>,
  };

  tasks.forEach((task) => {
    const issueCode = task.category?.code ? task.category.code.trim().toUpperCase() : "TASK";
    sprintPayload.tasks.push({
      id: task.id,
      title: task.title,
      issueId: `${issueCode}-${task.taskNumber}`,
      status: task.status,
      deadline: task.deadline ? task.deadline.toISOString() : null,
    });
  });

  return Response.json({
    sprint: sprintPayload,
  });
}
