"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/i18n/useI18n";
import ProjectShell from "./project-shell";
import ProjectSidebar from "./project-sidebar";
import { ProjectProvider } from "./project-context";
import type { ProjectInfo } from "./types";

export default function ProjectLayoutView({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const { data: session, isPending } = authClient.useSession();
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [isPending, router, session?.user]);

  useEffect(() => {
    if (!session?.user || !projectId) {
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      setAccessDenied(false);
      try {
        const response = await fetch(`/api/project/${projectId}`);
        const payload = await response.json();
        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/login");
            return;
          }
          if (response.status === 403 || response.status === 404) {
            setAccessDenied(true);
            return;
          }
          setError(payload?.message || t("project.view.errors.loadFailed"));
          return;
        }
        setProject(payload?.project || null);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("project.view.errors.loadFailed");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [projectId, router, session?.user, t]);

  return (
    <ProjectShell>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10 text-[#2a241f]">
        {isLoading ? (
          <div className="rounded-3xl border border-[#e1d7cb] bg-white/80 p-6 text-sm text-[#6f6255] shadow-[0_24px_60px_-45px_rgba(40,30,20,0.35)]">
            {t("project.view.loading")}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {accessDenied ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center shadow-[0_24px_60px_-45px_rgba(120,90,30,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              {t("project.view.accessDenied.label")}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#3a2d1b]">
              {t("project.view.accessDenied.title")}
            </p>
            <p className="mt-2 text-sm text-amber-800">
              {t("project.view.accessDenied.hint")}
            </p>
          </div>
        ) : null}
        {!isLoading && project ? (
          <ProjectProvider project={project}>
            <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
              <ProjectSidebar project={project} />
              <div className="min-w-0">{children}</div>
            </div>
          </ProjectProvider>
        ) : null}
      </div>
    </ProjectShell>
  );
}
