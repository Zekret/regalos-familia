// app/f/[code]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, User } from "lucide-react";
import { JoinFamilyForm } from "./components/JoinFamilyForm";

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
                    </div>

                    {/* Acciones */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-white text-lg mb-2">Unirme a la familia</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Crea tu perfil para comenzar tu lista de deseos.
                            </p>

                            <JoinFamilyForm familyCode={familyCode} />
                        </div>

                        <div className="pt-4 border-t border-slate-700">
                            <button
                                onClick={() => router.push(`/f/${familyCode}/perfil`)}
                                className="w-full bg-emerald-500 text-white rounded-xl py-3.5 hover:bg-emerald-600 transition"
                            >
                                Ya tengo un usuario
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
