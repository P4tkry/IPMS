"use client";

import { useI18n } from "@/i18n/useI18n";
import ProjectMetrics from "./project-metrics";
import type { ProjectInfo } from "./types";

type ProjectOverviewProps = {
  project: ProjectInfo;
};

export default function ProjectOverview({ project }: ProjectOverviewProps) {
  const { t } = useI18n();
  const priorityItems = [
    t("project.view.overview.priorities.items.dependencies"),
    t("project.view.overview.priorities.items.roadmap"),
    t("project.view.overview.priorities.items.qa"),
    t("project.view.overview.priorities.items.report"),
  ];

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[#e1d7cb] bg-white/80 p-6 shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
              {t("project.view.overview.pulseLabel")}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#1f1b16]">
              {t("project.view.overview.title")}
            </h2>
          </div>
          <div className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-xs text-[#6f6255]">
            {project.isDraft
              ? t("project.view.overview.statusDraft")
              : t("project.view.overview.statusActive")}
          </div>
        </div>
        <p className="mt-3 text-sm text-[#5b5044]">
          {t("project.view.overview.summary")}
        </p>
        <div className="mt-5">
          <ProjectMetrics />
        </div>
      </div>
      <div className="rounded-3xl border border-[#e1d7cb] bg-white/80 p-5 shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
          {t("project.view.overview.priorities.label")}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[#1f1b16]">
          {t("project.view.overview.priorities.title")}
        </h3>
        <div className="mt-4 space-y-3 text-sm">
          {priorityItems.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-[#eadfd3] bg-[#f9f5f0] px-3 py-3"
            >
              <div className="mt-1 h-2 w-2 rounded-full bg-[#1f1b16]" />
              <p className="text-[#5b5044]">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-[#eadfd3] bg-white px-4 py-3 text-xs text-[#6f6255]">
          {t("project.view.overview.priorities.retro")}
        </div>
      </div>
    </section>
  );
}
