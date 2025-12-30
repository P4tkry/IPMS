import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      bio: true,
      socialLinks: { select: { id: true, platform: true, url: true } },
      permissions: true,
    },
  });

  return Response.json({ user });
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    bio?: string;
    socialLinks?: Array<{ platform: string; url: string }>;
  };

  const name = body.name?.trim() || "";
  if ("name" in body && !name) {
    return Response.json({ message: "Imie i nazwisko jest wymagane." }, { status: 400 });
  }
  const bio = body.bio?.trim() || null;
  const socialLinks = (body.socialLinks || [])
    .map((link) => ({
      platform: link.platform,
      url: link.url.trim(),
    }))
    .filter((link) => link.url.length > 0);

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name ? { name } : {}),
      bio,
      socialLinks: {
        deleteMany: {},
        create: socialLinks,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      bio: true,
      socialLinks: { select: { id: true, platform: true, url: true } },
      permissions: true,
    },
  });

  return Response.json({ user });
}
