"use client";

import { useMemo } from "react";
import { ImageWithFallback } from "./ImageWithFallback";

export type WishPreviewItem = {
    id: string;
    imageUrl?: string | null;
    isMostWanted?: boolean;
    priceValue?: number;
};

interface Props {
    items: WishPreviewItem[];
    itemsCount: number;
}

function GiftPlaceholder() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <span className="text-3xl opacity-40">🎁</span>
        </div>
    );
}

function normalizeSrc(src?: string | null) {
    const s = (src ?? "").trim();
    return s.length > 0 ? s : null;
}

function num(v: unknown) {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
}

export function WishListImagesPreview({ items, itemsCount }: Props) {
    // 1) isMostWanted true
    // 2) mayor priceValue
    const ordered = useMemo(() => {
        return [...items].sort((a, b) => {
            const aw = a.isMostWanted ? 1 : 0;
            const bw = b.isMostWanted ? 1 : 0;
            if (bw !== aw) return bw - aw;

            const ap = num(a.priceValue);
            const bp = num(b.priceValue);
            return bp - ap;
        });
    }, [items]);

    const img = (i: number) => normalizeSrc(ordered[i]?.imageUrl);

    const hasItems = itemsCount > 0;

    const renderImgOrPlaceholder = (src: string | null) => {
        if (!src) return <GiftPlaceholder />;
        return (
            <ImageWithFallback
                src={src}
                alt="Wishlist preview"
                className="w-full h-full object-cover"
            />
        );
    };

    const renderImages = () => {
        if (!hasItems) {
            return <GiftPlaceholder />;
        }

        if (itemsCount === 1) {
            return renderImgOrPlaceholder(img(0));
        }

        if (itemsCount === 2) {
            return (
                <div className="h-full w-full flex flex-row">
                    <div className="h-full w-1/2 border-r-2 border-black">
                        {renderImgOrPlaceholder(img(0))}
                    </div>
                    <div className="h-full w-1/2">
                        {renderImgOrPlaceholder(img(1))}
                    </div>
                </div>
            );
        }

        // itemsCount >= 3
        return (
            <div className="h-full w-full flex flex-row">
                <div className="h-full w-3/5 border-r-2 border-black">
                    {renderImgOrPlaceholder(img(0))}
                </div>

                <div className="flex flex-col w-2/5 h-full">
                    <div className="h-1/2 w-full border-b-2 border-black">
                        {renderImgOrPlaceholder(img(1))}
                    </div>
                    <div className="h-1/2 w-full">
                        {renderImgOrPlaceholder(img(2))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full aspect-14/10 overflow-hidden rounded-2xl gap-1 bg-black">
            {renderImages()}
        </div>
    );
}
