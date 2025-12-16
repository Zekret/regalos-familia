"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Save } from "lucide-react";

export type EditWishListPayload = {
    title: string;
    description: string;
};

export function EditWishListModal(props: {
    isOpen: boolean;
    onClose: () => void;
    initialTitle: string;
    initialDescription: string;
    onSubmit: (payload: EditWishListPayload) => Promise<void> | void;
}) {
    const { isOpen, onClose, initialTitle, initialDescription, onSubmit } = props;

    const [title, setTitle] = useState(initialTitle ?? "");
    const [description, setDescription] = useState(initialDescription ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ reset cuando se abre
    useEffect(() => {
        if (!isOpen) return;
        setTitle(initialTitle ?? "");
        setDescription(initialDescription ?? "");
        setError(null);
    }, [isOpen, initialTitle, initialDescription]);

    // ✅ bloquear scroll
    useEffect(() => {
        if (!isOpen) return;
        document.body.classList.add("modal-open");
        return () => document.body.classList.remove("modal-open");
    }, [isOpen]);

    const canSave = useMemo(() => {
        return title.trim().length > 0;
    }, [title]);

    async function handleSubmit() {
        if (!canSave || saving) return;

        try {
            setSaving(true);
            setError(null);

            await onSubmit({
                title: title.trim(),
                description: description.trim(),
            });

            onClose();
        } catch (e: any) {
            setError(e?.message ?? "No se pudo actualizar la lista.");
        } finally {
            setSaving(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className="absolute inset-0 bg-black/60"
            />

            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5"
            >
                <div className="flex items-center justify-between mb-4">
                    <p className="text-white font-semibold">Editar lista</p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-200" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-300">Nombre</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nombre de la lista"
                            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-slate-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-300">Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Opcional"
                            rows={4}
                            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-slate-500 resize-none"
                        />
                    </div>

                    {error ? (
                        <p className="text-xs text-red-400">{error}</p>
                    ) : null}

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-800 text-gray-100 rounded-xl py-2.5 hover:bg-slate-700 transition-colors border border-slate-700"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSave || saving}
                            className="flex-1 bg-white text-slate-900 rounded-xl py-2.5 hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
