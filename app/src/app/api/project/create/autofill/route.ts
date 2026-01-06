import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DASHBOARD_MANAGE_PERMISSION } from "@/lib/projects/permissions";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createTranslator, defaultLocale, getMessages, isSupportedLocale } from "@/i18n";
import { buildManifestAspects } from "@/app/project/create/_components/manifest-aspects";

type AutofillBody = {
  step?: string;
  projectId?: string;
  projectContext?: string;
  stepContext?: string;
  locale?: string;
};

const tokenFloor = 250;

const stepSchemas: Record<string, { data: Record<string, unknown>; required: string[] }> = {
  name: { data: { name: "string" }, required: ["name"] },
  category: { data: { category: "string" }, required: ["category"] },
  goal: { data: { goal: "string" }, required: ["goal"] },
  outcome: { data: { outcome: "string" }, required: ["outcome"] },
  stakeholders: {
    data: {
      stakeholders: [
        {
          name: "string",
          power: "number (1-10)",
          interest: "number (1-10)",
        },
      ],
    },
    required: ["stakeholders"],
  },
  justification: { data: { justification: "string" }, required: ["justification"] },
  mvp: { data: { mvp: ["string"] }, required: ["mvp"] },
  scope: {
    data: { inScope: ["string"], outScope: ["string"] },
    required: ["inScope", "outScope"],
  },
  kpi: { data: { kpis: ["string"] }, required: ["kpis"] },
  milestones: { data: { milestones: ["string"] }, required: ["milestones"] },
  people: {
    data: {
      peopleHighAvailability: "number",
      peopleLowAvailability: "number",
    },
    required: ["peopleHighAvailability", "peopleLowAvailability"],
  },
  budget: { data: { budget: "number" }, required: ["budget"] },
  chances: { data: { chances: ["string"] }, required: ["chances"] },
  threats: { data: { threats: ["string"] }, required: ["threats"] },
  terms: {
    data: {
      terms: [
        {
          date: "YYYY-MM-DD",
          description: "string",
        },
      ],
    },
    required: ["terms"],
  },
};

const extractJson = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
};

const stringifySchema = (schema: { data: Record<string, unknown>; required: string[] }) =>
  JSON.stringify(
    {
      data: schema.data,
      required: schema.required,
    },
    null,
    2,
  );

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

  const body = (await request.json()) as AutofillBody;
  const step = body.step?.trim();
  const projectId = body.projectId?.trim() || "";
  const projectContext = body.projectContext?.trim() || "";
  const stepContext = body.stepContext?.trim() || "";

  if (!step || !stepSchemas[step]) {
    return Response.json({ message: "Nieprawidłowy krok." }, { status: 400 });
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

  if (project.tokens <= tokenFloor) {
    return Response.json(
      { message: "Brak wystarczających tokenów projektu." },
      { status: 402 },
    );
  }

  const locale =
    body.locale && isSupportedLocale(body.locale) ? body.locale : defaultLocale;
  const t = createTranslator(getMessages(locale));
  const stepLabels: Record<string, string> = {
    name: t("project.create.steps.name"),
    category: t("project.create.steps.category"),
    goal: t("project.create.steps.goal"),
    outcome: t("project.create.steps.outcome"),
    stakeholders: t("project.create.steps.stakeholders"),
    justification: t("project.create.steps.justification"),
    mvp: t("project.create.steps.mvp"),
    scope: t("project.create.steps.scope"),
    kpi: t("project.create.steps.kpi"),
    milestones: t("project.create.steps.milestones"),
    people: t("project.create.steps.people"),
    budget: t("project.create.steps.budget"),
    chances: t("project.create.steps.chances"),
    threats: t("project.create.steps.threats"),
    terms: t("project.create.steps.terms"),
  };

  const aspects = buildManifestAspects(t);
  const aspectBySlug = Object.fromEntries(aspects.map((aspect) => [aspect.slug, aspect]));

  const buildGuidelines = () => {
    if (step === "scope") {
      const inScope = aspectBySlug["scope-in"];
      const outScope = aspectBySlug["scope-out"];
      return [
        inScope?.question,
        outScope?.question,
        ...(inScope?.expert.paragraphs ?? []),
        ...(outScope?.expert.paragraphs ?? []),
      ]
        .filter(Boolean)
        .join(" ");
    }

    const aspect = aspectBySlug[step];
    if (!aspect) {
      return "";
    }
    const parts = [
      aspect.question,
      ...(aspect.expert.paragraphs ?? []),
      ...(aspect.expert.bullets ?? []),
    ];
    return parts.filter(Boolean).join(" ");
  };

  const schema = stepSchemas[step];
  const systemPrompt = [
    "Jesteś asystentem do automatycznego uzupełniania formularza projektu.",
    "Zwracaj wyłącznie poprawny JSON, bez dodatkowego tekstu.",
    "Dostosuj odpowiedź do kroku i schematu.",
    "Używaj krótkich, konkretnych propozycji po polsku.",
  ].join(" ");

  const userPrompt = [
    `Kontekst kroku: ${stepLabels[step] ?? step}.`,
    project.name ? `Nazwa projektu: ${project.name}.` : null,
    projectContext ? `Kontekst projektu: ${projectContext}.` : null,
    stepContext ? `Kontekst kroku: ${stepContext}.` : null,
    `Wytyczne: ${buildGuidelines() || "Brak dodatkowych wytycznych."}`,
    "Schemat odpowiedzi (JSON):",
    stringifySchema(schema),
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
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

    const jsonText = extractJson(result.text);
    if (!jsonText) {
      return Response.json(
        { message: "Nie udało się uzyskać odpowiedzi." },
        { status: 500 },
      );
    }

    const data = JSON.parse(jsonText) as { data?: Record<string, unknown> };
    return Response.json(
      {
        data: data?.data ?? null,
        tokensUsed: usedTokens,
        tokensLeft: nextTokens,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[autofill] error:", err);
    return Response.json(
      { message: "Nie udało się uzyskać odpowiedzi." },
      { status: 500 },
    );
  }
}
