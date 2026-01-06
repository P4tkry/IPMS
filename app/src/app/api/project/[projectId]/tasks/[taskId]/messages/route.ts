"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TASK_MESSAGE_CRUD_PERMISSION } from "@/lib/projects/permissions";

const messageSelect = {
  id: true,
  content: true,
  createdAt: true,
  taskId: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
} as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId, taskId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { id: true, permissions: true },
  });

  if (!membership) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const permissionSet = new Set<string>(membership.permissions ?? []);
  if (!permissionSet.has(TASK_MESSAGE_CRUD_PERMISSION)) {
    return Response.json({ message: "Missing permission TASK_MESSAGE_CRUD." }, { status: 403 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true },
  });

  if (!task || task.projectId !== projectId) {
    return Response.json({ message: "Task not found." }, { status: 404 });
  }

  const messages = await prisma.taskMessage.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    select: messageSelect,
  });

  return Response.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId, taskId } = await params;
  const body = (await request.json()) as { content?: string };
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    return Response.json({ message: "Content is required." }, { status: 400 });
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { id: true, permissions: true },
  });

  if (!membership) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const permissionSet = new Set<string>(membership.permissions ?? []);
  if (!permissionSet.has(TASK_MESSAGE_CRUD_PERMISSION)) {
    return Response.json({ message: "Missing permission TASK_MESSAGE_CRUD." }, { status: 403 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true },
  });

  if (!task || task.projectId !== projectId) {
    return Response.json({ message: "Task not found." }, { status: 404 });
  }

  const message = await prisma.taskMessage.create({
    data: {
      content,
      taskId,
      authorId: session.user.id,
    },
    select: messageSelect,
  });

  const { getSocketIO } = await import("@/lib/socket");
  const io = getSocketIO();
  if (io) {
    io.to(`task:${taskId}`).emit("task:message", message);
  }

  return Response.json({ message }, { status: 201 });
}
