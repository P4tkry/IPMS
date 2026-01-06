"use client";

type AiTarget = "description" | "criteria";

type BacklogAiModalProps = {
    open: boolean;
    target: AiTarget;
    prompt: string;
    error: string | null;
    loading: boolean;
    onClose: () => void;
    onPromptChange: (value: string) => void;
    onSubmit: () => void;
};

export function BacklogAiModal({
    open,
    target,
    prompt,
    error,
    loading,
    onClose,
    onPromptChange,
    onSubmit,
}: BacklogAiModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex h-screen w-screen items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg space-y-4 rounded-2xl border border-[#eadfd3] bg-white p-5 shadow-[0_24px_60px_-35px_rgba(30,20,10,0.6)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7762]">
                        {target === "criteria" ? "AI kryteria akceptacji" : "AI opis zadania"}
                    </p>
                    <h4 className="text-lg font-semibold text-[#1f1b16]">
                        {target === "criteria" ? "Utworz kryteria akceptacji" : "Utworz opis zadania"}
                    </h4>
                </div>
                <textarea
                    value={prompt}
                    onChange={(event) => onPromptChange(event.target.value)}
                    rows={4}
                    placeholder={
                        target === "criteria"
                            ? "Opisz, co ma zawierac kryteria akceptacji..."
                            : "Opisz, co ma zawierac opis zadania..."
                    }
                    className="w-full resize-none rounded-xl border border-[#d7c8b7] bg-[#fcfaf7] px-3 py-2 text-sm text-[#2a241f] outline-none transition focus:border-[#2a241f] focus:ring-2 focus:ring-[#2a241f]/10"
                />
                {error ? <p className="text-xs text-rose-700">{error}</p> : null}
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-[#eadfd3] bg-white px-3 py-1 text-xs font-semibold text-[#6f6255] transition hover:border-[#2a241f]"
                    >
                        Anuluj
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={loading}
                        className="rounded-full bg-[#2a241f] px-3 py-1 text-xs font-semibold text-[#f6efe8] shadow-sm transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:bg-[#c3b5a5]"
                    >
                        {loading ? "Generuje..." : "Generuj"}
                    </button>
                </div>
            </div>
        </div>
    );
}
