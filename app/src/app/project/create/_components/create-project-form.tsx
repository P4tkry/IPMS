"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/i18n/useI18n";
import { buildManifestAspects } from "./manifest-aspects";
import StakeholdersStep from "./stakeholders-step";
import BasicStep from "./basic-step";
import BudgetStep from "./budget-step";
import CategoryStep from "./category-step";
import ChancesStep from "./chances-step";
import DirectionStep from "./direction-step";
import GoalStep from "./goal-step";
import JustificationStep from "./justification-step";
import KpiStep from "./kpi-step";
import MilestonesStep from "./milestones-step";
import MvpStep from "./mvp-step";
import OutcomeStep from "./outcome-step";
import PeopleStep from "./people-step";
import ResourcesStep from "./resources-step";
import ScopeStep from "./scope-step";
import TermsStep from "./terms-step";
import ThreatsStep from "./threats-step";
import VisionStep from "./vision-step";
import WrapupStep from "./wrapup-step";
import SummaryStep from "./summary-step";
import type { CreateProjectState } from "./use-create-project";
import type { StakeholderEntry } from "./types";

type CreateProjectFormProps = {
  project: CreateProjectState;
  onExit?: () => void;
  onRegisterStepSetter?: (
    setter: (
      step:
        | "name"
        | "category"
        | "vision"
        | "goal"
        | "outcome"
        | "stakeholders"
      | "justification"
      | "direction"
      | "mvp"
      | "scope"
      | "kpi"
      | "milestones"
      | "resources"
      | "chances"
      | "threats"
      | "terms"
      | "wrapup"
      | "people"
      | "budget"
      | "summary"
    ) => void,
  ) => void;
  onStepChange?: (
    step:
      | "name"
      | "category"
      | "vision"
      | "goal"
      | "outcome"
      | "stakeholders"
      | "justification"
      | "direction"
      | "mvp"
      | "scope"
      | "kpi"
      | "milestones"
      | "resources"
      | "chances"
      | "threats"
      | "terms"
      | "wrapup"
      | "people"
      | "budget"
      | "summary"
  ) => void;
  onDownloadCard?: () => void;
  isDownloading?: boolean;
};

export default function CreateProjectForm({
  project,
  onExit,
  onRegisterStepSetter,
  onStepChange,
  onDownloadCard,
  isDownloading,
}: CreateProjectFormProps) {
  const { t } = useI18n();
  const { error, form, handleCreateProject, patchProject, updateForm, lastSubmitted } = project;
  const aspects = buildManifestAspects(t);
  const aspectBySlug = Object.fromEntries(aspects.map((aspect) => [aspect.slug, aspect]));
  const buildStepContext = (stepKey: keyof typeof aspectBySlug | "scope") => {
    if (stepKey === "scope") {
      const inScope = aspectBySlug["scope-in"];
      const outScope = aspectBySlug["scope-out"];
      const parts = [
        inScope?.title,
        inScope?.question,
        ...(inScope?.expert.paragraphs ?? []),
        outScope?.title,
        outScope?.question,
        ...(outScope?.expert.paragraphs ?? []),
      ].filter(Boolean);
      return parts.join(" ");
    }
    const aspect = aspectBySlug[stepKey];
    if (!aspect) {
      return "";
    }
    const parts = [
      aspect.title,
      aspect.question,
      ...(aspect.expert.paragraphs ?? []),
      ...(aspect.expert.bullets ?? []),
    ].filter(Boolean);
    return parts.join(" ");
  };
  const [step, setStep] = useState<
    | "name"
    | "category"
    | "vision"
    | "goal"
    | "outcome"
    | "stakeholders"
    | "justification"
    | "direction"
    | "mvp"
    | "scope"
    | "kpi"
    | "milestones"
    | "resources"
    | "chances"
    | "threats"
    | "terms"
    | "wrapup"
    | "people"
    | "budget"
    | "summary"
  >("name");
  const [name, setName] = useState(form.name);
  const [category, setCategory] = useState(form.category);
  const [goal, setGoal] = useState(form.goal ?? "");
  const [justification, setJustification] = useState(form.justification);
  const [mvp, setMvp] = useState(form.mvp ?? []);
  const [kpis, setKpis] = useState(form.kpis ?? []);
  const [milestones, setMilestones] = useState(form.milestones ?? []);
  const [chances, setChances] = useState(form.chances ?? []);
  const [threats, setThreats] = useState(form.threats ?? []);
  const [terms, setTerms] = useState(form.terms ?? []);
  const [stakeholderEntries, setStakeholderEntries] = useState<StakeholderEntry[]>(
    form.stakeholderEntries ?? [],
  );
  const [outcome, setOutcome] = useState(form.outcome ?? "");
  const [inScope, setInScope] = useState(form.inScope ?? []);
  const [outScope, setOutScope] = useState(form.outScope ?? []);
  const [peopleHighAvailability, setPeopleHighAvailability] = useState(
    form.peopleHighAvailability ?? 0,
  );
  const [peopleLowAvailability, setPeopleLowAvailability] = useState(
    form.peopleLowAvailability ?? 0,
  );
  const [budget, setBudget] = useState(form.budget ?? 0);
  const [isNextLoading, setIsNextLoading] = useState(false);

  useEffect(() => {
    setName(form.name ?? "");
    setCategory(form.category ?? "");
    setGoal(form.goal ?? "");
    setJustification(form.justification ?? "");
    setMvp(form.mvp ?? []);
    setKpis(form.kpis ?? []);
    setMilestones(form.milestones ?? []);
    setChances(form.chances ?? []);
    setThreats(form.threats ?? []);
    setTerms(form.terms ?? []);
    setStakeholderEntries(form.stakeholderEntries ?? []);
    setOutcome(form.outcome ?? "");
    setInScope(form.inScope ?? []);
    setOutScope(form.outScope ?? []);
    setPeopleHighAvailability(form.peopleHighAvailability ?? 0);
    setPeopleLowAvailability(form.peopleLowAvailability ?? 0);
    setBudget(form.budget ?? 0);
  }, [form]);

  useEffect(() => {
    onStepChange?.(step);
  }, [onStepChange, step]);

  useEffect(() => {
    onRegisterStepSetter?.(setStep);
  }, [onRegisterStepSetter]);

  const runNext = async (action: () => Promise<void>) => {
    setIsNextLoading(true);
    try {
      await action();
    } finally {
      setIsNextLoading(false);
    }
  };

  const handleNameNext = (nextName: string) =>
    runNext(async () => {
      updateForm({ name: nextName });
      setName(nextName);
      await patchProject({ name: nextName });
      setStep("category");
    });

  const handleCategoryNext = (nextCategory: string) =>
    runNext(async () => {
      updateForm({ category: nextCategory });
      setCategory(nextCategory);
      await patchProject({ category: nextCategory });
      setStep("vision");
    });
  const handleCategoryBack = () => {
    setStep("name");
  };

  const handleVisionNext = () =>
    runNext(async () => {
      await patchProject({});
      setStep("goal");
    });
  const handleVisionBack = () => {
    setStep("category");
  };

  const handleGoalNext = (nextGoal: string) =>
    runNext(async () => {
      updateForm({ goal: nextGoal });
      setGoal(nextGoal);
      await patchProject({ goal: nextGoal });
      setStep("outcome");
    });
  const handleGoalBack = () => {
    setStep("vision");
  };

  const handleOutcomeNext = (nextOutcome: string) =>
    runNext(async () => {
      updateForm({ outcome: nextOutcome });
      setOutcome(nextOutcome);
      await patchProject({ outcome: nextOutcome });
      setStep("stakeholders");
    });
  const handleOutcomeBack = () => {
    setStep("goal");
  };

  const handleStakeholdersNext = (values: { stakeholderEntries: StakeholderEntry[] }) =>
    runNext(async () => {
      updateForm(values);
      setStakeholderEntries(values.stakeholderEntries);
      await patchProject({ stakeholderEntries: values.stakeholderEntries });
      setStep("justification");
    });
  const handleStakeholdersBack = () => {
    setStep("outcome");
  };

  const handleJustificationNext = (nextJustification: string) =>
    runNext(async () => {
      updateForm({ justification: nextJustification });
      setJustification(nextJustification);
      await patchProject({ justification: nextJustification });
      setStep("direction");
    });
  const handleJustificationBack = () => {
    setStep("stakeholders");
  };
  const handleDirectionNext = () =>
    runNext(async () => {
      await patchProject({});
      setStep("mvp");
    });
  const handleDirectionBack = () => {
    setStep("justification");
  };
  const handleMvpNext = (nextMvp: string[]) =>
    runNext(async () => {
      updateForm({ mvp: nextMvp });
      setMvp(nextMvp);
      await patchProject({ mvp: nextMvp });
      setStep("scope");
    });
  const handleMvpBack = () => {
    setStep("direction");
  };
  const handleScopeNext = (values: { inScope: string[]; outScope: string[] }) =>
    runNext(async () => {
      updateForm(values);
      setInScope(values.inScope);
      setOutScope(values.outScope);
      await patchProject({ inScope: values.inScope, outScope: values.outScope });
      setStep("kpi");
    });
  const handleScopeBack = () => {
    setStep("mvp");
  };
  const handleKpiNext = (nextKpis: string[]) =>
    runNext(async () => {
      updateForm({ kpis: nextKpis });
      setKpis(nextKpis);
      await patchProject({ kpis: nextKpis });
      setStep("milestones");
    });
  const handleKpiBack = () => {
    setStep("scope");
  };
  const handleMilestonesNext = (nextMilestones: string[]) =>
    runNext(async () => {
      updateForm({ milestones: nextMilestones });
      setMilestones(nextMilestones);
      await patchProject({ milestones: nextMilestones });
      setStep("resources");
    });
  const handleMilestonesBack = () => {
    setStep("kpi");
  };
  const handleResourcesNext = () =>
    runNext(async () => {
      await patchProject({});
      setStep("people");
    });
  const handleResourcesBack = () => {
    setStep("milestones");
  };

  const handlePeopleNext = (values: {
    peopleHighAvailability: number;
    peopleLowAvailability: number;
  }) =>
    runNext(async () => {
      updateForm(values);
      setPeopleHighAvailability(values.peopleHighAvailability);
      setPeopleLowAvailability(values.peopleLowAvailability);
      await patchProject({
        peopleHighAvailability: values.peopleHighAvailability,
        peopleLowAvailability: values.peopleLowAvailability,
      });
      setStep("budget");
    });
  const handlePeopleBack = () => {
    setStep("resources");
  };

  const handleBudgetNext = (nextBudget: number) =>
    runNext(async () => {
      updateForm({ budget: nextBudget });
      setBudget(nextBudget);
      await patchProject({ budget: nextBudget });
      setStep("wrapup");
    });
  const handleBudgetBack = () => {
    setStep("people");
  };

  const handleWrapupNext = () =>
    runNext(async () => {
      await patchProject({});
      setStep("chances");
    });
  const handleWrapupBack = () => {
    setStep("budget");
  };

  const handleChancesNext = (nextChances: string[]) =>
    runNext(async () => {
      updateForm({ chances: nextChances });
      setChances(nextChances);
      await patchProject({ chances: nextChances });
      setStep("threats");
    });
  const handleChancesBack = () => {
    setStep("wrapup");
  };
  const handleThreatsNext = (nextThreats: string[]) =>
    runNext(async () => {
      updateForm({ threats: nextThreats });
      setThreats(nextThreats);
      await patchProject({ threats: nextThreats });
      setStep("terms");
    });
  const handleThreatsBack = () => {
    setStep("chances");
  };
  const handleTermsNext = (nextTerms: { date: string; description: string }[]) =>
    runNext(async () => {
      updateForm({ terms: nextTerms });
      setTerms(nextTerms);
      await patchProject({ terms: nextTerms });
      setStep("summary");
    });
  const handleTermsBack = () => {
    setStep("threats");
  };

  const handleSummaryBack = () => {
    setStep("terms");
  };

  const handleFinalSubmit = async () => {
    await handleCreateProject({
      name,
      category,
      goal,
      justification,
      mvp,
      kpis,
      milestones,
      chances,
      threats,
      terms,
      stakeholderEntries,
      outcome,
      inScope,
      outScope,
      peopleHighAvailability,
      peopleLowAvailability,
      budget,
    });
  };

  const handleSummaryConfirm = () => runNext(handleFinalSubmit);

  const stepsOrder = [
    "name",
    "category",
    "vision",
    "goal",
    "outcome",
    "stakeholders",
    "justification",
    "direction",
    "mvp",
    "scope",
    "kpi",
    "milestones",
    "resources",
    "people",
    "budget",
    "wrapup",
    "chances",
    "threats",
    "terms",
    "summary",
  ] as const;
  const totalSteps = stepsOrder.length;
  const currentIndex = Math.max(0, stepsOrder.indexOf(step));
  const progressValue = ((currentIndex + 1) / totalSteps) * 100;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] shadow-[0_16px_40px_-35px_rgba(60,40,20,0.45)]">
        <div className="border-b border-[#eadfd3] bg-white/70 px-5 py-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d7b68]">
            <span>{t("project.create.progress.label")}</span>
            <span>
              {currentIndex + 1}/{totalSteps}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#efe6dc]">
            <div
              className="h-full rounded-full bg-[#2a241f] transition-[width] duration-300 ease-out"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
        <AnimatePresence mode="wait">
          {step === "name" ? (
            <motion.div
              key="name"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <BasicStep
                project={project}
                onNext={handleNameNext}
                onUpdate={(value) => updateForm({ name: value })}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "category" ? (
            <motion.div
              key="category"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <CategoryStep
                initialCategory={form.category || ""}
                onNext={handleCategoryNext}
                onBack={handleCategoryBack}
                onUpdate={(value) => updateForm({ category: value })}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "vision" ? (
            <motion.div
              key="vision"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <VisionStep
                onNext={handleVisionNext}
                onBack={handleVisionBack}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "goal" ? (
            <motion.div
              key="goal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <GoalStep
                initialGoal={form.goal ?? ""}
                onNext={handleGoalNext}
                onBack={handleGoalBack}
                onUpdate={(value) => updateForm({ goal: value })}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "outcome" ? (
            <motion.div
              key="outcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <OutcomeStep
                initialOutcome={form.outcome || ""}
                isSubmitting={false}
                onSubmit={async (values) => handleOutcomeNext(values.outcome)}
                onBack={handleOutcomeBack}
                onUpdate={(value) => updateForm({ outcome: value })}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "stakeholders" ? (
            <motion.div
              key="stakeholders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <StakeholdersStep
                initialEntries={form.stakeholderEntries ?? []}
                onNext={handleStakeholdersNext}
                onBack={handleStakeholdersBack}
                onUpdate={(values) => updateForm(values)}
                isNextLoading={isNextLoading}
                projectId={project.projectId}
                projectContext={project.buildProjectContext()}
                stepContext={buildStepContext("stakeholders")}
              />
            </motion.div>
          ) : null}
          {step === "justification" ? (
            <motion.div
              key="justification"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <JustificationStep
                initialJustification={form.justification || ""}
                onNext={handleJustificationNext}
                onBack={handleJustificationBack}
                onUpdate={(value) => updateForm({ justification: value })}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "direction" ? (
            <motion.div
              key="direction"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <DirectionStep
                onNext={handleDirectionNext}
                onBack={handleDirectionBack}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "mvp" ? (
            <motion.div
              key="mvp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <MvpStep
                initialMvp={form.mvp ?? []}
                projectId={project.projectId}
                projectContext={project.buildProjectContext()}
                stepContext={buildStepContext("mvp")}
                onNext={handleMvpNext}
                onBack={handleMvpBack}
                onUpdate={(value) => updateForm({ mvp: value })}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "scope" ? (
            <motion.div
              key="scope"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ScopeStep
                initialInScope={form.inScope ?? []}
                initialOutScope={form.outScope ?? []}
                projectId={project.projectId}
                projectContext={project.buildProjectContext()}
                stepContext={buildStepContext("scope")}
                onNext={handleScopeNext}
                onBack={handleScopeBack}
                onUpdate={(values) => updateForm(values)}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "kpi" ? (
            <motion.div
              key="kpi"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <KpiStep
                initialKpis={form.kpis ?? []}
                projectId={project.projectId}
                projectContext={project.buildProjectContext()}
                stepContext={buildStepContext("kpi")}
                onNext={handleKpiNext}
                onBack={handleKpiBack}
                onUpdate={(value) => updateForm({ kpis: value })}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "milestones" ? (
            <motion.div
              key="milestones"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <MilestonesStep
                initialMilestones={form.milestones ?? []}
                projectId={project.projectId}
                projectContext={project.buildProjectContext()}
                stepContext={buildStepContext("milestones")}
                onNext={handleMilestonesNext}
                onBack={handleMilestonesBack}
                onUpdate={(value) => updateForm({ milestones: value })}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "resources" ? (
            <motion.div
              key="resources"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ResourcesStep
                onNext={handleResourcesNext}
                onBack={handleResourcesBack}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "chances" ? (
            <motion.div
              key="chances"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ChancesStep
                initialChances={form.chances ?? []}
                projectId={project.projectId}
                projectContext={project.buildProjectContext()}
                stepContext={buildStepContext("chances")}
                onNext={handleChancesNext}
                onBack={handleChancesBack}
                onUpdate={(value) => updateForm({ chances: value })}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "threats" ? (
            <motion.div
              key="threats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ThreatsStep
                initialThreats={form.threats ?? []}
                projectId={project.projectId}
                projectContext={project.buildProjectContext()}
                stepContext={buildStepContext("threats")}
                onNext={handleThreatsNext}
                onBack={handleThreatsBack}
                onUpdate={(value) => updateForm({ threats: value })}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "terms" ? (
            <motion.div
              key="terms"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <TermsStep
                initialTerms={form.terms ?? []}
                onNext={handleTermsNext}
                onBack={handleTermsBack}
                onUpdate={(value) => updateForm({ terms: value })}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "summary" ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
                <SummaryStep
                  values={{
                    name,
                    category,
                    goal,
                  justification,
                  mvp,
                  kpis,
                  milestones,
                  chances,
                  threats,
                  terms,
                  stakeholderEntries,
                  outcome,
                  inScope,
                  outScope,
                  peopleHighAvailability,
                  peopleLowAvailability,
                  budget,
                }}
                onBack={handleSummaryBack}
                onConfirm={handleSummaryConfirm}
                isConfirmLoading={isNextLoading}
                onDownloadCard={lastSubmitted && onDownloadCard ? onDownloadCard : undefined}
                isDownloading={isDownloading}
              />
            </motion.div>
          ) : null}
          {step === "budget" ? (
            <motion.div
              key="budget"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <BudgetStep
                initialBudget={form.budget ?? 0}
                onNext={handleBudgetNext}
                onBack={handleBudgetBack}
                onUpdate={(value) => updateForm({ budget: value })}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "wrapup" ? (
            <motion.div
              key="wrapup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <WrapupStep
                onNext={handleWrapupNext}
                onBack={handleWrapupBack}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
          {step === "people" ? (
            <motion.div
              key="people"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <PeopleStep
                initialHigh={form.peopleHighAvailability ?? 0}
                initialLow={form.peopleLowAvailability ?? 0}
                onNext={handlePeopleNext}
                onBack={handlePeopleBack}
                onUpdate={(values) => updateForm(values)}
                isNextLoading={isNextLoading}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
