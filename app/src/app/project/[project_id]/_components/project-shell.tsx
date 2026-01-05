import type { ReactNode } from "react";

type ProjectShellProps = {
  children: ReactNode;
};

export default function ProjectShell({ children }: ProjectShellProps) {
  return (
    <div className="min-h-screen text-[#1f1b16]">{children}</div>
  );
}
