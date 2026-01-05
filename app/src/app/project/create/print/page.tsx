"use client";

import { useEffect } from "react";
import ProjectCreatePrintForm from "../_components/print-form";

export default function ProjectCreatePrintPage() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      window.print();
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  return <ProjectCreatePrintForm className="min-h-screen" />;
}
