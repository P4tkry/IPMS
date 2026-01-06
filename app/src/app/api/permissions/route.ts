import { GlobalPermission } from "@prisma/client";

const permissionLabels: Record<string, string> = {
  CREATE_USERS: "Create users",
  REMOVE_USERS: "Remove users",
  UPDATE_USERS: "Update users",
  UPLOAD_PHOTOS: "Upload photos",
  UPLOAD_FILES: "Upload files",
  CREATE_ALL_PROJECTS: "Create projects",
  REMOVE_ALL_PROJECTS: "Remove projects",
  UPDATE_ALL_PROJECTS: "Update projects",
};

export async function GET() {
  const permissions = Object.values(GlobalPermission).map((value) => ({
    value,
    label: permissionLabels[value] ?? value,
  }));

  return Response.json({ permissions });
}
