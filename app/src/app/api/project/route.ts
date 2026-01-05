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

  const body = (await request.json()) as {
    isDraft?: boolean;
    name?: string;
    description?: string;
    logo?: string;
  };

  const isDraft = Boolean(body.isDraft);
  const name = body.name?.trim() || "";
  if (!name) {
    return Response.json({ message: "Nazwa projektu jest wymagana." }, { status: 400 });
  }

  const description = body.description?.trim() || null;
  const logo = body.logo?.trim() || null;

  const project = await prisma.project.create({
    data: {
      name,
      description,
      logo,
      leaderId: session.user.id,
      isDraft,
    },
    select: {
      id: true,
      name: true,
      description: true,
      logo: true,
      isDraft: true,
      createdAt: true,
    },
  });

  return Response.json({ project }, { status: 201 });
}
