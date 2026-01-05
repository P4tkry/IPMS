"use client";

import { useI18n } from "@/i18n/useI18n";

type BoardColumn = {
  title: string;
  count: number;
  items: { title: string; tag: string }[];
};

export default function ProjectBoardPreview() {
  const { t } = useI18n();
  const boardColumns: BoardColumn[] = [
    {
      title: t("project.view.board.columns.todo.title"),
      count: 12,
      items: [
        { title: t("project.view.board.columns.todo.items.onboarding"), tag: "CORE-112" },
        { title: t("project.view.board.columns.todo.items.risk"), tag: "CORE-118" },
        { title: t("project.view.board.columns.todo.items.requirements"), tag: "CORE-121" },
      ],
    },
    {
      title: t("project.view.board.columns.inProgress.title"),
      count: 7,
      items: [
        { title: t("project.view.board.columns.inProgress.items.backlog"), tag: "UI-204" },
        { title: t("project.view.board.columns.inProgress.items.done"), tag: "PM-031" },
        { title: t("project.view.board.columns.inProgress.items.api"), tag: "API-090" },
      ],
    },
    {
      title: t("project.view.board.columns.review.title"),
      count: 4,
      items: [
        { title: t("project.view.board.columns.review.items.e2e"), tag: "QA-077" },
        { title: t("project.view.board.columns.review.items.oauth"), tag: "AUTH-015" },
      ],
    },
  ];

  return (
    <div className="rounded-3xl border border-[#e1d7cb] bg-white/80 p-5 shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
            {t("project.view.board.label")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#1f1b16]">
            {t("project.view.board.title")}
          </h2>
        </div>
        <span className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-xs text-[#6f6255]">
          {t("project.view.board.sprint")}
        </span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {boardColumns.map((column) => (
          <div key={column.title} className="rounded-2xl border border-[#eadfd3] bg-[#f9f5f0] p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7762]">
              <span>{column.title}</span>
              <span className="rounded-full bg-[#1f1b16] px-2 py-0.5 text-[10px] text-[#f6efe8]">
                {column.count}
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {column.items.map((item) => (
                <div
                  key={item.tag}
                  className="rounded-2xl border border-[#e5d9cc] bg-white px-3 py-3 text-sm shadow-[0_12px_30px_-25px_rgba(40,30,20,0.35)]"
                >
                  <p className="text-sm font-semibold text-[#1f1b16]">{item.title}</p>
                  <p className="mt-1 text-xs text-[#8a7762]">{item.tag}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
