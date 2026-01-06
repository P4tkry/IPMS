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
    select: { permissions: true },
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
    return Response.json({ active: false });
  }

  const [totalCount, inProgressCount, doneCount] = await Promise.all([
    prisma.task.count({ where: { sprintId: sprint.id } }),
    prisma.task.count({ where: { sprintId: sprint.id, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { sprintId: sprint.id, status: "DONE" } }),
  ]);

  return Response.json({
    active: true,
    sprint: {
      id: sprint.id,
      name: sprint.name,
      sprintNumber: sprint.sprintNumber,
      startDate: sprint.startDate.toISOString(),
      endDate: sprint.endDate.toISOString(),
      totalCount,
      inProgressCount,
      doneCount,
    },
  });
}
