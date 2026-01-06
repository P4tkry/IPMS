"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    SwaggerUIBundle: {
      (options: { url: string; domNode: HTMLElement | null; presets: unknown[] }): unknown;
      presets: { apis: unknown };
    };
  }
}

export default function DocsPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css";
    document.head.appendChild(style);

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.async = true;
    script.onload = () => {
      try {
        window.SwaggerUIBundle({
          url: "/api/docs",
          domNode: containerRef.current,
          presets: [window.SwaggerUIBundle.presets.apis],
        });
      } catch (err) {
        setError("Failed to initialize Swagger UI.");
      }
    };
    script.onerror = () => setError("Failed to load Swagger UI assets.");
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(style);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f6efe8] p-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-[#e1d7cb] bg-white/80 p-4 shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)] backdrop-blur">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">Swagger</p>
          <h1 className="text-2xl font-semibold text-[#1f1b16]">API documentation</h1>
          <p className="text-sm text-[#6f6255]">Spec auto-generated from route handlers.</p>
        </div>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        <div ref={containerRef} />
      </div>
    </div>
  );
}
