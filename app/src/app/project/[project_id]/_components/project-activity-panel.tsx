"use client";

import { useI18n } from "@/i18n/useI18n";

const toneStyles = {
  warn: "border-amber-200 bg-amber-50 text-amber-700",
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function ProjectActivityPanel() {
  const { t } = useI18n();

  const insightItems = [
    {
      label: t("project.view.activity.insights.risk.label"),
      value: t("project.view.activity.insights.risk.value"),
      tone: "warn",
    },
    {
      label: t("project.view.activity.insights.scope.label"),
      value: t("project.view.activity.insights.scope.value"),
      tone: "warn",
    },
    {
      label: t("project.view.activity.insights.velocity.label"),
      value: t("project.view.activity.insights.velocity.value"),
      tone: "good",
    },
  ];

  const timelineItems = [
    t("project.view.activity.timeline.items.demo"),
    t("project.view.activity.timeline.items.planning"),
    t("project.view.activity.timeline.items.release"),
  ];

  const activityItems = [
    {
      title: t("project.view.activity.feed.items.review"),
      time: t("project.view.activity.feed.times.review"),
    },
    {
      title: t("project.view.activity.feed.items.priority"),
      time: t("project.view.activity.feed.times.priority"),
    },
    {
      title: t("project.view.activity.feed.items.sprint"),
      time: t("project.view.activity.feed.times.sprint"),
    },
    {
      title: t("project.view.activity.feed.items.blocker"),
      time: t("project.view.activity.feed.times.blocker"),
    },
  ];

  return (
    <aside className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[#e1d7cb] bg-white/80 p-5 shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
          {t("project.view.activity.insights.label")}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[#1f1b16]">
          {t("project.view.activity.insights.title")}
        </h3>
        <div className="mt-4 space-y-3">
          {insightItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-xs ${
                toneStyles[item.tone as keyof typeof toneStyles]
              }`}
            >
              <span className="uppercase tracking-[0.18em]">{item.label}</span>
              <span className="text-sm font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-[#e1d7cb] bg-white/80 p-5 shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
          {t("project.view.activity.upcoming.label")}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[#1f1b16]">
          {t("project.view.activity.upcoming.title")}
        </h3>
        <div className="mt-4 space-y-3 text-sm text-[#5b5044]">
          {timelineItems.map((item) => (
            <div key={item} className="rounded-2xl border border-[#eadfd3] bg-[#f9f5f0] px-3 py-3">
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-[#e1d7cb] bg-white/80 p-5 shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
          {t("project.view.activity.feed.label")}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[#1f1b16]">
          {t("project.view.activity.feed.title")}
        </h3>
        <div className="mt-4 space-y-3">
          {activityItems.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#eadfd3] bg-white px-3 py-3">
              <p className="text-sm text-[#1f1b16]">{item.title}</p>
              <p className="mt-1 text-xs text-[#8a7762]">{item.time}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
