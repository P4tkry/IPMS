import { SocialPlatform } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      bio: true,
      hobbies: true,
      strengths: true,
      weaknesses: true,
      career: {
        select: {
          id: true,
          startDate: true,
          position: true,
          companyName: true,
          duration: true,
        },
        orderBy: { startDate: "desc" },
      },
      socialLinks: { select: { id: true, platform: true, url: true } },
      permissions: true,
    },
  });

  return Response.json({ user });
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const normalizeList = (value: unknown) => {
    if (!Array.isArray(value)) return null;
    if (!value.every((item) => typeof item === "string")) return null;
    return value.map((item) => item.trim()).filter((item) => item.length > 0);
  };

  const body = (await request.json()) as {
    name?: string;
    bio?: string;
    socialLinks?: Array<{ platform: string; url: string }>;
    hobbies?: string[];
    strengths?: string[];
    weaknesses?: string[];
    career?: Array<{
      startDate?: string;
      position?: string;
      companyName?: string;
      duration?: string;
    }>;
  };

  const name = body.name?.trim() || "";
  if ("name" in body && !name) {
    return Response.json({ message: "Imie i nazwisko jest wymagane." }, { status: 400 });
  }
  const bio = body.bio?.trim() || null;
  const socialLinksInput = Array.isArray(body.socialLinks) ? body.socialLinks : [];
  const allowedSocialPlatforms = new Set<SocialPlatform>(Object.values(SocialPlatform));
  const socialLinks = socialLinksInput
    .map((link) => {
      const platform =
        typeof link?.platform === "string" ? (link.platform.trim().toUpperCase() as SocialPlatform) : null;
      const url = typeof link?.url === "string" ? link.url.trim() : "";
      if (!platform || !allowedSocialPlatforms.has(platform) || !url) {
        return null;
      }
      return { platform, url };
    })
    .filter((link): link is { platform: SocialPlatform; url: string } => !!link);
  if ("socialLinks" in body && socialLinks.length !== socialLinksInput.length) {
    return Response.json({ message: "Nieprawidlowy link spolecznosciowy." }, { status: 400 });
  }
  const hobbies =
    "hobbies" in body ? normalizeList(body.hobbies) : undefined;
  if ("hobbies" in body && hobbies === null) {
    return Response.json({ message: "Nieprawidlowe hobby." }, { status: 400 });
  }
  const strengths =
    "strengths" in body ? normalizeList(body.strengths) : undefined;
  if ("strengths" in body && strengths === null) {
    return Response.json({ message: "Nieprawidlowe mocne strony." }, { status: 400 });
  }
  const weaknesses =
    "weaknesses" in body ? normalizeList(body.weaknesses) : undefined;
  if ("weaknesses" in body && weaknesses === null) {
    return Response.json({ message: "Nieprawidlowe slabe strony." }, { status: 400 });
  }
  let careerEntries:
    | Array<{ startDate: Date; position: string; companyName: string; duration: string }>
    | undefined
    | null = undefined;
  if ("career" in body) {
    if (!Array.isArray(body.career)) {
      return Response.json({ message: "Nieprawidlowy wpis kariery." }, { status: 400 });
    }
    const mapped = body.career.map((entry) => {
      const startDate = entry.startDate ? new Date(entry.startDate) : null;
      const position = entry.position?.trim() || "";
      const companyName = entry.companyName?.trim() || "";
      const duration = entry.duration?.trim() || "";
      if (!startDate || Number.isNaN(startDate.valueOf())) return null;
      if (!position || !companyName || !duration) return null;
      return { startDate, position, companyName, duration };
    });
    if (mapped.some((entry) => entry === null)) {
      return Response.json({ message: "Nieprawidlowy wpis kariery." }, { status: 400 });
    }
    careerEntries = mapped as Array<{
      startDate: Date;
      position: string;
      companyName: string;
      duration: string;
    }>;
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name ? { name } : {}),
      bio,
      ...(hobbies !== undefined ? { hobbies } : {}),
      ...(strengths !== undefined ? { strengths } : {}),
      ...(weaknesses !== undefined ? { weaknesses } : {}),
      ...(careerEntries !== undefined
        ? {
            career: {
              deleteMany: {},
              create: careerEntries,
            },
          }
        : {}),
      socialLinks: {
        deleteMany: {},
        create: socialLinks,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      bio: true,
      hobbies: true,
      strengths: true,
      weaknesses: true,
      career: {
        select: {
          id: true,
          startDate: true,
          position: true,
          companyName: true,
          duration: true,
        },
        orderBy: { startDate: "desc" },
      },
      socialLinks: { select: { id: true, platform: true, url: true } },
      permissions: true,
    },
  });

  return Response.json({ user });
}
