"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TASKS_CUD_PERMISSION, TASK_VIEW_PERMISSION } from "@/lib/projects/permissions";

const taskSelect = {
  id: true,
  title: true,
  description: true,
  deliveryGuidelines: true,
  taskNumber: true,
  status: true,
  deadline: true,
  pertX: true,
  pertY: true,
  sprintId: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      code: true,
      color: true,
      description: true,
    },
  },
  assignedMember: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  },
  dependentTask: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
} as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    return Response.json({ message: "Project not found." }, { status: 404 });
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { id: true, permissions: true },
  });

  if (!membership) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const permissionSet = new Set<string>(membership.permissions ?? []);

  const canView = permissionSet.has(TASK_VIEW_PERMISSION) || permissionSet.has(TASKS_CUD_PERMISSION);
  if (!canView) {
    return Response.json({ message: "Missing permission TASK_VIEW." }, { status: 403 });
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    select: taskSelect,
  });

  return Response.json({ tasks });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const body = (await request.json()) as {
    title?: string;
    description?: string;
    deliveryGuidelines?: string | null;
    status?: string;
    deadline?: string | null;
    assignedMemberId?: string | null;
    dependentTaskId?: string | null;
    categoryCode?: string | null;
  };

  if (Object.prototype.hasOwnProperty.call(body, "taskNumber")) {
    return Response.json({ message: "Task number is managed automatically." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const deliveryGuidelines =
    typeof body.deliveryGuidelines === "string" && body.deliveryGuidelines.trim()
      ? body.deliveryGuidelines.trim()
      : undefined;
  const status = (typeof body.status === "string" ? body.status.trim().toUpperCase() : "TODO") as
    | "TODO"
    | "IN_PROGRESS"
    | "BLOCKED"
    | "READY_FOR_REVIEW"
    | "IN_REVIEW"
    | "DONE"
    | "REJECTED"
    | "CANCELLED";
  const deadline =
    typeof body.deadline === "string" && body.deadline
      ? new Date(body.deadline)
      : undefined;
  const assignedMemberId =
    typeof body.assignedMemberId === "string" && body.assignedMemberId.trim()
      ? body.assignedMemberId.trim()
      : undefined;
  const dependentTaskId =
    typeof body.dependentTaskId === "string" && body.dependentTaskId.trim()
      ? body.dependentTaskId.trim()
      : undefined;
  const categoryCode =
    typeof body.categoryCode === "string" && body.categoryCode.trim()
      ? body.categoryCode.trim().toUpperCase()
      : undefined;

  if (!title) {
    return Response.json({ message: "Title is required." }, { status: 400 });
  }

  if (!categoryCode) {
    return Response.json({ message: "Category is required." }, { status: 400 });
  }

  if (
    ![
      "TODO",
      "IN_PROGRESS",
      "BLOCKED",
      "READY_FOR_REVIEW",
      "IN_REVIEW",
      "DONE",
      "REJECTED",
      "CANCELLED",
    ].includes(status)
  ) {
    return Response.json({ message: "Invalid status." }, { status: 400 });
  }

  if (deadline && Number.isNaN(deadline.getTime())) {
    return Response.json({ message: "Invalid deadline." }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    return Response.json({ message: "Project not found." }, { status: 404 });
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { id: true, permissions: true },
  });

  if (!membership) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const permissionSet = new Set<string>(membership.permissions ?? []);

  const canCreate = permissionSet.has(TASKS_CUD_PERMISSION);
  if (!canCreate) {
    return Response.json({ message: "Missing permission TASKS_CUD." }, { status: 403 });
  }

  let assignedMember;
  if (assignedMemberId) {
    assignedMember = await prisma.projectMember.findUnique({
      where: { id: assignedMemberId },
      select: { id: true, projectId: true },
    });
    if (!assignedMember || assignedMember.projectId !== projectId) {
      return Response.json({ message: "Invalid assignee." }, { status: 400 });
    }
  }

  let dependency;
  if (dependentTaskId) {
    dependency = await prisma.task.findUnique({
      where: { id: dependentTaskId },
      select: { id: true, projectId: true },
    });
    if (!dependency || dependency.projectId !== projectId) {
      return Response.json({ message: "Invalid dependency." }, { status: 400 });
    }
  }

  const category = await prisma.taskCategory.findUnique({
    where: { code: categoryCode },
    select: { id: true },
  });
  if (!category) {
    return Response.json({ message: "Invalid category." }, { status: 400 });
  }

  const task = await prisma.$transaction(async (tx) => {
    const maxResult = await tx.task.aggregate({
      where: { categoryId: category.id },
      _max: { taskNumber: true },
    });
    const nextTaskNumber = (maxResult._max.taskNumber ?? 0) + 1;

    return tx.task.create({
      data: {
        title,
        description,
        deliveryGuidelines,
        taskNumber: nextTaskNumber,
        status,
        deadline: deadline ?? null,
        projectId,
        assignedMemberId: assignedMemberId ?? null,
        dependentTaskId: dependentTaskId ?? null,
        categoryId: category.id,
      },
      select: taskSelect,
    });
  });

  return Response.json({ task }, { status: 201 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const body = (await request.json()) as {
    taskId?: string;
    title?: string;
    description?: string | null;
    deliveryGuidelines?: string | null;
    status?: string;
    deadline?: string | null;
    pertX?: number | null;
    pertY?: number | null;
    assignedMemberId?: string | null;
    dependentTaskId?: string | null;
    categoryCode?: string | null;
    sprintId?: string | null;
  };

  const taskId = typeof body.taskId === "string" ? body.taskId.trim() : "";
  if (!taskId) {
    return Response.json({ message: "taskId is required." }, { status: 400 });
  }

  if (Object.prototype.hasOwnProperty.call(body, "taskNumber")) {
    return Response.json({ message: "Task number is managed automatically." }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    return Response.json({ message: "Project not found." }, { status: 404 });
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { id: true, permissions: true },
  });

  if (!membership) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const permissionSet = new Set<string>(membership.permissions ?? []);
  const canUpdate = permissionSet.has(TASKS_CUD_PERMISSION);
  if (!canUpdate) {
    return Response.json({ message: "Missing permission TASKS_CUD." }, { status: 403 });
  }

  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true, categoryId: true },
  });

  if (!existingTask || existingTask.projectId !== projectId) {
    return Response.json({ message: "Task not found." }, { status: 404 });
  }

  const data: {
    title?: string;
    description?: string | null;
    deliveryGuidelines?: string | null;
    status?:
      | "TODO"
      | "IN_PROGRESS"
      | "BLOCKED"
      | "READY_FOR_REVIEW"
      | "IN_REVIEW"
      | "DONE"
      | "REJECTED"
      | "CANCELLED";
    deadline?: Date | null;
    pertX?: number | null;
    pertY?: number | null;
    assignedMemberId?: string | null;
    dependentTaskId?: string | null;
    categoryId?: string | null;
    sprintId?: string | null;
  } = {};

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return Response.json({ message: "Title is required." }, { status: 400 });
    }
    data.title = title;
  }

  if (typeof body.description === "string") {
    data.description = body.description.trim();
  } else if (body.description === null) {
    data.description = null;
  }

  if (typeof body.deliveryGuidelines === "string") {
    const guidelines = body.deliveryGuidelines.trim();
    data.deliveryGuidelines = guidelines ? guidelines : null;
  } else if (body.deliveryGuidelines === null) {
    data.deliveryGuidelines = null;
  }

  if (typeof body.status === "string") {
    const status = body.status.trim().toUpperCase() as
      | "TODO"
      | "IN_PROGRESS"
      | "BLOCKED"
      | "READY_FOR_REVIEW"
      | "IN_REVIEW"
      | "DONE"
      | "REJECTED"
      | "CANCELLED";
    if (
      ![
        "TODO",
        "IN_PROGRESS",
        "BLOCKED",
        "READY_FOR_REVIEW",
        "IN_REVIEW",
        "DONE",
        "REJECTED",
        "CANCELLED",
      ].includes(status)
    ) {
      return Response.json({ message: "Invalid status." }, { status: 400 });
    }
    data.status = status;
  }

  if (Object.prototype.hasOwnProperty.call(body, "deadline")) {
    if (typeof body.deadline === "string" && body.deadline) {
      const deadline = new Date(body.deadline);
      if (Number.isNaN(deadline.getTime())) {
        return Response.json({ message: "Invalid deadline." }, { status: 400 });
      }
      data.deadline = deadline;
    } else {
      data.deadline = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "pertX")) {
    if (typeof body.pertX === "number" && Number.isFinite(body.pertX)) {
      data.pertX = body.pertX;
    } else {
      data.pertX = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "pertY")) {
    if (typeof body.pertY === "number" && Number.isFinite(body.pertY)) {
      data.pertY = body.pertY;
    } else {
      data.pertY = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "assignedMemberId")) {
    if (typeof body.assignedMemberId === "string" && body.assignedMemberId.trim()) {
      const assignedMember = await prisma.projectMember.findUnique({
        where: { id: body.assignedMemberId.trim() },
        select: { id: true, projectId: true },
      });
      if (!assignedMember || assignedMember.projectId !== projectId) {
        return Response.json({ message: "Invalid assignee." }, { status: 400 });
      }
      data.assignedMemberId = assignedMember.id;
    } else {
      data.assignedMemberId = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "dependentTaskId")) {
    if (typeof body.dependentTaskId === "string" && body.dependentTaskId.trim()) {
      const dependentTaskId = body.dependentTaskId.trim();
      if (dependentTaskId === taskId) {
        return Response.json({ message: "Task cannot depend on itself." }, { status: 400 });
      }
      const dependency = await prisma.task.findUnique({
        where: { id: dependentTaskId },
        select: { id: true, projectId: true },
      });
      if (!dependency || dependency.projectId !== projectId) {
        return Response.json({ message: "Invalid dependency." }, { status: 400 });
      }
      data.dependentTaskId = dependentTaskId;
    } else {
      data.dependentTaskId = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "categoryCode")) {
    if (typeof body.categoryCode === "string" && body.categoryCode.trim()) {
      const category = await prisma.taskCategory.findUnique({
        where: { code: body.categoryCode.trim().toUpperCase() },
        select: { id: true },
      });
      if (!category) {
        return Response.json({ message: "Invalid category." }, { status: 400 });
      }
      data.categoryId = category.id;
    } else {
      return Response.json({ message: "Category is required." }, { status: 400 });
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "sprintId")) {
    if (typeof body.sprintId === "string" && body.sprintId.trim()) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: body.sprintId.trim() },
        select: { id: true, projectId: true },
      });
      if (!sprint || sprint.projectId !== projectId) {
        return Response.json({ message: "Invalid sprint." }, { status: 400 });
      }
      data.sprintId = sprint.id;
    } else {
      data.sprintId = null;
    }
  }

  if (data.categoryId) {
    const categoryId = data.categoryId ?? existingTask.categoryId;
    if (!categoryId) {
      return Response.json({ message: "Category is required." }, { status: 400 });
    }
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ message: "No changes provided." }, { status: 400 });
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data,
    select: taskSelect,
  });

  return Response.json({ task });
}
