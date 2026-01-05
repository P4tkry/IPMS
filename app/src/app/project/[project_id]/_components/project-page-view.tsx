"use client";

import { useProjectContext } from "./project-context";
import ProjectActivityPanel from "./project-activity-panel";
import ProjectHeader from "./project-header";
import ProjectOverview from "./project-overview";

export default function ProjectPageView() {
  const project = useProjectContext();

  return (
    <div className="flex flex-col gap-6">
      <ProjectHeader project={project} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <ProjectOverview project={project} />
        <ProjectActivityPanel />
      </div>
    </div>
  );
}
