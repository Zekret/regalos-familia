"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { WishItem } from "./WishListDetail";

export type EditWishItemPayload = {
    name: string;
    notes?: string;
    url?: string;
    price: number | string;
};

interface Props {
    isOpen: boolean;
    item: WishItem & { notes?: string; priceRaw?: number };
    onClose: () => void;
    onSubmit: (payload: EditWishItemPayload) => Promise<void>;
}

export function EditWishItemModal({ isOpen, item, onClose, onSubmit }: Props) {
    const [name, setName] = useState(item.name);
    const [notes, setNotes] = useState(item.notes ?? "");
    const [url, setUrl] = useState(item.url ?? "");
    const [price, setPrice] = useState(String(item.priceRaw ?? "").trim());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = useMemo(() => {
        return name.trim().length > 0 && price.trim().length > 0 && !loading;
    }, [name, price, loading]);

    if (!isOpen) return null;

    async function handleSubmit() {
        if (!canSubmit) return;

        setLoading(true);
        setError(null);

        try {
            await onSubmit({
                name: name.trim(),
                notes: notes.trim(),
                url: url.trim(),
                price: price.trim(),
            });
            onClose();
        } catch (e: any) {
            setError(e?.message || "No se pudo guardar.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* overlay */}
            <button
                type="button"
                aria-label="Cerrar modal"
                className="absolute inset-0 bg-black/70"
                onClick={onClose}
            />

            <div
                role="dialog"
                aria-modal="true"
                className="relative w-full max-w-lg bg-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <h3 className="text-white font-semibold">Editar deseo</h3>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-300"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* body */}
                <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="mb-3 bg-red-950/40 border border-red-700 text-red-200 text-sm px-3 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <input
                            placeholder="Título"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white outline-none focus:border-blue-500/60"
                        />

                        <textarea
                            placeholder="Descripción"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="w-full resize-none rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white outline-none focus:border-blue-500/60"
                        />

                        <input
                            placeholder="URL (opcional)"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white outline-none focus:border-blue-500/60"
                        />

                        <input
                            placeholder="Precio (CLP)"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            inputMode="numeric"
                            className="w-full rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white outline-none focus:border-blue-500/60"
                        />
                    </div>
                </div>

                {/* footer */}
                <div className="px-5 py-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
                    >
                        {loading ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}
