import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const body = (await request.json()) as {
    message?: string;
    category?: string;
    page?: string;
    email?: string;
  };

  const message = body.message?.trim() || "";
  if (!message) {
    return Response.json({ message: "Message is required." }, { status: 400 });
  }

  const email = body.email?.trim() || session?.user?.email || null;
  const category = body.category?.trim() || null;
  const page = body.page?.trim() || null;
  const userAgent = request.headers.get("user-agent");

  const feedback = await prisma.feedback.create({
    data: {
      message,
      category,
      page,
      email,
      userAgent,
      userId: session?.user?.id || null,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  return Response.json({ feedback }, { status: 201 });
}
