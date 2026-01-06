import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TASKS_CUD_PERMISSION } from "@/lib/projects/permissions";

const categorySelect = {
  id: true,
  name: true,
  code: true,
  color: true,
  icon: true,
  description: true,
  _count: { select: { tasks: true } },
} as const;

const hexColorRegex = /^#(?:[0-9a-fA-F]{6})$/u;
const iconValues = ["grid", "target", "users", "briefcase", "activity"] as const;

type GuardResult =
  | { projectId: string; userId: string }
  | { response: Response };

async function ensureTasksPermission(request: Request): Promise<GuardResult> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return { response: Response.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) {
    return { response: Response.json({ message: "Missing projectId." }, { status: 400 }) };
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { permissions: true },
  });

  if (!membership) {
    return { response: Response.json({ message: "Forbidden" }, { status: 403 }) };
  }

  const canManageTasks = (membership.permissions ?? []).includes(TASKS_CUD_PERMISSION);
  if (!canManageTasks) {
    return { response: Response.json({ message: "Missing permission TASKS_CUD." }, { status: 403 }) };
  }

  return { projectId, userId: session.user.id };
}

export async function GET(request: Request) {
  const guard = await ensureTasksPermission(request);
  if ("response" in guard) return guard.response;

  const categories = await prisma.taskCategory.findMany({
    select: categorySelect,
    orderBy: [{ name: "asc" }, { code: "asc" }],
  });

  const normalized = categories.map(({ _count, ...category }) => ({
    ...category,
    tasksCount: _count?.tasks ?? 0,
  }));

  return Response.json({ categories: normalized });
}

export async function POST(request: Request) {
  const guard = await ensureTasksPermission(request);
  if ("response" in guard) return guard.response;

  const body = (await request.json()) as {
    name?: string;
    code?: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
  };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const color = typeof body.color === "string" ? body.color.trim() : "";
  const isValidHex = hexColorRegex.test(color);
  const icon =
    typeof body.icon === "string" && iconValues.includes(body.icon.trim() as (typeof iconValues)[number])
      ? body.icon.trim()
      : null;

  if (!name) {
    return Response.json({ message: "Name is required." }, { status: 400 });
  }

  if (!code) {
    return Response.json({ message: "Code is required." }, { status: 400 });
  }

  if (!isValidHex) {
    return Response.json({ message: "Color must be a valid hex value." }, { status: 400 });
  }

  try {
    const category = await prisma.taskCategory.create({
      data: {
        name,
        code,
        color,
        description: description ?? null,
        icon,
      },
      select: categorySelect,
    });
    const { _count, ...rest } = category;
    return Response.json(
      {
        category: { ...rest, tasksCount: _count?.tasks ?? 0 },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ message: "Category code must be unique." }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Failed to create task category.";
    return Response.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await ensureTasksPermission(request);
  if ("response" in guard) return guard.response;

  const searchParams = new URL(request.url).searchParams;
  const categoryId = searchParams.get("categoryId");

  if (!categoryId) {
    return Response.json({ message: "categoryId is required." }, { status: 400 });
  }

  const category = await prisma.taskCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, _count: { select: { tasks: true } } },
  });

  if (!category) {
    return Response.json({ message: "Category not found." }, { status: 404 });
  }

  const tasksCount = category._count?.tasks ?? 0;
  if (tasksCount > 0) {
    return Response.json(
      { message: "Cannot delete category with existing tasks." },
      { status: 409 },
    );
  }

  await prisma.taskCategory.delete({ where: { id: categoryId } });

  return Response.json({ categoryId });
}
