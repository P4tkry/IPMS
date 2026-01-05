"use client";

import { Formik } from "formik";
import * as Yup from "yup";
import { FiHelpCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import NextStepButton from "./next-step-button";

type JustificationStepValues = {
  justification: string;
};

type JustificationStepProps = {
  initialJustification: string;
  onNext: (justification: string) => void;
  onBack?: () => void;
  onUpdate?: (value: string) => void;
  isNextLoading?: boolean;
};

export default function JustificationStep({
  initialJustification,
  onNext,
  onBack,
  onUpdate,
  isNextLoading,
}: JustificationStepProps) {
  const { t } = useI18n();
  const validationSchema = Yup.object({
    justification: Yup.string()
      .trim()
      .required(t("project.create.justification.validation.required")),
  });

  return (
    <Formik<JustificationStepValues>
      initialValues={{ justification: initialJustification }}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={(values) => onNext(values.justification)}
    >
      {({ values, handleChange, handleBlur, errors, touched, submitForm }) => (
        <div className="flex flex-col justify-center gap-4 p-5">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#2a241f]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700">
            <FiHelpCircle className="h-5 w-5" />
          </span>
          {t("project.create.justification.title")}
        </div>
        <div className="rounded-2xl border border-[#d8e5f0] bg-[#f3f8ff] px-4 py-4 text-sm text-[#2b3c4d] shadow-[0_14px_36px_-28px_rgba(37,68,106,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4b6a87]">
            {t("project.create.expert.label")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
            {t("project.create.justification.expert.body1")}
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#2b3c4d]">
            {t("project.create.justification.expert.examplesTitle")}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#2b3c4d]">
            <li>{t("project.create.justification.expert.examples.1")}</li>
            <li>{t("project.create.justification.expert.examples.2")}</li>
            <li>{t("project.create.justification.expert.examples.3")}</li>
            <li>{t("project.create.justification.expert.examples.4")}</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-4 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.35)]">
          <label
            className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]"
            htmlFor="justification"
          >
              {t("project.create.justification.label")}
            </label>
            <input
              id="justification"
              name="justification"
              value={values.justification}
              onChange={(event) => {
                handleChange(event);
                onUpdate?.(event.target.value);
              }}
              onBlur={handleBlur}
              className="mt-2 w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
            />
            {touched.justification && errors.justification ? (
              <p className="mt-2 text-xs text-red-600">{errors.justification}</p>
            ) : null}
            <p className="mt-2 text-xs text-[#6f6255]">
              {t("project.create.justification.hint")}
            </p>
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
