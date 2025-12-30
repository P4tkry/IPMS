import { Permission } from "@prisma/client";

const permissionLabels: Record<string, string> = {
  CREATE_USERS: "Create users",
  REMOVE_USERS: "Remove users",
  UPDATE_USERS: "Update users",
  UPLOAD_PHOTOS: "Upload photos",
  CREATE_ALL_PROJECTS: "Create projects",
  REMOVE_ALL_PROJECTS: "Remove projects",
  UPDATE_ALL_PROJECTS: "Update projects",
};

export async function GET() {
  const permissions = Object.values(Permission).map((value) => ({
    value,
    label: permissionLabels[value] ?? value,
  }));

  return Response.json({ permissions });
}
