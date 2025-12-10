"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type GiftItemStatus = "available" | "claimed";

type GiftItem = {
    id: string;
    name: string;
    notes?: string;
    url?: string;
    status: GiftItemStatus;
    price?: number;
};

type GetItemsResponse = {
    items: GiftItem[];
};

type CreateItemResponse = {
    item: GiftItem;
};

export default function ListaPage() {
    const pathname = usePathname();

    // /f/RDQ850/lista/list_123  -> ["f","RDQ850","lista","list_123"]
    const segments = pathname.split("/").filter(Boolean);
    const code = segments[1] || "(sin código)";
    const listId = segments[3] || "";

    const [items, setItems] = useState<GiftItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Formulario nuevo regalo
    const [name, setName] = useState("");
    const [notes, setNotes] = useState("");
    const [url, setUrl] = useState("");
    const [price, setPrice] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar items (MOCK)
    useEffect(() => {
        // si por alguna razón no hay listId, no intentamos hacer fetch
        if (!listId) {
            setItems([]);
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

    const handleAddItem = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!name.trim()) {
            setFormError("Escribe el nombre del regalo.");
            return;
        }

        if (!listId) {
            setFormError("No se encontró el identificador de la lista.");
            return;
        }

        if (!price.trim()) {
            setFormError("Ingresa el precio del regalo.");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/lists/${listId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    notes: notes.trim() || undefined,
                    url: url.trim() || undefined,
                    price: Number(price),
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || "No se pudo agregar el regalo.");
            }

            const data: CreateItemResponse = await res.json();
            setItems((prev) => [...prev, data.item]);

            // reset form
            setName("");
            setNotes("");
            setUrl("");
        } catch (err: any) {
            setFormError(err.message || "Error al agregar el regalo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClaim = (id: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        status: item.status === "available" ? "claimed" : "available",
                    }
                    : item
            )
        );
        // Más adelante aquí llamas a la API para guardar el "me encargo yo"
    };

    const [shareUrl, setShareUrl] = useState<string>("");

    useEffect(() => {
        if (typeof window !== "undefined" && listId) {
            setShareUrl(`${window.location.origin}/lista/${listId}`);
        }
    }, [listId]);

    return (
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-xl font-bold text-center">Mi lista de deseos 🎁</h1>
                <p className="text-xs text-center text-slate-500">
                    Código de la familia:{" "}
                    <span className="font-mono font-semibold">{code}</span>
                </p>
            </header>

            {/* Sección para compartir la lista */}
            <section className="space-y-2">
                <h2 className="text-sm font-semibold text-slate-700">
                    Compartir mi lista
                </h2>
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 border border-slate-200">
                    <p className="mb-1">
                        Puedes enviar este enlace a tu familia. Solo podrán <b>ver</b> la lista,
                        no editarla.
                    </p>
                    <p className="break-all bg-white rounded-lg border border-slate-200 px-2 py-1">
                        {shareUrl || "Generando enlace..."}
                    </p>
                </div>
            </section>

            {/* Formulario para agregar regalo */}
            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700">
                    Agregar un regalo
                </h2>

                <form onSubmit={handleAddItem} className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">
                            Nombre del regalo
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: Polera azul talla M"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">
                            Precio (obligatorio)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: 19990"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">
                            Notas (opcional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Detalles como color, talla, dónde lo viste, etc."
                            rows={2}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">
                            Enlace (opcional)
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Pega el link del producto si lo tienes"
                        />
                    </div>

                    {formError && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {formError}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Agregando..." : "Agregar regalo"}
                    </button>
                </form>
            </section>

            {/* Lista de regalos */}
            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700">Mis regalos</h2>

                {isLoading ? (
                    <p className="text-sm text-slate-500">Cargando regalos...</p>
                ) : loadError ? (
                    <p className="text-sm text-red-600">{loadError}</p>
                ) : items.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        Aún no tienes regalos en tu lista. Empieza agregando uno arriba.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                className="border border-slate-200 rounded-xl p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="space-y-1">
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
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleClaim(item.id)}
                                    className={`mt-1 sm:mt-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${item.status === "available"
                                        ? "border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    {item.status === "available"
                                        ? "Me encargo yo"
                                        : "Liberar regalo"}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <Link
                href={`/f/${code}`}
                className="block text-center text-sm text-blue-600 hover:underline"
            >
                ← Volver a la familia
            </Link>
        </div>
    );
}
