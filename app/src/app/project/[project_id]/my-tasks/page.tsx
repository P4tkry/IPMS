"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useProjectContext } from "../_components/project-context";

type TaskItem = {
  id: string;
  title: string;
  issueId: string;
  status: string;
  deadline: string | null;
};

type SprintGroup = {
  id: string;
  name: string;
  sprintNumber: number;
  startDate: string;
  endDate: string;
  tasks: TaskItem[];
};

const statusLabels: Record<string, string> = {
  TODO: "Do zrobienia",
  IN_PROGRESS: "W trakcie",
  BLOCKED: "Zablokowane",
  READY_FOR_REVIEW: "Do review",
  IN_REVIEW: "W review",
  DONE: "Zakonczone",
  REJECTED: "Odrzucone",
  CANCELLED: "Anulowane",
};

const statusBadge: Record<string, string> = {
  TODO: "bg-[#f8f4ef] text-[#5b5044] border border-[#eadfd3]",
  IN_PROGRESS: "bg-amber-50 text-amber-800 border border-amber-200",
  BLOCKED: "bg-rose-50 text-rose-800 border border-rose-200",
  READY_FOR_REVIEW: "bg-sky-50 text-sky-800 border border-sky-200",
  IN_REVIEW: "bg-indigo-50 text-indigo-800 border border-indigo-200",
  DONE: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-800 border border-rose-200",
  CANCELLED: "bg-stone-100 text-stone-700 border border-stone-200",
};

export default function ProjectMyTasksPage() {
  const project = useProjectContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sprint, setSprint] = useState<SprintGroup | null>(null);

  useEffect(() => {
    if (!project?.id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/project/${project.id}/my-tasks`);
        const payload = await response.json();
        if (!response.ok) {
          setError(payload?.message || "Nie udalo sie pobrac zadan.");
          setSprint(null);
          return;
        }
        setSprint(payload?.sprint ?? null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Nie udalo sie pobrac zadan.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [project?.id]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "short",
      }),
    [],
  );

  const showEmpty = !loading && !error && (!sprint || sprint.tasks.length === 0);

  return (
    <div className="relative px-6 text-[#2a241f]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-12">
        <Badge className="w-fit bg-[#2a241f] text-[#f6efe8] hover:bg-[#2a241f]">
          Moje zadania
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Moje zadania w sprincie</h1>
          <p className="text-sm text-[#6f6255]">
            Tylko zadania przypisane do Ciebie w aktywnym sprincie projektu.
          </p>
        </div>

        {loading ? (
          <Card className="border-[#e2d6c9] bg-white/80 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.45)]">
            <CardContent className="p-6 text-sm text-[#6f6255]">
              Laduje zadania...
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-rose-200 bg-rose-50">
            <CardContent className="p-6 text-sm text-rose-700">{error}</CardContent>
          </Card>
        ) : null}

        {showEmpty ? (
          <Card className="border-[#e2d6c9] bg-white/80 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.45)]">
            <CardContent className="space-y-2 p-6 text-sm text-[#6f6255]">
              <div className="text-base font-semibold text-[#2a241f]">
                Brak przypisanych zadan
              </div>
              <div>
                Gdy dostaniesz zadania w aktywnym sprincie, pojawia sie tutaj lista.
              </div>
            </CardContent>
          </Card>
        ) : null}

        {sprint ? (
          <Card className="border-[#e2d6c9] bg-white/90 shadow-[0_24px_60px_-45px_rgba(60,40,20,0.35)]">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
                  {project?.name || "Projekt"}
                </p>
                <h2 className="text-lg font-semibold text-[#1f1b16]">
                  Sprint {sprint.sprintNumber}: {sprint.name}
                </h2>
                <p className="text-xs text-[#6f6255]">
                  {dateFormatter.format(new Date(sprint.startDate))} -{" "}
                  {dateFormatter.format(new Date(sprint.endDate))}
                </p>
              </div>

              {sprint.tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#eadfd3] bg-[#fcfaf7] px-4 py-3 text-sm text-[#6f6255]">
                  Nie masz zadan w tym sprincie.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {sprint.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-[#eadfd3] bg-[#fdfaf5] p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-[#2a241f]">
                          {task.issueId}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge[task.status] || "bg-[#f8f4ef] text-[#5b5044] border border-[#eadfd3]"}`}
                        >
                          {statusLabels[task.status] || task.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#1f1b16]">
                        {task.title}
                      </div>
                      <div className="mt-2 text-xs text-[#6f6255]">
                        Termin:{" "}
                        {task.deadline
                          ? dateFormatter.format(new Date(task.deadline))
                          : "Brak"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
