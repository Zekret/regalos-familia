"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Heart } from "lucide-react";

interface FamilyMember {
    id: string;
    name: string;
    created_at?: string;
    // Más adelante puedes rellenar esto desde el backend si agregas un count
    wishListsCount?: number;
}

interface FamilyListProps {
    familyCode: string;        // código de la familia (ej: "DAY198")
    currentMemberId?: string;  // opcional, para marcar quién eres tú
}

export function FamilyList({ familyCode, currentMemberId }: FamilyListProps) {
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

                // Tu endpoint ya devuelve: { familyCode, members: [...] }
                const members: FamilyMember[] = (data?.members ?? []).map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    created_at: m.created_at,
                    // De momento 0, luego lo puedes alimentar con un agregate en Supabase
                    wishListsCount: m.wishListsCount ?? 0,
                }));

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

    return (
        <div className="p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-white">Lista de familiares</h2>

                            {loading ? (
                                <p className="text-gray-400 mt-1 text-sm">
                                    Cargando miembros...
                                </p>
                            ) : error ? (
                                <p className="text-red-400 mt-1 text-sm">
                                    Error al cargar familiares
                                </p>
                            ) : (
                                <p className="text-gray-400 mt-1 text-sm">
                                    {familyMembers.length} miembro
                                    {familyMembers.length === 1 ? "" : "s"} registrado
                                    {familyMembers.length === 1 ? "" : "s"}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
                        type="button"
                        onClick={() => {
                            // Aquí luego puedes abrir tu modal/form de "Agregar familiar"
                            console.log("Abrir modal para agregar familiar");
                        }}
                    >
                        <Plus className="w-5 h-5" />
                        Agregar familiar
                    </button>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {familyMembers.map((member) => {
                            const wishCount = member.wishListsCount ?? 0;

                            return (
                                <div
                                    key={member.id}
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
                                                {wishCount === 1
                                                    ? "lista de deseos"
                                                    : "listas de deseos"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Loading simple (si quieres mantener algo abajo también) */}
                {loading && (
                    <p className="text-gray-400 text-sm">
                        Cargando integrantes de tu familia...
                    </p>
                )}
            </div>
        </div>
    );
}
