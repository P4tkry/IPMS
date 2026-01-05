"use client";

import { Formik } from "formik";
import { useRef, useState } from "react";
import * as Yup from "yup";
import { FiCpu, FiUsers } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import NextStepButton from "./next-step-button";
import type { StakeholderEntry } from "./types";

type StakeholdersStepValues = {
  stakeholderEntries: StakeholderEntry[];
};

type StakeholdersStepProps = {
  initialEntries: StakeholderEntry[];
  onNext: (values: StakeholdersStepValues) => void;
  onBack?: () => void;
  onUpdate?: (values: Partial<StakeholdersStepValues>) => void;
  isNextLoading?: boolean;
  projectId?: string | null;
  projectContext?: string;
  stepContext?: string;
};

const clampScore = (value: number) => Math.min(10, Math.max(0, value));

const emptyEntry: StakeholderEntry = {
  name: "",
  interest: 5,
  power: 5,
};

const pointColors = [
  "#0f766e",
  "#2563eb",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#7c3aed",
  "#0ea5e9",
  "#b91c1c",
];

export default function StakeholdersStep({
  initialEntries,
  onNext,
  onBack,
  onUpdate,
  isNextLoading,
  projectId,
  projectContext,
  stepContext,
}: StakeholdersStepProps) {
  const { t, locale } = useI18n();
  const validationSchema = Yup.object({
    stakeholderEntries: Yup.array()
      .of(
        Yup.object({
          name: Yup.string().trim().required(t("project.create.stakeholders.validation.name")),
          interest: Yup.number().min(0).max(10).required(),
          power: Yup.number().min(0).max(10).required(),
        }),
      )
      .min(1, t("project.create.stakeholders.validation.required")),
  });

  const chartRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [newStakeholder, setNewStakeholder] = useState("");
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillError, setAutofillError] = useState<string | null>(null);

  const clampPoint = (value: number) => Math.min(10, Math.max(1, value));

  const normalizeAutofill = (items: unknown): StakeholderEntry[] => {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const record = entry as Record<string, unknown>;
        const name = typeof record.name === "string" ? record.name.trim() : "";
        if (!name) {
          return null;
        }
        const interest =
          typeof record.interest === "number" && !Number.isNaN(record.interest)
            ? clampPoint(Math.round(record.interest))
            : 5;
        const power =
          typeof record.power === "number" && !Number.isNaN(record.power)
            ? clampPoint(Math.round(record.power))
            : 5;
        return { name, interest, power };
      })
      .filter((entry): entry is StakeholderEntry => Boolean(entry));
  };

  return (
    <Formik<StakeholdersStepValues>
      initialValues={{ stakeholderEntries: initialEntries }}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={(values) => onNext(values)}
    >
      {({ values, errors, submitForm, setFieldValue }) => {
        const updateEntries = (next: StakeholderEntry[]) => {
          setFieldValue("stakeholderEntries", next);
          onUpdate?.({ stakeholderEntries: next });
        };

        const updateFromPoint = (index: number, clientX: number, clientY: number) => {
          const rect = plotRef.current?.getBoundingClientRect();
          if (!rect) {
            return;
          }
          const clampedX = Math.min(rect.right, Math.max(rect.left, clientX));
          const clampedY = Math.min(rect.bottom, Math.max(rect.top, clientY));
          const percentX = ((clampedX - rect.left) / rect.width) * 10;
          const percentY = (1 - (clampedY - rect.top) / rect.height) * 10;
          const next = values.stakeholderEntries.map((item, idx) =>
            idx === index
              ? {
                  ...item,
                  interest: Math.round(clampScore(percentX)),
                  power: Math.round(clampScore(percentY)),
                }
              : item,
          );
          updateEntries(next);
        };

        const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
          if (draggingIndex === null) {
            return;
          }
          updateFromPoint(draggingIndex, event.clientX, event.clientY);
        };

        const hasEntriesError =
          typeof errors.stakeholderEntries === "string" ? errors.stakeholderEntries : null;

        return (
          <div className="flex flex-col justify-center gap-4 p-5">
            <div className="flex items-center gap-3 text-sm font-semibold text-[#2a241f]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700">
                <FiUsers className="h-5 w-5" />
              </span>
              {t("project.create.stakeholders.title")}
            </div>

            <div className="rounded-2xl border border-[#d8e5f0] bg-[#f3f8ff] px-4 py-4 text-sm text-[#2b3c4d] shadow-[0_14px_36px_-28px_rgba(37,68,106,0.45)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4b6a87]">
                {t("project.create.expert.label")}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
                {t("project.create.stakeholders.expert.body1")}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
                {t("project.create.stakeholders.expert.body2")}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#2b3c4d]">
                <li>{t("project.create.stakeholders.expert.list1")}</li>
                <li>{t("project.create.stakeholders.expert.list2")}</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-[#2b3c4d]">
                {t("project.create.stakeholders.expert.body3")}
              </p>
            </div>

            <div className="rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] px-4 py-4 shadow-[0_16px_40px_-35px_rgba(60,40,20,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]">
                {t("project.create.stakeholders.chart.title")}
              </p>
              <div className="mt-4 grid gap-4">
                <div className="space-y-3">
                  <p className="text-xs text-[#6f6255]">
                    {t("project.create.stakeholders.chart.subtitle")}
                  </p>
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#eadfd3] bg-white px-4 py-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7b68]">
                      {t("project.create.stakeholders.input.label")}
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        value={newStakeholder}
                        onChange={(event) => setNewStakeholder(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            const trimmed = newStakeholder.trim();
                            if (!trimmed) {
                              return;
                            }
                            updateEntries([
                              ...values.stakeholderEntries,
                              { ...emptyEntry, name: trimmed },
                            ]);
                            setNewStakeholder("");
                          }
                        }}
                        placeholder={t("project.create.stakeholders.input.placeholder")}
                        className="min-w-[220px] flex-1 rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-2xl border border-[#d7c8b7] px-4 text-sm"
                        onClick={() => {
                          const trimmed = newStakeholder.trim();
                          if (!trimmed) {
                            return;
                          }
                          updateEntries([
                            ...values.stakeholderEntries,
                            { ...emptyEntry, name: trimmed },
                          ]);
                          setNewStakeholder("");
                        }}
                      >
                        {t("common.add")}
                      </Button>
                    </div>
                  </div>
                  {hasEntriesError ? (
                    <p className="text-xs text-red-600">{hasEntriesError}</p>
                  ) : null}
                  {values.stakeholderEntries.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {values.stakeholderEntries.map((entry, index) => (
                        <div
                          key={`stakeholder-${index}`}
                          className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#eadfd3] bg-white px-2 py-1"
                        >
                          <span className="truncate text-sm text-[#2a241f]">
                            {entry.name || `#${index + 1}`}
                          </span>
                          <button
                            type="button"
                            className="flex h-5 w-5 items-center justify-center rounded-full text-[14px] text-[#8d7b68] transition hover:bg-[#f3eee6] hover:text-[#2a241f] leading-[1] pt-[0px]"
                            onClick={() =>
                              updateEntries(
                                values.stakeholderEntries.filter((_, i) => i !== index),
                              )
                            }
                            aria-label={t("project.create.stakeholders.remove")}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="relative rounded-2xl border border-[#e6dccf] bg-white px-7 py-4">
                  <div className="p-4 relative">
                    <div className="absolute left-[-49px] top-1/2 -translate-y-1/2 -rotate-90">
                      <span className="rounded-full bg-[#f8f4ef] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6255]">
                        {t("project.create.stakeholders.chart.axis.power")}
                      </span>
                    </div>
                    <div
                      ref={chartRef}
                      className="relative h-80 w-full rounded-2xl border border-[#eadfd3] bg-[#f8f4ef] md:h-[26rem]"
                      onPointerMove={handlePointerMove}
                      onPointerUp={() => setDraggingIndex(null)}
                      onPointerLeave={() => setDraggingIndex(null)}
                    >
                      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 overflow-hidden rounded-2xl">
                        <div className="relative bg-amber-50/70">
                          <span className="absolute left-3 top-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                            {t("project.create.stakeholders.chart.quadrants.highLow")}
                          </span>
                        </div>
                        <div className="relative bg-emerald-50/70">
                          <span className="absolute right-3 top-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 text-right">
                            {t("project.create.stakeholders.chart.quadrants.highHigh")}
                          </span>
                        </div>
                        <div className="relative bg-slate-100/70">
                          <span className="absolute left-3 bottom-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                            {t("project.create.stakeholders.chart.quadrants.lowLow")}
                          </span>
                        </div>
                        <div className="relative bg-sky-50/70">
                          <span className="absolute right-3 bottom-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-700 text-right">
                            {t("project.create.stakeholders.chart.quadrants.lowHigh")}
                          </span>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#d7c8b7]" />
                      <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-[#d7c8b7]" />
                      <div ref={plotRef} className="absolute inset-4">
                        {values.stakeholderEntries.map((entry, index) => {
                          const x = (clampScore(entry.interest) / 10) * 100;
                          const y = 100 - (clampScore(entry.power) / 10) * 100;
                          const color = pointColors[index % pointColors.length];
                          const isRightEdge = x > 70;
                          const labelStyle = isRightEdge
                            ? { left: -4, transform: "translate(-100%, -50%)" }
                            : { left: 16, transform: "translate(0, -50%)" };
                          return (
                            <div
                              key={`stakeholder-point-${index}`}
                              className="absolute"
                              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                            >
                              <span
                                className="block h-3 w-3 cursor-grab rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.9)] active:cursor-grabbing"
                                style={{ backgroundColor: color }}
                                onPointerDown={(event) => {
                                  event.currentTarget.setPointerCapture(event.pointerId);
                                  setDraggingIndex(index);
                                  updateFromPoint(index, event.clientX, event.clientY);
                                }}
                              />
                              <span
                                className="absolute hidden text-xs md:inline"
                                style={{ color, top: "50%", ...labelStyle }}
                              >
                                {entry.name || `#${index + 1}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-0 flex items-center justify-center">
                    <span className="rounded-full bg-[#f8f4ef] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6255]">
                      {t("project.create.stakeholders.chart.axis.interest")}
                    </span>
                  </div>
                </div>
              </div>
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
                          step: "stakeholders",
                          projectId,
                          projectContext,
                          stepContext,
                          locale,
                        }),
                      });
                      const payload = await response.json();
                      const next = normalizeAutofill(payload?.data?.stakeholders);
                      if (!response.ok || next.length === 0) {
                        setAutofillError(t("project.create.autofill.error"));
                        return;
                      }
                      updateEntries(next);
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
        );
      }}
    </Formik>
  );
}
