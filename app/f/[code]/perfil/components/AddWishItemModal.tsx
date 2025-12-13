"use client";

import { useMemo, useState } from "react";
import { X, Link2, ArrowRight, ArrowLeft, Wand2 } from "lucide-react";

export type AddWishItemPayload = {
    name: string;
    notes: string;
    url: string;
    price: number;
    imageUrl?: string | null; // preview (no se guarda en DB si no tienes columna)
};

type PreviewResponse = {
    title: string | null;
    image: string | null;
    price: number | null;
    currency: string | null;
    url: string;
};

export function AddWishItemModal(props: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: AddWishItemPayload) => Promise<void> | void;
}) {
    const { isOpen, onClose, onSubmit } = props;

    const [step, setStep] = useState<1 | 2>(1);

    // Step 1
    const [rawUrl, setRawUrl] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // Step 2
    const [name, setName] = useState("");
    const [notes, setNotes] = useState("");
    const [url, setUrl] = useState("");
    const [price, setPrice] = useState<string>("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    function resetAll() {
        setStep(1);
        setRawUrl("");
        setPreviewLoading(false);
        setPreviewError(null);

        setName("");
        setNotes("");
        setUrl("");
        setPrice("");
        setImageUrl(null);

        setSaving(false);
        setSaveError(null);
    }

    function safeClose() {
        if (saving || previewLoading) return;
        resetAll();
        onClose();
    }

    const canSave = useMemo(() => {
        if (!name.trim()) return false;
        const numeric = Number(
            String(price).replace(/[^\d.,]/g, "").replace(/,/g, ".")
        );
        return Number.isFinite(numeric) && numeric >= 0 && !saving;
    }, [name, price, saving]);

    async function handleAnalyze() {
        const u = rawUrl.trim();
        if (!u) {
            setPreviewError("Pega una URL para analizar.");
            return;
        }

        setPreviewLoading(true);
        setPreviewError(null);

        try {
            const res = await fetch(`/api/preview?url=${encodeURIComponent(u)}`);
            const data = (await res.json().catch(() => null)) as PreviewResponse | null;

            if (!res.ok) throw new Error((data as any)?.message || "No se pudo analizar la URL.");

            const clean = data?.url ?? u;
            setUrl(clean);

            if (data?.title) setName(data.title);
            if (data?.price != null) setPrice(String(data.price));
            if (data?.image) setImageUrl(data.image);

            setStep(2);
        } catch (e: any) {
            setPreviewError(e?.message || "No se pudo analizar la URL.");
        } finally {
            setPreviewLoading(false);
        }
    }

    function goManual() {
        const u = rawUrl.trim();
        if (u) setUrl(u);
        setStep(2);
    }

    async function handleSave() {
        if (!canSave) return;

        setSaving(true);
        setSaveError(null);

        try {
            const numericPrice = Number(
                String(price).replace(/[^\d.,]/g, "").replace(/,/g, ".")
            );
            if (!Number.isFinite(numericPrice)) throw new Error("Precio inválido.");

            await onSubmit({
                name: name.trim(),
                notes: notes.trim(),
                url: url.trim(),
                price: numericPrice,
                imageUrl,
            });

            safeClose();
        } catch (e: any) {
            setSaveError(e?.message || "No se pudo guardar el deseo.");
        } finally {
            setSaving(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Cerrar modal"
                onClick={safeClose}
                className="absolute inset-0 bg-black/70"
            />

            <div
                role="dialog"
                aria-modal="true"
                className="relative w-full max-w-lg bg-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div>
                        <h3 className="text-white font-semibold">Agregar deseo</h3>
                        <p className="text-xs text-slate-400 mt-1">Paso {step} de 2</p>
                    </div>

                    <button
                        type="button"
                        onClick={safeClose}
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-300"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-300">
                                Pega una URL y trataremos de traer <span className="text-white">título</span>,{" "}
                                <span className="text-white">imagen</span> y <span className="text-white">precio</span>.
                            </p>

                            {previewError && (
                                <div className="bg-red-950/40 border border-red-700 text-red-200 text-sm px-3 py-2 rounded-lg">
                                    {previewError}
                                </div>
                            )}

                            <div className="relative">
                                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    value={rawUrl}
                                    onChange={(e) => setRawUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full pl-9 rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white outline-none focus:border-blue-500/60"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    type="button"
                                    onClick={handleAnalyze}
                                    disabled={previewLoading}
                                    className="w-full sm:w-auto flex-1 rounded-xl bg-blue-600 py-3 text-white font-semibold disabled:opacity-50 hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                >
                                    <Wand2 className="w-4 h-4" />
                                    {previewLoading ? "Analizando..." : "Analizar URL"}
                                </button>

                                <button
                                    type="button"
                                    onClick={goManual}
                                    disabled={previewLoading}
                                    className="w-full sm:w-auto flex-1 rounded-xl bg-white/5 py-3 text-white font-semibold hover:bg-white/10 transition flex items-center justify-center gap-2"
                                >
                                    Crear manual
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-xs text-slate-500">
                                Si una web bloquea previews, igual puedes crear el deseo manualmente.
                            </p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            {saveError && (
                                <div className="bg-red-950/40 border border-red-700 text-red-200 text-sm px-3 py-2 rounded-lg">
                                    {saveError}
                                </div>
                            )}

                            {imageUrl ? (
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex gap-3">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/30">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white text-sm line-clamp-2">{name || "Sin título"}</p>
                                        <p className="text-slate-400 text-xs mt-1 line-clamp-1">{url || "(sin url)"}</p>
                                    </div>
                                </div>
                            ) : null}

                            <div>
                                <label className="text-xs text-slate-400">Título</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Audífonos Sony"
                                    className="mt-2 w-full rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white outline-none focus:border-blue-500/60"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Descripción</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Notas (talla, color, etc.)"
                                    rows={4}
                                    className="mt-2 w-full resize-none rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white outline-none focus:border-blue-500/60"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">URL</label>
                                <input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="mt-2 w-full rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white outline-none focus:border-blue-500/60"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Precio</label>
                                <input
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="12990"
                                    inputMode="numeric"
                                    className="mt-2 w-full rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white outline-none focus:border-blue-500/60"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-white/10 bg-slate-950 flex gap-2">
                    {step === 2 ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                disabled={saving}
                                className="w-full rounded-xl bg-white/5 py-3 text-white font-semibold hover:bg-white/10 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!canSave}
                                className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
                            >
                                {saving ? "Guardando..." : "Agregar deseo"}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={safeClose}
                            disabled={previewLoading}
                            className="w-full rounded-xl bg-white/5 py-3 text-white font-semibold hover:bg-white/10 transition disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
