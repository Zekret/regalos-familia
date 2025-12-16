"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Heart, ExternalLink, Share2, Link as LinkIcon, Check, Star, CircleStar } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { AddWishItemModal } from "./AddWishItemModal";

export interface WishItem {
    id: string;
    name: string;
    imageUrl: string;
    price: string;
    url?: string;
    notes?: string;
    priceRaw?: number;
    isMostWanted: boolean;
}

export interface WishListDetailProps {
    listId: string;
    title: string;
    description: string;
    creatorName: string;
    creatorUsername: string;
    items: WishItem[];

    onBack?: () => void;
    showBack?: boolean;

    // dueño
    canAddItem?: boolean;
    onCreateItem?: (formData: FormData) => Promise<void>;

    // click item (para modal)
    onItemClick?: (item: WishItem) => void;
}

function buildPublicWishListUrl(origin: string, listId: string) {
    return `${origin}/wishlists/${listId}`;
}

export function WishListDetail({
    listId,
    title,
    description,
    creatorName,
    creatorUsername,
    items,
    onBack,
    showBack = true,
    canAddItem = true,
    onCreateItem,
    onItemClick,
}: WishListDetailProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const creatorInitial = (creatorName?.trim()?.charAt(0) || "U").toUpperCase();
    const hasDescription = Boolean(description?.trim());

    // ✅ Compartir (FAB + panel)
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const publicUrl = useMemo(() => {
        if (typeof window === "undefined") return "";
        return buildPublicWishListUrl(window.location.origin, listId);
    }, [listId]);

    async function handleSharePublicUrl() {
        if (!publicUrl) return;

        try {
            if (typeof navigator !== "undefined" && (navigator as any).share) {
                await (navigator as any).share({
                    title,
                    text: `Mira mi lista: ${title}`,
                    url: publicUrl,
                });
                return;
            }

            if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(publicUrl);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = publicUrl;
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }

            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            // silencioso: evitamos crash
        }
    }

    return (
        <div className="p-4 md:p-8">
            {/* ✅ FAB Compartir (top-right, siempre visible) */}
            <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="fixed top-6 right-6 md:top-8 md:right-8 flex items-center gap-3 px-5 py-3
                   bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700
                   transition-all hover:scale-105 z-50"
            >
                <Share2 className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Compartir</span>
            </button>

            {/* ✅ Panel compartir */}
            {isShareOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
                    <button
                        type="button"
                        aria-label="Cerrar"
                        onClick={() => setIsShareOpen(false)}
                        className="absolute inset-0 bg-black/60"
                    />

                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative mt-16 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4"
                    >
                        <p className="text-white font-semibold flex items-center gap-2 mb-2">
                            <LinkIcon className="w-4 h-4" />
                            Compartir vínculo
                        </p>

                        <p className="break-all text-xs text-gray-100 bg-slate-950 rounded-lg p-2 border border-slate-700">
                            {publicUrl}
                        </p>

                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                onClick={handleSharePublicUrl}
                                className="flex-1 bg-white text-slate-900 rounded-xl py-2.5 hover:bg-gray-100 transition-colors"
                            >
                                {typeof navigator !== "undefined" && (navigator as any).share
                                    ? "Compartir"
                                    : "Copiar enlace"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsShareOpen(false)}
                                className="px-4 bg-slate-800 text-gray-100 rounded-xl py-2.5 hover:bg-slate-700 transition-colors border border-slate-700"
                            >
                                Cerrar
                            </button>
                        </div>

                        {copied && (
                            <p className="mt-2 text-emerald-400 text-xs flex items-center gap-2">
                                <Check className="w-4 h-4" /> Enlace copiado ✅
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                {/* Back */}
                <div className="flex items-center justify-between mb-6 mt-4">
                    {showBack && onBack ? (
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Volver</span>
                        </button>
                    ) : (
                        <div />
                    )}
                </div>

                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8 md:mb-12">
                    <div className="w-16 h-16 bg-linear-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white mb-4">
                        <span className="text-2xl">{creatorInitial}</span>
                    </div>

                    <div className="mb-4">
                        <p className="text-white">{creatorName || "Usuario"}</p>
                        {creatorUsername ? (
                            <p className="text-gray-400 text-sm">{creatorUsername}</p>
                        ) : null}
                    </div>

                    <h1 className="text-white mb-3 text-3xl md:text-4xl">{title}</h1>

                    {hasDescription ? (
                        <p className="text-gray-400 max-w-2xl mb-6">{description}</p>
                    ) : (
                        <div className="mb-6" />
                    )}

                    <div className="flex items-center gap-2 text-gray-400">
                        <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                        <span>{items.length} Deseos</span>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex justify-center">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6 w-full max-w-6xl">
                        {/* Add item solo dueño */}
                        {canAddItem && onCreateItem ? (
                            <button
                                type="button"
                                onClick={() => setIsAddOpen(true)}
                                className="group cursor-pointer text-left flex flex-col"
                            >
                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-2 bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                                    <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                                        <ExternalLink className="w-6 h-6 text-white rotate-45" />
                                    </div>
                                </div>

                                <div className="min-h-12 ml-2">
                                    <p className="text-gray-400 text-sm">Agregar deseo</p>
                                </div>

                                <div className="text-center min-h-[1.25rem]">
                                    <span className="text-transparent text-sm">precio</span>
                                </div>
                            </button>
                        ) : null}

                        {/* items */}
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="group cursor-pointer"
                                onClick={() => onItemClick?.(item)}
                            >
                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-2 bg-white">
                                    <ImageWithFallback
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    {item.url ? (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                                            <ExternalLink size={14} className=" text-white" />
                                        </div>
                                    ) : null}
                                    {item.isMostWanted && (
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm">
                                            <Star
                                                size={14}
                                                fill="#34d399"
                                                stroke="#022c22"
                                                strokeWidth={1.5}
                                            />
                                            <span className="text-[10px] font-medium text-gray-200 leading-none">
                                                Más deseado
                                            </span>
                                        </div>
                                    )}


                                </div>

                                <div className="ml-1">
                                    <div className="flex flex-row gap-1">
                                        <h3 className="text-white text-sm mb-1 line-clamp-2">
                                            {item.name}
                                        </h3>
                                    </div>
                                    <p className="text-gray-400 text-sm">{item.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {items.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm mt-8">
                        Aún no hay deseos en esta lista.
                    </p>
                ) : null}
            </div>

            {/* Modal add */}
            {canAddItem && onCreateItem ? (
                <AddWishItemModal
                    isOpen={isAddOpen}
                    onClose={() => setIsAddOpen(false)}
                    onSubmit={onCreateItem}
                />
            ) : null}
        </div>
    );
}
