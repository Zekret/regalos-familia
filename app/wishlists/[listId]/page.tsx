// app/wishlists/[listId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WishListDetail } from "@/app/f/[code]/perfil/components/WishListDetail";

type Session = {
    familyCode: string;
    member: { id: string; name: string };
    token: string;
};

type WishListMeta = {
    id: string;
    title: string;
    description: string;
    creatorName: string;
    creatorUsername: string;
    member_id: string;
    family_code: string;
};

type WishItemUI = {
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
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(value);
}

function safeNumber(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") return Number(value.replace(/[^\d]/g, "")) || 0;
    return 0;
}

export default function PublicWishListPage() {
    const router = useRouter();
    const pathname = usePathname();

    // /wishlists/{listId}
    const segments = pathname.split("/").filter(Boolean);
    const listId = segments[1] || "";

    const [meta, setMeta] = useState<WishListMeta | null>(null);
    const [items, setItems] = useState<WishItemUI[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!listId) return;

        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setError(null);

                const [metaRes, itemsRes] = await Promise.all([
                    fetch(`/api/lists/${listId}`),
                    fetch(`/api/lists/${listId}/items`),
                ]);

                const metaData = await metaRes.json().catch(() => null);
                const itemsData = await itemsRes.json().catch(() => null);

                if (!metaRes.ok) throw new Error(metaData?.message || "No se pudo cargar la lista.");
                if (!itemsRes.ok) throw new Error(itemsData?.message || "No se pudieron cargar los deseos.");

                // ✅ si está logeado y es dueño -> redirigir a vista interna con sidebar
                try {
                    const raw = localStorage.getItem("gf_session");
                    if (raw) {
                        const s = JSON.parse(raw) as Session;
                        if (s.member.id === metaData.member_id && s.familyCode === metaData.family_code) {
                            router.replace(`/f/${s.familyCode}/perfil/${s.member.id}/wishlists/${listId}`);
                            return;
                        }
                    }
                } catch {
                    // ignore
                }

                if (cancelled) return;

                setMeta(metaData as WishListMeta);

                const mapped: WishItemUI[] = (itemsData?.items ?? []).map((it: any) => {
                    const raw = safeNumber(it.price);
                    return {
                        id: it.id,
                        name: it.name,
                        url: it.url ?? undefined,
                        liked: true,
                        imageUrl: PLACEHOLDER_IMG,
                        notes: it.notes ?? "",
                        priceRaw: raw,
                        price: formatCLP(raw),
                    };
                });

                setItems(mapped);
            } catch (e: any) {
                if (!cancelled) setError(e?.message || "Error al cargar.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [listId, router]);

    if (!listId) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <p className="text-sm text-red-300">listId inválido.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-sm text-gray-400">Cargando...</p>
            </div>
        );
    }

    if (error || !meta) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="bg-red-950/40 border border-red-700 text-red-200 text-sm px-4 py-3 rounded-xl">
                    {error ?? "No se pudo cargar."}
                </div>
            </div>
        );
    }

    return (
        <WishListDetail
            listId={listId}
            title={meta.title}
            description={meta.description}
            creatorName={meta.creatorName}
            creatorUsername={meta.creatorUsername}
            items={items}
            // ✅ público:
            showBack={false}
            canAddItem={false}
            // CTA
            loginCta={{
                label: "Ingresar",
                onClick: () => router.push(`/f/${meta.family_code}`),
            }}
            // click item: si quieres en público abrir url o modal info, lo hacemos después
            onItemClick={(item) => {
                if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
            }}
        />
    );
}
