"use client";

import { Formik } from "formik";
import * as Yup from "yup";
import { FiEdit3 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import NextStepButton from "./next-step-button";
import type { CreateProjectState } from "./use-create-project";

type BasicStepValues = {
  name: string;
};

type BasicStepProps = {
  project: CreateProjectState;
  onNext: (name: string) => void;
  onBack?: () => void;
  onUpdate?: (name: string) => void;
  isNextLoading?: boolean;
};

export default function BasicStep({
  project,
  onNext,
  onBack,
  onUpdate,
  isNextLoading,
}: BasicStepProps) {
  const { t } = useI18n();
  const { form } = project;
  const validationSchema = Yup.object({
    name: Yup.string().trim().required(t("project.create.name.validation.required")),
  });

  return (
    <div className="flex flex-col justify-center gap-4 p-5">
      <Formik<BasicStepValues>
        initialValues={{
          name: form.name || "",
        }}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          onNext(values.name);
        }}
      >
        {({ values, handleChange, handleBlur, errors, touched, submitForm }) => (
          <>
            <div className="flex items-center gap-3 text-sm font-semibold text-[#2a241f]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd3] bg-white text-[#6f6255]">
                <FiEdit3 className="h-5 w-5" />
              </span>
              {t("project.create.name.title")}
            </div>
            <div className="rounded-2xl border border-[#d8e5f0] bg-[#f3f8ff] px-4 py-4 text-sm text-[#2b3c4d] shadow-[0_14px_36px_-28px_rgba(37,68,106,0.45)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4b6a87]">
                {t("project.create.expert.label")}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
                {t("project.create.name.expert.body1")}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#2b3c4d]">
                <li>{t("project.create.name.expert.list1")}</li>
                <li>{t("project.create.name.expert.list2")}</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
                {t("project.create.name.expert.body2")}
              </p>
            </div>
            <div className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-4 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.35)]">
              <label
                className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]"
                htmlFor="name"
              >
                {t("project.create.name.label")}
              </label>
              <input
                value={
                  values.name
                }
                onChange={(event) => {
                  handleChange(event);
                  onUpdate?.(event.target.value);
                }}
                onBlur={handleBlur}
                className="mt-2 w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
              />
              {touched.name && errors.name ? (
                <p className="mt-2 text-xs text-red-600">{errors.name}</p>
              ) : null}
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
              {onBack ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl border border-[#d7c8b7] bg-white px-6 text-sm text-[#2a241f]"
                  onClick={onBack}
                >
                  {t("common.back")}
                </Button>
              ) : (
                <span />
              )}
              <NextStepButton
                label={t("common.next")}
                onClick={submitForm}
                isLoading={isNextLoading}
              />
            </div>
          </>
        )}
      </Formik>
    </div>
  );
}
