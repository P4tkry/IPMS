"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiAlertCircle,
  FiClock,
  FiCompass,
  FiLayers,
  FiShield,
  FiStar,
  FiTarget,
  FiUsers,
} from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CreateProjectForm from "./create-project-form";
import AssistantChat from "./assistant-chat";
import { ProjectCreatePdfDocument, type ProjectCreatePdfStrings } from "./project-create-pdf";
import { ProjectCardPdfDocument } from "./project-card-pdf";
import { buildManifestAspects } from "./manifest-aspects";
import { useI18n } from "@/i18n/useI18n";
import { useCreateProject } from "./use-create-project";
import { authClient } from "@/lib/auth-client";

declare global {
  interface Window {
    devboard?: () => void;
  }
}

export function CreateProjectView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [introStep, setIntroStep] = useState(0);
  const [showDevboard, setShowDevboard] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [formStep, setFormStep] = useState<
    | "name"
    | "category"
    | "vision"
    | "goal"
    | "justification"
    | "direction"
    | "mvp"
    | "kpi"
    | "milestones"
    | "resources"
    | "chances"
    | "threats"
    | "terms"
    | "wrapup"
    | "stakeholders"
    | "scope"
    | "people"
    | "budget"
    | "outcome"
    | "summary"
  >("name");
  const formStepSetterRef = useRef<((step: typeof formStep) => void) | null>(null);
  const project = useCreateProject();
  const {
    isLoading,
    canCreate,
    success,
    createdProjectId,
    isCreatingDraft,
    handleCreateDraft,
    projectId,
    loadExistingProject,
    lastSubmitted,
  } = project;
  const { data: session, isPending } = authClient.useSession();
  const hydratedProjectIdRef = useRef<string | null>(null);

  const stepLabels: Record<string, string> = {
    name: t("project.create.steps.name"),
    category: t("project.create.steps.category"),
    vision: t("project.create.steps.vision"),
    goal: t("project.create.steps.goal"),
    justification: t("project.create.steps.justification"),
    direction: t("project.create.steps.direction"),
    mvp: t("project.create.steps.mvp"),
    kpi: t("project.create.steps.kpi"),
    milestones: t("project.create.steps.milestones"),
    resources: t("project.create.steps.resources"),
    chances: t("project.create.steps.chances"),
    threats: t("project.create.steps.threats"),
    terms: t("project.create.steps.terms"),
    wrapup: t("project.create.steps.wrapup"),
    stakeholders: t("project.create.steps.stakeholders"),
    scope: t("project.create.steps.scope"),
    people: t("project.create.steps.people"),
    budget: t("project.create.steps.budget"),
    outcome: t("project.create.steps.outcome"),
    summary: t("project.create.summary.title"),
  };
  const devboardStages = [
    {
      key: "basics",
      label: t("project.create.print.sections.basics"),
      steps: ["name", "category"] as const,
    },
    {
      key: "vision",
      label: t("project.create.vision.title"),
      steps: ["vision", "goal", "outcome", "stakeholders", "justification"] as const,
    },
    {
      key: "direction",
      label: t("project.create.direction.title"),
      steps: ["direction", "mvp", "scope", "kpi", "milestones"] as const,
    },
    {
      key: "resources",
      label: t("project.create.resources.title"),
      steps: ["resources", "people", "budget"] as const,
    },
    {
      key: "wrapup",
      label: t("project.create.wrapup.title"),
      steps: ["wrapup", "chances", "threats", "terms", "summary"] as const,
    },
  ];
  const currentStepLabel =
    introStep === 0
      ? t("project.create.intro.start.label")
      : introStep === 1
        ? t("project.create.intro.criteria.label")
        : stepLabels[formStep] ?? t("project.create.steps.outcome");

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    window.devboard = () => {
      setShowDevboard(true);
    };
    return () => {
      delete window.devboard;
    };
  }, []);

  useEffect(() => {
    if (isPending || !session?.user) {
      return;
    }
    const queryProjectId = searchParams.get("project_id");
    if (!queryProjectId || hydratedProjectIdRef.current === queryProjectId) {
      return;
    }
    hydratedProjectIdRef.current = queryProjectId;
    loadExistingProject({
      projectId: queryProjectId,
      currentUserId: session.user.id,
      requireLeader: true,
    }).then((loaded) => {
      if (loaded) {
        setIntroStep(2);
      }
    });
  }, [isPending, loadExistingProject, searchParams, session?.user]);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    const currentProjectId = searchParams.get("project_id");
    if (currentProjectId === projectId) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("project_id", projectId);
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, projectId, router, searchParams]);

  const handleDownloadPdf = async () => {
    if (isDownloading) {
      return;
    }
    try {
      setIsDownloading(true);
      const { pdf } = await import("@react-pdf/renderer");
      const QRCode = await import("qrcode");
      const aspects = buildManifestAspects(t);
      const aspectsBySlug = Object.fromEntries(
        aspects.map((aspect) => [aspect.slug, aspect]),
      );
      const origin = window.location.origin;
      const qrEntries = await Promise.all(
        aspects.map(async (aspect) => {
          const url = `${origin}/manifest/aspect/${aspect.slug}`;
          const dataUrl = await QRCode.toDataURL(url, {
            margin: 0,
            width: 256,
            color: {
              dark: "#2a241f",
              light: "#ffffff",
            },
          });
          return [aspect.slug, dataUrl] as const;
        }),
      );
      const qrCodes = Object.fromEntries(qrEntries);
      const strings: ProjectCreatePdfStrings = {
        kicker: t("project.create.print.kicker"),
        title: t("project.create.print.title"),
        description: t("project.create.print.description"),
        subtitle: t("project.create.print.subtitle"),
        sections: {
          basics: t("project.create.print.sections.basics"),
          vision: t("project.create.print.sections.vision"),
          direction: t("project.create.print.sections.direction"),
          resources: t("project.create.print.sections.resources"),
          wrapup: t("project.create.print.sections.wrapup"),
        },
        stakeholdersMap: {
          axisPower: t("project.create.stakeholders.chart.axis.power"),
          axisInterest: t("project.create.stakeholders.chart.axis.interest"),
          quadrants: {
            highLow: t("project.create.stakeholders.chart.quadrants.highLow"),
            highHigh: t("project.create.stakeholders.chart.quadrants.highHigh"),
            lowLow: t("project.create.stakeholders.chart.quadrants.lowLow"),
            lowHigh: t("project.create.stakeholders.chart.quadrants.lowHigh"),
          },
        },
      };
      const blob = await pdf(
        <ProjectCreatePdfDocument
          strings={strings}
          aspects={aspectsBySlug}
          qrCodes={qrCodes}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "formularz-projektu.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadCardPdf = async () => {
    if (isDownloading || !lastSubmitted) {
      return;
    }
    try {
      setIsDownloading(true);
      const { pdf } = await import("@react-pdf/renderer");
        const strings = {
          kicker: t("project.create.print.kicker"),
          title: t("project.create.summary.title"),
          subtitle: t("project.create.success.subtitle"),
          sections: {
            basics: t("project.create.print.sections.basics"),
            vision: t("project.create.print.sections.vision"),
            direction: t("project.create.print.sections.direction"),
            resources: t("project.create.print.sections.resources"),
            wrapup: t("project.create.print.sections.wrapup"),
          },
          fields: {
            name: t("project.create.steps.name"),
            category: t("project.create.steps.category"),
            goal: t("project.create.steps.goal"),
            outcome: t("project.create.steps.outcome"),
            stakeholders: t("project.create.steps.stakeholders"),
            justification: t("project.create.steps.justification"),
            scopeIn: t("project.create.scope.inLabel"),
            scopeOut: t("project.create.scope.outLabel"),
            kpis: t("project.create.steps.kpi"),
            milestones: t("project.create.steps.milestones"),
            chances: t("project.create.steps.chances"),
            threats: t("project.create.steps.threats"),
            terms: t("project.create.steps.terms"),
            peopleHigh: t("project.create.people.highLabel"),
            peopleLow: t("project.create.people.lowLabel"),
            budget: t("project.create.steps.budget"),
          },
          stakeholdersMap: {
            axisPower: t("project.create.stakeholders.chart.axis.power"),
            axisInterest: t("project.create.stakeholders.chart.axis.interest"),
            quadrants: {
              highLow: t("project.create.stakeholders.chart.quadrants.highLow"),
              highHigh: t("project.create.stakeholders.chart.quadrants.highHigh"),
              lowLow: t("project.create.stakeholders.chart.quadrants.lowLow"),
              lowHigh: t("project.create.stakeholders.chart.quadrants.lowHigh"),
            },
          },
          empty: t("common.noData"),
        };
      const blob = await pdf(
        <ProjectCardPdfDocument values={lastSubmitted} strings={strings} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "karta-projektu.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-6rem)] px-6 text-[#2a241f]">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center gap-6 py-10">
        <Badge className="w-fit bg-[#2a241f] text-[#f6efe8] hover:bg-[#2a241f]">
          {t("project.create.badge")}
        </Badge>
        <h1 className="text-3xl font-semibold">{t("project.create.title")}</h1>
        <p className="text-sm text-[#6f6255]">{t("project.create.subtitle")}</p>
        <Card className="border-[#e2d6c9] bg-white/80 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.45)] backdrop-blur">
          <CardContent className="space-y-6 p-6">
            {isLoading ? <p className="text-sm text-[#6f6255]">{t("common.loading")}</p> : null}
            {!isLoading && !canCreate ? (
              <div className="rounded-lg border border-[#eadfd3] bg-[#f8f4ef] px-3 py-2 text-sm text-[#6f6255]">
                {t("project.create.noPermission")}
              </div>
            ) : null}
            {canCreate && success ? (
              <div className="rounded-2xl border border-[#eadfd3] bg-[#fdfbf7] px-6 py-8 text-center text-[#2a241f] shadow-[0_18px_50px_-35px_rgba(60,40,20,0.25)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8d7b68]">
                  {t("project.create.success.label")}
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#2a241f]">
                  {t("project.create.success.title")}
                </p>
                <p className="mt-2 text-sm text-[#6f6255]">
                  {t("project.create.success.subtitle")}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl border border-[#d7c8b7] bg-white px-6 text-sm text-[#2a241f]"
                    onClick={handleDownloadCardPdf}
                    disabled={!lastSubmitted || isDownloading}
                  >
                    {isDownloading
                      ? t("project.create.success.downloadingCard")
                      : t("project.create.success.downloadCard")}
                  </Button>
                  <Button
                    type="button"
                    className="h-12 rounded-2xl bg-[#2a241f] px-6 text-sm text-[#f6efe8] shadow-[0_16px_30px_-18px_rgba(42,36,31,0.35)] hover:bg-[#3a332c]"
                    onClick={() => {
                      if (createdProjectId) {
                        router.push(`/project/${createdProjectId}`);
                      }
                    }}
                    disabled={!createdProjectId}
                  >
                    {t("project.create.success.cta")}
                  </Button>
                </div>
              </div>
            ) : null}

            {canCreate && !success ? (
              <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                  {introStep === 0 ? (
                    <motion.div
                      key="intro"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="space-y-4 rounded-2xl border border-[#eadfd3] bg-white/80 p-6 text-[#2a241f] shadow-[0_18px_40px_-35px_rgba(40,30,20,0.35)]"
                    >
                      <div className="flex items-center gap-3 text-sm font-semibold text-[#2a241f]">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd3] bg-white text-[#6f6255]">
                          <FiCompass className="h-5 w-5" />
                        </span>
                        {t("project.create.intro.start.title")}
                      </div>
                      <p className="text-sm text-[#6f6255]">
                        {t("project.create.intro.start.line1")}
                      </p>
                      <p className="text-sm text-[#6f6255]">
                        {t("project.create.intro.start.line2")}
                      </p>
                      <p className="text-sm text-[#6f6255]">
                        {t("project.create.intro.start.line3")}
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-[#5b5044]">
                        <li>{t("project.create.intro.start.list.goal")}</li>
                        <li>{t("project.create.intro.start.list.scope")}</li>
                        <li>{t("project.create.intro.start.list.plan")}</li>
                      </ul>
                      <p className="text-sm text-[#6f6255]">
                        {t("project.create.intro.start.line4")}
                      </p>
                      <p className="text-sm text-[#6f6255]">
                        {t("project.create.intro.start.line5")}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 rounded-2xl border border-[#d7c8b7] bg-white px-6 text-sm text-[#2a241f]"
                          onClick={handleDownloadPdf}
                          disabled={isDownloading}
                        >
                          {isDownloading
                            ? t("project.create.intro.start.downloading")
                            : t("project.create.intro.start.download")}
                        </Button>
                        <Button
                          type="button"
                          className="h-12 rounded-2xl bg-[#2a241f] px-6 text-sm text-[#f6efe8] hover:bg-[#3a332c]"
                          onClick={() => {
                            setIntroStep(projectId ? 2 : 1);
                          }}
                        >
                          {t("common.next")}
                        </Button>
                      </div>
                    </motion.div>
                  ) : null}
                  {introStep === 1 ? (
                    <motion.div
                      key="requirements"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="space-y-5 rounded-2xl border border-[#eadfd3] bg-white/80 p-6 text-[#2a241f] shadow-[0_18px_40px_-35px_rgba(40,30,20,0.35)]"
                    >
                      <div className="flex items-center gap-3 text-sm font-semibold text-[#2a241f]">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
                          <FiAlertCircle className="h-5 w-5" />
                        </span>
                        {t("project.create.intro.criteria.title")}
                      </div>
                      <div className="rounded-2xl border border-[#e7dccf] bg-[#fcfaf7] px-4 py-3 text-sm text-[#5b5044]">
                        {t("project.create.intro.criteria.subtitle")}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {[
                          {
                            title: t("project.create.criteria.goal.title"),
                            icon: FiTarget,
                            color: "bg-emerald-50 text-emerald-700 border-emerald-200",
                            text: t("project.create.criteria.goal.text"),
                          },
                          {
                            title: t("project.create.criteria.time.title"),
                            icon: FiClock,
                            color: "bg-amber-50 text-amber-700 border-amber-200",
                            text: t("project.create.criteria.time.text"),
                          },
                          {
                            title: t("project.create.criteria.unique.title"),
                            icon: FiStar,
                            color: "bg-indigo-50 text-indigo-700 border-indigo-200",
                            text: t("project.create.criteria.unique.text"),
                          },
                          {
                            title: t("project.create.criteria.scope.title"),
                            icon: FiLayers,
                            color: "bg-sky-50 text-sky-700 border-sky-200",
                            text: t("project.create.criteria.scope.text"),
                          },
                          {
                            title: t("project.create.criteria.constraints.title"),
                            icon: FiShield,
                            color: "bg-rose-50 text-rose-700 border-rose-200",
                            text: t("project.create.criteria.constraints.text"),
                          },
                          {
                            title: t("project.create.criteria.team.title"),
                            icon: FiUsers,
                            color: "bg-orange-50 text-orange-700 border-orange-200",
                            text: t("project.create.criteria.team.text"),
                          },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.title}
                              className="rounded-2xl border border-[#eadfd3] bg-white px-4 py-4 shadow-[0_16px_40px_-32px_rgba(40,30,20,0.35)]"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`rounded-xl border px-2 py-2 ${item.color}`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-[#2a241f]">
                                    {item.title}
                                  </p>
                                  <p className="mt-2 text-xs text-[#5b5044]">
                                    {item.text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 rounded-2xl border border-[#d7c8b7] bg-white text-sm text-[#2a241f]"
                          onClick={() => setIntroStep(0)}
                        >
                          {t("common.back")}
                        </Button>
                        <Button
                          type="button"
                          className="h-12 rounded-2xl bg-[#2a241f] px-6 text-sm text-[#f6efe8] hover:bg-[#3a332c]"
                          onClick={async () => {
                            await handleCreateDraft();
                            setIntroStep(2);
                          }}
                          disabled={isCreatingDraft}
                        >
                          {isCreatingDraft
                            ? t("project.create.creatingDraft")
                            : t("project.create.createDraft")}
                        </Button>
                      </div>
                    </motion.div>
                  ) : null}
                  {introStep === 2 ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <CreateProjectForm
                        project={project}
                        onExit={() => setIntroStep(0)}
                        onStepChange={setFormStep}
                        onRegisterStepSetter={(setter) => {
                          formStepSetterRef.current = setter;
                        }}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
      {projectId ? (
        <AssistantChat
          projectId={projectId}
          context={currentStepLabel}
          contextData={project.buildAssistantContext(currentStepLabel)}
        />
      ) : null}
      {showDevboard ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDevboard(false)}
          />
          <div className="relative w-full max-w-3xl rounded-3xl border border-[#eadfd3] bg-white p-6 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                  Devboard
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#2a241f]">
                  Wybierz slajd
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-2xl border border-[#d7c8b7] bg-white px-4 text-sm text-[#2a241f]"
                onClick={() => setShowDevboard(false)}
              >
                Zamknij
              </Button>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_2fr]">
              <div className="rounded-2xl border border-[#eadfd3] bg-[#f8f4ef] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                  Intro
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {[
                    { key: "start", label: t("project.create.intro.start.label"), step: 0 },
                    { key: "criteria", label: t("project.create.intro.criteria.label"), step: 1 },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="rounded-2xl border border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#2a241f] transition hover:border-[#2a241f]"
                      onClick={() => {
                        setIntroStep(item.step);
                        setShowDevboard(false);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[#eadfd3] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                  Formularz
                </p>
                <div className="mt-3 space-y-4">
                  {devboardStages.map((stage) => (
                    <div key={stage.key}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                        {stage.label}
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {stage.steps.map((key) => (
                          <button
                            key={key}
                            type="button"
                            className="rounded-2xl border border-[#eadfd3] bg-[#f9f5f0] px-3 py-2 text-sm text-[#2a241f] transition hover:border-[#2a241f]"
                            onClick={() => {
                              setIntroStep(2);
                              formStepSetterRef.current?.(key as typeof formStep);
                              setShowDevboard(false);
                            }}
                          >
                            {stepLabels[key]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
