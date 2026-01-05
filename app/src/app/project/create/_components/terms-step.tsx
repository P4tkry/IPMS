"use client";

import { useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { FiCalendar } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import NextStepButton from "./next-step-button";

type TermEntry = {
  date: string;
  description: string;
};

type TermsStepValues = {
  terms: TermEntry[];
};

type TermsStepProps = {
  initialTerms: TermEntry[];
  onNext: (terms: TermEntry[]) => void;
  onBack?: () => void;
  onUpdate?: (value: TermEntry[]) => void;
  isNextLoading?: boolean;
};

const normalizeTerms = (items: TermEntry[]) =>
  items
    .map((item) => ({
      date: item.date?.trim() || "",
      description: item.description?.trim() || "",
    }))
    .filter((item) => item.date.length > 0 && item.description.length > 0);

const addTerm = (items: TermEntry[], term: TermEntry) => {
  const date = term.date.trim();
  const description = term.description.trim();
  if (!date || !description) {
    return items;
  }
  const exists = items.some(
    (item) => item.date === date && item.description.toLowerCase() === description.toLowerCase(),
  );
  if (exists) {
    return items;
  }
  return [...items, { date, description }];
};

export default function TermsStep({
  initialTerms,
  onNext,
  onBack,
  onUpdate,
  isNextLoading,
}: TermsStepProps) {
  const { t } = useI18n();
  const [dateValue, setDateValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const validationSchema = Yup.object({
    terms: Yup.array()
      .of(
        Yup.object({
          date: Yup.string().trim().required(),
          description: Yup.string().trim().required(),
        }),
      )
      .min(1, t("project.create.terms.validation.required")),
  });

  return (
    <Formik<TermsStepValues>
      initialValues={{ terms: normalizeTerms(initialTerms) }}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={(values) => onNext(values.terms)}
    >
      {({ values, errors, submitForm, setFieldValue }) => (
        <div className="flex flex-col justify-center gap-4 p-5">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#2a241f]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700">
              <FiCalendar className="h-5 w-5" />
            </span>
            {t("project.create.terms.title")}
          </div>
          <div className="rounded-2xl border border-[#d9e7ff] bg-[#f1f6ff] px-4 py-4 text-sm text-[#28364d] shadow-[0_14px_36px_-28px_rgba(37,68,106,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3f5a8a]">
              {t("project.create.expert.label")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#28364d]">
              {t("project.create.terms.expert.body1")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#28364d]">
              {t("project.create.terms.expert.body2")}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#28364d]">
              {t("project.create.terms.expert.examplesTitle")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#28364d]">
              <li>{t("project.create.terms.expert.examples.1")}</li>
              <li>{t("project.create.terms.expert.examples.2")}</li>
              <li>{t("project.create.terms.expert.examples.3")}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-4 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]">
                {t("project.create.terms.label")}
              </label>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                {values.terms.length}
              </span>
            </div>
            <div className="mt-3 flex w-full flex-col gap-2">
              {values.terms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#e7dccf] bg-[#fcfaf7] px-4 py-3 text-xs text-[#6f6255]">
                  {t("project.create.terms.empty")}
                </div>
              ) : (
                values.terms
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((item, index) => (
                  <div
                    key={`${item.date}-${item.description}-${index}`}
                    className="group flex w-full items-center justify-between gap-4 rounded-[26px] border border-blue-200 bg-blue-50/70 px-4 py-2 text-sm text-blue-900"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700">
                        <FiCalendar className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                          {item.date}
                        </p>
                        <p className="text-sm text-blue-900">{item.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full cursor-pointer border border-blue-200 text-blue-300 transition hover:text-blue-700 hover:border-blue-400"
                      onClick={() => {
                        const next = values.terms.filter((_, i) => i !== index);
                        setFieldValue("terms", next);
                        onUpdate?.(next);
                      }}
                      aria-label={t("project.create.terms.remove")}
                    >
                      x
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-[160px_1fr_auto]">
              <input
                type="date"
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
                className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              />
              <input
                value={descValue}
                onChange={(event) => setDescValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const next = addTerm(values.terms, { date: dateValue, description: descValue });
                    setFieldValue("terms", next);
                    onUpdate?.(next);
                    setDateValue("");
                    setDescValue("");
                  }
                }}
                placeholder={t("project.create.terms.hint")}
                className="min-w-[220px] rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl border border-blue-200 px-4 text-sm text-blue-700 hover:text-blue-900"
                onClick={() => {
                  const next = addTerm(values.terms, { date: dateValue, description: descValue });
                  setFieldValue("terms", next);
                  onUpdate?.(next);
                  setDateValue("");
                  setDescValue("");
                }}
              >
                {t("common.add")}
              </Button>
            </div>
            {typeof errors.terms === "string" ? (
              <p className="mt-2 text-xs text-red-600">{errors.terms}</p>
            ) : null}
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
            <NextStepButton
              label={t("common.next")}
              onClick={submitForm}
              isLoading={isNextLoading}
            />
          </div>
        </div>
      )}
    </Formik>
  );
}


