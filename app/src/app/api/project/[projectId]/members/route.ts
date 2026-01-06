"use server";

import type { ProjectRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PROJECT_MEMBER_PERMISSIONS,
  PROJECT_USERS_MANAGE_PERMISSION,
  TASKS_CUD_PERMISSION,
} from "@/lib/projects/permissions";

type MemberPermission = (typeof PROJECT_MEMBER_PERMISSIONS)[number];

const normalizePermissions = (permissions: unknown): MemberPermission[] => {
  const allowed = new Set<MemberPermission>(PROJECT_MEMBER_PERMISSIONS);
  if (!Array.isArray(permissions)) return [];
  return (permissions as string[]).filter(
    (permission): permission is MemberPermission => allowed.has(permission as MemberPermission),
  );
};

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
    select: { id: true },
  });

  if (!project) {
    return Response.json({ message: "Project not found." }, { status: 404 });
  }

  let membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { permissions: true, role: true },
  });

  if (!membership) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      permissions: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  const memberList = members.map((member) => ({
    ...member,
    permissions: normalizePermissions(member.permissions),
    isOwner: member.role === "OWNER",
  }));

  const canManageUsers = membership.permissions?.includes(PROJECT_USERS_MANAGE_PERMISSION) === true;

  return Response.json({
    members: memberList,
    canInvite: canManageUsers,
    canManageUsers,
    pendingInvite: false,
    availablePermissions: PROJECT_MEMBER_PERMISSIONS,
  });
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
  const body = (await request.json()) as {
    memberId?: string;
    role?: string;
    permissions?: unknown;
    action?: string;
  };
  const memberId = body.memberId?.trim();
  if (!memberId) {
    return Response.json({ message: "Missing memberId." }, { status: 400 });
  }

  const actorMembership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { permissions: true },
  });

  const actorCanManage =
    actorMembership?.permissions?.includes(PROJECT_USERS_MANAGE_PERMISSION) === true;

  if (!actorCanManage) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const target = await prisma.projectMember.findUnique({
    where: { id: memberId },
    select: { id: true, role: true, projectId: true, userId: true },
  });

  if (!target || target.projectId !== projectId) {
    return Response.json({ message: "Member not found." }, { status: 404 });
  }

  const ownersCount = await prisma.projectMember.count({
    where: { projectId, role: "OWNER" },
  });

  if (body.action === "remove") {
    if (target.role === "OWNER" && ownersCount <= 1) {
      return Response.json(
        { message: "Project must have at least one owner." },
        { status: 409 },
      );
    }
    await prisma.projectMember.delete({ where: { id: memberId } });
    return Response.json({ success: true });
  }

  const allowedRoles: ProjectRole[] = ["OWNER", "EDITOR", "VIEWER"];
  const requestedRole =
    typeof body.role === "string" ? (body.role.toUpperCase() as ProjectRole) : null;
  const nextRole: ProjectRole = requestedRole && allowedRoles.includes(requestedRole)
    ? requestedRole
    : target.role;
  let nextPermissions: MemberPermission[] | undefined;
  if (Array.isArray(body.permissions)) {
    const allowedPerms = new Set<MemberPermission>(PROJECT_MEMBER_PERMISSIONS);
    nextPermissions = Array.from(
      new Set(
        (body.permissions as unknown[])
          .filter((permission): permission is string => typeof permission === "string")
          .filter((permission): permission is MemberPermission =>
            allowedPerms.has(permission as MemberPermission),
          ),
      ),
    );
  }

  if (target.role === "OWNER" && nextRole !== "OWNER" && ownersCount <= 1) {
    return Response.json(
      { message: "Project must have at least one owner." },
      { status: 409 },
    );
  }

  const updated = await prisma.projectMember.update({
    where: { id: memberId },
    data: {
      role: nextRole,
      ...(nextPermissions ? { permissions: nextPermissions } : {}),
    },
    select: {
      id: true,
      role: true,
      permissions: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return Response.json({ member: { ...updated, isOwner: updated.role === "OWNER" } });
}
