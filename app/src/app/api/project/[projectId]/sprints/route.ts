"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TASKS_CUD_PERMISSION, TASK_VIEW_PERMISSION } from "@/lib/projects/permissions";

const sprintSelect = {
  id: true,
  name: true,
  sprintNumber: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
  tasks: {
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

  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    orderBy: [{ startDate: "asc" }, { sprintNumber: "asc" }],
    select: sprintSelect,
  });

  return Response.json({ sprints });
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
    name?: string;
    sprintNumber?: number;
    startDate?: string;
    endDate?: string;
    taskIds?: string[];
  };

  if (Object.prototype.hasOwnProperty.call(body, "sprintNumber")) {
    return Response.json({ message: "Sprint number is managed automatically." }, { status: 400 });
  }

  if (Object.prototype.hasOwnProperty.call(body, "taskIds")) {
    return Response.json({ message: "Tasks are assigned outside of sprint creation." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const startDate = typeof body.startDate === "string" ? new Date(body.startDate) : null;
  const endDate = typeof body.endDate === "string" ? new Date(body.endDate) : null;

  if (!name) {
    return Response.json({ message: "Name is required." }, { status: 400 });
  }

  if (!startDate || Number.isNaN(startDate.getTime())) {
    return Response.json({ message: "Start date is required." }, { status: 400 });
  }

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return Response.json({ message: "End date is required." }, { status: 400 });
  }

  if (endDate < startDate) {
    return Response.json({ message: "End date must be after start date." }, { status: 400 });
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

  const overlapping = await prisma.sprint.findFirst({
    where: {
      projectId,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    select: { id: true },
  });
  if (overlapping) {
    return Response.json(
      { message: "Sprint dates overlap with an existing sprint." },
      { status: 400 },
    );
  }

  const sprint = await prisma.$transaction(async (tx) => {
    const maxSprint = await tx.sprint.aggregate({
      where: { projectId },
      _max: { sprintNumber: true },
    });
    const nextSprintNumber = (maxSprint._max.sprintNumber ?? 0) + 1;

    const created = await tx.sprint.create({
      data: {
        name,
        sprintNumber: nextSprintNumber,
        startDate,
        endDate,
        projectId,
      },
    });

    return tx.sprint.findUnique({
      where: { id: created.id },
      select: sprintSelect,
    });
  });

  if (!sprint) {
    return Response.json({ message: "Failed to create sprint." }, { status: 500 });
  }

  return Response.json({ sprint }, { status: 201 });
}
