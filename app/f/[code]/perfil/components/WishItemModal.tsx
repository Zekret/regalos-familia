"use client";

import { X, ExternalLink, Trash2, Edit2 } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { WishItem } from "./WishListDetail";

interface Props {
    item: WishItem & { notes?: string; priceRaw?: number };
    onClose: () => void;
    onEdit: (item: WishItem & { notes?: string; priceRaw?: number }) => void;
    onDelete: (item: WishItem & { notes?: string; priceRaw?: number }) => void;
}

export function WishItemModal({ item, onClose, onEdit, onDelete }: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70" />

            <div
                className="relative w-full max-w-lg bg-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <h3 className="text-white font-semibold line-clamp-1">{item.name}</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    <ImageWithFallback
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-52 object-cover rounded-xl mb-4 bg-white"
                    />

                    <div className="mb-4">
                        <p className="text-gray-400 text-xs mb-1">Precio</p>
                        <p className="text-white text-2xl font-semibold">{item.price}</p>
                    </div>

                    {item.notes ? (
                        <div className="mb-4">
                            <p className="text-gray-400 text-xs mb-2">Descripción</p>
                            <p className="text-white text-sm whitespace-pre-line">{item.notes}</p>
                        </div>
                    ) : null}

                    {item.url ? (
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors mb-5"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Ver producto
                        </a>
                    ) : (
                        <div className="text-center text-sm text-gray-500 mb-5">
                            Este deseo no tiene enlace asociado.
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition"
                        >
                            <Edit2 className="w-4 h-4" />
                            Editar
                        </button>

                        <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-900/40 hover:bg-red-900/70 text-red-200 rounded-xl transition"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
