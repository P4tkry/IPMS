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

  const body = (await request.json()) as {
    isDraft?: boolean;
    name?: string;
    tradeName?: string;
    description?: string;
    logo?: string;
  };

  const isDraft = typeof body.isDraft === "boolean" ? body.isDraft : true;
  const name = body.name?.trim() || "";
  const tradeName = body.tradeName?.trim() || null;
  if (!name) {
    return Response.json({ message: "Nazwa projektu jest wymagana." }, { status: 400 });
  }

  const description = body.description?.trim() || null;
  const logo = body.logo?.trim() || null;

  const project = await prisma.project.create({
    data: {
      name,
      tradeName,
      description,
      logo,
      isDraft,
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      description: true,
      logo: true,
      isDraft: true,
      createdAt: true,
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
