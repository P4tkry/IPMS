"use client";

import { useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { FiCpu, FiStar } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import NextStepButton from "./next-step-button";

type ChancesStepValues = {
  chances: string[];
};

type ChancesStepProps = {
  initialChances: string[];
  onNext: (chances: string[]) => void;
  onBack?: () => void;
  onUpdate?: (value: string[]) => void;
  projectId?: string | null;
  projectContext?: string;
  stepContext?: string;
  isNextLoading?: boolean;
};

const normalizeItems = (items: string[]) =>
  items
    .map((item) => item.trim())
    .filter(Boolean);

const addItem = (items: string[], value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return items;
  }
  const exists = items.some((item) => item.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return items;
  }
  return [...items, trimmed];
};

export default function ChancesStep({
  initialChances,
  onNext,
  onBack,
  onUpdate,
  projectId,
  projectContext,
  stepContext,
  isNextLoading,
}: ChancesStepProps) {
  const { t, locale } = useI18n();
  const [inputValue, setInputValue] = useState("");
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillError, setAutofillError] = useState<string | null>(null);
  const validationSchema = Yup.object({
    chances: Yup.array()
      .of(Yup.string().trim().required())
      .min(1, t("project.create.chances.validation.required")),
  });

  return (
    <Formik<ChancesStepValues>
      initialValues={{ chances: normalizeItems(initialChances) }}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={(values) => onNext(values.chances)}
    >
      {({ values, errors, submitForm, setFieldValue }) => (
        <div className="flex flex-col justify-center gap-4 p-5">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#2a241f]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
              <FiStar className="h-5 w-5" />
            </span>
            {t("project.create.chances.title")}
          </div>
          <div className="rounded-2xl border border-[#d8e5f0] bg-[#f3f8ff] px-4 py-4 text-sm text-[#2b3c4d] shadow-[0_14px_36px_-28px_rgba(37,68,106,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4b6a87]">
              {t("project.create.expert.label")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
              {t("project.create.chances.expert.body1")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
              {t("project.create.chances.expert.body2")}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#2b3c4d]">
              {t("project.create.chances.expert.examplesTitle")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#2b3c4d]">
              <li>{t("project.create.chances.expert.examples.1")}</li>
              <li>{t("project.create.chances.expert.examples.2")}</li>
              <li>{t("project.create.chances.expert.examples.3")}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-4 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]">
                {t("project.create.chances.label")}
              </label>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                {values.chances.length}
              </span>
            </div>
            <div className="mt-3 flex w-full flex-col gap-2">
              {values.chances.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#e7dccf] bg-[#fcfaf7] px-4 py-3 text-xs text-[#6f6255]">
                  {t("project.create.chances.empty")}
                </div>
              ) : (
                values.chances.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="group flex w-full items-center justify-between gap-4 rounded-[26px] border border-amber-100 bg-[#fff7e8] px-4 py-2 text-sm text-[#2a241f]"
                  >
                    <div className="flex items-center gap-3">
                      
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700">
                        <FiStar className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium leading-snug">{item}</span>
                    </div>
                    <button
                      type="button"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full cursor-pointer border border-amber-200 text-amber-300 transition hover:text-amber-700 hover:border-amber-400"
                      onClick={() => {
                        const next = values.chances.filter((_, i) => i !== index);
                        setFieldValue("chances", next);
                        onUpdate?.(next);
                      }}
                      aria-label={t("project.create.chances.remove")}
                    >
                      x
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const next = addItem(values.chances, inputValue);
                    setFieldValue("chances", next);
                    onUpdate?.(next);
                    setInputValue("");
                  }
                }}
                placeholder={t("project.create.chances.hint")}
                className="min-w-[220px] flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10"
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl border border-amber-200 px-4 text-sm text-amber-700 hover:text-amber-900"
                onClick={() => {
                  const next = addItem(values.chances, inputValue);
                  setFieldValue("chances", next);
                  onUpdate?.(next);
                  setInputValue("");
                }}
              >
                {t("common.add")}
              </Button>
            </div>
            {typeof errors.chances === "string" ? (
              <p className="mt-2 text-xs text-red-600">{errors.chances}</p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-[#e7dccf] bg-[#fcfaf7] px-4 py-4 text-sm text-[#5b5044] shadow-[0_14px_36px_-30px_rgba(60,40,20,0.2)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                <FiCpu className="h-3.5 w-3.5" />
              </span>
              {t("project.create.autofill.label")}
            </div>
            <p className="mt-2 text-sm text-[#5b5044]">
              {t("project.create.autofill.description")}
            </p>
            <p className="mt-3 text-sm text-red-700">
              {t("project.create.autofill.warning")}
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl border border-[#d7c8b7] px-4 text-sm text-[#2a241f] hover:border-[#2a241f]"
                onClick={async () => {
                  if (!projectId || isAutofilling) {
                    return;
                  }
                  setAutofillError(null);
                  setIsAutofilling(true);
                  try {
                    const response = await fetch("/api/project/create/autofill", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        step: "chances",
                        projectId,
                        projectContext,
                        stepContext,
                        locale,
                      }),
                    });
                    const payload = await response.json();
                    const next = Array.isArray(payload?.data?.chances)
                      ? normalizeItems(payload.data.chances)
                      : [];
                    if (!response.ok || next.length === 0) {
                      setAutofillError(t("project.create.autofill.error"));
                      return;
                    }
                    setFieldValue("chances", next);
                    onUpdate?.(next);
                  } catch (err) {
                    setAutofillError(t("project.create.autofill.error"));
                  } finally {
                    setIsAutofilling(false);
                  }
                }}
                disabled={!projectId || isAutofilling}
              >
                {isAutofilling
                  ? t("project.create.autofill.loading")
                  : t("project.create.autofill.action")}
              </Button>
            </div>
            {autofillError ? (
              <p className="mt-3 text-xs text-red-600">{autofillError}</p>
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








