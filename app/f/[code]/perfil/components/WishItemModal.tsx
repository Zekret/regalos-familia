"use client";

import { useEffect, useRef, useState } from "react";
import {
    X,
    ExternalLink,
    Trash2,
    Edit2,
    Sparkles,
    MoreHorizontal,
} from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { WishItem } from "./WishListDetail";

interface Props {
    isOpen: boolean;
    item: WishItem & { notes?: string; priceRaw?: number };
    onClose: () => void;

    canManage?: boolean;
    onEdit?: (item: WishItem & { notes?: string; priceRaw?: number }) => void;
    onDelete?: (item: WishItem & { notes?: string; priceRaw?: number }) => void;
}

export function WishItemModal({
    isOpen,
    item,
    onClose,
    canManage = false,
    onEdit,
    onDelete,
}: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        document.body.classList.add("modal-open");
        return () => document.body.classList.remove("modal-open");
    }, [isOpen]);

    // cerrar menú al hacer click fuera o con Escape
    useEffect(() => {
        if (!menuOpen) return;

        const onDown = (e: MouseEvent) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };

        window.addEventListener("mousedown", onDown);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("mousedown", onDown);
            window.removeEventListener("keydown", onKey);
        };
    }, [menuOpen]);

    if (!isOpen) return null;

    const handleEdit = () => {
        setMenuOpen(false);
        onEdit?.(item);
    };

    const handleDelete = () => {
        setMenuOpen(false);
        onDelete?.(item);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => {
                setMenuOpen(false);
                onClose();
            }}
        >
            <div className="absolute inset-0 bg-black/70" />

            <div
                className="relative w-full max-w-5xl bg-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* LEFT (imagen) */}
                    <div className="relative bg-black">
                        <div className="w-full h-85 sm:h-105 flex items-center justify-center bg-black">
                            <ImageWithFallback
                                src={item.imageUrl ? item.imageUrl : undefined}
                                alt={item.name}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>

                        {/* ✅ Acciones MOBILE (top-right sobre imagen): menú + cerrar */}
                        <div className="lg:hidden absolute top-3 right-3 flex items-center gap-2">
                            {canManage ? (
                                <div className="relative" ref={menuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setMenuOpen((v) => !v)}
                                        className="p-2 rounded-full bg-black border-white/70 hover:bg-white/15 text-slate-200 border transition"
                                        aria-label="Más opciones"
                                        title="Más opciones"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>

                                    {menuOpen ? (
                                        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur shadow-2xl overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={handleEdit}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-100 hover:bg-white/10 transition"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span className="font-medium">Editar deseo</span>
                                            </button>

                                            <div className="h-px bg-white/10" />

                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-300 hover:bg-red-900/30 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="font-medium">Eliminar</span>
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-full bg-black border-white/70 hover:bg-white/15 text-slate-200 border transition"
                                aria-label="Cerrar"
                                title="Cerrar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT (contenido) */}
                    <div className="relative p-6 lg:p-8">
                        {/* ✅ Acciones DESKTOP (top-right del panel derecho): menú + cerrar */}
                        <div className="hidden lg:flex absolute top-4 right-4 items-center gap-2">
                            {canManage ? (
                                <div className="relative" ref={menuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setMenuOpen((v) => !v)}
                                        className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition"
                                        aria-label="Más opciones"
                                        title="Más opciones"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>

                                    {menuOpen ? (
                                        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur shadow-2xl overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={handleEdit}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-100 hover:bg-white/10 transition"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span className="font-medium">Editar deseo</span>
                                            </button>

                                            <div className="h-px bg-white/10" />

                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-300 hover:bg-red-900/30 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="font-medium">Eliminar</span>
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition"
                                aria-label="Cerrar"
                                title="Cerrar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Badge */}
                        <div className="flex items-center gap-2 text-emerald-400 mt-1">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">Más deseados</span>
                        </div>

                        {/* ✅ Título más pequeño en mobile */}
                        <h3 className="mt-3 text-white font-semibold leading-tight line-clamp-2 text-xl sm:text-3xl">
                            {item.name}
                        </h3>

                        {/* Precio */}
                        <div className="mt-3">
                            <p className="text-white text-lg sm:text-3xl font-semibold">{item.price}</p>
                        </div>

                        {/* ✅ Descripción con menos peso visual */}
                        {item.notes ? (
                            <div className="mt-4">
                                <p className="inline-block px-4 py-3 rounded-xl bg-white/10 text-slate-200 text-sm font-normal whitespace-pre-line line-clamp-3">
                                    {item.notes}
                                </p>
                            </div>
                        ) : null}

                        {/* Botón único */}
                        <div className="mt-6">
                            {item.url ? (
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-blue-900 text-white hover:bg-blue-800 transition-colors font-semibold"
                                >
                                    Ver producto
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            ) : (
                                <div className="text-sm text-slate-400">
                                    Este deseo no tiene enlace asociado.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
