"use client";

import { useI18n } from "@/i18n/useI18n";
import type { ProjectInfo } from "./types";

type ProjectHeaderProps = {
  project: ProjectInfo;
};

const formatDate = (value: string, locale: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  const { t, locale } = useI18n();
  const projectName =
    project.tradeName || project.name || t("project.view.header.untitled");

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-[#e1d7cb] bg-white/80 p-6 shadow-[0_30px_70px_-45px_rgba(40,30,20,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
        <span>{t("project.view.header.projects")}</span>
        <span className="text-[#c2b3a3]">/</span>
        <span className="text-[#1f1b16]">{projectName}</span>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-[#1f1b16]">{projectName}</h1>
            {project.isDraft ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                {t("project.view.header.draft")}
              </span>
            ) : null}
          </div>
          <p className="mt-2 w-full text-sm text-[#5b5044]">
            {project.description || t("project.view.header.noDescription")}
          </p>
          <p className="mt-3 text-xs text-[#8a7762]">
            {t("project.view.header.lastUpdated")} {formatDate(project.updatedAt, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
