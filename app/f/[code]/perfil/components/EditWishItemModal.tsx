"use client";

import { useEffect, useMemo, useState } from "react";
import { X, ImagePlus, Trash2 } from "lucide-react";
import { WishItem } from "./WishListDetail";

export type EditWishItemPayload = {
    name: string;
    notes?: string;
    url?: string;
    price: number | string;

    // ✅ NUEVO: para editar imagen
    imageFile?: File | null;     // si el usuario sube una nueva
    removeImage?: boolean;       // si el usuario decide quitar la imagen actual
};

interface Props {
    isOpen: boolean;
    item: WishItem & { notes?: string; priceRaw?: number; imageUrl?: string | null };
    onClose: () => void;
    onSubmit: (payload: EditWishItemPayload) => Promise<void>;
}

function isImageFile(file: File) {
    return file.type.startsWith("image/");
}

export function EditWishItemModal({ isOpen, item, onClose, onSubmit }: Props) {
    const [name, setName] = useState(item.name);
    const [notes, setNotes] = useState(item.notes ?? "");
    const [url, setUrl] = useState(item.url ?? "");
    const [price, setPrice] = useState(String(item.priceRaw ?? "").trim());

    // ✅ NUEVO: imagen
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(item.imageUrl ?? null);
    const [removeImage, setRemoveImage] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        setName(item.name);
        setNotes(item.notes ?? "");
        setUrl(item.url ?? "");
        setPrice(String(item.priceRaw ?? "").trim());

        setImageFile(null);
        setPreviewUrl(item.imageUrl ?? null);
        setRemoveImage(false);

        setError(null);
        setLoading(false);
    }, [isOpen, item.id, item.imageUrl]); // ✅ agrega item.imageUrl

    // ✅ Liberar objectURL
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const canSubmit = useMemo(() => {
        return name.trim().length > 0 && price.trim().length > 0 && !loading;
    }, [name, price, loading]);

    if (!isOpen) return null;

    function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;

        if (!isImageFile(file)) {
            setError("El archivo debe ser una imagen.");
            return;
        }

        // si había blob preview, revocarlo
        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }

        setError(null);
        setRemoveImage(false); // si sube una nueva, ya no está removida
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }

    function handleRemoveImage() {
        // revocar blob anterior si aplica
        if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);

        setImageFile(null);
        setPreviewUrl(null);
        setRemoveImage(true); // ✅ indica "volver a default" en backend
    }

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

                // ✅ NUEVO
                imageFile,
                removeImage,
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
                        {/* ✅ NUEVO: editor imagen */}
                        <div className="space-y-2">
                            <p className="text-sm text-slate-300">Imagen</p>

                            <div className="flex gap-3 items-start">
                                <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/10 bg-slate-900/60 flex items-center justify-center">
                                    {previewUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl opacity-40">🎁</span>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col gap-2">
                                    <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white hover:border-blue-500/60 cursor-pointer">
                                        <ImagePlus className="w-5 h-5" />
                                        <span className="text-sm font-medium">Cambiar imagen</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePickImage}
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white hover:border-red-500/60 disabled:opacity-50"
                                        disabled={!previewUrl && !item.imageUrl}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        <span className="text-sm font-medium">Quitar imagen</span>
                                    </button>

                                    <p className="text-xs text-slate-400">
                                        JPG/PNG recomendado. Si quitas la imagen, se usará la imagen por defecto.
                                    </p>
                                </div>
                            </div>
                        </div>

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
