"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { FloatingShareButton } from "./FloatingShareButton";

interface FamilyMember {
    id: string;
    name: string;
    created_at?: string;
    wishListsCount?: number;
}

interface FamilyListProps {
    familyCode: string; // ej: "DAY198"
    currentMemberId?: string;
}

export function FamilyList({ familyCode, currentMemberId }: FamilyListProps) {
    const router = useRouter();

    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!familyCode) return;

        const controller = new AbortController();

        const fetchMembers = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`/api/families/${familyCode}/members`, {
                    method: "GET",
                    signal: controller.signal,
                });

                const data = await res.json().catch(() => null);

                if (!res.ok) {
                    throw new Error(data?.message || "No se pudieron cargar los miembros.");
                }

                // ✅ Normaliza el ID (por si viene como member_id / user_id, etc.)
                const members: FamilyMember[] = (data?.members ?? [])
                    .map((m: any) => {
                        const id = (m?.id ?? m?.member_id ?? m?.user_id ?? "")
                            .toString()
                            .trim();
                        const name = (m?.name ?? "").toString().trim();

                        if (!id || !name) return null;

                        return {
                            id,
                            name,
                            created_at: m.created_at,
                            wishListsCount: m.wishListsCount ?? 0,
                        };
                    })
                    .filter(Boolean) as FamilyMember[];

                setFamilyMembers(members);
            } catch (err: any) {
                if (err.name === "AbortError") return;
                console.error("[FamilyList] error:", err);
                setError(err.message || "Ocurrió un error al cargar los familiares.");
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();

        return () => controller.abort();
    }, [familyCode]);

    // ✅ SSR-safe
    const shareUrl = useMemo(() => {
        if (typeof window === "undefined") return "";
        return `${window.location.origin}/f/${familyCode}`;
    }, [familyCode]);

    const totalMembers = familyMembers.length;

    function goToMemberWishlists(memberId?: string) {
        const id = (memberId ?? "").toString().trim();
        if (!id) {
            console.warn("[FamilyList] memberId vacío. No se navega.");
            return;
        }
        router.push(`/f/${familyCode}/perfil/${id}?section=wishes`);
    }

    return (
        <div className="p-4 pb-24 md:p-8 md:pb-8">
            <FloatingShareButton url={shareUrl} subtitle="Compartir URL Familia" />

            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8 mt-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-white">Lista de familiares</h2>

                            {loading ? (
                                <p className="text-gray-400 mt-1 text-sm">Cargando miembros...</p>
                            ) : error ? (
                                <p className="text-red-400 mt-1 text-sm">
                                    Error al cargar familiares
                                </p>
                            ) : (
                                <p className="text-gray-400 mt-1 text-sm">
                                    {totalMembers} miembro{totalMembers === 1 ? "" : "s"} registrado
                                    {totalMembers === 1 ? "" : "s"}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mensaje de error */}
                {error && (
                    <div className="mb-4 bg-red-950/40 border border-red-700 text-red-200 text-sm px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Estado vacío */}
                {!loading && !error && familyMembers.length === 0 && (
                    <p className="text-gray-400 text-sm">
                        Aún no hay familiares registrados en esta familia.
                    </p>
                )}

                {/* Family Members Grid */}
                {!loading && !error && familyMembers.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {familyMembers.map((member) => {
                            const wishCount = member.wishListsCount ?? 0;

                            return (
                                <div
                                    key={member.id}
                                    onClick={() => goToMemberWishlists(member.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ")
                                            goToMemberWishlists(member.id);
                                    }}
                                    className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-all cursor-pointer"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white mb-4">
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>

                                        <h3 className="text-white mb-1 flex items-center gap-1">
                                            {member.name}
                                            {currentMemberId === member.id && (
                                                <span className="text-xs text-emerald-300">(tú)</span>
                                            )}
                                        </h3>

                                        <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
                                            <Heart className="w-4 h-4" />
                                            <span>
                                                {wishCount}{" "}
                                                {wishCount === 1 ? "lista de deseos" : "listas de deseos"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Loading simple */}
                {loading && (
                    <p className="text-gray-400 text-sm">
                        Cargando integrantes de tu familia...
                    </p>
                )}
            </div>
        </div>
    );
}
