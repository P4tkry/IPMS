"use client";

import { useI18n } from "@/i18n/useI18n";

type Metric = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "warn" | "good";
};

const toneStyles = {
  neutral: "border-[#eadfd3] bg-white text-[#5b5044]",
  warn: "border-amber-200 bg-amber-50 text-amber-700",
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function ProjectMetrics() {
  const { t } = useI18n();
  const metrics: Metric[] = [
    {
      label: t("project.view.metrics.open.label"),
      value: t("project.view.metrics.open.value"),
      detail: t("project.view.metrics.open.detail"),
      tone: "good",
    },
    {
      label: t("project.view.metrics.inProgress.label"),
      value: t("project.view.metrics.inProgress.value"),
      detail: t("project.view.metrics.inProgress.detail"),
      tone: "neutral",
    },
    {
      label: t("project.view.metrics.blockers.label"),
      value: t("project.view.metrics.blockers.value"),
      detail: t("project.view.metrics.blockers.detail"),
      tone: "warn",
    },
    {
      label: t("project.view.metrics.avgTime.label"),
      value: t("project.view.metrics.avgTime.value"),
      detail: t("project.view.metrics.avgTime.detail"),
      tone: "good",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_12px_30px_-25px_rgba(40,30,20,0.4)] ${
            toneStyles[metric.tone]
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em]">
            {metric.label}
          </p>
          <div className="mt-2 text-2xl font-semibold text-[#1f1b16]">
            {metric.value}
          </div>
          <p className="mt-1 text-xs">{metric.detail}</p>
        </div>
      ))}
    </div>
  );
}
