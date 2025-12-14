"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Heart, ExternalLink, Share2, Link as LinkIcon, Check } from "lucide-react";
import { usePathname } from "next/navigation";
import { ImageWithFallback } from "./ImageWithFallback";
import { AddWishItemModal } from "./AddWishItemModal";

export interface WishItem {
    id: string;
    name: string;
    imageUrl: string;
    price: string;
    url?: string;
    liked: boolean;
    notes?: string;
    priceRaw?: number;
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

    // ✅ Compartir
    const pathname = usePathname();
    const [showShare, setShowShare] = useState(false);
    const [copied, setCopied] = useState(false);

    const publicUrl = useMemo(() => {
        if (typeof window === "undefined") return "";
        return buildPublicWishListUrl(window.location.origin, listId);
    }, [pathname, listId]);

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
            // acá no forzamos error UI global, solo evitamos crash
        }
    }

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Back + Share (arriba) */}
                <div className="flex items-center justify-between mb-6">
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

                    {/* ✅ Botón compartir (design) */}
                    <button
                        type="button"
                        onClick={() => setShowShare((v) => !v)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="hidden sm:inline">Compartir</span>
                    </button>
                </div>

                {/* ✅ Panel compartir (desplegable) */}
                {showShare && (
                    <div className="mb-8 bg-slate-900 border border-slate-700 rounded-xl p-3">
                        <p className="font-semibold mb-2 text-gray-100 flex items-center gap-2 text-sm">
                            <LinkIcon className="w-4 h-4" />
                            Compartir vínculo (vista pública)
                        </p>

                        <p className="break-all text-gray-100 text-xs bg-slate-950 rounded-lg p-2 border border-slate-700">
                            {publicUrl}
                        </p>

                        <div className="mt-3 flex gap-2">
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
                                onClick={() => setShowShare(false)}
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
                )}

                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8 md:mb-12">
                    <div className="w-16 h-16 bg-linear-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white mb-4">
                        <span className="text-2xl">{creatorInitial}</span>
                    </div>

                    <div className="mb-4">
                        <p className="text-white">{creatorName || "Usuario"}</p>
                        {creatorUsername ? <p className="text-gray-400 text-sm">{creatorUsername}</p> : null}
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
                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                                    <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                                        <ExternalLink className="w-6 h-6 text-white rotate-45" />
                                    </div>
                                </div>

                                <div className="text-center min-h-12 flex items-center justify-center">
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
                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-white">
                                    <ImageWithFallback
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    {item.url ? (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                                            <ExternalLink className="w-3 h-3 text-white" />
                                        </div>
                                    ) : null}
                                </div>

                                <div className="text-center">
                                    <h3 className="text-white text-sm mb-1 line-clamp-2">{item.name}</h3>
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
