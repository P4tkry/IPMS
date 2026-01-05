import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true },
  });

  if (!currentUser?.permissions?.includes("CREATE_ALL_PROJECTS")) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string; outcome?: string };
  const name = body.name?.trim() || "";
  const outcome = body.outcome?.trim() || "";
  const hasDetails = Boolean(name) || Boolean(outcome);

  const project = await prisma.project.create({
    data: {
      name: name || null,
      description: outcome || null,
      isDraft: true,
      leader: {
        connect: { id: session.user.id },
      },
    },
    select: {
      id: true,
    },
  });

  return Response.json({ project }, { status: 201 });
}
