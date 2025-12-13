"use client";

import { useEffect, useState } from "react";

export type WishListMeta = {
    id: string;
    title: string;
    description: string;
    creatorName: string;
    creatorUsername: string;
    member_id: string;
    family_code: string;
};

export type WishItemUI = {
    id: string;
    name: string;
    imageUrl: string;
    price: string;
    url?: string;
    liked: boolean;
    notes?: string;
    priceRaw?: number;
};

const PLACEHOLDER_IMG =
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900";

function formatCLP(value: number) {
    try {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
        }).format(value);
    } catch {
        return `$${Math.round(value)}`;
    }
}

function safeNumber(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") return Number(value.replace(/[^\d]/g, "")) || 0;
    return 0;
}

export function useWishListData(listId: string) {
    const [meta, setMeta] = useState<WishListMeta | null>(null);
    const [items, setItems] = useState<WishItemUI[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function reload() {
        const [metaRes, itemsRes] = await Promise.all([
            fetch(`/api/lists/${listId}`),
            fetch(`/api/lists/${listId}/items`),
        ]);

        const metaData = await metaRes.json().catch(() => null);
        const itemsData = await itemsRes.json().catch(() => null);

        if (!metaRes.ok) throw new Error(metaData?.message || "No se pudo cargar la lista.");
        if (!itemsRes.ok) throw new Error(itemsData?.message || "No se pudieron cargar los deseos.");

        setMeta(metaData as WishListMeta);

        const mapped: WishItemUI[] = (itemsData?.items ?? []).map((it: any) => {
            const raw = safeNumber(it.price);
            const img = typeof it.imageUrl === "string" ? it.imageUrl.trim() : "";

            return {
                id: it.id,
                name: it.name,
                url: it.url ?? undefined,
                liked: true,
                // ✅ jamás guardar ""
                imageUrl: img.length > 0 ? img : PLACEHOLDER_IMG,
                notes: it.notes ?? "",
                priceRaw: raw,
                price: formatCLP(raw),
            };
        });

        setItems(mapped);
    }

    useEffect(() => {
        if (!listId) return;

        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setError(null);
                await reload();
            } catch (e: any) {
                if (!cancelled) setError(e?.message || "Error al cargar.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listId]);

    return { meta, items, setItems, loading, error, reload };
}
