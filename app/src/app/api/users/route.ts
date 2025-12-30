import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const accessPermissions = ["CREATE_USERS", "UPDATE_USERS", "REMOVE_USERS"] as const;

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true },
  });

  const canAccess = accessPermissions.some((permission) =>
    currentUser?.permissions?.includes(permission),
  );
  if (!canAccess) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      permissions: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ users });
}
