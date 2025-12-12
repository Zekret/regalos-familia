"use client";

import { useEffect, useState } from "react";
import { Heart, Plus } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";

interface WishBoard {
    id: string;
    title: string;
    itemsCount: number;
    imageUrl: string;
    liked: boolean;
}

interface ApiList {
    id: string;
    title: string;
    created_at: string;
    itemsCount?: number;
}

interface WishListProps {
    memberId: string;
}

const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1590156221187-1710315f710b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1739132268718-53d64165d29a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1635796436337-50481b9fa2ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1702374114954-9029a74a8add?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
];

export function WishList({ memberId }: WishListProps) {
    const [wishBoards, setWishBoards] = useState<WishBoard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!memberId) return;

        let cancelled = false;

        const fetchLists = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`/api/members/${memberId}/lists`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                const data = await res.json().catch(() => null);

                if (!res.ok) {
                    throw new Error(data?.message || "No se pudieron cargar las listas.");
                }

                const lists: ApiList[] = data?.lists ?? [];

                const mapped: WishBoard[] = lists.map((list, index) => ({
                    id: list.id,
                    title: list.title,
                    itemsCount: list.itemsCount ?? 0,
                    imageUrl: FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
                    liked: true, // luego lo puedes mapear a un campo real
                }));

                if (!cancelled) {
                    setWishBoards(mapped);
                }
            } catch (err: any) {
                console.error("[WishList] error:", err);
                if (!cancelled) {
                    setError(err.message || "Ocurrió un error al cargar las listas.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchLists();

        return () => {
            cancelled = true;
        };
    }, [memberId]);

    return (
        <div className="p-4 pb-24 md:p-8 md:pb-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                            <Heart className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-white">Lista de deseos</h2>
                            {loading ? (
                                <p className="text-gray-400 mt-1 text-sm">
                                    Cargando listas...
                                </p>
                            ) : (
                                <p className="text-gray-400 mt-1 text-sm">
                                    {wishBoards.length} lista
                                    {wishBoards.length === 1 ? "" : "s"} creada
                                    {wishBoards.length === 1 ? "" : "s"}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors w-full sm:w-auto text-sm"
                        type="button"
                        onClick={() => {
                            // Aquí luego conectas tu modal / formulario para crear lista (POST /api/members/{memberId}/lists)
                            console.log("Crear lista");
                        }}
                    >
                        <Plus className="w-5 h-5" />
                        Crear lista
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-950/40 border border-red-700 text-red-200 text-sm px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {!loading && !error && wishBoards.length === 0 && (
                    <p className="text-gray-400 text-sm">
                        Todavía no tienes listas creadas. Crea tu primera lista de deseos ✨
                    </p>
                )}

                {/* Wish Boards Grid */}
                {!loading && !error && wishBoards.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6">
                        {wishBoards.map((board) => (
                            <div key={board.id} className="group cursor-pointer">
                                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 bg-gray-900">
                                    <ImageWithFallback
                                        src={board.imageUrl}
                                        alt={board.title}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                </div>

                                <div className="flex items-center gap-2 text-gray-400">
                                    <Heart
                                        className={`w-4 h-4 ${board.liked ? "fill-pink-500 text-pink-500" : ""
                                            }`}
                                    />
                                    <span className="text-sm">
                                        {board.itemsCount} Deseos
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
