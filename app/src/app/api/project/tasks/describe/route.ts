import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AI_USE_PERMISSION } from "@/lib/projects/permissions";
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
    projectId?: string;
    prompt?: string;
    mode?: "description" | "guidelines";
  };
  const projectId = body.projectId?.trim() || "";
  const prompt = body.prompt?.trim() || "";
  const mode = body.mode === "guidelines" ? "guidelines" : "description";

  if (!projectId) {
    return Response.json({ message: "Brak projektu." }, { status: 400 });
  }

  if (!prompt) {
    return Response.json({ message: "Brak opisu do wygenerowania." }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { tokens: true },
  });

  if (!project) {
    return Response.json({ message: "Project not found." }, { status: 404 });
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
    select: { permissions: true },
  });

  const canUseAi = membership?.permissions?.includes(AI_USE_PERMISSION) === true;
  if (!canUseAi) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const tokenFloor = 50;
  if (project.tokens <= tokenFloor) {
    return Response.json(
      { message: "Brak wystarczających tokenów projektu." },
      { status: 402 },
    );
  }

  try {
    const system =
      mode === "guidelines"
        ? "Utwórz zwięzłe wytyczne oddania zadania po polsku. Maksymalnie 5 krótkich zdań, bez nagłówków i list. Zwróć tylko wytyczne."
        : "Utwórz krótki opis zadania po polsku na podstawie wskazówek. 2-5 zdań, bez nagłówków i list. Zwróć tylko opis.";

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system,
      messages: [{ role: "user", content: prompt }],
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
      data: { tokens: nextTokens },
    });

    return Response.json({
      text: result.text,
      tokensUsed: usedTokens,
      tokensLeft: nextTokens,
    });
  } catch (err) {
    console.error("[task-description] error:", err);
    return Response.json(
      { message: "Nie udało się uzyskać odpowiedzi." },
      { status: 500 },
    );
  }
}
