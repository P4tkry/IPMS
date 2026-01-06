"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROJECT_USERS_MANAGE_PERMISSION } from "@/lib/projects/permissions";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getInviteExtras(invite: { status: string; createdAt: Date; invitedById: string }) {
  const expiresAt = new Date(invite.createdAt.getTime() + INVITE_TTL_MS);
  const now = new Date();
  const expired = now > expiresAt && invite.status !== "ACCEPTED";
  let displayStatus: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "REVOKED" =
    invite.status as "PENDING" | "ACCEPTED" | "DECLINED";

  if (expired) {
    displayStatus = "EXPIRED";
  } else if (invite.status === "DECLINED") {
    displayStatus = invite.invitedById ? "REVOKED" : "DECLINED";
  }

  return { expiresAt, displayStatus, expired };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, tradeName: true },
  });

  if (!project) {
    return Response.json({ message: "Project not found." }, { status: 404 });
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { permissions: true },
  });

  const canManageUsers =
    membership?.permissions?.includes(PROJECT_USERS_MANAGE_PERMISSION) === true;

  if (!membership || !canManageUsers) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  await prisma.projectInvite.updateMany({
    where: {
      projectId,
      status: "PENDING",
      createdAt: { lt: new Date(Date.now() - INVITE_TTL_MS) },
    },
    data: { status: "DECLINED" },
  });

  const canInvite = Boolean(canManageUsers);

  const incoming = await prisma.projectInvite.findMany({
    where: { projectId, invitedUserId: session.user.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
      project: { select: { id: true, name: true, tradeName: true } },
    },
  });

  const sent = canInvite
    ? await prisma.projectInvite.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          invitedById: true,
          invitedUser: { select: { id: true, name: true, email: true, image: true } },
          invitedBy: { select: { id: true, name: true, email: true, image: true } },
        },
      })
    : [];

  return Response.json({
    invitations: {
      incoming,
      sent: sent.map((invite) => {
        const extras = getInviteExtras(invite);
        return { ...invite, ...extras };
      }),
    },
    canInvite,
    pendingInvite: false,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    return Response.json({ message: "Project not found." }, { status: 404 });
  }

  let membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { permissions: true },
  });

  const canManageUsers =
    membership?.permissions?.includes(PROJECT_USERS_MANAGE_PERMISSION) === true;

  if (!membership || !canManageUsers) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const canInvite = Boolean(canManageUsers);

  if (!canInvite) {
    return Response.json({ message: "Missing permission USERS_MANAGE." }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase() || "";

  if (!email || !/.+@.+\..+/.test(email)) {
    return Response.json({ message: "Invalid email." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, image: true },
  });

  if (!user) {
    return Response.json({ message: "User not found." }, { status: 404 });
  }

  const existingMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
    select: { id: true },
  });

  if (existingMember) {
    return Response.json({ message: "User is already a member." }, { status: 409 });
  }

  const existingInvite = await prisma.projectInvite.findUnique({
    where: { projectId_invitedUserId: { projectId, invitedUserId: user.id } },
    select: { id: true, status: true },
  });

  if (existingInvite?.status === "PENDING") {
    return Response.json({ message: "Invite already sent." }, { status: 409 });
  }

  if (existingInvite?.status === "ACCEPTED") {
    return Response.json({ message: "User already accepted an invite." }, { status: 409 });
  }

  const invite = existingInvite
    ? await prisma.projectInvite.update({
        where: { id: existingInvite.id },
        data: { status: "PENDING", invitedById: session.user.id, createdAt: new Date() },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        invitedById: true,
        invitedUser: { select: { id: true, name: true, email: true, image: true } },
        invitedBy: { select: { id: true, name: true, email: true, image: true } },
      },
    })
    : await prisma.projectInvite.create({
        data: {
          projectId,
          invitedUserId: user.id,
          invitedById: session.user.id,
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          invitedById: true,
          invitedUser: { select: { id: true, name: true, email: true, image: true } },
          invitedBy: { select: { id: true, name: true, email: true, image: true } },
        },
      });

  const extras = getInviteExtras(invite);

  return Response.json({ invite: { ...invite, ...extras } }, { status: 201 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const body = (await request.json()) as { inviteId?: string; action?: string };
  const inviteId = body.inviteId?.trim();

  if (!inviteId || body.action !== "revoke") {
    return Response.json({ message: "Invalid request." }, { status: 400 });
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { permissions: true },
  });

  const canManageUsers =
    membership?.permissions?.includes(PROJECT_USERS_MANAGE_PERMISSION) === true;

  if (!membership || !canManageUsers) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const invite = await prisma.projectInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      projectId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      invitedById: true,
      invitedUser: { select: { id: true, name: true, email: true, image: true } },
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  if (!invite || invite.projectId !== projectId) {
    return Response.json({ message: "Invite not found." }, { status: 404 });
  }

  if (invite.status === "ACCEPTED") {
    return Response.json({ message: "Invite already accepted." }, { status: 409 });
  }

  const revoked = await prisma.projectInvite.update({
    where: { id: invite.id },
    data: { status: "DECLINED" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      invitedById: true,
      invitedUser: { select: { id: true, name: true, email: true, image: true } },
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const extras = getInviteExtras(revoked);

  return Response.json({ invite: { ...revoked, ...extras } });
}
