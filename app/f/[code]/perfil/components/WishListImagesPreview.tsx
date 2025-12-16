"use client";

import { useMemo } from "react";
import { ImageWithFallback } from "./ImageWithFallback";

export type WishPreviewItem = {
    id: string;
    imageUrl?: string | null;
    price?: number | null;
};

type Mode = "price" | "desired";

interface WishListImagesPreviewProps {
    items: WishPreviewItem[];
    mode?: Mode;
    className?: string;
}

/** mock “más deseado” (determinístico) */
function mockDesiredScore(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return hash % 1000;
}

function normalizeSrc(src?: string | null) {
    const s = (src ?? "").trim();
    return s.length > 0 ? s : null;
}

function GiftPlaceholder() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <span className="opacity-40 text-3xl">🎁</span>
        </div>
    );
}

export function WishListImagesPreview({
    items,
    mode = "price",
    className = "",
}: WishListImagesPreviewProps) {
    const sorted = useMemo(() => {
        const arr = (items ?? []).slice();
        arr.sort((a, b) => {
            if (mode === "desired") {
                return mockDesiredScore(b.id) - mockDesiredScore(a.id);
            }
            return (b.price ?? 0) - (a.price ?? 0);
        });
        return arr;
    }, [items, mode]);

    const count = sorted.length;

    // ✅ IMPORTANTE: si no hay items, NO devolvemos null (mostramos placeholder)
    if (count === 0) {
        return (
            <div
                className={[
                    "w-full aspect-[16/9] overflow-hidden rounded-2xl",
                    "bg-black",
                    className,
                ].join(" ")}
            >
                <GiftPlaceholder />
            </div>
        );
    }

    const big = sorted[0];
    const right1 = sorted[1];
    const right2 = sorted[2];

    return (
        <div
            className={[
                "w-full aspect-[16/9] overflow-hidden rounded-2xl",
                "grid grid-cols-[2fr_1fr] gap-1",
                "bg-black",
                className,
            ].join(" ")}
        >
            {/* IZQUIERDA — imagen grande */}
            <div className="relative h-full">
                <ImageWithFallback
                    src={normalizeSrc(big.imageUrl) ?? undefined}
                    alt="Wishlist preview"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* DERECHA */}
            {count === 1 ? (
                // ✅ 1 deseo: placeholder completo a la derecha
                <div className="h-full">
                    <GiftPlaceholder />
                </div>
            ) : count === 2 ? (
                // ✅ 2 deseos: derecha en 2 filas → (imagen, placeholder) (como el ejemplo)
                <div className="grid grid-rows-2 gap-1 h-full">
                    <div className="relative">
                        {right1 ? (
                            <ImageWithFallback
                                src={normalizeSrc(right1.imageUrl) ?? undefined}
                                alt="Wishlist preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <GiftPlaceholder />
                        )}
                    </div>
                    <div className="relative">
                        <GiftPlaceholder />
                    </div>
                </div>
            ) : (
                // ✅ 3+ deseos: derecha en 2 filas → (imagen, imagen)
                <div className="grid grid-rows-2 gap-1 h-full">
                    <div className="relative">
                        {right1 ? (
                            <ImageWithFallback
                                src={normalizeSrc(right1.imageUrl) ?? undefined}
                                alt="Wishlist preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <GiftPlaceholder />
                        )}
                    </div>

                    <div className="relative">
                        {right2 ? (
                            <ImageWithFallback
                                src={normalizeSrc(right2.imageUrl) ?? undefined}
                                alt="Wishlist preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <GiftPlaceholder />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
