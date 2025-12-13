"use client";

import * as React from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
    fallbackSrc?: string;
};

const DEFAULT_FALLBACK =
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900";

export function ImageWithFallback({
    src,
    fallbackSrc = DEFAULT_FALLBACK,
    alt = "",
    onError,
    ...rest
}: Props) {
    // ✅ Nunca permitir src vacío
    const initial = React.useMemo(() => {
        const s = typeof src === "string" ? src.trim() : "";
        return s.length > 0 ? s : fallbackSrc;
    }, [src, fallbackSrc]);

    const [imgSrc, setImgSrc] = React.useState(initial);

    // ✅ Si igual quedara vacío, no renderizar <img> (evita warning src="")
    if (!imgSrc || imgSrc.trim().length === 0) return null;

    return (
        <img
            {...rest}
            src={imgSrc}
            alt={alt}
            onError={(e) => {
                // fallback una vez
                setImgSrc(fallbackSrc);
                onError?.(e);
            }}
        />
    );
}
