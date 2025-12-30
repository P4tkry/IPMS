import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const INVITE_TTL_DAYS = 7;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return Response.json({ message: "Missing token." }, { status: 400 });
  }

  const invite = await prisma.invite.findUnique({
    where: { token },
    select: { name: true, email: true, expiresAt: true },
  });

  if (!invite) {
    return Response.json({ message: "Invite not found." }, { status: 404 });
  }

  if (invite.expiresAt < new Date()) {
    return Response.json({ message: "Invite expired." }, { status: 410 });
  }

  return Response.json({ invite });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true },
  });

  if (!user?.permissions?.includes("CREATE_USERS")) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string; email?: string };
  const name = body.name?.trim() || "";
  const email = body.email?.trim().toLowerCase() || "";
  if (!name || !email || !/.+@.+\..+/.test(email)) {
    return Response.json({ message: "Invalid name or email." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    return Response.json({ message: "User already exists." }, { status: 409 });
  }

  await prisma.invite.deleteMany({ where: { email } });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.invite.create({
    data: {
      name,
      email,
      token,
      expiresAt,
      createdById: session.user.id,
    },
  });

  const origin = new URL(request.url).origin;
  const link = `${origin}/register?token=${token}`;

  return Response.json({ link, expiresAt });
}
