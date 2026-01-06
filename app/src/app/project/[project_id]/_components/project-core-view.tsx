"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit3,
  FiFlag,
  FiLayers,
  FiSave,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiUsers,
  FiZap,
  FiX,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProjectContext } from "./project-context";

type FormState = {
  name: string;
  tradeName: string;
  category: string;
  goal: string;
  justification: string;
  outcome: string;
  mvp: string;
  kpis: string;
  milestones: string;
  chances: string;
  threats: string;
  inScope: string;
  outScope: string;
  peopleHighAvailability: string;
  peopleLowAvailability: string;
  budget: string;
};

const textareaClass =
  "w-full rounded-xl border border-[#e1d7cb] bg-white px-3 py-2 text-sm text-[#2a241f] outline-none transition focus:border-[#2a241f]";

const chipClass =
  "inline-flex flex-col items-center justify-center gap-1 rounded-xl border border-[#e1d7cb] bg-[#f8f3ea] px-4 py-3 text-center text-xs text-[#4c4138] shadow-[0_10px_30px_-20px_rgba(50,35,20,0.4)]";

const parseList = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const toLines = (value?: string[] | null) => (Array.isArray(value) ? value.join("\n") : "");
const toNumber = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const SectionHeader = ({
  icon: Icon,
  title,
  hint,
  accent = "bg-[#f0e7da] text-[#2a241f] border-[#e6d7c3]",
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  accent?: string;
}) => (
  <div
    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${accent}`}
  >
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-[#2a241f] shadow-[0_12px_30px_-18px_rgba(20,16,12,0.35)]">
        {Icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">{title}</p>
        {hint ? <p className="text-xs text-[#6f6255]">{hint}</p> : null}
      </div>
    </div>
  </div>
);

export default function ProjectCoreView() {
  const project = useProjectContext();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    tradeName: "",
    category: "",
    goal: "",
    justification: "",
    outcome: "",
    mvp: "",
    kpis: "",
    milestones: "",
    chances: "",
    threats: "",
    inScope: "",
    outScope: "",
    peopleHighAvailability: "",
    peopleLowAvailability: "",
    budget: "",
  });

  useEffect(() => {
    setForm({
      name: project.name ?? "",
      tradeName: project.tradeName ?? "",
      category: project.category ?? "",
      goal: project.goal ?? "",
      justification: project.justification ?? "",
      outcome: project.description ?? "",
      mvp: toLines(project.mvp),
      kpis: toLines(project.kpis),
      milestones: toLines(project.milestones),
      chances: toLines(project.chances),
      threats: toLines(project.threats),
      inScope: toLines(project.inScope),
      outScope: toLines(project.outScope),
      peopleHighAvailability:
        project.peopleHighAvailability !== null && project.peopleHighAvailability !== undefined
          ? String(project.peopleHighAvailability)
          : "",
      peopleLowAvailability:
        project.peopleLowAvailability !== null && project.peopleLowAvailability !== undefined
          ? String(project.peopleLowAvailability)
          : "",
      budget: project.budget !== null && project.budget !== undefined ? String(project.budget) : "",
    });
  }, [project]);

  const setField =
    <K extends keyof FormState>(key: K) =>
      (value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

  const saveChanges = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        name: form.name.trim() || undefined,
        tradeName: form.tradeName.trim() || undefined,
        category: form.category.trim() || undefined,
        goal: form.goal.trim() || undefined,
        justification: form.justification.trim() || undefined,
        description: form.outcome.trim() || undefined,
        mvp: parseList(form.mvp),
        kpis: parseList(form.kpis),
        milestones: parseList(form.milestones),
        chances: parseList(form.chances),
        threats: parseList(form.threats),
        inScope: parseList(form.inScope),
        outScope: parseList(form.outScope),
        peopleHighAvailability: toNumber(form.peopleHighAvailability),
        peopleLowAvailability: toNumber(form.peopleLowAvailability),
        budget: toNumber(form.budget),
      };

      const response = await fetch(`/api/project/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const payloadResponse = await response.json();
      if (!response.ok) {
        setError(payloadResponse?.message || "Nie udało się zapisać zmian.");
        return;
      }
      setSuccess("Zapisano zmiany");
      setEditing(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zapisać zmian.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const renderList = (items?: string[] | null, emptyText = "Brak danych") =>
    items && items.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className={chipClass}>
            {item}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-sm text-[#8a7762]">{emptyText}</p>
    );

  const infoChips = [
    { label: "Status", value: project.isDraft ? "Szkic" : "Aktywny" },
    { label: "Kategoria", value: project.category || "—" },
    { label: "Budżet", value: project.budget ? `${project.budget} PLN` : "—" },
    {
      label: "Zasoby",
      value:
        project.peopleHighAvailability || project.peopleLowAvailability
          ? `${(project.peopleHighAvailability || 0) + (project.peopleLowAvailability || 0)} os.`
          : "—",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="overflow-hidden rounded-3xl border border-[#e1d7cb] bg-gradient-to-r from-[#f9f4ed] via-white to-[#f3e7da] p-6 shadow-[0_30px_80px_-50px_rgba(40,30,20,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
              Kluczowe informacje
            </p>
            <h1 className="text-3xl font-semibold text-[#1f1b16] leading-tight">
              {project.tradeName || project.name || "Projekt bez nazwy"}
            </h1>
            <p className="text-sm text-[#6f6255]">
              Podsumowanie i edycja najważniejszych danych z formularza.
            </p>
          </div>
          {project.canEditProject ? (
            <div className="flex flex-wrap items-center gap-2">
              {editing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border border-[#d7c8b7] bg-white text-sm text-[#2a241f]"
                    onClick={() => {
                      setEditing(false);
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    <FiX className="mr-2 h-4 w-4" />
                    Anuluj
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl bg-[#2a241f] text-sm text-[#f6efe8] hover:bg-[#3a332c]"
                    onClick={saveChanges}
                    disabled={saving}
                  >
                    <FiSave className="mr-2 h-4 w-4" />
                    {saving ? "Zapisywanie..." : "Zapisz zmiany"}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  className="rounded-xl bg-[#2a241f] text-sm text-[#f6efe8] hover:bg-[#3a332c]"
                  onClick={() => setEditing(true)}
                >
                  <FiEdit3 className="mr-2 h-4 w-4" />
                  Edytuj
                </Button>
              )}
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#8a7762]">
          <span className="rounded-full border border-[#eadfd3] bg-white/80 px-3 py-1">
            Status: <span className="font-semibold text-[#1f1b16]">{project.isDraft ? "Szkic" : "Aktywny"}</span>
          </span>
          <span className="rounded-full border border-[#eadfd3] bg-white/80 px-3 py-1">
            Ostatnia aktualizacja:{" "}
            <span className="font-semibold text-[#1f1b16]">
              {new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(
                new Date(project.updatedAt),
              )}
            </span>
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      <Card className="border-[#e1d7cb] bg-white/90 shadow-[0_30px_80px_-50px_rgba(40,30,20,0.45)]">
        <CardContent className="space-y-5 p-6">
          <SectionHeader
            icon={<FiLayers className="h-5 w-5" />}
            title="Podstawy"
            hint="Nazwa, kategoria, cel i opis"
          />
          <div className="flex flex-wrap gap-2">
            {infoChips.map((chip) => (
              <span key={chip.label} className={chipClass}>
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#8a7762]">
                  {chip.label}
                </span>
                <span className="font-semibold text-[#2a241f]">{chip.value}</span>
              </span>
            ))}
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                Nazwa projektu
              </label>
              {editing ? (
                <Input value={form.name} onChange={(e) => setField("name")(e.target.value)} />
              ) : (
                <p className="text-lg font-semibold text-[#1f1b16]">
                  {project.name || "Brak nazwy"}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                Nazwa handlowa
              </label>
              {editing ? (
                <Input
                  value={form.tradeName}
                  onChange={(e) => setField("tradeName")(e.target.value)}
                />
              ) : (
                <p className="text-lg font-semibold text-[#1f1b16]">
                  {project.tradeName || "Brak nazwy handlowej"}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                Kategoria
              </label>
              {editing ? (
                <Input
                  value={form.category}
                  onChange={(e) => setField("category")(e.target.value)}
                />
              ) : (
                <p className="text-sm text-[#5b5044]">{project.category || "Brak kategorii"}</p>
              )}
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                Cel
              </label>
              {editing ? (
                <Input value={form.goal} onChange={(e) => setField("goal")(e.target.value)} />
              ) : (
                <p className="text-sm text-[#5b5044]">{project.goal || "Brak celu"}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
              Uzasadnienie
            </label>
            {editing ? (
              <textarea
                className={textareaClass}
                rows={3}
                value={form.justification}
                onChange={(e) => setField("justification")(e.target.value)}
              />
            ) : (
              <p className="text-sm text-[#5b5044]">
                {project.justification || "Brak uzasadnienia"}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
              Opis / Outcome
            </label>
            {editing ? (
              <textarea
                className={textareaClass}
                rows={4}
                value={form.outcome}
                onChange={(e) => setField("outcome")(e.target.value)}
              />
            ) : (
              <p className="text-sm text-[#5b5044]">{project.description || "Brak opisu"}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e1d7cb] bg-white/90 shadow-[0_30px_80px_-50px_rgba(40,30,20,0.45)]">
        <CardContent className="space-y-6 p-6">
          <SectionHeader
            icon={<FiTrendingUp className="h-5 w-5" />}
            title="Strategia i postępy"
            hint="MVP, KPI, kamienie milowe, szanse i ryzyka"
            accent="bg-[#eef4ff] text-[#1c2a4a] border-[#d9e4ff]"
          />
          {[
            { key: "mvp", label: "MVP", icon: <FiZap className="h-4 w-4 text-[#d97706]" /> },
            {
              key: "kpis",
              label: "Kluczowe wskaźniki",
              icon: <FiTrendingUp className="h-4 w-4 text-[#2563eb]" />,
            },
            {
              key: "milestones",
              label: "Kamienie milowe",
              icon: <FiFlag className="h-4 w-4 text-[#7c3aed]" />,
            },
            {
              key: "chances",
              label: "Szanse",
              icon: <FiCheckCircle className="h-4 w-4 text-[#059669]" />,
            },
            {
              key: "threats",
              label: "Ryzyka",
              icon: <FiAlertTriangle className="h-4 w-4 text-[#dc2626]" />,
            },
          ].map((item) => {
            const formValue = form[item.key as keyof FormState] as string;
            const projectValue = project[item.key as keyof typeof project] as
              | string[]
              | null
              | undefined;
            return (
              <div key={item.key} className="space-y-3 rounded-2xl border border-[#eadfd3] bg-white/70 p-4 shadow-[0_20px_60px_-45px_rgba(40,30,20,0.4)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1f1b16]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5eee2] text-[#6f5b4d]">
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                  <span className="text-[11px] text-[#8a7762]">
                    {editing ? "Wpisz po jednej pozycji w linii" : `${(projectValue || []).length} pozycji`}
                  </span>
                </div>
                {editing ? (
                  <textarea
                    className={textareaClass}
                    rows={3}
                    value={formValue}
                    onChange={(e) => setField(item.key as keyof FormState)(e.target.value)}
                  />
                ) : (
                  renderList(projectValue, "Brak elementów")
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-[#e1d7cb] bg-white/90 shadow-[0_30px_80px_-50px_rgba(40,30,20,0.45)]">
        <CardContent className="space-y-5 p-6">
          <SectionHeader
            icon={<FiUsers className="h-5 w-5" />}
            title="Zasoby i zakres"
            hint="Zaangażowanie ludzi, budżet i zakres"
            accent="bg-[#f0f7ff] text-[#1d2e40] border-[#d8e6f5]"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { key: "peopleHighAvailability", label: "Osoby (wysokie zaangażowanie)", icon: <FiUsers className="h-4 w-4 text-[#2563eb]" /> },
              { key: "peopleLowAvailability", label: "Osoby (niskie zaangażowanie)", icon: <FiUsers className="h-4 w-4 text-[#0ea5e9]" /> },
              { key: "budget", label: "Budżet (PLN)", icon: <FiShield className="h-4 w-4 text-[#16a34a]" /> },
            ].map((item) => {
              const value = form[item.key as keyof FormState] as string;
              const projectValue = project[item.key as keyof typeof project] as
                | number
                | null
                | undefined;
              return (
                <div
                  key={item.key}
                  className="rounded-2xl border border-[#e7ecf3] bg-white/80 p-4 shadow-[0_16px_40px_-35px_rgba(40,30,20,0.4)]"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1f1b16]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef4ff] text-[#2c4a76]">
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                  <div className="mt-3">
                    {editing ? (
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => setField(item.key as keyof FormState)(e.target.value)}
                      />
                    ) : (
                      <p className="text-lg font-semibold text-[#2a241f]">
                        {projectValue !== null && projectValue !== undefined ? projectValue : "—"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {[
              { key: "inScope", label: "Zakres w projekcie", icon: <FiCheckCircle className="h-4 w-4 text-[#16a34a]" /> },
              { key: "outScope", label: "Zakres poza projektem", icon: <FiAlertTriangle className="h-4 w-4 text-[#dc2626]" /> },
            ].map((item) => {
              const formValue = form[item.key as keyof FormState] as string;
              const projectValue = project[item.key as keyof typeof project] as
                | string[]
                | null
                | undefined;
              return (
                <div key={item.key} className="space-y-3 rounded-2xl border border-[#e7ecf3] bg-white/80 p-4 shadow-[0_16px_40px_-35px_rgba(40,30,20,0.4)]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1f1b16]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f8fafc] text-[#0f172a]">
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                  {editing ? (
                    <textarea
                      className={textareaClass}
                      rows={3}
                      value={formValue}
                      onChange={(e) => setField(item.key as keyof FormState)(e.target.value)}
                    />
                  ) : (
                    renderList(projectValue, "Brak elementów")
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
