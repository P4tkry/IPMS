"use client";

import { useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClipboard,
  FiDollarSign,
  FiFlag,
  FiHelpCircle,
  FiLayers,
  FiStar,
  FiTarget,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { pdf } from "@react-pdf/renderer";
import { ProjectCardPdfDocument } from "./project-card-pdf";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import NextStepButton from "./next-step-button";
import type { ProjectPayload, StakeholderEntry } from "./types";

type SummaryStepValues = ProjectPayload;
type TermEntry = NonNullable<ProjectPayload["terms"]>[number];

type SummaryStepProps = {
  values: SummaryStepValues;
  onBack?: () => void;
  onConfirm: () => void;
  isConfirmLoading?: boolean;
  onDownloadCard?: () => void;
  isDownloading?: boolean;
};

const joinOrFallback = (items: string[], fallback: string) => {
  if (!items.length) {
    return fallback;
  }
  return items.join(", ");
};

const formatTerms = (terms: TermEntry[], fallback: string) => {
  if (!terms.length) {
    return fallback;
  }
  return terms.map((term) => `${term.date} - ${term.description}`).join(" | ");
};

const formatStakeholders = (entries: StakeholderEntry[], fallback: string) => {
  if (!entries.length) {
    return fallback;
  }
  return entries.map((entry) => entry.name).filter(Boolean).join(", ");
};

const summaryItems = (values: SummaryStepValues, fallback: string, t: (key: string) => string) => [
  {
    key: "name",
    label: t("project.create.steps.name"),
    icon: FiClipboard,
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    content: values.name || fallback,
  },
  {
    key: "category",
    label: t("project.create.steps.category"),
    icon: FiLayers,
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    content: values.category || fallback,
  },
  {
    key: "goal",
    label: t("project.create.steps.goal"),
    icon: FiTarget,
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    content: values.goal || fallback,
  },
  {
    key: "outcome",
    label: t("project.create.steps.outcome"),
    icon: FiCheckCircle,
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
    content: values.outcome || fallback,
  },
  {
    key: "stakeholders",
    label: t("project.create.steps.stakeholders"),
    icon: FiUsers,
    badge: "border-teal-200 bg-teal-50 text-teal-700",
    content: formatStakeholders(values.stakeholderEntries ?? [], fallback),
  },
  {
    key: "justification",
    label: t("project.create.steps.justification"),
    icon: FiHelpCircle,
    badge: "border-violet-200 bg-violet-50 text-violet-700",
    content: values.justification || fallback,
  },
  {
    key: "scope",
    label: t("project.create.steps.scope"),
    icon: FiLayers,
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    content: `${t("project.create.scope.inLabel")}: ${joinOrFallback(values.inScope ?? [], fallback)}\n${t("project.create.scope.outLabel")}: ${joinOrFallback(values.outScope ?? [], fallback)}`,
  },
  {
    key: "kpi",
    label: t("project.create.steps.kpi"),
    icon: FiTrendingUp,
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
    content: joinOrFallback(values.kpis ?? [], fallback),
  },
  {
    key: "milestones",
    label: t("project.create.steps.milestones"),
    icon: FiFlag,
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    content: joinOrFallback(values.milestones ?? [], fallback),
  },
  {
    key: "chances",
    label: t("project.create.steps.chances"),
    icon: FiStar,
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    content: joinOrFallback(values.chances ?? [], fallback),
  },
  {
    key: "threats",
    label: t("project.create.steps.threats"),
    icon: FiAlertTriangle,
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    content: joinOrFallback(values.threats ?? [], fallback),
  },
  {
    key: "terms",
    label: t("project.create.steps.terms"),
    icon: FiFlag,
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    content: formatTerms(values.terms ?? [], fallback),
  },
  {
    key: "people",
    label: t("project.create.steps.people"),
    icon: FiUserCheck,
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    content: `${t("project.create.people.highLabel")}: ${values.peopleHighAvailability ?? 0}\n${t("project.create.people.lowLabel")}: ${values.peopleLowAvailability ?? 0}`,
  },
  {
    key: "budget",
    label: t("project.create.steps.budget"),
    icon: FiDollarSign,
    badge: "border-lime-200 bg-lime-50 text-lime-700",
    content: `${values.budget ?? 0}`,
  },
];

export default function SummaryStep({
  values,
  onBack,
  onConfirm,
  isConfirmLoading,
  onDownloadCard,
  isDownloading,
}: SummaryStepProps) {
  const { t } = useI18n();
  const fallback = t("common.noData");
  const items = summaryItems(values, fallback, t);
  const [localDownloading, setLocalDownloading] = useState(false);
  const downloading = onDownloadCard ? !!isDownloading : localDownloading;

  const handleDownloadLocal = async () => {
    if (localDownloading) return;
    setLocalDownloading(true);
    try {
      const strings = {
        kicker: t("project.create.print.kicker"),
        title: t("project.create.summary.title"),
        subtitle: t("project.create.success.subtitle"),
        sections: {
          basics: t("project.create.print.sections.basics"),
          vision: t("project.create.print.sections.vision"),
          direction: t("project.create.print.sections.direction"),
          resources: t("project.create.print.sections.resources"),
          wrapup: t("project.create.print.sections.wrapup"),
        },
        fields: {
          name: t("project.create.steps.name"),
          category: t("project.create.steps.category"),
          goal: t("project.create.steps.goal"),
          outcome: t("project.create.steps.outcome"),
          stakeholders: t("project.create.steps.stakeholders"),
          justification: t("project.create.steps.justification"),
          scopeIn: t("project.create.scope.inLabel"),
          scopeOut: t("project.create.scope.outLabel"),
          kpis: t("project.create.steps.kpi"),
          milestones: t("project.create.steps.milestones"),
          chances: t("project.create.steps.chances"),
          threats: t("project.create.steps.threats"),
          terms: t("project.create.steps.terms"),
          peopleHigh: t("project.create.people.highLabel"),
          peopleLow: t("project.create.people.lowLabel"),
          budget: t("project.create.steps.budget"),
        },
        stakeholdersMap: {
          axisPower: t("project.create.stakeholders.chart.axis.power"),
          axisInterest: t("project.create.stakeholders.chart.axis.interest"),
          quadrants: {
            highLow: t("project.create.stakeholders.chart.quadrants.highLow"),
            highHigh: t("project.create.stakeholders.chart.quadrants.highHigh"),
            lowLow: t("project.create.stakeholders.chart.quadrants.lowLow"),
            lowHigh: t("project.create.stakeholders.chart.quadrants.lowHigh"),
          },
        },
        empty: t("common.noData"),
        footer: {
          poweredBy: t("project.create.print.footer.poweredBy"),
          dateLabel: t("project.create.print.footer.dateLabel"),
          signatureLabel: t("project.create.print.footer.signatureLabel"),
        },
      };

      const blob = await pdf(
        <ProjectCardPdfDocument values={values} strings={strings} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "karta-projektu.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      // pass
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLocalDownloading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center gap-4 p-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-[#e6dccf] bg-[radial-gradient(circle_at_top,#fff8ef,transparent_70%),linear-gradient(135deg,#fffdf8,#f6efe6)] p-5 shadow-[0_18px_50px_-35px_rgba(60,40,20,0.4)]">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#2a241f]">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
            <FiCheckCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8d7b68]">
              {t("project.create.summary.subtitle")}
            </p>
            <p className="text-xl font-semibold text-[#2a241f]">
              {t("project.create.summary.title")}
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[#3a2f25]">
          {t("project.create.summary.description")}
        </p>
      </div>
      <div className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-4 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.35)]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]">
          <FiClipboard className="h-4 w-4 text-[#8d7b68]" />
          {t("project.create.summary.section")}
        </div>
        <div className="mt-4 grid gap-3 text-sm text-[#2a241f]">
          {items.map((item) => {
            const Icon = item.icon;
            const lines = item.content.split("\n");
            return (
              <div
                key={item.key}
                className="rounded-2xl border border-[#eadfd3] bg-[#fffaf5] px-4 py-3"
              >
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-[#8d7b68]">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border ${item.badge}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </div>
                <div className="mt-2 space-y-1 text-sm text-[#2a241f]">
                  {lines.map((line, index) => (
                    <p key={`${item.key}-line-${index}`}>{line}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-2xl border border-[#d7c8b7] bg-white px-6 text-sm text-[#2a241f]"
          onClick={onBack}
          disabled={!onBack}
        >
          {t("common.back")}
        </Button>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl border border-[#d7c8b7] bg-white px-6 text-sm text-[#2a241f]"
            onClick={() => {
              if (onDownloadCard) {
                onDownloadCard();
              } else {
                handleDownloadLocal();
              }
            }}
            disabled={downloading}
          >
            {downloading
              ? t("project.create.success.downloadingCard")
              : t("project.create.success.downloadCard")}
          </Button>
          <NextStepButton
            label={t("project.create.summary.confirm")}
            onClick={onConfirm}
            isLoading={isConfirmLoading}
          />
        </div>
      </div>
    </div>
  );
}
