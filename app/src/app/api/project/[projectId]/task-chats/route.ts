"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TASK_MESSAGE_CRUD_PERMISSION } from "@/lib/projects/permissions";

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

  const permissionSet = new Set<string>(membership.permissions ?? []);
  if (!permissionSet.has(TASK_MESSAGE_CRUD_PERMISSION)) {
    return Response.json({ message: "Missing permission TASK_MESSAGE_CRUD." }, { status: 403 });
  }

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      messages: { some: { authorId: session.user.id } },
    },
    select: {
      id: true,
      title: true,
      taskNumber: true,
      category: { select: { code: true, name: true, color: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const chats = tasks.map((task) => {
    const issueCode = task.category?.code ? task.category.code.trim().toUpperCase() : "TASK";
    const taskNumber = typeof task.taskNumber === "number" ? task.taskNumber : 0;
    return {
      id: task.id,
      title: task.title,
      issueId: `${issueCode}-${taskNumber}`,
      category: task.category,
      lastMessage: task.messages[0] ?? null,
    };
  });

  return Response.json({ chats });
}
