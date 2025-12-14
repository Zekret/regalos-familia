// app/f/[code]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, User } from "lucide-react";

type FamilyMember = {
    id: string;
    name: string;
    wishListsCount?: number;
    avatar?: string;
};

type Family = {
    id: string;
    name: string;
    code: string;
};

function buildFamilyTitle(name?: string) {
    if (!name) return "Espacio familiar";

    const trimmed = name.trim();
    const lower = trimmed.toLowerCase();

    // 1) Si ya empieza con familia
    if (lower.startsWith("familia ")) {
        return trimmed;
    }

    const wordCount = trimmed.split(" ").length;

    // 2) Si tiene más de 2 palabras → probablemente NO es apellido
    if (wordCount > 2) {
        return trimmed;
    }

    // 3) Si tiene 2 palabras, pero incluye números (ej. “Grupo 2025”) → mostrar igual
    if (/\d/.test(trimmed)) {
        return trimmed;
    }

    // 4) Caso normal: agregar “Familia”
    return `Familia ${trimmed}`;
}

export default function FamiliaPage() {
    const pathname = usePathname();
    const router = useRouter();
    const segments = pathname.split("/").filter(Boolean);
    const familyCode = segments[1];

    const [family, setFamily] = useState<Family | null>(null);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    const [notFound, setNotFound] = useState(false);
    const [loadingFamily, setLoadingFamily] = useState(true);

    // Cargar datos de la familia (nombre, etc.)
    useEffect(() => {
        const loadFamily = async () => {
            try {
                const res = await fetch(`/api/families/${familyCode}`);

                if (res.status === 404) {
                    // familia no existe
                    setNotFound(true);
                    setFamily(null);
                    setLoadingFamily(false);
                    return;
                }

                if (!res.ok) {
                    throw new Error("Error al obtener la familia");
                }

                const data = await res.json();
                setFamily(data);
            } catch (err) {
                console.error("Error loading family:", err);
                // si quieres tratar cualquier error como “no encontrada”:
                setNotFound(true);
            } finally {
                setLoadingFamily(false);
            }
        };

        loadFamily();
    }, [familyCode]);

    // Cargar miembros de la familia (solo si la familia existe)
    useEffect(() => {
        const loadMembers = async () => {
            try {
                const res = await fetch(`/api/families/${familyCode}/members`);
                const data = await res.json();
                setFamilyMembers(data.members || []);
            } catch (e) {
                console.error("Error loading members:", e);
            } finally {
                setLoadingMembers(false);
            }
        };

        if (!notFound) {
            loadMembers();
        }
    }, [familyCode, notFound]);

    const membersCount = familyMembers.length;
    const membersLabel =
        membersCount === 0
            ? "Sin miembros todavía"
            : membersCount === 1
                ? "1 miembro"
                : `${membersCount} miembros`;

    // 🧱 Vista cuando la familia NO existe (404 "friendly")
    if (notFound && !loadingFamily) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-3xl font-bold text-white mb-3">
                    Familia no encontrada
                </h1>
                <p className="text-sm text-gray-400 mb-6 max-w-md">
                    El código{" "}
                    <span className="font-mono text-emerald-400">{familyCode}</span>{" "}
                    no corresponde a ningún espacio familiar creado o ya no está
                    disponible.
                </p>
                <button
                    onClick={() => router.push("/familia/ingresar")}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition"
                >
                    Volver a ingresar código
                </button>
            </div>
        );
    }

    // Estado cargando familia
    if (loadingFamily) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-sm text-gray-400">Cargando espacio familiar...</p>
            </div>
        );
    }

    // Modal normal cuando la familia existe
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Close */}
                <button
                    onClick={() => router.push("/")}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors z-10"
                >
                    <X className="w-5 h-5 text-gray-300" />
                </button>

                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-white text-2xl sm:text-3xl mb-2">
                            {family ? buildFamilyTitle(family.name) : "Espacio familiar"}
                        </h2>

                        <p className="text-emerald-400 mb-1">
                            Código familiar: {familyCode}
                        </p>

                        <p className="text-gray-400 text-sm mb-1">{membersLabel}</p>
                    </div>

                    {/* Miembros */}
                    <div className="mb-6">
                        <h3 className="text-white mb-3">Miembros de la familia</h3>

                        {loadingMembers ? (
                            <p className="text-sm text-gray-300">Cargando...</p>
                        ) : familyMembers.length === 0 ? (
                            <p className="text-sm text-gray-400">Todavía no hay usuarios</p>
                        ) : (
                            <div className="max-h-64 overflow-y-auto pr-1 space-y-2">
                                {familyMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        className="bg-slate-900 rounded-xl p-3 flex items-center gap-3"
                                    >
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                                            {member.avatar ? (
                                                <img
                                                    src={member.avatar}
                                                    alt={member.name}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white truncate">{member.name}</p>
                                            <p className="text-gray-400 text-sm">
                                                {member.wishListsCount ?? 0} deseos
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Acciones */}
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push(`/f/${familyCode}/nuevo-miembro`)}
                            className="w-full bg-white text-slate-900 rounded-xl py-3.5 hover:bg-gray-100 transition-colors"
                        >
                            Crear usuario
                        </button>

                        <button
                            onClick={() => router.push(`/f/${familyCode}/perfil`)}
                            className="w-full bg-emerald-500 text-white rounded-xl py-3.5 hover:bg-emerald-600 transition-colors"
                        >
                            Ya tengo un usuario
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
