import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DASHBOARD_MANAGE_PERMISSION, DASHBOARD_POST_PERMISSION } from "@/lib/projects/permissions";

const entrySelect = {
  id: true,
  title: true,
  content: true,
  tags: true,
  urgent: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
} as const;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; entryId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId, entryId } = await params;

  const entry = await prisma.projectDashboardEntry.findFirst({
    where: { id: entryId, projectId },
    select: { id: true, projectId: true, authorId: true },
  });

  if (!entry) {
    return Response.json({ message: "Entry not found." }, { status: 404 });
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { permissions: true },
  });

  if (!membership) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const canManage = membership.permissions?.includes(DASHBOARD_MANAGE_PERMISSION) === true;
  const canPost = canManage || membership.permissions?.includes(DASHBOARD_POST_PERMISSION) === true;
  const isAuthor = entry.authorId === session.user.id;

  if (!canManage && !(canPost && isAuthor)) {
    return Response.json({ message: "Missing permission DASHBOARD_POST." }, { status: 403 });
  }

  await prisma.projectDashboardEntry.delete({ where: { id: entryId } });

  return Response.json({ success: true }, { status: 200 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; entryId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId, entryId } = await params;
  const body = (await request.json()) as { title?: string; content?: string; tags?: unknown; urgent?: unknown };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const tags =
    Array.isArray(body.tags) && body.tags.every((tag) => typeof tag === "string")
      ? body.tags.map((tag) => tag.trim()).filter(Boolean)
      : [];
  const urgent = body.urgent === true;

  if (!title) {
    return Response.json({ message: "Title is required." }, { status: 400 });
  }
  if (!content) {
    return Response.json({ message: "Content is required." }, { status: 400 });
  }

  const entry = await prisma.projectDashboardEntry.findFirst({
    where: { id: entryId, projectId },
    select: { id: true, projectId: true, authorId: true },
  });

  if (!entry) {
    return Response.json({ message: "Entry not found." }, { status: 404 });
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { permissions: true },
  });

  if (!membership) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const canManage = membership.permissions?.includes(DASHBOARD_MANAGE_PERMISSION) === true;
  const canPost = canManage || membership.permissions?.includes(DASHBOARD_POST_PERMISSION) === true;
  const isAuthor = entry.authorId === session.user.id;

  if (!canManage && !(canPost && isAuthor)) {
    return Response.json({ message: "Missing permission DASHBOARD_POST." }, { status: 403 });
  }

  const updated = await prisma.projectDashboardEntry.update({
    where: { id: entryId },
    data: { title, content, tags, urgent },
    select: entrySelect,
  });

  return Response.json({ entry: updated }, { status: 200 });
}
