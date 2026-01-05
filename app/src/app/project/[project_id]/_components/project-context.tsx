"use client";

import { createContext, useContext } from "react";
import type { ProjectInfo } from "./types";

const ProjectContext = createContext<ProjectInfo | null>(null);

export function ProjectProvider({
  project,
  children,
}: {
  project: ProjectInfo;
  children: React.ReactNode;
}) {
  return <ProjectContext.Provider value={project}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  const project = useContext(ProjectContext);
  if (!project) {
    throw new Error("ProjectContext is missing.");
  }
  return project;
}
