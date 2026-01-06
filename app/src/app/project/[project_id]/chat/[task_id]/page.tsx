"use client";

import { use } from "react";
import ProjectChatView from "../_components/project-chat-view";

export default function ProjectChatTaskPage({
  params,
}: {
  params: Promise<{ project_id: string; task_id: string }>;
}) {
  const { task_id: taskId } = use(params);
  return (
    <div className="relative px-6 text-[#2a241f]">
      <div className="mx-auto w-full max-w-6xl py-10">
        <ProjectChatView selectedTaskId={taskId} />
      </div>
    </div>
  );
}
