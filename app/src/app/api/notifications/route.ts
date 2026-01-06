"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Notification =
  | {
      id: string;
      type: "project_invite";
      createdAt: string;
      data: {
        projectId: string;
        projectName: string | null;
        projectTradeName: string | null;
        invitedBy?: { id: string; name: string | null; email: string | null; image: string | null };
      };
    };

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const projectInvites = await prisma.projectInvite.findMany({
    where: { invitedUserId: session.user.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      project: { select: { id: true, name: true, tradeName: true } },
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const notifications: Notification[] = projectInvites.map((invite) => ({
    id: invite.id,
    type: "project_invite",
    createdAt: invite.createdAt.toISOString(),
    data: {
      projectId: invite.project?.id ?? "",
      projectName: invite.project?.name ?? null,
      projectTradeName: invite.project?.tradeName ?? null,
      invitedBy: invite.invitedBy || undefined,
    },
  }));

  return Response.json({ notifications });
}
