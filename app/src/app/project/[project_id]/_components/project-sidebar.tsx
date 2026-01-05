"use client";

import ProjectLogo from "@/components/project-logo";
import { useI18n } from "@/i18n/useI18n";
import type { ProjectInfo } from "./types";

type ProjectSidebarProps = {
  project: ProjectInfo;
};

export default function ProjectSidebar({ project }: ProjectSidebarProps) {
  const { t } = useI18n();
  const navItems = [
    { label: t("project.view.sidebar.nav.overview"), active: true },
    { label: t("project.view.sidebar.nav.backlog") },
    { label: t("project.view.sidebar.nav.board") },
    { label: t("project.view.sidebar.nav.timeline") },
    { label: t("project.view.sidebar.nav.reports") },
    { label: t("project.view.sidebar.nav.people") },
    { label: t("project.view.sidebar.nav.settings") },
  ];

  return (
    <aside className="flex h-fit flex-col gap-6 rounded-3xl border border-[#e1d7cb] bg-white/80 p-5 shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)] backdrop-blur">
      <div className="flex items-center gap-4">
        <ProjectLogo name={project.name || ""} size={48} className="text-lg" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
            {t("project.view.sidebar.project")}
          </p>
          <p className="text-sm font-semibold text-[#1f1b16]">
            {project.name || t("project.view.sidebar.untitled")}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a09386]">
          {t("project.view.sidebar.navigation")}
        </p>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition ${
                item.active
                  ? "bg-[#1f1b16] text-[#f6efe8] shadow-[0_10px_25px_-15px_rgba(20,15,10,0.7)]"
                  : "text-[#5b5044] hover:bg-[#f5efe7]"
              }`}
            >
              <span>{item.label}</span>
              {item.active ? (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">
                  {t("project.view.sidebar.live")}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>
      <div className="rounded-2xl border border-[#eadfd3] bg-[#f8f4ef] px-4 py-4 text-xs text-[#6f6255]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
          {t("project.view.sidebar.statusLabel")}
        </p>
        <p className="mt-2 text-sm font-semibold text-[#1f1b16]">
          {t("project.view.sidebar.statusTitle")}
        </p>
        <p className="mt-1">{t("project.view.sidebar.statusDetail")}</p>
      </div>
    </aside>
  );
}
