"use client";

import { Formik } from "formik";
import * as Yup from "yup";
import { FiUserCheck, FiUserX } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import NextStepButton from "./next-step-button";

type PeopleStepValues = {
  peopleHighAvailability: number;
  peopleLowAvailability: number;
};

type PeopleStepProps = {
  initialHigh: number;
  initialLow: number;
  onNext: (values: PeopleStepValues) => void;
  onBack?: () => void;
  onUpdate?: (values: Partial<PeopleStepValues>) => void;
  isNextLoading?: boolean;
};

export default function PeopleStep({
  initialHigh,
  initialLow,
  onNext,
  onBack,
  onUpdate,
  isNextLoading,
}: PeopleStepProps) {
  const { t } = useI18n();
  const validationSchema = Yup.object({
    peopleHighAvailability: Yup.number()
      .min(0, t("project.create.people.validation.nonNegative"))
      .required(t("project.create.people.validation.highRequired")),
    peopleLowAvailability: Yup.number()
      .min(0, t("project.create.people.validation.nonNegative"))
      .required(t("project.create.people.validation.lowRequired")),
  });

  return (
    <Formik<PeopleStepValues>
      initialValues={{
        peopleHighAvailability: initialHigh,
        peopleLowAvailability: initialLow,
      }}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={(values) => onNext(values)}
    >
      {({ values, errors, touched, submitForm, setFieldValue }) => (
        <div className="flex flex-col justify-center gap-4 p-5">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#2a241f]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <FiUserCheck className="h-5 w-5" />
            </span>
            {t("project.create.people.title")}
          </div>
          <div className="rounded-2xl border border-[#d8e5f0] bg-[#f3f8ff] px-4 py-4 text-sm text-[#2b3c4d] shadow-[0_14px_36px_-28px_rgba(37,68,106,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4b6a87]">
              {t("project.create.expert.label")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
              {t("project.create.people.expert.body1")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
              {t("project.create.people.expert.body2")}
            </p>
          </div>
          <div className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-4 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]">
              {t("project.create.people.splitTitle")}
            </p>
            <p className="mt-2 text-xs text-[#6f6255]">
              {t("project.create.people.splitHint")}
            </p>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-3">
                <div className="flex items-center justify-between text-sm font-semibold text-[#2a241f]">
                  <span className="flex items-center gap-2">
                    <FiUserCheck className="h-4 w-4 text-emerald-700" />
                    {t("project.create.people.highLabel")}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                    {values.peopleHighAvailability}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={values.peopleHighAvailability}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    setFieldValue("peopleHighAvailability", nextValue);
                    onUpdate?.({ peopleHighAvailability: nextValue });
                  }}
                  className="mt-3 w-full accent-emerald-600"
                />
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-3">
                <div className="flex items-center justify-between text-sm font-semibold text-[#2a241f]">
                  <span className="flex items-center gap-2">
                    <FiUserX className="h-4 w-4 text-amber-700" />
                    {t("project.create.people.lowLabel")}
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                    {values.peopleLowAvailability}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={values.peopleLowAvailability}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    setFieldValue("peopleLowAvailability", nextValue);
                    onUpdate?.({ peopleLowAvailability: nextValue });
                  }}
                  className="mt-3 w-full accent-amber-600"
                />
              </div>
            </div>

            {touched.peopleHighAvailability && errors.peopleHighAvailability ? (
              <p className="mt-3 text-xs text-red-600">{errors.peopleHighAvailability}</p>
            ) : null}
            {touched.peopleLowAvailability && errors.peopleLowAvailability ? (
              <p className="mt-2 text-xs text-red-600">{errors.peopleLowAvailability}</p>
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
