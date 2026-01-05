import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const exists = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!exists) {
    return Response.json({ message: "Project not found." }, { status: 404 });
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { leaderId: session.user.id },
        { members: { some: { id: session.user.id } } },
      ],
    },
    select: {
      id: true,
      name: true,
      category: true,
      goal: true,
      justification: true,
      mvp: true,
      kpis: true,
      milestones: true,
      chances: true,
      threats: true,
      terms: true,
      stakeholderEntries: true,
      inScope: true,
      outScope: true,
      peopleHighAvailability: true,
      peopleLowAvailability: true,
      budget: true,
      description: true,
      logo: true,
      isDraft: true,
      createdAt: true,
      updatedAt: true,
      leaderId: true,
    },
  });

  if (!project) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  return Response.json({ project });
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
    name?: string;
    category?: string;
    goal?: string;
    justification?: string;
    stakeholders?: string;
    stakeholderEntries?: Array<{
      name?: string;
      interest?: number;
      power?: number;
    }>;
    mvp?: string[];
    kpis?: string[];
    milestones?: string[];
    chances?: string[];
    threats?: string[];
    terms?: Array<{
      date?: string;
      description?: string;
    }>;
    inScope?: string[];
    outScope?: string[];
    peopleHighAvailability?: number;
    peopleLowAvailability?: number;
    budget?: number;
    description?: string;
    logo?: string;
    isDraft?: boolean;
  };

  const name = body.name?.trim();
  const category = body.category?.trim();
  const goal = body.goal?.trim();
  const justification = body.justification?.trim();
  const stakeholders = body.stakeholders?.trim();
  const stakeholderEntries = Array.isArray(body.stakeholderEntries)
    ? body.stakeholderEntries
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => ({
          name: typeof entry.name === "string" ? entry.name.trim() : "",
          interest:
            typeof entry.interest === "number" && !Number.isNaN(entry.interest)
              ? entry.interest
              : 0,
          power:
            typeof entry.power === "number" && !Number.isNaN(entry.power) ? entry.power : 0,
        }))
        .filter((entry) => entry.name.length > 0)
    : undefined;
  const mvp = Array.isArray(body.mvp)
    ? body.mvp
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;
  const kpis = Array.isArray(body.kpis)
    ? body.kpis
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;
  const milestones = Array.isArray(body.milestones)
    ? body.milestones
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;
  const chances = Array.isArray(body.chances)
    ? body.chances
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;
  const threats = Array.isArray(body.threats)
    ? body.threats
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;
  const terms = Array.isArray(body.terms)
    ? body.terms
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          date: typeof item.date === "string" ? item.date.trim() : "",
          description: typeof item.description === "string" ? item.description.trim() : "",
        }))
        .filter((item) => item.date.length > 0 && item.description.length > 0)
    : undefined;
  const inScope = Array.isArray(body.inScope)
    ? body.inScope
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;
  const outScope = Array.isArray(body.outScope)
    ? body.outScope
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;
  const peopleHighAvailability =
    typeof body.peopleHighAvailability === "number"
      ? body.peopleHighAvailability
      : undefined;
  const peopleLowAvailability =
    typeof body.peopleLowAvailability === "number"
      ? body.peopleLowAvailability
      : undefined;
  const budget = typeof body.budget === "number" ? body.budget : undefined;
  const description = body.description?.trim();
  const logo = body.logo?.trim();
  const isDraft = typeof body.isDraft === "boolean" ? body.isDraft : undefined;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { leaderId: session.user.id },
        { members: { some: { id: session.user.id } } },
      ],
    },
    select: { id: true },
  });

  if (!project) {
    return Response.json({ message: "Project not found." }, { status: 404 });
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(name ? { name } : {}),
      ...(category ? { category } : {}),
      ...(goal ? { goal } : {}),
      ...(justification ? { justification } : {}),
      ...(stakeholders ? { stakeholders } : {}),
      ...(stakeholderEntries ? { stakeholderEntries } : {}),
      ...(mvp !== undefined ? { mvp } : {}),
      ...(kpis !== undefined ? { kpis } : {}),
      ...(milestones !== undefined ? { milestones } : {}),
      ...(chances !== undefined ? { chances } : {}),
      ...(threats !== undefined ? { threats } : {}),
      ...(terms !== undefined ? { terms } : {}),
      ...(typeof peopleHighAvailability === "number"
        ? { peopleHighAvailability }
        : {}),
      ...(typeof peopleLowAvailability === "number" ? { peopleLowAvailability } : {}),
      ...(inScope !== undefined ? { inScope } : {}),
      ...(outScope !== undefined ? { outScope } : {}),
      ...(typeof budget === "number" ? { budget } : {}),
      ...(description ? { description } : {}),
      ...(logo ? { logo } : {}),
      ...(typeof isDraft === "boolean" ? { isDraft } : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      logo: true,
      isDraft: true,
      updatedAt: true,
    },
  });

  return Response.json({ project: updated });
}
