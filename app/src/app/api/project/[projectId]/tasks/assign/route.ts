import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AI_USE_PERMISSION } from "@/lib/projects/permissions";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/gu, " ").replace(/\s+/gu, " ").trim();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
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

  const { projectId } = await params;
  const body = (await request.json()) as {
    title?: string;
    description?: string;
    categoryCode?: string;
    acceptanceCriteria?: string;
  };

  const title = body.title?.trim() || "";
  const description = body.description?.trim() || "";
  const categoryCode = body.categoryCode?.trim().toUpperCase() || "";
  const acceptanceCriteria = body.acceptanceCriteria?.trim() || "";

  if (!projectId) {
    return Response.json({ message: "Brak projektu." }, { status: 400 });
  }
  if (!title || !description || !categoryCode) {
    return Response.json(
      { message: "Wymagany tytuł, kategoria i opis." },
      { status: 400 },
    );
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

  const tokenFloor = 80;
  if (project.tokens <= tokenFloor) {
    return Response.json(
      { message: "Brak wystarczających tokenów projektu." },
      { status: 402 },
    );
  }

  const [category, members] = await Promise.all([
    prisma.taskCategory.findUnique({
      where: { code: categoryCode },
      select: { code: true, name: true, description: true },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            strengths: true,
            weaknesses: true,
            hobbies: true,
            career: {
              select: {
                position: true,
                companyName: true,
                duration: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (members.length === 0) {
    return Response.json({ message: "Brak członków projektu." }, { status: 400 });
  }

  const taskPayload = {
    title,
    description: stripHtml(description),
    category: category
      ? `${category.code} - ${category.name}${category.description ? ` (${category.description})` : ""}`
      : categoryCode,
    acceptanceCriteria: stripHtml(acceptanceCriteria),
  };

  const membersPayload = members.map((member) => ({
    memberId: member.id,
    name: member.user?.name ?? null,
    email: member.user?.email ?? null,
    bio: member.user?.bio ?? null,
    strengths: member.user?.strengths ?? [],
    weaknesses: member.user?.weaknesses ?? [],
    hobbies: member.user?.hobbies ?? [],
    career: member.user?.career?.map((entry) => ({
      position: entry.position,
      company: entry.companyName,
      duration: entry.duration,
    })) ?? [],
  }));

  try {
    const system =
      "Wybierz najlepiej dopasowanego członka zespołu do realizacji zadania. " +
      "Uwzględnij kompetencje, doświadczenie oraz profil użytkownika. " +
      "Zwróć wyłącznie poprawny JSON w formacie: {\"memberId\":\"...\",\"reason\":\"...\"}.";

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system,
      messages: [
        {
          role: "user",
          content: JSON.stringify({ task: taskPayload, members: membersPayload }),
        },
      ],
    });

    const text = result.text.trim();
    const parsed = JSON.parse(text) as { memberId?: string; reason?: string };

    if (!parsed?.memberId) {
      return Response.json(
        { message: "Nie udało się dobrać wykonawcy." },
        { status: 500 },
      );
    }

    const isMember = members.some((member) => member.id === parsed.memberId);
    if (!isMember) {
      return Response.json(
        { message: "Nie udało się dobrać wykonawcy." },
        { status: 500 },
      );
    }

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
      memberId: parsed.memberId,
      reason: parsed.reason ?? "",
      tokensUsed: usedTokens,
      tokensLeft: nextTokens,
    });
  } catch (err) {
    console.error("[task-assign] error:", err);
    return Response.json(
      { message: "Nie udało się uzyskać odpowiedzi." },
      { status: 500 },
    );
  }
}
