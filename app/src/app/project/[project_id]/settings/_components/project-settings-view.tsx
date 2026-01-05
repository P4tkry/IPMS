"use client";

import { useI18n } from "@/i18n/useI18n";
import { useProjectContext } from "../../_components/project-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProjectLogo from "@/components/project-logo";

export default function ProjectSettingsView() {
  const { t } = useI18n();
  const project = useProjectContext();

  return (
    <div className="flex flex-col gap-6">
      <Badge className="w-fit bg-[#2a241f] text-[#f6efe8] hover:bg-[#2a241f]">
        {t("project.view.settings.badge")}
      </Badge>
      <div>
        <h1 className="text-3xl font-semibold">{t("project.view.settings.title")}</h1>
        <p className="mt-2 text-sm text-[#6f6255]">
          {t("project.view.settings.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-[#e2d6c9] bg-white/80 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.45)] backdrop-blur">
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center gap-4">
              <ProjectLogo name={project.name || ""} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8d7b68]">
                  {t("project.view.settings.projectLabel")}
                </p>
                <p className="text-xl font-semibold text-[#2a241f]">
                  {project.name || t("project.view.header.untitled")}
                </p>
                <p className="mt-1 text-xs text-[#6f6255]">
                  {t("project.view.settings.projectId")} {project.id}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                {t("project.view.settings.nameLabel")}
              </label>
              <input
                value={project.name || ""}
                disabled
                className="w-full rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm text-[#2a241f] shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                {t("project.view.settings.descriptionLabel")}
              </label>
              <textarea
                rows={5}
                value={project.description || ""}
                disabled
                className="w-full resize-none rounded-xl border border-[#d7c8b7] bg-white px-3 py-2 text-sm text-[#2a241f] shadow-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="h-11 rounded-2xl bg-[#2a241f] px-5 text-sm text-[#f6efe8] hover:bg-[#3a332c]"
                disabled
              >
                {t("common.saveChanges")}
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-2xl border border-[#d7c8b7] bg-white text-sm text-[#2a241f]"
                disabled
              >
                {t("project.view.settings.archive")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-[#e2d6c9] bg-white/80 shadow-[0_24px_60px_-45px_rgba(60,40,20,0.4)] backdrop-blur">
            <CardContent className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                {t("project.view.settings.members.title")}
              </p>
              <p className="text-sm text-[#5c4f45]">
                {t("project.view.settings.members.subtitle")}
              </p>
              <div className="rounded-2xl border border-[#eadfd3] bg-[#f9f5f0] px-4 py-3 text-xs text-[#6f6255]">
                {t("project.view.settings.members.comingSoon")}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e2d6c9] bg-white/80 shadow-[0_24px_60px_-45px_rgba(60,40,20,0.4)] backdrop-blur">
            <CardContent className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7b68]">
                {t("project.view.settings.integrations.title")}
              </p>
              <p className="text-sm text-[#5c4f45]">
                {t("project.view.settings.integrations.subtitle")}
              </p>
              <div className="rounded-2xl border border-[#eadfd3] bg-[#f9f5f0] px-4 py-3 text-xs text-[#6f6255]">
                {t("project.view.settings.integrations.comingSoon")}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
