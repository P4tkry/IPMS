"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProjectLogo from "@/components/project-logo";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/useI18n";
import type { ProjectInfo } from "./types";

type ProjectSidebarProps = {
  project: ProjectInfo;
};

export default function ProjectSidebar({ project }: ProjectSidebarProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const displayName = project.tradeName || project.name || t("project.view.sidebar.untitled");
  const [sprintStatus, setSprintStatus] = useState<{
    active: boolean;
    sprint?: {
      id: string;
      name: string;
      sprintNumber: number;
      startDate: string;
      endDate: string;
      totalCount: number;
      inProgressCount: number;
      doneCount: number;
    };
  } | null>(null);
  const [sprintLoading, setSprintLoading] = useState(true);
  const [sprintError, setSprintError] = useState<string | null>(null);
  const projectNav = [
    { label: t("project.view.sidebar.nav.overview"), href: `/project/${project.id}` },
    { label: "Core", href: `/project/${project.id}/core` },
    { label: t("project.view.sidebar.nav.board"), href: `/project/${project.id}/board` },
    { label: "Moje zadania", href: `/project/${project.id}/my-tasks` },
    { label: "Chat", href: `/project/${project.id}/chat` },
  ];
  const manageNav = [
    { label: t("project.view.sidebar.nav.backlog") ?? "Backlog", href: `/project/${project.id}/backlog` },
    { label: t("project.view.sidebar.nav.users"), href: `/project/${project.id}/users` },
  ];
  const formatSprintDate = (value?: string) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short" }).format(parsed);
  };

  useEffect(() => {
    let isActive = true;
    const loadStatus = async () => {
      setSprintLoading(true);
      setSprintError(null);
      try {
        const response = await fetch(`/api/project/${project.id}/sprint-status`);
        const payload = await response.json();
        if (!response.ok) {
          if (isActive) {
            setSprintError(payload?.message || "Nie udalo sie pobrac sprintu.");
            setSprintStatus(null);
          }
          return;
        }
        if (isActive) {
          setSprintStatus(payload);
        }
      } catch (err) {
        if (isActive) {
          const message =
            err instanceof Error ? err.message : "Nie udalo sie pobrac sprintu.";
          setSprintError(message);
          setSprintStatus(null);
        }
      } finally {
        if (isActive) {
          setSprintLoading(false);
        }
      }
    };
    loadStatus();
    return () => {
      isActive = false;
    };
  }, [project.id]);

  return (
    <aside className="flex h-fit flex-col gap-6 rounded-3xl border border-[#e1d7cb] bg-white/80 p-5 shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)] backdrop-blur">
      <div className="flex items-center gap-4">
        <ProjectLogo name={displayName || ""} size={48} className="text-lg" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
            {t("project.view.sidebar.project")}
          </p>
          <p className="text-sm font-semibold text-[#1f1b16]">{displayName}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a09386]">
            Projekt
          </p>
          <nav className="flex flex-col gap-2">
            {projectNav.map((item) => {
              const isOverview = item.href === `/project/${project.id}`;
              const isActive =
                pathname === item.href ||
                (!isOverview && pathname.startsWith(`${item.href}/`)) ||
                (!isOverview && pathname === `${item.href}/`);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-[#1f1b16] text-[#f6efe8] shadow-[0_10px_25px_-15px_rgba(20,15,10,0.7)]"
                      : "text-[#5b5044] hover:bg-[#f5efe7]"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive ? (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">
                      Aktywne
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a09386]">
            Zarzadzanie
          </p>
          <nav className="flex flex-col gap-2">
            {manageNav.map((item) => {
              const isOverview = item.href === `/project/${project.id}`;
              const isActive =
                pathname === item.href ||
                (!isOverview && pathname.startsWith(`${item.href}/`)) ||
                (!isOverview && pathname === `${item.href}/`);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-[#1f1b16] text-[#f6efe8] shadow-[0_10px_25px_-15px_rgba(20,15,10,0.7)]"
                      : "text-[#5b5044] hover:bg-[#f5efe7]"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive ? (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">
                      Aktywne
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="rounded-2xl border border-[#eadfd3] bg-gradient-to-br from-[#fbf7f2] via-[#f4ede4] to-[#efe5da] px-4 py-4 text-xs text-[#5b5044] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
          Status sprintu
        </p>
        {sprintLoading ? (
          <p className="mt-2 text-sm text-[#6f6255]">Laduje status...</p>
        ) : sprintError ? (
          <p className="mt-2 text-sm text-rose-700">{sprintError}</p>
        ) : sprintStatus?.active && sprintStatus.sprint ? (
          <>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Aktywny
              </span>
              <span className="inline-flex shrink-0 rounded-full border border-[#eadfd3] bg-white/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                SPRINT-{sprintStatus.sprint.sprintNumber}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#1f1b16]">{sprintStatus.sprint.name}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#8a7762]">
              {formatSprintDate(sprintStatus.sprint.startDate)} – {formatSprintDate(sprintStatus.sprint.endDate)}
            </p>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-[width] duration-500 ease-out"
                  style={{
                    width: sprintStatus.sprint.totalCount
                      ? `${Math.min(
                          100,
                          Math.round((sprintStatus.sprint.doneCount / sprintStatus.sprint.totalCount) * 100),
                        )}%`
                      : "0%",
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>W trakcie</span>
                <span className="font-semibold text-[#1f1b16]">
                  {sprintStatus.sprint.inProgressCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Zakonczone</span>
                <span className="font-semibold text-[#1f1b16]">
                  {sprintStatus.sprint.doneCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Wszystkie</span>
                <span className="font-semibold text-[#1f1b16]">
                  {sprintStatus.sprint.totalCount}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm font-semibold text-[#1f1b16]">Brak aktywnego</p>
            <p className="mt-1 text-xs text-[#6f6255]">
              Brak sprintu, ktory trwa w tej chwili.
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
