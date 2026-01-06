import { GlobalPermission } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true },
  });

  if (!currentUser?.permissions?.includes(GlobalPermission.UPLOAD_FILES)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ message: "Missing file." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ message: "File too large." }, { status: 400 });
  }

  const uploadServiceUrl = process.env.UPLOAD_SERVICE_URL || "http://localhost:4000";
  const payload = new FormData();
  payload.set("file", file, file.name);

  const response = await fetch(`${uploadServiceUrl}/upload`, {
    method: "POST",
    body: payload,
  });
  const uploadPayload = await response.json().catch(() => null);

  if (!response.ok) {
    return Response.json(
      { message: uploadPayload?.message || "Upload failed." },
      { status: 400 },
    );
  }

  const url = uploadPayload?.url;
  if (!url) {
    return Response.json({ message: "Upload failed." }, { status: 400 });
  }

  return Response.json({ url });
}
