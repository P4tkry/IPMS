"use client";

import { Formik } from "formik";
import * as Yup from "yup";
import { FiGrid } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import NextStepButton from "./next-step-button";

type CategoryStepValues = {
  category: string;
};

type CategoryStepProps = {
  initialCategory: string;
  onNext: (category: string) => void;
  onBack?: () => void;
  onUpdate?: (category: string) => void;
  isNextLoading?: boolean;
};

export default function CategoryStep({
  initialCategory,
  onNext,
  onBack,
  onUpdate,
  isNextLoading,
}: CategoryStepProps) {
  const { t } = useI18n();
  const validationSchema = Yup.object({
    category: Yup.string().trim().required(t("project.create.category.validation.required")),
  });

  return (
    <Formik<CategoryStepValues>
      initialValues={{ category: initialCategory }}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={(values) => onNext(values.category)}
    >
      {({ values, handleChange, handleBlur, errors, touched, submitForm }) => (
        <div className="flex flex-col justify-center gap-4 p-5">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#2a241f]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd3] bg-white text-[#6f6255]">
              <FiGrid className="h-5 w-5" />
            </span>
            {t("project.create.category.title")}
          </div>
          <div className="rounded-2xl border border-[#d8e5f0] bg-[#f3f8ff] px-4 py-4 text-sm text-[#2b3c4d] shadow-[0_14px_36px_-28px_rgba(37,68,106,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4b6a87]">
              {t("project.create.expert.label")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
              {t("project.create.category.expert.body")}
            </p>
          </div>
          <div className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-4 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.35)]">
            <label
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]"
              htmlFor="category"
            >
              {t("project.create.category.label")}
            </label>
            <input
              id="category"
              name="category"
              value={values.category}
              onChange={(event) => {
                handleChange(event);
                onUpdate?.(event.target.value);
              }}
              onBlur={handleBlur}
              className="mt-2 w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
            />
            {touched.category && errors.category ? (
              <p className="mt-2 text-xs text-red-600">{errors.category}</p>
            ) : null}
            <p className="mt-2 text-xs text-[#6f6255]">
              {t("project.create.category.hint")}
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
