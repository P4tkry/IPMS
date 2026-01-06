"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/i18n/useI18n";
import type { ProjectInfo } from "./types";

type DetailItemProps = {
  label: string;
  value: ReactNode;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-3 shadow-[0_12px_30px_-25px_rgba(40,30,20,0.35)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
        {label}
      </p>
      <div className="mt-2 text-sm text-[#1f1b16]">{value}</div>
    </div>
  );
}

function BulletList({ items, empty }: { items?: string[] | null; empty: string }) {
  if (!items || items.length === 0) {
    return <span className="text-xs text-[#8a7762]">{empty}</span>;
  }

  return (
    <ul className="space-y-2 text-sm text-[#1f1b16]">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#1f1b16]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function TermsList({
  terms,
  empty,
}: {
  terms?: { date: string | null; description: string | null }[] | null;
  empty: string;
}) {
  if (!terms || terms.length === 0) {
    return <span className="text-xs text-[#8a7762]">{empty}</span>;
  }

  const normalized = terms.filter(
    (item): item is { date: string | null; description: string | null } =>
      !!item &&
      ((typeof item.date === "string" && item.date.trim().length > 0) ||
        (typeof item.description === "string" && item.description.trim().length > 0)),
  );

  if (normalized.length === 0) {
    return <span className="text-xs text-[#8a7762]">{empty}</span>;
  }

  return (
    <ul className="space-y-2 text-sm text-[#1f1b16]">
      {normalized.map((item, index) => (
        <li
          key={`${item.date}-${index}`}
          className="flex flex-col gap-1 rounded-xl bg-[#f9f5f0] px-3 py-2"
        >
          <span className="text-xs text-[#8a7762]">{item.date || empty}</span>
          <span>{item.description || empty}</span>
        </li>
      ))}
    </ul>
  );
}

type ProjectDetailsProps = {
  project: ProjectInfo;
};

export default function ProjectDetails({ project }: ProjectDetailsProps) {
  const { t } = useI18n();
  const empty = t("common.noData");

  const formatText = (value?: string | null) => (value && value.trim().length ? value : empty);
  const formatNumber = (value?: number | null) =>
    value === null || value === undefined ? empty : value.toString();

  return (
    <div className="rounded-3xl border border-[#e1d7cb] bg-white/80 p-6 shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
            {t("project.create.summary.section")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#1f1b16]">
            {t("project.create.summary.title")}
          </h2>
        </div>
        <span className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-xs text-[#6f6255]">
          {t("project.create.print.sections.basics")}
        </span>
      </div>

      <div className="mt-5 space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <DetailItem label={t("project.create.steps.category")} value={formatText(project.category)} />
          <DetailItem label={t("project.create.steps.budget")} value={formatNumber(project.budget)} />
          <DetailItem
            label={t("project.create.steps.goal")}
            value={formatText(project.goal)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <DetailItem
            label={t("project.create.steps.justification")}
            value={formatText(project.justification)}
          />
          <DetailItem
            label={t("project.create.steps.mvp")}
            value={<BulletList items={project.mvp || undefined} empty={empty} />}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <DetailItem
            label={t("project.create.steps.kpi")}
            value={<BulletList items={project.kpis || undefined} empty={empty} />}
          />
          <DetailItem
            label={t("project.create.steps.milestones")}
            value={<BulletList items={project.milestones || undefined} empty={empty} />}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <DetailItem
            label={t("project.create.scope.inLabel")}
            value={<BulletList items={project.inScope || undefined} empty={empty} />}
          />
          <DetailItem
            label={t("project.create.scope.outLabel")}
            value={<BulletList items={project.outScope || undefined} empty={empty} />}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <DetailItem
            label={t("project.create.steps.chances")}
            value={<BulletList items={project.chances || undefined} empty={empty} />}
          />
          <DetailItem
            label={t("project.create.steps.threats")}
            value={<BulletList items={project.threats || undefined} empty={empty} />}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <DetailItem
            label={t("project.create.people.highLabel")}
            value={formatNumber(project.peopleHighAvailability)}
          />
          <DetailItem
            label={t("project.create.people.lowLabel")}
            value={formatNumber(project.peopleLowAvailability)}
          />
          <DetailItem
            label={t("project.create.steps.terms")}
            value={<TermsList terms={project.terms || undefined} empty={empty} />}
          />
        </div>
      </div>
    </div>
  );
}
