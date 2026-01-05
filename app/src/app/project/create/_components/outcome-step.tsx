"use client";

import { Formik } from "formik";
import * as Yup from "yup";
import { FiCheckCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import NextStepButton from "./next-step-button";

type OutcomeStepValues = {
  outcome: string;
};

type OutcomeStepProps = {
  initialOutcome: string;
  isSubmitting: boolean;
  onSubmit: (values: OutcomeStepValues) => Promise<void>;
  onBack?: () => void;
  onUpdate?: (value: string) => void;
  isNextLoading?: boolean;
};

export default function OutcomeStep({
  initialOutcome,
  isSubmitting,
  onSubmit,
  onBack,
  onUpdate,
  isNextLoading,
}: OutcomeStepProps) {
  const { t } = useI18n();
  const validationSchema = Yup.object({
    outcome: Yup.string().trim().required(t("project.create.outcome.validation.required")),
  });

  return (
    <Formik<OutcomeStepValues>
      initialValues={{ outcome: initialOutcome }}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ values, handleChange, handleBlur, errors, touched, submitForm }) => (
        <div className="flex flex-col justify-center gap-4 p-5">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#2a241f]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <FiCheckCircle className="h-5 w-5" />
            </span>
            {t("project.create.outcome.title")}
          </div>
          <div className="rounded-2xl border border-[#d8e5f0] bg-[#f3f8ff] px-4 py-4 text-sm text-[#2b3c4d] shadow-[0_14px_36px_-28px_rgba(37,68,106,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4b6a87]">
              {t("project.create.expert.label")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
              {t("project.create.outcome.expert.body1")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
              {t("project.create.outcome.expert.body2")}
            </p>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2b3c4d]">
                {t("project.create.outcome.examples.title")}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#2b3c4d]">
                <li>{t("project.create.outcome.examples.1")}</li>
                <li>{t("project.create.outcome.examples.2")}</li>
                <li>{t("project.create.outcome.examples.3")}</li>
                <li>{t("project.create.outcome.examples.4")}</li>
              </ul>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
              {t("project.create.outcome.expert.body3")}
            </p>
          </div>
          <div className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-4 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.35)]">
            <label
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]"
              htmlFor="outcome"
            >
              {t("project.create.outcome.label")}
            </label>
            <input
              id="outcome"
              name="outcome"
              value={values.outcome}
              onChange={(event) => {
                handleChange(event);
                onUpdate?.(event.target.value);
              }}
              onBlur={handleBlur}
              className="mt-2 w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
            />
            {touched.outcome && errors.outcome ? (
              <p className="mt-2 text-xs text-red-600">{errors.outcome}</p>
            ) : null}
            <p className="mt-2 text-xs text-[#6f6255]">
              {t("project.create.outcome.hint")}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border border-[#d7c8b7] bg-white px-6 text-sm text-[#2a241f]"
              onClick={onBack}
              disabled={!onBack || isSubmitting}
            >
              {t("common.back")}
            </Button>
            <NextStepButton
              label={t("common.next")}
              onClick={submitForm}
              isLoading={isNextLoading}
              disabled={isSubmitting}
            />
          </div>
        </div>
      )}
    </Formik>
  );
}
