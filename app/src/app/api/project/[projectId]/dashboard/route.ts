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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const takeParam = Number(url.searchParams.get("take"));
  const take = Number.isFinite(takeParam) && takeParam > 0 ? Math.min(takeParam, 50) : 10;

  const exists = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!exists) {
    return Response.json({ message: "Project not found." }, { status: 404 });
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { id: true },
  });

  if (!membership) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  if (cursor) {
    const cursorEntry = await prisma.projectDashboardEntry.findFirst({
      where: { id: cursor, projectId },
      select: { id: true },
    });

    if (!cursorEntry) {
      return Response.json({ message: "Invalid cursor." }, { status: 400 });
    }
  }

  const entries = await prisma.projectDashboardEntry.findMany({
    where: { projectId },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    take: take + 1,
    select: entrySelect,
  });

  const hasMore = entries.length > take;
  const sliced = hasMore ? entries.slice(0, take) : entries;
  const nextCursor = hasMore ? sliced[sliced.length - 1]?.id : null;

  return Response.json({
    entries: sliced,
    nextCursor,
    hasMore,
  });
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
  const body = (await request.json()) as { title?: string; content?: string; tags?: unknown; urgent?: unknown };

  const content = typeof body.content === "string" ? body.content.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
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

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { permissions: true },
  });

  if (!membership) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const canManage = membership.permissions?.includes(DASHBOARD_MANAGE_PERMISSION) === true;
  const canPost = canManage || membership.permissions?.includes(DASHBOARD_POST_PERMISSION) === true;

  if (!canPost) {
    return Response.json({ message: "Missing permission DASHBOARD_POST." }, { status: 403 });
  }

  const entry = await prisma.projectDashboardEntry.create({
    data: {
      title,
      content,
      tags,
      urgent,
      projectId,
      authorId: session.user.id,
    },
    select: entrySelect,
  });

  return Response.json({ entry }, { status: 201 });
}
