"use client";

import { useI18n } from "@/i18n/useI18n";

const emptyRows = Array.from({ length: 4 });

type PrintFormProps = {
  className?: string;
};

export default function ProjectCreatePrintForm({ className }: PrintFormProps) {
  const { t } = useI18n();

  return (
    <div className={`bg-white px-8 py-10 text-[#1f1a15] ${className || ""}`}>
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7b68]">
            {t("project.create.print.kicker")}
          </p>
          <h1 className="text-3xl font-semibold">{t("project.create.print.title")}</h1>
          <p className="text-sm text-[#5b5044]">{t("project.create.print.subtitle")}</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
            {t("project.create.print.sections.basics")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#2a241f]">
                {t("project.create.print.labels.name")}
              </p>
              <div className="h-9 border-b border-[#d7c8b7]" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#2a241f]">
                {t("project.create.print.labels.category")}
              </p>
              <div className="h-9 border-b border-[#d7c8b7]" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
            {t("project.create.print.sections.vision")}
          </h2>
          <div className="space-y-3">
            {["goal", "outcome", "stakeholders", "justification"].map((key) => (
              <div key={key} className="space-y-2">
                <p className="text-xs font-semibold text-[#2a241f]">
                  {t(`project.create.print.labels.${key}`)}
                </p>
                <div className="h-10 border-b border-[#d7c8b7]" />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
            {t("project.create.print.sections.direction")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {["mvp", "scopeIn", "scopeOut", "kpi", "milestones"].map((key) => (
              <div key={key} className="space-y-2">
                <p className="text-xs font-semibold text-[#2a241f]">
                  {t(`project.create.print.labels.${key}`)}
                </p>
                <div className="space-y-3">
                  {emptyRows.map((_, index) => (
                    <div key={`${key}-${index}`} className="h-6 border-b border-[#d7c8b7]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
            {t("project.create.print.sections.resources")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#2a241f]">
                {t("project.create.print.labels.people")}
              </p>
              <div className="h-9 border-b border-[#d7c8b7]" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#2a241f]">
                {t("project.create.print.labels.budget")}
              </p>
              <div className="h-9 border-b border-[#d7c8b7]" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
            {t("project.create.print.sections.wrapup")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {["chances", "threats"].map((key) => (
              <div key={key} className="space-y-2">
                <p className="text-xs font-semibold text-[#2a241f]">
                  {t(`project.create.print.labels.${key}`)}
                </p>
                <div className="space-y-3">
                  {emptyRows.map((_, index) => (
                    <div key={`${key}-${index}`} className="h-6 border-b border-[#d7c8b7]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2a241f]">
              {t("project.create.print.labels.terms")}
            </p>
            <div className="grid gap-3">
              {emptyRows.map((_, index) => (
                <div key={`terms-${index}`} className="grid grid-cols-[120px_1fr] gap-4">
                  <div className="h-6 border-b border-[#d7c8b7]" />
                  <div className="h-6 border-b border-[#d7c8b7]" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
