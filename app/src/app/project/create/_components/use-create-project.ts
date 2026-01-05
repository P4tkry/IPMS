"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/i18n/useI18n";
import type { ProjectPayload, StakeholderEntry } from "./types";

export type CreateProjectState = {
  isLoading: boolean;
  canCreate: boolean;
  error: string | null;
  success: string | null;
  isSubmitting: boolean;
  isCreatingDraft: boolean;
  createdProjectId: string | null;
  projectId: string | null;
  lastSubmitted: ProjectPayload | null;
  form: ProjectPayload;
  updateForm: (patch: Partial<ProjectPayload>) => void;
  buildAssistantContext: (step: string) => string;
  buildProjectContext: () => string;
  patchProject: (patch: Partial<ProjectPayload>) => Promise<void>;
  loadExistingProject: (args: {
    projectId: string;
    currentUserId?: string | null;
    requireLeader?: boolean;
  }) => Promise<boolean>;
  handleCreateProject: (values: ProjectPayload) => Promise<void>;
  handleCreateDraft: () => Promise<void>;
};

const validateRequired = (value: string, message: string) => {
  if (!value) {
    return message;
  }
  return null;
};

const validateNumberRequired = (value: number | undefined, message: string) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return message;
  }
  return null;
};

const createEmptyStakeholderEntries = (): StakeholderEntry[] => [];

const normalizeStakeholderEntries = (entries?: StakeholderEntry[]) => {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries
    .map((entry) => ({
      name: entry.name?.trim() || "",
      interest:
        typeof entry.interest === "number" && !Number.isNaN(entry.interest)
          ? entry.interest
          : 0,
      power:
        typeof entry.power === "number" && !Number.isNaN(entry.power) ? entry.power : 0,
    }))
    .filter((entry) => entry.name.length > 0);
};

const normalizeStringList = (items?: string[]) => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => item.trim()).filter(Boolean);
};

const normalizeNumber = (value: unknown, fallback = 0) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return value;
};

export function useCreateProject(): CreateProjectState {
  const router = useRouter();
  const { t } = useI18n();
  const { data: session, isPending } = authClient.useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<ProjectPayload | null>(null);
  const [form, setForm] = useState<ProjectPayload>({
    name: "",
    category: "",
    goal: "",
    justification: "",
    mvp: [],
    kpis: [],
    milestones: [],
    chances: [],
    threats: [],
    terms: [],
    stakeholderEntries: createEmptyStakeholderEntries(),
    inScope: [],
    outScope: [],
    peopleHighAvailability: 0,
    peopleLowAvailability: 0,
    budget: 0,
    outcome: "",
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
      return;
    }
    if (!session?.user) {
      return;
    }
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/settings");
        const payload = await response.json();
        if (!response.ok) {
          setError(payload?.message || t("project.create.errors.permissions"));
          return;
        }
        const permissions = payload?.user?.permissions || [];
        const allowed = permissions.includes("CREATE_ALL_PROJECTS");
        setCanCreate(allowed);
        if (!allowed) {
          router.replace("/dashboard");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("project.create.errors.permissions");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isPending, router, session?.user, t]);

  const handleCreateDraft = async () => {
    setError(null);
    setSuccess(null);
    setIsCreatingDraft(true);
    try {
      const response = await fetch("/api/project/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.message || t("project.create.errors.create"));
        return;
      }
      const draftId = payload?.project?.id || null;
      setProjectId(draftId);
      setCreatedProjectId(draftId);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("project.create.errors.create");
      setError(message);
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const updateForm = (patch: Partial<ProjectPayload>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const buildProjectUpdatePayload = (patch: Partial<ProjectPayload>) => {
    const payload: Record<string, unknown> = {};

    if ("name" in patch) {
      const name = patch.name?.trim();
      if (name) {
        payload.name = name;
      }
    }

    if ("category" in patch) {
      const category = patch.category?.trim();
      if (category) {
        payload.category = category;
      }
    }

    if ("goal" in patch) {
      const goal = patch.goal?.trim();
      if (goal) {
        payload.goal = goal;
      }
    }

    if ("justification" in patch) {
      const justification = patch.justification?.trim();
      if (justification) {
        payload.justification = justification;
      }
    }

    if ("stakeholderEntries" in patch) {
      payload.stakeholderEntries = normalizeStakeholderEntries(patch.stakeholderEntries);
    }

    if ("mvp" in patch) {
      payload.mvp = normalizeStringList(patch.mvp);
    }

    if ("kpis" in patch) {
      payload.kpis = normalizeStringList(patch.kpis);
    }

    if ("milestones" in patch) {
      payload.milestones = normalizeStringList(patch.milestones);
    }

    if ("chances" in patch) {
      payload.chances = normalizeStringList(patch.chances);
    }

    if ("threats" in patch) {
      payload.threats = normalizeStringList(patch.threats);
    }

    if ("terms" in patch) {
      payload.terms = Array.isArray(patch.terms)
        ? patch.terms
            .map((item) => ({
              date: item?.date?.trim() || "",
              description: item?.description?.trim() || "",
            }))
            .filter((item) => item.date.length > 0 && item.description.length > 0)
        : [];
    }

    if ("inScope" in patch) {
      payload.inScope = normalizeStringList(patch.inScope);
    }

    if ("outScope" in patch) {
      payload.outScope = normalizeStringList(patch.outScope);
    }

    if ("peopleHighAvailability" in patch) {
      payload.peopleHighAvailability = patch.peopleHighAvailability ?? 0;
    }

    if ("peopleLowAvailability" in patch) {
      payload.peopleLowAvailability = patch.peopleLowAvailability ?? 0;
    }

    if ("budget" in patch) {
      payload.budget = patch.budget ?? 0;
    }

    if ("outcome" in patch) {
      const description = patch.outcome?.trim();
      if (description) {
        payload.description = description;
      }
    }

    return payload;
  };

  const patchProject = async (patch: Partial<ProjectPayload>) => {
    if (!projectId) {
      return;
    }
    setError(null);
    setSuccess(null);
    const payload = buildProjectUpdatePayload(patch);
    if (!("isDraft" in payload)) {
      payload.isDraft = true;
    }
    try {
      const response = await fetch(`/api/project/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = await response.json();
      if (!response.ok) {
        setError(responsePayload?.message || t("project.create.errors.create"));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("project.create.errors.create");
      setError(message);
    }
  };

  const loadExistingProject = async ({
    projectId: nextProjectId,
    currentUserId,
    requireLeader = true,
  }: {
    projectId: string;
    currentUserId?: string | null;
    requireLeader?: boolean;
  }) => {
    if (!nextProjectId) {
      return false;
    }
    if (requireLeader && !currentUserId) {
      return false;
    }
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/project/${nextProjectId}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.message || t("project.create.errors.create"));
        return false;
      }
      const projectData = payload?.project;
      if (!projectData) {
        return false;
      }
      if (
        requireLeader &&
        currentUserId &&
        typeof projectData.leaderId === "string" &&
        projectData.leaderId !== currentUserId
      ) {
        return false;
      }
      setProjectId(projectData.id ?? nextProjectId);
      setForm({
        name: projectData.name ?? "",
        category: projectData.category ?? "",
        goal: projectData.goal ?? "",
        justification: projectData.justification ?? "",
        mvp: normalizeStringList(projectData.mvp),
        kpis: normalizeStringList(projectData.kpis),
        milestones: normalizeStringList(projectData.milestones),
        chances: normalizeStringList(projectData.chances),
        threats: normalizeStringList(projectData.threats),
        terms: Array.isArray(projectData.terms)
          ? projectData.terms
              .map((item) => ({
                date: typeof item?.date === "string" ? item.date.trim() : "",
                description:
                  typeof item?.description === "string"
                    ? item.description.trim()
                    : "",
              }))
              .filter((item) => item.date.length > 0 && item.description.length > 0)
          : [],
        stakeholderEntries: normalizeStakeholderEntries(projectData.stakeholderEntries),
        inScope: normalizeStringList(projectData.inScope),
        outScope: normalizeStringList(projectData.outScope),
        peopleHighAvailability: normalizeNumber(projectData.peopleHighAvailability, 0),
        peopleLowAvailability: normalizeNumber(projectData.peopleLowAvailability, 0),
        budget: normalizeNumber(projectData.budget, 0),
        outcome: projectData.description ?? "",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : t("project.create.errors.create");
      setError(message);
      return false;
    }
  };

  const handleCreateProject = async (values: ProjectPayload) => {
    setError(null);
    setSuccess(null);
    const name = values.name?.trim() || "";
    const category = values.category?.trim() || "";
    const goal = values.goal?.trim() || "";
    const justification = values.justification?.trim() || "";
    const mvp = Array.isArray(values.mvp)
      ? values.mvp.map((item) => item.trim()).filter(Boolean)
      : [];
    const kpis = Array.isArray(values.kpis)
      ? values.kpis.map((item) => item.trim()).filter(Boolean)
      : [];
    const milestones = Array.isArray(values.milestones)
      ? values.milestones.map((item) => item.trim()).filter(Boolean)
      : [];
    const chances = Array.isArray(values.chances)
      ? values.chances.map((item) => item.trim()).filter(Boolean)
      : [];
    const threats = Array.isArray(values.threats)
      ? values.threats.map((item) => item.trim()).filter(Boolean)
      : [];
    const terms = Array.isArray(values.terms)
      ? values.terms
          .map((item) => ({
            date: item?.date?.trim() || "",
            description: item?.description?.trim() || "",
          }))
          .filter((item) => item.date.length > 0 && item.description.length > 0)
      : [];
    const stakeholderEntries = normalizeStakeholderEntries(values.stakeholderEntries);
    const inScope = Array.isArray(values.inScope)
      ? values.inScope.map((item) => item.trim()).filter(Boolean)
      : [];
    const outScope = Array.isArray(values.outScope)
      ? values.outScope.map((item) => item.trim()).filter(Boolean)
      : [];
    const peopleHighAvailability = values.peopleHighAvailability;
    const peopleLowAvailability = values.peopleLowAvailability;
    const budget = values.budget;
    const outcome = values.outcome?.trim() || "";
    const validationMessages = [
      validateRequired(name, t("project.create.name.validation.required")),
      validateRequired(category, t("project.create.category.validation.required")),
      validateRequired(goal, t("project.create.goal.validation.required")),
      validateRequired(justification, t("project.create.justification.validation.required")),
      mvp.length === 0 ? t("project.create.mvp.validation.required") : null,
      kpis.length === 0 ? t("project.create.kpi.validation.required") : null,
      milestones.length === 0 ? t("project.create.milestones.validation.required") : null,
      chances.length === 0 ? t("project.create.chances.validation.required") : null,
      threats.length === 0 ? t("project.create.threats.validation.required") : null,
      terms.length === 0 ? t("project.create.terms.validation.required") : null,
      stakeholderEntries.length === 0 ? t("project.create.stakeholders.validation.required") : null,
      validateNumberRequired(
        peopleHighAvailability,
        t("project.create.people.validation.highRequired"),
      ),
      validateNumberRequired(
        peopleLowAvailability,
        t("project.create.people.validation.lowRequired"),
      ),
      validateNumberRequired(budget, t("project.create.budget.validation.required")),
      validateRequired(outcome, t("project.create.outcome.validation.required")),
    ].filter(Boolean);
    if (validationMessages.length > 0) {
      setError(validationMessages[0]);
      return;
    }

    setForm({
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
      inScope,
      outScope,
      peopleHighAvailability: peopleHighAvailability ?? 0,
      peopleLowAvailability: peopleLowAvailability ?? 0,
      budget: budget ?? 0,
      outcome,
    });
    setIsSubmitting(true);
    try {
      if (projectId) {
        const response = await fetch(`/api/project/${projectId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name || undefined,
            category: category || undefined,
            goal: goal || undefined,
            justification: justification || undefined,
            mvp,
            kpis,
            milestones,
            chances,
            threats,
            terms,
            stakeholderEntries,
            inScope,
            outScope,
            peopleHighAvailability,
            peopleLowAvailability,
            budget,
            description: outcome,
            isDraft: false,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          setError(payload?.message || t("project.create.errors.create"));
          return;
        }
        setCreatedProjectId(payload?.project?.id || projectId);
      } else {
        const createResponse = await fetch("/api/project/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        });
        const createdPayload = await createResponse.json();
        if (!createResponse.ok) {
          setError(createdPayload?.message || t("project.create.errors.create"));
          return;
        }
        const newId = createdPayload?.project?.id || null;
        if (!newId) {
          setError(t("project.create.errors.create"));
          return;
        }
        setProjectId(newId);
        const updateResponse = await fetch(`/api/project/${newId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name || undefined,
            category: category || undefined,
            goal: goal || undefined,
            justification: justification || undefined,
            mvp,
            kpis,
            milestones,
            chances,
            threats,
            terms,
            stakeholderEntries,
            inScope,
            outScope,
            peopleHighAvailability,
            peopleLowAvailability,
            budget,
            description: outcome,
            isDraft: false,
          }),
        });
        const updatePayload = await updateResponse.json();
        if (!updateResponse.ok) {
          setError(updatePayload?.message || t("project.create.errors.create"));
          return;
        }
        setCreatedProjectId(updatePayload?.project?.id || newId);
      }
      setSuccess(t("project.create.success.title"));
      setLastSubmitted({
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
        inScope,
        outScope,
        peopleHighAvailability: peopleHighAvailability ?? 0,
        peopleLowAvailability: peopleLowAvailability ?? 0,
        budget: budget ?? 0,
        outcome,
      });
      setForm({
        name: "",
        category: "",
        goal: "",
        justification: "",
        mvp: [],
        kpis: [],
        milestones: [],
        chances: [],
        threats: [],
        terms: [],
        stakeholderEntries: createEmptyStakeholderEntries(),
        inScope: [],
        outScope: [],
        peopleHighAvailability: 0,
        peopleLowAvailability: 0,
        budget: 0,
        outcome: "",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("project.create.errors.create");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isLoading,
    canCreate,
    error,
    success,
    isSubmitting,
    isCreatingDraft,
    createdProjectId,
    projectId,
    lastSubmitted,
    form,
    updateForm,
    buildAssistantContext: (step: string) => {
      const parts = [
        `${t("project.create.assistant.context.step")} ${step}.`,
        form.name ? `${t("project.create.assistant.context.name")} ${form.name}.` : null,
        form.category
          ? `${t("project.create.assistant.context.category")} ${form.category}.`
          : null,
        form.goal ? `${t("project.create.assistant.context.goal")} ${form.goal}.` : null,
        form.justification
          ? `${t("project.create.assistant.context.justification")} ${form.justification}.`
          : null,
        form.mvp && form.mvp.length > 0
          ? `${t("project.create.assistant.context.mvp")} ${form.mvp.join(", ")}.`
          : null,
        form.kpis && form.kpis.length > 0
          ? `${t("project.create.assistant.context.kpis")} ${form.kpis.join(", ")}.`
          : null,
        form.milestones && form.milestones.length > 0
          ? `${t("project.create.assistant.context.milestones")} ${form.milestones.join(", ")}.`
          : null,
        form.chances && form.chances.length > 0
          ? `${t("project.create.assistant.context.chances")} ${form.chances.join(", ")}.`
          : null,
        form.threats && form.threats.length > 0
          ? `${t("project.create.assistant.context.threats")} ${form.threats.join(", ")}.`
          : null,
        form.terms && form.terms.length > 0
          ? `${t("project.create.assistant.context.terms")} ${form.terms
              .map((term) => `${term.date} - ${term.description}`)
              .join("; ")}.`
          : null,
        form.stakeholderEntries && form.stakeholderEntries.length > 0
          ? `${t("project.create.assistant.context.stakeholders")} ${form.stakeholderEntries
              .map(
                (entry) =>
                  `${entry.name} (${t("project.create.assistant.context.interest")} ${entry.interest}/10, ${t("project.create.assistant.context.power")} ${entry.power}/10)`,
              )
              .join("; ")}.`
          : null,
        form.inScope && form.inScope.length > 0
          ? `${t("project.create.assistant.context.inScope")} ${form.inScope.join(", ")}.`
          : null,
        form.outScope && form.outScope.length > 0
          ? `${t("project.create.assistant.context.outScope")} ${form.outScope.join(", ")}.`
          : null,
        typeof form.peopleHighAvailability === "number"
          ? `${t("project.create.assistant.context.highAvailability")} ${form.peopleHighAvailability}.`
          : null,
        typeof form.peopleLowAvailability === "number"
          ? `${t("project.create.assistant.context.lowAvailability")} ${form.peopleLowAvailability}.`
          : null,
        typeof form.budget === "number"
          ? `${t("project.create.assistant.context.budget")} ${form.budget}.`
          : null,
        form.outcome
          ? `${t("project.create.assistant.context.outcome")} ${form.outcome}.`
          : null,
      ].filter(Boolean);
      return parts.join(" ");
    },
    buildProjectContext: () => {
      const parts = [
        form.name ? `${t("project.create.assistant.context.name")} ${form.name}.` : null,
        form.category
          ? `${t("project.create.assistant.context.category")} ${form.category}.`
          : null,
        form.goal ? `${t("project.create.assistant.context.goal")} ${form.goal}.` : null,
        form.justification
          ? `${t("project.create.assistant.context.justification")} ${form.justification}.`
          : null,
        form.mvp && form.mvp.length > 0
          ? `${t("project.create.assistant.context.mvp")} ${form.mvp.join(", ")}.`
          : null,
        form.kpis && form.kpis.length > 0
          ? `${t("project.create.assistant.context.kpis")} ${form.kpis.join(", ")}.`
          : null,
        form.milestones && form.milestones.length > 0
          ? `${t("project.create.assistant.context.milestones")} ${form.milestones.join(", ")}.`
          : null,
        form.chances && form.chances.length > 0
          ? `${t("project.create.assistant.context.chances")} ${form.chances.join(", ")}.`
          : null,
        form.threats && form.threats.length > 0
          ? `${t("project.create.assistant.context.threats")} ${form.threats.join(", ")}.`
          : null,
        form.terms && form.terms.length > 0
          ? `${t("project.create.assistant.context.terms")} ${form.terms
              .map((term) => `${term.date} - ${term.description}`)
              .join("; ")}.`
          : null,
        form.stakeholderEntries && form.stakeholderEntries.length > 0
          ? `${t("project.create.assistant.context.stakeholders")} ${form.stakeholderEntries
              .map(
                (entry) =>
                  `${entry.name} (${t("project.create.assistant.context.interest")} ${entry.interest}/10, ${t("project.create.assistant.context.power")} ${entry.power}/10)`,
              )
              .join("; ")}.`
          : null,
        form.inScope && form.inScope.length > 0
          ? `${t("project.create.assistant.context.inScope")} ${form.inScope.join(", ")}.`
          : null,
        form.outScope && form.outScope.length > 0
          ? `${t("project.create.assistant.context.outScope")} ${form.outScope.join(", ")}.`
          : null,
        typeof form.peopleHighAvailability === "number"
          ? `${t("project.create.assistant.context.highAvailability")} ${form.peopleHighAvailability}.`
          : null,
        typeof form.peopleLowAvailability === "number"
          ? `${t("project.create.assistant.context.lowAvailability")} ${form.peopleLowAvailability}.`
          : null,
        typeof form.budget === "number"
          ? `${t("project.create.assistant.context.budget")} ${form.budget}.`
          : null,
        form.outcome
          ? `${t("project.create.assistant.context.outcome")} ${form.outcome}.`
          : null,
      ].filter(Boolean);
      return parts.join(" ");
    },
    patchProject,
    loadExistingProject,
    handleCreateProject,
    handleCreateDraft,
  };
}
