"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, PointerEvent } from "react";
import type { ProjectTask } from "./types";

type PertDiagramProps = {
    tasks: ProjectTask[];
    canManageTasks: boolean;
    projectId: string;
    onTaskUpdate: (task: ProjectTask) => void;
    onReload: () => void;
    loading: boolean;
};

const NODE_WIDTH = 260;
const NODE_HEIGHT = 56;
const LEFT_HANDLE_CENTER = 2;
const RIGHT_HANDLE_CENTER = NODE_WIDTH - 18;

export function PertDiagram({ tasks, canManageTasks, projectId, onTaskUpdate, onReload, loading }: PertDiagramProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [layout, setLayout] = useState<Record<string, { x: number; y: number }>>({});
    const [anchors, setAnchors] = useState<Record<string, { left: number; right: number; centerY: number }>>({});
    const [scale, setScale] = useState(1);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [pointerOffset, setPointerOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [dragLinkFrom, setDragLinkFrom] = useState<string | null>(null);
    const [linkMode, setLinkMode] = useState<"outgoing" | "incoming" | null>(null);
    const [linkPreview, setLinkPreview] = useState<{ fromId: string; toX: number; toY: number } | null>(null);
    const [linkingError, setLinkingError] = useState<string | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<{ from: string; to: string } | null>(null);
    const linkPreviewRef = useRef<{ fromId: string; toX: number; toY: number } | null>(null);
    const layoutRef = useRef<Record<string, { x: number; y: number }>>({});
    const draggingRef = useRef<string | null>(null);

    useEffect(() => {
        setLayout((prev) => {
            const next: Record<string, { x: number; y: number }> = {};
            let index = 0;
            tasks.forEach((task) => {
                if (typeof task.pertX === "number" && typeof task.pertY === "number") {
                    next[task.id] = { x: task.pertX, y: task.pertY };
                    return;
                }
                if (prev[task.id]) {
                    next[task.id] = prev[task.id];
                    return;
                }
                next[task.id] = {
                    x: 80 + index * 280,
                    y: 60,
                };
                index += 1;
            });
            layoutRef.current = next;
            return next;
        });
    }, [tasks]);

    const updateAnchors = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const next: Record<string, { left: number; right: number; centerY: number }> = {};
        Object.entries(nodeRefs.current).forEach(([taskId, node]) => {
            if (!node) return;
            const nodeRect = node.getBoundingClientRect();
            next[taskId] = {
                left: (nodeRect.left - containerRect.left) / scale,
                right: (nodeRect.right - containerRect.left) / scale,
                centerY: (nodeRect.top - containerRect.top + nodeRect.height / 2) / scale,
            };
        });
        setAnchors(next);
    }, [scale, tasks]);

    useLayoutEffect(() => {
        updateAnchors();
    }, [updateAnchors]);

    const getNodeAnchor = useCallback(
        (taskId: string) => anchors[taskId],
        [anchors],
    );

    const pertSize = useMemo(() => {
        const positions = Object.values(layout);
        if (positions.length === 0) {
            return { width: 720, height: 360 };
        }
        const maxX = Math.max(...positions.map((pos) => pos.x)) + NODE_WIDTH + 120;
        const maxY = Math.max(...positions.map((pos) => pos.y)) + NODE_HEIGHT + 120;
        return { width: Math.max(maxX, 720), height: Math.max(maxY, 360) };
    }, [layout]);

    const edges = useMemo(() => {
        return tasks
            .filter((task) => task.dependentTaskId)
            .map((task) => ({ from: task.dependentTaskId as string, to: task.id }));
    }, [tasks]);

    const handlePointerDown = useCallback(
        (taskId: string, event: PointerEvent<HTMLDivElement>) => {
            if (!canManageTasks) return;
            if (event.button !== 0) return;
            if (dragLinkFrom) return;
            const container = containerRef.current;
            if (!container) return;
            const node = nodeRefs.current[taskId];
            if (!node) return;
            const rect = container.getBoundingClientRect();
            const nodeRect = node.getBoundingClientRect();
            setPointerOffset({
                x: (event.clientX - nodeRect.left) / scale,
                y: (event.clientY - nodeRect.top) / scale,
            });
            setDraggingId(taskId);
            draggingRef.current = taskId;
            setSelectedEdge(null);
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        [canManageTasks, dragLinkFrom, scale],
    );

    const handlePointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (dragLinkFrom) {
                const container = containerRef.current;
                if (!container) return;
                const rect = container.getBoundingClientRect();
                const toX = (event.clientX - rect.left) / scale;
                const toY = (event.clientY - rect.top) / scale;
                const preview = { fromId: dragLinkFrom, toX, toY };
                linkPreviewRef.current = preview;
                setLinkPreview(preview);
                return;
            }
            if (!draggingRef.current) return;
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const nextX = (event.clientX - rect.left) / scale - pointerOffset.x;
            const nextY = (event.clientY - rect.top) / scale - pointerOffset.y;
            const id = draggingRef.current;
            setLayout((prev) => {
                const updated = { ...prev, [id]: { x: nextX, y: nextY } };
                layoutRef.current = updated;
                return updated;
            });
        },
        [dragLinkFrom, pointerOffset.x, pointerOffset.y, scale],
    );

    const persistPosition = useCallback(
        async (taskId: string, x: number, y: number) => {
            try {
                const response = await fetch(`/api/project/${projectId}/tasks/position`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ taskId, x, y }),
                });
                const json = await response.json();
                if (!response.ok) {
                    onReload();
                    return;
                }
                const updated = json?.task as ProjectTask | undefined;
                if (updated) {
                    onTaskUpdate(updated);
                }
            } catch {
                onReload();
            }
        },
        [onReload, onTaskUpdate, projectId],
    );

    const handlePointerUp = useCallback(() => {
        if (draggingRef.current) {
            const id = draggingRef.current;
            const position = layoutRef.current[id];
            draggingRef.current = null;
            setDraggingId(null);
            if (position) {
                void persistPosition(id, position.x, position.y);
            }
        }
    }, [persistPosition]);

    useEffect(() => {
        if (!draggingId) return;
        const handler = () => {
            if (draggingRef.current) {
                const id = draggingRef.current;
                const position = layoutRef.current[id];
                draggingRef.current = null;
                setDraggingId(null);
                if (position) {
                    void persistPosition(id, position.x, position.y);
                }
            }
        };
        window.addEventListener("pointerup", handler);
        return () => window.removeEventListener("pointerup", handler);
    }, [draggingId, persistPosition]);

    const updateDependency = useCallback(
        async (taskId: string, dependentTaskId: string | null) => {
            try {
                const response = await fetch(`/api/project/${projectId}/tasks`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ taskId, dependentTaskId }),
                });
                const json = await response.json();
                if (!response.ok) {
                    setLinkingError(json?.message || "Nie udalo sie zapisac relacji.");
                    return;
                }
                const updated = json?.task as ProjectTask | undefined;
                if (updated) {
                    onTaskUpdate(updated);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Nie udalo sie zapisac relacji.";
                setLinkingError(message);
            }
        },
        [onTaskUpdate, projectId],
    );

    const handleLinkStart = useCallback(
        (taskId: string, mode: "outgoing" | "incoming", event: PointerEvent<HTMLButtonElement>) => {
            if (!canManageTasks) return;
            event.stopPropagation();
            setSelectedEdge(null);
            setLinkingError(null);
            setDragLinkFrom(taskId);
            setLinkMode(mode);
        },
        [canManageTasks],
    );

    const handleLinkDrop = useCallback(
        (taskId: string, event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            if (!dragLinkFrom || !linkMode) return;
            if (dragLinkFrom === taskId) {
                setLinkingError("Nie mozna laczyc zadania z samym soba.");
                setDragLinkFrom(null);
                setLinkMode(null);
                setLinkPreview(null);
                return;
            }
            const fromId = linkMode === "outgoing" ? dragLinkFrom : taskId;
            const toId = linkMode === "outgoing" ? taskId : dragLinkFrom;
            const targetTask = tasks.find((task) => task.id === toId);
            if (!targetTask) {
                setLinkingError("Nie znaleziono zadania docelowego.");
                setDragLinkFrom(null);
                setLinkMode(null);
                setLinkPreview(null);
                return;
            }
            if (targetTask.dependentTaskId === fromId) {
                setLinkingError("Ta relacja juz istnieje.");
                setDragLinkFrom(null);
                setLinkMode(null);
                setLinkPreview(null);
                return;
            }
            void updateDependency(toId, fromId);
            setDragLinkFrom(null);
            setLinkMode(null);
            setLinkPreview(null);
        },
        [dragLinkFrom, linkMode, tasks, updateDependency],
    );

    const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
        if (!dragLinkFrom) return;
        event.preventDefault();
    }, [dragLinkFrom]);

    const handleContainerClick = useCallback(() => {
        setSelectedEdge(null);
    }, []);

    const increaseScale = useCallback(() => {
        setScale((prev) => Math.min(1.5, Math.round((prev + 0.1) * 100) / 100));
    }, []);

    const decreaseScale = useCallback(() => {
        setScale((prev) => Math.max(0.7, Math.round((prev - 0.1) * 100) / 100));
    }, []);

    useEffect(() => {
        updateAnchors();
    }, [layout, updateAnchors]);

    useEffect(() => {
        setLinkPreview(linkPreviewRef.current);
    }, [dragLinkFrom]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eadfd3] bg-white px-4 py-3 text-sm text-[#6f6255] shadow-[0_8px_24px_-20px_rgba(20,14,8,0.35)]">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7762]">
                        PERT diagram
                    </span>
                    <span className="text-sm text-[#6f6255]">
                        Przeciagnij wezly, aby ulozyc zadania w diagramie zaleznosci.
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={decreaseScale}
                        className="h-8 w-8 rounded-full border border-[#eadfd3] bg-white text-sm font-semibold text-[#6f6255] transition hover:border-[#2a241f]"
                        aria-label="Pomniejsz diagram"
                    >
                        -
                    </button>
                    <span className="min-w-[48px] text-center text-[11px] font-semibold text-[#6f6255]">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        type="button"
                        onClick={increaseScale}
                        className="h-8 w-8 rounded-full border border-[#eadfd3] bg-white text-sm font-semibold text-[#6f6255] transition hover:border-[#2a241f]"
                        aria-label="Powieksz diagram"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {dragLinkFrom ? (
                    <span className="rounded-full border border-[#d7c8b7] bg-white px-3 py-1 text-sm font-semibold text-[#6f6255]">
                        Wybierz zadanie docelowe {linkMode === "incoming" ? "(z przodu)" : "(z tylu)"}
                    </span>
                ) : null}
                {linkingError ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-800">
                        {linkingError}
                    </span>
                ) : null}
            </div>

            {loading ? (
                <p className="text-sm text-[#6f6255]">Laduje zadania...</p>
            ) : tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#6f6255]">
                    Brak zadan do wyswietlenia na diagramie PERT.
                </div>
            ) : (
                <div className="overflow-auto rounded-2xl border border-[#e6ded0] bg-gradient-to-br from-[#fdfaf5] to-[#f4ede4] shadow-[0_24px_60px_-45px_rgba(40,30,20,0.4)]">
                    <div
                        className="relative"
                        style={{ width: `${pertSize.width * scale}px`, height: `${pertSize.height * scale}px` }}
                    >
                        <div
                            ref={containerRef}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onClick={handleContainerClick}
                            className="relative"
                            style={{
                                width: `${pertSize.width}px`,
                                height: `${pertSize.height}px`,
                                transform: `scale(${scale})`,
                                transformOrigin: "top left",
                                backgroundSize: "32px 32px",
                                backgroundImage:
                                    "radial-gradient(circle, rgba(90,80,70,0.12) 1px, transparent 0)",
                            }}
                        >
                            <svg className="absolute inset-0" width={pertSize.width} height={pertSize.height}>
                                <defs>
                                    <marker
                                        id="arrowhead"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="9"
                                        refY="4"
                                        orient="auto"
                                        markerUnits="strokeWidth"
                                    >
                                        <path d="M0,0 L8,4 L0,8 z" fill="#8a7762" />
                                    </marker>
                                    <marker
                                        id="arrowhead-active"
                                        markerWidth="8"
                                        markerHeight="8"
                                        refX="9"
                                        refY="4"
                                        orient="auto"
                                        markerUnits="strokeWidth"
                                    >
                                        <path d="M0,0 L8,4 L0,8 z" fill="#dc2626" />
                                    </marker>
                                </defs>
                                {edges.map((edge) => {
                                    const from = layout[edge.from];
                                    const to = layout[edge.to];
                                    if (!from || !to) return null;
                                    const fromAnchor = getNodeAnchor(edge.from);
                                    const toAnchor = getNodeAnchor(edge.to);
                                    const startX = fromAnchor?.right ?? from.x + RIGHT_HANDLE_CENTER;
                                    const startY = fromAnchor?.centerY ?? from.y + NODE_HEIGHT / 2;
                                    const endX = toAnchor?.left ?? to.x + LEFT_HANDLE_CENTER;
                                    const endY = toAnchor?.centerY ?? to.y + NODE_HEIGHT / 2;
                                    const midX = (startX + endX) / 2;
                                    const isSelected =
                                        selectedEdge?.from === edge.from && selectedEdge?.to === edge.to;
                                    const path = `M ${startX} ${startY} C ${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`;
                                    return (
                                        <path
                                            key={`${edge.from}-${edge.to}`}
                                            d={path}
                                            fill="none"
                                            stroke={isSelected ? "#dc2626" : "#8a7762"}
                                            strokeWidth={2}
                                            markerEnd={isSelected ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                            className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
                                            onClick={() =>
                                                setSelectedEdge((prev) =>
                                                    prev?.from === edge.from && prev?.to === edge.to ? null : edge,
                                                )
                                            }
                                            style={{ pointerEvents: "stroke" }}
                                        />
                                    );
                                })}
                                {linkPreview && layout[linkPreview.fromId] ? (
                                    (() => {
                                        const from = layout[linkPreview.fromId];
                                        if (!from) return null;
                                        const fromAnchor = getNodeAnchor(linkPreview.fromId);
                                        const startX =
                                            linkMode === "incoming"
                                                ? fromAnchor?.left ?? from.x + LEFT_HANDLE_CENTER
                                                : fromAnchor?.right ?? from.x + RIGHT_HANDLE_CENTER;
                                        const startY = fromAnchor?.centerY ?? from.y + NODE_HEIGHT / 2;
                                        const endX = linkPreview.toX;
                                        const endY = linkPreview.toY;
                                        const midX = (startX + endX) / 2;
                                        const path = `M ${startX} ${startY} C ${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`;
                                        return (
                                            <path
                                                d={path}
                                                fill="none"
                                                stroke="#2a241f"
                                                strokeWidth={2}
                                                strokeDasharray="6 6"
                                                className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
                                            />
                                        );
                                    })()
                                ) : null}
                            </svg>
                            {selectedEdge ? (
                                (() => {
                                    const from = layout[selectedEdge.from];
                                    const to = layout[selectedEdge.to];
                                    if (!from || !to) return null;
                                    const fromAnchor = getNodeAnchor(selectedEdge.from);
                                    const toAnchor = getNodeAnchor(selectedEdge.to);
                                    const startX = fromAnchor?.right ?? from.x + RIGHT_HANDLE_CENTER;
                                    const startY = fromAnchor?.centerY ?? from.y + NODE_HEIGHT / 2;
                                    const endX = toAnchor?.left ?? to.x + LEFT_HANDLE_CENTER;
                                    const endY = toAnchor?.centerY ?? to.y + NODE_HEIGHT / 2;
                                    const midX = (startX + endX) / 2;
                                    const midY = (startY + endY) / 2;
                                    return (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void updateDependency(selectedEdge.to, null);
                                                setSelectedEdge(null);
                                            }}
                                            className="absolute flex h-5 w-5 items-center justify-center rounded-full border border-[#dc2626] bg-white text-[10px] font-semibold text-[#dc2626] shadow-sm"
                                            style={{
                                                left: `${midX - 10}px`,
                                                top: `${midY - 10}px`,
                                            }}
                                            aria-label="Usun polaczenie"
                                        >
                                            <span className="relative -top-[1px] text-[12px] leading-none">X</span>
                                        </button>
                                    );
                                })()
                            ) : null}

                            {tasks.map((task) => {
                                const pos = layout[task.id] ?? { x: 80, y: 60 };
                                const isSelected = dragLinkFrom === task.id;
                                const categoryCode = task.category?.code
                                    ? task.category.code.trim().toUpperCase()
                                    : "TASK";
                                const issueId = `${categoryCode}-${task.taskNumber}`;
                                return (
                                    <div
                                        key={task.id}
                                        data-task-id={task.id}
                                        style={{ left: pos.x, top: pos.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
                                        className={`absolute relative cursor-grab rounded-xl border bg-white px-2 py-1 text-sm shadow-[0_10px_24px_-20px_rgba(20,14,8,0.45)] transition ${
                                            isSelected ? "border-[#2a241f]" : "border-[#eadfd3]"
                                        }`}
                                        ref={(node) => {
                                            nodeRefs.current[task.id] = node;
                                        }}
                                        onPointerDown={(event) => handlePointerDown(task.id, event)}
                                        onDragOver={handleDragOver}
                                        onDrop={(event) => handleLinkDrop(task.id, event)}
                                        draggable={false}
                                    >
                                        <div className="flex h-full items-center justify-center text-center">
                                            <p className="truncate text-[14px] font-semibold text-[#1f1b16]">
                                                {issueId}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            data-link-handle="left"
                                            onPointerDown={(event) => handleLinkStart(task.id, "incoming", event)}
                                            className="absolute -left-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-[#2a241f] bg-white text-[10px] font-semibold text-[#2a241f] shadow-sm"
                                            aria-label="Polacz z przodu"
                                        >
                                            +
                                        </button>
                                        <button
                                            type="button"
                                            data-link-handle="right"
                                            onPointerDown={(event) => handleLinkStart(task.id, "outgoing", event)}
                                            className="absolute -right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-[#2a241f] bg-white text-[10px] font-semibold text-[#2a241f] shadow-sm"
                                            aria-label="Polacz z tylu"
                                        >
                                            +
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
