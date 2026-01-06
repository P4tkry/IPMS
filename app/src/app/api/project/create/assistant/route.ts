import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DASHBOARD_MANAGE_PERMISSION } from "@/lib/projects/permissions";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { message: "Nie udało się uzyskać odpowiedzi." },
      { status: 500 },
    );
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    message?: string;
    context?: string;
    projectId?: string;
    contextData?: string;
    history?: Array<{ role?: string; content?: string }>;
  };
  const message = body.message?.trim();
  const context = body.context?.trim() || "ogólne";
  const contextData = body.contextData?.trim() || "";
  const projectId = body.projectId?.trim() || "";
  const history = Array.isArray(body.history) ? body.history : [];

  if (!message) {
    return Response.json({ message: "Brak wiadomości." }, { status: 400 });
  }

  if (!projectId) {
    return Response.json({ message: "Brak projektu." }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { tokens: true, name: true },
  });

  if (!project) {
    return Response.json({ message: "Project not found." }, { status: 404 });
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { permissions: true },
  });

  const canManage = membership?.permissions?.includes(DASHBOARD_MANAGE_PERMISSION) === true;

  if (!canManage) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const tokenFloor = 250;
  if (project.tokens <= tokenFloor) {
    return Response.json(
      { message: "Brak wystarczających tokenów projektu." },
      { status: 402 },
    );
  }

  const systemPrompt = [
    "Jesteś asystentem do tworzenia projektów.",
    "Odpowiadaj po polsku, krótko i konkretnie.",
    "Wyjaśniaj pojęcia prosto, bez rozwlekania.",
    `Kontekst kroku: ${context}.`,
    project.name ? `Nazwa projektu: ${project.name}.` : null,
    contextData ? `Dane zebrane do tej pory: ${contextData}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  console.log("[assistant] projectId:", projectId);
  console.log("[assistant] userId:", session.user.id);
  console.log("[assistant] context:", context);
  if (contextData) {
    console.log("[assistant] contextData:", contextData);
  }
  console.log("[assistant] message:", message);
  if (history.length > 0) {
    console.log("[assistant] history:", history);
  }
  console.log("[assistant] systemPrompt:", systemPrompt);

  try {
    const cleanedHistory = history
      .map((entry) => ({
        role: (entry.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: typeof entry.content === "string" ? entry.content.trim() : "",
      }))
      .filter((entry) => entry.content.length > 0);

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages:
        cleanedHistory.length > 0
          ? cleanedHistory
          : [{ role: "user", content: message }],
    });

    const usedTokens =
      result.usage?.totalTokens ??
      (result.usage?.promptTokens ?? 0) + (result.usage?.completionTokens ?? 0);

    const nextTokens =
      typeof usedTokens === "number"
        ? Math.max(project.tokens - usedTokens, 0)
        : project.tokens;

    await prisma.project.update({
      where: { id: projectId },
      data: {
        tokens: nextTokens,
      },
    });

    return Response.json({
      reply: result.text,
      tokensUsed: usedTokens,
      tokensLeft: nextTokens,
    });
  } catch (err) {
    console.error("[assistant] error:", err);
    return Response.json(
      { message: "Nie udało się uzyskać odpowiedzi." },
      { status: 500 },
    );
  }
}
