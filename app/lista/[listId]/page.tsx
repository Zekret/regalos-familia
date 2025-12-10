"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type GiftItemStatus = "available" | "claimed";

type GiftItem = {
    id: string;
    name: string;
    notes?: string;
    url?: string;
    status: GiftItemStatus;
};

type GetItemsResponse = {
    items: GiftItem[];
};

export default function ListaPublicaPage() {
    const pathname = usePathname();
    // /lista/list_123  -> ["lista", "list_123"]
    const segments = pathname.split("/").filter(Boolean);
    const listId = segments[1] || "";

    const [items, setItems] = useState<GiftItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (!listId) {
            setIsLoading(false);
            return;
        }

        const fetchItems = async () => {
            try {
                setLoadError(null);
                setIsLoading(true);

                const res = await fetch(`/api/lists/${listId}/items`, {
                    method: "GET",
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(
                        data?.message || "No se pudieron cargar los regalos."
                    );
                }

                const data: GetItemsResponse = await res.json();
                setItems(data.items || []);
            } catch (err: any) {
                setLoadError(err.message || "Error al cargar la lista.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, [listId]);

    return (
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-xl font-bold text-center">Lista de deseos 🎁</h1>
                <p className="text-xs text-center text-slate-500">
                    Vista solo lectura — no puedes editar esta lista.
                </p>
            </header>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700">
                    Regalos de esta lista
                </h2>

                {isLoading ? (
                    <p className="text-sm text-slate-500">Cargando regalos...</p>
                ) : loadError ? (
                    <p className="text-sm text-red-600">{loadError}</p>
                ) : items.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        Esta lista todavía no tiene regalos.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                className="border border-slate-200 rounded-xl p-3 space-y-1"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-slate-800">
                                        {item.name}
                                    </span>
                                    <span
                                        className={`text-[11px] px-2 py-1 rounded-full ${item.status === "available"
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                : "bg-amber-50 text-amber-700 border border-amber-100"
                                            }`}
                                    >
                                        {item.status === "available"
                                            ? "Disponible"
                                            : "Alguien se encarga 🎁"}
                                    </span>
                                </div>

                                {item.notes && (
                                    <p className="text-xs text-slate-600">{item.notes}</p>
                                )}

                                {item.url && (
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-blue-600 underline"
                                    >
                                        Ver enlace
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
