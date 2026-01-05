"use client";

import { FiCompass, FiEye, FiFlag, FiTarget } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import NextStepButton from "./next-step-button";

type VisionStepProps = {
  onNext: () => void;
  onBack?: () => void;
  isNextLoading?: boolean;
};

export default function VisionStep({ onNext, onBack, isNextLoading }: VisionStepProps) {
  const { t } = useI18n();

  return (
    <div className="relative flex flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl border border-[#e1d7c9] bg-[radial-gradient(circle_at_top,#fff7ea,transparent_70%),linear-gradient(135deg,#fffaf3,#f6efe6)] p-8 text-center text-[#3a2f25] shadow-[0_20px_60px_-40px_rgba(74,52,30,0.45)]">
      <div className="absolute -left-20 top-6 h-40 w-40 rounded-full bg-[#f0dfc8] opacity-40 blur-2xl" />
      <div className="absolute -right-24 bottom-4 h-44 w-44 rounded-full bg-[#e9d4b6] opacity-35 blur-2xl" />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-[0_12px_30px_-18px_rgba(63,70,135,0.6)]">
        <FiEye className="h-8 w-8" />
      </span>
      <div className="relative space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d7b68]">
          {t("project.create.vision.interlude")}
        </p>
        <h3 className="text-3xl font-semibold text-[#2a241f]">
          {t("project.create.vision.title")}
        </h3>
      </div>
      <p className="relative max-w-2xl text-sm leading-relaxed text-[#3a2f25]">
        {t("project.create.vision.description")}
      </p>
      <div className="relative grid gap-3 text-sm text-[#2a241f] md:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#eadfd3] bg-white/70 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
            <FiTarget className="h-4 w-4" />
          </span>
          {t("project.create.vision.items.goal")}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#eadfd3] bg-white/70 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
            <FiFlag className="h-4 w-4" />
          </span>
          {t("project.create.vision.items.outcome")}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#eadfd3] bg-white/70 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700">
            <FiEye className="h-4 w-4" />
          </span>
          {t("project.create.vision.items.stakeholders")}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#eadfd3] bg-white/70 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
            <FiCompass className="h-4 w-4" />
          </span>
          {t("project.create.vision.items.reason")}
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
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
          label={t("project.create.vision.next")}
          onClick={onNext}
          isLoading={isNextLoading}
        />
      </div>
    </div>
  );
}
