import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FiArrowRight, FiClock, FiEdit3, FiPlus, FiUsers } from "react-icons/fi";
import ProjectLogo from "@/components/project-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROJECT_REMOVE_PERMISSION } from "@/lib/projects/permissions";
import DeleteProjectButton from "./_components/project-delete-button";

type ProjectListItem = {
  id: string;
  name: string | null;
  tradeName: string | null;
  category: string | null;
  description: string | null;
  logo: string | null;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    members: number;
  };
  members: { permissions: string[] }[];
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);

const getUserProjects = async (userId: string): Promise<ProjectListItem[]> => {
  return prisma.project.findMany({
    where: { members: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      tradeName: true,
      category: true,
      description: true,
      logo: true,
      isDraft: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          members: true,
        },
      },
      members: {
        where: { userId },
        select: { permissions: true },
      },
    },
  });
};

export default async function ProjectListPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const session = await auth.api.getSession({ headers: { cookie: cookieHeader } });
  if (!session?.user) {
    redirect("/login");
  }

  const projects = await getUserProjects(session.user.id);
  const draftsCount = projects.filter((project) => project.isDraft).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f4ef] via-white to-[#f8f4ef]">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 text-[#2a241f]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
              Projekty
            </p>
            <h1 className="text-3xl font-semibold text-[#1f1b16]">Twoje projekty</h1>
            <p className="text-sm text-[#6f6255]">
              Przegląd szkiców i aktywnych inicjatyw w jednym miejscu.
            </p>
          </div>
          <Button
            asChild
            className="h-11 rounded-2xl bg-[#2a241f] px-5 text-sm text-[#f6efe8] shadow-[0_18px_38px_-26px_rgba(40,30,20,0.5)] transition hover:bg-[#3a332c]"
          >
            <Link href="/project/create" prefetch={false} className="flex items-center gap-2">
              <FiPlus className="h-4 w-4" />
              Nowy projekt
            </Link>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
          <span className="rounded-full border border-[#eadfd3] bg-white px-3 py-1">
            Łącznie: {projects.length}
          </span>
          <span className="rounded-full border border-[#eadfd3] bg-white px-3 py-1">
            Aktywne: {projects.length - draftsCount}
          </span>
          <span className="rounded-full border border-[#eadfd3] bg-white px-3 py-1">
            Szkice: {draftsCount}
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-[#eadfd3] bg-white/80 p-10 text-center text-[#6f6255] shadow-[0_24px_60px_-45px_rgba(40,30,20,0.35)]">
            <p className="text-sm">Nie masz jeszcze żadnych projektów.</p>
            <p className="mt-2 text-xs text-[#8a7762]">
              Utwórz szkic, aby zacząć planowanie i wrócić do niego w dowolnym momencie.
            </p>
            <div className="mt-5 flex justify-center">
              <Button
                asChild
                className="h-11 rounded-2xl bg-[#2a241f] px-5 text-sm text-[#f6efe8] shadow-[0_16px_34px_-24px_rgba(40,30,20,0.55)] transition hover:bg-[#3a332c]"
              >
                <Link href="/project/create" prefetch={false} className="flex items-center gap-2">
                  <FiPlus className="h-4 w-4" />
                  Rozpocznij nowy projekt
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {projects.map((project) => {
              const href = project.isDraft
                ? `/project/create?project_id=${project.id}`
                : `/project/${project.id}`;
              const name = project.tradeName || project.name || "Projekt bez nazwy";
              const logoAlt = `Logo ${name}`;
              const description =
                project.description || "Brak opisu projektu. Kliknij, aby dodać szczegóły.";
              const memberPermissions = project.members?.[0]?.permissions ?? [];
              const canRemove = memberPermissions.includes(PROJECT_REMOVE_PERMISSION);
              return (
                <Card
                  key={project.id}
                  className="h-full border-[#e1d7cb] bg-white/80 shadow-[0_26px_60px_-40px_rgba(40,30,20,0.35)] transition duration-200 hover:shadow-[0_30px_70px_-38px_rgba(40,30,20,0.45)]"
                >
                  <CardContent className="flex h-full flex-col gap-5 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {project.logo ? (
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[#eadfd3] bg-[#f9f5f0]">
                            <img
                              src={project.logo}
                                alt={logoAlt}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <ProjectLogo name={name} size={56} />
                          )}
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a7762]">
                              {project.category || "Bez kategorii"}
                            </p>
                            <h3 className="text-xl font-semibold text-[#1f1b16]">{name}</h3>
                            <p className="text-xs text-[#8a7762]">
                              {project.isDraft ? "Szkic projektu" : "Aktywny projekt"}
                            </p>
                          </div>
                        </div>
                      <div className="flex flex-col items-end gap-2 text-xs text-[#6f6255]">
                        <Badge
                          variant="outline"
                          className={
                            project.isDraft
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                          }
                        >
                          {project.isDraft ? "Draft" : "Aktywny"}
                        </Badge>
                        <span className="inline-flex items-center gap-2">
                          <FiClock className="h-4 w-4" />
                          <span>Aktualizacja: {formatDate(project.updatedAt)}</span>
                        </span>
                      </div>
                    </div>

                    <p className="line-clamp-3 text-sm leading-relaxed text-[#5b5044]">
                      {description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#6f6255]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#eadfd3] bg-[#f9f5f0] px-3 py-1">
                        <FiUsers className="h-4 w-4 text-[#8a7762]" />
                        {project._count.members} {project._count.members === 1 ? "osoba" : "osoby"}{" "}
                        w zespole
                      </span>
                      <div className="flex items-center gap-3">
                        <Button
                          asChild
                          className="h-10 rounded-xl bg-[#2a241f] px-4 text-xs font-semibold text-[#f6efe8] shadow-[0_14px_30px_-20px_rgba(40,30,20,0.55)] transition hover:bg-[#3a332c]"
                        >
                          <Link href={href} prefetch={false} className="flex items-center gap-2">
                            {project.isDraft ? (
                              <>
                                <FiEdit3 className="h-4 w-4" />
                                Kontynuuj edytowanie
                              </>
                            ) : (
                              <>
                                <FiArrowRight className="h-4 w-4" />
                                Przejdź do projektu
                              </>
                            )}
                          </Link>
                        </Button>
                        {canRemove ? (
                          <DeleteProjectButton projectId={project.id} projectName={name} variant="pill" />
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
