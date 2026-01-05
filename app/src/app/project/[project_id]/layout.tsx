import ProjectLayoutView from "./_components/project-layout-view";

export default async function ProjectLayout({
  params,
  children,
}: {
  params: Promise<{ project_id: string }>;
  children: React.ReactNode;
}) {
  const { project_id } = await params;
  return <ProjectLayoutView projectId={project_id}>{children}</ProjectLayoutView>;
}
