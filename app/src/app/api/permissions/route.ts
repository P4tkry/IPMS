export async function GET() {
  const permissions = [
    { value: "CREATE_USERS", label: "Create users" },
    { value: "REMOVE_USERS", label: "Remove users" },
    { value: "UPDATE_USERS", label: "Update users" },
    { value: "UPLOAD_PHOTOS", label: "Upload photos" },
    { value: "CREATE_ALL_PROJECTS", label: "Create projects" },
    { value: "REMOVE_ALL_PROJECTS", label: "Remove projects" },
    { value: "UPDATE_ALL_PROJECTS", label: "Update projects" },
  ];

  return Response.json({ permissions });
}
