import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Permission } from "@prisma/client";

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string; password?: string };
  const token = body.token?.trim() || "";
  const password = body.password || "";

  if (!token || !password) {
    return Response.json({ message: "Missing token or password." }, { status: 400 });
  }

  const invite = await prisma.invite.findUnique({
    where: { token },
  });

  if (!invite) {
    return Response.json({ message: "Invite not found." }, { status: 404 });
  }

  if (invite.expiresAt < new Date()) {
    return Response.json({ message: "Invite expired." }, { status: 410 });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
      select: { id: true },
    });
    if (existingUser) {
      return Response.json({ message: "User already exists." }, { status: 409 });
    }

    await auth.api.signUpEmail({
      body: {
        name: invite.name,
        email: invite.email,
        password,
      },
    });

    const createdUser = await prisma.user.findUnique({
      where: { email: invite.email },
      select: { permissions: true },
    });

    if (createdUser && !createdUser.permissions.includes(Permission.UPLOAD_PHOTOS)) {
      await prisma.user.update({
        where: { email: invite.email },
        data: {
          permissions: { set: [...createdUser.permissions, Permission.UPLOAD_PHOTOS] },
        },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nie udalo sie utworzyc konta.";
    return Response.json({ message }, { status: 400 });
  }

  await prisma.invite.delete({ where: { id: invite.id } });

  return Response.json({ status: "ok" }, { status: 201 });
}
