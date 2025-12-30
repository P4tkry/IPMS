import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const validPermissions = new Set([
  "CREATE_USERS",
  "REMOVE_USERS",
  "UPDATE_USERS",
  "UPLOAD_PHOTOS",
  "CREATE_ALL_PROJECTS",
  "REMOVE_ALL_PROJECTS",
  "UPDATE_ALL_PROJECTS",
]);

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true },
  });

  if (!currentUser?.permissions?.includes("UPDATE_USERS")) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    permissions?: string[];
  };

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  if ("name" in body && !name) {
    return Response.json({ message: "Imie i nazwisko jest wymagane." }, { status: 400 });
  }

  let permissions: string[] | undefined = undefined;
  if (Array.isArray(body.permissions)) {
    const filtered = body.permissions.filter((value) => validPermissions.has(value));
    permissions = Array.from(new Set(filtered));
  }

  if (name == null && permissions == null) {
    return Response.json({ message: "Brak danych do aktualizacji." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(permissions !== undefined ? { permissions } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      permissions: true,
      createdAt: true,
    },
  });

  return Response.json({ user });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true },
  });

  if (!currentUser?.permissions?.includes("REMOVE_USERS")) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  if (userId === session.user.id) {
    return Response.json({ message: "Nie mozna usunac swojego konta." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });

  return Response.json({ status: "ok" });
}
