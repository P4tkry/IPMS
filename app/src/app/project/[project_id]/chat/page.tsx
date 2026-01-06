"use client";

import { use } from "react";
import ProjectChatView from "./_components/project-chat-view";

export default function ProjectChatPage({
  params,
}: {
  params: Promise<{ project_id: string }>;
}) {
  use(params);
  return (
    <div className="relative px-6 text-[#2a241f]">
      <div className="mx-auto w-full max-w-6xl py-10">
        <ProjectChatView />
      </div>
    </div>
  );
}
