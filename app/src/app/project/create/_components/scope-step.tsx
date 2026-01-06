"use client";

import { useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { FiCpu, FiLayers } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import NextStepButton from "./next-step-button";

type ScopeStepValues = {
  inScope: string[];
  outScope: string[];
  skipScope: boolean;
};

type ScopeStepProps = {
  initialInScope: string[];
  initialOutScope: string[];
  onNext: (values: ScopeStepValues) => void;
  onBack?: () => void;
  onUpdate?: (values: Partial<ScopeStepValues>) => void;
  projectId?: string | null;
  projectContext?: string;
  stepContext?: string;
  isNextLoading?: boolean;
};

const normalizeTags = (items: string[]) =>
  items
    .map((item) => item.trim())
    .filter(Boolean);

const addTag = (items: string[], value: string) => {
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

export default function ScopeStep({
  initialInScope,
  initialOutScope,
  onNext,
  onBack,
  onUpdate,
  projectId,
  projectContext,
  stepContext,
  isNextLoading,
}: ScopeStepProps) {
  const { t, locale } = useI18n();
  const [inScopeInput, setInScopeInput] = useState("");
  const [outScopeInput, setOutScopeInput] = useState("");
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillError, setAutofillError] = useState<string | null>(null);
  const validationSchema = Yup.object({
    skipScope: Yup.boolean(),
    inScope: Yup.array()
      .of(Yup.string().trim().required())
      .test("scope-required", t("project.create.scope.validation.required"), function (value) {
        const skipScope = this.parent?.skipScope;
        if (skipScope) {
          return true;
        }
        const outScope = Array.isArray(this.parent?.outScope) ? this.parent.outScope : [];
        const inCount = Array.isArray(value) ? value.length : 0;
        return inCount + outScope.length > 0;
      }),
    outScope: Yup.array().of(Yup.string().trim().required()),
  });

  return (
    <Formik<ScopeStepValues>
      initialValues={{
        inScope: normalizeTags(initialInScope),
        outScope: normalizeTags(initialOutScope),
        skipScope: false,
      }}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={(values) =>
        onNext(
          values.skipScope
            ? { inScope: [], outScope: [], skipScope: true }
            : { inScope: values.inScope, outScope: values.outScope, skipScope: false },
        )
      }
    >
      {({
        values,
        errors,
        setFieldValue,
        setFieldTouched,
        setErrors,
        setValues,
        validateForm,
        submitForm,
      }) => (
        <div className="flex flex-col justify-center gap-4 p-5">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#2a241f]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
            <FiLayers className="h-5 w-5" />
          </span>
          {t("project.create.scope.title")}
        </div>
        <div className="rounded-2xl border border-[#d8e5f0] bg-[#f3f8ff] px-4 py-4 text-sm text-[#2b3c4d] shadow-[0_14px_36px_-28px_rgba(37,68,106,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4b6a87]">
            {t("project.create.expert.label")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
            {t("project.create.scope.expert.body1")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
            {t("project.create.scope.expert.body2")}
          </p>
          <div className="mt-4 rounded-2xl border border-[#d9e6f2] bg-white/70 px-4 py-2 text-sm text-[#2b3c4d]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4b6a87]">
              {t("project.create.scope.expert.exampleTitle")}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#2b3c4d]">
              {t("project.create.scope.expert.exampleProject")}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              {t("project.create.scope.expert.exampleInTitle")}
            </p>
            <p className="mt-1 text-sm text-[#2b3c4d]">
              {t("project.create.scope.expert.exampleIn")}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
              {t("project.create.scope.expert.exampleOutTitle")}
            </p>
            <p className="mt-1 text-sm text-[#2b3c4d]">
              {t("project.create.scope.expert.exampleOut")}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-4 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.35)]">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {t("project.create.scope.inLabel")}
                </div>
                <div className="flex w-full flex-col gap-2">
                  {values.inScope.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="group flex w-full items-center justify-between gap-4 rounded-[26px] border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-sm text-emerald-900"
                    >
                      <div className="flex items-center gap-3">
                        
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700">
                          <FiLayers className="h-3.5 w-3.5" />
                        </span>
                        <span>{item}</span>
                      </div>
                      <button
                        type="button"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full cursor-pointer border border-emerald-200 text-emerald-300 transition hover:text-emerald-700 hover:border-emerald-400"
                        onClick={() => {
                          const next = values.inScope.filter((_, i) => i !== index);
                          setFieldValue("inScope", next);
                          onUpdate?.({ inScope: next });
                        }}
                        aria-label={t("project.create.scope.removeTag")}
                        disabled={values.skipScope}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={inScopeInput}
                    onChange={(event) => setInScopeInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const next = addTag(values.inScope, inScopeInput);
                        setFieldValue("inScope", next);
                        onUpdate?.({ inScope: next });
                        setInScopeInput("");
                      }
                    }}
                    placeholder={t("project.create.scope.placeholder")}
                    className="min-w-[220px] flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 disabled:border-emerald-100 disabled:bg-emerald-50/40"
                    disabled={values.skipScope}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border border-emerald-200 px-4 text-sm text-emerald-700 hover:text-emerald-900"
                    onClick={() => {
                      const next = addTag(values.inScope, inScopeInput);
                      setFieldValue("inScope", next);
                      onUpdate?.({ inScope: next });
                      setInScopeInput("");
                    }}
                    disabled={values.skipScope}
                  >
                    {t("common.add")}
                  </Button>
                </div>
                <p className="text-xs text-[#6f6255]">{t("project.create.scope.inHint")}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                  {t("project.create.scope.outLabel")}
                </div>
                <div className="flex w-full flex-col gap-2">
                  {values.outScope.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="group flex w-full items-center justify-between gap-4 rounded-[26px] border border-rose-200 bg-rose-50/70 px-4 py-2 text-sm text-rose-900"
                    >
                      <div className="flex items-center gap-3">
                        
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700">
                          <FiLayers className="h-3.5 w-3.5" />
                        </span>
                        <span>{item}</span>
                      </div>
                      <button
                        type="button"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full cursor-pointer border border-rose-200 text-rose-300 transition hover:text-rose-700 hover:border-rose-400"
                        onClick={() => {
                          const next = values.outScope.filter((_, i) => i !== index);
                          setFieldValue("outScope", next);
                          onUpdate?.({ outScope: next });
                        }}
                        aria-label={t("project.create.scope.removeTag")}
                        disabled={values.skipScope}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={outScopeInput}
                    onChange={(event) => setOutScopeInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const next = addTag(values.outScope, outScopeInput);
                        setFieldValue("outScope", next);
                        onUpdate?.({ outScope: next });
                        setOutScopeInput("");
                      }
                    }}
                    placeholder={t("project.create.scope.placeholder")}
                    className="min-w-[220px] flex-1 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-rose-600 focus:ring-2 focus:ring-rose-600/10 disabled:border-rose-100 disabled:bg-rose-50/40"
                    disabled={values.skipScope}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border border-rose-200 px-4 text-sm text-rose-700 hover:text-rose-900"
                    onClick={() => {
                      const next = addTag(values.outScope, outScopeInput);
                      setFieldValue("outScope", next);
                      onUpdate?.({ outScope: next });
                      setOutScopeInput("");
                    }}
                    disabled={values.skipScope}
                  >
                    {t("common.add")}
                  </Button>
                </div>
                <p className="text-xs text-[#6f6255]">{t("project.create.scope.outHint")}</p>
              </div>
            </div>
          </div>
          {!values.skipScope && (typeof errors.inScope === "string" || typeof errors.outScope === "string") ? (
            <p className="text-xs text-red-600">
              {t("project.create.scope.validation.required")}
            </p>
          ) : null}
          {!values.skipScope ? (
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
                          step: "scope",
                          projectId,
                          projectContext,
                          stepContext,
                          locale,
                        }),
                      });
                      const payload = await response.json();
                      const inScope = Array.isArray(payload?.data?.inScope)
                        ? normalizeTags(payload.data.inScope)
                        : [];
                      const outScope = Array.isArray(payload?.data?.outScope)
                        ? normalizeTags(payload.data.outScope)
                        : [];
                      if (!response.ok || inScope.length + outScope.length === 0) {
                        setAutofillError(t("project.create.autofill.error"));
                        return;
                      }
                      setFieldValue("skipScope", false);
                      setFieldValue("inScope", inScope);
                      setFieldValue("outScope", outScope);
                      onUpdate?.({ inScope, outScope });
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
          ) : null}
          <div className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-3 shadow-[0_12px_30px_-30px_rgba(60,40,20,0.35)]">
            <label className="flex items-start gap-3 text-sm text-[#2a241f]">
              <input
                type="checkbox"
                checked={values.skipScope}
                onChange={(event) => {
                  const next = event.target.checked;
                  const nextValues = next
                    ? { ...values, skipScope: true, inScope: [], outScope: [] }
                    : { ...values, skipScope: false };
                  setValues(nextValues);
                  if (next) {
                    setFieldTouched("inScope", false, false);
                    setFieldTouched("outScope", false, false);
                    setErrors({});
                    void validateForm();
                  }
                }}
                className="mt-1 h-4 w-4 rounded border-[#d7c8b7] text-[#2a241f]"
              />
              <span>
                <span className="block font-semibold">
                  {t("project.create.scope.skip.label")}
                </span>
                <span className="block text-xs text-[#6f6255]">
                  {t("project.create.scope.skip.hint")}
                </span>
              </span>
            </label>
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









