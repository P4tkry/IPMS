import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlobalPermission } from "@prisma/client";
import {
  DASHBOARD_MANAGE_PERMISSION,
  PROJECT_EDIT_PERMISSION,
  PROJECT_REMOVE_PERMISSION,
  PROJECT_USERS_MANAGE_PERMISSION,
} from "@/lib/projects/permissions";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true },
  });

  if (!currentUser?.permissions?.includes(GlobalPermission.CREATE_ALL_PROJECTS)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string; outcome?: string; tradeName?: string };
  const name = body.name?.trim() || "";
  const outcome = body.outcome?.trim() || "";
  const tradeName = body.tradeName?.trim() || null;
  const hasDetails = Boolean(name) || Boolean(outcome);

  const project = await prisma.project.create({
    data: {
      name: name || null,
      tradeName,
      description: outcome || null,
      isDraft: true,
    },
    select: {
      id: true,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: session.user.id } },
    update: {
      permissions: [
        PROJECT_USERS_MANAGE_PERMISSION,
        DASHBOARD_MANAGE_PERMISSION,
        PROJECT_REMOVE_PERMISSION,
        PROJECT_EDIT_PERMISSION,
      ],
      role: "OWNER",
    },
    create: {
      projectId: project.id,
      userId: session.user.id,
      permissions: [
        PROJECT_USERS_MANAGE_PERMISSION,
        DASHBOARD_MANAGE_PERMISSION,
        PROJECT_REMOVE_PERMISSION,
        PROJECT_EDIT_PERMISSION,
      ],
      role: "OWNER",
    },
  });

  return Response.json({ project }, { status: 201 });
}
